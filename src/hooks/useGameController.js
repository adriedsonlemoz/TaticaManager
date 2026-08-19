import React from 'react';
import usePersistence from './hooks_persistence.js';
import useMatchSimulation from './hooks_simulation.js';
import useSquad from './hooks_squad.js';
import useRoundMaintenance from './useRoundMaintenance.js';
import { applyContractRenewalState } from '../engines/market/contractTransactions.js';
import { calculateRenewalCost } from '../engines/cpu/cpuContracts.js';
import { toggleStarterState } from '../engines/lineup/lineupService.js';
import { getUpcomingRound } from '../engines/core/playerStatus.js';
import {
  applyQuickPlayerSale,
  formatMoneyBR,
  resolveSaveName,
  updatePlayerShirtState,
  updatePlayerWageState,
} from '../engines/app/gameControllerService.js';

export const DEFAULT_SETUP_DATA = Object.freeze({
  saveName:'', teamId:null, existingTeamId:null, teamName:'', serie:null, managerName:'', managerAge:40,
  managerNationality:'Brasileiro', managerFormation:'4-4-2', managerStyle:'Equilibrado',
  difficulty:'Normal', difficultyMultipliers:{ injuryChance:1, rivalStrength:1, moneyBonus:1, fatigueLoss:1 },
  seasonObjective:null, colorPrimary:'#22c55e', colorSecondary:'#ffffff', kitPattern:'solid', kitAccent:'#ffffff',
});

export default function useGameController() {
  const [screen, setScreen] = React.useState('boot');
  const [gameData, setGameData] = React.useState(null);
  const [setupData, setSetupData] = React.useState({ ...DEFAULT_SETUP_DATA });
  const [lineupDialog, setLineupDialog] = React.useState({ open: false, n: 0 });
  const [isDirtyLineup, setIsDirtyLineup] = React.useState(false);
  const [deleteSaveModal, setDeleteSaveModal] = React.useState(null);
  const [dirtyNavTarget, setDirtyNavTarget] = React.useState(null);
  const [toast, setToast] = React.useState({ open: false, message: '', severity: 'success', detail: '' });
  const [playerModalData, setPlayerModalData] = React.useState(null);

  const showToast = React.useCallback((message, severity = 'success', detail = '') => {
    setToast({ open: true, message, severity, detail });
    const delay = detail ? 4000 : 2500;
    setTimeout(() => setToast(prev => prev.message === message ? { ...prev, open: false } : prev), delay);
  }, []);
  const formatMoney = React.useCallback(formatMoneyBR, []);

  const persistence = usePersistence(showToast);
  const persistMatchState = React.useCallback(
    (state) => persistence.saveGame(state),
    [persistence.saveGame],
  );
  const simulation = useMatchSimulation(
    gameData,
    setGameData,
    setScreen,
    showToast,
    setLineupDialog,
    persistMatchState,
  );
  const squad = useSquad(gameData, setGameData, showToast, formatMoney);

  useRoundMaintenance({
    gameData,
    setGameData,
    showToast,
    formatMoney,
    persistGameState: persistence.saveGame,
  });

  React.useEffect(() => () => {
    simulation.matchControlsRef?.current?.forceEnd?.();
  }, []);

  const handleNav = React.useCallback((target) => {
    if (screen === 'match_result' && target !== 'home') return;
    if (screen === 'match_result') simulation.matchControlsRef?.current?.forceEnd?.();
    if (screen === 'season_end' && !['home', 'table'].includes(target)) return;
    if (isDirtyLineup && screen === 'lineup') {
      setDirtyNavTarget(target);
      return;
    }
    setScreen(target);
  }, [screen, isDirtyLineup, simulation.matchControlsRef]);

  const handleLoadGame = React.useCallback(save => {
    const name = resolveSaveName(save);
    if (!name) return;
    persistence.loadGame(name, data => {
      setGameData(data);
      setScreen('home');
    });
  }, [persistence.loadGame]);

  const handleConfirmDelete = React.useCallback(async () => {
    const name = resolveSaveName(deleteSaveModal);
    if (!name) return;
    await persistence.deleteSave(name);
    setDeleteSaveModal(null);
  }, [deleteSaveModal, persistence.deleteSave]);

  const sellPlayer = React.useCallback((player, salePrice) => {
    if (!player) return;
    setGameData(prev => applyQuickPlayerSale(prev, player, salePrice));
  }, []);

  const toggleStarter = React.useCallback(player => {
    if (!gameData || !player) return;
    const result = toggleStarterState(gameData, player.id);
    if (result.error) {
      showToast(result.error, result.error.includes('lesionado') || result.error.includes('suspenso') ? 'error' : 'warning');
      return;
    }
    setGameData(result.gameData);
  }, [gameData, showToast]);

  const updateShirt = React.useCallback((id, shirt, message = 'Camisa definida!') => {
    setGameData(prev => updatePlayerShirtState(prev, id, shirt));
    showToast(message);
  }, [showToast]);

  const updateWage = React.useCallback((id, wage) => {
    const current = gameData?.players?.find((player) => String(player.id) === String(id));
    if (!current) return false;
    if ((Number(wage) || 0) < (Number(current.wage) || 0)) {
      showToast('O salário vigente não pode ser reduzido durante o contrato atual.', 'error');
      return false;
    }
    setGameData(prev => updatePlayerWageState(prev, id, wage));
    showToast('Salário atualizado!');
    return true;
  }, [gameData, showToast]);

  const renewPlayerContract = React.useCallback((id) => {
    const player = gameData?.players?.find((candidate) => String(candidate.id) === String(id));
    if (!player) {
      showToast('Jogador não encontrado.', 'error');
      return false;
    }
    const action = {
      type: 'renew_contract',
      playerId: player.id,
      cost: calculateRenewalCost(player),
      expectedContract: Math.max(0, Math.trunc(Number(player.contract) || 0)),
      expectedWage: Math.max(0, Number(player.wage) || 0),
      season: gameData.season,
    };
    const result = applyContractRenewalState(gameData, action);
    if (!result.ok) {
      showToast(result.error || 'Não foi possível renovar o contrato.', 'error');
      return false;
    }
    setGameData(result.state);
    showToast(`Contrato renovado por ${formatMoney(action.cost)}!`, 'success');
    return true;
  }, [gameData, formatMoney, showToast]);

  const saveGame = React.useCallback(async () => {
    if (!gameData) return false;
    const saved = await persistence.saveGame(gameData);
    if (saved) {
      showToast('Jogo salvo com sucesso!', 'success');
      setIsDirtyLineup(false);
    }
    return saved;
  }, [gameData, persistence.saveGame, showToast]);

  const startNewGame = React.useCallback(data => {
    persistence.createGame(data, created => {
      setGameData(created);
      setSetupData({ ...DEFAULT_SETUP_DATA });
      setScreen('home');
    });
  }, [persistence.createGame]);

  const sharedProps = React.useMemo(() => ({
    gameData,
    setGameData,
    setScreen: handleNav,
    showToast,
    formatMoney,
    sellPlayer,
    ...simulation,
    ...squad,
    toggleStarter,
    setIsDirtyLineup,
    setPlayerModal: setPlayerModalData,
    saveGame,
    persistence,
  }), [gameData, handleNav, showToast, formatMoney, sellPlayer, simulation, squad, toggleStarter, saveGame, persistence]);

  React.useEffect(() => {
    if (!gameData && !['boot', 'setup', 'about'].includes(screen)) setScreen('boot');
  }, [gameData, screen]);

  return {
    screen, setScreen, gameData, setGameData, setupData, setSetupData,
    lineupDialog, setLineupDialog, isDirtyLineup, setIsDirtyLineup,
    deleteSaveModal, setDeleteSaveModal, dirtyNavTarget, setDirtyNavTarget,
    toast, setToast, playerModalData, setPlayerModalData,
    showToast, formatMoney, persistence, simulation, squad,
    handleNav, handleLoadGame, handleConfirmDelete, sellPlayer, toggleStarter,
    updateShirt, updateWage, renewPlayerContract, saveGame, startNewGame, sharedProps,
    playerModalRound: getUpcomingRound(gameData || {}),
  };
}

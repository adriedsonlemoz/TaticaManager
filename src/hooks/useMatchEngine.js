import React from 'react';
import { calculateMorale } from '../engines/core/moraleEngine.js';
import { syncUserRosterState } from '../engines/core/gameStateIntegrity.js';
import { buildRoundMaintenance } from '../engines/app/gameControllerService.js';
import { getLineupValidation } from '../engines/lineup/lineupRules.js';
import useRoundAdvance from './useRoundAdvance.js';
import { startMatchPlayback } from '../engines/match/matchPlayback.js';
import { inspectMatchStart } from '../engines/match/matchPreflight.js';
import { simulateCupRound, buildCupPostMatchState } from '../engines/match/matchCupRound.js';
import { applyResolvedLeagueMatchData, simulateLeagueRound } from '../engines/match/matchLeagueRound.js';
import { buildLiveMatchIntegrityReport } from '../engines/match/matchLiveState.js';
import { completeLeagueRound } from '../engines/match/matchRoundState.js';
import { advanceInactiveCalendarSlots } from '../engines/calendar/idleCalendarAdvance.js';
import { advanceCareerDay, getDayLabel } from '../engines/calendar/calendarDateEngine.js';
import {
  createMatchCommitTransaction,
  inspectMatchCommit,
  stampMatchCommit,
} from '../engines/match/matchCommitService.js';

// Hook de orquestração da partida.
// Regras de calendário, copa, liga e pós-jogo vivem em engines/match/.
const useMatchSimulation = (
  gameData,
  setGameData,
  setScreen,
  showToast,
  setLineupDialog,
  persistGameState = null,
) => {
  const [simulating, setSimulating] = React.useState(false);
  const [visibleEvents, setVisibleEvents] = React.useState([]);
  const [liveScore, setLiveScore] = React.useState({ home: 0, away: 0 });
  const [liveMinute, setLiveMinute] = React.useState(0);
  const [matchResultData, setMatchResultData] = React.useState(null);
  const [roundSummary, setRoundSummary] = React.useState([]);
  const matchFeedRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const gameDataRef = React.useRef(gameData);
  const matchStartLockRef = React.useRef(false);
  const matchControlsRef = React.useRef({
    isPaused: false,
    addEvent: null,
    setLiveScore: null,
    setVisibleEvents: null,
    pauseMatch: null,
    resumeMatch: null,
    forceEnd: null,
    startMatch: null,
    resumeSecondHalf: null,
    matchStarted: false,
    commitMatchState: null,
    cancelMatchState: null,
    liveSubstitutions: [],
    registerLiveSubstitution: null,
    getResolvedMatchData: null,
    getLiveMatchState: null,
    syncLiveState: null,
    liveState: null,
    liveActiveLineups: null,
    lastResolvedRawEvent: null,
    autoSimulate: false,
  });

  React.useEffect(() => {
    gameDataRef.current = gameData;
  }, [gameData]);

  const { handleGoToNextMatch } = useRoundAdvance(
    gameData,
    setGameData,
    setScreen,
    showToast,
    setLineupDialog,
    intervalRef,
    matchControlsRef,
    setSimulating,
    persistGameState,
  );

  const playResult = React.useCallback((matchData) => {
    setScreen('match_result');
    startMatchPlayback({
      matchData,
      intervalRef,
      matchControlsRef,
      setSimulating,
      setVisibleEvents,
      setLiveScore,
      setLiveMinute,
      onResolvedMatchData: (resolvedMatchData) => setMatchResultData(resolvedMatchData),
    });
  }, [setScreen]);

  const queueMatchCommit = React.useCallback(({
    baseState,
    matchData,
    buildState,
    onCommit = null,
  }) => {
    const transaction = createMatchCommitTransaction(baseState, matchData);
    const controls = matchControlsRef.current;
    let committed = false;

    const clearQueuedCommit = () => {
      controls.commitMatchState = null;
      controls.cancelMatchState = null;
      controls.liveSubstitutions = [];
      controls.matchStarted = false;
      matchStartLockRef.current = false;
    };

    controls.liveSubstitutions = [];
    controls.cancelMatchState = () => {
      if (committed) return false;
      clearQueuedCommit();
      return true;
    };
    controls.commitMatchState = () => {
      if (committed) return false;

      const currentState = gameDataRef.current || baseState;
      const inspection = inspectMatchCommit(currentState, transaction);
      if (inspection.status === 'duplicate') {
        committed = true;
        clearQueuedCommit();
        return true;
      }
      if (inspection.status !== 'ready') {
        clearQueuedCommit();
        showToast?.('A partida não pôde ser confirmada porque a carreira mudou durante a simulação.', 'error');
        return false;
      }

      try {
        const liveMatchData = typeof controls.getResolvedMatchData === 'function'
          ? controls.getResolvedMatchData()
          : matchData;
        const integrity = buildLiveMatchIntegrityReport(liveMatchData);
        if (!integrity.valid) {
          throw new Error('Integridade da partida divergente entre eventos, placar e estatísticas.');
        }
        const built = buildState?.({
          gameData: currentState,
          liveSubstitutions: Array.isArray(controls.liveSubstitutions) ? controls.liveSubstitutions : [],
          liveMatchData,
        });
        const nextState = built?.nextState || built;
        if (!nextState || typeof nextState !== 'object') throw new Error('Estado pós-partida inválido.');

        const stampedState = stampMatchCommit(nextState, transaction);
        // A manutenção pós-rodada faz parte do mesmo estado atômico do commit.
        // Assim proposta formal, auto-bench e seu carimbo não dependem de um
        // efeito React posterior que poderia ser perdido ao fechar o app.
        const maintenance = buildRoundMaintenance(stampedState, { allowTransferOffers: true });
        const committedState = maintenance.state;
        committed = true;
        gameDataRef.current = committedState;
        setGameData(committedState);
        if (typeof persistGameState === 'function') void persistGameState(committedState);
        maintenance.toasts.forEach((effect) => {
          setTimeout(() => showToast?.(effect.message, effect.severity), effect.delay || 0);
        });
        onCommit?.(built);
        clearQueuedCommit();
        return true;
      } catch (error) {
        matchStartLockRef.current = false;
        showToast?.(`Erro ao confirmar a partida: ${error?.message || 'falha desconhecida'}`, 'error');
        return false;
      }
    };
    controls.matchStarted = false;
  }, [persistGameState, setGameData, showToast]);

  const startMatchSimulation = React.useCallback((options = {}) => {
    if (!gameData || simulating || matchStartLockRef.current) return;

    const preflight = inspectMatchStart(gameData);
    if (preflight.status === 'blocked') return;

    if (preflight.status === 'state-update') {
      setGameData(preflight.nextState);
      return;
    }

    if (preflight.status === 'lineup-count') {
      setLineupDialog({ open: true, n: preflight.starters.length });
      setScreen('lineup');
      return;
    }

    if (preflight.status === 'lineup-invalid') {
      const validation = preflight.validation || {};
      const reason = !validation.formationValid
        ? 'A formação selecionada é inválida.'
        : !validation.hasGoalkeeper
          ? 'A escalação precisa ter um goleiro.'
          : validation.duplicateStarterIds?.length
            ? 'Existem titulares duplicados na escalação.'
            : 'A escalação contém dados inválidos.';
      showToast(`🚫 PARTIDA BLOQUEADA: ${reason}`, 'error');
      setScreen('lineup');
      return;
    }

    if (preflight.status === 'identity-invalid') {
      showToast('🚫 Não foi possível identificar com segurança qual lado pertence ao seu clube. A partida não foi iniciada.', 'error');
      return;
    }

    if (preflight.status === 'illegal-player') {
      const illegal = preflight.illegalPlayer;
      const injured = Boolean(illegal.injury);
      showToast(
        `🚨 JUIZ BARROU: ${illegal.name} está ${injured ? 'lesionado 🚑' : 'suspenso 🟥'} e não pode jogar!`,
        'error',
      );
      setGameData((prev) => syncUserRosterState(prev, (prev.players || []).map((player) => (
        player.id === illegal.id ? { ...player, isStarting: false } : player
      ))));
      setScreen('lineup');
      return;
    }

    if (preflight.status === 'rest-day') {
      const advanced = advanceCareerDay(gameData);
      if (!advanced.advanced) return;
      gameDataRef.current = advanced.state;
      setGameData(advanced.state);
      if (typeof persistGameState === 'function') void persistGameState(advanced.state);
      const activity = advanced.activity || { icon:'🛌', label:'Descanso do elenco' };
      showToast?.(`${activity.icon} ${getDayLabel(advanced.date)} · ${activity.label}${advanced.daysUntilMatch > 0 ? ` · ${advanced.daysUntilMatch} dia(s) para o próximo jogo` : ' · partida disponível hoje'}.`, 'info');
      return;
    }

    if (preflight.status === 'skip-inactive-cups') {
      const idleAdvance = advanceInactiveCalendarSlots(gameData, { skipCount: preflight.skipCount });
      const maintenance = buildRoundMaintenance(idleAdvance.state, { allowTransferOffers: false });
      const advancedState = maintenance.state;
      gameDataRef.current = advancedState;
      setGameData(advancedState);
      if (typeof persistGameState === 'function') void persistGameState(advancedState);

      if (idleAdvance.skippedSlots > 0) {
        const recovered = idleAdvance.recoveredPlayers.length;
        showToast?.(
          `⏭️ ${idleAdvance.skippedSlots} data(s) sem partida: elenco descansou${recovered > 0 ? ` e ${recovered} jogador(es) se recuperaram de lesão` : ''}.`,
          'info',
        );
      }
      maintenance.toasts.forEach((effect) => {
        setTimeout(() => showToast?.(effect.message, effect.severity), effect.delay || 0);
      });
      return;
    }

    matchStartLockRef.current = true;
    const starters = preflight.starters;
    const tactics = preflight.validation || getLineupValidation(gameData);
    const calendarEntry = preflight.calendarEntry;
    matchControlsRef.current.autoSimulate = options?.autoSimulate === true;

    try {
      if (calendarEntry?.type === 'cup') {
        const cupRound = simulateCupRound({ gameData, calendarEntry, tactics, starters });
        if (cupRound.inactive) {
          matchStartLockRef.current = false;
          setGameData((prev) => ({ ...prev, round: prev.round + 1 }));
          return;
        }
        if (cupRound.identityError) {
          matchStartLockRef.current = false;
          showToast('🚫 Copa bloqueada: não foi possível identificar com segurança o seu clube no confronto.', 'error');
          return;
        }

        const matchData = { ...cupRound.userMatchData, cupEvents: cupRound.cupEvents };
        setRoundSummary([]);
        setMatchResultData(matchData);
        queueMatchCommit({
          baseState: gameData,
          matchData,
          buildState: ({ gameData: currentState, liveSubstitutions, liveMatchData }) => buildCupPostMatchState(
            currentState,
            {
              ...cupRound,
              userMatchData:{ ...(cupRound.userMatchData || {}), ...(liveMatchData || {}) },
              allRawEvents:Array.isArray(liveMatchData?.rawEvents) ? liveMatchData.rawEvents : cupRound.allRawEvents,
            },
            { liveSubstitutions },
          ),
        });
        playResult(matchData);
        return;
      }

      const leagueIdx = calendarEntry?.leagueIdx ?? gameData.round;
      const leagueRound = simulateLeagueRound({ gameData, leagueIdx, tactics, starters });
      if (leagueRound.alreadyPlayed) {
        matchStartLockRef.current = false;
        const recoveredState = {
          ...gameData,
          round: (Number(gameData.round) || 0) + 1,
          leagueRound: Math.max(Number(gameData.leagueRound) || 0, Number(leagueIdx) + 1),
          table: leagueRound.table || gameData.table,
          fixtures: leagueRound.fixtures || gameData.fixtures,
        };
        gameDataRef.current = recoveredState;
        setGameData(recoveredState);
        if (typeof persistGameState === 'function') void persistGameState(recoveredState);
        showToast?.(`ℹ️ A rodada ${Number(leagueIdx) + 1} já estava registrada. O calendário foi sincronizado sem contabilizar os jogos novamente.`, 'info');
        return;
      }
      if (leagueRound.empty) {
        matchStartLockRef.current = false;
        setGameData((prev) => ({
          ...prev,
          round: prev.round + 1,
          leagueRound: (prev.leagueRound ?? 0) + 1,
        }));
        return;
      }

      const matchData = { ...leagueRound.userMatchData, cupEvents: [] };
      setRoundSummary(leagueRound.currentMatches);
      setMatchResultData(matchData);
      queueMatchCommit({
        baseState: gameData,
        matchData,
        buildState: ({ gameData: currentState, liveSubstitutions, liveMatchData }) => completeLeagueRound({
          gameData: currentState,
          leagueRound:applyResolvedLeagueMatchData(leagueRound, liveMatchData),
          calculateMorale,
          liveSubstitutions,
        }),
        onCommit: (completed) => {
          if (completed?.stadiumCompleted) {
            setTimeout(() => showToast('🏟️ Obras concluídas! +5.000 lugares no estádio.', 'success'), 200);
          }
        },
      });
      playResult(matchData);
    } catch (error) {
      matchStartLockRef.current = false;
      matchControlsRef.current.commitMatchState = null;
      matchControlsRef.current.cancelMatchState = null;
      showToast?.(`Erro ao preparar a partida: ${error?.message || 'falha desconhecida'}`, 'error');
    }
  }, [gameData, simulating, setGameData, setScreen, showToast, setLineupDialog, playResult, queueMatchCommit]);

  return {
    simulating,
    visibleEvents,
    liveScore,
    liveMinute,
    matchResultData,
    roundSummary,
    matchFeedRef,
    matchControlsRef,
    handleGoToNextMatch,
    startMatchSimulation,
  };
};

export { useMatchSimulation };
export default useMatchSimulation;

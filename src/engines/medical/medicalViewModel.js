import { getPlayerAvailability, getUpcomingRound } from '../core/playerStatus.js';
import { syncUserRosterState } from '../core/gameStateIntegrity.js';
import { appendFinancialEntry } from '../finances/financeLedger.js';

export const MEDICAL_COSTS = Object.freeze({
  TREAT_INJURY: 500_000,
  RECOVER_ENERGY: 150_000,
  PHYSIO_SESSION: 300_000,
});

const number = (value) => Number(value) || 0;
const playerFirstName = (player) => String(player?.name || 'Jogador').split(/\s+/)[0] || 'Jogador';

function addMedicalExpense(state, expense, description) {
  const transaction = {
    round: number(state.round),
    income: 0,
    expense,
    total: -expense,
    detail: { description },
  };

  return appendFinancialEntry(state.financialHistory, transaction, { season: state.season, round: state.round, leagueRound: state.leagueRound ?? state.round, competition: 'medical' });
}

export function buildMedicalViewModel(gameData = {}) {
  const players = gameData.players || [];
  const round = number(gameData.round);
  const currentRound = getUpcomingRound(gameData);
  const decorated = players.map((player) => ({
    player,
    status: getPlayerAvailability(player, currentRound),
  }));

  const injured = decorated
    .filter(({ status }) => status.injured)
    .sort((a, b) => number(b.player.injury?.roundsLeft) - number(a.player.injury?.roundsLeft));

  const suspended = decorated
    .filter(({ status }) => status.suspended)
    .sort((a, b) => b.status.suspensionRounds - a.status.suspensionRounds);

  const criticalFatigue = decorated
    .filter(({ status }) => !status.injured && status.energy < 50)
    .sort((a, b) => a.status.energy - b.status.energy);

  const lowEnergy = decorated
    .filter(({ status }) => !status.injured && status.energy >= 50 && status.energy < 80)
    .sort((a, b) => a.status.energy - b.status.energy);

  const uniqueProblems = new Set([
    ...injured.map(({ player }) => player.id),
    ...suspended.map(({ player }) => player.id),
    ...criticalFatigue.map(({ player }) => player.id),
    ...lowEnergy.map(({ player }) => player.id),
  ]).size;

  return {
    clubName: gameData.club?.name || 'Meu Clube',
    round,
    currentRound,
    money: number(gameData.club?.money),
    injured,
    suspended,
    criticalFatigue,
    lowEnergy,
    counts: {
      injured: injured.length,
      suspended: suspended.length,
      criticalFatigue: criticalFatigue.length,
      lowEnergy: lowEnergy.length,
      uniqueProblems,
    },
    allHealthy: uniqueProblems === 0,
  };
}

export function treatInjuryState(gameData = {}, playerId) {
  const player = (gameData.players || []).find((item) => item.id === playerId);
  if (!player?.injury) return { state: gameData, error: 'Jogador não possui lesão ativa.' };
  if (number(gameData.club?.money) < MEDICAL_COSTS.TREAT_INJURY) {
    return { state: gameData, error: 'Saldo insuficiente para tratamento!' };
  }

  const roundsLeft = Math.max(1, number(player.injury.roundsLeft) || 1);
  const nextPlayers = (gameData.players || []).map((item) => {
    if (item.id !== playerId) return item;
    const nextRounds = roundsLeft - 1;
    return nextRounds <= 0
      ? { ...item, injury: null }
      : { ...item, injury: { ...item.injury, roundsLeft: nextRounds } };
  });

  return {
    state: syncUserRosterState({
      ...gameData,
      club: { ...(gameData.club || {}), money: number(gameData.club?.money) - MEDICAL_COSTS.TREAT_INJURY },
      financialHistory: addMedicalExpense(gameData, MEDICAL_COSTS.TREAT_INJURY, `Tratamento médico: ${player.name}`),
    }, nextPlayers),
    message: `${playerFirstName(player)} tratado! -1 rodada de lesão.`,
  };
}

export function recoverPlayerEnergyState(gameData = {}, playerId) {
  const player = (gameData.players || []).find((item) => item.id === playerId);
  if (!player) return { state: gameData, error: 'Jogador não encontrado.' };
  if (player.injury) return { state: gameData, error: 'Jogador lesionado deve ser tratado antes da recuperação física.' };
  const currentEnergy = Math.max(0, Math.min(100, Number(player.energy ?? 100) || 0));
  if (currentEnergy >= 100) return { state: gameData, error: 'Jogador já está com energia máxima.' };
  if (number(gameData.club?.money) < MEDICAL_COSTS.RECOVER_ENERGY) {
    return { state: gameData, error: 'Saldo insuficiente!' };
  }

  const players = (gameData.players || []).map((item) => (
    item.id === playerId
      ? { ...item, energy: Math.min(100, currentEnergy + 35) }
      : item
  ));

  return {
    state: syncUserRosterState({
      ...gameData,
      club: { ...(gameData.club || {}), money: number(gameData.club?.money) - MEDICAL_COSTS.RECOVER_ENERGY },
      financialHistory: addMedicalExpense(gameData, MEDICAL_COSTS.RECOVER_ENERGY, `Recuperação física: ${player.name}`),
    }, players),
    message: `${playerFirstName(player)} recuperou energia!`,
  };
}

export function runPhysioSessionState(gameData = {}) {
  const players = gameData.players || [];
  if (!players.length) return { state: gameData, error: 'Não há jogadores no elenco.' };
  if (!players.some((player) => (player.energy ?? 100) < 100)) {
    return { state: gameData, error: 'O elenco já está com energia máxima.' };
  }
  if (number(gameData.club?.money) < MEDICAL_COSTS.PHYSIO_SESSION) {
    return { state: gameData, error: 'Saldo insuficiente para sessão de fisioterapia!' };
  }

  return {
    state: syncUserRosterState({
      ...gameData,
      club: { ...(gameData.club || {}), money: number(gameData.club?.money) - MEDICAL_COSTS.PHYSIO_SESSION },
      financialHistory: addMedicalExpense(gameData, MEDICAL_COSTS.PHYSIO_SESSION, 'Sessão coletiva de fisioterapia'),
    }, players.map((player) => ({
      ...player,
      energy: Math.min(100, Math.max(0, Number(player.energy ?? 100) || 0) + 15),
    }))),
    message: 'Sessão coletiva de fisioterapia realizada! +15% energia para todos.',
  };
}

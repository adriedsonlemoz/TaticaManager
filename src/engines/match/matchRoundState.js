import { FinanceEngine } from '../engine_finances.js';
import { accumulateScorers } from './matchPlayerStats.js';
import {
  buildPostMatchNotifications,
  preparePostMatchPlayers,
  processCpuTransfers,
  progressAcademy,
  refreshTransferMarket,
} from './matchPostProcessor.js';
import {
  advanceStadium,
  buildManagerProfile,
  syncPlayerSeasonGoals,
  updateHeadToHead,
} from './matchStateUtils.js';

export function completeLeagueRound({ gameData, leagueRound, calculateMorale }) {
  let updatedPlayers = leagueRound.updatedPlayers;
  const scorers = accumulateScorers(gameData.scorers || {}, leagueRound.allRawEvents || []);
  updatedPlayers = syncPlayerSeasonGoals(updatedPlayers, scorers);

  const tvIncome = FinanceEngine?.getTVRights
    ? FinanceEngine.getTVRights(gameData.serie, (gameData.round || 0) + 1, gameData.fixtures?.length || 38)
    : ({ A: 400000, B: 60000, C: 12000, D: 6000 }[gameData.serie] || 6000);
  const sponsorIncome = (gameData.club?.sponsors?.master?.roundValue || 0) + (gameData.club?.sponsors?.stadium?.roundValue || 0);
  const operationalCost = (((gameData.round || 0) + 1) % 4 === 0 && FinanceEngine?.getOperationalCosts)
    ? FinanceEngine.getOperationalCosts(gameData)
    : 0;
  const wage = updatedPlayers.reduce((sum, player) => sum + (player.wage || 0), 0);
  const income = leagueRound.ticketIncome + tvIncome + sponsorIncome;
  const expense = wage + operationalCost;

  const cpuTrades = processCpuTransfers(gameData);
  const academy = progressAcademy(gameData);
  const notifications = buildPostMatchNotifications({
    gameData,
    userMatchData: leagueRound.userMatchData,
    updatedTable: leagueRound.table,
    updatedPlayers,
    allRawEvents: leagueRound.allRawEvents,
  });
  const finalPlayers = preparePostMatchPlayers(gameData, updatedPlayers, notifications.lesaoTreino);
  const stadiumResult = advanceStadium(gameData.club?.stadium || {});

  const rawMorale = calculateMorale
    ? calculateMorale({ ...gameData, fixtures: leagueRound.fixtures, round: (gameData.round || 0) + 1 })
    : (gameData.morale ?? 60);
  let morale = Math.round(rawMorale * 0.60 + (gameData.morale ?? 60) * 0.40);
  if (notifications.pressaoTorcida.length > 0) morale = Math.max(10, morale - 5);

  const nextState = {
    ...gameData,
    round: (gameData.round || 0) + 1,
    leagueRound: (gameData.leagueRound ?? 0) + 1,
    morale,
    h2hHistory: updateHeadToHead(gameData.h2hHistory, gameData.club?.name, leagueRound.userMatchData),
    table: leagueRound.table,
    fixtures: leagueRound.fixtures,
    leagues: cpuTrades ? cpuTrades.leagues : gameData.leagues,
    teamRosters: cpuTrades ? cpuTrades.teamRosters : gameData.teamRosters,
    academy: academy !== undefined ? academy : gameData.academy,
    players: finalPlayers,
    inbox: [
      ...notifications.jornal,
      ...notifications.rumores,
      ...notifications.objetivoDiretoria,
      ...notifications.pressaoTorcida,
      ...(notifications.lesaoTreino.msg ? [notifications.lesaoTreino.msg] : []),
      ...notifications.contractWarnings,
      ...notifications.academyNotifs,
      ...notifications.matchInjuryMsgs,
      ...notifications.suspensionMsgs,
      ...(gameData.inbox || []),
    ].slice(0, 80),
    club: {
      ...(gameData.club || {}),
      money: (gameData.club?.money || 0) + income - expense,
      wage,
      strength: Math.round(updatedPlayers.filter((player) => player.isStarting).reduce((sum, player) => sum + player.overall, 0) / 11) || gameData.club?.strength,
      managerProfile: buildManagerProfile(gameData.club?.managerProfile, gameData.club?.name, leagueRound.userMatchData),
      stadium: stadiumResult.stadium,
    },
    market: refreshTransferMarket(gameData),
    financialHistory: [{
      round: (gameData.round || 0) + 1,
      income,
      expense,
      total: income - expense,
      detail: { ticket: leagueRound.ticketIncome, tv: tvIncome, sponsor: sponsorIncome, cup: 0, wage, opCost: operationalCost },
    }, ...(gameData.financialHistory || [])].slice(0, 100),
    scorers,
  };

  return {
    nextState,
    stadiumCompleted: stadiumResult.completed,
    finance: { income, expense, ticketIncome: leagueRound.ticketIncome, tvIncome, sponsorIncome, wage, operationalCost },
  };
}

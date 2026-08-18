import { FinanceEngine } from '../engine_finances.js';
import { buildLeagueIntegrityReport, hasDoubleRoundRobinShape } from '../core/leagueEngine.js';
import { syncUserRosterState } from '../core/gameStateIntegrity.js';
import { appendFinancialEntry } from '../finances/financeLedger.js';
import { accumulateScorers } from './matchPlayerStats.js';
import { progressAcademy } from './matchAcademyPostProcessor.js';
import { buildPostMatchNotifications } from './matchNotifications.js';
import { preparePostMatchPlayers, processMatchPlayers } from './matchPlayerPostProcessor.js';
import { buildMatchRoundContext } from './matchRoundContext.js';
import { processCpuTransfers, refreshTransferMarket } from './matchTransferPostProcessor.js';
import {
  advanceStadium,
  buildManagerProfile,
  syncPlayerSeasonGoals,
  updateHeadToHead,
} from './matchStateUtils.js';

export function calculateLeagueRoundFinances(gameData, leagueRound, updatedPlayers, rounds) {
  const tvIncome = FinanceEngine?.getTVRights
    ? FinanceEngine.getTVRights(gameData.serie, rounds.leagueRoundPlayed, rounds.totalLeagueRounds)
    : ({ A: 400000, B: 60000, C: 12000, D: 6000 }[gameData.serie] || 6000);
  const sponsorIncome = (gameData.club?.sponsors?.master?.roundValue || 0)
    + (gameData.club?.sponsors?.stadium?.roundValue || 0);
  const operationalCost = (rounds.leagueRoundPlayed % 4 === 0 && FinanceEngine?.getOperationalCosts)
    ? FinanceEngine.getOperationalCosts(gameData)
    : 0;
  const wage = FinanceEngine.getCurrentWage({ ...gameData, players: updatedPlayers });
  const income = (leagueRound.ticketIncome || 0) + tvIncome + sponsorIncome;
  const expense = wage + operationalCost;

  return {
    income,
    expense,
    ticketIncome: leagueRound.ticketIncome || 0,
    tvIncome,
    sponsorIncome,
    wage,
    operationalCost,
  };
}

export function completeLeagueRound({ gameData, leagueRound, calculateMorale, liveSubstitutions = [], rng = Math.random }) {
  const hasCanonicalLeagueSchedule = hasDoubleRoundRobinShape(gameData.table, gameData.fixtures);
  if (hasCanonicalLeagueSchedule) {
    const integrity = buildLeagueIntegrityReport(leagueRound.table, leagueRound.fixtures);
    if (!integrity.ok) {
      throw new Error(`Integridade da Liga inválida antes do commit: ${integrity.errors.join('; ')}`);
    }
  }

  const rounds = buildMatchRoundContext(gameData, leagueRound.leagueIdx);
  let updatedPlayers = processMatchPlayers({
    gameData,
    userMatchData: leagueRound.userMatchData,
    allRawEvents: leagueRound.allRawEvents || [],
    liveSubstitutions,
    rng,
  });
  const scorers = accumulateScorers(gameData.scorers || {}, leagueRound.allRawEvents || []);
  updatedPlayers = syncPlayerSeasonGoals(updatedPlayers, scorers);

  const finance = calculateLeagueRoundFinances(gameData, leagueRound, updatedPlayers, rounds);
  const cpuTrades = processCpuTransfers(gameData, { leagueIdx: leagueRound.leagueIdx, rng });
  const academy = progressAcademy(gameData, { leagueIdx: leagueRound.leagueIdx, rng });
  const notifications = buildPostMatchNotifications({
    gameData,
    userMatchData: leagueRound.userMatchData,
    updatedTable: leagueRound.table,
    updatedPlayers,
    updatedFixtures: leagueRound.fixtures,
    allRawEvents: leagueRound.allRawEvents,
    leagueIdx: leagueRound.leagueIdx,
  });
  const finalPlayers = preparePostMatchPlayers(gameData, updatedPlayers, notifications.lesaoTreino, rng);
  const stadiumResult = advanceStadium(gameData.club?.stadium || {});

  const rawMorale = calculateMorale
    ? calculateMorale({ ...gameData, fixtures: leagueRound.fixtures })
    : (gameData.morale ?? 60);
  let morale = Math.round(rawMorale * 0.60 + (gameData.morale ?? 60) * 0.40);
  if (notifications.pressaoTorcida.length > 0) morale = Math.max(10, morale - 5);

  const startingPlayers = finalPlayers.filter((player) => player.isStarting);
  const nextStrength = startingPlayers.length === 11
    ? Math.round(startingPlayers.reduce((sum, player) => sum + (player.overall || 0), 0) / 11)
    : gameData.club?.strength;

  const nextState = syncUserRosterState({
    ...gameData,
    round: rounds.calendarIndexAfter,
    leagueRound: rounds.playedLeagueAfter,
    morale,
    h2hHistory: updateHeadToHead(gameData.h2hHistory, gameData.club?.name, leagueRound.userMatchData),
    table: leagueRound.table,
    fixtures: leagueRound.fixtures,
    leagues: cpuTrades ? cpuTrades.leagues : gameData.leagues,
    teamRosters: cpuTrades ? cpuTrades.teamRosters : gameData.teamRosters,
    academy: academy !== undefined ? academy : gameData.academy,
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
      money: (gameData.club?.money || 0) + finance.income - finance.expense,
      wage: finance.wage,
      strength: nextStrength,
      managerProfile: buildManagerProfile(gameData.club?.managerProfile, gameData.club?.name, leagueRound.userMatchData),
      stadium: stadiumResult.stadium,
    },
    market: refreshTransferMarket(gameData, { leagueIdx: leagueRound.leagueIdx, rng, extraFreeAgents: cpuTrades?.freeAgents || [] }),
    financialHistory: appendFinancialEntry(gameData.financialHistory, {
      income: finance.income,
      expense: finance.expense,
      total: finance.income - finance.expense,
      detail: {
        ticket: finance.ticketIncome,
        tv: finance.tvIncome,
        sponsor: finance.sponsorIncome,
        cup: 0,
        wage: finance.wage,
        opCost: finance.operationalCost,
        isHome: leagueRound.userMatchData?.userIsHome === true,
      },
    }, {
      season: gameData.season,
      round: rounds.calendarRoundPlayed,
      leagueRound: rounds.leagueRoundPlayed,
      competition: 'league',
    }),
    scorers,
  }, finalPlayers);

  return {
    nextState,
    stadiumCompleted: stadiumResult.completed,
    finance,
  };
}

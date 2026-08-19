import { hasDoubleRoundRobinShape, rebuildLeagueTable, sortLeagueTable } from '../core/leagueEngine.js';
import { evaluateSeasonObjective } from './seasonObjective.js';
import { getSeasonFinancialHistory } from '../finances/financeLedger.js';
import { getSerieDUserOutcome } from '../serieD/serieDCompetition.js';
import { getSerieCUserOutcome } from '../serieC/serieCCompetition.js';

const SERIE_ORDER = Object.freeze({ A: 0, B: 1, C: 2, D: 3 });

export function getFinalTable(gameData = {}) {
  const table = [...(gameData.table || [])];
  const fixtures = gameData.fixtures || [];
  // Em uma Liga completa, os fixtures são a fonte canônica. Saves/testes legados
  // com calendário parcial continuam usando a tabela persistida para não apagar histórico.
  if (hasDoubleRoundRobinShape(table, fixtures)) return rebuildLeagueTable(table, fixtures);
  return sortLeagueTable(table, fixtures);
}

export function getUserFinalPosition(table = []) {
  const index = table.findIndex((row) => row?.id === 'user');
  return index >= 0 ? index + 1 : 0;
}

export function getNextSerie(prevSerie = 'A', userPosition = 0) {
  const pos = Number(userPosition) || 0;
  if (prevSerie === 'A' && pos >= 17) return 'B';
  if (prevSerie === 'B' && pos > 0 && pos <= 4) return 'A';
  if (prevSerie === 'B' && pos >= 17) return 'C';
  if (prevSerie === 'C' && pos > 0 && pos <= 4) return 'B';
  if (prevSerie === 'C' && pos >= 17) return 'D';
  if (prevSerie === 'D' && pos > 0 && pos <= 4) return 'C';
  return prevSerie;
}


export function getNextSerieForSeason(prevSerie = 'A', userPosition = 0, season = 2026) {
  const pos = Number(userPosition) || 0;
  const year = Number(season) || 2026;
  if (prevSerie === 'C' && year === 2026) {
    if (pos > 0 && pos <= 4) return 'B';
    if (pos >= 19) return 'D';
    return 'C';
  }
  return getNextSerie(prevSerie, pos);
}

export function getSeasonMovement(prevSerie = 'A', newSerie = prevSerie) {
  const prev = SERIE_ORDER[prevSerie] ?? 0;
  const next = SERIE_ORDER[newSerie] ?? prev;
  return {
    promoted: next < prev,
    relegated: next > prev,
  };
}

const seasonGoals = (player = {}) => (
  player.seasonGoals !== undefined && player.seasonGoals !== null
    ? Number(player.seasonGoals) || 0
    : Number(player.goals) || 0
);

const playerSnapshot = (player = {}) => ({
  id: player.id,
  name: player.name,
  position: player.position,
  age: player.age,
  overall: Number(player.overall) || 0,
  goals: seasonGoals(player),
  assists: Number(player.assists) || 0,
  value: Number(player.value) || 0,
  wage: Number(player.wage) || 0,
});

export function buildSeasonSnapshot(prevState = {}, finalTable = getFinalTable(prevState), newSerie = null) {
  const userPos = getUserFinalPosition(finalTable);
  const prevSerie = prevState.serie || 'A';
  const serieDOutcome = prevSerie === 'D' ? getSerieDUserOutcome(prevState) : null;
  const serieCOutcome = prevSerie === 'C' ? getSerieCUserOutcome(prevState) : null;
  const outcomeSerie = serieDOutcome
    ? (serieDOutcome.promoted ? 'C' : 'D')
    : serieCOutcome
      ? (serieCOutcome.promoted ? 'B' : serieCOutcome.relegated ? 'D' : 'C')
      : null;
  const resolvedNewSerie = newSerie || outcomeSerie || getNextSerieForSeason(prevSerie, userPos, prevState.season);
  const movement = getSeasonMovement(prevSerie, resolvedNewSerie);
  const row = finalTable.find((entry) => entry?.id === 'user') || {};
  const players = prevState.players || [];
  const sortedScorers = [...players].sort((a, b) => seasonGoals(b) - seasonGoals(a) || (Number(b.overall) || 0) - (Number(a.overall) || 0));
  const sortedAssists = [...players].sort((a, b) => (Number(b.assists) || 0) - (Number(a.assists) || 0) || (Number(b.overall) || 0) - (Number(a.overall) || 0));
  const sortedOverall = [...players].sort((a, b) => (Number(b.overall) || 0) - (Number(a.overall) || 0));
  const history = getSeasonFinancialHistory(prevState.financialHistory || [], prevState.season);
  const finance = history.reduce((acc, entry) => {
    const income = Number(entry?.income) || (entry?.isPositive === true ? Number(entry?.value) || 0 : 0);
    const expense = Number(entry?.expense) || (entry?.isPositive === false ? Number(entry?.value) || 0 : 0);
    acc.income += income;
    acc.expense += expense;
    return acc;
  }, { income: 0, expense: 0 });

  const objective = evaluateSeasonObjective({
    objective: prevState.seasonObjective || 'survive',
    serie: prevSerie,
    position: userPos,
  });
  if (serieDOutcome && objective.applicable) {
    if ((prevState.seasonObjective || '') === 'promotion' || (prevState.seasonObjective || '') === 'top4') {
      objective.success = serieDOutcome.promoted;
      objective.requirement = 'Era necessário conquistar uma das vagas de acesso à Série C.';
      objective.message = objective.success ? null : `Objetivo: ${objective.label.toUpperCase()}. O clube não conquistou o acesso à Série C.`;
    } else if ((prevState.seasonObjective || '') === 'champion') {
      objective.success = serieDOutcome.champion;
      objective.requirement = 'Era necessário conquistar o título da Série D.';
      objective.message = objective.success ? null : `Objetivo: ${objective.label.toUpperCase()}. O clube não conquistou o título da Série D.`;
    }
  }
  if (serieCOutcome && objective.applicable) {
    const objectiveKey = prevState.seasonObjective || '';
    if (objectiveKey === 'promotion' || objectiveKey === 'top4') {
      objective.success = serieCOutcome.promoted;
      objective.requirement = 'Era necessário conquistar uma das quatro vagas de acesso à Série B.';
      objective.message = objective.success ? null : `Objetivo: ${objective.label.toUpperCase()}. O clube não conquistou o acesso à Série B.`;
    } else if (objectiveKey === 'champion') {
      objective.success = serieCOutcome.champion;
      objective.requirement = 'Era necessário conquistar o título da Série C.';
      objective.message = objective.success ? null : `Objetivo: ${objective.label.toUpperCase()}. O clube não conquistou o título da Série C.`;
    } else if (objectiveKey === 'survive') {
      objective.success = !serieCOutcome.relegated;
      objective.requirement = 'Era necessário evitar as duas vagas de rebaixamento à Série D.';
      objective.message = objective.success ? null : `Objetivo: ${objective.label.toUpperCase()}. O clube foi rebaixado à Série D.`;
    }
  }

  return {
    prevSerie,
    newSerie: resolvedNewSerie,
    userPos,
    finalPosition: userPos,
    promoted: serieDOutcome ? serieDOutcome.promoted : serieCOutcome ? serieCOutcome.promoted : movement.promoted,
    relegated: serieCOutcome ? serieCOutcome.relegated : movement.relegated,
    champion: serieDOutcome ? serieDOutcome.champion : serieCOutcome ? serieCOutcome.champion : userPos === 1,
    serieD: serieDOutcome,
    serieC: serieCOutcome,
    pts: Number(row.pts) || 0,
    season: prevState.season,
    objective,
    league: {
      wins: Number(row.w) || 0,
      draws: Number(row.d) || 0,
      losses: Number(row.l) || 0,
      goalsFor: Number(row.gf) || 0,
      goalsAgainst: Number(row.ga) || 0,
    },
    squad: {
      count: players.length,
      avgOverall: players.length
        ? Math.round(players.reduce((sum, player) => sum + (Number(player.overall) || 0), 0) / players.length)
        : 0,
      totalValue: players.reduce((sum, player) => sum + (Number(player.value) || 0), 0),
      totalWage: players.reduce((sum, player) => sum + (Number(player.wage) || 0), 0),
      topPlayers: sortedOverall.slice(0, 8).map(playerSnapshot),
      topScorer: sortedScorers.length && seasonGoals(sortedScorers[0]) > 0 ? playerSnapshot(sortedScorers[0]) : null,
      topAssist: sortedAssists.length && (Number(sortedAssists[0]?.assists) || 0) > 0 ? playerSnapshot(sortedAssists[0]) : null,
    },
    finances: {
      income: finance.income,
      expense: finance.expense,
      net: finance.income - finance.expense,
      transactions: history.slice(0, 8).map((entry) => ({ ...entry })),
    },
    cupResult: prevState.cups?.copaBrasil?.status || null,
    cupResults: {
      copaBrasil:prevState.cups?.copaBrasil?.status || null,
      libertadores:prevState.cups?.libertadores?.status || null,
      sulAmericana:prevState.cups?.sulAmericana?.status || null,
      regional:prevState.cups?.regional?.status || null,
      estadual:prevState.cups?.estadual?.status || null,
    },
    totalLeagueRounds: prevState.fixtures?.length || 38,
    finalTable: finalTable.map((row) => ({ ...row })),
  };
}

export function buildCareerSeasonEntry(gameData = {}, snapshot = buildSeasonSnapshot(gameData)) {
  return {
    season: snapshot.season,
    serie: snapshot.prevSerie,
    position: snapshot.userPos,
    pts: snapshot.pts,
    wins: snapshot.league.wins,
    draws: snapshot.league.draws,
    losses: snapshot.league.losses,
    topScorer: snapshot.squad.topScorer?.name || null,
    money: Number(gameData.club?.money) || 0,
    cupResult: snapshot.cupResult,
    cupResults:{ ...(snapshot.cupResults || {}) },
  };
}

export function isSeasonScheduleComplete(gameData = {}) {
  const calendar = gameData.calendar;
  if (Array.isArray(calendar) && calendar.length > 0) {
    return (Number(gameData.round) || 0) >= calendar.length;
  }
  const totalLeagueRounds = gameData.fixtures?.length || 38;
  const playedLeagueRounds = Number(gameData.leagueRound ?? gameData.round) || 0;
  return playedLeagueRounds >= totalLeagueRounds;
}

export { seasonGoals };

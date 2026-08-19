import { FinanceEngine } from '../engine_finances.js';
import { parseLeagueResult, rebuildLeagueTable, calcTeamRecentForm } from '../engine.js';
import { isUserMatchTeam } from './matchStateUtils.js';
import { simulateMatch } from './matchSimulator.js';

const cloneMatch = (match) => ({
  ...match,
  home: match.home ? { ...match.home } : match.home,
  away: match.away ? { ...match.away } : match.away,
  events: Array.isArray(match.events) ? [...match.events] : match.events,
});

export function simulateLeagueRound({ gameData, leagueIdx, tactics, starters, rng = Math.random }) {
  const sourceMatches = gameData.fixtures?.[leagueIdx] || [];
  if (!sourceMatches.length) return { empty: true, leagueIdx };

  const playedFlags = sourceMatches.map((match) => match?.played === true && Boolean(parseLeagueResult(match?.result)));
  if (playedFlags.every(Boolean)) {
    return {
      empty: false,
      alreadyPlayed: true,
      leagueIdx,
      currentMatches: sourceMatches.map(cloneMatch),
      fixtures: gameData.fixtures || [],
      table: rebuildLeagueTable(gameData.table || [], gameData.fixtures || []),
    };
  }
  if (playedFlags.some(Boolean) || sourceMatches.some((match) => match?.played === true)) {
    throw new Error(`Rodada ${Number(leagueIdx) + 1} está parcialmente processada e não pode ser simulada novamente.`);
  }

  const currentMatches = sourceMatches.map(cloneMatch);
  const oldPositions = Object.fromEntries((gameData.table || []).map((team, index) => [team.id, index + 1]));
  const allRawEvents = [];
  let userMatchData = null;
  let ticketIncome = 0;
  let userMatchIndex = -1;
  let userRawEventRange = null;

  currentMatches.forEach((match, matchIndex) => {
    const clubName = gameData.club?.name || '';
    const homeIsUser = isUserMatchTeam(match.home, clubName);
    const awayIsUser = isUserMatchTeam(match.away, clubName);
    if (homeIsUser || awayIsUser) {
      match.home = match.home ? { ...match.home, isPlayer: homeIsUser } : match.home;
      match.away = match.away ? { ...match.away, isPlayer: awayIsUser } : match.away;
    }

    const result = simulateMatch(gameData, match, tactics, starters, gameData.players || [], { rng });
    match.played = true;
    match.result = `${result.homeGoals} - ${result.awayGoals}`;
    match.events = result.events;
    const matchRawEvents = Array.isArray(result.rawEvents) ? result.rawEvents : [];
    const rawStart = allRawEvents.length;
    allRawEvents.push(...matchRawEvents);

    if (homeIsUser || awayIsUser) {
      userMatchIndex = matchIndex;
      userRawEventRange = { start: rawStart, count: matchRawEvents.length };
      let attendance = 0;
      if (FinanceEngine?.calculateMatchFinances) {
        const financeGameData = { ...gameData, leagueRound: leagueIdx + 1 };
        const finances = FinanceEngine.calculateMatchFinances(match.home, match.away, financeGameData, { rng });
        attendance = finances.attendance;
        ticketIncome = finances.ticketRevenue;
      }
      userMatchData = {
        ...result,
        userIsHome: homeIsUser,
        isCupMatch: false,
        homeName: match.home?.name,
        awayName: match.away?.name,
        homeId: match.home?.id,
        awayId: match.away?.id,
        homeIsPlayer: Boolean(match.home?.isPlayer),
        awayIsPlayer: Boolean(match.away?.isPlayer),
        attendance,
        income: ticketIncome,
        leagueRound: leagueIdx + 1,
        calendarRound: (gameData.round || 0) + 1,
        preMatchTable: (gameData.table || []).map((row) => ({ ...row })),
      };
    }

  });

  const fixtures = (gameData.fixtures || []).map((round, index) => (
    index === leagueIdx ? currentMatches : round
  ));
  const displayRound = Number.isFinite(Number(leagueIdx))
    ? Number(leagueIdx) + 1
    : (Number(gameData.leagueRound ?? gameData.round) || 0) + 1;
  const table = rebuildLeagueTable(gameData.table || [], fixtures).map((team, index) => ({
    ...team,
    posVariation: (oldPositions[team.id] || index + 1) - (index + 1),
    recentForm: calcTeamRecentForm(team.id, fixtures, displayRound) || team.recentForm || [],
  }));

  return {
    empty: false,
    leagueIdx,
    currentMatches,
    fixtures,
    table,
    userMatchData,
    allRawEvents,
    ticketIncome,
    userMatchIndex,
    userRawEventRange,
  };
}

export function applyResolvedLeagueMatchData(leagueRound = {}, liveMatchData = null) {
  if (!liveMatchData || typeof liveMatchData !== 'object') return leagueRound;
  const matchIndex = Number(leagueRound?.userMatchIndex);
  if (!Number.isInteger(matchIndex) || matchIndex < 0) {
    return { ...leagueRound, userMatchData:{ ...(leagueRound?.userMatchData || {}), ...liveMatchData } };
  }

  const resolvedEvents = Array.isArray(liveMatchData.events) ? [...liveMatchData.events] : [];
  const resolvedRawEvents = Array.isArray(liveMatchData.rawEvents)
    ? liveMatchData.rawEvents.map((event) => (event && typeof event === 'object' ? { ...event } : event))
    : [];
  const homeGoals = Number(liveMatchData.homeGoals);
  const awayGoals = Number(liveMatchData.awayGoals);
  const hasResolvedScore = Number.isInteger(homeGoals) && homeGoals >= 0 && Number.isInteger(awayGoals) && awayGoals >= 0;
  const resolvedResult = hasResolvedScore ? `${homeGoals} - ${awayGoals}` : null;

  const currentMatches = (Array.isArray(leagueRound.currentMatches) ? leagueRound.currentMatches : []).map((match, index) => (
    index === matchIndex
      ? { ...match, events:resolvedEvents, ...(resolvedResult ? { result:resolvedResult, played:true } : {}) }
      : match
  ));
  const leagueIdx = Number(leagueRound.leagueIdx);
  const fixtures = (Array.isArray(leagueRound.fixtures) ? leagueRound.fixtures : []).map((round, index) => {
    if (index !== leagueIdx || !Array.isArray(round)) return round;
    return round.map((match, innerIndex) => (
      innerIndex === matchIndex
        ? { ...match, events:resolvedEvents, ...(resolvedResult ? { result:resolvedResult, played:true } : {}) }
        : match
    ));
  });

  const range = leagueRound.userRawEventRange;
  let allRawEvents = Array.isArray(leagueRound.allRawEvents) ? [...leagueRound.allRawEvents] : [];
  if (range && Number.isInteger(Number(range.start)) && Number.isInteger(Number(range.count))) {
    const start = Math.max(0, Number(range.start));
    const count = Math.max(0, Number(range.count));
    allRawEvents = [
      ...allRawEvents.slice(0, start),
      ...resolvedRawEvents,
      ...allRawEvents.slice(start + count),
    ];
  }

  const preMatchTable = leagueRound.userMatchData?.preMatchTable || leagueRound.table || [];
  const oldPositions = Object.fromEntries((preMatchTable || []).map((team, index) => [team.id, index + 1]));
  const displayRound = Number.isFinite(leagueIdx) ? leagueIdx + 1 : 1;
  const table = rebuildLeagueTable(preMatchTable, fixtures).map((team, index) => ({
    ...team,
    posVariation: (oldPositions[team.id] || index + 1) - (index + 1),
    recentForm: calcTeamRecentForm(team.id, fixtures, displayRound) || team.recentForm || [],
  }));

  return {
    ...leagueRound,
    currentMatches,
    fixtures,
    table,
    allRawEvents,
    userMatchData:{
      ...(leagueRound.userMatchData || {}),
      ...liveMatchData,
      ...(hasResolvedScore ? { homeGoals, awayGoals } : {}),
      events:resolvedEvents,
      rawEvents:resolvedRawEvents,
    },
    userRawEventRange: range ? { start:Number(range.start), count:resolvedRawEvents.length } : range,
  };
}

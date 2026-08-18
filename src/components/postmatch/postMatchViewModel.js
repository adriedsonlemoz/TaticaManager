import {
  getMatchEventKind,
  parseMatchCardEvent,
  parseMatchGoalEvent,
} from '../../engines/match/matchEventViewModel.js';
import { FinanceEngine } from '../../engines/engine_finances.js';
import {
  getFinalPossession,
  getMatchFinalScore,
  getMatchResultMeta,
} from '../../engines/match/matchPresentationViewModel.js';

const nonNegativeInt = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
};

export const getPostMatchFinalScore = (matchResultData = {}, liveScore = {}) => {
  const officialHome = matchResultData?.homeGoals;
  const officialAway = matchResultData?.awayGoals;
  return getMatchFinalScore(matchResultData, {
    home:officialHome != null && Number.isFinite(Number(officialHome)) ? officialHome : liveScore?.home,
    away:officialAway != null && Number.isFinite(Number(officialAway)) ? officialAway : liveScore?.away,
  });
};

export const getPostMatchRoundContext = ({ gameData = {}, matchResultData = {} } = {}) => {
  const rawPlayed = Number(matchResultData?.calendarRound ?? gameData?.round ?? 1);
  const playedCalendarRound = Number.isFinite(rawPlayed) ? Math.max(1, Math.trunc(rawPlayed)) : 1;
  return {
    playedCalendarRound,
    matchCalendarIndex:Math.max(0, playedCalendarRound - 1),
    nextCalendarRound:playedCalendarRound + 1,
  };
};

export const getPostMatchFinanceEntry = ({ financialHistory = [], playedRound, isCupMatch = false } = {}) => {
  if (!Array.isArray(financialHistory)) return null;
  const round = Number(playedRound);
  if (!Number.isFinite(round)) return null;
  const expectedCompetition = isCupMatch ? 'cup' : 'league';
  return financialHistory.find((entry) => (
    Number(entry?.round) === round
    && (!entry?.competition || entry.competition === expectedCompetition)
  )) || null;
};


export const getPostMatchFinanceFallback = ({ gameData = {}, matchResultData = {}, cupEvents = [] } = {}) => {
  const number = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const isCupMatch = Boolean(matchResultData?.isCupMatch);
  const leagueRound = Math.max(1, Math.trunc(Number(matchResultData?.leagueRound ?? gameData?.leagueRound) || 1));
  const totalLeagueRounds = Math.max(1, Number(gameData?.fixtures?.length) || 38);
  const ticket = number(matchResultData?.income);
  const tv = isCupMatch ? 0 : number(
    FinanceEngine?.getTVRights?.(gameData?.serie || 'D', leagueRound, totalLeagueRounds),
  );
  const sponsor = isCupMatch ? 0 : number(
    (gameData?.club?.sponsors?.master?.roundValue || 0)
    + (gameData?.club?.sponsors?.stadium?.roundValue || 0),
  );
  const cup = isCupMatch
    ? (Array.isArray(cupEvents) ? cupEvents : []).reduce((sum, event) => sum + number(event?.earned), 0)
    : 0;
  return { ticket, tv, sponsor, cup, income:ticket + tv + sponsor + cup };
};

export const isPostMatchUserTeam = (team, gameData = {}) => {
  if (!team) return false;
  const clubName = String(gameData?.club?.name || '').trim();
  return team?.id === 'user'
    || team?.isPlayer === true
    || Boolean(clubName && String(team?.name || '').trim() === clubName);
};

export const getPostMatchResultMeta = ({ gameData = {}, matchResultData = {}, liveScore = {} } = {}) => {
  const score = getPostMatchFinalScore(matchResultData, liveScore);
  const meta = getMatchResultMeta({ gameData, matchResultData, liveScore:score });
  return {
    isUserHome: meta.isUserHome,
    resultLabel: meta.result === 'win' ? 'VITÓRIA' : meta.result === 'loss' ? 'DERROTA' : 'EMPATE',
    resultKind: meta.result,
    score,
  };
};

export const parsePostMatchGoal = (event, homeName, awayName = '') => {
  const parsed = parseMatchGoalEvent(event, homeName, awayName);
  return {
    min: parsed.minuteLabel || parsed.minute || '',
    scorer: parsed.scorer,
    isHome: parsed.side === 'home',
    isOwnGoal: parsed.isOwnGoal,
    isPenalty: parsed.isPenalty,
  };
};

export const parsePostMatchCard = (event, homeName, awayName) => {
  const parsed = parseMatchCardEvent(event, homeName, awayName);
  return {
    min: parsed.minuteLabel || parsed.minute || '',
    player: parsed.player,
    team: parsed.teamName,
    side: parsed.side,
    kind: parsed.kind,
  };
};

export const buildPostMatchEventGroups = (events = []) => {
  const groups = { goals: [], yellows: [], reds: [] };
  if (!Array.isArray(events)) return groups;

  events.forEach((event) => {
    if (typeof event !== 'string' || !event.trim()) return;
    const kind = getMatchEventKind(event);
    if (kind === 'goal') groups.goals.push(event);
    else if (kind === 'yellow') groups.yellows.push(event);
    else if (kind === 'red') groups.reds.push(event);
  });
  return groups;
};

const countCardsBySide = (events, homeName, awayName) => (
  (Array.isArray(events) ? events : []).reduce((counts, event) => {
    const parsed = parseMatchCardEvent(event, homeName, awayName);
    if (parsed.side === 'home') counts.home += 1;
    if (parsed.side === 'away') counts.away += 1;
    return counts;
  }, { home:0, away:0 })
);

export const buildPostMatchStats = ({ matchResultData = {}, liveScore = {}, possession = {}, events } = {}) => {
  const score = getPostMatchFinalScore(matchResultData, liveScore);
  const homeGoals = score.home;
  const awayGoals = score.away;
  const homeShots = Math.max(homeGoals, nonNegativeInt(matchResultData?.homeShots));
  const awayShots = Math.max(awayGoals, nonNegativeInt(matchResultData?.awayShots));
  const fallbackHomeOnTarget = Math.round(homeShots * 0.4);
  const fallbackAwayOnTarget = Math.round(awayShots * 0.4);
  const homeOnTarget = Math.min(homeShots, Math.max(homeGoals, nonNegativeInt(matchResultData?.homeOnTarget, fallbackHomeOnTarget)));
  const awayOnTarget = Math.min(awayShots, Math.max(awayGoals, nonNegativeInt(matchResultData?.awayOnTarget, fallbackAwayOnTarget)));
  const groups = buildPostMatchEventGroups(events ?? matchResultData?.events);
  const yellows = countCardsBySide(groups.yellows, matchResultData?.homeName, matchResultData?.awayName);
  const reds = countCardsBySide(groups.reds, matchResultData?.homeName, matchResultData?.awayName);

  return {
    score,
    homeShots,
    awayShots,
    homeOnTarget,
    awayOnTarget,
    homeCorners: nonNegativeInt(matchResultData?.homeCorners, Math.max(0, Math.round(homeShots * 0.35))),
    awayCorners: nonNegativeInt(matchResultData?.awayCorners, Math.max(0, Math.round(awayShots * 0.35))),
    homeFouls: nonNegativeInt(matchResultData?.homeFouls),
    awayFouls: nonNegativeInt(matchResultData?.awayFouls),
    homeYellows: yellows.home,
    awayYellows: yellows.away,
    homeReds: reds.home,
    awayReds: reds.away,
    possession: getFinalPossession(matchResultData, possession),
  };
};

export const getLeaguePositionChange = ({ gameData = {}, sortedTable = [], isCupMatch = false } = {}) => {
  if (isCupMatch || !Array.isArray(sortedTable) || !sortedTable.length) return null;
  const positionIndex = sortedTable.findIndex((team) => isPostMatchUserTeam(team, gameData));
  if (positionIndex < 0) return null;

  const row = sortedTable[positionIndex];
  const rawDelta = Number(row?.posVariation);
  const delta = Number.isFinite(rawDelta) ? Math.trunc(rawDelta) : 0;
  const posAfter = positionIndex + 1;
  const posBefore = Math.max(1, Math.min(sortedTable.length, posAfter + delta));

  return { posBefore, posAfter, delta: posBefore - posAfter };
};

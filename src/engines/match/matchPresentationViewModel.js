import { buildLiveEventMeta } from './matchEventViewModel.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finiteNumber = (value) => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const safeScore = (value) => Math.max(0, Math.trunc(finiteNumber(value) ?? 0));
const playerIdKey = (value) => value == null ? null : String(value);

export const getMatchFinalScore = (matchResultData = {}, liveScore = {}) => {
  const liveHome = finiteNumber(liveScore?.home);
  const liveAway = finiteNumber(liveScore?.away);
  const officialHome = finiteNumber(matchResultData?.homeGoals);
  const officialAway = finiteNumber(matchResultData?.awayGoals);

  return {
    home: safeScore(liveHome ?? officialHome),
    away: safeScore(liveAway ?? officialAway),
  };
};

const normalizePossession = (homeValue, awayValue, fallback = { home: 50, away: 50 }) => {
  const home = finiteNumber(homeValue);
  const away = finiteNumber(awayValue);

  if (home != null && away != null) {
    const safeHome = clamp(home, 0, 100);
    const safeAway = clamp(away, 0, 100);
    const total = safeHome + safeAway;
    if (total > 0) {
      const normalizedHome = Math.round((safeHome / total) * 100);
      return { home: normalizedHome, away: 100 - normalizedHome };
    }
  }
  if (home != null) {
    const safeHome = Math.round(clamp(home, 0, 100));
    return { home: safeHome, away: 100 - safeHome };
  }
  if (away != null) {
    const safeAway = Math.round(clamp(away, 0, 100));
    return { home: 100 - safeAway, away: safeAway };
  }

  const fallbackHome = finiteNumber(fallback?.home);
  const fallbackAway = finiteNumber(fallback?.away);
  if (fallbackHome != null && fallbackAway != null) {
    const safeHome = clamp(fallbackHome, 0, 100);
    const safeAway = clamp(fallbackAway, 0, 100);
    const total = safeHome + safeAway;
    if (total > 0) {
      const normalizedHome = Math.round((safeHome / total) * 100);
      return { home: normalizedHome, away: 100 - normalizedHome };
    }
    return { home: 50, away: 50 };
  }
  if (fallbackHome != null) {
    const safeHome = Math.round(clamp(fallbackHome, 0, 100));
    return { home: safeHome, away: 100 - safeHome };
  }
  if (fallbackAway != null) {
    const safeAway = Math.round(clamp(fallbackAway, 0, 100));
    return { home: 100 - safeAway, away: safeAway };
  }
  return { home: 50, away: 50 };
};

const normalizedTeamName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
const isUserId = (value) => String(value ?? '').trim().toLowerCase() === 'user';

export const getUserMatchSide = (gameData = {}, matchResultData = {}) => {
  if (matchResultData?.userSide === 'home' || matchResultData?.userSide === 'away') return matchResultData.userSide;
  if (typeof matchResultData?.userIsHome === 'boolean') return matchResultData.userIsHome ? 'home' : 'away';

  const homeMarked = matchResultData?.homeIsPlayer === true || matchResultData?.home?.isPlayer === true || isUserId(matchResultData?.homeId ?? matchResultData?.home?.id);
  const awayMarked = matchResultData?.awayIsPlayer === true || matchResultData?.away?.isPlayer === true || isUserId(matchResultData?.awayId ?? matchResultData?.away?.id);
  if (homeMarked !== awayMarked) return homeMarked ? 'home' : 'away';

  const clubName = normalizedTeamName(gameData?.club?.name);
  if (!clubName) return null;
  const homeName = normalizedTeamName(matchResultData?.homeName ?? matchResultData?.home?.name);
  const awayName = normalizedTeamName(matchResultData?.awayName ?? matchResultData?.away?.name);
  const homeMatches = homeName === clubName;
  const awayMatches = awayName === clubName;
  if (homeMatches !== awayMatches) return homeMatches ? 'home' : 'away';
  return null;
};

export const getMatchCompetitionLabel = (gameData = {}, matchResultData = {}) => {
  if (matchResultData?.isCupMatch) {
    const leg = matchResultData.cupLeg === 'leg1'
      ? 'Jogo de Ida'
      : matchResultData.cupLeg === 'leg2'
        ? 'Jogo de Volta'
        : matchResultData.cupLeg || 'Jogo Único';
    return `${matchResultData.cupLabel || '🏆 Copa'} · ${leg}`;
  }
  const round = finiteNumber(matchResultData?.leagueRound) ?? finiteNumber(gameData?.leagueRound) ?? 1;
  return `Série ${gameData?.serie || '?'} · Rod ${Math.max(1, Math.trunc(round))}`;
};

export const getMatchResultMeta = ({ gameData = {}, matchResultData = {}, liveScore = {} } = {}) => {
  const userSide = getUserMatchSide(gameData, matchResultData);
  const { home: homeScore, away: awayScore } = getMatchFinalScore(matchResultData, liveScore);
  const userScore = userSide === 'home' ? homeScore : userSide === 'away' ? awayScore : 0;
  const opponentScore = userSide === 'home' ? awayScore : userSide === 'away' ? homeScore : 0;
  return {
    userSide,
    isUserHome: userSide === 'home',
    userScore,
    opponentScore,
    result: userScore > opponentScore ? 'win' : userScore < opponentScore ? 'loss' : 'draw',
  };
};

export const updateLivePossession = (previous = { home: 50, away: 50 }, event, context = {}, rng = Math.random) => {
  const current = normalizePossession(previous?.home, previous?.away);
  const meta = buildLiveEventMeta(event, context);
  if (!meta.side || meta.kind === 'end' || meta.kind === 'sub') return current;

  const randomValue = clamp(finiteNumber(rng?.()) ?? 0.5, 0, 0.999999);
  const step = Math.floor(randomValue * 4) + 1;
  const home = meta.side === 'home'
    ? clamp(current.home + step, 28, 72)
    : clamp(current.home - step, 28, 72);
  return { home, away: 100 - home };
};

export const getFinalPossession = (matchResultData = {}, fallback = { home: 50, away: 50 }) => (
  normalizePossession(matchResultData?.homePoss, matchResultData?.awayPoss, fallback)
);

export const buildInitialLiveUserPlayers = (gameData = {}, matchResultData = {}) => {
  const userSide = getUserMatchSide(gameData, matchResultData);
  const roster = userSide ? matchResultData?.rosters?.[userSide] : null;
  const activeIds = userSide && Array.isArray(matchResultData?.activeLineups?.[userSide])
    ? matchResultData.activeLineups[userSide]
    : [];
  const ids = new Set(activeIds.map(playerIdKey).filter(Boolean));
  const source = Array.isArray(roster) && roster.length ? roster : (Array.isArray(gameData?.players) ? gameData.players : []);

  return source.map((player) => ({
    ...player,
    isStarting: ids.size ? ids.has(playerIdKey(player?.id)) : Boolean(player?.isStarting),
  }));
};

export const applyLiveSubstitution = (players = [], outgoingId, incomingId) => {
  if (!Array.isArray(players)) return [];
  const outgoingKey = playerIdKey(outgoingId);
  const incomingKey = playerIdKey(incomingId);
  if (!outgoingKey || !incomingKey || outgoingKey === incomingKey) return players;

  const hasOutgoing = players.some((player) => playerIdKey(player?.id) === outgoingKey);
  const hasIncoming = players.some((player) => playerIdKey(player?.id) === incomingKey);
  if (!hasOutgoing || !hasIncoming) return players;

  return players.map((player) => {
    const key = playerIdKey(player?.id);
    if (key === outgoingKey) return { ...player, isStarting: false };
    if (key === incomingKey) return { ...player, isStarting: true };
    return player;
  });
};

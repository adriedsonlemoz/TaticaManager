import {
  getGoalScoreFromEvents,
  getGoalScoringSide,
  getMatchEventKind,
  getMatchEventMinute,
  getMatchEventTeam,
} from './matchEventViewModel.js';

const SCORE_TYPES = new Set(['goal', 'penalty_goal', 'own_goal']);
const RED_TYPES = new Set(['red', 'red_direct', 'red_second_yellow']);

const cloneRawEvent = (event) => {
  if (!event || typeof event !== 'object') return event;
  return {
    ...event,
    scorerObj: event.scorerObj ? { ...event.scorerObj } : event.scorerObj,
    ownGoalByObj: event.ownGoalByObj ? { ...event.ownGoalByObj } : event.ownGoalByObj,
    changes: Array.isArray(event.changes) ? event.changes.map((change) => ({ ...change })) : event.changes,
  };
};

const idKey = (value) => value == null ? null : String(value);
const nameKey = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const finiteInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
};

const sideFromIdentity = (matchData = {}, teamId, teamName) => {
  const id = idKey(teamId);
  const homeId = idKey(matchData?.homeId);
  const awayId = idKey(matchData?.awayId);
  if (id != null && homeId != null && id === homeId) return 'home';
  if (id != null && awayId != null && id === awayId) return 'away';

  const name = nameKey(teamName);
  if (name && name === nameKey(matchData?.homeName)) return 'home';
  if (name && name === nameKey(matchData?.awayName)) return 'away';
  return null;
};

const getUserSide = (matchData = {}) => {
  if (matchData?.userSide === 'home' || matchData?.userSide === 'away') return matchData.userSide;
  if (typeof matchData?.userIsHome === 'boolean') return matchData.userIsHome ? 'home' : 'away';
  if (matchData?.homeIsPlayer === true && matchData?.awayIsPlayer !== true) return 'home';
  if (matchData?.awayIsPlayer === true && matchData?.homeIsPlayer !== true) return 'away';
  return null;
};

export const getStructuredEventSide = (matchData = {}, rawEvent = null, narration = '') => {
  if (rawEvent && typeof rawEvent === 'object') {
    const byIdentity = sideFromIdentity(matchData, rawEvent.teamId, rawEvent.teamName);
    if (byIdentity) return byIdentity;

    const userSide = getUserSide(matchData);
    if (typeof rawEvent.isPlayer === 'boolean' && userSide) {
      return rawEvent.isPlayer ? userSide : (userSide === 'home' ? 'away' : 'home');
    }
  }
  return getMatchEventTeam(narration, matchData?.homeName, matchData?.awayName);
};

const getScoringSide = (matchData, rawEvent, narration) => {
  if (rawEvent && typeof rawEvent === 'object' && SCORE_TYPES.has(rawEvent.type)) {
    // Em own_goal, teamId/teamName já apontam para a equipe beneficiada.
    const side = getStructuredEventSide(matchData, rawEvent, narration);
    if (side) return side;
  }
  return getGoalScoringSide(narration, matchData?.homeName, matchData?.awayName);
};

const cloneLineups = (activeLineups = {}) => ({
  home: Array.isArray(activeLineups?.home) ? [...activeLineups.home] : [],
  away: Array.isArray(activeLineups?.away) ? [...activeLineups.away] : [],
});

const emptyCounts = () => ({
  goals: { home: 0, away: 0 },
  yellows: { home: 0, away: 0 },
  reds: { home: 0, away: 0 },
  substitutions: { home: 0, away: 0 },
});

const cloneCounts = (counts) => ({
  goals: { ...counts.goals },
  yellows: { ...counts.yellows },
  reds: { ...counts.reds },
  substitutions: { ...counts.substitutions },
});

const getRawMinute = (rawEvent, narration) => {
  const rawMinute = Number(rawEvent?.min);
  if (Number.isFinite(rawMinute)) return Math.max(0, Math.min(120, Math.trunc(rawMinute)));
  const parsed = getMatchEventMinute(narration);
  return parsed == null ? null : Math.max(0, Math.min(120, Math.trunc(parsed)));
};

const buildEndNarration = (matchData, narration, score) => {
  const prefix = String(narration ?? '').trimStart().match(/^(\d+(?:\+\d+)?'?(?:\+)?)\s*/)?.[1] || "90'+";
  return `${prefix} FIM DE JOGO: ${matchData?.homeName || 'Mandante'} ${score.home} x ${score.away} ${matchData?.awayName || 'Visitante'}`;
};

const normalizeStatsToScore = (matchData, score) => {
  const homeShots = Math.max(score.home, finiteInt(matchData?.homeShots));
  const awayShots = Math.max(score.away, finiteInt(matchData?.awayShots));
  const homeOnTarget = Math.min(homeShots, Math.max(score.home, finiteInt(matchData?.homeOnTarget)));
  const awayOnTarget = Math.min(awayShots, Math.max(score.away, finiteInt(matchData?.awayOnTarget)));
  return { homeShots, awayShots, homeOnTarget, awayOnTarget };
};

const normalizePossession = (homeValue, awayValue) => {
  const home = Number(homeValue);
  const away = Number(awayValue);
  if (Number.isFinite(home) && Number.isFinite(away) && home + away > 0) {
    const normalizedHome = Math.round((Math.max(0, home) / (Math.max(0, home) + Math.max(0, away))) * 100);
    return { home: normalizedHome, away: 100 - normalizedHome };
  }
  if (Number.isFinite(home)) {
    const safeHome = Math.max(0, Math.min(100, Math.round(home)));
    return { home:safeHome, away:100-safeHome };
  }
  if (Number.isFinite(away)) {
    const safeAway = Math.max(0, Math.min(100, Math.round(away)));
    return { home:100-safeAway, away:safeAway };
  }
  return { home:50, away:50 };
};

const buildCanonicalStatistics = (matchData, score, counts) => {
  const shots = normalizeStatsToScore(matchData, score);
  const possession = normalizePossession(matchData?.homePoss, matchData?.awayPoss);
  return {
    ...shots,
    homeCorners: finiteInt(matchData?.homeCorners),
    awayCorners: finiteInt(matchData?.awayCorners),
    homeFouls: finiteInt(matchData?.homeFouls),
    awayFouls: finiteInt(matchData?.awayFouls),
    homePoss: possession.home,
    awayPoss: possession.away,
    homeYellows: counts.yellows.home,
    awayYellows: counts.yellows.away,
    homeReds: counts.reds.home,
    awayReds: counts.reds.away,
    homeSubstitutions: counts.substitutions.home,
    awaySubstitutions: counts.substitutions.away,
  };
};

export function createCanonicalLiveMatchState(matchData = {}, initialActiveLineups = {}) {
  let status = 'prepared';
  let minute = 0;
  let activeLineups = cloneLineups(initialActiveLineups);
  const events = [];
  const rawEvents = [];
  const score = { home: 0, away: 0 };
  const counts = emptyCounts();

  const setStatus = (nextStatus, nextMinute = null) => {
    status = String(nextStatus || status);
    if (Number.isFinite(Number(nextMinute))) minute = Math.max(0, Math.min(120, Math.trunc(Number(nextMinute))));
    return getSnapshot();
  };

  const setActiveLineups = (nextLineups) => {
    activeLineups = cloneLineups(nextLineups);
    return getSnapshot();
  };

  const appendResolvedEvent = ({ narration = '', rawEvent = null, nextActiveLineups = null } = {}) => {
    let text = String(narration ?? '').trim();
    let raw = cloneRawEvent(rawEvent);
    if (!text && (!raw || typeof raw !== 'object')) return getSnapshot();

    const type = String(raw?.type || getMatchEventKind(text) || 'neutral');
    const side = getStructuredEventSide(matchData, raw, text);
    const eventMinute = getRawMinute(raw, text);
    if (eventMinute != null) minute = Math.max(minute, eventMinute);

    if (SCORE_TYPES.has(type) || (!raw && getMatchEventKind(text) === 'goal')) {
      const scoringSide = getScoringSide(matchData, raw, text);
      if (scoringSide === 'home' || scoringSide === 'away') {
        score[scoringSide] += 1;
        counts.goals[scoringSide] += 1;
      }
    }

    if (type === 'yellow' && (side === 'home' || side === 'away')) counts.yellows[side] += 1;
    if (RED_TYPES.has(type) && (side === 'home' || side === 'away')) counts.reds[side] += 1;
    if (type === 'sub' && (side === 'home' || side === 'away')) counts.substitutions[side] += 1;

    if (type === 'end' || getMatchEventKind(text) === 'end') {
      status = 'finished';
      minute = Math.max(minute, 90);
      text = buildEndNarration(matchData, text, score);
      raw = raw && typeof raw === 'object'
        ? { ...raw, type: 'end', homeGoals: score.home, awayGoals: score.away }
        : { min: 90, type: 'end', homeGoals: score.home, awayGoals: score.away };
    }

    if (text) events.push(text);
    if (raw && typeof raw === 'object') rawEvents.push(raw);
    if (nextActiveLineups) activeLineups = cloneLineups(nextActiveLineups);
    return getSnapshot();
  };

  function getSnapshot() {
    return {
      status,
      minute,
      score: { ...score },
      events: [...events],
      rawEvents: rawEvents.map(cloneRawEvent),
      activeLineups: cloneLineups(activeLineups),
      counts: cloneCounts(counts),
      statistics: buildCanonicalStatistics(matchData, score, counts),
    };
  }

  const getResolvedMatchData = () => {
    const snapshot = getSnapshot();
    const stats = snapshot.statistics;
    return {
      ...matchData,
      ...stats,
      homeGoals: snapshot.score.home,
      awayGoals: snapshot.score.away,
      events: snapshot.events,
      rawEvents: snapshot.rawEvents,
      activeLineups: snapshot.activeLineups,
      liveState: {
        status: snapshot.status,
        minute: snapshot.minute,
        score: snapshot.score,
        counts: snapshot.counts,
      },
    };
  };

  return {
    appendResolvedEvent,
    getResolvedMatchData,
    getSnapshot,
    setActiveLineups,
    setStatus,
  };
}

export const buildLiveMatchIntegrityReport = (matchData = {}) => {
  const events = Array.isArray(matchData?.events) ? matchData.events : [];
  const rawEvents = Array.isArray(matchData?.rawEvents) ? matchData.rawEvents : [];
  const scoreFromRaw = rawEvents.reduce((score, rawEvent, index) => {
    if (!rawEvent || typeof rawEvent !== 'object' || !SCORE_TYPES.has(rawEvent.type)) return score;
    const side = getScoringSide(matchData, rawEvent, events[index] || '');
    if (side === 'home' || side === 'away') score[side] += 1;
    return score;
  }, { home: 0, away: 0 });
  const declared = {
    home: finiteInt(matchData?.homeGoals),
    away: finiteInt(matchData?.awayGoals),
  };
  const scoreFromNarration = getGoalScoreFromEvents(
    events,
    matchData?.homeName,
    matchData?.awayName,
  );
  const scoreMatches = declared.home === scoreFromRaw.home
    && declared.away === scoreFromRaw.away
    && declared.home === scoreFromNarration.home
    && declared.away === scoreFromNarration.away;
  const shotsValid = finiteInt(matchData?.homeShots) >= declared.home
    && finiteInt(matchData?.awayShots) >= declared.away
    && finiteInt(matchData?.homeOnTarget) >= declared.home
    && finiteInt(matchData?.awayOnTarget) >= declared.away;
  return {
    declared,
    scoreFromRaw,
    scoreFromNarration,
    scoreMatches,
    shotsValid,
    valid: scoreMatches && shotsValid,
  };
};

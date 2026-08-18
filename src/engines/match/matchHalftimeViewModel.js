import { canPlayAs } from '../lineup/lineupRules.js';
import {
  getGoalScoreFromEvents,
  getMatchEventBaseMinute,
  parseMatchCardEvent,
} from './matchEventViewModel.js';
import { isSimulationPlayerAvailable } from './matchSimulationRoster.js';
import {
  MAX_LIVE_SUBSTITUTIONS,
  livePlayerIdKey,
  normalizeLiveSubstitutions,
} from './matchSubstitutionViewModel.js';

const finiteNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const safeEnergy = (value) => Math.max(0, Math.min(100, finiteNumber(value, 100)));
const safeOverall = (value) => finiteNumber(value, 0);
const safeName = (value) => String(value ?? '').trim() || 'Jogador';

export const isFirstHalfMatchEvent = (event) => {
  const baseMinute = getMatchEventBaseMinute(event);
  return baseMinute != null && baseMinute <= 45;
};

export const buildHalftimeEventSummary = ({
  goalEvents = [],
  yellowEvents = [],
  homeName = '',
  awayName = '',
} = {}) => {
  const firstHalfGoals = (Array.isArray(goalEvents) ? goalEvents : []).filter(isFirstHalfMatchEvent);
  const firstHalfYellows = (Array.isArray(yellowEvents) ? yellowEvents : []).filter(isFirstHalfMatchEvent);
  const score = getGoalScoreFromEvents(firstHalfGoals, homeName, awayName);
  const yellowCards = firstHalfYellows.reduce((counts, event) => {
    const side = parseMatchCardEvent(event, homeName, awayName).side;
    if (side === 'home') counts.home += 1;
    if (side === 'away') counts.away += 1;
    return counts;
  }, { home: 0, away: 0 });

  return {
    goals: firstHalfGoals,
    yellows: firstHalfYellows,
    score,
    yellowCards,
  };
};

export const buildHalftimeSubstitutionSuggestions = ({
  players = [],
  subsDone = [],
  matchRound = 0,
  energyThreshold = 55,
  limit = 3,
} = {}) => {
  const roster = Array.isArray(players) ? players : [];
  const substitutions = normalizeLiveSubstitutions(subsDone);
  if (substitutions.length >= MAX_LIVE_SUBSTITUTIONS) return [];

  const subbedOutIds = new Set(
    substitutions
      .map((substitution) => livePlayerIdKey(substitution?.outId))
      .filter((key) => key != null),
  );
  const threshold = Math.max(0, Math.min(100, finiteNumber(energyThreshold, 55)));
  const maxSuggestions = Math.max(0, Math.trunc(finiteNumber(limit, 3)));

  return roster
    .filter((player) => player?.isStarting && !player?.liveUnavailable && safeEnergy(player?.energy) < threshold)
    .sort((left, right) => safeEnergy(left?.energy) - safeEnergy(right?.energy))
    .slice(0, maxSuggestions)
    .map((outgoing) => {
      const targetRole = outgoing?.adaptedPosition || outgoing?.position;
      const incoming = roster
        .filter((candidate) => {
          const candidateKey = livePlayerIdKey(candidate?.id);
          if (candidate?.isStarting || candidate?.liveUnavailable || candidateKey == null || subbedOutIds.has(candidateKey)) return false;
          if (!isSimulationPlayerAvailable(candidate, matchRound)) return false;
          return canPlayAs(candidate?.position, targetRole);
        })
        .sort((left, right) => safeOverall(right?.overall) - safeOverall(left?.overall))[0] || null;

      return {
        outgoing,
        incoming,
        energy: safeEnergy(outgoing?.energy),
        outgoingName: safeName(outgoing?.name).split(/\s+/).pop(),
        incomingName: incoming ? safeName(incoming?.name).split(/\s+/).pop() : '',
      };
    });
};

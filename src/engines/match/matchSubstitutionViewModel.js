import { canPlayAs } from '../lineup/lineupRules.js';
import { applyLiveSubstitution } from './matchPresentationViewModel.js';
import { isSimulationPlayerAvailable } from './matchSimulationRoster.js';

export const MAX_LIVE_SUBSTITUTIONS = 3;

export const livePlayerIdKey = (value) => value == null ? null : String(value);
export const livePlayerIdsEqual = (left, right) => {
  const leftKey = livePlayerIdKey(left);
  const rightKey = livePlayerIdKey(right);
  return leftKey != null && rightKey != null && leftKey === rightKey;
};

const safePlayerName = (value) => {
  const name = String(value ?? '').trim();
  return name || 'Jogador';
};

const firstName = (value) => safePlayerName(value).split(/\s+/)[0];
const safeOverall = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const normalizeLiveSubstitutions = (subsDone) => (
  Array.isArray(subsDone) ? subsDone.filter(Boolean) : []
);

export const getLiveSubstitutionMinute = ({ step, minute } = {}) => {
  if (step === 1) return { number: 45, label: 'HT', record: 'HT' };
  const parsed = Number(minute);
  const fallback = step === 2 ? 45 : 0;
  const safeMinute = Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
  const number = Math.max(step === 2 ? 45 : 0, Math.min(120, safeMinute));
  return { number, label: `${number}'`, record: String(number) };
};

export const getLiveSubstitutionSelection = ({
  players = [],
  subsDone = [],
  selectedStarter,
  matchRound = 0,
  limit = 5,
} = {}) => {
  const roster = Array.isArray(players) ? players : [];
  const substitutions = normalizeLiveSubstitutions(subsDone);
  const selectedPlayer = roster.find((player) => (
    player?.isStarting && livePlayerIdsEqual(player?.id, selectedStarter)
  )) || null;
  if (!selectedPlayer) return { selectedPlayer: null, targetRole: null, reserves: [] };

  const targetRole = selectedPlayer.adaptedPosition || selectedPlayer.position;
  const subbedOutIds = new Set(
    substitutions
      .map((substitution) => livePlayerIdKey(substitution?.outId))
      .filter((key) => key != null),
  );
  const maxCandidates = Number.isFinite(Number(limit)) ? Math.max(0, Math.trunc(Number(limit))) : 5;

  const reserves = roster
    .filter((candidate) => {
      const candidateKey = livePlayerIdKey(candidate?.id);
      if (candidate?.isStarting || candidate?.liveUnavailable || candidateKey == null || subbedOutIds.has(candidateKey)) return false;
      if (livePlayerIdsEqual(candidate?.id, selectedPlayer.id)) return false;
      if (!isSimulationPlayerAvailable(candidate, matchRound)) return false;
      return canPlayAs(candidate?.position, targetRole);
    })
    .sort((left, right) => safeOverall(right?.overall) - safeOverall(left?.overall))
    .slice(0, maxCandidates);

  return { selectedPlayer, targetRole, reserves };
};

export const buildLiveSubstitutionChange = ({
  players = [],
  subsDone = [],
  outgoingId,
  incomingId,
  matchRound = 0,
  step,
  minute,
  maxSubs = MAX_LIVE_SUBSTITUTIONS,
} = {}) => {
  const roster = Array.isArray(players) ? players : [];
  const substitutions = normalizeLiveSubstitutions(subsDone);
  const safeMaxSubs = Number.isFinite(Number(maxSubs)) ? Math.max(0, Math.trunc(Number(maxSubs))) : MAX_LIVE_SUBSTITUTIONS;
  if (substitutions.length >= safeMaxSubs) return null;

  const outgoing = roster.find((player) => player?.isStarting && livePlayerIdsEqual(player?.id, outgoingId));
  const incoming = roster.find((player) => !player?.isStarting && livePlayerIdsEqual(player?.id, incomingId));
  if (!outgoing || !incoming || outgoing?.liveUnavailable || incoming?.liveUnavailable || livePlayerIdsEqual(outgoing.id, incoming.id)) return null;

  const subbedOutIds = new Set(
    substitutions
      .map((substitution) => livePlayerIdKey(substitution?.outId))
      .filter((key) => key != null),
  );
  if (subbedOutIds.has(livePlayerIdKey(outgoing.id)) || subbedOutIds.has(livePlayerIdKey(incoming.id))) return null;
  if (!isSimulationPlayerAvailable(incoming, matchRound)) return null;

  const targetRole = outgoing.adaptedPosition || outgoing.position;
  if (!canPlayAs(incoming.position, targetRole)) return null;

  const substituted = applyLiveSubstitution(roster, outgoing.id, incoming.id);
  if (substituted === roster) return null;

  const nextPlayers = substituted.map((player) => {
    if (!livePlayerIdsEqual(player?.id, incoming.id)) return player;
    return {
      ...player,
      adaptedPosition: targetRole && targetRole !== player.position ? targetRole : null,
    };
  });
  const clock = getLiveSubstitutionMinute({ step, minute });
  const outgoingName = safePlayerName(outgoing.name);
  const incomingName = safePlayerName(incoming.name);

  return {
    players: nextPlayers,
    outgoing,
    incoming,
    targetRole,
    clock,
    record: {
      outId: outgoing.id,
      inId: incoming.id,
      out: firstName(outgoingName),
      in: firstName(incomingName),
      min: clock.record,
    },
    narration: `🔄 SUBSTITUIÇÃO: ↓ ${outgoingName} → ↑ ${incomingName}`,
  };
};

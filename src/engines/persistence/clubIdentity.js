import {
  canonicalClubId,
  canonicalClubName,
  resolveClub,
} from '../../data/clubCatalog.js';

const TEAM_ID_FIELDS = new Set([
  'teamId', 'originTeamId', 'previousTeamId', 'buyerTeamId', 'sourceTeamId',
  'userSourceTeamId', 'ownGoalTeamId', 'homeId', 'awayId', 'existingTeamId',
  'opponentId', 'offeringTeamId', 'sellerTeamId',
]);

const TEAM_NAME_FIELDS = new Set([
  'teamName', 'originTeamName', 'previousTeam', 'buyerTeamName', 'ownGoalTeamName',
  'homeName', 'awayName', 'opponentName', 'offeringTeamName', 'sellerTeamName',
]);

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const isPlayerLike = (value) => isObject(value) && (
  Object.hasOwn(value, 'position') || Object.hasOwn(value, 'overall') ||
  Object.hasOwn(value, 'wage') || Object.hasOwn(value, 'contract')
);

function mapTeamId(value) {
  if (value === null || value === undefined || value === '' || value === 'user') return value;
  return canonicalClubId(value);
}

function mapTeamName(value) {
  if (value === null || value === undefined || value === '' || value === 'Livre') return value;
  return canonicalClubName(value);
}

function normalizeTeamEntity(value) {
  if (!isObject(value) || isPlayerLike(value) || !Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'name')) return value;

  const rawId = value.id;
  const isUser = String(rawId) === 'user';
  if (isUser) return value;
  const resolved = resolveClub(value);
  if (!resolved) return value;

  return { ...value, id: resolved.id, name: resolved.name };
}

function deepNormalize(value) {
  if (Array.isArray(value)) return value.map(deepNormalize);
  if (!isObject(value)) return value;

  const next = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (TEAM_ID_FIELDS.has(key)) {
      next[key] = mapTeamId(raw);
      return;
    }
    if (TEAM_NAME_FIELDS.has(key)) {
      const idKey = ({ teamName:'teamId', originTeamName:'originTeamId', previousTeam:'previousTeamId', buyerTeamName:'buyerTeamId', ownGoalTeamName:'ownGoalTeamId', homeName:'homeId', awayName:'awayId', opponentName:'opponentId', offeringTeamName:'offeringTeamId', sellerTeamName:'sellerTeamId' })[key];
      next[key] = idKey && String(value[idKey]) === 'user' ? raw : mapTeamName(raw);
      return;
    }
    next[key] = deepNormalize(raw);
  });
  return normalizeTeamEntity(next);
}

function normalizeRosterMap(teamRosters = {}) {
  const next = {};
  Object.entries(isObject(teamRosters) ? teamRosters : {}).forEach(([rawId, roster]) => {
    const teamId = rawId === 'user' ? 'user' : String(mapTeamId(rawId));
    const normalizedRoster = deepNormalize(Array.isArray(roster) ? roster : []);
    if (!Array.isArray(next[teamId]) || normalizedRoster.length > next[teamId].length) {
      next[teamId] = normalizedRoster;
    }
  });
  return next;
}

function normalizeTransferCounters(transfersFromTeam = {}) {
  const next = {};
  Object.entries(isObject(transfersFromTeam) ? transfersFromTeam : {}).forEach(([rawId, rawCount]) => {
    const teamId = String(mapTeamId(rawId));
    const count = Math.max(0, Math.trunc(Number(rawCount) || 0));
    if (!count) return;
    next[teamId] = (next[teamId] || 0) + count;
  });
  return next;
}

export function reconcileClubIdentity(input = {}) {
  const normalized = deepNormalize(input);
  const next = {
    ...normalized,
    teamRosters: normalizeRosterMap(normalized.teamRosters),
    transfersFromTeam: normalizeTransferCounters(normalized.transfersFromTeam),
  };

  const existingId = next.club?.existingTeamId;
  const existing = existingId && existingId !== 'user' ? resolveClub(existingId) : null;
  if (existing && next.club) {
    next.club = {
      ...next.club,
      teamId: mapTeamId(existingId),
      existingTeamId: existingId ? mapTeamId(existingId) : next.club.existingTeamId,
      name: existing.name,
    };
    next.players = (next.players || []).map((player) => ({
      ...player,
      teamId:'user',
      teamName:existing.name,
    }));
    if (Array.isArray(next.teamRosters?.user)) {
      next.teamRosters.user = next.teamRosters.user.map((player) => ({
        ...player,
        teamId:'user',
        teamName:existing.name,
      }));
    }
    next.teams = (next.teams || []).map((team) => String(team?.id) === 'user' ? { ...team, name:existing.name } : team);
    next.table = (next.table || []).map((team) => String(team?.id) === 'user' ? { ...team, name:existing.name } : team);
  }

  return next;
}

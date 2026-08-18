const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);

export const playerIdKey = (playerOrId) => {
  const value = typeof playerOrId === 'object' ? playerOrId?.id : playerOrId;
  return value === null || value === undefined ? null : String(value);
};

export const samePlayerId = (left, right) => {
  const a = playerIdKey(left);
  const b = playerIdKey(right);
  return a !== null && b !== null && a === b;
};

function normalizeContract(value, fallback = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
}

function normalizeWage(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export function normalizeOwnedPlayer(player = {}, teamId, teamName) {
  return {
    ...player,
    contract: normalizeContract(player.contract, 2),
    wage: normalizeWage(player.wage),
    teamId,
    teamName,
  };
}

export function normalizeFreeAgent(player = {}) {
  return {
    ...player,
    contract: normalizeContract(player.contract, 0),
    wage: normalizeWage(player.wage),
    teamId: null,
    teamName: 'Livre',
    originTeamId: null,
    originTeamName: null,
    isStarting: false,
    isListed: true,
  };
}

export function dedupePlayers(players = [], seen = new Set(), normalizer = (player) => player) {
  const result = [];
  (Array.isArray(players) ? players : []).forEach((player) => {
    const key = playerIdKey(player);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(normalizer(player));
  });
  return result;
}

function collectTeams(gameData = {}) {
  const map = new Map();
  const add = (teams) => (teams || []).forEach((team) => {
    if (!team || team.id === null || team.id === undefined || team.isPlayer || String(team.id) === 'user') return;
    const key = String(team.id);
    if (!map.has(key)) map.set(key, team);
  });
  add(gameData.teams);
  SERIES_KEYS.forEach((serie) => add(gameData.leagues?.[serie]));
  return map;
}

function syncTeamPool(pool = [], rosters = {}) {
  return (pool || []).map((team) => {
    if (!team || team.id === null || team.id === undefined || team.isPlayer || String(team.id) === 'user') return team;
    const roster = rosters[String(team.id)];
    return Array.isArray(roster) ? { ...team, squad: roster } : team;
  });
}

export function getPlayerOwnership(gameData = {}, playerId) {
  const key = playerIdKey(playerId);
  if (!key) return null;

  const userPlayer = (gameData.players || []).find((player) => playerIdKey(player) === key);
  if (userPlayer) return { type: 'user', teamId: 'user', teamName: gameData.club?.name || 'Meu Clube', player: userPlayer };

  const teams = collectTeams(gameData);
  for (const [teamKey, team] of teams) {
    const stored = gameData.teamRosters?.[teamKey] ?? gameData.teamRosters?.[team.id];
    const roster = Array.isArray(stored) ? stored : (team.squad || []);
    const player = roster.find((candidate) => playerIdKey(candidate) === key);
    if (player) return { type: 'cpu', teamId: team.id, teamName: team.name, player, team };
  }

  const freeAgent = (gameData.market || []).find((player) => playerIdKey(player) === key);
  if (freeAgent) return { type: 'free', teamId: null, teamName: 'Livre', player: freeAgent };
  return null;
}

export function removePlayerFromAllCpuRosters(gameData = {}, playerId) {
  const key = playerIdKey(playerId);
  if (!key) return { teamRosters: { ...(gameData.teamRosters || {}) }, teams: gameData.teams || [], leagues: gameData.leagues || {} };

  const teams = collectTeams(gameData);
  const nextRosters = { ...(gameData.teamRosters || {}) };
  Object.keys(nextRosters).forEach((teamKey) => {
    if (teamKey === 'user' || !Array.isArray(nextRosters[teamKey])) return;
    nextRosters[teamKey] = nextRosters[teamKey].filter((player) => playerIdKey(player) !== key);
  });
  teams.forEach((team, teamKey) => {
    const stored = nextRosters[teamKey] ?? nextRosters[team.id];
    const roster = Array.isArray(stored) ? stored : (team.squad || []);
    nextRosters[teamKey] = roster.filter((player) => playerIdKey(player) !== key);
  });

  return {
    teamRosters: nextRosters,
    teams: syncTeamPool(gameData.teams, nextRosters),
    leagues: Object.fromEntries(SERIES_KEYS.map((serie) => [serie, syncTeamPool(gameData.leagues?.[serie], nextRosters)])),
  };
}

export function reconcileTransferState(gameData = {}) {
  if (!gameData || typeof gameData !== 'object') return gameData;
  const clubName = gameData.club?.name || 'Meu Clube';
  const seen = new Set();

  const players = dedupePlayers(gameData.players, seen, (player) => normalizeOwnedPlayer(player, 'user', clubName));
  const teams = collectTeams(gameData);
  const teamRosters = { ...(gameData.teamRosters || {}) };

  teams.forEach((team, key) => {
    const stored = teamRosters[key] ?? teamRosters[team.id];
    const source = Array.isArray(stored) ? stored : (team.squad || []);
    teamRosters[key] = dedupePlayers(source, seen, (player) => normalizeOwnedPlayer(player, team.id, team.name));
  });
  // Rosters sem clube correspondente são resíduos de saves antigos. Manter esses
  // arrays criava uma segunda posse invisível para atletas já movidos.
  Object.keys(teamRosters).forEach((key) => {
    if (key === 'user') return;
    if (!teams.has(String(key))) delete teamRosters[key];
  });
  teamRosters.user = players;

  const marketSeen = new Set();
  const market = (gameData.market || []).reduce((result, player) => {
    const key = playerIdKey(player);
    if (!key || seen.has(key) || marketSeen.has(key)) return result;
    marketSeen.add(key);
    result.push(normalizeFreeAgent(player));
    return result;
  }, []);

  const nextTeams = syncTeamPool(gameData.teams, teamRosters);
  const nextLeagues = { ...(gameData.leagues || {}) };
  SERIES_KEYS.forEach((serie) => { nextLeagues[serie] = syncTeamPool(gameData.leagues?.[serie], teamRosters); });

  return {
    ...gameData,
    players,
    market,
    teamRosters,
    teams: nextTeams,
    leagues: nextLeagues,
    club: {
      ...(gameData.club || {}),
      wage: players.reduce((sum, player) => sum + normalizeWage(player.wage), 0),
    },
  };
}

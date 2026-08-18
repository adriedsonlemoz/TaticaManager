import { CLUB_CATALOG, getClubCatalogEntry, getPyramidSeriesTeams2026 } from '../../data/clubCatalog.js';

export const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);
const LEAGUE_SIZE = 20;
const MOVEMENT_SIZE = 4;

const idKey = (value) => value == null ? null : String(typeof value === 'object' ? value.id : value);
const isUserTeam = (team) => idKey(team) === 'user' || team?.isPlayer === true;
const cpuTargetForSerie = (serie, userSerie) => serie === userSerie ? LEAGUE_SIZE - 1 : LEAGUE_SIZE;
const cloneCpuTeam = (team) => ({ ...team, isPlayer:false });
const cloneReserveTeam = (team) => {
  const { squad, ...rest } = team || {};
  return { ...rest, isPlayer:false };
};

function uniqueTeams(teams = [], { excluded = new Set(), seen = new Set() } = {}) {
  const result = [];
  (Array.isArray(teams) ? teams : []).forEach((team) => {
    const key = idKey(team);
    if (!key || key === 'user' || excluded.has(key) || seen.has(key)) return;
    seen.add(key);
    result.push(cloneCpuTeam(team));
  });
  return result;
}

function catalogCandidates(excluded = new Set()) {
  return SERIES_KEYS.flatMap((serie) => getPyramidSeriesTeams2026(serie))
    .filter((team) => !excluded.has(String(team.id)))
    .map(cloneCpuTeam);
}

function currentCpuTeams(state = {}) {
  return (Array.isArray(state.teams) ? state.teams : []).filter((team) => team && !isUserTeam(team));
}

export function hasPersistentLeaguePyramid(state = {}) {
  const userSerie = SERIES_KEYS.includes(String(state?.serie || '').toUpperCase()) ? String(state.serie).toUpperCase() : 'A';
  const active = Array.isArray(state?.teams) ? state.teams : [];
  if (active.length !== LEAGUE_SIZE || active.filter(isUserTeam).length !== 1) return false;
  const leagueCount = SERIES_KEYS.reduce((sum, serie) => sum + (Array.isArray(state?.leagues?.[serie]) ? state.leagues[serie].length : 0), 0);
  if (leagueCount < 70) return false;
  const currentCpu = currentCpuTeams(state);
  return currentCpu.length === cpuTargetForSerie(userSerie, userSerie);
}

function buildNormalizedPools(state = {}) {
  const userSerie = SERIES_KEYS.includes(String(state?.serie || '').toUpperCase()) ? String(state.serie).toUpperCase() : 'A';
  const existingTeamId = state?.club?.existingTeamId ? String(state.club.existingTeamId) : null;
  const excluded = new Set(existingTeamId ? [existingTeamId] : []);
  const seen = new Set();
  const pools = { A:[], B:[], C:[], D:[] };
  const priority = [userSerie, ...SERIES_KEYS.filter((serie) => serie !== userSerie)];

  priority.forEach((serie) => {
    const source = serie === userSerie && currentCpuTeams(state).length
      ? currentCpuTeams(state)
      : (state?.leagues?.[serie] || []);
    pools[serie] = uniqueTeams(source, { excluded, seen }).slice(0, cpuTargetForSerie(serie, userSerie));
  });

  // Primeiro tenta preencher lacunas com clubes já persistidos em qualquer pool,
  // preservando carreiras antigas mesmo quando um save veio com uma série incompleta.
  const persistedCandidates = SERIES_KEYS.flatMap((serie) => state?.leagues?.[serie] || []);
  const reserveCandidates = [
    ...(Array.isArray(state?.pyramidReserve) ? state.pyramidReserve : []),
    ...persistedCandidates,
    ...catalogCandidates(excluded),
  ];

  SERIES_KEYS.forEach((serie) => {
    const target = cpuTargetForSerie(serie, userSerie);
    if (pools[serie].length >= target) return;
    for (const team of reserveCandidates) {
      const key = idKey(team);
      if (!key || key === 'user' || excluded.has(key) || seen.has(key)) continue;
      seen.add(key);
      pools[serie].push(cloneCpuTeam(team));
      if (pools[serie].length >= target) break;
    }
  });

  const activeIds = new Set(SERIES_KEYS.flatMap((serie) => pools[serie].map((team) => idKey(team))).filter(Boolean));
  const reserveSeen = new Set();
  const pyramidReserve = reserveCandidates.reduce((result, team) => {
    const key = idKey(team);
    if (!key || key === 'user' || excluded.has(key) || activeIds.has(key) || reserveSeen.has(key)) return result;
    reserveSeen.add(key);
    result.push(cloneReserveTeam(team));
    return result;
  }, []);

  return { pools, pyramidReserve, userSerie };
}

export function reconcileLeaguePyramid(state = {}) {
  if (!hasPersistentLeaguePyramid(state)) return state;
  const normalized = buildNormalizedPools(state);
  const valid = SERIES_KEYS.every((serie) => normalized.pools[serie].length === cpuTargetForSerie(serie, normalized.userSerie));
  if (!valid) return state;
  return {
    ...state,
    leagues: {
      ...(state.leagues || {}),
      ...normalized.pools,
    },
    pyramidReserve: normalized.pyramidReserve,
    leaguePyramidVersion: 1,
  };
}

function hashNoise(value) {
  const text = String(value ?? '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0x100000000;
}

export function rankCpuDivision(teams = [], season = 2026, serie = 'A') {
  return [...(Array.isArray(teams) ? teams : [])].sort((a, b) => {
    const strengthA = Number(a?.strength) || 60;
    const strengthB = Number(b?.strength) || 60;
    // Ruído determinístico por temporada evita uma tabela CPU congelada sem
    // consumir o RNG global usado por mercado, elencos e partidas.
    const scoreA = strengthA * 100 + hashNoise(`${season}|${serie}|${idKey(a)}`) * 850;
    const scoreB = strengthB * 100 + hashNoise(`${season}|${serie}|${idKey(b)}`) * 850;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR');
  });
}

function rankUserDivision(fullTeams = [], finalTable = []) {
  if (fullTeams.length !== LEAGUE_SIZE || !Array.isArray(finalTable) || finalTable.length !== LEAGUE_SIZE) return null;
  const byId = new Map(fullTeams.map((team) => [idKey(team), team]));
  const seen = new Set();
  const ranked = [];
  for (const row of finalTable) {
    const key = idKey(row);
    const team = byId.get(key);
    if (!key || !team || seen.has(key)) return null;
    seen.add(key);
    ranked.push(team);
  }
  return ranked.length === LEAGUE_SIZE ? ranked : null;
}

const withoutIds = (teams, removed) => teams.filter((team) => !removed.has(idKey(team)));
const top = (teams) => teams.slice(0, MOVEMENT_SIZE);
const bottom = (teams) => teams.slice(-MOVEMENT_SIZE);

function movementEntries(teams = [], from, to) {
  return teams.map((team) => ({ id:idKey(team), name:team?.name || '', from, to, isUser:isUserTeam(team) }));
}

export function advanceLeaguePyramid(prevState = {}, finalTable = []) {
  const normalizedState = reconcileLeaguePyramid(prevState);
  if (!hasPersistentLeaguePyramid(normalizedState)) return null;

  const prevSerie = String(normalizedState.serie || 'A').toUpperCase();
  const userTeam = (normalizedState.teams || []).find(isUserTeam) || {
    id:'user', name:normalizedState.club?.name || 'Meu Clube', strength:normalizedState.club?.strength || 60, isPlayer:true,
  };
  const full = {};
  SERIES_KEYS.forEach((serie) => {
    full[serie] = serie === prevSerie
      ? [userTeam, ...(normalizedState.leagues?.[serie] || [])]
      : [...(normalizedState.leagues?.[serie] || [])];
  });
  if (!SERIES_KEYS.every((serie) => full[serie].length === LEAGUE_SIZE)) return null;

  const rankings = {};
  SERIES_KEYS.forEach((serie) => {
    rankings[serie] = serie === prevSerie
      ? rankUserDivision(full[serie], finalTable)
      : rankCpuDivision(full[serie], normalizedState.season, serie);
  });
  if (!SERIES_KEYS.every((serie) => Array.isArray(rankings[serie]) && rankings[serie].length === LEAGUE_SIZE)) return null;

  const aDown = bottom(rankings.A);
  const bUp = top(rankings.B);
  const bDown = bottom(rankings.B);
  const cUp = top(rankings.C);
  const cDown = bottom(rankings.C);
  const dUp = top(rankings.D);

  const nextFull = {
    A: [...withoutIds(full.A, new Set(aDown.map(idKey))), ...bUp],
    B: [...withoutIds(full.B, new Set([...bUp, ...bDown].map(idKey))), ...aDown, ...cUp],
    C: [...withoutIds(full.C, new Set([...cUp, ...cDown].map(idKey))), ...bDown, ...dUp],
    D: [...withoutIds(full.D, new Set(dUp.map(idKey))), ...cDown],
  };

  const allIds = SERIES_KEYS.flatMap((serie) => nextFull[serie].map(idKey));
  const userSerie = SERIES_KEYS.find((serie) => nextFull[serie].some(isUserTeam)) || null;
  if (!userSerie || !SERIES_KEYS.every((serie) => nextFull[serie].length === LEAGUE_SIZE)) return null;
  if (new Set(allIds).size !== LEAGUE_SIZE * SERIES_KEYS.length) return null;

  const pools = Object.fromEntries(SERIES_KEYS.map((serie) => [
    serie,
    nextFull[serie].filter((team) => !isUserTeam(team)).map(cloneCpuTeam),
  ]));

  const movement = {
    season: Number(normalizedState.season) || 2026,
    userFrom: prevSerie,
    userTo: userSerie,
    promoted: [
      ...movementEntries(bUp, 'B', 'A'),
      ...movementEntries(cUp, 'C', 'B'),
      ...movementEntries(dUp, 'D', 'C'),
    ],
    relegated: [
      ...movementEntries(aDown, 'A', 'B'),
      ...movementEntries(bDown, 'B', 'C'),
      ...movementEntries(cDown, 'C', 'D'),
    ],
  };

  return {
    pools,
    userSerie,
    movement,
    pyramidReserve: normalizedState.pyramidReserve || [],
  };
}

function collectActiveIds(pools = {}) {
  return new Set(SERIES_KEYS.flatMap((serie) => (pools?.[serie] || []).map(idKey)).filter(Boolean));
}

export function applyManagerTakeoverToPyramid({
  pools = {}, pyramidReserve = [], previousClubId = null, previousClub = null,
  previousUserSerie = null, nextClub = null,
} = {}) {
  if (!nextClub?.id) return { pools, pyramidReserve, userSerie:previousUserSerie };
  const nextId = idKey(nextClub);
  const copied = Object.fromEntries(SERIES_KEYS.map((serie) => [serie, [...(pools?.[serie] || [])]]));
  let location = null;
  SERIES_KEYS.some((serie) => {
    const index = copied[serie].findIndex((team) => idKey(team) === nextId);
    if (index < 0) return false;
    location = { serie, index };
    return true;
  });

  // A proposta só é válida se o clube contratado ainda fizer parte da pirâmide
  // ativa depois dos acessos/rebaixamentos. Não transformamos um clube da reserva
  // em destino de manager silenciosamente, pois isso quebraria o tamanho das séries.
  if (!location) return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };

  const departingId = idKey(previousClub?.id || previousClubId);
  const departingCatalog = departingId ? getClubCatalogEntry(departingId) : null;
  const departing = previousClub || departingCatalog;
  if (!departing || !departingId || departingId === nextId) {
    return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  }

  const oldUserSerie = SERIES_KEYS.includes(previousUserSerie) ? previousUserSerie : null;
  if (!oldUserSerie) return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };

  // Troca de emprego muda apenas quem o manager controla: o clube antigo continua
  // na divisão conquistada e o clube contratado continua na divisão dele. Assim não
  // precisamos puxar um terceiro clube da reserva nem apagar um clube personalizado.
  copied[location.serie].splice(location.index, 1);
  copied[oldUserSerie].push(cloneCpuTeam({ ...departing, id:departingId }));

  const expected = Object.fromEntries(SERIES_KEYS.map((serie) => [
    serie,
    cpuTargetForSerie(serie, location.serie),
  ]));
  if (!SERIES_KEYS.every((serie) => copied[serie].length === expected[serie])) {
    return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  }

  const ids = SERIES_KEYS.flatMap((serie) => copied[serie].map(idKey));
  if (ids.some((key) => !key) || new Set(ids).size !== ids.length || ids.includes(nextId)) {
    return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  }

  const used = collectActiveIds(copied);
  used.add(nextId); // agora controlado pelo usuário e, portanto, fora dos pools CPU.
  const reserveSeen = new Set();
  const nextReserve = (Array.isArray(pyramidReserve) ? pyramidReserve : []).reduce((result, team) => {
    const key = idKey(team);
    if (!key || used.has(key) || reserveSeen.has(key)) return result;
    reserveSeen.add(key);
    result.push(cloneReserveTeam(team));
    return result;
  }, []);

  return {
    pools:copied,
    pyramidReserve:nextReserve,
    userSerie:location.serie,
    departingClubId:departingId,
  };
}

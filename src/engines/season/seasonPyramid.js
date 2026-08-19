import { CLUB_CATALOG, getClubCatalogEntry, getPyramidSeriesTeams2026 } from '../../data/clubCatalog.js';
import { getSerieDUserOutcome, simulateCpuSerieDOutcome } from '../serieD/serieDCompetition.js';
import { getSerieCUserOutcome, simulateCpuSerieCOutcome } from '../serieC/serieCCompetition.js';

export const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);
const BASE_SIZES = Object.freeze({ A:20, B:20, C:20, D:96 });

const idKey = (value) => value == null ? null : String(typeof value === 'object' ? value.id : value);
const isUserTeam = (team) => idKey(team) === 'user' || team?.isPlayer === true;
const cloneCpuTeam = (team) => ({ ...team, isPlayer:false });
const cloneReserveTeam = (team) => { const { squad, ...rest } = team || {}; return { ...rest, isPlayer:false }; };
const userCanonicalId = (state = {}) => String(state?.club?.existingTeamId || state?.club?.teamId || '');

export function getDivisionSize(state = {}, serie = 'A') {
  const key = String(serie || 'A').toUpperCase();
  if (key === 'C') {
    const season = Number(state?.season) || 2026;
    const persisted = Array.isArray(state?.leagues?.C) ? state.leagues.C.length + (state?.serie === 'C' ? 1 : 0) : 0;
    // Expansão oficial: 20 clubes em 2026, 24 em 2027 e 28 a partir de 2028.
    // O valor persistido prevalece quando um save já carrega a composição ampliada.
    if (season >= 2028 || persisted >= 28) return 28;
    if (season >= 2027 || persisted >= 24 || (Number(state?.leaguePyramidVersion) >= 2 && persisted > 20)) return 24;
  }
  return BASE_SIZES[key] || 20;
}

const cpuTargetForSerie = (serie, userSerie, state = {}) => getDivisionSize(state, serie) - (serie === userSerie ? 1 : 0);

function uniqueTeams(teams = [], { excluded = new Set(), seen = new Set() } = {}) {
  const result = [];
  (Array.isArray(teams) ? teams : []).forEach((team) => {
    const key = idKey(team);
    if (!key || key === 'user' || excluded.has(key) || seen.has(key)) return;
    seen.add(key); result.push(cloneCpuTeam(team));
  });
  return result;
}

function catalogCandidates(excluded = new Set()) {
  const current = SERIES_KEYS.flatMap((serie) => getPyramidSeriesTeams2026(serie));
  const merged = [...current, ...CLUB_CATALOG];
  const seen = new Set();
  return merged.filter((team) => {
    const key = idKey(team);
    if (!key || excluded.has(key) || seen.has(key)) return false;
    seen.add(key); return true;
  }).map(cloneCpuTeam);
}

function currentCpuTeams(state = {}) {
  return (Array.isArray(state.teams) ? state.teams : []).filter((team) => team && !isUserTeam(team));
}

function hasUserTeam(state = {}) {
  return (Array.isArray(state.teams) ? state.teams : []).filter(isUserTeam).length === 1;
}

export function hasPersistentLeaguePyramid(state = {}) {
  if (!hasUserTeam(state)) return false;
  const userSerie = SERIES_KEYS.includes(String(state?.serie || '').toUpperCase()) ? String(state.serie).toUpperCase() : 'A';
  return SERIES_KEYS.every((serie) => {
    const pool = Array.isArray(state?.leagues?.[serie]) ? state.leagues[serie] : [];
    const target = cpuTargetForSerie(serie, userSerie, state);
    return pool.length === target;
  });
}

function buildNormalizedPools(state = {}) {
  const userSerie = SERIES_KEYS.includes(String(state?.serie || '').toUpperCase()) ? String(state.serie).toUpperCase() : 'A';
  const existingTeamId = userCanonicalId(state) || null;
  const excluded = new Set(existingTeamId ? [existingTeamId] : []);
  const seen = new Set();
  const pools = { A:[], B:[], C:[], D:[] };
  const priority = [userSerie, ...SERIES_KEYS.filter((serie) => serie !== userSerie)];

  priority.forEach((serie) => {
    const current = currentCpuTeams(state);
    const currentIsFullDivision = serie === userSerie && current.length === cpuTargetForSerie(serie, userSerie, state);
    const source = currentIsFullDivision ? current : (state?.leagues?.[serie] || []);
    pools[serie] = uniqueTeams(source, { excluded, seen }).slice(0, cpuTargetForSerie(serie, userSerie, state));
  });

  const persistedCandidates = SERIES_KEYS.flatMap((serie) => state?.leagues?.[serie] || []);
  const reserveCandidates = [
    ...(Array.isArray(state?.pyramidReserve) ? state.pyramidReserve : []),
    ...persistedCandidates,
    ...catalogCandidates(excluded),
  ];

  SERIES_KEYS.forEach((serie) => {
    const target = cpuTargetForSerie(serie, userSerie, state);
    for (const team of reserveCandidates) {
      if (pools[serie].length >= target) break;
      const key = idKey(team);
      if (!key || key === 'user' || excluded.has(key) || seen.has(key)) continue;
      seen.add(key); pools[serie].push(cloneCpuTeam(team));
    }
  });

  const activeIds = new Set(SERIES_KEYS.flatMap((serie) => pools[serie].map(idKey)).filter(Boolean));
  const reserveSeen = new Set();
  const pyramidReserve = reserveCandidates.reduce((result, team) => {
    const key = idKey(team);
    if (!key || key === 'user' || excluded.has(key) || activeIds.has(key) || reserveSeen.has(key)) return result;
    reserveSeen.add(key); result.push(cloneReserveTeam(team)); return result;
  }, []);
  return { pools, pyramidReserve, userSerie };
}

export function reconcileLeaguePyramid(state = {}) {
  if (!hasUserTeam(state)) return state;
  const normalized = buildNormalizedPools(state);
  const valid = SERIES_KEYS.every((serie) => normalized.pools[serie].length === cpuTargetForSerie(serie, normalized.userSerie, state));
  if (!valid) return state;
  return {
    ...state,
    leagues:{ ...(state.leagues || {}), ...normalized.pools },
    pyramidReserve:normalized.pyramidReserve,
    leaguePyramidVersion:2,
  };
}

function hashNoise(value) {
  const text = String(value ?? ''); let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 0x100000000;
}

export function rankCpuDivision(teams = [], season = 2026, serie = 'A') {
  return [...(Array.isArray(teams) ? teams : [])].sort((a, b) => {
    const scoreA = (Number(a?.strength) || 60) * 100 + hashNoise(`${season}|${serie}|${idKey(a)}`) * 850;
    const scoreB = (Number(b?.strength) || 60) * 100 + hashNoise(`${season}|${serie}|${idKey(b)}`) * 850;
    return scoreB !== scoreA ? scoreB - scoreA : String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR');
  });
}

function rankUserDivision(fullTeams = [], finalTable = []) {
  if (!Array.isArray(finalTable) || finalTable.length !== fullTeams.length || fullTeams.length < 2) return null;
  const byId = new Map(fullTeams.map((team) => [idKey(team), team])); const seen = new Set(); const ranked = [];
  for (const row of finalTable) {
    const key = idKey(row); const team = byId.get(key);
    if (!key || !team || seen.has(key)) return null;
    seen.add(key); ranked.push(team);
  }
  return ranked.length === fullTeams.length ? ranked : null;
}

const withoutIds = (teams, removed) => teams.filter((team) => !removed.has(idKey(team)));
const top = (teams, count) => teams.slice(0, count);
const bottom = (teams, count) => teams.slice(-count);
const movementEntries = (teams = [], from, to) => teams.map((team) => ({ id:idKey(team), name:team?.name || '', from, to, isUser:isUserTeam(team) }));

function resolveSerieDPromotions(state, fullD, finalTable = []) {
  if (state.serie === 'D' && state.serieDLegacyFormat === true) {
    const legacyTeams = Array.isArray(state.teams) ? state.teams : [];
    const legacyRanking = rankUserDivision(legacyTeams, finalTable);
    if (Array.isArray(legacyRanking) && legacyRanking.length >= 4) return legacyRanking.slice(0, 4);
  }
  const desired = (Number(state.season) || 2026) <= 2027 ? 6 : 4;
  let ids = [];
  if (state.serie === 'D' && state.serieDCompetition) {
    ids = getSerieDUserOutcome(state)?.promotedCanonicalIds || [];
  } else {
    ids = simulateCpuSerieDOutcome(fullD, state.season).promotedCanonicalIds || [];
  }
  const byCanonical = new Map(fullD.map((team) => [isUserTeam(team) ? userCanonicalId(state) : idKey(team), team]));
  const selected = ids.map((id) => byCanonical.get(String(id))).filter(Boolean).slice(0, desired);
  if (selected.length < desired) {
    const selectedIds = new Set(selected.map(idKey));
    for (const team of rankCpuDivision(fullD.filter((entry) => !isUserTeam(entry)), state.season, 'D')) {
      if (selected.length >= desired) break;
      if (selectedIds.has(idKey(team))) continue;
      selectedIds.add(idKey(team)); selected.push(team);
    }
  }
  return selected;
}


function resolveSerieCMovements(state, fullC, finalTable = []) {
  const season = Number(state?.season) || 2026;
  if (state.serie === 'C' && state.serieCLegacyFormat === true) {
    const legacyRanking = rankUserDivision(fullC, finalTable);
    if (!Array.isArray(legacyRanking)) return null;
    return { promoted:top(legacyRanking, 4), relegated:bottom(legacyRanking, season <= 2027 ? 2 : 4) };
  }
  if (season !== 2027) {
    const ranking = state.serie === 'C' ? rankUserDivision(fullC, finalTable) : rankCpuDivision(fullC, season, 'C');
    if (!Array.isArray(ranking)) return null;
    const downCount = season <= 2027 ? 2 : 4;
    return { promoted:top(ranking, 4), relegated:bottom(ranking, downCount) };
  }

  let promotedIds = [];
  let relegatedIds = [];
  if (state.serie === 'C' && state.serieCCompetition) {
    const outcome = getSerieCUserOutcome(state);
    promotedIds = outcome?.promotedCanonicalIds || [];
    relegatedIds = outcome?.relegatedCanonicalIds || [];
  } else {
    const simulated = simulateCpuSerieCOutcome(fullC, season);
    promotedIds = simulated?.promotedCanonicalIds || [];
    relegatedIds = simulated?.relegatedCanonicalIds || [];
  }

  const canonicalFor = (team) => isUserTeam(team) ? userCanonicalId(state) : idKey(team);
  const byCanonical = new Map(fullC.map((team) => [String(canonicalFor(team) || ''), team]));
  const promoted = promotedIds.map((id) => byCanonical.get(String(id))).filter(Boolean).slice(0, 4);
  const relegated = relegatedIds.map((id) => byCanonical.get(String(id))).filter(Boolean).slice(0, 2);
  if (promoted.length !== 4 || relegated.length !== 2) return null;
  return { promoted, relegated };
}

function fillDivision(teams, target, candidates, excludedIds) {
  const out = [...teams]; const used = new Set(out.map(idKey));
  for (const team of candidates) {
    if (out.length >= target) break;
    const key = idKey(team);
    if (!key || key === 'user' || used.has(key) || excludedIds.has(key)) continue;
    used.add(key); out.push(cloneCpuTeam(team));
  }
  return out;
}

export function advanceLeaguePyramid(prevState = {}, finalTable = []) {
  const normalizedState = reconcileLeaguePyramid(prevState);
  if (!hasPersistentLeaguePyramid(normalizedState)) return null;
  const prevSerie = String(normalizedState.serie || 'A').toUpperCase();
  const userTeam = (normalizedState.teams || []).find(isUserTeam) || { id:'user', name:normalizedState.club?.name || 'Meu Clube', strength:normalizedState.club?.strength || 60, isPlayer:true };
  const full = {};
  SERIES_KEYS.forEach((serie) => {
    full[serie] = serie === prevSerie ? [userTeam, ...(normalizedState.leagues?.[serie] || [])] : [...(normalizedState.leagues?.[serie] || [])];
  });
  const expected = Object.fromEntries(SERIES_KEYS.map((serie) => [serie, getDivisionSize(normalizedState, serie)]));
  if (!SERIES_KEYS.every((serie) => full[serie].length === expected[serie])) return null;

  const rankings = {};
  ['A','B'].forEach((serie) => { rankings[serie] = serie === prevSerie ? rankUserDivision(full[serie], finalTable) : rankCpuDivision(full[serie], normalizedState.season, serie); });
  if (!['A','B'].every((serie) => Array.isArray(rankings[serie]) && rankings[serie].length === expected[serie])) return null;

  const cMovement = resolveSerieCMovements(normalizedState, full.C, finalTable);
  if (!cMovement) return null;
  const aDown = bottom(rankings.A, 4);
  const bUp = top(rankings.B, 4);
  const bDown = bottom(rankings.B, 4);
  const cUp = cMovement.promoted;
  const cDown = cMovement.relegated;
  const dUp = resolveSerieDPromotions(normalizedState, full.D, finalTable);

  let nextFull = {
    A:[...withoutIds(full.A, new Set(aDown.map(idKey))), ...bUp],
    B:[...withoutIds(full.B, new Set([...bUp, ...bDown].map(idKey))), ...aDown, ...cUp],
    C:[...withoutIds(full.C, new Set([...cUp, ...cDown].map(idKey))), ...bDown, ...dUp],
    D:[...withoutIds(full.D, new Set(dUp.map(idKey))), ...cDown],
  };

  const nextSeason = (Number(normalizedState.season) || 2026) + 1;
  const targetState = { ...normalizedState, season:nextSeason, leaguePyramidVersion:2 };
  const targetSizes = Object.fromEntries(SERIES_KEYS.map((serie) => [serie, getDivisionSize(targetState, serie)]));
  const currentAllIds = new Set(SERIES_KEYS.flatMap((serie) => nextFull[serie].map(idKey)).filter(Boolean));
  const candidates = [...(normalizedState.pyramidReserve || []), ...catalogCandidates(new Set())];
  SERIES_KEYS.forEach((serie) => {
    if (nextFull[serie].length < targetSizes[serie]) nextFull[serie] = fillDivision(nextFull[serie], targetSizes[serie], candidates, currentAllIds);
  });

  const allIds = SERIES_KEYS.flatMap((serie) => nextFull[serie].map(idKey));
  const userSerie = SERIES_KEYS.find((serie) => nextFull[serie].some(isUserTeam)) || null;
  if (!userSerie || !SERIES_KEYS.every((serie) => nextFull[serie].length === targetSizes[serie])) return null;
  if (new Set(allIds).size !== allIds.length) return null;

  const pools = Object.fromEntries(SERIES_KEYS.map((serie) => [serie, nextFull[serie].filter((team) => !isUserTeam(team)).map(cloneCpuTeam)]));
  const activeIds = new Set(SERIES_KEYS.flatMap((serie) => pools[serie].map(idKey)));
  const reserveSeen = new Set();
  const pyramidReserve = candidates.reduce((acc, team) => {
    const key = idKey(team);
    if (!key || activeIds.has(key) || key === userCanonicalId(normalizedState) || reserveSeen.has(key)) return acc;
    reserveSeen.add(key); acc.push(cloneReserveTeam(team)); return acc;
  }, []);

  return {
    pools, userSerie, pyramidReserve,
    movement:{
      season:Number(normalizedState.season) || 2026, userFrom:prevSerie, userTo:userSerie,
      promoted:[...movementEntries(bUp,'B','A'), ...movementEntries(cUp,'C','B'), ...movementEntries(dUp,'D','C')],
      relegated:[...movementEntries(aDown,'A','B'), ...movementEntries(bDown,'B','C'), ...movementEntries(cDown,'C','D')],
    },
  };
}

function collectActiveIds(pools = {}) { return new Set(SERIES_KEYS.flatMap((serie) => (pools?.[serie] || []).map(idKey)).filter(Boolean)); }

export function applyManagerTakeoverToPyramid({ pools = {}, pyramidReserve = [], previousClubId = null, previousClub = null, previousUserSerie = null, nextClub = null } = {}) {
  if (!nextClub?.id) return { pools, pyramidReserve, userSerie:previousUserSerie };
  const nextId = idKey(nextClub); const copied = Object.fromEntries(SERIES_KEYS.map((serie) => [serie, [...(pools?.[serie] || [])]]));
  let location = null;
  SERIES_KEYS.some((serie) => { const index = copied[serie].findIndex((team) => idKey(team) === nextId); if (index < 0) return false; location={serie,index}; return true; });
  if (!location) return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  const departingId = idKey(previousClub?.id || previousClubId); const departingCatalog = departingId ? getClubCatalogEntry(departingId) : null; const departing = previousClub || departingCatalog;
  if (!departing || !departingId || departingId === nextId || !SERIES_KEYS.includes(previousUserSerie)) return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  copied[location.serie].splice(location.index,1); copied[previousUserSerie].push(cloneCpuTeam({ ...departing, id:departingId }));
  const expected = Object.fromEntries(SERIES_KEYS.map((serie) => [serie, (pools?.[serie]?.length || 0) + (serie === previousUserSerie ? 1 : 0) - (serie === location.serie ? 1 : 0)]));
  if (!SERIES_KEYS.every((serie) => copied[serie].length === expected[serie])) return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  const ids = SERIES_KEYS.flatMap((serie) => copied[serie].map(idKey));
  if (ids.some((key) => !key) || new Set(ids).size !== ids.length || ids.includes(nextId)) return { pools, pyramidReserve, userSerie:previousUserSerie, invalidTakeover:true };
  const used = collectActiveIds(copied); used.add(nextId); const reserveSeen = new Set();
  const nextReserve = (Array.isArray(pyramidReserve) ? pyramidReserve : []).reduce((result, team) => { const key=idKey(team); if(!key||used.has(key)||reserveSeen.has(key)) return result; reserveSeen.add(key); result.push(cloneReserveTeam(team)); return result; },[]);
  return { pools:copied, pyramidReserve:nextReserve, userSerie:location.serie, departingClubId:departingId };
}

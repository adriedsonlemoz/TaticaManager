import { diexDatabase } from '../../data/database.js';
import { generatePlayer, generateSquad } from '../core/playerFactory.js';
import { normalizeFreeAgent } from '../market/marketIntegrity.js';
import { syncTeamWithRoster } from '../cpu/cpuRoster.js';
import { advanceLeaguePyramid, applyManagerTakeoverToPyramid } from './seasonPyramid.js';

const DEFAULT_STRENGTH = Object.freeze({ A: 78, B: 70, C: 60, D: 50 });
const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);
const CUSTOM_ORIGIN_CLUB_ID = 'career-origin-club';

export function resolveAcceptedManagerClub(prevState = {}) {
  const transfer = prevState.pendingManagerTransfer?.accepted ? prevState.pendingManagerTransfer : null;
  if (!transfer?.offeringClub?.id) return null;
  const persistentTeams = [
    ...(prevState.teams || []),
    ...SERIES_KEYS.flatMap((serie) => prevState.leagues?.[serie] || []),
    ...(prevState.pyramidReserve || []),
  ];
  const persistent = persistentTeams.find((team) => team?.id === transfer.offeringClub.id);
  if (persistent) return persistent;
  const allTeams = [
    ...(diexDatabase.serieATeams || []),
    ...(diexDatabase.serieBTeams || []),
    ...(diexDatabase.serieCTeams || []),
    ...(diexDatabase.serieDTeams || []),
  ];
  return allTeams.find((team) => team.id === transfer.offeringClub.id) || transfer.offeringClub || null;
}

function cpuStrengthBonus(finalTable = [], teamId) {
  const position = finalTable.findIndex((row) => row?.id === teamId) + 1;
  if (position <= 0) return 0;
  if (position <= 4) return 2;
  if (position <= 10) return 1;
  if (position <= 16) return 0;
  return -1;
}

function evolveCpuTeam(team, finalTable = []) {
  const bonus = cpuStrengthBonus(finalTable, team.id);
  return {
    ...team,
    strength: Math.max(55, Math.min(94, (team.strength || 70) + bonus)),
  };
}

function buildDepartingUserClub(prevState = {}) {
  const club = prevState.club || {};
  const id = club.existingTeamId || CUSTOM_ORIGIN_CLUB_ID;
  const catalogTeam = SERIES_KEYS
    .flatMap((serie) => diexDatabase[`serie${serie}Teams`] || [])
    .find((team) => String(team?.id) === String(id));
  return {
    ...(catalogTeam || {}),
    id,
    name: club.name || catalogTeam?.name || 'Clube anterior',
    strength: Number(club.strength) || Number(catalogTeam?.strength) || DEFAULT_STRENGTH[prevState.serie] || 60,
    money: Math.max(0, Number(club.money) || 0),
    budget: Math.max(0, Number(club.transferBudget) || 0),
    fanBase: Number.isFinite(Number(club.fanLoyalty)) ? Math.max(0, Math.min(1, Number(club.fanLoyalty) / 100)) : (catalogTeam?.fanBase ?? 0.5),
    isPlayer: false,
  };
}

function getPreviousTeam(prevState = {}, teamId, departingUserClub = null) {
  if (departingUserClub && String(departingUserClub.id) === String(teamId)) return departingUserClub;
  const pools = [prevState.teams, ...SERIES_KEYS.map((serie) => prevState.leagues?.[serie]), prevState.pyramidReserve];
  for (const pool of pools) {
    const team = (pool || []).find((candidate) => String(candidate?.id) === String(teamId));
    if (team) return team;
  }
  return null;
}

function getPreviousRoster(prevState = {}, teamId, departingUserClub = null) {
  if (departingUserClub && String(departingUserClub.id) === String(teamId)) {
    return Array.isArray(prevState.players) ? prevState.players : prevState.teamRosters?.user;
  }
  const stored = prevState.teamRosters?.[teamId];
  if (Array.isArray(stored)) return stored;
  const team = getPreviousTeam(prevState, teamId, departingUserClub);
  return Array.isArray(team?.squad) ? team.squad : null;
}

function shouldCpuRenew(player = {}, team = {}) {
  const overall = Number(player.overall) || 0;
  const strength = Number(team.strength) || 70;
  return player.isStarting === true || overall >= strength - 2;
}

export function advanceCpuRosterForSeason(team = {}, roster = [], serie = 'A', rng = Math.random) {
  const released = [];
  const kept = [];
  const source = Array.isArray(roster) ? roster : [];

  source.forEach((player) => {
    const newAge = (Number(player.age) || 25) + 1;
    if (newAge >= 42 || (newAge >= 39 && !player.isStarting)) return;

    const rawContract = Number(player.contract);
    let contract = Math.max(0, (Number.isFinite(rawContract) ? rawContract : 2) - 1);
    let wage = Math.max(0, Number(player.wage) || 0);
    if (contract <= 0) {
      if (!shouldCpuRenew(player, team)) {
        released.push(normalizeFreeAgent({
          ...player,
          age: newAge,
          contract: 0,
          previousTeam: team.name,
          goals: 0,
          assists: 0,
          seasonGoals: 0,
        }));
        return;
      }
      contract = 2;
      wage = Math.round((wage || 2000) * 1.05 / 500) * 500;
    }

    kept.push({
      ...player,
      age: newAge,
      contract,
      wage,
      teamId: team.id,
      teamName: team.name,
      goals: 0,
      assists: 0,
      seasonGoals: 0,
      energy: 100,
      injury: null,
      isListed: false,
      discipline: {
        ...(player.discipline || {}),
        yellowCards: 0,
        suspendedUntilRound: null,
      },
    });
  });

  const targetMinimum = 20;
  while (kept.length < targetMinimum) {
    const recruit = generatePlayer(null, team.name, Math.max(40, (Number(team.strength) || DEFAULT_STRENGTH[serie] || 60) - 4), null, team.id, rng);
    if (!recruit) break;
    kept.push({ ...recruit, teamId: team.id, teamName: team.name, isStarting: false, isListed: false });
  }

  const starterIds = new Set(
    [...kept]
      .sort((a, b) => (Number(b.overall) || 0) - (Number(a.overall) || 0))
      .slice(0, Math.min(11, kept.length))
      .map((player) => String(player.id)),
  );
  const nextRoster = kept.map((player) => ({ ...player, isStarting: starterIds.has(String(player.id)) }));
  return { roster: nextRoster, released };
}

function buildPool(teams = [], serie, excludedId, finalTable, prevState, releasedFreeAgents, rng, departingUserClub = null) {
  return teams
    .filter((team) => team.id !== excludedId)
    .map((team) => {
      const evolved = evolveCpuTeam(team, finalTable);
      const previousTeam = getPreviousTeam(prevState, team.id, departingUserClub);
      const persistentTeam = {
        ...evolved,
        ...(Number.isFinite(Number(previousTeam?.money)) ? { money: Number(previousTeam.money) } : {}),
        ...(Number.isFinite(Number(previousTeam?.budget)) ? { budget: Number(previousTeam.budget) } : {}),
        isPlayer: false,
      };
      const previousRoster = getPreviousRoster(prevState, team.id, departingUserClub);
      if (!Array.isArray(previousRoster)) {
        return {
          ...persistentTeam,
          squad: generateSquad(serie, persistentTeam.name, persistentTeam.strength, persistentTeam.id, rng),
        };
      }
      const advanced = advanceCpuRosterForSeason(persistentTeam, previousRoster, serie, rng);
      releasedFreeAgents.push(...advanced.released);
      return syncTeamWithRoster(persistentTeam, advanced.roster);
    });
}

function buildIncomingUserPlayers(prevState = {}, newClubData = null, serie = 'A', releasedFreeAgents = [], rng = Math.random) {
  if (!newClubData?.id) return null;
  const previousRoster = getPreviousRoster(prevState, newClubData.id);
  if (!Array.isArray(previousRoster) || previousRoster.length === 0) {
    return generateSquad(serie, newClubData.name, newClubData.strength || DEFAULT_STRENGTH[serie] || 60, 'user', rng)
      .map((player) => ({ ...player, teamId:'user', teamName:newClubData.name }));
  }
  const advanced = advanceCpuRosterForSeason(newClubData, previousRoster, serie, rng);
  releasedFreeAgents.push(...advanced.released);
  return advanced.roster.map((player) => ({
    ...player,
    teamId:'user',
    teamName:newClubData.name,
  }));
}

export function buildSeasonTeams(prevState = {}, finalTable = [], projectedSerie = 'A', rng = Math.random) {
  const requestedClub = resolveAcceptedManagerClub(prevState);
  const pyramidCandidate = advanceLeaguePyramid(prevState, finalTable);
  const pyramid = pyramidCandidate?.userSerie === projectedSerie ? pyramidCandidate : null;
  const departingUserClub = requestedClub ? buildDepartingUserClub(prevState) : null;
  const takeover = pyramid
    ? applyManagerTakeoverToPyramid({
        pools:pyramid.pools,
        pyramidReserve:pyramid.pyramidReserve,
        previousClubId:departingUserClub?.id || prevState.club?.existingTeamId || null,
        previousClub:departingUserClub,
        previousUserSerie:pyramid.userSerie,
        nextClub:requestedClub,
      })
    : null;
  const managerTransferApplied = Boolean(requestedClub && (!pyramid || takeover?.invalidTakeover !== true));
  const newClubData = managerTransferApplied ? requestedClub : null;
  const userSerie = managerTransferApplied && takeover?.userSerie ? takeover.userSerie : projectedSerie;
  const existingTeamId = newClubData?.id || prevState.club?.existingTeamId || null;
  const userTeam = {
    id: 'user',
    name: newClubData?.name || prevState.club?.name || 'Meu Clube',
    strength: newClubData?.strength || prevState.club?.strength || DEFAULT_STRENGTH[userSerie] || 60,
    isPlayer: true,
  };

  const releasedFreeAgents = [];
  const incomingUserPlayers = newClubData
    ? buildIncomingUserPlayers(prevState, newClubData, userSerie, releasedFreeAgents, rng)
    : null;
  const sourcePools = takeover?.invalidTakeover === true
    ? (pyramid?.pools || null)
    : (takeover?.pools || pyramid?.pools || null);
  const fallbackPools = {
    A: [...(diexDatabase.serieATeams || [])],
    B: [...(diexDatabase.serieBTeams || [])],
    C: [...(diexDatabase.serieCTeams || [])],
    D: [...(diexDatabase.serieDTeams || [])],
  };
  // Saves legados podem ter clube personalizado sem uma pirâmide persistida.
  // Como esse clube não possui ID canônico para substituir um CPU, reservamos
  // explicitamente uma vaga da divisão atual. Isso preserva o tamanho da
  // competição e mantém o clube deslocado disponível para a pirâmide futura.
  const fallbackReserve = [];
  if (!sourcePools && !existingTeamId && SERIES_KEYS.includes(userSerie)) {
    const displaced = fallbackPools[userSerie].pop();
    if (displaced) fallbackReserve.push({ ...displaced, isPlayer:false });
  }
  const pools = sourcePools || fallbackPools;
  const departingForPools = managerTransferApplied ? departingUserClub : null;

  const poolA = buildPool(pools.A || [], 'A', existingTeamId, finalTable, prevState, releasedFreeAgents, rng, departingForPools);
  const poolB = buildPool(pools.B || [], 'B', existingTeamId, finalTable, prevState, releasedFreeAgents, rng, departingForPools);
  const poolC = buildPool(pools.C || [], 'C', existingTeamId, finalTable, prevState, releasedFreeAgents, rng, departingForPools);
  const poolD = buildPool(pools.D || [], 'D', existingTeamId, finalTable, prevState, releasedFreeAgents, rng, departingForPools);
  const selectedPool = userSerie === 'A' ? poolA : userSerie === 'B' ? poolB : userSerie === 'C' ? poolC : poolD;
  const allTeams = [userTeam, ...selectedPool];
  const teamRosters = {};
  [poolA, poolB, poolC, poolD].forEach((pool) => pool.forEach((team) => {
    if (Array.isArray(team.squad)) teamRosters[team.id] = team.squad;
  }));

  return {
    newClubData,
    existingTeamId,
    userTeam,
    userSerie,
    managerTransferApplied,
    departingUserClubId:managerTransferApplied ? departingUserClub?.id || null : null,
    incomingUserPlayers,
    allTeams,
    teamRosters,
    freeAgents: releasedFreeAgents,
    pools: { A: poolA, B: poolB, C: poolC, D: poolD },
    pyramidReserve: takeover?.pyramidReserve || pyramid?.pyramidReserve || (sourcePools
      ? (prevState.pyramidReserve || [])
      : [...(prevState.pyramidReserve || []), ...fallbackReserve]),
    divisionMovement: pyramid?.movement || null,
  };
}

// Compatibilidade para chamadas legadas/testes. Em elencos recém-gerados não
// reduzimos novamente o contrato; vínculos expirados são renovados por 2 anos.
export function renewCpuRosters(teamRosters = {}) {
  const renewed = { ...teamRosters };
  Object.keys(renewed).forEach((teamId) => {
    if (!Array.isArray(renewed[teamId])) return;
    renewed[teamId] = renewed[teamId].map((player) => {
      const contract = player.contract ?? 1;
      if (contract <= 0) {
        return {
          ...player,
          contract: 2,
          wage: Math.round((player.wage || 2000) * 1.05 / 500) * 500,
        };
      }
      return { ...player, contract };
    });
  });
  return renewed;
}

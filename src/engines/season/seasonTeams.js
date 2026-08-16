import { diexDatabase } from '../../data/database.js';
import { generateSquad } from '../core/playerFactory.js';

const DEFAULT_STRENGTH = Object.freeze({ A: 78, B: 70, C: 60, D: 50 });

export function resolveAcceptedManagerClub(prevState = {}) {
  const transfer = prevState.pendingManagerTransfer?.accepted ? prevState.pendingManagerTransfer : null;
  if (!transfer?.offeringClub?.id) return null;
  const allTeams = [
    ...(diexDatabase.serieATeams || []),
    ...(diexDatabase.serieBTeams || []),
    ...(diexDatabase.serieCTeams || []),
    ...(diexDatabase.serieDTeams || []),
  ];
  return allTeams.find((team) => team.id === transfer.offeringClub.id) || null;
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

function buildPool(teams = [], serie, excludedId, finalTable) {
  return teams
    .filter((team) => team.id !== excludedId)
    .map((team) => {
      const evolved = evolveCpuTeam(team, finalTable);
      return {
        ...evolved,
        isPlayer: false,
        squad: generateSquad(serie, evolved.name, evolved.strength, evolved.id),
      };
    });
}

export function buildSeasonTeams(prevState = {}, finalTable = [], newSerie = 'A') {
  const newClubData = resolveAcceptedManagerClub(prevState);
  const existingTeamId = newClubData?.id || prevState.club?.existingTeamId || null;
  const userTeam = {
    id: 'user',
    name: newClubData?.name || prevState.club?.name || 'Meu Clube',
    strength: newClubData?.strength || prevState.club?.strength || DEFAULT_STRENGTH[newSerie] || 60,
    isPlayer: true,
  };

  const poolA = buildPool(diexDatabase.serieATeams || [], 'A', existingTeamId, finalTable);
  const poolB = buildPool(diexDatabase.serieBTeams || [], 'B', existingTeamId, finalTable);
  const poolC = buildPool(diexDatabase.serieCTeams || [], 'C', existingTeamId, finalTable);
  const poolD = buildPool(diexDatabase.serieDTeams || [], 'D', existingTeamId, finalTable);
  const selectedPool = newSerie === 'A' ? poolA : newSerie === 'B' ? poolB : newSerie === 'C' ? poolC : poolD;
  const allTeams = [userTeam, ...selectedPool.slice(0, 19)];
  const teamRosters = {};
  allTeams.forEach((team) => {
    if (Array.isArray(team.squad)) teamRosters[team.id] = team.squad;
  });

  return {
    newClubData,
    existingTeamId,
    userTeam,
    allTeams,
    teamRosters,
    pools: { A: poolA, B: poolB, C: poolC, D: poolD },
  };
}

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
      return { ...player, contract: Math.max(0, contract - 1) };
    });
  });
  return renewed;
}

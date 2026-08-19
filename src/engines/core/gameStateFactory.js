// Initial career/game-state factory.
import { diexDatabase } from '../../data/database.js';
import { getCareerSelectableClubs2026, resolveClub } from '../../data/clubCatalog.js';
import { getTeamStadium } from '../../data/database_coaches.js';
import { getTeamStadiumData } from '../../data/teamStadiumData.js';
import { generatePlayer, generateSquad } from './playerFactory.js';
import { generateFixtures, generateInitialTable } from './leagueEngine.js';
import { initializeSerieDCompetition } from '../serieD/serieDCompetition.js';

// Nova carreira usa apenas clubes canônicos. Finanças personalizadas ficam reservadas
// para uma futura criação de clubes próprios exclusivamente na Série D.

// 🌟 ATUALIZADO: Motor para criar jogador aceitando dados reais 🌟

const makeInvalidCareerClubError = (teamRef) => {
  const error = new Error(`Clube inválido para nova carreira: ${String(teamRef ?? '')}`);
  error.code = 'INVALID_CAREER_CLUB';
  return error;
};

const getInitialGameState = (teamRef, managerName, legacySerieOrProfile = {}, maybeManagerProfile = {}) => {
  const db = diexDatabase;
  const managerProfile = legacySerieOrProfile && typeof legacySerieOrProfile === 'object' && !Array.isArray(legacySerieOrProfile)
    ? legacySerieOrProfile
    : (maybeManagerProfile || {});
  const dbTeam = resolveClub(teamRef);
  const serie = String(dbTeam?.serie2026 || '').toUpperCase();
  const hasCanonicalTeamId = Boolean(dbTeam?.id && String(teamRef ?? '') === String(dbTeam.id));
  if (!dbTeam || !hasCanonicalTeamId || !['A','B','C','D'].includes(serie)) throw makeInvalidCareerClubError(teamRef);

  // A identidade e a divisão vêm exclusivamente do catálogo canônico. Qualquer
  // `serie` enviada pela interface ou por chamadas legadas é deliberadamente ignorada.
  const teamName = dbTeam.name;
  const existingTeamId = dbTeam.id;
  const userStrength = dbTeam.strength || { A:78, B:70, C:60, D:50 }[serie] || 60;
  const stadiumData = getTeamStadiumData(teamName) || null;
  const canonicalStadiumName = getTeamStadium(teamName) || stadiumData?.stadium || null;
  const userTeam = { id:'user', teamId:existingTeamId, name:teamName, strength:userStrength, isPlayer:true };

  const poolA = (db.serieATeams || []).filter((team) => team.id !== existingTeamId)
    .map((team) => ({ ...team, isPlayer:false, squad:generateSquad('A', team.name, team.strength, team.id) }));
  const poolB = (db.serieBTeams || []).filter((team) => team.id !== existingTeamId)
    .map((team) => ({ ...team, isPlayer:false, squad:generateSquad('B', team.name, team.strength, team.id) }));
  const poolC = (db.serieCTeams || []).filter((team) => team.id !== existingTeamId)
    .map((team) => ({ ...team, isPlayer:false, squad:generateSquad('C', team.name, team.strength, team.id) }));
  const poolD = (db.serieDTeams || []).filter((team) => team.id !== existingTeamId)
    .map((team) => ({ ...team, isPlayer:false, squad:generateSquad('D', team.name, team.strength, team.id) }));

  const selectedPool = serie === 'A' ? poolA : serie === 'B' ? poolB : serie === 'C' ? poolC : poolD;
  const activeCpuPool = serie === 'D' ? selectedPool : selectedPool.slice(0, 19);
  const preliminaryTeams = serie === 'D' ? [userTeam, ...activeCpuPool] : [userTeam, ...activeCpuPool];
  const leagues = {
    A: serie === 'A' ? activeCpuPool : poolA,
    B: serie === 'B' ? activeCpuPool : poolB,
    C: serie === 'C' ? activeCpuPool : poolC,
    D: serie === 'D' ? activeCpuPool : poolD,
  };
  const serieDSeason = serie === 'D'
    ? initializeSerieDCompetition({ userTeam, userCanonicalId:existingTeamId, cpuTeams:activeCpuPool, season:2026 })
    : null;
  const allTeams = serieDSeason?.teams || preliminaryTeams;
  const activeCpuIds = new Set(Object.values(leagues).flat().map((team) => String(team.id)));
  const allSelectable = getCareerSelectableClubs2026();
  const pyramidReserve = [poolA, poolB, poolC, poolD].flat()
    .map(({ squad, ...team }) => team)
    .concat(allSelectable.map((team) => ({ ...team, isPlayer:false })))
    .filter((team, index, list) => {
      const id = String(team?.id || '');
      if (!id || id === existingTeamId || activeCpuIds.has(id)) return false;
      return list.findIndex((candidate) => String(candidate?.id || '') === id) === index;
    });

  const teamRosters = {};
  Object.values(leagues).flat().forEach((team) => { if (team.squad) teamRosters[team.id] = team.squad; });

  const mktOvr = { A:70, B:63, C:57, D:50 }[serie] || 63;
  const userPlayers = generateSquad(serie, teamName, { A:75, B:67, C:59, D:48 }[serie] || 67, 'user');
  teamRosters.user = userPlayers;

  return {
    season:2026, serie, round:0, morale:60,
    club: {
      teamId:existingTeamId,
      name:teamName,
      manager:managerName,
      managerProfile: {
        age:managerProfile.age || 40,
        nationality:managerProfile.nationality || 'Brasileiro',
        preferredFormation:managerProfile.formation || '4-4-2',
        style:managerProfile.style || 'Equilibrado',
        experience:0, wins:0, draws:0, losses:0,
      },
      colorPrimary:managerProfile.colorPrimary || '#118a8b',
      colorSecondary:managerProfile.colorSecondary || '#ffffff',
      kitPattern:managerProfile.kitPattern || 'solid',
      kitAccent:managerProfile.kitAccent || '#ffffff',
      money:Number(dbTeam.money) || 0,
      transferBudget:Number(dbTeam.budget) || Math.round((Number(dbTeam.money) || 0) * 0.80 / 1000) * 1000,
      wage:userPlayers.reduce((sum, player) => sum + (Number(player.wage) || 0), 0),
      formation:managerProfile.formation || '4-4-2',
      sponsors:{ master:null, stadium:null },
      upgrades:{},
      existingTeamId,
      strength:userStrength,
      fanLoyalty:dbTeam.fanBase != null ? Math.round(dbTeam.fanBase * 100) : 50,
      stadium: {
        name:canonicalStadiumName || 'Estádio não cadastrado',
        capacity:Number(stadiumData?.capacity) || ({ A:20000, B:12000, C:7000, D:4000 }[serie] || 12000),
        level:1,
        ticketPrice:{ A:50, B:30, C:20, D:12 }[serie] || 30,
      },
    },
    players:userPlayers,
    teams:allTeams,
    teamRosters,
    table:serieDSeason?.table || generateInitialTable(allTeams),
    fixtures:serieDSeason?.fixtures || generateFixtures(allTeams),
    leagues,
    pyramidReserve,
    leaguePyramidVersion:2,
    serieDCompetition:serieDSeason?.competition || null,
    serieCCompetition:null,
    serieCLegacyFormat:false,
    market:Array.from({ length:15 }, () => {
      const player = generatePlayer(null, 'Livre', mktOvr);
      return player ? { ...player, teamName:'Livre' } : null;
    }).filter(Boolean),
    cups:null, scorers:{}, financialHistory:[],
  };
};

// ═══════════════════════════════════════════════════════════════
// PRÓXIMA TEMPORADA

export { getInitialGameState };

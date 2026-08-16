// Season transition orchestrator. Detailed rules live in src/engines/season/.
import { generatePlayer } from './playerFactory.js';
import { generateFixtures, generateInitialTable } from './leagueEngine.js';
import { buildSeasonSnapshot, getFinalTable, getNextSerie, getSeasonMovement } from '../season/seasonOutcome.js';
import { buildSeasonTeams, renewCpuRosters } from '../season/seasonTeams.js';
import { advanceUserRoster } from '../season/seasonRoster.js';
import { buildDifficultyProgression, buildNextSeasonClub } from '../season/seasonClub.js';
import { advanceSeasonAcademies } from '../season/seasonAcademy.js';

const MARKET_OVR = Object.freeze({ A: 70, B: 63, C: 57, D: 50 });

const buildSeasonMarket = (serie) => Array.from({ length: 15 }, () => {
  const player = generatePlayer(null, 'Livre', MARKET_OVR[serie] || 57);
  return player ? { ...player, teamName: 'Livre' } : null;
}).filter(Boolean);

const generateNextSeason = (prevState) => {
  const finalTable = getFinalTable(prevState);
  const prevSerie = prevState.serie || 'A';
  const userPos = finalTable.findIndex((team) => team.id === 'user') + 1;
  const newSerie = getNextSerie(prevSerie, userPos);
  const movement = getSeasonMovement(prevSerie, newSerie);
  const seasonResult = buildSeasonSnapshot(prevState, finalTable, newSerie);
  const teams = buildSeasonTeams(prevState, finalTable, newSerie);
  const updatedPlayers = advanceUserRoster(prevState, newSerie, teams.userTeam.name);
  const difficulty = buildDifficultyProgression(prevState, movement);
  const renewedRosters = renewCpuRosters(teams.teamRosters);
  const academy = advanceSeasonAcademies(prevState, teams.pools, renewedRosters, updatedPlayers);
  const seasonTrophies = (seasonResult.champion ? 1 : 0)
    + ['copaBrasil', 'libertadores', 'sulAmericana']
      .filter((key) => prevState.cups?.[key]?.status === 'champion').length;
  const nextClub = buildNextSeasonClub({
    prevState,
    newClubData: teams.newClubData,
    existingTeamId: teams.existingTeamId,
    promoted: movement.promoted,
    relegated: movement.relegated,
    champion: seasonResult.champion,
    position: userPos,
    players: updatedPlayers,
    difficultyLevel: difficulty.level,
    newSerie,
    seasonTrophies,
  });

  return {
    ...prevState,
    season: (Number(prevState.season) || 0) + 1,
    serie: newSerie,
    round: 0,
    leagueRound: 0,
    morale: 65,
    teams: teams.allTeams,
    teamRosters: renewedRosters,
    table: generateInitialTable(teams.allTeams),
    fixtures: generateFixtures(teams.allTeams),
    players: updatedPlayers,
    market: buildSeasonMarket(newSerie),
    cups: null,
    scorers: {},
    h2hHistory: {},
    pendingManagerTransfer: null,
    calendar: null,
    difficultyMultipliers: difficulty.multipliers,
    seasonResult,
    financialHistory: prevState.financialHistory || [],
    leagues: teams.pools,
    ...academy,
    club: nextClub,
  };
};

export { generateNextSeason };

// Season transition orchestrator. Detailed rules live in src/engines/season/.
import { generatePlayer } from './playerFactory.js';
import { generateFixtures, generateInitialTable } from './leagueEngine.js';
import { buildSeasonSnapshot, getFinalTable, getNextSerieForSeason, getSeasonMovement } from '../season/seasonOutcome.js';
import { buildSeasonTeams } from '../season/seasonTeams.js';
import { advanceUserRosterWithDepartures } from '../season/seasonRoster.js';
import { buildDifficultyProgression, buildNextSeasonClub } from '../season/seasonClub.js';
import { advanceSeasonAcademies } from '../season/seasonAcademy.js';
import { tagLegacyFinancialHistory } from '../finances/financeLedger.js';
import { reconcileClubIdentity } from '../persistence/clubIdentity.js';
import { getSerieDUserOutcome, initializeSerieDCompetition } from '../serieD/serieDCompetition.js';
import { getSerieCUserOutcome, initializeSerieCCompetition } from '../serieC/serieCCompetition.js';
import { appendNewsItems, buildSeasonOutcomeNews } from '../news/newsEngine.js';

const MARKET_OVR = Object.freeze({ A: 70, B: 63, C: 57, D: 50 });

const dedupeInbox = (inbox = []) => {
  const seen = new Set();
  return (Array.isArray(inbox) ? inbox : []).filter((message) => {
    const id = message?.id == null ? null : String(message.id);
    if (id == null) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, 80);
};

const buildSeasonMarket = (serie, extraFreeAgents = [], rng = Math.random) => {
  const seen = new Set();
  const market = [];
  (extraFreeAgents || []).forEach((player) => {
    const key = player?.id == null ? null : String(player.id);
    if (!key || seen.has(key)) return;
    seen.add(key);
    market.push({ ...player, teamId:null, teamName:'Livre', originTeamId:null, originTeamName:null, isStarting:false, isListed:true });
  });
  while (market.length < 15) {
    const player = generatePlayer(null, 'Livre', MARKET_OVR[serie] || 57, null, null, rng);
    if (!player) break;
    const key = String(player.id);
    if (seen.has(key)) continue;
    seen.add(key);
    market.push({ ...player, teamId:null, teamName:'Livre', isStarting:false, isListed:true });
  }
  return market;
};

const generateNextSeason = (prevState, rng = Math.random) => {
  // A virada pode ser chamada antes de o save passar novamente pela persistência.
  // Normalize IDs legados aqui para não perder rosters ao cruzar a fronteira de temporada.
  const sourceState = reconcileClubIdentity(prevState);
  const finalTable = getFinalTable(sourceState);
  const prevSerie = sourceState.serie || 'A';
  const userPos = finalTable.findIndex((team) => team.id === 'user') + 1;
  const serieDOutcome = prevSerie === 'D' ? getSerieDUserOutcome(sourceState) : null;
  const serieCOutcome = prevSerie === 'C' ? getSerieCUserOutcome(sourceState) : null;
  const projectedSerie = serieDOutcome
    ? (serieDOutcome.promoted ? 'C' : 'D')
    : serieCOutcome
      ? (serieCOutcome.promoted ? 'B' : serieCOutcome.relegated ? 'D' : 'C')
      : getNextSerieForSeason(prevSerie, userPos, sourceState.season);
  const movement = getSeasonMovement(prevSerie, projectedSerie);
  const seasonResult = buildSeasonSnapshot(sourceState, finalTable, projectedSerie);
  const teams = buildSeasonTeams(sourceState, finalTable, projectedSerie, rng);
  const newSerie = teams.userSerie || projectedSerie;
  const nextSeasonNumber = (Number(sourceState.season) || 0) + 1;
  const serieDSeason = newSerie === 'D'
    ? initializeSerieDCompetition({
        userTeam:teams.userTeam,
        userCanonicalId:teams.existingTeamId,
        cpuTeams:teams.pools?.D || [],
        season:nextSeasonNumber,
      })
    : null;
  const serieCSeason = newSerie === 'C' && nextSeasonNumber === 2027
    ? initializeSerieCCompetition({
        userTeam:teams.userTeam,
        userCanonicalId:teams.existingTeamId,
        cpuTeams:teams.pools?.C || [],
        season:nextSeasonNumber,
      })
    : null;
  const dedicatedSeason = serieDSeason || serieCSeason;
  const userRoster = Array.isArray(teams.incomingUserPlayers)
    ? { players:teams.incomingUserPlayers, departures:[] }
    : advanceUserRosterWithDepartures(sourceState, newSerie, teams.userTeam.name, rng);
  const updatedPlayers = userRoster.players;
  const difficulty = buildDifficultyProgression(sourceState, movement);
  const nextTeamRosters = { ...(teams.teamRosters || {}), user:updatedPlayers };
  const academy = advanceSeasonAcademies(sourceState, teams.pools, nextTeamRosters, updatedPlayers);
  const seasonTrophies = (seasonResult.champion ? 1 : 0)
    + ['copaBrasil', 'libertadores', 'sulAmericana', 'regional', 'estadual']
      .filter((key) => sourceState.cups?.[key]?.status === 'champion').length;
  const taggedFinancialHistory = tagLegacyFinancialHistory(sourceState.financialHistory || [], sourceState.season);
  const nextClub = buildNextSeasonClub({
    prevState: sourceState,
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
    ...sourceState,
    season: nextSeasonNumber,
    serie: newSerie,
    round: 0,
    leagueRound: 0,
    morale: 65,
    teams: dedicatedSeason?.teams || teams.allTeams,
    teamRosters: nextTeamRosters,
    table: dedicatedSeason?.table || generateInitialTable(teams.allTeams),
    fixtures: dedicatedSeason?.fixtures || generateFixtures(teams.allTeams),
    players: updatedPlayers,
    market: buildSeasonMarket(newSerie, [...userRoster.departures, ...(teams.freeAgents || [])], rng),
    inbox: dedupeInbox(sourceState.inbox || []),
    cups: null,
    scorers: {},
    // Confronto direto é histórico de carreira, não apenas da temporada.
    h2hHistory: { ...(sourceState.h2hHistory || {}) },
    pendingManagerTransfer: null,
    // IDs transacionais pertencem à temporada encerrada e não devem vazar
    // para o primeiro compromisso do novo calendário.
    lastMatchCommit: null,
    lastRoundMaintenance: null,
    calendar: null,
    // A data civil pertence à temporada encerrada. Manter dezembro aqui faria
    // o preflight reutilizar uma data posterior à estreia do novo calendário.
    currentDateISO:null,
    currentDate:null,
    calendarModel:'annual-v1',
    difficultyMultipliers: difficulty.multipliers,
    seasonResult,
    newsFeed:appendNewsItems(sourceState.newsFeed, [buildSeasonOutcomeNews(sourceState, seasonResult)]),
    financialHistory: taggedFinancialHistory,
    leagues: teams.pools,
    serieDCompetition: serieDSeason?.competition || null,
    serieCCompetition: serieCSeason?.competition || null,
    serieCLegacyFormat:false,
    leaguePyramidVersion: 2,
    pyramidReserve: teams.pyramidReserve || [],
    lastDivisionMovement: teams.divisionMovement || null,
    ...academy,
    club: nextClub,
  };
};

export { generateNextSeason };

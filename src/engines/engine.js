// engines/engine.js — compatibility barrel for the core game engine.
// Domain logic lives in src/engines/core/; existing imports can keep using this file.

export {
  generatePlayer,
  generateSquad,
} from './core/playerFactory.js';

export {
  buildLeagueIntegrityReport,
  buildLeagueScheduleReport,
  generateFixtures,
  generateInitialTable,
  getLeagueFixtureSummary,
  hasDoubleRoundRobinShape,
  isCompleteDoubleRoundRobin,
  parseLeagueResult,
  rebuildLeagueTable,
  reconcileLeagueState,
  sortLeagueTable,
  getTableZoneColor,
} from './core/leagueEngine.js';

export { getInitialGameState } from './core/gameStateFactory.js';
export { generateNextSeason } from './core/seasonEngine.js';
export { applySeasonEvolution } from './core/playerDevelopment.js';
export { calcTeamRecentForm, calcCPUAvailableStrength } from './core/teamMetrics.js';

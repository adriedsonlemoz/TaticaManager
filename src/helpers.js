// helpers.js — barril de compatibilidade legado.
// O código novo deve importar cada responsabilidade diretamente do módulo de origem.
export { FORMATION_SLOTS, POSITION_COMPAT, canPlayAs, getLineupValidation } from './engines/lineup/lineupRules.js';
export { posColor, ovrColor, getAgeColor, getPositionColor, POSITION_COLORS } from './utils/playerVisuals.js';
export { calculateMorale, getRecentMoraleResults } from './engines/core/moraleEngine.js';
export { processFatigueAndInjuries } from './engines/match/playerConditionProcessor.js';
export { parseMatchEvent, SMR_parseEvent } from './engines/match/matchEventParser.js';

// Fachada pública do calendário de partidas.
// Regras reais ficam separadas por responsabilidade para manter consumidores antigos estáveis.
export { buildRoundDates } from '../../utils/matchDateUtils.js';
export { MONTH_NAMES, WEEK_DAYS_SHORT, WEEK_DAYS, CUP_META, getCupColor, getCupLabel } from './matchesConstants.js';
export { getMatchResult } from './matchResultService.js';
export { getCupInfoForSlot, getCupTeams } from './cupMatchResolver.js';
export { buildDayRoundsMap, getMatchesForDay, getCalendarWindow, getCalendarMonthOffsetForRound, getCupRoundDate } from './matchesCalendarService.js';
export { buildUpcomingEvents, buildRecentResults } from './matchesTimelineService.js';

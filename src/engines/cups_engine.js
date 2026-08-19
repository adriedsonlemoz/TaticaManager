// @migrated to ES module
// Compatibilidade pública das Copas do Tática Manager.
// As regras foram divididas em src/engines/cups/ na beta.12.

import { initCopaBrasil, registerCopaLegResult, registerCupaLegResult } from './cups/copaBrasilEngine.js';
import {
  initLibertadores,
  initSulAmericana,
  registerGroupLegResult,
  registerKnockoutLegResult,
} from './cups/continentalEngine.js';
import { getCupMatchForRound, getUpcomingCupMatches } from './cups/cupQueries.js';
import { autoInitCupsForSeason } from './cups/cupSeason.js';
import { initRegionalCompetition, registerRegionalResult, getRegionalMatchForCalendarSlot } from './cups/regionalEngine.js';
import { initStateCompetition, registerStateResult, getStateMatchForCalendarSlot } from './cups/stateEngine.js';
import {
  COPA_PRIZES,
  COPA_PHASES_A,
  COPA_PHASES_B,
  COPA_PHASES_C,
  COPA_PHASES_D,
  COPA_SCHEDULE_A,
  COPA_SCHEDULE_B,
  COPA_SCHEDULE_C,
  COPA_SCHEDULE_D,
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cups/cupConfig.js';
import { decideTie, simGoals, simPenalties } from './cups/cupUtils.js';

export const CupsEngine = {
  initCopaBrasil,
  registerCopaLegResult,
  registerCupaLegResult,
  initLibertadores,
  registerGroupLegResult,
  registerKnockoutLegResult,
  initSulAmericana,
  getCupMatchForRound,
  getUpcomingCupMatches,
  autoInitCupsForSeason,
  initRegionalCompetition,
  registerRegionalResult,
  getRegionalMatchForCalendarSlot,
  initStateCompetition,
  registerStateResult,
  getStateMatchForCalendarSlot,
  COPA_PRIZES,
  COPA_PHASES_A,
  COPA_PHASES_B,
  COPA_PHASES_C,
  COPA_PHASES_D,
  COPA_SCHEDULE_A,
  COPA_SCHEDULE_B,
  COPA_SCHEDULE_C,
  COPA_SCHEDULE_D,
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
  _decideTie: decideTie,
  _simGoals: simGoals,
  _simPenalties: simPenalties,
};

export {
  initCopaBrasil,
  registerCopaLegResult,
  registerCupaLegResult,
  initLibertadores,
  initSulAmericana,
  registerGroupLegResult,
  registerKnockoutLegResult,
  getCupMatchForRound,
  getUpcomingCupMatches,
  autoInitCupsForSeason,
  initRegionalCompetition,
  registerRegionalResult,
  getRegionalMatchForCalendarSlot,
  initStateCompetition,
  registerStateResult,
  getStateMatchForCalendarSlot,
  COPA_PRIZES,
  COPA_PHASES_A,
  COPA_PHASES_B,
  COPA_PHASES_C,
  COPA_PHASES_D,
  COPA_SCHEDULE_A,
  COPA_SCHEDULE_B,
  COPA_SCHEDULE_C,
  COPA_SCHEDULE_D,
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
};

export default CupsEngine;

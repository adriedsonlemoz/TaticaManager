// Fachada pública das competições continentais.
// A partir da beta.30, grupos, elegibilidade e mata-mata vivem em módulos separados.
import { diexDatabase } from '../../data/database.js';
import '../../data/database_extra.js';
import {
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cupConfig.js';
import {
  isEligibleForLibertadores,
  isEligibleForSulAmericana,
  resolveCompetitionConfig,
} from './continentalConfig.js';
import {
  buildGroupCompetition,
  recordGroupLegResult,
} from './continentalGroup.js';
import {
  createFirstKnockoutTie,
  recordKnockoutLegResult,
} from './continentalKnockout.js';

const getOpponentPool = (cup = {}) => [
  ...(diexDatabase.conmebolTeams || []),
  ...((Array.isArray(cup.domesticOpponentPool) && cup.domesticOpponentPool.length) ? cup.domesticOpponentPool : (diexDatabase.serieATeams || [])),
].filter((team) => team?.id && team.id !== cup.userSourceTeamId);

export const initLibertadores = (gameData, rng = Math.random) => {
  if (!isEligibleForLibertadores(gameData)) return null;
  const cup = buildGroupCompetition({
    gameData,
    competitionKey: 'libertadores',
    userStrength: 80,
    prizes: LIBERTA_PRIZES,
    schedule: LIBERTA_SCHEDULE,
    idPrefix: 'lib_g',
    opponentPool: diexDatabase.conmebolTeams || [],
    rng,
  });
  return { ...cup, domesticOpponentPool:[...(gameData?.leagues?.A || [])] };
};

export const initSulAmericana = (gameData, rng = Math.random) => {
  if (!isEligibleForSulAmericana(gameData)) return null;
  const cup = buildGroupCompetition({
    gameData,
    competitionKey: 'sulAmericana',
    userStrength: 75,
    prizes: SULAM_PRIZES,
    schedule: SULAM_SCHEDULE,
    idPrefix: 'sul_g',
    opponentPool: diexDatabase.conmebolTeams || [],
    rng,
  });
  return { ...cup, domesticOpponentPool:[...(gameData?.leagues?.A || [])] };
};

export const registerGroupLegResult = (
  cup,
  matchId,
  homeGoals,
  awayGoals,
  prizeMap,
  scheduleMap,
  isLeg2 = false,
  rng = Math.random,
) => {
  if (!cup) return cup;
  const recorded = recordGroupLegResult({
    cup,
    matchId,
    homeGoals,
    awayGoals,
    isLeg2,
    rng,
  });
  if (!recorded || recorded.duplicate) return recorded?.cup || cup;

  const { prizes, schedule, key } = resolveCompetitionConfig(cup, prizeMap, scheduleMap);
  const baseCup = {
    ...recorded.cup,
    competitionKey: cup.competitionKey || key,
  };
  if (!recorded.allDone) return baseCup;

  const userRank = (baseCup.group || []).findIndex((team) => team.isPlayer) + 1;
  const groupHistory = { label: 'Fase de Grupos', group: baseCup.group };
  const groupPrize = prizes.group || 0;
  const withGroupPrize = {
    ...baseCup,
    history: [...(cup.history || []), groupHistory],
    totalPrize: (cup.totalPrize || 0) + groupPrize,
  };

  if (userRank < 1 || userRank > 2) {
    return { ...withGroupPrize, status: 'eliminated' };
  }

  return {
    ...withGroupPrize,
    phase: 'knockout',
    phaseLabel: 'Oitavas de Final',
    knockoutTie: createFirstKnockoutTie({
      cup: withGroupPrize,
      prizes,
      schedule,
      opponentPool: getOpponentPool(withGroupPrize),
      rng,
    }),
  };
};

export const registerKnockoutLegResult = (
  cup,
  leg,
  homeGoals,
  awayGoals,
  prizeMap,
  scheduleMap,
  rng = Math.random,
) => {
  if (!cup?.knockoutTie) return cup;
  const { prizes, schedule, key } = resolveCompetitionConfig(cup, prizeMap, scheduleMap);
  return {
    ...recordKnockoutLegResult({
      cup,
      leg,
      homeGoals,
      awayGoals,
      prizes,
      schedule,
      opponentPool: getOpponentPool(cup),
      rng,
    }),
    competitionKey: cup.competitionKey || key,
  };
};

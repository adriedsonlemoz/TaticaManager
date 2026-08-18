import {
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cupConfig.js';

export const CONTINENTAL_PHASES = ['Oitavas', 'Quartas', 'Semifinal', 'Final'];

export const getCompetitionKey = (cup, prizeMap) => {
  if (cup?.competitionKey) return cup.competitionKey;
  if ((cup?.groupMatches || []).some((match) => String(match.id || '').startsWith('sul_g'))) {
    return 'sulAmericana';
  }
  if (prizeMap?.group === SULAM_PRIZES.group) return 'sulAmericana';
  return 'libertadores';
};

export const resolveCompetitionConfig = (cup, prizeMap, scheduleMap) => {
  const key = getCompetitionKey(cup, prizeMap);
  const defaultPrizes = key === 'sulAmericana' ? SULAM_PRIZES : LIBERTA_PRIZES;
  const defaultSchedule = key === 'sulAmericana' ? SULAM_SCHEDULE : LIBERTA_SCHEDULE;
  return {
    key,
    prizes: prizeMap && Object.keys(prizeMap).length ? prizeMap : defaultPrizes,
    schedule: scheduleMap && Object.keys(scheduleMap).length ? scheduleMap : defaultSchedule,
  };
};

export const getUserTablePosition = (gameData) => (
  (gameData?.table || []).findIndex((team) => team.id === 'user') + 1
);

export const isEligibleForLibertadores = (gameData) => {
  const position = getUserTablePosition(gameData);
  return gameData?.serie === 'A' && position >= 1 && position <= 6;
};

export const isEligibleForSulAmericana = (gameData) => {
  const position = getUserTablePosition(gameData);
  if (gameData?.serie === 'A') return position >= 7 && position <= 12;
  if (gameData?.serie === 'B') return position === 1;
  return false;
};

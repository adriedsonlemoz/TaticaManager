import { initCopaBrasil } from './copaBrasilEngine.js';
import { initLibertadores, initSulAmericana } from './continentalEngine.js';

const tableWithUserAtPosition = (table, finalPosition) => {
  const teams = [...(table || [])];
  const user = teams.find((team) => team.id === 'user');
  const others = teams.filter((team) => team.id !== 'user');
  if (!user) return teams;

  const index = Math.max(0, Math.min(others.length, (finalPosition || 1) - 1));
  others.splice(index, 0, user);
  return others;
};

export const autoInitCupsForSeason = (gameData, isFirstSeason) => {
  const copaBrasil = initCopaBrasil(gameData);
  if (isFirstSeason) {
    return { copaBrasil, libertadores: null, sulAmericana: null };
  }

  const currentSerie = gameData.serie || 'A';
  if (currentSerie === 'C' || currentSerie === 'D') {
    return { copaBrasil, libertadores: null, sulAmericana: null };
  }

  const previousPosition = gameData.seasonResult?.finalPosition || null;
  const previousSerie = gameData.seasonResult?.prevSerie || currentSerie;
  if (!previousPosition || previousSerie === 'C' || previousSerie === 'D') {
    return { copaBrasil, libertadores: null, sulAmericana: null };
  }

  const previousSeasonView = {
    ...gameData,
    serie: previousSerie,
    table: tableWithUserAtPosition(gameData.table, previousPosition),
  };

  return {
    copaBrasil,
    libertadores: initLibertadores(previousSeasonView),
    sulAmericana: initSulAmericana(previousSeasonView),
  };
};

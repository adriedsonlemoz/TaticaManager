import { initCopaBrasil } from './copaBrasilEngine.js';
import { initLibertadores, initSulAmericana } from './continentalEngine.js';
import { initRegionalCompetition } from './regionalEngine.js';
import { initStateCompetition } from './stateEngine.js';

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
  const estadual = initStateCompetition(gameData);
  let libertadores = null;
  let sulAmericana = null;

  if (!isFirstSeason) {
    const currentSerie = gameData.serie || 'A';
    const previousPosition = gameData.seasonResult?.finalPosition || null;
    const previousSerie = gameData.seasonResult?.prevSerie || currentSerie;
    if (currentSerie !== 'C' && currentSerie !== 'D' && previousPosition && previousSerie !== 'C' && previousSerie !== 'D') {
      const previousSeasonView = {
        ...gameData,
        serie: previousSerie,
        table: tableWithUserAtPosition(gameData.table, previousPosition),
      };
      libertadores = initLibertadores(previousSeasonView);
      sulAmericana = initSulAmericana(previousSeasonView);
    }
  }

  // Regulamento regional de 2026 impede acúmulo com competições CONMEBOL.
  // Para temporadas futuras, a mesma incompatibilidade é preservada como regra
  // de gameplay até a entrada dos estaduais/classificatórios dinâmicos.
  const regional = initRegionalCompetition(gameData, {
    hasContinental:Boolean(libertadores || sulAmericana),
  });

  return { copaBrasil, libertadores, sulAmericana, regional, estadual };
};

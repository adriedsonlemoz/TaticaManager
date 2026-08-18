import { CupsEngine } from '../cups_engine.js';
import { generateNextSeason } from '../core/seasonEngine.js';
import { buildLeagueIntegrityReport, buildLeagueScheduleReport, isCompleteDoubleRoundRobin } from '../core/leagueEngine.js';
import { buildCareerSeasonEntry, buildSeasonSnapshot, getFinalTable } from './seasonOutcome.js';

export function prepareSeasonTransition(gameData = {}) {
  const sourceTable = Array.isArray(gameData.table) ? gameData.table : [];
  const fixtures = Array.isArray(gameData.fixtures) ? gameData.fixtures : [];

  // Saves modernos usam 20 clubes em pontos corridos. Antes da virada, exige
  // calendário íntegro e todos os 380 jogos processados para não coroar/rebaixar
  // com a última rodada faltando. Saves legados/sintéticos menores mantêm fallback.
  if (sourceTable.length === 20) {
    const schedule = buildLeagueScheduleReport(sourceTable, fixtures);
    if (!schedule.ok) {
      return {
        status:'invalid-season',
        reason:`Calendário da Liga inconsistente: ${schedule.errors[0] || 'estrutura inválida'}.`,
        schedule,
      };
    }
    if (!isCompleteDoubleRoundRobin(sourceTable, fixtures)) {
      const played = fixtures.flat().filter((match) => match?.played === true).length;
      return {
        status:'invalid-season',
        reason:`A Liga ainda não foi totalmente processada (${played}/${schedule.expectedMatches} jogos).`,
        schedule,
      };
    }
  }

  const finalTable = getFinalTable(gameData);
  if (sourceTable.length === 20) {
    const integrity = buildLeagueIntegrityReport(finalTable, fixtures);
    if (!integrity.ok) {
      return {
        status:'invalid-season',
        reason:`Classificação final inconsistente: ${integrity.errors[0] || 'falha de integridade'}.`,
        integrity,
        finalTable,
      };
    }
  }
  const snapshot = buildSeasonSnapshot(gameData, finalTable);
  const objective = snapshot.objective;

  if (objective?.applicable !== false && objective?.success === false) {
    return {
      status: 'fired',
      reason: objective.message,
      snapshot,
      finalTable,
    };
  }

  const seasonEntry = buildCareerSeasonEntry(gameData, snapshot);
  const careerHistory = [...(gameData.careerHistory || []), seasonEntry];
  const nextState = generateNextSeason({
    ...gameData,
    table: finalTable,
    careerHistory,
    seasonResult: snapshot,
  });
  nextState.careerHistory = careerHistory;

  if (CupsEngine?.autoInitCupsForSeason) {
    nextState.cups = CupsEngine.autoInitCupsForSeason(nextState, false);
  }

  return {
    status: 'advanced',
    nextState,
    snapshot: nextState.seasonResult || snapshot,
    finalTable,
    seasonEntry,
  };
}

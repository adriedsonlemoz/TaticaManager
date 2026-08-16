import { CupsEngine } from '../cups_engine.js';
import { generateNextSeason } from '../core/seasonEngine.js';
import { buildCareerSeasonEntry, buildSeasonSnapshot, getFinalTable } from './seasonOutcome.js';

export function prepareSeasonTransition(gameData = {}) {
  const finalTable = getFinalTable(gameData);
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

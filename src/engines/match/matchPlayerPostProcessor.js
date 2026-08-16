import { DisciplineEngine } from '../engine_discipline.js';
import { processFatigueAndInjuries } from './playerConditionProcessor.js';
import { accumulateMinutes, accumulateUserGoals } from './matchPlayerStats.js';
import { buildMatchRoundContext } from './matchRoundContext.js';

export function getUserMatchResult(gameData, userMatchData) {
  if (!userMatchData) return null;
  const isHome = userMatchData.homeName === gameData.club?.name;
  const myGoals = isHome ? (userMatchData.homeGoals || 0) : (userMatchData.awayGoals || 0);
  const opponentGoals = isHome ? (userMatchData.awayGoals || 0) : (userMatchData.homeGoals || 0);
  return myGoals > opponentGoals ? 'W' : myGoals < opponentGoals ? 'L' : 'D';
}

export function buildUserGoalCount(rawEvents = []) {
  return rawEvents.reduce((counts, event) => {
    if (event?.type !== 'goal' || !event?.isPlayer || !event?.scorerObj?.id) return counts;
    counts[event.scorerObj.id] = (counts[event.scorerObj.id] || 0) + 1;
    return counts;
  }, {});
}

export function applyIndividualMorale(players = [], { result, goalCount = {} } = {}) {
  return players.map((player) => {
    let delta = 0;
    if (result === 'W') delta += player.isStarting ? 4 : 2;
    else if (result === 'L') delta -= player.isStarting ? 3 : 1;

    delta += (goalCount[player.id] || 0) * 6;
    if (player.injury) delta -= 8;

    return {
      ...player,
      moralIndividual: Math.max(10, Math.min(100, (player.moralIndividual ?? 60) + delta)),
    };
  });
}

export function processLeaguePlayers({ gameData, userMatchData, allRawEvents = [] }) {
  const rounds = buildMatchRoundContext(gameData);
  let updatedPlayers = accumulateUserGoals(gameData.players || [], allRawEvents);
  updatedPlayers = accumulateMinutes(updatedPlayers);
  updatedPlayers = applyIndividualMorale(updatedPlayers, {
    result: getUserMatchResult(gameData, userMatchData),
    goalCount: buildUserGoalCount(allRawEvents),
  });

  if (DisciplineEngine?.clearSuspensionAndResetCards) {
    updatedPlayers = DisciplineEngine.clearSuspensionAndResetCards(
      updatedPlayers,
      rounds.calendarRoundPlayed,
    );
  }

  if (DisciplineEngine?.processMatchDisciplineEvents) {
    updatedPlayers = DisciplineEngine.processMatchDisciplineEvents(
      updatedPlayers,
      userMatchData?.events || [],
      rounds.calendarRoundPlayed,
      allRawEvents,
    );
  }

  updatedPlayers = processFatigueAndInjuries(
    updatedPlayers,
    userMatchData?.events || null,
    {
      difficultyMult: gameData.difficultyMultipliers?.fatigueLoss || 1.0,
      injuryChanceMult: gameData.difficultyMultipliers?.injuryChance || 1.0,
      isCupMatch: Boolean(userMatchData?.isCupMatch),
    },
  );

  return updatedPlayers;
}

export function preparePostMatchPlayers(gameData, updatedPlayers = [], trainingInjury = {}, rng = Math.random) {
  const { nextCalendarRound } = buildMatchRoundContext(gameData);
  let players = trainingInjury?.playerId
    ? updatedPlayers.map((player) => player.id === trainingInjury.playerId
      ? {
          ...player,
          isStarting: false,
          injury: { type: 'Leve (Treino)', roundsLeft: 1 + Math.floor(rng() * 2) },
        }
      : player)
    : updatedPlayers;

  players = players.map((player) => {
    if (!player.isStarting) return player;
    const isNowInjured = Boolean(player.injury);
    const isNowSuspended = DisciplineEngine?.isPlayerSuspended
      ? DisciplineEngine.isPlayerSuspended(player, nextCalendarRound)
      : player.discipline?.suspendedUntilRound != null
        && nextCalendarRound <= player.discipline.suspendedUntilRound;
    return isNowInjured || isNowSuspended ? { ...player, isStarting: false } : player;
  });

  return players;
}

import { DisciplineEngine } from '../engine_discipline.js';
import { processFatigueAndInjuries } from './playerConditionProcessor.js';
import { accumulateMinutes, accumulateUserGoals, buildMatchMinutes, isScoringEvent } from './matchPlayerStats.js';
import { buildMatchRoundContext } from './matchRoundContext.js';
import { isUserMatchTeam } from './matchStateUtils.js';

const idKey = (value) => value == null ? null : String(value);
const idsEqual = (left, right) => {
  const leftKey = idKey(left);
  const rightKey = idKey(right);
  return leftKey != null && rightKey != null && leftKey === rightKey;
};

export function getUserMatchResult(gameData, userMatchData) {
  if (!userMatchData) return null;
  const isHome = typeof userMatchData.userIsHome === 'boolean'
    ? userMatchData.userIsHome
    : isUserMatchTeam({ id:userMatchData.homeId, name:userMatchData.homeName, isPlayer:userMatchData.homeIsPlayer }, gameData.club?.name);
  const myGoals = isHome ? (Number(userMatchData.homeGoals) || 0) : (Number(userMatchData.awayGoals) || 0);
  const opponentGoals = isHome ? (Number(userMatchData.awayGoals) || 0) : (Number(userMatchData.homeGoals) || 0);
  return myGoals > opponentGoals ? 'W' : myGoals < opponentGoals ? 'L' : 'D';
}

export function buildUserGoalCount(rawEvents = []) {
  return (Array.isArray(rawEvents) ? rawEvents : []).reduce((counts, event) => {
    if (!isScoringEvent(event) || !event?.isPlayer || event?.scorerObj?.id == null) return counts;
    const key = idKey(event.scorerObj.id);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function applyIndividualMorale(players = [], { result, goalCount = {} } = {}) {
  return (Array.isArray(players) ? players : []).map((player) => {
    let delta = 0;
    if (result === 'W') delta += player.isStarting ? 4 : 2;
    else if (result === 'L') delta -= player.isStarting ? 3 : 1;

    delta += (goalCount[idKey(player.id)] || 0) * 6;
    if (player.injury) delta -= 8;

    return {
      ...player,
      moralIndividual: Math.max(10, Math.min(100, (Number(player.moralIndividual) || 60) + delta)),
    };
  });
}

export function processMatchPlayers({ gameData, userMatchData, allRawEvents = [], liveSubstitutions = [], rng = Math.random }) {
  const rounds = buildMatchRoundContext(gameData);
  let updatedPlayers = accumulateUserGoals(gameData.players || [], allRawEvents, rng);
  const matchMinutes = buildMatchMinutes(updatedPlayers, liveSubstitutions, allRawEvents);
  updatedPlayers = accumulateMinutes(updatedPlayers, liveSubstitutions, allRawEvents);

  if (DisciplineEngine?.clearSuspensionAndResetCards) {
    updatedPlayers = DisciplineEngine.clearSuspensionAndResetCards(
      updatedPlayers,
      rounds.calendarRoundPlayed,
    );
  }

  if (DisciplineEngine?.processMatchDisciplineEvents) {
    updatedPlayers = DisciplineEngine.processMatchDisciplineEvents(
      updatedPlayers,
      Array.isArray(userMatchData?.events) ? userMatchData.events : [],
      rounds.calendarRoundPlayed,
      Array.isArray(allRawEvents) ? allRawEvents : [],
    );
  }

  updatedPlayers = processFatigueAndInjuries(
    updatedPlayers,
    Array.isArray(userMatchData?.events) ? userMatchData.events : null,
    {
      difficultyMult: gameData.difficultyMultipliers?.fatigueLoss ?? 1.0,
      injuryChanceMult: gameData.difficultyMultipliers?.injuryChance ?? 1.0,
      isCupMatch: Boolean(userMatchData?.isCupMatch),
      currentRound: rounds.calendarRoundPlayed,
      matchMinutes,
      rng,
    },
  );

  // A moral usa o estado físico final: nova lesão penaliza imediatamente e
  // um atleta recuperado não continua recebendo penalidade de lesão antiga.
  updatedPlayers = applyIndividualMorale(updatedPlayers, {
    result: getUserMatchResult(gameData, userMatchData),
    goalCount: buildUserGoalCount(allRawEvents),
  });

  return updatedPlayers;
}

// Alias de compatibilidade: o pós-processamento agora vale para qualquer competição.
export function processLeaguePlayers(args) {
  return processMatchPlayers(args);
}

export function preparePostMatchPlayers(gameData, updatedPlayers = [], trainingInjury = {}, rng = Math.random) {
  const { nextCalendarRound } = buildMatchRoundContext(gameData);
  const source = Array.isArray(updatedPlayers) ? updatedPlayers : [];
  let players = trainingInjury?.playerId != null
    ? source.map((player) => {
        if (!idsEqual(player.id, trainingInjury.playerId)) return player;
        const duration = 1 + Math.floor(Math.max(0, Math.min(0.999999, Number(rng()) || 0)) * 2);
        const injury = { type: 'Leve (Treino)', roundsLeft: duration };
        return {
          ...player,
          isStarting: false,
          injury,
          injuryHistory: [
            ...(Array.isArray(player.injuryHistory) ? player.injuryHistory : []),
            { round: nextCalendarRound, type: injury.type, duration, recaida: false },
          ].slice(-30),
        };
      })
    : source;

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

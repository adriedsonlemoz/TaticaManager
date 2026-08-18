import { CalendarEngine } from '../CalendarEngine.js';
import { DisciplineEngine } from '../engine_discipline.js';
import { FatigueEngine } from '../engine_fatigue.js';
import { InjuryEngine } from '../engine_injuries.js';
import { syncUserRosterState } from '../core/gameStateIntegrity.js';

const finiteInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
};

const normalizePlayers = (players) => Array.isArray(players) ? players : [];

export function isInactiveCupCalendarSlot(gameData = {}, slotIndex = null) {
  const index = slotIndex == null ? finiteInt(gameData?.round, 0) : finiteInt(slotIndex, 0);
  const entry = gameData?.calendar?.[index];
  if (entry?.type !== 'cup') return false;
  if (!CalendarEngine?.getCupMatchForCalendarSlot) return false;
  return !CalendarEngine.getCupMatchForCalendarSlot(gameData?.cups, entry)?.hasCupMatch;
}

export function getInactiveCupSkipCount(gameData = {}) {
  const calendar = Array.isArray(gameData?.calendar) ? gameData.calendar : [];
  const start = finiteInt(gameData?.round, 0);
  let skipCount = 0;

  for (let index = start; index < calendar.length; index += 1) {
    if (!isInactiveCupCalendarSlot(gameData, index)) break;
    skipCount += 1;
  }

  return skipCount;
}

export function findNextPlayableCalendarSlot(gameData = {}) {
  const calendar = Array.isArray(gameData?.calendar) ? gameData.calendar : [];
  const start = finiteInt(gameData?.round, 0);
  if (!calendar.length) {
    return {
      slotIndex: start,
      skippedSlots: 0,
      entry: null,
    };
  }

  let index = start;
  while (index < calendar.length && isInactiveCupCalendarSlot(gameData, index)) index += 1;
  return {
    slotIndex: index,
    skippedSlots: Math.max(0, index - start),
    entry: calendar[index] || null,
  };
}

function shiftSuspensionAcrossIdleSlot(player, calendarRound) {
  if (!player?.discipline || player.discipline.suspendedUntilRound == null) return player;
  if (!DisciplineEngine.isPlayerSuspended(player, calendarRound)) return player;

  const suspendedUntilRound = finiteInt(player.discipline.suspendedUntilRound, calendarRound) + 1;
  return {
    ...player,
    discipline: {
      ...player.discipline,
      suspendedUntilRound,
    },
  };
}

function recoverPlayerAcrossIdleSlot(player, { rng = Math.random } = {}) {
  if (!player || typeof player !== 'object') return player;

  const hadInjury = Boolean(player.injury);
  let injury = player.injury || null;
  if (injury) {
    injury = InjuryEngine?.processRecovery
      ? InjuryEngine.processRecovery(injury, rng)
      : (Number(injury.roundsLeft) > 1 ? { ...injury, roundsLeft: Number(injury.roundsLeft) - 1 } : null);
  }

  const energy = FatigueEngine?.calculateNewEnergy
    ? FatigueEngine.calculateNewEnergy(player, { minutes: 0 })
    : Math.min(100, Math.max(0, (Number(player.energy) || 100) + (hadInjury ? 20 : 12)));

  return {
    ...player,
    energy,
    injury,
  };
}

export function advanceInactiveCalendarSlots(gameData = {}, {
  skipCount = null,
  rng = Math.random,
} = {}) {
  if (!gameData || typeof gameData !== 'object') {
    return { state: gameData, skippedSlots: 0, recoveredPlayers: [], restedPlayers: 0 };
  }

  const availableSkipCount = getInactiveCupSkipCount(gameData);
  const requestedSkipCount = skipCount == null ? availableSkipCount : finiteInt(skipCount, 0);
  const totalSkipCount = Math.min(availableSkipCount, requestedSkipCount);
  if (totalSkipCount <= 0) {
    return { state: gameData, skippedSlots: 0, recoveredPlayers: [], restedPlayers: 0 };
  }

  let round = finiteInt(gameData.round, 0);
  let players = normalizePlayers(gameData.players).map((player) => ({ ...player }));
  const initiallyInjured = new Map(players.map((player) => [String(player?.id), Boolean(player?.injury)]));

  for (let offset = 0; offset < totalSkipCount; offset += 1) {
    const calendarRound = round + 1;
    players = players.map((player) => {
      const suspensionAdjusted = shiftSuspensionAcrossIdleSlot(player, calendarRound);
      return recoverPlayerAcrossIdleSlot(suspensionAdjusted, { rng });
    });
    round += 1;
  }

  if (DisciplineEngine?.clearSuspensionAndResetCards) {
    players = DisciplineEngine.clearSuspensionAndResetCards(players, round + 1);
  }

  const recoveredPlayers = players
    .filter((player) => initiallyInjured.get(String(player?.id)) && !player?.injury)
    .map((player) => ({ id: player.id, name: player.name }));

  return {
    state: syncUserRosterState({
      ...gameData,
      round,
    }, players),
    skippedSlots: totalSkipCount,
    recoveredPlayers,
    restedPlayers: players.length,
  };
}

export default {
  isInactiveCupCalendarSlot,
  getInactiveCupSkipCount,
  findNextPlayableCalendarSlot,
  advanceInactiveCalendarSlots,
};

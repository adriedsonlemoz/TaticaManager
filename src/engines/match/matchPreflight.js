import { CalendarEngine } from '../CalendarEngine.js';
import { CupsEngine } from '../cups_engine.js';
import { DisciplineEngine } from '../engine_discipline.js';

const getTotalSlots = (gameData) => gameData?.calendar?.length || gameData?.fixtures?.length || 0;

export function buildInitialCompetitionState(gameData) {
  if (!gameData) return null;
  if (gameData.round === 0 && !gameData.cups && CupsEngine?.autoInitCupsForSeason) {
    const cups = CupsEngine.autoInitCupsForSeason(gameData, !gameData.seasonResult);
    const calendar = CalendarEngine?.buildCalendar
      ? CalendarEngine.buildCalendar(gameData.fixtures?.length || 0, cups, gameData.serie || 'A')
      : null;
    return { ...gameData, cups, calendar, leagueRound: 0 };
  }
  if (!gameData.calendar && gameData.cups && CalendarEngine?.buildCalendar) {
    return {
      ...gameData,
      calendar: CalendarEngine.buildCalendar(gameData.fixtures?.length || 0, gameData.cups, gameData.serie || 'A'),
      leagueRound: gameData.leagueRound ?? gameData.round ?? 0,
    };
  }
  return null;
}

export function findIllegalStarter(gameData, starters = []) {
  const nextSlot = (gameData?.round || 0) + 1;
  return starters.find((player) => {
    const suspended = DisciplineEngine?.isPlayerSuspended
      ? DisciplineEngine.isPlayerSuspended(player, nextSlot)
      : player.discipline?.suspendedUntilRound != null && nextSlot <= player.discipline.suspendedUntilRound;
    return suspended || Boolean(player.injury);
  }) || null;
}

export function getInactiveCupSkipCount(gameData) {
  const calendar = gameData?.calendar || [];
  const round = gameData?.round || 0;
  const current = calendar[round];
  if (current?.type !== 'cup' || !CalendarEngine?.getCupMatchForCalendarSlot) return 0;
  if (CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, current).hasCupMatch) return 0;

  let skip = 1;
  while (round + skip < calendar.length && calendar[round + skip]?.type === 'cup') {
    const info = CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calendar[round + skip]);
    if (info.hasCupMatch) break;
    skip += 1;
  }
  return skip;
}

export function inspectMatchStart(gameData) {
  if (!gameData) return { status: 'blocked', reason: 'missing-game-data' };
  if ((gameData.round || 0) >= getTotalSlots(gameData)) return { status: 'blocked', reason: 'season-complete' };

  const initialized = buildInitialCompetitionState(gameData);
  if (initialized) return { status: 'state-update', nextState: initialized };

  const starters = (gameData.players || []).filter((player) => player.isStarting);
  if (starters.length !== 11) return { status: 'lineup-count', starters };

  const illegalPlayer = findIllegalStarter(gameData, starters);
  if (illegalPlayer) return { status: 'illegal-player', starters, illegalPlayer };

  const skipCount = getInactiveCupSkipCount(gameData);
  if (skipCount > 0) return { status: 'skip-inactive-cups', starters, skipCount };

  return {
    status: 'ready',
    starters,
    calendarEntry: (gameData.calendar || [])[gameData.round] || null,
  };
}

import { CalendarEngine } from '../CalendarEngine.js';
import { CupsEngine } from '../cups_engine.js';
import { DisciplineEngine } from '../engine_discipline.js';
import { getLineupValidation } from '../lineup/lineupRules.js';
import { isUserMatchTeam } from './matchStateUtils.js';
import { getInactiveCupSkipCount } from '../calendar/idleCalendarAdvance.js';
import { getDaysUntilCalendarSlot, getInitialCareerDate } from '../calendar/calendarDateEngine.js';

const getTotalSlots = (gameData) => gameData?.calendar?.length || gameData?.fixtures?.length || 0;

export function buildInitialCompetitionState(gameData) {
  if (!gameData) return null;
  if (gameData.round === 0 && !gameData.cups && CupsEngine?.autoInitCupsForSeason) {
    const cups = CupsEngine.autoInitCupsForSeason(gameData, !gameData.seasonResult);
    const calendar = CalendarEngine?.buildCalendar
      ? CalendarEngine.buildCalendar(gameData.fixtures?.length || 0, cups, gameData.serie || 'A', { season:gameData.season || 2026 })
      : null;
    return { ...gameData, cups, calendar, leagueRound: 0, currentDateISO:gameData.currentDateISO || getInitialCareerDate(calendar), currentDate:gameData.currentDate || getInitialCareerDate(calendar) };
  }
  if (!gameData.calendar && gameData.cups && CalendarEngine?.buildCalendar) {
    const calendar = CalendarEngine.buildCalendar(gameData.fixtures?.length || 0, gameData.cups, gameData.serie || 'A', { season:gameData.season || 2026 });
    const initialDate = getInitialCareerDate(calendar);
    return {
      ...gameData,
      calendar,
      leagueRound: gameData.leagueRound ?? gameData.round ?? 0,
      currentDateISO:gameData.currentDateISO || gameData.currentDate || initialDate,
      currentDate:gameData.currentDate || gameData.currentDateISO || initialDate,
    };
  }
  return null;
}

export function findIllegalStarter(gameData, starters = []) {
  const nextSlot = (gameData?.round || 0) + 1;
  return (Array.isArray(starters) ? starters : []).find((player) => {
    if (!player || typeof player !== 'object') return true;
    const suspended = DisciplineEngine?.isPlayerSuspended
      ? DisciplineEngine.isPlayerSuspended(player, nextSlot)
      : player.discipline?.suspendedUntilRound != null && nextSlot <= player.discipline.suspendedUntilRound;
    return suspended || Boolean(player.injury);
  }) || null;
}


export function inspectUpcomingMatchIdentity(gameData) {
  const calendarEntry = (gameData?.calendar || [])[gameData?.round || 0] || null;
  const clubName = gameData?.club?.name || '';

  if (calendarEntry?.type === 'cup' && CalendarEngine?.getCupMatchForCalendarSlot) {
    const info = CalendarEngine.getCupMatchForCalendarSlot(gameData?.cups, calendarEntry);
    if (!info?.hasCupMatch || !info?.tie) return { valid: true, userSide: null, inactive: true };
    const isLeg2 = calendarEntry.leg === 'leg2';
    const home = isLeg2 ? info.tie.away : info.tie.home;
    const away = isLeg2 ? info.tie.home : info.tie.away;
    const homeIsUser = isUserMatchTeam(home, clubName);
    const awayIsUser = isUserMatchTeam(away, clubName);
    return {
      valid: homeIsUser !== awayIsUser,
      userSide: homeIsUser !== awayIsUser ? (homeIsUser ? 'home' : 'away') : null,
      home,
      away,
    };
  }

  const leagueIdx = calendarEntry?.leagueIdx ?? gameData?.round ?? 0;
  const matches = gameData?.fixtures?.[leagueIdx] || [];
  const candidates = matches.filter((match) => (
    isUserMatchTeam(match?.home, clubName) || isUserMatchTeam(match?.away, clubName)
  ));
  if (candidates.length !== 1) return { valid: false, userSide: null, candidates };
  const match = candidates[0];
  const homeIsUser = isUserMatchTeam(match?.home, clubName);
  const awayIsUser = isUserMatchTeam(match?.away, clubName);
  return {
    valid: homeIsUser !== awayIsUser,
    userSide: homeIsUser !== awayIsUser ? (homeIsUser ? 'home' : 'away') : null,
    home: match?.home,
    away: match?.away,
  };
}

export function inspectMatchStart(gameData) {
  if (!gameData) return { status: 'blocked', reason: 'missing-game-data' };
  if ((gameData.round || 0) >= getTotalSlots(gameData)) return { status: 'blocked', reason: 'season-complete' };

  const initialized = buildInitialCompetitionState(gameData);
  if (initialized) return { status: 'state-update', nextState: initialized };

  // O calendário civil avança um dia por vez. Nenhuma partida pode ser iniciada
  // antes de a carreira alcançar sua data canônica.
  const daysUntilMatch = getDaysUntilCalendarSlot(gameData);
  if (daysUntilMatch > 0) return { status:'rest-day', starters:[], daysUntilMatch };

  // Slots de Copa/competição sem partida são passagem de tempo, não uma partida.
  const skipCount = getInactiveCupSkipCount(gameData);
  if (skipCount > 0) return { status: 'skip-inactive-cups', starters: [], skipCount };

  const validation = getLineupValidation(gameData);
  const starters = validation.starters;
  if (validation.starterCount !== 11 || validation.uniqueStarterCount !== 11) {
    return { status: 'lineup-count', starters, validation };
  }
  if (!validation.isValid) return { status: 'lineup-invalid', starters, validation };

  const illegalPlayer = findIllegalStarter(gameData, starters);
  if (illegalPlayer) return { status: 'illegal-player', starters, illegalPlayer, validation };

  const identity = inspectUpcomingMatchIdentity(gameData);
  if (!identity.valid) return { status: 'identity-invalid', starters, validation, identity };

  return {
    status: 'ready',
    starters,
    validation,
    identity,
    calendarEntry: (gameData.calendar || [])[gameData.round] || null,
  };
}

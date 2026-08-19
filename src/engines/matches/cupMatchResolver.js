import { CalendarEngine } from '../CalendarEngine.js';
import { getCupLabel } from './matchesConstants.js';

export function getCupTeams(cupInfo) {
  const tie = cupInfo?.tie;
  if (!tie) return { home: null, away: null };
  const isLeg2 = cupInfo.leg === 'leg2';
  return {
    home: isLeg2 ? tie.away : tie.home,
    away: isLeg2 ? tie.home : tie.away,
  };
}

export function getCupInfoForSlot(cups, calendarEntry) {
  if (!calendarEntry || calendarEntry.type !== 'cup' || !cups) return { hasCupMatch: false };

  const direct = CalendarEngine?.getCupMatchForCalendarSlot
    ? CalendarEngine.getCupMatchForCalendarSlot(cups, calendarEntry)
    : { hasCupMatch: false };
  if (direct?.hasCupMatch) return { ...direct, played: false };

  const cup = calendarEntry.cupKey === cups?.regional?.competitionKey
    ? cups.regional
    : calendarEntry.cupKey === cups?.estadual?.competitionKey
      ? cups.estadual
      : cups?.[calendarEntry.cupKey];
  if (!cup) return { hasCupMatch: false };

  const candidates = [
    ...(cup.history || []),
    ...(cup.groupMatches || []),
    cup.currentTie,
    cup.knockoutTie,
  ].filter(Boolean);

  const tie = candidates.find((candidate) => {
    const legData = candidate?.[calendarEntry.leg];
    if (!legData?.played) return false;
    if (Number.isFinite(calendarEntry.afterLeague) && legData.round === calendarEntry.afterLeague) return true;
    return Boolean(calendarEntry.phase && candidate.phase === calendarEntry.phase);
  });

  if (!tie) return { hasCupMatch: false };
  return {
    hasCupMatch: true,
    played: true,
    cupKey: calendarEntry.cupKey,
    cup,
    tie,
    leg: calendarEntry.leg,
    label: cup?.label || getCupLabel(calendarEntry.cupKey),
  };
}

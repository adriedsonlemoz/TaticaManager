import { getCupDate } from '../../utils/matchDateUtils.js';
import { getCupColor } from './matchesConstants.js';
import { getCupInfoForSlot, getCupTeams } from './cupMatchResolver.js';

export const getCupRoundDate = (roundDates, round1Based) => getCupDate(roundDates, round1Based);

const dateKey = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function buildDayRoundsMap({ gameData, currentRound, roundDates }) {
  const map = {};
  const calendar = gameData?.calendar || [];

  const addEvent = (date, event) => {
    if (!date) return;
    const key = dateKey(date);
    if (!map[key]) map[key] = [];
    map[key].push({ ...event, date });
  };

  calendar.forEach((entry, calendarSlot) => {
    if (!entry) return;

    if (entry.type === 'league') {
      const leagueIdx = entry.leagueIdx;
      const date = roundDates[leagueIdx];
      if (!date) return;
      const fixtures = gameData.fixtures?.[leagueIdx] || [];
      const userMatch = fixtures.find(match => match.home?.isPlayer || match.away?.isPlayer);
      addEvent(date, {
        calendarSlot,
        leagueRound: leagueIdx + 1,
        roundIdx: leagueIdx,
        played: calendarSlot < currentRound,
        isUser: Boolean(userMatch),
        isCup: false,
        match: userMatch,
        allMatches: fixtures,
      });
      return;
    }

    if (entry.type !== 'cup') return;
    const cupInfo = getCupInfoForSlot(gameData.cups, entry);
    if (!cupInfo.hasCupMatch) return;

    const leagueRoundAfter = entry.afterLeague ?? (entry.leagueIdx ?? 0);
    const date = getCupRoundDate(roundDates, leagueRoundAfter);
    if (!date) return;
    const tie = cupInfo.tie;
    const teams = getCupTeams(cupInfo);
    const legData = cupInfo.leg === 'leg2' ? tie.leg2 : tie.leg1;
    const played = Boolean(legData?.played);
    const match = {
      ...teams,
      ...(played ? {
        result: `${legData.home}-${legData.away}`,
        events: legData.events || tie.events || [],
        penalties: cupInfo.leg === 'leg2' ? tie.penalties || null : null,
      } : {}),
    };

    addEvent(date, {
      calendarSlot,
      leagueRound: leagueRoundAfter,
      roundIdx: leagueRoundAfter - 1,
      played,
      isUser: true,
      isCup: true,
      cupLabel: cupInfo.label,
      cupColor: getCupColor(cupInfo.label),
      legLabel: cupInfo.leg === 'leg1' ? (tie.leg2 ? 'Jogo de Ida' : 'Jogo Único') : 'Jogo de Volta',
      phase: tie.phase,
      match,
      cupKey: cupInfo.cupKey,
      leg: cupInfo.leg,
      tie,
    });
  });

  return map;
}

export function getMatchesForDay(dayRoundsMap, year, month, day, competitionFilter = 'TODOS') {
  const events = dayRoundsMap?.[`${year}-${month}-${day}`] || [];
  if (competitionFilter === 'CAMP') return events.filter(event => !event.isCup);
  if (competitionFilter === 'COPA') return events.filter(event => event.isCup);
  return events;
}

export function getCalendarWindow(roundDates, calendarMonthOffset) {
  const firstDate = roundDates?.[0] || new Date(2026, 3, 4);
  const lastDate = roundDates?.[roundDates.length - 1] || firstDate;
  const totalMonths = Math.max(1,
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12
      + (lastDate.getMonth() - firstDate.getMonth()) + 1,
  );
  const displayMonthIdx = Math.max(0, Math.min(Number(calendarMonthOffset) || 0, totalMonths - 1));
  const absoluteMonth = firstDate.getMonth() + displayMonthIdx;
  const realMonth = ((absoluteMonth % 12) + 12) % 12;
  const realYear = firstDate.getFullYear() + Math.floor(absoluteMonth / 12);
  const daysInMonth = new Date(realYear, realMonth + 1, 0).getDate();
  const firstDow = new Date(realYear, realMonth, 1).getDay();
  const startPad = firstDow === 0 ? 6 : firstDow - 1;
  return { firstDate, lastDate, totalMonths, displayMonthIdx, realMonth, realYear, daysInMonth, startPad };
}

export function getCalendarMonthOffsetForRound(roundDates, leagueIdx) {
  const firstDate = roundDates?.[0];
  const date = roundDates?.[Math.max(0, Number(leagueIdx) || 0)];
  if (!firstDate || !date) return 0;
  return (date.getFullYear() - firstDate.getFullYear()) * 12 + (date.getMonth() - firstDate.getMonth());
}

import { CalendarEngine } from '../CalendarEngine.js';
import { buildRoundDates, getCupDate } from '../../utils/matchDateUtils.js';

export const MONTH_NAMES = [
  'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
  'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO',
];

export const WEEK_DAYS_SHORT = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
export const WEEK_DAYS = ['S','T','Q','Q','S','S','D'];

export const getCupColor = (label = '') => (
  label.includes('Brasil') ? '#00695c'
    : label.includes('Libert') ? '#1a237e'
      : '#b71c1c'
);

export { buildRoundDates };

export const getCupRoundDate = (roundDates, round1Based) => getCupDate(roundDates, round1Based);

const getCupLabel = (cupKey) => (
  cupKey === 'copaBrasil' ? '🏆 Copa do Brasil'
    : cupKey === 'libertadores' ? '🌟 Libertadores'
      : '🌎 Sul-Americana'
);

export const getCupInfoForSlot = (cups, calendarEntry) => {
  if (!calendarEntry || calendarEntry.type !== 'cup' || !cups) return { hasCupMatch: false };

  const direct = CalendarEngine?.getCupMatchForCalendarSlot
    ? CalendarEngine.getCupMatchForCalendarSlot(cups, calendarEntry)
    : { hasCupMatch: false };
  if (direct?.hasCupMatch) return { ...direct, played: false };

  const cup = cups?.[calendarEntry.cupKey];
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
    label: getCupLabel(calendarEntry.cupKey),
  };
};

export const getMatchResult = (match) => {
  if (!match?.result) return null;
  const [homeGoals, awayGoals] = match.result.split('-').map(Number);
  const won = (match.home?.isPlayer && homeGoals > awayGoals)
    || (match.away?.isPlayer && awayGoals > homeGoals);
  const draw = homeGoals === awayGoals;
  const penalties = match.penalties;
  return {
    homeGoals,
    awayGoals,
    penaltiesLabel: penalties ? `pen. ${penalties.home}×${penalties.away}` : null,
    outcome: won ? 'win' : draw ? 'draw' : 'loss',
  };
};

const getCupTeams = (cupInfo) => {
  const tie = cupInfo.tie;
  const isLeg2 = cupInfo.leg === 'leg2';
  return {
    home: isLeg2 ? tie.away : tie.home,
    away: isLeg2 ? tie.home : tie.away,
  };
};

export const buildDayRoundsMap = ({ gameData, currentRound, roundDates }) => {
  const map = {};
  const calendar = gameData.calendar || [];

  const addEvent = (date, event) => {
    if (!date) return;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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
      const userMatch = fixtures.find((match) => match.home?.isPlayer || match.away?.isPlayer);
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

    if (entry.type === 'cup') {
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
    }
  });

  return map;
};

export const getMatchesForDay = (dayRoundsMap, year, month, day, competitionFilter = 'TODOS') => {
  const events = dayRoundsMap[`${year}-${month}-${day}`] || [];
  if (competitionFilter === 'CAMP') return events.filter((event) => !event.isCup);
  if (competitionFilter === 'COPA') return events.filter((event) => event.isCup);
  return events;
};

export const buildUpcomingEvents = ({ gameData, currentRound, roundDates, limit = 8 }) => {
  const events = [];
  const calendar = gameData.calendar || [];

  for (let calendarSlot = currentRound; calendarSlot < calendar.length && events.length < 10; calendarSlot += 1) {
    const entry = calendar[calendarSlot];
    if (!entry) continue;

    if (entry.type === 'league') {
      const leagueIdx = entry.leagueIdx;
      if (leagueIdx === undefined || leagueIdx >= gameData.fixtures.length) continue;
      const date = roundDates[leagueIdx];
      if (!date) continue;
      const fixtures = gameData.fixtures[leagueIdx] || [];
      const match = fixtures.find((item) => item.home?.isPlayer || item.away?.isPlayer);
      if (!match) continue;
      events.push({
        calendarSlot,
        leagueRound: leagueIdx + 1,
        date,
        monthName: MONTH_NAMES[date.getMonth()].substring(0, 3),
        weekDay: WEEK_DAYS_SHORT[(date.getDay() + 6) % 7],
        day: date.getDate(),
        match,
        isCup: false,
      });
      continue;
    }

    if (entry.type === 'cup') {
      const cupInfo = getCupInfoForSlot(gameData.cups, entry);
      if (!cupInfo.hasCupMatch || cupInfo.played) continue;
      const leagueRoundAfter = entry.afterLeague ?? (entry.leagueIdx ?? 0);
      const date = getCupRoundDate(roundDates, leagueRoundAfter) || roundDates[leagueRoundAfter - 1];
      if (!date) continue;
      const tie = cupInfo.tie;
      const teams = getCupTeams(cupInfo);
      events.push({
        calendarSlot,
        leagueRound: leagueRoundAfter,
        date,
        monthName: MONTH_NAMES[date.getMonth()].substring(0, 3),
        weekDay: WEEK_DAYS_SHORT[(date.getDay() + 6) % 7],
        day: date.getDate(),
        isCup: true,
        cupLabel: cupInfo.label,
        cupColor: getCupColor(cupInfo.label),
        legLabel: cupInfo.leg === 'leg1' ? (tie.leg2 ? 'Jogo de Ida' : 'Jogo Único') : 'Jogo de Volta',
        phase: tie.phase,
        match: teams,
        cupKey: cupInfo.cupKey,
        leg: cupInfo.leg,
        tie,
      });
    }
  }

  return events
    .sort((a, b) => (a.date - b.date) || (a.isCup ? 1 : -1))
    .slice(0, limit);
};

const pushCupRecentResults = (results, cup, label, color, roundDates) => {
  if (!cup || cup.status === 'inactive') return;

  const pushTie = (tie) => {
    if (!tie) return;
    if (tie.leg2?.played) {
      results.push({
        match: {
          home: tie.away,
          away: tie.home,
          result: `${tie.leg2.home}-${tie.leg2.away}`,
          played: true,
          events: tie.leg2.events || tie.events || [],
        },
        round: tie.leg2.round,
        date: getCupRoundDate(roundDates, tie.leg2.round),
        isCup: true,
        cupLabel: label,
        cupColor: color,
        legLabel: 'Jogo de Volta',
        phase: tie.phase,
      });
    }
    if (tie.leg1?.played) {
      results.push({
        match: {
          home: tie.home,
          away: tie.away,
          result: `${tie.leg1.home}-${tie.leg1.away}`,
          played: true,
          events: tie.leg1.events || tie.events || [],
        },
        round: tie.leg1.round,
        date: getCupRoundDate(roundDates, tie.leg1.round),
        isCup: true,
        cupLabel: label,
        cupColor: color,
        legLabel: tie.leg2 ? 'Jogo de Ida' : 'Jogo Único',
        phase: tie.phase,
      });
    }
  };

  if (cup.phase === 'group') {
    (cup.groupMatches || []).forEach((groupMatch) => {
      if (!groupMatch.leg1?.played) return;
      results.push({
        match: {
          home: groupMatch.home,
          away: groupMatch.away,
          result: `${groupMatch.leg1.home}-${groupMatch.leg1.away}`,
          played: true,
          events: groupMatch.leg1.events || groupMatch.events || [],
        },
        round: groupMatch.leg1.round,
        date: getCupRoundDate(roundDates, groupMatch.leg1.round),
        isCup: true,
        cupLabel: label,
        cupColor: color,
        legLabel: 'Fase de Grupos',
        phase: groupMatch.phase,
      });
    });
    return;
  }

  (cup.history || []).forEach(pushTie);
  pushTie(cup.currentTie);
  pushTie(cup.knockoutTie);
};

export const buildRecentResults = ({ gameData, currentRound, roundDates, limit = 6 }) => {
  const results = [];
  const playedLeagueRounds = new Set();

  (gameData.calendar || []).slice(0, currentRound).forEach((entry) => {
    if (entry?.type === 'league' && Number.isInteger(entry.leagueIdx)) playedLeagueRounds.add(entry.leagueIdx);
  });

  if (playedLeagueRounds.size === 0 && !(gameData.calendar || []).length) {
    const legacyLeagueRound = Math.min(gameData.leagueRound ?? currentRound, gameData.fixtures?.length || 0);
    for (let leagueIdx = 0; leagueIdx < legacyLeagueRound; leagueIdx += 1) playedLeagueRounds.add(leagueIdx);
  }

  [...playedLeagueRounds]
    .sort((a, b) => b - a)
    .forEach((leagueIdx) => {
      const match = (gameData.fixtures?.[leagueIdx] || []).find((item) => item.home?.isPlayer || item.away?.isPlayer);
      if (match?.played && match.result) {
        results.push({ match, round: leagueIdx + 1, date: roundDates[leagueIdx], isCup: false });
      }
    });

  if (gameData.cups) {
    pushCupRecentResults(results, gameData.cups.copaBrasil, '🏆 Copa do Brasil', '#00695c', roundDates);
    pushCupRecentResults(results, gameData.cups.libertadores, '🌟 Libertadores', '#1a237e', roundDates);
    pushCupRecentResults(results, gameData.cups.sulAmericana, '🌎 Sul-Americana', '#b71c1c', roundDates);
  }

  const unique = [];
  const seen = new Set();
  results.forEach((item) => {
    const key = [item.isCup ? item.cupLabel : 'league', item.round, item.legLabel || '', item.match?.home?.name, item.match?.away?.name, item.match?.result].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  return unique
    .sort((a, b) => {
      const aTime = a.date?.getTime?.() ?? 0;
      const bTime = b.date?.getTime?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);
};

export const getCalendarWindow = (roundDates, calendarMonthOffset) => {
  const firstDate = roundDates[0] || new Date(2026, 3, 4);
  const lastDate = roundDates[roundDates.length - 1] || firstDate;
  const totalMonths = Math.max(1,
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12
      + (lastDate.getMonth() - firstDate.getMonth()) + 1,
  );
  const displayMonthIdx = Math.max(0, Math.min(calendarMonthOffset, totalMonths - 1));
  const absoluteMonth = firstDate.getMonth() + displayMonthIdx;
  const realMonth = absoluteMonth % 12;
  const realYear = firstDate.getFullYear() + Math.floor(absoluteMonth / 12);
  const daysInMonth = new Date(realYear, realMonth + 1, 0).getDate();
  const firstDow = new Date(realYear, realMonth, 1).getDay();
  const startPad = firstDow === 0 ? 6 : firstDow - 1;
  return { firstDate, lastDate, totalMonths, displayMonthIdx, realMonth, realYear, daysInMonth, startPad };
};

export const getCalendarMonthOffsetForRound = (roundDates, leagueIdx) => {
  const firstDate = roundDates[0];
  const date = roundDates[Math.max(0, leagueIdx)];
  if (!firstDate || !date) return 0;
  return (date.getFullYear() - firstDate.getFullYear()) * 12 + (date.getMonth() - firstDate.getMonth());
};

export default {
  MONTH_NAMES,
  WEEK_DAYS_SHORT,
  WEEK_DAYS,
  getCupColor,
  buildRoundDates,
  getCupRoundDate,
  getCupInfoForSlot,
  getMatchResult,
  buildDayRoundsMap,
  getMatchesForDay,
  buildUpcomingEvents,
  buildRecentResults,
  getCalendarWindow,
  getCalendarMonthOffsetForRound,
};

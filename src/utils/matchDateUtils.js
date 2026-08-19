// Datas do calendário. A data persistida no slot é a fonte canônica; os helpers
// legados abaixo permanecem apenas para saves antigos ainda sem calendar.dateISO.
import { fromDateISO } from '../engines/calendar/calendarDateEngine.js';
import { buildLeagueTargetDates } from '../engines/calendar/seasonCalendar.js';

export const SEASON_START = new Date(2026, 0, 28);
const MONTH_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const WEEKDAY_PT = ['dom','seg','ter','qua','qui','sex','sáb'];

export const buildRoundDates = (totalRounds, { season = 2026, serie = 'B' } = {}) => (
  buildLeagueTargetDates(totalRounds, { season, serie })
    .map(fromDateISO)
    .filter(Boolean)
);

export const getCupDate = (leagueRoundDates, afterLeagueIdx) => {
  const prevLeague = leagueRoundDates[afterLeagueIdx - 1];
  const nextLeague = leagueRoundDates[afterLeagueIdx];
  if (prevLeague && nextLeague) {
    let c = new Date(prevLeague); c.setDate(c.getDate() + 3);
    while (c < nextLeague) {
      if ([3,4].includes(c.getDay())) return c;
      c.setDate(c.getDate() + 1);
    }
  }
  if (prevLeague) {
    const c = new Date(prevLeague); c.setDate(c.getDate() + 3); return c;
  }
  return null;
};

export const getMatchTime = (isCup, slotIndex, leagueRoundDate) => {
  const seed = (slotIndex ?? 0) % 2;
  if (isCup) return seed === 0 ? '19h30' : '21h30';
  const dow = leagueRoundDate ? leagueRoundDate.getDay() : 6;
  if (dow === 6 || dow === 0) return seed === 0 ? '18h30' : '20h00';
  if (dow === 3 || dow === 4) return seed === 0 ? '19h00' : '21h30';
  return seed === 0 ? '19h00' : '21h00';
};

export const formatMatchDate = (date, includeYear = false) => {
  if (!date) return '';
  const wd = WEEKDAY_PT[date.getDay()];
  const d = date.getDate();
  const m = MONTH_PT[date.getMonth()];
  return includeYear ? `${wd}, ${d} ${m} ${date.getFullYear()}` : `${wd}, ${d} ${m}`;
};

export const formatMatchDateTime = (date, time) => date ? `${formatMatchDate(date)} · ${time}` : '';

export const resolveMatchInfo = (gameData, slotIndex) => {
  const calendar = gameData?.calendar || [];
  const round = slotIndex ?? gameData?.round ?? 0;
  const entry = calendar[round];
  const canonicalDate = fromDateISO(entry?.dateISO || entry?.calendarDate);
  let date = canonicalDate;
  let isCup = entry?.type === 'cup';

  if (!date) {
    const fixtures = gameData?.fixtures || [];
    const roundDates = buildRoundDates(fixtures.length, { season:gameData?.season || 2026, serie:gameData?.serie || 'A' });
    if (isCup) date = getCupDate(roundDates, entry?.afterLeague ?? 0);
    else date = roundDates[entry?.leagueIdx ?? round] || null;
  }
  const time = getMatchTime(isCup, round, date);
  return {
    date, time, isCup,
    dateStr:formatMatchDate(date), timeStr:time,
    fullStr:formatMatchDateTime(date, time),
    fullStrWithYear:date ? `${formatMatchDate(date, true)} · ${time}` : '',
  };
};

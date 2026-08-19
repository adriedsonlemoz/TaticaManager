import { REGIONAL_CUP_KEYS } from '../cups/regionalConfig.js';
import { STATE_CUP_KEYS } from '../cups/stateConfig.js';

const iso = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const parseISO = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};
const dateISO = (date) => date instanceof Date && !Number.isNaN(date.getTime())
  ? iso(date.getFullYear(), date.getMonth() + 1, date.getDate())
  : null;
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};
const interpolateDate = (start, end, ratio) => {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  return new Date(start.getTime() + ((end.getTime() - start.getTime()) * clamped));
};
const copyWindowToYear = (window, year) => {
  if (!window) return null;
  const start = parseISO(window.start);
  const end = parseISO(window.end);
  if (!start || !end) return null;
  return {
    ...window,
    start: iso(year, start.getMonth() + 1, start.getDate()),
    end: iso(year, end.getMonth() + 1, end.getDate()),
    official: year === 2026 && window.official === true,
  };
};

export const OFFICIAL_2026_CALENDAR = Object.freeze({
  leagues: {
    A: { start:'2026-01-28', end:'2026-12-02', label:'Brasileirão Série A', official:true },
    B: { start:'2026-03-21', end:'2026-11-28', label:'Brasileirão Série B', official:true },
    C: { start:'2026-04-05', end:'2026-10-25', label:'Brasileirão Série C', official:true },
    D: { start:'2026-04-05', end:'2026-09-13', label:'Brasileirão Série D', official:true },
  },
  competitions: {
    estaduais: { start:'2026-01-11', end:'2026-03-08', label:'Campeonatos Estaduais', official:true },
    copaBrasil: { start:'2026-02-18', end:'2026-12-06', label:'Copa do Brasil', official:true },
    libertadores: { start:'2026-04-07', end:'2026-11-28', label:'CONMEBOL Libertadores', official:true },
    sulAmericana: { start:'2026-04-07', end:'2026-11-21', label:'CONMEBOL Sul-Americana', official:true },
    regionals: { start:'2026-03-24', end:'2026-06-07', label:'Copas Regionais CBF', official:true },
  },
  transferWindows: [
    { start:'2026-01-05', end:'2026-03-03', label:'1ª janela de transferências', official:true },
    { start:'2026-07-20', end:'2026-09-11', label:'2ª janela de transferências', official:true },
  ],
});

export function getSeasonLeagueWindow(season = 2026, serie = 'A') {
  const year = Math.max(2026, Number(season) || 2026);
  const normalized = ['A','B','C','D'].includes(String(serie || '').toUpperCase()) ? String(serie).toUpperCase() : 'A';
  return copyWindowToYear(OFFICIAL_2026_CALENDAR.leagues[normalized], year);
}

const REGIONAL_COMPETITION_KEYS = new Set(REGIONAL_CUP_KEYS);
const STATE_COMPETITION_KEYS = new Set(STATE_CUP_KEYS);

export function getSeasonCompetitionWindow(season = 2026, competitionKey = 'copaBrasil') {
  const year = Math.max(2026, Number(season) || 2026);
  const resolvedKey = REGIONAL_COMPETITION_KEYS.has(competitionKey)
    ? 'regionals'
    : STATE_COMPETITION_KEYS.has(competitionKey)
      ? 'estaduais'
      : competitionKey;
  return copyWindowToYear(OFFICIAL_2026_CALENDAR.competitions[resolvedKey], year);
}

export function getSeasonTransferWindows(season = 2026) {
  const year = Math.max(2026, Number(season) || 2026);
  return OFFICIAL_2026_CALENDAR.transferWindows.map((window) => copyWindowToYear(window, year));
}

export function buildLeagueTargetDates(roundCount = 0, { season = 2026, serie = 'A' } = {}) {
  const total = Math.max(0, Number(roundCount) || 0);
  if (!total) return [];
  const window = getSeasonLeagueWindow(season, serie);
  const start = parseISO(window.start);
  const end = parseISO(window.end);
  if (total === 1) return [window.start];
  return Array.from({ length:total }, (_, index) => (
    dateISO(interpolateDate(start, end, index / (total - 1)))
  ));
}

const PHASE_ORDER = ['1ª Fase','2ª Fase','3ª Fase','4ª Fase','5ª Fase','Oitavas','Quartas','Semifinal','Final'];
const COPA_PHASE_START_RATIO = Object.freeze({
  '1ª Fase':0,
  '2ª Fase':0.035,
  '3ª Fase':0.09,
  '4ª Fase':0.14,
  // Em 2026 os clubes da Série A entram em 22/04, aproximadamente 22%
  // da janela 18/02–06/12. As fases seguintes continuam distribuídas pelo
  // calendário civil, respeitando o espaçamento mínimo global.
  '5ª Fase':0.215,
  Oitavas:0.56,
  Quartas:0.69,
  Semifinal:0.82,
  Final:1,
});
const earliestPhaseRatio = (events = []) => {
  const phases = events.map((event) => event?.phase).filter((phase) => PHASE_ORDER.includes(phase));
  if (!phases.length) return 0;
  const earliest = phases.reduce((best, phase) => (
    PHASE_ORDER.indexOf(phase) < PHASE_ORDER.indexOf(best) ? phase : best
  ));
  return COPA_PHASE_START_RATIO[earliest] ?? 0;
};

export function buildCompetitionTargetDates(events = [], competitionKey, { season = 2026 } = {}) {
  const list = Array.isArray(events) ? events : [];
  if (!list.length) return [];
  const window = getSeasonCompetitionWindow(season, competitionKey);
  if (!window) return list.map(() => null);
  const start = parseISO(window.start);
  const end = parseISO(window.end);
  const startRatio = competitionKey === 'copaBrasil' ? earliestPhaseRatio(list) : 0;
  return list.map((_, index) => {
    const ratio = list.length === 1 ? 1 : startRatio + ((1 - startRatio) * (index / (list.length - 1)));
    return dateISO(interpolateDate(start, end, ratio));
  });
}

const targetTimestamp = (entry) => parseISO(entry?.targetDateISO)?.getTime() || Number.MAX_SAFE_INTEGER;

export function buildAnnualCalendarTargets({ leagueRounds = 0, cupEvents = [], season = 2026, serie = 'A' } = {}) {
  const leagueTargets = buildLeagueTargetDates(leagueRounds, { season, serie });
  const leagueWindow = getSeasonLeagueWindow(season, serie);
  const leagueEntries = leagueTargets.map((targetDateISO, leagueIdx) => ({
    type:'league',
    leagueIdx,
    targetDateISO,
    targetSource:'league-window',
    windowStartISO:leagueWindow?.start || null,
    windowEndISO:leagueWindow?.end || null,
    windowLabel:leagueWindow?.label || `Série ${serie}`,
  }));

  const byCompetition = new Map();
  (Array.isArray(cupEvents) ? cupEvents : []).forEach((event) => {
    const key = event?.cupKey || 'cup';
    if (!byCompetition.has(key)) byCompetition.set(key, []);
    byCompetition.get(key).push(event);
  });

  const cupEntries = [];
  for (const [cupKey, events] of byCompetition.entries()) {
    const targets = buildCompetitionTargetDates(events, cupKey, { season, serie });
    const competitionWindow = getSeasonCompetitionWindow(season, cupKey);
    events.forEach((event, index) => cupEntries.push({
      type:'cup',
      ...event,
      targetDateISO:targets[index],
      targetSource:`${cupKey}-window`,
      windowStartISO:competitionWindow?.start || null,
      windowEndISO:competitionWindow?.end || null,
      windowLabel:competitionWindow?.label || cupKey,
    }));
  }

  return [...leagueEntries, ...cupEntries]
    .sort((a, b) => (
      targetTimestamp(a) - targetTimestamp(b)
      || (a.type === b.type ? 0 : a.type === 'cup' ? -1 : 1)
      || (Number(a.leagueIdx) || 0) - (Number(b.leagueIdx) || 0)
    ));
}

const inWindow = (date, window) => {
  if (!(date instanceof Date) || !window) return false;
  const start = parseISO(window.start);
  const end = parseISO(window.end);
  return Boolean(start && end && date >= start && date <= end);
};

export function getAnnualCalendarContext(dateValue, { season = 2026, serie = 'A' } = {}) {
  const date = dateValue instanceof Date ? dateValue : parseISO(dateValue);
  if (!date) return { badges:[], leagueWindow:getSeasonLeagueWindow(season, serie), stateWindow:getSeasonCompetitionWindow(season, 'estaduais'), regionalWindow:getSeasonCompetitionWindow(season, 'regionals') };
  const badges = [];
  const leagueWindow = getSeasonLeagueWindow(season, serie);
  const stateWindow = getSeasonCompetitionWindow(season, 'estaduais');
  const regionalWindow = getSeasonCompetitionWindow(season, 'regionals');
  const transferWindow = getSeasonTransferWindows(season).find((window) => inWindow(date, window));
  if (transferWindow) badges.push({ key:'transfer', icon:'🔁', label:'Janela CBF', detail:transferWindow.label });
  if (inWindow(date, stateWindow)) badges.push({ key:'state', icon:'🏟️', label:'Janela dos estaduais', detail:'Período nacional reservado aos campeonatos estaduais' });
  if (inWindow(date, regionalWindow)) badges.push({ key:'regional', icon:'🏆', label:'Janela regional CBF', detail:'Período reservado às copas regionais' });
  if (inWindow(date, leagueWindow)) badges.push({ key:'league', icon:'⚽', label:`Série ${String(serie || 'A').toUpperCase()}`, detail:'Temporada nacional em andamento' });
  return { badges, leagueWindow, stateWindow, regionalWindow, transferWindow };
}

export function getSeasonHorizon(season = 2026, serie = 'A') {
  const league = getSeasonLeagueWindow(season, serie);
  const copa = getSeasonCompetitionWindow(season, 'copaBrasil');
  const leagueEnd = parseISO(league?.end);
  const cupEnd = parseISO(copa?.end);
  return dateISO(leagueEnd && cupEnd && cupEnd > leagueEnd ? cupEnd : leagueEnd || cupEnd || addDays(new Date(Number(season) || 2026, 11, 31), 0));
}

export default {
  OFFICIAL_2026_CALENDAR,
  getSeasonLeagueWindow,
  getSeasonCompetitionWindow,
  getSeasonTransferWindows,
  buildLeagueTargetDates,
  buildCompetitionTargetDates,
  buildAnnualCalendarTargets,
  getAnnualCalendarContext,
  getSeasonHorizon,
};

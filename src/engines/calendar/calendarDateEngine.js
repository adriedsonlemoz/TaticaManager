import { syncUserRosterState } from '../core/gameStateIntegrity.js';
import { getSeasonLeagueWindow } from './seasonCalendar.js';

export const MIN_MATCH_GAP_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');
export const toDateISO = (date) => date instanceof Date && !Number.isNaN(date.getTime())
  ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  : null;

export const fromDateISO = (value) => {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const diffDays = (from, to) => {
  if (!(from instanceof Date) || !(to instanceof Date)) return 0;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
};

const maxDate = (...dates) => dates.filter(Boolean).sort((a, b) => b - a)[0] || null;
const minDate = (...dates) => dates.filter(Boolean).sort((a, b) => a - b)[0] || null;
const clampDate = (date, minimum, maximum) => {
  const value = date ? new Date(date) : null;
  if (!value) return minimum ? new Date(minimum) : maximum ? new Date(maximum) : null;
  if (minimum && value < minimum) return new Date(minimum);
  if (maximum && value > maximum) return new Date(maximum);
  return value;
};

const nextWeekday = (start, weekdays = []) => {
  const allowed = new Set(weekdays);
  let candidate = new Date(start);
  for (let offset = 0; offset < 10; offset += 1) {
    if (allowed.has(candidate.getDay())) return candidate;
    candidate = addDays(candidate, 1);
  }
  return candidate;
};

export const getSeasonLeagueStartDate = (season = 2026, serie = 'A') => {
  const window = getSeasonLeagueWindow(season, String(serie || 'A').toUpperCase());
  return fromDateISO(window?.start) || new Date(Math.max(2026, Number(season) || 2026), 0, 28);
};

function preferredLeagueDate(minimum, serie, lastLeagueDate) {
  const preferred = serie === 'C' || serie === 'D' ? [0, 6] : [6, 0];
  const weeklyFloor = lastLeagueDate ? addDays(lastLeagueDate, 3) : minimum;
  return nextWeekday(maxDate(minimum, weeklyFloor), preferred);
}

function preferredCupDate(minimum) {
  return nextWeekday(minimum, [3, 4]); // quarta/quinta
}

export function attachCanonicalDates(calendar = [], { season = 2026, serie = 'A' } = {}) {
  const source = Array.isArray(calendar) ? calendar : [];
  if (!source.length) return [];
  const normalizedSerie = String(serie || 'A').toUpperCase();
  const opening = getSeasonLeagueStartDate(season, normalizedSerie);

  const bounds = source.map((entry) => {
    const target = fromDateISO(entry?.targetDateISO);
    const windowStart = fromDateISO(entry?.windowStartISO);
    const windowEnd = fromDateISO(entry?.windowEndISO);
    // Entradas legadas sem janela continuam usando o comportamento histórico.
    // Competições com janela própria podem acontecer antes da abertura da liga.
    const minimum = windowStart || (target && target < opening ? target : opening);
    return { target, minimum, maximum:windowEnd || null };
  });

  // Passo 1: calcula a primeira data possível de cada compromisso considerando
  // o descanso mínimo global entre jogos do clube.
  const earliest = [];
  for (let index = 0; index < source.length; index += 1) {
    const previousFloor = index > 0 ? addDays(earliest[index - 1], MIN_MATCH_GAP_DAYS) : null;
    earliest[index] = maxDate(bounds[index].minimum, previousFloor) || bounds[index].target || opening;
  }

  // Passo 2: calcula de trás para frente a última data possível. Isso evita o
  // antigo efeito cascata que apenas empurrava jogos para depois do fim da Copa,
  // do estadual ou da regional. Quando existe espaço, partidas anteriores são
  // antecipadas dentro da própria janela em vez de estourar seu encerramento.
  const latest = Array(source.length).fill(null);
  for (let index = source.length - 1; index >= 0; index -= 1) {
    const nextCeiling = index < source.length - 1 && latest[index + 1]
      ? addDays(latest[index + 1], -MIN_MATCH_GAP_DAYS)
      : null;
    latest[index] = minDate(bounds[index].maximum, nextCeiling);
  }

  const boundedPlanIsFeasible = earliest.every((date, index) => !latest[index] || date <= latest[index]);
  let lastMatchDate = null;
  let lastLeagueDate = null;

  return source.map((entry, index) => {
    const { target, minimum, maximum } = bounds[index];
    const spacingFloor = lastMatchDate ? addDays(lastMatchDate, MIN_MATCH_GAP_DAYS) : minimum;
    let date;

    if (boundedPlanIsFeasible) {
      const lower = maxDate(minimum, spacingFloor, earliest[index]);
      const upper = latest[index] || maximum;
      date = clampDate(target || lower, lower, upper);
    } else {
      // Fallback seguro para agendas matematicamente impossíveis: preserva o
      // espaçamento mínimo e sinaliza o estouro em vez de criar jogos seguidos.
      const targetOrMinimum = maxDate(spacingFloor, target);
      if (entry?.type === 'league') {
        date = target
          ? targetOrMinimum
          : (index === 0 && !lastMatchDate ? new Date(opening) : preferredLeagueDate(spacingFloor, normalizedSerie, lastLeagueDate));
      } else {
        date = target ? targetOrMinimum : preferredCupDate(spacingFloor);
      }
    }

    if (entry?.type === 'league') lastLeagueDate = new Date(date);
    lastMatchDate = new Date(date);
    const overflow = Boolean(maximum && date > maximum);
    const beforeWindow = Boolean(minimum && date < minimum);
    return {
      ...entry,
      dateISO:toDateISO(date),
      calendarDate:toDateISO(date),
      windowOverflow:overflow || beforeWindow,
    };
  });
}

export function validateCalendarSpacing(calendar = [], minGapDays = MIN_MATCH_GAP_DAYS) {
  const errors = [];
  let previous = null;
  (Array.isArray(calendar) ? calendar : []).forEach((entry, index) => {
    const date = fromDateISO(entry?.dateISO || entry?.calendarDate);
    if (!date) {
      errors.push(`Slot ${index + 1} sem data canônica.`);
      return;
    }
    if (previous) {
      const gap = diffDays(previous.date, date);
      if (gap < minGapDays) errors.push(`Slots ${previous.index + 1} e ${index + 1} separados por apenas ${gap} dia(s).`);
    }
    previous = { date, index };
  });
  return { ok:errors.length === 0, errors };
}

export function validateCalendarWindows(calendar = []) {
  const errors = [];
  (Array.isArray(calendar) ? calendar : []).forEach((entry, index) => {
    const date = fromDateISO(entry?.dateISO || entry?.calendarDate);
    const start = fromDateISO(entry?.windowStartISO);
    const end = fromDateISO(entry?.windowEndISO);
    if (!date) return;
    if (start && date < start) errors.push(`Slot ${index + 1} antes da janela de ${entry?.windowLabel || entry?.targetSource || 'competição'}.`);
    if (end && date > end) errors.push(`Slot ${index + 1} após a janela de ${entry?.windowLabel || entry?.targetSource || 'competição'}.`);
  });
  return { ok:errors.length === 0, errors };
}

export function getInitialCareerDate(calendar = []) {
  const first = fromDateISO(calendar?.[0]?.dateISO || calendar?.[0]?.calendarDate);
  return first ? toDateISO(addDays(first, -3)) : null;
}

export function getCareerCurrentDate(gameData = {}) {
  const explicit = fromDateISO(gameData.currentDateISO || gameData.currentDate);
  if (explicit) return explicit;
  const inferred = getInitialCareerDate(gameData.calendar || []);
  return inferred ? fromDateISO(inferred) : null;
}

export function getCalendarSlotDate(gameData = {}, slotIndex = null) {
  const index = slotIndex == null ? Math.max(0, Number(gameData.round) || 0) : Math.max(0, Number(slotIndex) || 0);
  return fromDateISO(gameData?.calendar?.[index]?.dateISO || gameData?.calendar?.[index]?.calendarDate);
}

export function getDaysUntilCalendarSlot(gameData = {}, slotIndex = null) {
  const current = getCareerCurrentDate(gameData);
  const matchDate = getCalendarSlotDate(gameData, slotIndex);
  if (!current || !matchDate) return 0;
  return Math.max(0, diffDays(current, matchDate));
}

export function stampPlayedCalendarDate(gameData = {}, slotIndex = null) {
  const date = getCalendarSlotDate(gameData, slotIndex);
  if (!date) return gameData;
  return { ...gameData, currentDateISO:toDateISO(date), currentDate:toDateISO(date) };
}

function recoverEnergyForRestDay(player) {
  if (!player || typeof player !== 'object') return player;
  const current = Math.max(0, Math.min(100, Number(player.energy ?? 100) || 0));
  const base = player.injury ? 4 : 6;
  const agePenalty = (Number(player.age) || 25) > 30 ? 1 : 0;
  const recovery = Math.max(2, base - agePenalty);
  // Recuperação diária é separada da recuperação por rodada. Lesões continuam
  // usando roundsLeft para preservar saves antigos; apenas a energia melhora aqui.
  return { ...player, energy:Math.min(100, current + recovery) };
}

export function getCareerDayActivity(daysUntilMatch = 0) {
  const days = Math.max(0, Number(daysUntilMatch) || 0);
  if (days === 0) return { key:'matchday', icon:'⚽', label:'Dia de jogo' };
  if (days === 1) return { key:'eve', icon:'📋', label:'Véspera · ajustes táticos e recuperação' };
  if (days === 2) return { key:'tactical', icon:'🧠', label:'Preparação tática · carga moderada' };
  if (days <= 4) return { key:'training', icon:'🏃', label:'Treino de campo · recuperação controlada' };
  return { key:'recovery', icon:'🛌', label:'Recuperação · treino leve' };
}

export function advanceCareerDay(gameData = {}) {
  const current = getCareerCurrentDate(gameData);
  if (!current) return { state:gameData, advanced:false, daysUntilMatch:0, date:null };
  const target = getCalendarSlotDate(gameData);
  if (target && diffDays(current, target) <= 0) {
    return { state:gameData, advanced:false, daysUntilMatch:0, date:toDateISO(current) };
  }
  const nextDate = addDays(current, 1);
  const nextPlayers = (Array.isArray(gameData.players) ? gameData.players : []).map(recoverEnergyForRestDay);
  const nextState = syncUserRosterState({
    ...gameData,
    currentDateISO:toDateISO(nextDate),
    currentDate:toDateISO(nextDate),
    calendarDayCount:(Number(gameData.calendarDayCount) || 0) + 1,
  }, nextPlayers);
  return {
    state:nextState,
    advanced:true,
    date:toDateISO(nextDate),
    daysUntilMatch:target ? Math.max(0, diffDays(nextDate, target)) : 0,
    activity:getCareerDayActivity(target ? Math.max(0, diffDays(nextDate, target)) : 0),
  };
}

export function getDayLabel(date) {
  const source = date instanceof Date ? date : fromDateISO(date);
  if (!source) return '';
  return source.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'short' });
}

export default {
  MIN_MATCH_GAP_DAYS,
  toDateISO,
  fromDateISO,
  getSeasonLeagueStartDate,
  attachCanonicalDates,
  validateCalendarSpacing,
  validateCalendarWindows,
  getInitialCareerDate,
  getCareerCurrentDate,
  getCalendarSlotDate,
  getDaysUntilCalendarSlot,
  stampPlayedCalendarDate,
  advanceCareerDay,
  getCareerDayActivity,
  getDayLabel,
};

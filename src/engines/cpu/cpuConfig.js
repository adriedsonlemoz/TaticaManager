import { getSeasonTransferWindows } from '../calendar/seasonCalendar.js';

export const CPU_MIN_SQUAD_SIZE = 20;
export const CPU_MAX_SQUAD_SIZE = 30;
export const CPU_BUY_CHANCE = 0.22;
export const CPU_MAX_RECRUITS_PER_ROUND = 2;
export const CPU_TRADE_CHANCE = 0.08;
export const CPU_TRADE_INTERVAL = 3;

export const CPU_SERIE_BASE_OVR = Object.freeze({ A: 76, B: 68, C: 60, D: 50 });

// Compatibilidade com saves/testes anteriores ao calendário civil. Quando há
// currentDateISO, as janelas oficiais/projetadas por data têm precedência.
export const TRANSFER_WINDOWS = Object.freeze([
  Object.freeze({ open: 1, close: 5, label: 'Janela de Inverno' }),
  Object.freeze({ open: 20, close: 24, label: 'Janela de Verão' }),
]);

export function normalizeLeagueRound(round) {
  if (round && typeof round === 'object') {
    if (Number.isFinite(Number(round.transferRound))) return Math.max(1, Math.floor(Number(round.transferRound)));
    if (Number.isFinite(Number(round.leagueRound))) return Math.max(1, Math.floor(Number(round.leagueRound)) + 1);
    if (Number.isFinite(Number(round.round))) return Math.max(1, Math.floor(Number(round.round)) + 1);
  }
  const parsed = Number(round);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}

const isISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const asUtcDay = (value) => {
  if (!isISODate(value)) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  return Number.isFinite(time) ? time : null;
};
const daysBetween = (from, to) => {
  const start = asUtcDay(from);
  const end = asUtcDay(to);
  return start == null || end == null ? null : Math.max(0, Math.ceil((end - start) / 86400000));
};

function resolveDateContext(value, explicitSeason = null) {
  const dateISO = typeof value === 'string' && isISODate(value)
    ? value
    : (value && typeof value === 'object'
      ? (value.currentDateISO || value.currentDate || null)
      : null);
  if (!isISODate(dateISO)) return null;
  const season = Math.max(
    2026,
    Number(value && typeof value === 'object' ? value.season : explicitSeason)
      || Number(String(dateISO).slice(0, 4))
      || 2026,
  );
  return { dateISO:String(dateISO), season };
}

export function isTransferWindowOpen(value, explicitSeason = null) {
  const dateContext = resolveDateContext(value, explicitSeason);
  if (dateContext) {
    return getSeasonTransferWindows(dateContext.season).some((window) => (
      dateContext.dateISO >= window.start && dateContext.dateISO <= window.end
    ));
  }

  const leagueRound = normalizeLeagueRound(value);
  return TRANSFER_WINDOWS.some((transferWindow) => leagueRound >= transferWindow.open && leagueRound <= transferWindow.close);
}

export function getTransferWindowInfo(value, explicitSeason = null) {
  const dateContext = resolveDateContext(value, explicitSeason);
  if (dateContext) {
    const windows = getSeasonTransferWindows(dateContext.season);
    const current = windows.find((window) => dateContext.dateISO >= window.start && dateContext.dateISO <= window.end);
    if (current) {
      return {
        open:true,
        mode:'date',
        closesInDays:daysBetween(dateContext.dateISO, current.end),
        closesAt:current.end,
        label:current.label,
      };
    }

    let next = windows.find((window) => window.start > dateContext.dateISO);
    if (!next) next = getSeasonTransferWindows(dateContext.season + 1)[0];
    return {
      open:false,
      mode:'date',
      opensInDays:daysBetween(dateContext.dateISO, next?.start),
      opensAt:next?.start || null,
      label:next?.label || 'Janela de Transferências',
    };
  }

  const leagueRound = normalizeLeagueRound(value);
  const current = TRANSFER_WINDOWS.find((transferWindow) => leagueRound >= transferWindow.open && leagueRound <= transferWindow.close);
  if (current) {
    return {
      open:true,
      mode:'round',
      closesIn:Math.max(0, current.close - leagueRound),
      label:current.label,
    };
  }

  const next = TRANSFER_WINDOWS.find((transferWindow) => transferWindow.open > leagueRound) || TRANSFER_WINDOWS[0];
  const opensIn = next.open > leagueRound
    ? next.open - leagueRound
    : Math.max(0, (38 - leagueRound) + next.open);
  return { open:false, mode:'round', opensIn, label:next.label };
}

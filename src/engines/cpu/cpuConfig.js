export const CPU_MIN_SQUAD_SIZE = 20;
export const CPU_MAX_SQUAD_SIZE = 30;
export const CPU_BUY_CHANCE = 0.22;
export const CPU_MAX_RECRUITS_PER_ROUND = 2;
export const CPU_TRADE_CHANCE = 0.08;
export const CPU_TRADE_INTERVAL = 3;

export const CPU_SERIE_BASE_OVR = Object.freeze({ A: 76, B: 68, C: 60, D: 50 });

export const TRANSFER_WINDOWS = Object.freeze([
  Object.freeze({ open: 1, close: 5, label: 'Janela de Inverno' }),
  Object.freeze({ open: 20, close: 24, label: 'Janela de Verão' }),
]);

export function normalizeLeagueRound(round) {
  const parsed = Number(round);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
}

export function isTransferWindowOpen(round) {
  const leagueRound = normalizeLeagueRound(round);
  return TRANSFER_WINDOWS.some((transferWindow) => leagueRound >= transferWindow.open && leagueRound <= transferWindow.close);
}

export function getTransferWindowInfo(round) {
  const leagueRound = normalizeLeagueRound(round);
  const current = TRANSFER_WINDOWS.find((transferWindow) => leagueRound >= transferWindow.open && leagueRound <= transferWindow.close);
  if (current) {
    return {
      open: true,
      closesIn: Math.max(0, current.close - leagueRound),
      label: current.label,
    };
  }

  const next = TRANSFER_WINDOWS.find((transferWindow) => transferWindow.open > leagueRound) || TRANSFER_WINDOWS[0];
  const opensIn = next.open > leagueRound
    ? next.open - leagueRound
    : Math.max(0, (38 - leagueRound) + next.open);
  return { open: false, opensIn, label: next.label };
}

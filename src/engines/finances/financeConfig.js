export const TV_BASE_BY_SERIE = Object.freeze({ A: 400_000, B: 280_000, C: 90_000, D: 55_000 });
export const OPERATIONAL_BASE_BY_SERIE = Object.freeze({ A: 800_000, B: 120_000, C: 40_000, D: 15_000 });
export const DEFAULT_TICKET_PRICE_BY_SERIE = Object.freeze({ A: 50, B: 30, C: 20, D: 12 });
export const DEFAULT_STADIUM_CAPACITY_BY_SERIE = Object.freeze({ A: 25_000, B: 18_000, C: 10_000, D: 6_000 });
export const FINANCIAL_HISTORY_LIMIT = 300;

export const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
export const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

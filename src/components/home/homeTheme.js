import { getTeamBranding } from '../../data/teamBranding.js';

export const HOME_THEME = Object.freeze({
  bg: '#f9fafb',
  card: '#ffffff',
  cardAlt: '#f0fdf4',
  border: '#d1fae5',
  grass: '#16a34a',
  grassDk: '#15803d',
  gold: '#d97706',
  ink: '#052e16',
  ink2: '#166534',
  ink3: '#4b7a5c',
  red: '#dc2626',
  blue: '#1d4ed8',
  yellow: '#fbbf24',
  shadow: '0 2px 16px rgba(22,163,74,0.10)',
});

const normalizeHex = (value, fallback = '#16a34a') => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
const rgb = (hex) => {
  const value = normalizeHex(hex).slice(1);
  return [0,2,4].map((i) => parseInt(value.slice(i, i + 2), 16));
};
const toHex = (values) => `#${values.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;
export const mixHomeColor = (a, b, amount = .5) => {
  const ar = rgb(a); const br = rgb(b); const t = Math.max(0, Math.min(1, amount));
  return toHex(ar.map((value, index) => value + ((br[index] - value) * t)));
};
const luminance = (hex) => {
  const channels = rgb(hex).map((value) => {
    const c = value / 255;
    return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
};

export function buildHomeTheme(clubName) {
  const brand = getTeamBranding(clubName);
  const primary = normalizeHex(brand.primary, HOME_THEME.grass);
  const secondary = normalizeHex(brand.secondary, '#ffffff');
  // Cabeçalhos muito claros recebem um tom escurecido para manter texto branco legível.
  const headerEnd = luminance(primary) > .55 ? mixHomeColor(primary, '#000000', .34) : primary;
  const headerStart = mixHomeColor(headerEnd, '#000000', .22);
  const accent = luminance(primary) > .72 ? headerEnd : primary;
  return {
    ...HOME_THEME,
    brandPrimary:primary,
    brandSecondary:secondary,
    grass:accent,
    grassDk:headerStart,
    cardAlt:mixHomeColor(accent, '#ffffff', .93),
    border:mixHomeColor(accent, '#ffffff', .79),
    ink2:luminance(accent) > .5 ? mixHomeColor(accent, '#000000', .52) : accent,
    ink3:mixHomeColor('#374151', accent, .22),
    shadow:`0 3px 18px ${accent}18`,
    headerStart,
    headerEnd,
  };
}

export const getSerieColor = (serie) => ({
  A: '#16a34a',
  B: '#d97706',
  C: '#2563eb',
  D: '#7c3aed',
}[serie] || HOME_THEME.grass);

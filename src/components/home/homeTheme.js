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

export const getSerieColor = (serie) => ({
  A: HOME_THEME.grass,
  B: '#d97706',
  C: '#2563eb',
  D: '#7c3aed',
}[serie] || HOME_THEME.grass);

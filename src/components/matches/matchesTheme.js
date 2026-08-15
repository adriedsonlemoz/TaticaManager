import { THEME } from '../../theme.js';

export const C = THEME;

export const N = {
  bg: THEME.bg,
  card: THEME.card,
  cardAlt: THEME.cardAlt,
  border: THEME.border,
  accent: THEME.blue,
  green: THEME.green,
  teal: THEME.teal,
  red: THEME.red,
  gold: THEME.gold,
  txt1: THEME.txt1,
  txt2: THEME.txt2,
  txt3: THEME.txt3,
};

export const getResultColor = (result) => {
  if (!result) return N.txt3;
  if (result.outcome === 'win') return N.green;
  if (result.outcome === 'draw') return N.gold;
  return N.red;
};

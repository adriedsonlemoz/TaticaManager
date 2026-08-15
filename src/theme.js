// @migrated to ES module
import { createTheme } from '@mui/material/styles';

export const THEME = {

  // ── Fundos ────────────────────────────────────────────────
  bg:           '#f4f7f6',
  bgCard:       '#ffffff',
  bgCardAlt:    '#f8fafc',
  bgDark:       '#f1f5f9',

  // ── Bordas ────────────────────────────────────────────────
  border:       '#e2e8f0',
  borderAcc:    '#cbd5e1',
  borderG:      '#cbd5e1',
  bord2:        '#cbd5e1',
  bord3:        '#dbeafe',

  // ── Texto ─────────────────────────────────────────────────
  ink:          '#0f172a',
  ink2:         '#334155',
  ink3:         '#64748b',
  ink4:         '#94a3b8',

  // ── Acentos ───────────────────────────────────────────────
  primary:      '#16a34a',
  primaryDim:   '#15803d',
  green:        '#16a34a',
  greenLight:   '#22c55e',
  teal:         '#14b8a6',
  blue:         '#3b82f6',
  red:          '#ef4444',
  gold:         '#f59e0b',
  yellow:       '#f59e0b',
  orange:       '#f97316',
  purple:       '#8b5cf6',

  // ── Sombra ────────────────────────────────────────────────
  shadow:       'rgba(0,0,0,0.04)',

  // ── Overlays de modal ─────────────────────────────────────
  overlay:      'rgba(0,0,0,0.5)',
  overlayHeavy: 'rgba(0,0,0,0.82)',

  // ── Barra de posse (sobre campo verde) ────────────────────
  possessionBg: 'rgba(255,255,255,0.85)',

  // ── Grama do campo SVG (deve ser sempre verde) ────────────
  grassLight:   '#1b6b1b',
  grassDark:    '#0f4010',

  // ── Badges de posição de jogador ──────────────────────────
  posGol:       '#b45309',
  posZag:       '#1d4ed8',
  posLat:       '#0369a1',
  posVol:       '#15803d',
  posMei:       '#166534',
  posAta:       '#b91c1c',
  posDef:       '#374151',

  // ── Cores de OVR ──────────────────────────────────────────
  ovrGood:      '#15803d',
  ovrMid:       '#b45309',
  ovrBad:       '#dc2626',

  // ── Tokens para ScreenTable ───────────────────────────────
  fieldDark:    '#14532d',   // verde campo escuro (antes era #f4f7f6 — claro!)
  fieldMid:     '#166534',   // verde campo médio
  fieldLight:   '#15803d',   // verde campo claro
  headerBg:     '#14532d',   // header da tabela (antes era #f1f5f9 — claro!)
  rowEven:      '#ffffff',
  rowOdd:       '#f8fafc',
  rowUser:      'rgba(22,163,74,0.08)',
  pts:          '#14b8a6',
  txtDark:      '#0f172a',
  txtMid:       '#334155',
  zGreen:       '#16a34a',
  zBlue:        '#3b82f6',
  zLightBlue:   '#14b8a6',
  zYellow:      '#f59e0b',
  zRed:         '#ef4444',
  zGray:        '#64748b',

  // ── Tokens para ScreenMatches ─────────────────────────────
  bgHeader:     '#f1f5f9',
  bgCalendar:   '#ffffff',
  txtDisabled:  '#cbd5e1',
  borderBright: '#16a34a',

  // ── Tokens para ScreenLineup ──────────────────────────────
  dark:         '#f1f5f9',


  // ── Cores das competições (copas) ────────────────────────
  copa:        '#0d9488',   // Copa do Brasil — teal escuro
  liberta:     '#1d4ed8',   // Libertadores — azul
  sulam:       '#9333ea',   // Sul-Americana — roxo

  // ── Aliases de retrocompatibilidade ───────────────────────
  card:         '#ffffff',
  cardAlt:      '#f8fafc',
  cardB:        '#f8fafc',
  prim2:        '#15803d',
  act:          '#16a34a',
  inact:        '#94a3b8',
  txt1:         '#0f172a',
  txt2:         '#334155',
  txt3:         '#64748b',
  txt4:         '#94a3b8',
  liveHeaderBg: '#f1f5f9',
};

// Alias para retrocompatibilidade com código que usa DIEX_THEME
export const DIEX_THEME = { navy: THEME, green: THEME };

export const pergaminhoTheme = createTheme({
  palette: {
    mode: 'light',
    background: { default: THEME.bg,      paper:        THEME.bgCard  },
    primary:    { main: THEME.primary,    contrastText: '#ffffff' },
    secondary:  { main: THEME.blue,       contrastText: '#ffffff' },
    success:    { main: THEME.green,      contrastText: '#ffffff' },
    info:       { main: THEME.teal,       contrastText: '#ffffff' },
    error:      { main: THEME.red,        contrastText: '#ffffff' },
    warning:    { main: THEME.gold,       contrastText: '#ffffff' },
    text:       { primary: THEME.ink,     secondary:    THEME.ink2 },
  },
  typography: { fontFamily: '"Nunito", "Segoe UI", sans-serif', htmlFontSize: 17.5 },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { fontWeight: 900, textTransform: 'none', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: { color: '#ffffff', '&:hover': { backgroundColor: THEME.primaryDim } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: THEME.bgCard, border: '1px solid ' + THEME.border },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundImage: 'none', backgroundColor: THEME.bgCard, border: '1px solid ' + THEME.border, borderRadius: '14px' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-root': { backgroundColor: THEME.bgCardAlt, color: THEME.ink, fontWeight: 900, borderBottom: '1px solid ' + THEME.border } },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:nth-of-type(even)': { backgroundColor: 'rgba(0,0,0,0.015)' }, '&:hover': { backgroundColor: 'rgba(22,163,74,0.04)' } },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: '1px solid ' + THEME.border, color: THEME.ink } },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: THEME.border } } },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: THEME.bg,
          scrollbarColor: THEME.border + ' ' + THEME.bg,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: THEME.bg },
          '&::-webkit-scrollbar-thumb': { background: THEME.border, borderRadius: '3px' },
        },
      },
    },
  },
});

export default THEME;

// ── DARK_THEME ────────────────────────────────────────────────
// Paleta escura usada pela ScreenSeasonEnd (tela de fim de temporada).
// Mantida aqui para que qualquer mudança de cor se propague automaticamente.
// Não é usada pelo MUI ThemeProvider — apenas como tokens de cor diretos.
export const DARK_THEME = {
  bg:      '#0d1b2a',
  card:    '#111e2d',
  cardAlt: '#162638',
  border:  '#1e3448',
  teal:    '#00d4c8',
  green:   '#22c55e',
  red:     '#ef4444',
  gold:    '#f59e0b',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  txt1:    '#e8f4fd',
  txt2:    '#8daec8',
  txt3:    '#4d7a9e',
};

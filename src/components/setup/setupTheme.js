export const SETUP_TOTAL_STEPS = 5;

export const SETUP_PALETTE = {
  bg: '#f2f7f4', surface: '#ffffff', border: '#ddeae3', green: '#10b981',
  greenMid: '#34d399', greenLight: '#d1fae5', greenDark: '#059669', txt1: '#0d1f17',
  txt2: '#3d5c4a', txt3: '#7eaa90', txt4: '#b5d4c2', gold: '#d97706',
  goldLight: '#fef3c7', red: '#dc2626', redLight: '#fee2e2', blue: '#2563eb',
  blueLight: '#dbeafe', purple: '#7c3aed', purpleLight: '#ede9fe', shadow: 'rgba(16,185,129,0.10)',
};

export const SETUP_INPUT_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: '9px',
  border: `1.5px solid ${SETUP_PALETTE.border}`, background: SETUP_PALETTE.surface,
  color: SETUP_PALETTE.txt1, fontSize: '0.88rem', fontFamily: '"Nunito",sans-serif',
  fontWeight: 700, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s',
};

export const formatSetupMoney = value => !value
  ? 'Padrão'
  : value >= 1e6
    ? `R$ ${(value / 1e6).toFixed(1).replace('.0', '')}M`
    : `R$ ${(value / 1e3).toFixed(0)}K`;

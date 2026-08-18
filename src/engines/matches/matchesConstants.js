export const MONTH_NAMES = [
  'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
  'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO',
];

export const WEEK_DAYS_SHORT = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
export const WEEK_DAYS = ['S','T','Q','Q','S','S','D'];

export const CUP_META = Object.freeze({
  copaBrasil: { label: '🏆 Copa do Brasil', color: '#00695c' },
  libertadores: { label: '🌟 Libertadores', color: '#1a237e' },
  sulAmericana: { label: '🌎 Sul-Americana', color: '#b71c1c' },
});

export const getCupLabel = cupKey => CUP_META[cupKey]?.label || '🏆 Copa';

export const getCupColor = (label = '') => (
  label.includes('Brasil') ? CUP_META.copaBrasil.color
    : label.includes('Libert') ? CUP_META.libertadores.color
      : CUP_META.sulAmericana.color
);

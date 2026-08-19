import { REGIONAL_2026_CONFIGS } from '../cups/regionalConfig.js';
import { STATE_2026_CONFIGS } from '../cups/stateConfig.js';

export const MONTH_NAMES = [
  'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
  'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO',
];

export const WEEK_DAYS_SHORT = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
export const WEEK_DAYS = ['S','T','Q','Q','S','S','D'];

const baseMeta = {
  copaBrasil: { label: '🏆 Copa do Brasil', color: '#00695c' },
  libertadores: { label: '🌟 Libertadores', color: '#1a237e' },
  sulAmericana: { label: '🌎 Sul-Americana', color: '#b71c1c' },
};
const configMeta = Object.fromEntries(
  [...Object.values(REGIONAL_2026_CONFIGS), ...Object.values(STATE_2026_CONFIGS)]
    .map((config) => [config.key, { label:config.label, color:config.color }]),
);

export const CUP_META = Object.freeze({ ...baseMeta, ...configMeta });

export const getCupLabel = cupKey => CUP_META[cupKey]?.label || '🏆 Copa';

export const getCupColor = (labelOrKey = '') => {
  if (CUP_META[labelOrKey]) return CUP_META[labelOrKey].color;
  const label = String(labelOrKey || '');
  const exact = Object.values(CUP_META).find((meta) => meta.label === label);
  if (exact) return exact.color;
  const partial = Object.values(CUP_META).find((meta) => label.includes(meta.label.replace(/^[^\p{L}\p{N}]+/u, '').trim()));
  return partial?.color || baseMeta.copaBrasil.color;
};

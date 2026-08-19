import { getTeamBranding } from './teamBranding.js';

export { KIT_PATTERNS, KIT_PATTERN_OPTIONS } from './teamKitPatterns.js';
import { KIT_PATTERNS } from './teamKitPatterns.js';

const OVERRIDES = Object.freeze({
  Flamengo:{ pattern:'horizontal-stripes', primary:'#E30613', secondary:'#111111', accent:'#FFFFFF' },
  Palmeiras:{ pattern:'solid', primary:'#006437', secondary:'#FFFFFF', accent:'#0c3b25' },
  Botafogo:{ pattern:'vertical-stripes', primary:'#111111', secondary:'#FFFFFF', accent:'#C9A227' },
  'Atlético MG':{ pattern:'vertical-stripes', primary:'#111111', secondary:'#FFFFFF', accent:'#D1A438' },
  Corinthians:{ pattern:'solid', primary:'#F7F7F7', secondary:'#111111', accent:'#E30613' },
  Internacional:{ pattern:'solid', primary:'#D71920', secondary:'#FFFFFF', accent:'#9e1116' },
  'São Paulo':{ pattern:'chest-band', primary:'#FFFFFF', secondary:'#E30613', accent:'#111111' },
  Fluminense:{ pattern:'vertical-stripes', primary:'#7A1731', secondary:'#08783F', accent:'#FFFFFF' },
  Grêmio:{ pattern:'vertical-stripes', primary:'#53A5D8', secondary:'#111111', accent:'#FFFFFF' },
  Fortaleza:{ pattern:'vertical-stripes', primary:'#1457A6', secondary:'#E30613', accent:'#FFFFFF' },
  Cruzeiro:{ pattern:'solid', primary:'#1246A3', secondary:'#FFFFFF', accent:'#7DB9FF' },
  Santos:{ pattern:'solid', primary:'#FFFFFF', secondary:'#111111', accent:'#D9D9D9' },
  Vasco:{ pattern:'diagonal-sash', primary:'#111111', secondary:'#FFFFFF', accent:'#E30613' },
  'Athletico PR':{ pattern:'vertical-stripes', primary:'#D71920', secondary:'#111111', accent:'#FFFFFF' },
  Bahia:{ pattern:'chest-band', primary:'#FFFFFF', secondary:'#1752A4', accent:'#E30613' },
  Bragantino:{ pattern:'solid', primary:'#FFFFFF', secondary:'#E30613', accent:'#111111' },
  Criciúma:{ pattern:'horizontal-stripes', primary:'#F7B500', secondary:'#111111', accent:'#FFFFFF' },
  Juventude:{ pattern:'vertical-stripes', primary:'#138447', secondary:'#FFFFFF', accent:'#111111' },
  Cuiabá:{ pattern:'solid', primary:'#F7B500', secondary:'#18803B', accent:'#FFFFFF' },
  'Atlético GO':{ pattern:'horizontal-stripes', primary:'#D71920', secondary:'#111111', accent:'#FFFFFF' },
  Sport:{ pattern:'horizontal-stripes', primary:'#D71920', secondary:'#111111', accent:'#F3C544' },
  Ceará:{ pattern:'vertical-stripes', primary:'#111111', secondary:'#FFFFFF', accent:'#777777' },
  Goiás:{ pattern:'solid', primary:'#0A7A3F', secondary:'#FFFFFF', accent:'#0c4f2e' },
  Coritiba:{ pattern:'chest-band', primary:'#FFFFFF', secondary:'#0A7A3F', accent:'#111111' },
  Avaí:{ pattern:'vertical-stripes', primary:'#1457A6', secondary:'#FFFFFF', accent:'#74B7EA' },
  Paysandu:{ pattern:'vertical-stripes', primary:'#165AA7', secondary:'#FFFFFF', accent:'#8BC5F2' },
  Mirassol:{ pattern:'horizontal-stripes', primary:'#F7B500', secondary:'#138447', accent:'#FFFFFF' },
  'Operário PR':{ pattern:'vertical-stripes', primary:'#111111', secondary:'#FFFFFF', accent:'#777777' },
  Guarani:{ pattern:'solid', primary:'#0A7A3F', secondary:'#FFFFFF', accent:'#111111' },
  'Ponte Preta':{ pattern:'diagonal-sash', primary:'#FFFFFF', secondary:'#111111', accent:'#777777' },
  Chapecoense:{ pattern:'solid', primary:'#0A7A3F', secondary:'#FFFFFF', accent:'#dcefe4' },
  'Vila Nova':{ pattern:'solid', primary:'#D71920', secondary:'#FFFFFF', accent:'#111111' },
  CRB:{ pattern:'horizontal-stripes', primary:'#D71920', secondary:'#FFFFFF', accent:'#111111' },
  'Sampaio Corrêa':{ pattern:'horizontal-stripes', primary:'#F0C419', secondary:'#D71920', accent:'#168447' },
  Vitória:{ pattern:'horizontal-stripes', primary:'#D71920', secondary:'#111111', accent:'#FFFFFF' },
  Londrina:{ pattern:'vertical-stripes', primary:'#1457A6', secondary:'#FFFFFF', accent:'#8BC5F2' },
  Figueirense:{ pattern:'vertical-stripes', primary:'#111111', secondary:'#FFFFFF', accent:'#777777' },
  CSA:{ pattern:'vertical-stripes', primary:'#1457A6', secondary:'#FFFFFF', accent:'#D71920' },
  Náutico:{ pattern:'vertical-stripes', primary:'#D71920', secondary:'#FFFFFF', accent:'#111111' },
  Remo:{ pattern:'solid', primary:'#163D8F', secondary:'#FFFFFF', accent:'#78A7E5' },
  'Botafogo PB':{ pattern:'vertical-stripes', primary:'#111111', secondary:'#FFFFFF', accent:'#777777' },
  'Santa Cruz':{ pattern:'horizontal-stripes', primary:'#FFFFFF', secondary:'#D71920', accent:'#111111' },
  'Portuguesa-SP':{ pattern:'horizontal-stripes', primary:'#D71920', secondary:'#138447', accent:'#FFFFFF' },
});

const isDark = (hex = '#000000') => {
  const value = String(hex).replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return false;
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

export function getTeamKitIdentity(teamName) {
  const override = OVERRIDES[teamName];
  const brand = getTeamBranding(teamName);
  const primary = override?.primary || brand.primary || '#10b981';
  const secondary = override?.secondary || brand.secondary || '#ffffff';
  const accent = override?.accent || (isDark(primary) ? '#ffffff' : '#111827');
  const pattern = KIT_PATTERNS.includes(override?.pattern) ? override.pattern : 'solid';
  const awayPrimary = secondary;
  const awaySecondary = primary;
  const thirdPrimary = isDark(primary) ? '#E5E7EB' : '#1F2937';
  const thirdSecondary = isDark(primary) ? primary : secondary;
  return {
    pattern,
    primary,
    secondary,
    accent,
    away:{ pattern:'solid', primary:awayPrimary, secondary:awaySecondary, accent },
    third:{ pattern:'center-stripe', primary:thirdPrimary, secondary:thirdSecondary, accent:primary },
  };
}

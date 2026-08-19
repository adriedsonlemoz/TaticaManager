import { SERIE_D_2026_CLUB_NAMES, SERIE_D_2026_IDS } from './serieD2026.js';
// Cadastro canônico de clubes do Tática Manager.
// IDs são permanentes e NÃO dependem da divisão atual do clube.
// A composição das séries abaixo representa a temporada-base 2026 do jogo.

const club = (id, name, serie2026, strength, money, budget, style = 'equilibrado', fanBase = 0.5, aliases = []) => ({
  id, name, serie2026, strength, money, budget, style, fanBase, aliases,
});

const CORE_2026_CLUBS = Object.freeze([
  // Série A 2026
  club('br-flamengo', 'Flamengo', 'A', 87, 157000000, 125000000, 'ofensivo', 1.00),
  club('br-palmeiras', 'Palmeiras', 'A', 86, 146000000, 116000000, 'equilibrado', 0.92),
  club('br-cruzeiro', 'Cruzeiro', 'A', 84, 126000000, 100000000, 'equilibrado', 0.82),
  club('br-mirassol', 'Mirassol', 'A', 79, 73000000, 58000000, 'ofensivo', 0.50),
  club('br-fluminense', 'Fluminense', 'A', 82, 104000000, 83000000, 'equilibrado', 0.72),
  club('br-bahia', 'Bahia', 'A', 81, 94000000, 75000000, 'ofensivo', 0.70),
  club('br-botafogo', 'Botafogo', 'A', 83, 115000000, 92000000, 'ofensivo', 0.78),
  club('br-sao-paulo', 'São Paulo', 'A', 82, 104000000, 83000000, 'equilibrado', 0.88),
  club('br-red-bull-bragantino', 'Red Bull Bragantino', 'A', 79, 73000000, 58000000, 'ofensivo', 0.55, ['Bragantino']),
  club('br-corinthians', 'Corinthians', 'A', 81, 94000000, 75000000, 'equilibrado', 0.95),
  club('br-gremio', 'Grêmio', 'A', 80, 84000000, 67000000, 'equilibrado', 0.82),
  club('br-vasco-da-gama', 'Vasco da Gama', 'A', 79, 73000000, 58000000, 'equilibrado', 0.78, ['Vasco']),
  club('br-atletico-mg', 'Atlético-MG', 'A', 83, 115000000, 92000000, 'ofensivo', 0.85, ['Atlético MG', 'Atlético Mineiro']),
  club('br-santos', 'Santos', 'A', 79, 73000000, 58000000, 'ofensivo', 0.76),
  club('br-vitoria', 'Vitória', 'A', 76, 42000000, 33000000, 'equilibrado', 0.62),
  club('br-internacional', 'Internacional', 'A', 81, 94000000, 75000000, 'equilibrado', 0.80),
  club('br-coritiba', 'Coritiba', 'A', 74, 31000000, 24000000, 'equilibrado', 0.60),
  club('br-athletico-pr', 'Athletico-PR', 'A', 80, 84000000, 67000000, 'defensivo', 0.68, ['Athletico PR', 'Athletico Paranaense']),
  club('br-chapecoense', 'Chapecoense', 'A', 73, 25000000, 19000000, 'defensivo', 0.52),
  club('br-remo', 'Remo', 'A', 72, 22000000, 17000000, 'equilibrado', 0.60),

  // Série B 2026
  club('br-america-mg', 'América-MG', 'B', 73, 24000000, 18000000, 'equilibrado', 0.58, ['América Mineiro', 'America Mineiro']),
  club('br-athletic', 'Athletic', 'B', 70, 17000000, 13000000, 'equilibrado', 0.38, ['Athletic Club']),
  club('br-atletico-go', 'Atlético-GO', 'B', 72, 21000000, 16000000, 'ofensivo', 0.48, ['Atlético GO', 'Atlético Goianiense']),
  club('br-avai', 'Avaí', 'B', 71, 19000000, 14000000, 'defensivo', 0.50),
  club('br-botafogo-sp', 'Botafogo-SP', 'B', 69, 14000000, 10000000, 'equilibrado', 0.40, ['Botafogo SP']),
  club('br-ceara', 'Ceará', 'B', 74, 24000000, 18000000, 'defensivo', 0.68),
  club('br-crb', 'CRB', 'B', 68, 13000000, 9000000, 'equilibrado', 0.42),
  club('br-criciuma', 'Criciúma', 'B', 72, 21000000, 16000000, 'equilibrado', 0.52),
  club('br-cuiaba', 'Cuiabá', 'B', 71, 19000000, 14000000, 'defensivo', 0.45),
  club('br-fortaleza', 'Fortaleza', 'B', 75, 25000000, 19000000, 'ofensivo', 0.70),
  club('br-goias', 'Goiás', 'B', 73, 23000000, 17000000, 'ofensivo', 0.58),
  club('br-juventude', 'Juventude', 'B', 73, 22000000, 17000000, 'defensivo', 0.48),
  club('br-londrina', 'Londrina', 'B', 69, 15000000, 11000000, 'equilibrado', 0.46),
  club('br-nautico', 'Náutico', 'B', 69, 15000000, 11000000, 'ofensivo', 0.52),
  club('br-novorizontino', 'Novorizontino', 'B', 71, 19000000, 14000000, 'ofensivo', 0.38),
  club('br-operario-pr', 'Operário Ferroviário', 'B', 70, 17000000, 13000000, 'defensivo', 0.48, ['Operário PR', 'Operário-PR']),
  club('br-ponte-preta', 'Ponte Preta', 'B', 69, 16000000, 12000000, 'equilibrado', 0.54),
  club('br-sao-bernardo', 'São Bernardo', 'B', 69, 15000000, 11000000, 'equilibrado', 0.38),
  club('br-sport', 'Sport', 'B', 74, 25000000, 19000000, 'equilibrado', 0.68),
  club('br-vila-nova', 'Vila Nova', 'B', 70, 17000000, 13000000, 'equilibrado', 0.46),

  // Série C 2026
  club('br-amazonas', 'Amazonas', 'C', 64, 13000000, 9000000, 'equilibrado', 0.42),
  club('br-anapolis', 'Anápolis', 'C', 62, 11000000, 8000000, 'defensivo', 0.32),
  club('br-barra-sc', 'Barra-SC', 'C', 61, 10000000, 7000000, 'equilibrado', 0.28, ['Barra']),
  club('br-botafogo-pb', 'Botafogo-PB', 'C', 64, 13000000, 9000000, 'equilibrado', 0.44, ['Botafogo PB']),
  club('br-brusque', 'Brusque', 'C', 65, 14000000, 10000000, 'defensivo', 0.40),
  club('br-caxias', 'Caxias', 'C', 63, 12000000, 9000000, 'defensivo', 0.38),
  club('br-confianca', 'Confiança', 'C', 62, 11000000, 8000000, 'equilibrado', 0.38),
  club('br-ferroviaria', 'Ferroviária', 'C', 64, 13000000, 9000000, 'equilibrado', 0.36),
  club('br-figueirense', 'Figueirense', 'C', 63, 12000000, 9000000, 'defensivo', 0.48),
  club('br-floresta', 'Floresta', 'C', 62, 10000000, 7000000, 'defensivo', 0.30),
  club('br-guarani', 'Guarani', 'C', 66, 15000000, 11000000, 'equilibrado', 0.52),
  club('br-inter-de-limeira', 'Inter de Limeira', 'C', 64, 12000000, 9000000, 'equilibrado', 0.34),
  club('br-itabaiana', 'Itabaiana', 'C', 61, 9000000, 7000000, 'defensivo', 0.32),
  club('br-ituano', 'Ituano', 'C', 63, 12000000, 9000000, 'ofensivo', 0.36),
  club('br-maranhao', 'Maranhão', 'C', 61, 9000000, 7000000, 'equilibrado', 0.34),
  club('br-maringa', 'Maringá', 'C', 63, 12000000, 9000000, 'ofensivo', 0.34),
  club('br-paysandu', 'Paysandu', 'C', 65, 14000000, 10000000, 'equilibrado', 0.60),
  club('br-santa-cruz', 'Santa Cruz', 'C', 64, 13000000, 9000000, 'ofensivo', 0.62),
  club('br-volta-redonda', 'Volta Redonda', 'C', 64, 13000000, 9000000, 'equilibrado', 0.36),
  club('br-ypiranga-rs', 'Ypiranga-RS', 'C', 63, 12000000, 9000000, 'equilibrado', 0.36, ['Ypiranga', 'Ypiranga de Erechim']),

  // Série D 2026 — parâmetros manuais preservados para clubes que já existiam
  // antes da expansão do catálogo completo de 96 participantes.
  club('br-abc', 'ABC', 'D', 60, 9000000, 6500000, 'equilibrado', 0.48),
  club('br-gama', 'Gama', 'D', 58, 7500000, 5500000, 'equilibrado', 0.42),
  club('br-uberlandia', 'Uberlândia', 'D', 58, 7500000, 5500000, 'equilibrado', 0.38),
  club('br-asa', 'ASA', 'D', 58, 7500000, 5500000, 'defensivo', 0.40, ['ASA de Arapiraca']),
  club('br-nacional-am', 'Nacional-AM', 'D', 57, 7000000, 5000000, 'equilibrado', 0.38, ['Nacional AM']),
  club('br-csa', 'CSA', 'D', 59, 8000000, 6000000, 'equilibrado', 0.46),
  club('br-sao-jose-rs', 'São José-RS', 'D', 57, 7000000, 5000000, 'defensivo', 0.34, ['São José']),
  club('br-goiatuba', 'Goiatuba', 'D', 56, 6500000, 4500000, 'equilibrado', 0.30),
  club('br-ferroviario', 'Ferroviário', 'D', 57, 7000000, 5000000, 'ofensivo', 0.38),
  club('br-luverdense', 'Luverdense', 'D', 56, 6500000, 4500000, 'equilibrado', 0.32),
  club('br-treze', 'Treze', 'D', 56, 6500000, 4500000, 'ofensivo', 0.42),
  club('br-portuguesa-sp', 'Portuguesa-SP', 'D', 57, 7000000, 5000000, 'equilibrado', 0.46, ['Portuguesa']),
  club('br-sao-luiz-rs', 'São Luiz-RS', 'D', 55, 6000000, 4200000, 'defensivo', 0.30, ['São Luiz']),
  club('br-cianorte', 'Cianorte', 'D', 56, 6500000, 4500000, 'equilibrado', 0.32),
  club('br-america-rn', 'América-RN', 'D', 58, 7500000, 5500000, 'ofensivo', 0.48, ['América de Natal']),
  club('br-trem', 'Trem', 'D', 54, 5500000, 3800000, 'defensivo', 0.28),
  club('br-iguatu', 'Iguatu', 'D', 55, 6000000, 4200000, 'defensivo', 0.28),
  club('br-ceilandia', 'Ceilândia', 'D', 54, 5500000, 3800000, 'equilibrado', 0.30, ['Ceilandia']),
  club('br-manaus', 'Manaus', 'D', 54, 5500000, 3800000, 'equilibrado', 0.34),
  club('br-sousa', 'Sousa', 'D', 55, 6000000, 4200000, 'defensivo', 0.34, ['Souza']),
]);

const CORE_BY_ID = new Map(CORE_2026_CLUBS.map((entry) => [entry.id, entry]));
const serieDGameplayDefaults = (id, name, index) => {
  // Valores abaixo são parâmetros de balanceamento do jogo, não dados factuais do clube.
  const strength = 53 + (index % 6);
  const money = 5_500_000 + (index % 5) * 500_000;
  return club(id, name, 'D', strength, money, Math.round(money * 0.72 / 100_000) * 100_000, 'equilibrado', 0.30);
};

// A Série D oficial de 2026 possui 96 participantes. Preservamos os parâmetros
// já existentes para os clubes que estavam na base antiga e usamos defaults
// de gameplay para os demais, sem inventar cidade/estádio/títulos.
const SERIE_D_2026_CLUBS = Object.freeze(SERIE_D_2026_IDS.map((id, index) => (
  CORE_BY_ID.get(id) || serieDGameplayDefaults(id, SERIE_D_2026_CLUB_NAMES[id] || id, index)
)));

export const CURRENT_2026_CLUBS = Object.freeze([
  ...CORE_2026_CLUBS.filter((entry) => entry.serie2026 !== 'D'),
  ...SERIE_D_2026_CLUBS,
]);

// Desde a beta.53 a pirâmide usa os 96 participantes da Série D 2026.
// O alias é preservado para consumidores antigos, mas deixa de representar um recorte.
export const PYRAMID_2026_SERIE_D_IDS = Object.freeze([...SERIE_D_2026_IDS]);

// Clubes presentes nas bases beta.49 e anteriores que não fazem parte das séries
// canônicas de 2026. Mantidos para migrar saves antigos sem trocar a identidade do clube.
const LEGACY_ONLY_CLUBS_RAW = Object.freeze([
  club('br-sampaio-correa', 'Sampaio Corrêa', null, 68, 12000000, 9000000),
  club('br-tombense', 'Tombense', null, 67, 11000000, 8000000),
  club('br-atletico-ac', 'Atlético-AC', null, 59, 9000000, 6000000, 'defensivo', 0.30, ['Atlético AC']),
  club('br-campinense', 'Campinense', null, 56, 7000000, 5000000),
  club('br-aparecidense', 'Aparecidense', null, 55, 6000000, 4000000),
  club('br-manauara', 'Manauara', null, 55, 6000000, 4000000),
  club('br-dom-bosco', 'Dom Bosco', null, 52, 5000000, 3500000),
  club('br-hercilio-luz', 'Hercílio Luz', null, 52, 4800000, 3300000),
  club('br-gas', 'GAS', null, 51, 4400000, 3000000, 'equilibrado', 0.25, ['GAS Rolim', 'GAS-RR']),
  club('br-real-noroeste', 'Real Noroeste', null, 50, 4200000, 2900000),
  club('br-tocantinopolis', 'Tocantinópolis', null, 50, 4000000, 2800000),
  club('br-pouso-alegre', 'Pouso Alegre', null, 49, 3800000, 2600000),
  club('br-sergipe', 'Sergipe', null, 49, 3600000, 2500000),
  club('br-atletico-ms', 'Atlético-MS', null, 48, 3400000, 2400000, 'defensivo', 0.22, ['Atlético MS']),
  club('br-porto-velho', 'Porto Velho', null, 48, 3200000, 2200000),
  club('br-moto-club', 'Moto Club', null, 46, 2700000, 1900000),
  club('br-genus', 'Genus', null, 45, 2600000, 1800000),
  club('br-humaita', 'Humaitá', null, 43, 2200000, 1500000),
  club('br-placido-castro', 'Plácido de Castro', null, 43, 2000000, 1400000, 'equilibrado', 0.15, ['Plácido Castro']),
]);

const CURRENT_IDS = new Set(CURRENT_2026_CLUBS.map((entry) => entry.id));
export const LEGACY_ONLY_CLUBS = Object.freeze(LEGACY_ONLY_CLUBS_RAW.filter((entry) => !CURRENT_IDS.has(entry.id)));

export const CLUB_CATALOG = Object.freeze([...CURRENT_2026_CLUBS, ...LEGACY_ONLY_CLUBS]);

export const LEGACY_CLUB_ID_MAP = Object.freeze({
  a1:'br-flamengo', a2:'br-palmeiras', a3:'br-botafogo', a4:'br-atletico-mg', a5:'br-corinthians',
  a6:'br-internacional', a7:'br-sao-paulo', a8:'br-fluminense', a9:'br-gremio', a10:'br-fortaleza',
  a11:'br-cruzeiro', a12:'br-santos', a13:'br-vasco-da-gama', a14:'br-athletico-pr', a15:'br-bahia',
  a16:'br-red-bull-bragantino', a17:'br-criciuma', a18:'br-juventude', a19:'br-cuiaba', a20:'br-atletico-go',
  b1:'br-sport', b2:'br-ceara', b3:'br-goias', b4:'br-coritiba', b5:'br-avai', b6:'br-paysandu',
  b7:'br-mirassol', b8:'br-operario-pr', b9:'br-guarani', b10:'br-ponte-preta', b11:'br-chapecoense',
  b12:'br-vila-nova', b13:'br-botafogo-sp', b14:'br-amazonas', b15:'br-crb', b16:'br-sampaio-correa',
  b17:'br-tombense', b18:'br-abc', b19:'br-ferroviaria', b20:'br-novorizontino',
  c1:'br-londrina', c2:'br-figueirense', c3:'br-csa', c4:'br-nautico', c5:'br-remo', c6:'br-brusque',
  c7:'br-botafogo-pb', c8:'br-ituano', c9:'br-athletic', c10:'br-ferroviario', c11:'br-volta-redonda',
  c12:'br-atletico-ac', c13:'br-floresta', c14:'br-sao-bernardo', c15:'br-confianca', c16:'br-maringa',
  c17:'br-caxias', c18:'br-campinense', c19:'br-aparecidense', c20:'br-manauara',
  d1:'br-dom-bosco', d2:'br-hercilio-luz', d3:'br-trem', d4:'br-gas', d5:'br-real-noroeste',
  d6:'br-tocantinopolis', d7:'br-pouso-alegre', d8:'br-sergipe', d9:'br-atletico-ms', d10:'br-porto-velho',
  d11:'br-treze', d12:'br-sousa', d13:'br-ceilandia', d14:'br-moto-club', d15:'br-genus', d16:'br-manaus',
  d17:'br-iguatu', d18:'br-nacional-am', d19:'br-humaita', d20:'br-placido-castro',
});

const BY_ID = new Map(CLUB_CATALOG.map((entry) => [entry.id, entry]));
const normalizeText = (value) => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const BY_NAME = new Map();
CLUB_CATALOG.forEach((entry) => {
  [entry.name, ...(entry.aliases || [])].forEach((name) => BY_NAME.set(normalizeText(name), entry));
});

export const SERIES_2026 = Object.freeze({
  A: Object.freeze(CURRENT_2026_CLUBS.filter((entry) => entry.serie2026 === 'A').map((entry) => entry.id)),
  B: Object.freeze(CURRENT_2026_CLUBS.filter((entry) => entry.serie2026 === 'B').map((entry) => entry.id)),
  C: Object.freeze(CURRENT_2026_CLUBS.filter((entry) => entry.serie2026 === 'C').map((entry) => entry.id)),
  D: Object.freeze(CURRENT_2026_CLUBS.filter((entry) => entry.serie2026 === 'D').map((entry) => entry.id)),
});

export function canonicalClubId(value) {
  if (value === null || value === undefined || value === '' || value === 'user') return value ?? null;
  const raw = String(value);
  if (BY_ID.has(raw)) return raw;
  return LEGACY_CLUB_ID_MAP[raw] || raw;
}

export function resolveClub(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    const byId = value.id != null ? BY_ID.get(canonicalClubId(value.id)) : null;
    if (byId) return byId;
    if (value.name) return BY_NAME.get(normalizeText(value.name)) || null;
    return null;
  }
  const id = canonicalClubId(value);
  return BY_ID.get(id) || BY_NAME.get(normalizeText(value)) || null;
}

export function canonicalClubName(value) {
  const resolved = resolveClub(value);
  return resolved?.name || (value == null ? value : String(value));
}

export function getSeriesTeams2026(serie) {
  return (SERIES_2026[String(serie || '').toUpperCase()] || []).map((id) => ({ ...BY_ID.get(id) }));
}

export function getPyramidSeriesTeams2026(serie) {
  const key = String(serie || '').toUpperCase();
  const ids = key === 'D' ? SERIE_D_2026_IDS : (SERIES_2026[key] || []);
  return ids.map((id) => ({ ...BY_ID.get(id) })).filter((entry) => entry?.id);
}

export function getCareerSelectableClubs2026() {
  return CURRENT_2026_CLUBS.map((entry) => ({ ...entry }));
}

export function normalizeClubEntity(entity = {}) {
  if (!entity || typeof entity !== 'object') return entity;
  const resolved = resolveClub(entity);
  if (!resolved) return entity;
  return { ...entity, id:resolved.id, name:resolved.name };
}

export function getClubCatalogEntry(value) {
  const resolved = resolveClub(value);
  return resolved ? { ...resolved } : null;
}

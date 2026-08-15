// @migrated to ES module
// database_branding.js — Logos reais e estádios dos times
// ─────────────────────────────────────────────────────────────────────────────
// ESTRUTURA DE CADA TIME:
//   logo   : URL de imagem (PNG/SVG). Deixe null para usar o escudo SVG gerado.
import React from 'react';
import { teamBranding } from './teamBranding.js';
//            Ex: logo: 'https://upload.wikimedia.org/...flamengo.svg'
//   stadium: Nome oficial do estádio
//   city   : Cidade sede
//   capacity: Capacidade oficial
//
// Para adicionar logos reais basta preencher o campo `logo` com a URL pública.
// O TeamIcon usa automaticamente a imagem se disponível, senão gera o escudo SVG.
// ─────────────────────────────────────────────────────────────────────────────

export const teamBrandingExtra = {

  // ══ SÉRIE A ══════════════════════════════════════════════════════════════════
  "Flamengo":      { logo: null, stadium: "Maracanã",              city: "Rio de Janeiro", capacity: 78838 },
  "Palmeiras":     { logo: null, stadium: "Allianz Parque",        city: "São Paulo",      capacity: 43713 },
  "Botafogo":      { logo: null, stadium: "Nilton Santos",         city: "Rio de Janeiro", capacity: 46000 },
  "Atlético MG":   { logo: null, stadium: "Arena MRV",             city: "Belo Horizonte", capacity: 45000 },
  "Corinthians":   { logo: null, stadium: "Neo Química Arena",     city: "São Paulo",      capacity: 49205 },
  "Internacional": { logo: null, stadium: "Beira-Rio",             city: "Porto Alegre",   capacity: 50128 },
  "São Paulo":     { logo: null, stadium: "MorumBIS",              city: "São Paulo",      capacity: 72000 },
  "Fluminense":    { logo: null, stadium: "Maracanã",              city: "Rio de Janeiro", capacity: 78838 },
  "Grêmio":        { logo: null, stadium: "Arena do Grêmio",       city: "Porto Alegre",   capacity: 55000 },
  "Fortaleza":     { logo: null, stadium: "Castelão",              city: "Fortaleza",      capacity: 63903 },
  "Cruzeiro":      { logo: null, stadium: "Mineirão",              city: "Belo Horizonte", capacity: 61846 },
  "Santos":        { logo: null, stadium: "Vila Belmiro",          city: "Santos",         capacity: 16798 },
  "Vasco":         { logo: null, stadium: "São Januário",          city: "Rio de Janeiro", capacity: 21880 },
  "Athletico PR":  { logo: null, stadium: "Ligga Arena",           city: "Curitiba",       capacity: 42372 },
  "Bahia":         { logo: null, stadium: "Arena Fonte Nova",      city: "Salvador",       capacity: 47907 },
  "Bragantino":    { logo: null, stadium: "Nabi Abi Chedid",       city: "Bragança Paulista", capacity: 19000 },
  "Criciúma":      { logo: null, stadium: "Heriberto Hülse",       city: "Criciúma",       capacity: 19300 },
  "Juventude":     { logo: null, stadium: "Alfredo Jaconi",        city: "Caxias do Sul",  capacity: 19908 },
  "Cuiabá":        { logo: null, stadium: "Arena Pantanal",        city: "Cuiabá",         capacity: 42968 },
  "Atlético GO":   { logo: null, stadium: "Serra Dourada",         city: "Goiânia",        capacity: 18000 },

  // ══ SÉRIE B ══════════════════════════════════════════════════════════════════
  "Sport":         { logo: null, stadium: "Arena Pernambuco",      city: "Recife",         capacity: 46154 },
  "Ceará":         { logo: null, stadium: "Castelão",              city: "Fortaleza",      capacity: 63903 },
  "Goiás":         { logo: null, stadium: "Serrinha",              city: "Goiânia",        capacity: 12500 },
  "Coritiba":      { logo: null, stadium: "Couto Pereira",         city: "Curitiba",       capacity: 41456 },
  "Avaí":          { logo: null, stadium: "Ressacada",             city: "Florianópolis",  capacity: 19300 },
  "Paysandu":      { logo: null, stadium: "Curuzu",                city: "Belém",          capacity: 16200 },
  "Mirassol":      { logo: null, stadium: "José Maria de Campos Maia", city: "Mirassol",  capacity: 16000 },
  "Operário PR":   { logo: null, stadium: "Germano Kruger",        city: "Ponta Grossa",   capacity: 14700 },
  "Guarani":       { logo: null, stadium: "Brinco de Ouro",        city: "Campinas",       capacity: 31427 },
  "Ponte Preta":   { logo: null, stadium: "Moisés Lucarelli",      city: "Campinas",       capacity: 19000 },
  "Chapecoense":   { logo: null, stadium: "Arena Condá",           city: "Chapecó",        capacity: 22600 },
  "Vila Nova":     { logo: null, stadium: "OBA",                   city: "Goiânia",        capacity: 12600 },
  "Botafogo SP":   { logo: null, stadium: "Santa Cruz",            city: "Ribeirão Preto", capacity: 21500 },
  "Amazonas":      { logo: null, stadium: "Arena da Amazônia",     city: "Manaus",         capacity: 43988 },
  "CRB":           { logo: null, stadium: "Rei Pelé",              city: "Maceió",         capacity: 19300 },
  "Sampaio Corrêa":{ logo: null, stadium: "Castelão MA",           city: "São Luís",       capacity: 50000 },
  "Tombense":      { logo: null, stadium: "Antônio Guimarães",     city: "Tombos",         capacity: 7000  },
  "ABC":           { logo: null, stadium: "Frasqueirão",           city: "Natal",          capacity: 25000 },
  "Ferroviária":   { logo: null, stadium: "Estádio Fonte Luminosa",city: "Araraquara",     capacity: 18000 },
  "Novorizontino": { logo: null, stadium: "Jorge Ismael de Biasi", city: "Novo Horizonte", capacity: 15000 },

  // ══ SÉRIE C ══════════════════════════════════════════════════════════════════
  "Londrina":      { logo: null, stadium: "Estádio do Café",       city: "Londrina",       capacity: 36000 },
  "Figueirense":   { logo: null, stadium: "Orlando Scarpelli",     city: "Florianópolis",  capacity: 19600 },
  "CSA":           { logo: null, stadium: "Rei Pelé",              city: "Maceió",         capacity: 19300 },
  "Náutico":       { logo: null, stadium: "Aflitos",               city: "Recife",         capacity: 11500 },
  "Remo":          { logo: null, stadium: "Baenão",                city: "Belém",          capacity: 16600 },
  "Brusque":       { logo: null, stadium: "Augusto Bauer",         city: "Brusque",        capacity: 8000  },
  "Botafogo PB":   { logo: null, stadium: "Almeidão",              city: "João Pessoa",    capacity: 28400 },
  "Ituano":        { logo: null, stadium: "Novelli Júnior",        city: "Itu",            capacity: 12000 },
  "Athletic Club": { logo: null, stadium: "Estádio Elmo Serejo",   city: "São João del Rei", capacity: 8000 },
  "Ferroviário":   { logo: null, stadium: "Elzir Cabral",          city: "Fortaleza",      capacity: 11500 },
  "Volta Redonda": { logo: null, stadium: "Raulino de Oliveira",   city: "Volta Redonda",  capacity: 21000 },
  "Atlético AC":   { logo: null, stadium: "Arena da Floresta",     city: "Rio Branco",     capacity: 10000 },
  "Floresta":      { logo: null, stadium: "Domingão",              city: "Horizonte",      capacity: 9000  },
  "São Bernardo":  { logo: null, stadium: "Primeiro de Maio",      city: "São Bernardo",   capacity: 15000 },
  "Confiança":     { logo: null, stadium: "Batistão",              city: "Aracaju",        capacity: 15000 },
  "Maringá":       { logo: null, stadium: "Willie Davids",         city: "Maringá",        capacity: 11000 },
  "Caxias":        { logo: null, stadium: "Centenário",            city: "Caxias do Sul",  capacity: 22000 },
  "Campinense":    { logo: null, stadium: "Amigão",                city: "Campina Grande", capacity: 19000 },
  "Aparecidense":  { logo: null, stadium: "Aníbal Toledo",         city: "Aparecida de Goiânia", capacity: 5000 },
  "Náutico AM":    { logo: null, stadium: "Carlos Zamith",         city: "Manaus",         capacity: 10000 },

  // ══ SÉRIE D ══════════════════════════════════════════════════════════════════
  "Dom Bosco":     { logo: null, stadium: "Estádio Dom Bosco",     city: "Cuiabá",         capacity: 6000  },
  "Hercílio Luz":  { logo: null, stadium: "Estádio Hercílio Luz",  city: "Tubarão",        capacity: 8000  },
  "Trem":          { logo: null, stadium: "Zerão",                 city: "Macapá",         capacity: 10000 },
  "GAS Rolim":     { logo: null, stadium: "Aluízio Ferreira",      city: "Rolim de Moura", capacity: 5000  },
  "Real Noroeste": { logo: null, stadium: "Odilon Helmer",         city: "Água Boa",       capacity: 4000  },
  "Tocantinópolis":{ logo: null, stadium: "Ribeirão",              city: "Tocantinópolis", capacity: 4000  },
  "Pouso Alegre":  { logo: null, stadium: "Manduzão",              city: "Pouso Alegre",   capacity: 10000 },
  "Sergipe":       { logo: null, stadium: "Lourival Batista",      city: "Aracaju",        capacity: 14000 },
  "Atlético MS":   { logo: null, stadium: "Douradão",              city: "Dourados",       capacity: 5000  },
  "Porto Velho":   { logo: null, stadium: "Aluízio Ferreira PV",   city: "Porto Velho",    capacity: 5000  },
  "Treze":         { logo: null, stadium: "Presidente Vargas",     city: "Campina Grande", capacity: 12000 },
  "Souza":         { logo: null, stadium: "Marizão",               city: "Souza",          capacity: 8000  },
  "Ceilandia":     { logo: null, stadium: "Abadião",               city: "Ceilândia",      capacity: 10000 },
  "Moto Club":     { logo: null, stadium: "Castelão MA",           city: "São Luís",       capacity: 12000 },
  "Genus":         { logo: null, stadium: "Bezerrão",              city: "Gama",           capacity: 12000 },
  "Manaus":        { logo: null, stadium: "Arena da Amazônia",     city: "Manaus",         capacity: 43988 },
  "Iguatu":        { logo: null, stadium: "Estádio Morenão",       city: "Iguatu",         capacity: 6000  },
  "Nacional AM":   { logo: null, stadium: "Carlos Zamith",         city: "Manaus",         capacity: 10000 },
  "Humaitá":       { logo: null, stadium: "João Saldanha",         city: "Humaitá",        capacity: 3000  },
  "Plácido Castro":{ logo: null, stadium: "Florestão",             city: "Rio Branco",     capacity: 5000  },
};

// ── Estádios disponíveis para time criado na Série D ──────────────────────────
// O jogador pode escolher um nome para seu estádio entre os nomes reais abaixo,
// ou digitar um nome personalizado.
export const stadiumNameSuggestions = [
  // Nomes genéricos / clássicos do futebol brasileiro
  "Arena Central",       "Estádio Municipal",    "Arena do Povo",
  "Complexo Esportivo",  "Estádio Olímpico",     "Arena da Cidade",
  "Estádio Metropolitano","Arena do Norte",       "Estádio Nacional",
  "Arena Sul-Americana", "Estádio da Vila",      "Arena Esportiva",
  // Nomes com referência geográfica (personalizáveis)
  "Arena Nordeste",      "Estádio da Fronteira", "Arena do Cerrado",
  "Estádio Amazônia",    "Arena Pantaneira",     "Estádio do Vale",
  "Arena Litoral",       "Estádio Planalto",     "Arena do Interior",
  // Nomes honoríficos clássicos
  "Estádio João Pessoa", "Arena Carlos Magno",   "Estádio Pedro Álvares",
  "Arena Tiradentes",    "Estádio Santos Dumont","Arena Zumbi",
];

// ── Helper: retorna branding completo (cores + logo + estádio) ────────────────
export const getTeamBrandingFull = (name) => {
  const base  = teamBranding?.[name] || { primary: '#555', secondary: '#FFF', emoji: '⚽' };
  const extra = teamBrandingExtra?.[name] || {};
  return { ...base, ...extra };
};

// ── TeamIcon atualizado: usa logo real se disponível ──────────────────────────
export const TeamIcon = ({ name, size = 40 }) => {
  const brand = getTeamBrandingFull(name);

  // Se tiver logo real (URL), renderizar como <img>
  if (brand.logo) {
    return React.createElement('img', {
      src:   brand.logo,
      alt:   name,
      width: size,
      height: size,
      style: { objectFit: 'contain', flexShrink: 0, borderRadius: 4 },
      onError: (e) => { e.target.style.display = 'none'; },
    });
  }

  // Fallback: escudo SVG gerado com as cores do clube
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase().substring(0, 2);
  return React.createElement('svg', {
    width: size, height: size,
    viewBox: '0 0 40 40',
    style: { flexShrink: 0 },
  },
    React.createElement('path', {
      d: 'M20 2 L36 8 L36 22 Q36 32 20 38 Q4 32 4 22 L4 8 Z',
      fill: brand.primary,
      stroke: 'rgba(255,255,255,0.25)',
      strokeWidth: '1',
    }),
    brand.secondary !== '#FFFFFF' && brand.secondary !== brand.primary
      ? React.createElement('path', {
          d: 'M20 2 L36 8 L36 22 Q36 32 20 38 Z',
          fill: brand.secondary,
          opacity: '0.6',
        })
      : null,
    React.createElement('text', {
      x: '20', y: '23',
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      fontSize: initials.length > 1 ? '11' : '14',
      fontWeight: '900',
      fill: '#FFFFFF',
      fontFamily: 'Nunito, sans-serif',
    }, initials)
  );
};
TeamIcon.displayName = 'TeamIcon';

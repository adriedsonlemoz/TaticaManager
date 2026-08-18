import { appendFinancialEntry } from './financeLedger.js';

export const MASTER_POOL = Object.freeze({
  A: [
    { name: 'PixBet', color: '#16a34a', lf: 1.15, rf: 1.30 }, { name: 'Betano', color: '#00a859', lf: 1.10, rf: 1.20 },
    { name: 'Banco BMG', color: '#ff6600', lf: 1.00, rf: 1.00 }, { name: 'Mercado Livre', color: '#f5a623', lf: 1.05, rf: 1.10 },
    { name: 'Itaú', color: '#003d8f', lf: 1.20, rf: 1.40 }, { name: 'Bradesco', color: '#cc0000', lf: 1.18, rf: 1.35 },
    { name: 'Caixa', color: '#005b9a', lf: 1.08, rf: 1.15 }, { name: 'Claro', color: '#e4003a', lf: 1.02, rf: 1.05 },
    { name: 'Vivo', color: '#660099', lf: 0.98, rf: 1.00 }, { name: 'Ambev', color: '#f7b500', lf: 1.12, rf: 1.25 },
    { name: 'Petrobras', color: '#009b3a', lf: 1.10, rf: 1.20 }, { name: 'Vale', color: '#005ca9', lf: 1.05, rf: 1.10 },
  ],
  B: [
    { name: 'Betnacional', color: '#f97316', lf: 1.10, rf: 1.20 }, { name: 'Esportes da Sorte', color: '#16a34a', lf: 1.05, rf: 1.10 },
    { name: 'Estrela Bet', color: '#f59e0b', lf: 0.95, rf: 1.00 }, { name: 'Banco do Brasil', color: '#f7b500', lf: 1.20, rf: 1.30 },
    { name: 'Sicredi', color: '#006400', lf: 1.00, rf: 1.05 }, { name: 'Tim', color: '#003087', lf: 0.90, rf: 0.95 },
    { name: 'Oi', color: '#7b2d8b', lf: 0.85, rf: 0.90 }, { name: 'OdontoGroup', color: '#0e7490', lf: 1.02, rf: 1.08 },
  ],
  C: [
    { name: 'BetFair', color: '#f97316', lf: 1.10, rf: 1.15 }, { name: 'VarBet', color: '#16a34a', lf: 0.95, rf: 1.00 },
    { name: 'Coop', color: '#006400', lf: 1.05, rf: 1.10 }, { name: 'Sicredi', color: '#006400', lf: 1.00, rf: 1.05 },
    { name: 'Planium', color: '#0e7490', lf: 0.90, rf: 0.95 }, { name: "Rede D'Or", color: '#cc0000', lf: 1.02, rf: 1.08 },
  ],
  D: [
    { name: 'SuperBet', color: '#f59e0b', lf: 1.10, rf: 1.15 }, { name: 'LotoFácil', color: '#16a34a', lf: 1.00, rf: 1.05 },
    { name: 'Unimed Local', color: '#006400', lf: 0.95, rf: 1.00 }, { name: 'Sicoob', color: '#003087', lf: 1.05, rf: 1.08 },
    { name: 'FarmaTotal', color: '#e4003a', lf: 0.90, rf: 0.95 }, { name: 'BetRegional', color: '#7b2d8b', lf: 0.85, rf: 0.90 },
  ],
});

export const STADIUM_POOL = Object.freeze({
  A: [
    { name: 'Allianz', color: '#0038a8', lf: 0.75, rf: 0.80 }, { name: 'Neo Química', color: '#0d4aab', lf: 0.80, rf: 0.85 },
    { name: 'Ligga', color: '#941818', lf: 0.85, rf: 0.90 }, { name: 'MRV', color: '#e4003a', lf: 0.70, rf: 0.75 },
    { name: 'BRB', color: '#003087', lf: 0.78, rf: 0.82 }, { name: 'Minha Casa', color: '#f7b500', lf: 0.72, rf: 0.78 },
  ],
  B: [
    { name: 'VaideBet', color: '#941818', lf: 0.75, rf: 0.80 }, { name: 'CondoBet', color: '#16a34a', lf: 0.70, rf: 0.75 },
    { name: 'Paraná Bet', color: '#003087', lf: 0.80, rf: 0.85 }, { name: 'Nordeste Play', color: '#f97316', lf: 0.72, rf: 0.78 },
  ],
  C: [
    { name: 'Arena Bet', color: '#f97316', lf: 0.70, rf: 0.75 }, { name: 'TotoArena', color: '#16a34a', lf: 0.75, rf: 0.80 },
    { name: 'GolArena', color: '#0038a8', lf: 0.65, rf: 0.72 },
  ],
  D: [
    { name: 'EstádioPlus', color: '#6b7280', lf: 0.70, rf: 0.75 }, { name: 'ArenaLocal', color: '#374151', lf: 0.65, rf: 0.70 },
    { name: 'CampoBet', color: '#16a34a', lf: 0.75, rf: 0.80 },
  ],
});

const BASE_SIGNING = Object.freeze({ A: 30_000_000, B: 3_000_000, C: 500_000, D: 100_000 });
const BASE_ROUND = Object.freeze({ A: 800_000, B: 100_000, C: 20_000, D: 10_000 });

function shuffled(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOffers(pool, serie, strength, count = 3, rng = Math.random) {
  const safeSerie = pool[serie] ? serie : 'D';
  const mult = (Number(strength) || 70) / 70;
  return shuffled(pool[safeSerie], rng).slice(0, count).map((partner) => ({
    name: partner.name,
    val: Math.max(0, Math.floor(BASE_SIGNING[safeSerie] * mult * partner.lf / 50_000) * 50_000),
    roundVal: Math.max(10_000, Math.floor(BASE_ROUND[safeSerie] * mult * partner.rf / 1_000) * 1_000),
    color: partner.color,
  }));
}

export function generateSponsorOffers(gameData = {}, rng = Math.random) {
  const serie = gameData.serie || 'A';
  const strength = gameData.club?.strength || 70;
  return {
    master: buildOffers(MASTER_POOL, serie, strength, 3, rng),
    stadium: buildOffers(STADIUM_POOL, serie, strength, 3, rng),
  };
}

export function canSignSponsor(state = {}, type, offer) {
  if (!state.club || !offer || !['master', 'stadium'].includes(type)) return { ok: false, reason: 'Contrato inválido.' };
  if (state.club?.sponsors?.[type]) return { ok: false, reason: 'Este espaço comercial já possui contrato ativo.' };
  if (!Number.isFinite(Number(offer.val)) || Number(offer.val) < 0 || !Number.isFinite(Number(offer.roundVal)) || Number(offer.roundVal) < 0) {
    return { ok: false, reason: 'Valores do contrato são inválidos.' };
  }
  return { ok: true, reason: null };
}

export function applySponsorContract(state, type, offer) {
  const validation = canSignSponsor(state, type, offer);
  if (!validation.ok) return state;
  const signing = Math.round(Number(offer.val) || 0);
  const transaction = {
    income: signing,
    expense: 0,
    total: signing,
    competition: 'commercial',
    detail: {
      description: `Luvas: Patrocínio ${type === 'master' ? 'Máster' : 'Estádio'} (${offer.name})`,
      sponsorSigning: signing,
    },
  };
  return {
    ...state,
    club: {
      ...state.club,
      money: (Number(state.club.money) || 0) + signing,
      sponsors: {
        ...(state.club.sponsors || {}),
        [type]: {
          name: offer.name,
          value: signing,
          roundValue: Math.round(Number(offer.roundVal) || 0),
          signedRound: state.round,
          signedLeagueRound: state.leagueRound ?? state.round,
          signedSeason: state.season,
          color: offer.color,
        },
      },
    },
    financialHistory: appendFinancialEntry(state.financialHistory, transaction, {
      season: state.season,
      round: state.round,
      leagueRound: state.leagueRound ?? state.round,
      competition: 'commercial',
    }),
  };
}

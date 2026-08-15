import { FinanceEngine } from '../engine_finances.js';

const MASTER_POOL = {
  A: [
    { name: 'PixBet', color: '#16a34a', lf: 1.15, rf: 1.30 },
    { name: 'Betano', color: '#00a859', lf: 1.10, rf: 1.20 },
    { name: 'Banco BMG', color: '#ff6600', lf: 1.00, rf: 1.00 },
    { name: 'Mercado Livre', color: '#f5a623', lf: 1.05, rf: 1.10 },
    { name: 'Itaú', color: '#003d8f', lf: 1.20, rf: 1.40 },
    { name: 'Bradesco', color: '#cc0000', lf: 1.18, rf: 1.35 },
    { name: 'Caixa', color: '#005b9a', lf: 1.08, rf: 1.15 },
    { name: 'Claro', color: '#e4003a', lf: 1.02, rf: 1.05 },
    { name: 'Vivo', color: '#660099', lf: 0.98, rf: 1.00 },
    { name: 'Ambev', color: '#f7b500', lf: 1.12, rf: 1.25 },
    { name: 'Petrobras', color: '#009b3a', lf: 1.10, rf: 1.20 },
    { name: 'Vale', color: '#005ca9', lf: 1.05, rf: 1.10 },
  ],
  B: [
    { name: 'Betnacional', color: '#f97316', lf: 1.10, rf: 1.20 },
    { name: 'Esportes da Sorte', color: '#16a34a', lf: 1.05, rf: 1.10 },
    { name: 'Estrela Bet', color: '#f59e0b', lf: 0.95, rf: 1.00 },
    { name: 'Banco do Brasil', color: '#f7b500', lf: 1.20, rf: 1.30 },
    { name: 'Sicredi', color: '#006400', lf: 1.00, rf: 1.05 },
    { name: 'Tim', color: '#003087', lf: 0.90, rf: 0.95 },
    { name: 'Oi', color: '#7b2d8b', lf: 0.85, rf: 0.90 },
    { name: 'OdontoGroup', color: '#0e7490', lf: 1.02, rf: 1.08 },
  ],
  C: [
    { name: 'BetFair', color: '#f97316', lf: 1.10, rf: 1.15 },
    { name: 'VarBet', color: '#16a34a', lf: 0.95, rf: 1.00 },
    { name: 'Coop', color: '#006400', lf: 1.05, rf: 1.10 },
    { name: 'Sicredi', color: '#006400', lf: 1.00, rf: 1.05 },
    { name: 'Planium', color: '#0e7490', lf: 0.90, rf: 0.95 },
    { name: "Rede D'Or", color: '#cc0000', lf: 1.02, rf: 1.08 },
  ],
  D: [
    { name: 'SuperBet', color: '#f59e0b', lf: 1.10, rf: 1.15 },
    { name: 'LotoFácil', color: '#16a34a', lf: 1.00, rf: 1.05 },
    { name: 'Unimed Local', color: '#006400', lf: 0.95, rf: 1.00 },
    { name: 'Sicoob', color: '#003087', lf: 1.05, rf: 1.08 },
    { name: 'FarmaTotal', color: '#e4003a', lf: 0.90, rf: 0.95 },
    { name: 'BetRegional', color: '#7b2d8b', lf: 0.85, rf: 0.90 },
  ],
};

const STADIUM_POOL = {
  A: [
    { name: 'Allianz', color: '#0038a8', lf: 0.75, rf: 0.80 },
    { name: 'Neo Química', color: '#0d4aab', lf: 0.80, rf: 0.85 },
    { name: 'Ligga', color: '#941818', lf: 0.85, rf: 0.90 },
    { name: 'MRV', color: '#e4003a', lf: 0.70, rf: 0.75 },
    { name: 'BRB', color: '#003087', lf: 0.78, rf: 0.82 },
    { name: 'Minha Casa', color: '#f7b500', lf: 0.72, rf: 0.78 },
  ],
  B: [
    { name: 'VaideBet', color: '#941818', lf: 0.75, rf: 0.80 },
    { name: 'CondoBet', color: '#16a34a', lf: 0.70, rf: 0.75 },
    { name: 'Paraná Bet', color: '#003087', lf: 0.80, rf: 0.85 },
    { name: 'Nordeste Play', color: '#f97316', lf: 0.72, rf: 0.78 },
  ],
  C: [
    { name: 'Arena Bet', color: '#f97316', lf: 0.70, rf: 0.75 },
    { name: 'TotoArena', color: '#16a34a', lf: 0.75, rf: 0.80 },
    { name: 'GolArena', color: '#0038a8', lf: 0.65, rf: 0.72 },
  ],
  D: [
    { name: 'EstádioPlus', color: '#6b7280', lf: 0.70, rf: 0.75 },
    { name: 'ArenaLocal', color: '#374151', lf: 0.65, rf: 0.70 },
    { name: 'CampoBet', color: '#16a34a', lf: 0.75, rf: 0.80 },
  ],
};

const BASE_SIGNING = { A: 30_000_000, B: 3_000_000, C: 500_000, D: 100_000 };
const BASE_ROUND = { A: 800_000, B: 100_000, C: 20_000, D: 10_000 };

const historyIncome = (entry) => {
  if (typeof entry?.income === 'number') return entry.income;
  return entry?.isPositive === true ? entry?.value || 0 : 0;
};
const historyExpense = (entry) => {
  if (typeof entry?.expense === 'number') return entry.expense;
  return entry?.isPositive === false ? entry?.value || 0 : 0;
};

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOffers(pool, serie, strength, count = 3) {
  const safeSerie = pool[serie] ? serie : 'D';
  const mult = (strength || 70) / 70;
  const signingBase = BASE_SIGNING[safeSerie] || BASE_SIGNING.D;
  const roundBase = BASE_ROUND[safeSerie] || BASE_ROUND.D;

  return shuffled(pool[safeSerie]).slice(0, count).map((partner) => ({
    name: partner.name,
    val: Math.floor(signingBase * mult * partner.lf / 50_000) * 50_000,
    roundVal: Math.max(10_000, Math.floor(roundBase * mult * partner.rf / 1_000) * 1_000),
    color: partner.color,
  }));
}

export function generateSponsorOffers(gameData) {
  const serie = gameData?.serie || 'A';
  const strength = gameData?.club?.strength || 70;
  return {
    master: buildOffers(MASTER_POOL, serie, strength),
    stadium: buildOffers(STADIUM_POOL, serie, strength),
  };
}

export function applySponsorContract(state, type, offer) {
  if (!state?.club || !offer || !['master', 'stadium'].includes(type)) return state;
  const transaction = {
    round: state.round,
    income: offer.val,
    expense: 0,
    total: offer.val,
    detail: {
      description: `Luvas: Patrocínio ${type === 'master' ? 'Máster' : 'Estádio'} (${offer.name})`,
      sponsor: offer.val,
    },
  };
  return {
    ...state,
    club: {
      ...state.club,
      money: (state.club.money || 0) + offer.val,
      sponsors: {
        ...(state.club.sponsors || {}),
        [type]: {
          name: offer.name,
          value: offer.val,
          roundValue: offer.roundVal,
          signedRound: state.round,
          color: offer.color,
        },
      },
    },
    financialHistory: [transaction, ...(state.financialHistory || [])].slice(0, 100),
  };
}

export function summarizeFinancialHistory(history = []) {
  const totals = {
    transfersIn: 0,
    transfersOut: 0,
    training: 0,
    stadium: 0,
    market: 0,
    ticket: 0,
    tv: 0,
    sponsor: 0,
    cup: 0,
    wage: 0,
    opCost: 0,
    income: 0,
    expense: 0,
    net: 0,
  };

  history.forEach((entry) => {
    const income = historyIncome(entry);
    const expense = historyExpense(entry);
    totals.income += income;
    totals.expense += expense;

    const detail = entry?.detail;
    const desc = detail?.description || entry?.description || '';
    if (detail) {
      totals.ticket += detail.ticket || 0;
      totals.tv += detail.tv || 0;
      totals.sponsor += detail.sponsor || 0;
      totals.cup += detail.cup || 0;
      totals.wage += detail.wage || 0;
      totals.opCost += detail.opCost || 0;
    }

    if (desc.includes('Venda:') || desc.includes('Venda →') || (!detail && desc.includes('Venda'))) {
      totals.transfersIn += income || entry?.value || 0;
    } else if (!detail && desc.includes('Patrocínio')) {
      totals.sponsor += income || entry?.value || 0;
    } else if (!detail && (desc.includes('Copa') || desc.includes('Libertadores') || desc.includes('Sul-Americana'))) {
      totals.cup += income || entry?.value || 0;
    } else if (desc.includes('Compra:') || (!detail && desc.includes('Compra'))) {
      totals.transfersOut += expense || Math.abs(entry?.total || entry?.value || 0);
    } else if (desc.includes('Treinamento')) {
      totals.training += expense;
    } else if (desc.includes('Estádio') || desc.includes('Obras')) {
      totals.stadium += expense;
    } else if (desc.includes('Mercado')) {
      totals.market += expense;
    } else if (!detail && entry?.isPositive !== true) {
      totals.wage += expense || entry?.value || 0;
    } else if (detail && !detail.wage && !detail.opCost && !desc && expense > 0) {
      totals.wage += expense;
    }
  });

  totals.net = totals.income - totals.expense;
  return totals;
}

export function getAverageTicketIncome(history = []) {
  const entries = history.filter((entry) => (entry?.detail?.ticket || 0) > 0);
  if (!entries.length) return null;
  return Math.round(entries.reduce((sum, entry) => sum + (entry.detail.ticket || 0), 0) / entries.length);
}

export function buildFinanceOverview(gameData) {
  const history = gameData?.financialHistory || [];
  const sponsors = gameData?.club?.sponsors || { master: null, stadium: null };
  const computedWage = (gameData?.players || []).reduce((sum, player) => sum + (player.wage || 0), 0);
  const totalWage = gameData?.club?.wage || computedWage;
  const sponsorIncomePerRound = (sponsors.master?.roundValue || 0) + (sponsors.stadium?.roundValue || 0);
  const stadium = gameData?.club?.stadium || { capacity: 15_000, ticketPrice: 40 };
  const avgRealTicket = getAverageTicketIncome(history);
  const fallbackTicket = (stadium.ticketPrice || 40) * Math.floor((stadium.capacity || 15_000) * 0.75);
  const ticketIncome = avgRealTicket ?? fallbackTicket;
  const totalRounds = gameData?.fixtures?.length || 38;
  const nextRound = Math.min((gameData?.round || 0) + 1, totalRounds);
  const tvIncome = FinanceEngine.getTVRights(gameData?.serie || 'D', nextRound, totalRounds);
  const recurringOpCost = Math.round(FinanceEngine.getOperationalCosts(gameData || {}) / 4);
  const totalIncome = tvIncome + sponsorIncomePerRound + ticketIncome;
  const totalExpense = totalWage + recurringOpCost;

  return {
    sponsors,
    history,
    totalWage,
    sponsorIncomePerRound,
    tvIncome,
    ticketIncome,
    avgRealTicket,
    recurringOpCost,
    totalIncome,
    totalExpense,
    estimatedBalance: totalIncome - totalExpense,
    status: FinanceEngine.getFinancialStatus(gameData || {}),
    summary: summarizeFinancialHistory(history),
  };
}

export function getFinancialSuggestions(gameData, overview = buildFinanceOverview(gameData)) {
  const suggestions = [];
  const { status, sponsors, totalIncome, totalWage, recurringOpCost, estimatedBalance } = overview;

  if (status?.status === 'critico') {
    suggestions.push(`Caixa crítico: o saldo cobre cerca de ${status.runway} rodada${status.runway === 1 ? '' : 's'} de despesas recorrentes.`);
  } else if (status?.status === 'alerta') {
    suggestions.push(`Atenção ao caixa: há fôlego para aproximadamente ${status.runway} rodadas de despesas recorrentes.`);
  }

  if (!sponsors.master || !sponsors.stadium) {
    suggestions.push('Há espaço comercial sem contrato. Um novo patrocínio pode aumentar a receita fixa por rodada.');
  }

  const recurringExpense = totalWage + recurringOpCost;
  if (totalIncome > 0 && recurringExpense / totalIncome > 0.85) {
    suggestions.push('A folha e os custos fixos estão pesados para a receita estimada. Evite aumentar salários sem nova receita.');
  }

  if (estimatedBalance < 0) {
    suggestions.push('O fluxo estimado por rodada está negativo. Priorize vendas, patrocínios ou redução de custos.');
  } else if (!suggestions.length) {
    suggestions.push('Situação financeira estável. Bom trabalho mantendo receitas e despesas equilibradas.');
  }

  return suggestions.slice(0, 3);
}

export function getSuggestionSeverity(message = '') {
  const text = message.toLowerCase();
  if (text.includes('crítico') || text.includes('negativo')) return 'error';
  if (text.includes('atenção') || text.includes('pesad')) return 'warning';
  if (text.includes('estável') || text.includes('bom trabalho')) return 'success';
  return 'info';
}

export function parseFinancialEntry(entry, formatMoney = (value) => String(value)) {
  const isModern = entry?.detail !== undefined || entry?.income !== undefined || entry?.expense !== undefined;
  let description = '';
  let value = 0;
  let positive = true;
  let icon = '💰';

  if (isModern) {
    const detail = entry?.detail || {};
    const desc = detail.description || '';
    const income = entry?.income || 0;
    const expense = entry?.expense || 0;
    value = entry?.total ?? (income - expense);
    positive = value >= 0;
    description = desc || (income > 0 ? `Receita · Rodada ${entry?.round || '?'}` : `Despesa · Rodada ${entry?.round || '?'}`);

    if (desc.includes('Venda')) icon = '🤝';
    else if (desc.includes('Compra')) icon = '🛒';
    else if (desc.includes('Patrocínio') || desc.includes('Luvas')) icon = '✍️';
    else if (desc.includes('Treinamento')) icon = '🏋️';
    else if (desc.includes('Estádio') || desc.includes('Obras')) icon = '🏟️';
    else if (desc.includes('Mercado')) icon = '🔄';
    else if (desc.includes('Copa') || desc.includes('Libertadores') || desc.includes('Sul-Americana')) icon = '🏆';
    else if (income > 0 && (detail.ticket || detail.tv || detail.sponsor || detail.cup)) icon = '📅';

    if (!desc && income > 0) {
      const parts = [];
      if (detail.tv) parts.push(`TV: ${formatMoney(detail.tv)}`);
      if (detail.ticket) parts.push(`Bil.: ${formatMoney(detail.ticket)}`);
      if (detail.sponsor) parts.push(`Pat.: ${formatMoney(detail.sponsor)}`);
      if (detail.cup) parts.push(`Copa: ${formatMoney(detail.cup)}`);
      if (parts.length) description = `Fechamento Rod. ${entry?.round || '?'} · ${parts.join(' · ')}`;
    }
  } else {
    value = entry?.value || 0;
    positive = Boolean(entry?.isPositive);
    description = entry?.description || `Rodada ${entry?.round || '?'}`;
    if (description.includes('Venda')) icon = '🤝';
    else if (description.includes('Compra')) icon = '🛒';
    else if (description.includes('Patrocínio')) icon = '✍️';
    else if (description.includes('Treinamento')) icon = '🏋️';
    else if (description.includes('Estádio')) icon = '🏟️';
    else icon = '🔄';
  }

  return { description, value, positive, icon };
}

export function buildEvolutionEntries(history = []) {
  const chronological = [...history].reverse();
  const maxAbs = Math.max(
    ...chronological.map((entry) => Math.max(historyIncome(entry), historyExpense(entry), Math.abs(entry?.value || 0))),
    1,
  );
  return {
    chronological,
    maxAbs,
    chart: chronological.slice(-30).map((entry, index) => ({
      round: entry?.round || index + 1,
      income: historyIncome(entry),
      expense: historyExpense(entry),
    })),
  };
}

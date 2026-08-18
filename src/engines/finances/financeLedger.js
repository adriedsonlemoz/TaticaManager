import { FINANCIAL_HISTORY_LIMIT, number } from './financeConfig.js';

export const historyIncome = (entry) => {
  if (typeof entry?.income === 'number') return Math.max(0, entry.income);
  return entry?.isPositive === true ? Math.max(0, number(entry?.value)) : 0;
};

export const historyExpense = (entry) => {
  if (typeof entry?.expense === 'number') return Math.max(0, entry.expense);
  return entry?.isPositive === false ? Math.max(0, number(entry?.value)) : 0;
};

export function stampFinancialEntry(entry = {}, context = {}) {
  return {
    ...entry,
    ...(entry.season == null && context.season != null ? { season: context.season } : {}),
    ...(entry.round == null && context.round != null ? { round: context.round } : {}),
    ...(entry.leagueRound == null && context.leagueRound != null ? { leagueRound: context.leagueRound } : {}),
    ...(entry.competition == null && context.competition ? { competition: context.competition } : {}),
  };
}

export function appendFinancialEntry(history = [], entry = {}, context = {}, limit = FINANCIAL_HISTORY_LIMIT) {
  return [stampFinancialEntry(entry, context), ...(history || [])].slice(0, limit);
}

export function tagLegacyFinancialHistory(history = [], season) {
  if (season == null) return [...(history || [])];
  return (history || []).map((entry) => (
    entry?.season == null ? { ...entry, season } : entry
  ));
}

export function getSeasonFinancialHistory(history = [], season) {
  const source = history || [];
  if (season == null || !source.some((entry) => entry?.season != null)) return source;
  return source.filter((entry) => entry?.season == null || Number(entry?.season) === Number(season));
}

const contains = (text, ...needles) => needles.some((needle) => text.includes(needle));

export function summarizeFinancialHistory(history = []) {
  const totals = {
    transfersIn: 0,
    transfersOut: 0,
    training: 0,
    academy: 0,
    medical: 0,
    contracts: 0,
    stadium: 0,
    market: 0,
    ticket: 0,
    tv: 0,
    sponsor: 0,
    sponsorRecurring: 0,
    sponsorSigning: 0,
    cup: 0,
    wage: 0,
    opCost: 0,
    otherIncome: 0,
    otherExpense: 0,
    income: 0,
    expense: 0,
    net: 0,
  };

  history.forEach((entry) => {
    const income = historyIncome(entry);
    const expense = historyExpense(entry);
    const detail = entry?.detail || {};
    const desc = String(detail.description || entry?.description || '');
    const lower = desc.toLowerCase();
    totals.income += income;
    totals.expense += expense;

    const ticket = Math.max(0, number(detail.ticket));
    const tv = Math.max(0, number(detail.tv));
    const cup = Math.max(0, number(detail.cup));
    const wage = Math.max(0, number(detail.wage));
    const opCost = Math.max(0, number(detail.opCost));
    const explicitSponsorSigning = Math.max(0, number(detail.sponsorSigning));
    let recurringSponsor = Math.max(0, number(detail.sponsor));
    let sponsorSigning = 0;

    if (explicitSponsorSigning > 0 || contains(lower, 'luvas:')) {
      sponsorSigning = explicitSponsorSigning || recurringSponsor || income;
      totals.sponsorSigning += sponsorSigning;
      recurringSponsor = Math.max(0, recurringSponsor - sponsorSigning);
    }

    totals.ticket += ticket;
    totals.tv += tv;
    totals.cup += cup;
    totals.wage += wage;
    totals.opCost += opCost;
    totals.sponsorRecurring += recurringSponsor;

    let categorizedIncome = ticket + tv + cup + recurringSponsor + sponsorSigning;
    let categorizedExpense = wage + opCost;

    if (contains(lower, 'venda:', 'venda →', 'venda rápida')) {
      totals.transfersIn += income;
      categorizedIncome += income;
    } else if (!detail.description && contains(lower, 'venda')) {
      totals.transfersIn += income;
      categorizedIncome += income;
    }

    if (contains(lower, 'compra:', 'compra ')) {
      totals.transfersOut += expense || Math.abs(number(entry?.total ?? entry?.value));
      categorizedExpense += expense;
    } else if (contains(lower, 'treinamento')) {
      totals.training += expense;
      categorizedExpense += expense;
    } else if (contains(lower, 'academia')) {
      totals.academy += expense;
      categorizedExpense += expense;
    } else if (contains(lower, 'tratamento médico', 'recuperação física', 'fisioterapia')) {
      totals.medical += expense;
      categorizedExpense += expense;
    } else if (contains(lower, 'renovação', 'renovacao', 'contrato')) {
      totals.contracts += expense;
      categorizedExpense += expense;
    } else if (contains(lower, 'estádio', 'estadio', 'obras')) {
      totals.stadium += expense;
      categorizedExpense += expense;
    } else if (contains(lower, 'mercado')) {
      totals.market += expense;
      categorizedExpense += expense;
    }

    if (!detail.description && !ticket && !tv && !cup && !wage && !opCost && !recurringSponsor) {
      if (contains(lower, 'patrocínio', 'patrocinio')) {
        totals.sponsorSigning += income;
        categorizedIncome += income;
      } else if (contains(lower, 'copa', 'libertadores', 'sul-americana')) {
        totals.cup += income;
        categorizedIncome += income;
      }
    }

    totals.otherIncome += Math.max(0, income - Math.min(income, categorizedIncome));
    totals.otherExpense += Math.max(0, expense - Math.min(expense, categorizedExpense));
  });

  totals.sponsor = totals.sponsorRecurring + totals.sponsorSigning;
  totals.net = totals.income - totals.expense;
  return totals;
}

export function getAverageTicketIncome(history = [], { homeOnly = false } = {}) {
  const entries = (history || []).filter((entry) => {
    if ((entry?.detail?.ticket || 0) <= 0) return false;
    if (!homeOnly) return true;
    return entry?.detail?.isHome === true;
  });
  if (!entries.length) return null;
  return Math.round(entries.reduce((sum, entry) => sum + number(entry.detail.ticket), 0) / entries.length);
}

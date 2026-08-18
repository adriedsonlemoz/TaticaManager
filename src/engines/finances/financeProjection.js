import { calculateMatchFinances, getTVRights } from './financeMatch.js';
import { getAverageTicketIncome, getSeasonFinancialHistory, summarizeFinancialHistory } from './financeLedger.js';
import { getCurrentWage, getFinancialStatus, getOperationalCosts } from './financeRisk.js';

function findNextUserLeagueMatch(gameData = {}, leagueIdx) {
  const round = gameData.fixtures?.[leagueIdx] || [];
  return round.find((match) => match?.home?.id === 'user' || match?.away?.id === 'user' || match?.home?.isPlayer || match?.away?.isPlayer) || null;
}

export function buildFinanceOverview(gameData = {}) {
  const allHistory = gameData.financialHistory || [];
  const history = getSeasonFinancialHistory(allHistory, gameData.season);
  const sponsors = gameData.club?.sponsors || { master: null, stadium: null };
  const totalWage = getCurrentWage(gameData);
  const sponsorIncomePerRound = (Number(sponsors.master?.roundValue) || 0) + (Number(sponsors.stadium?.roundValue) || 0);
  const totalRounds = gameData.fixtures?.length || 38;
  const currentLeagueRound = Math.max(0, Number(gameData.leagueRound ?? gameData.round) || 0);
  const hasNextLeagueRound = currentLeagueRound < totalRounds;
  const nextLeagueRound = hasNextLeagueRound ? currentLeagueRound + 1 : totalRounds;
  const tvIncome = hasNextLeagueRound ? getTVRights(gameData.serie || 'D', Math.max(1, nextLeagueRound), totalRounds) : 0;
  const recurringOpCost = Math.round(getOperationalCosts(gameData) / 4);
  const avgRealTicket = getAverageTicketIncome(history);
  const nextMatch = hasNextLeagueRound ? findNextUserLeagueMatch(gameData, Math.max(0, nextLeagueRound - 1)) : null;
  const projectedMatch = nextMatch
    ? calculateMatchFinances(nextMatch.home, nextMatch.away, { ...gameData, leagueRound: nextLeagueRound }, { includeWeather: false })
    : null;
  const ticketIncome = projectedMatch?.ticketRevenue ?? avgRealTicket ?? 0;
  const totalIncome = tvIncome + sponsorIncomePerRound + ticketIncome;
  const totalExpense = totalWage + recurringOpCost;
  const status = getFinancialStatus(gameData);

  return {
    sponsors,
    history,
    allHistory,
    totalWage,
    sponsorIncomePerRound,
    tvIncome,
    ticketIncome,
    avgRealTicket,
    projectedMatch,
    recurringOpCost,
    totalIncome,
    totalExpense,
    estimatedBalance: totalIncome - totalExpense,
    status,
    summary: summarizeFinancialHistory(history),
    currentLeagueRound,
    nextLeagueRound,
    totalLeagueRounds: totalRounds,
    hasNextLeagueRound,
    operationalChargeNext: hasNextLeagueRound && nextLeagueRound % 4 === 0,
  };
}

export function getFinancialSuggestions(gameData, overview = buildFinanceOverview(gameData)) {
  const suggestions = [];
  const { status, sponsors, totalIncome, totalWage, recurringOpCost, estimatedBalance, ticketIncome, projectedMatch } = overview;

  if (status?.status === 'critico') {
    const phrase = status.runway >= 999 ? 'a receita recorrente cobre as despesas fixas, mas o caixa está negativo.' : `o caixa cobre cerca de ${status.runway} rodada${status.runway === 1 ? '' : 's'} do déficit recorrente.`;
    suggestions.push(`Caixa crítico: ${phrase}`);
  } else if (status?.status === 'alerta') {
    suggestions.push(`Atenção ao caixa: há fôlego para aproximadamente ${status.runway} rodadas do déficit recorrente.`);
  }

  if (!sponsors.master || !sponsors.stadium) {
    suggestions.push('Há espaço comercial sem contrato. Um novo patrocínio pode aumentar a receita fixa por rodada da Liga.');
  }

  const recurringExpense = totalWage + recurringOpCost;
  if (totalIncome > 0 && recurringExpense / totalIncome > 0.85) {
    suggestions.push('A folha e os custos fixos estão pesados para a receita estimada. Evite aumentar salários sem nova receita.');
  }

  if (projectedMatch?.userIsAway && ticketIncome > 0) {
    suggestions.push('A próxima projeção de bilheteria considera apenas a cota de visitante no estádio adversário.');
  }

  if (estimatedBalance < 0) {
    suggestions.push('O fluxo estimado da próxima rodada da Liga está negativo. Priorize vendas, patrocínios ou redução de custos.');
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

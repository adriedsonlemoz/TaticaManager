import { OPERATIONAL_BASE_BY_SERIE, number } from './financeConfig.js';
import { getTVRights } from './financeMatch.js';

export function getOperationalCosts(gameData = {}) {
  const serie = gameData.serie || 'A';
  const level = Math.max(1, number(gameData.club?.stadium?.level, 1));
  const base = OPERATIONAL_BASE_BY_SERIE[serie] || OPERATIONAL_BASE_BY_SERIE.D;
  return base + (level - 1) * 30_000;
}

export function getCurrentWage(gameData = {}) {
  const players = gameData.players || [];
  if (players.length > 0) {
    return players.reduce((sum, player) => sum + Math.max(0, number(player?.wage)), 0);
  }
  return Math.max(0, number(gameData.club?.wage));
}

export function getRecurringFinanceBaseline(gameData = {}) {
  const totalRounds = Math.max(1, number(gameData.fixtures?.length, 38));
  const nextLeagueRound = Math.min(totalRounds, Math.max(1, number(gameData.leagueRound ?? gameData.round, 0) + 1));
  const wage = getCurrentWage(gameData);
  const opCostPerRound = Math.round(getOperationalCosts(gameData) / 4);
  const sponsorIncome = Math.max(0, number(gameData.club?.sponsors?.master?.roundValue))
    + Math.max(0, number(gameData.club?.sponsors?.stadium?.roundValue));
  const tvIncome = getTVRights(gameData.serie || 'D', nextLeagueRound, totalRounds);
  const recurringIncome = sponsorIncome + tvIncome;
  const recurringExpense = wage + opCostPerRound;
  const recurringNet = recurringIncome - recurringExpense;
  return { wage, opCostPerRound, sponsorIncome, tvIncome, recurringIncome, recurringExpense, recurringNet };
}

export function getFinancialStatus(gameData = {}) {
  const money = number(gameData.club?.money);
  const baseline = getRecurringFinanceBaseline(gameData);
  const burnRate = Math.max(0, baseline.recurringExpense - baseline.recurringIncome);
  const runway = burnRate > 0
    ? Math.max(0, Math.floor(Math.max(0, money) / burnRate))
    : 999;

  const insolvent = money < 0;
  const status = insolvent || runway < 3
    ? 'critico'
    : runway < 8
      ? 'alerta'
      : runway < 15
        ? 'atencao'
        : 'saudavel';

  return {
    runway,
    status,
    burnRate,
    recurringIncome: baseline.recurringIncome,
    recurringExpense: baseline.recurringExpense,
    recurringNet: baseline.recurringNet,
    label: status === 'critico'
      ? '🔴 CRISE FINANCEIRA'
      : status === 'alerta'
        ? '🟠 Alerta Financeiro'
        : status === 'atencao'
          ? '🟡 Atenção às Finanças'
          : '🟢 Finanças Saudáveis',
  };
}

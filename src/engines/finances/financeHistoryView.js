import { historyExpense, historyIncome } from './financeLedger.js';

export function parseFinancialEntry(entry, formatMoney = (value) => String(value)) {
  const isModern = entry?.detail !== undefined || entry?.income !== undefined || entry?.expense !== undefined;
  let description = '';
  let value = 0;
  let positive = true;
  let icon = '💰';

  if (isModern) {
    const detail = entry?.detail || {};
    const desc = detail.description || '';
    const income = historyIncome(entry);
    const expense = historyExpense(entry);
    value = entry?.total ?? (income - expense);
    positive = value >= 0;
    description = desc || (income > 0 ? `Receita · Rodada ${entry?.leagueRound ?? entry?.round ?? '?'}` : `Despesa · Rodada ${entry?.leagueRound ?? entry?.round ?? '?'}`);

    if (desc.includes('Venda')) icon = '🤝';
    else if (desc.includes('Compra')) icon = '🛒';
    else if (desc.includes('Patrocínio') || desc.includes('Luvas')) icon = '✍️';
    else if (desc.includes('Treinamento')) icon = '🏋️';
    else if (desc.includes('Academia')) icon = '🌱';
    else if (desc.includes('Tratamento') || desc.includes('Recuperação') || desc.includes('fisioterapia')) icon = '🏥';
    else if (desc.includes('Contrato') || desc.includes('Renovação')) icon = '📑';
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
      if (parts.length) description = `Fechamento Rod. ${entry?.leagueRound ?? entry?.round ?? '?'} · ${parts.join(' · ')}`;
    }
  } else {
    value = Number(entry?.value) || 0;
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
  const chronological = [...(history || [])].reverse();
  const maxAbs = Math.max(
    ...chronological.map((entry) => Math.max(historyIncome(entry), historyExpense(entry), Math.abs(Number(entry?.value) || 0))),
    1,
  );
  return {
    chronological,
    maxAbs,
    chart: chronological.slice(-30).map((entry, index) => ({
      round: entry?.leagueRound ?? entry?.round ?? index + 1,
      income: historyIncome(entry),
      expense: historyExpense(entry),
    })),
  };
}

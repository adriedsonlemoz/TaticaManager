import { CpuAI } from '../engine_cpu_ai.js';
import { FinanceEngine } from '../engine_finances.js';

export const MIN_SELLING_SQUAD = 20;
export const DEFAULT_MAX_SQUAD = 30;

const SERIES_ORDER = Object.freeze({ A: 1, B: 2, C: 3, D: 4 });

export function getTransferRound(gameData = {}) {
  const hasLeagueRound = gameData.leagueRound !== null && gameData.leagueRound !== undefined && Number.isFinite(Number(gameData.leagueRound));
  const playedLeagueRounds = hasLeagueRound ? Number(gameData.leagueRound) : (Number(gameData.round) || 0);
  return Math.max(1, playedLeagueRounds + 1);
}

export function getTransferWindowState(gameData = {}) {
  const transferRound = getTransferRound(gameData);
  const info = CpuAI?.getTransferWindowInfo?.(transferRound) || { open: true, label: 'Janela de Transferências' };
  return { ...info, transferRound };
}

export function getTransferFunds(gameData = {}) {
  const cash = Math.max(0, Number(gameData.club?.money) || 0);
  const rawBudget = Math.max(0, Number(gameData.club?.transferBudget) || 0);
  const budgetLimited = rawBudget > 0;
  return {
    cash,
    transferBudget: rawBudget,
    budgetLimited,
    available: budgetLimited ? Math.min(cash, rawBudget) : cash,
  };
}

export function getMinimumSerieForPlayer(overall) {
  const value = Number(overall) || 0;
  if (value >= 86) return 'A';
  if (value >= 78) return 'B';
  if (value >= 70) return 'C';
  return null;
}

export function getCpuTeamPools(gameData = {}) {
  return [
    ...(gameData.teams || []),
    ...(gameData.leagues?.A || []),
    ...(gameData.leagues?.B || []),
    ...(gameData.leagues?.C || []),
    ...(gameData.leagues?.D || []),
  ];
}

export function findCpuTeam(gameData = {}, player = {}) {
  const teams = getCpuTeamPools(gameData);
  const sourceTeamId = player.originTeamId ?? player.teamId;
  const sourceTeamName = player.originTeamName ?? player.teamName;
  if (sourceTeamId != null) {
    const byId = teams.find((team) => String(team?.id) === String(sourceTeamId));
    if (byId) return byId;
  }
  if (sourceTeamName && sourceTeamName !== 'Livre') {
    return teams.find((team) => team?.name === sourceTeamName) || null;
  }
  return null;
}

export function getSellerRoster(gameData = {}, player = {}) {
  const seller = findCpuTeam(gameData, player);
  if (!seller) return [];
  const roster = gameData.teamRosters?.[seller.id];
  return Array.isArray(roster) && roster.length > 0 ? roster : (seller.squad || []);
}

export function evaluateTransferPurchase(gameData = {}, player = {}, finalPrice = player?.value || 0) {
  const price = Math.max(0, Number(finalPrice) || 0);
  const funds = getTransferFunds(gameData);
  const windowInfo = getTransferWindowState(gameData);
  const maxSquad = Number(CpuAI?.MAX_SQUAD_SIZE) || DEFAULT_MAX_SQUAD;
  const squadSize = (gameData.players || []).length;
  const sourceTeamId = player?.originTeamId ?? player?.teamId;
  const sourceTeamName = player?.originTeamName ?? player?.teamName;
  const isFreeAgent = sourceTeamId == null || !sourceTeamName || sourceTeamName === 'Livre';

  const deny = (code, message, severity = 'error', detail = null) => ({
    allowed: false,
    code,
    message,
    severity,
    detail,
    price,
    funds,
    windowInfo,
    maxSquad,
  });

  if (windowInfo.open === false) {
    return deny(
      'window_closed',
      `Janela fechada! ${windowInfo.label} abre em ${windowInfo.opensIn} rodada(s).`,
    );
  }

  if (squadSize >= maxSquad) {
    return deny('squad_full', `Elenco cheio! Máximo de ${maxSquad} jogadores.`);
  }

  if (!isFreeAgent) {
    const sellerRoster = getSellerRoster(gameData, player);
    if (sellerRoster.length > 0 && sellerRoster.length <= MIN_SELLING_SQUAD) {
      return deny(
        'seller_min_squad',
        `${sourceTeamName} não pode vender agora.`,
        'error',
        `O clube ficaria com menos de ${MIN_SELLING_SQUAD} jogadores — abaixo do mínimo para disputar o campeonato.`,
      );
    }
  }

  const financialStatus = FinanceEngine?.getFinancialStatus?.(gameData);
  if (financialStatus?.status === 'critico') {
    return deny('financial_crisis', 'Situação financeira crítica! Sem crédito para contratações.');
  }

  if (!isFreeAgent) {
    const minimumSerie = getMinimumSerieForPlayer(player.overall);
    const clubSerie = gameData.serie || 'A';
    if (minimumSerie && (SERIES_ORDER[clubSerie] || 4) > (SERIES_ORDER[minimumSerie] || 4)) {
      const overall = Number(player.overall) || 0;
      const level = overall >= 86 ? 'estrela' : overall >= 78 ? 'experiente' : 'qualificado';
      return deny(
        'reputation',
        `${player.name?.split(' ').pop() || 'Jogador'} recusou a proposta.`,
        'error',
        `Jogador ${level} (OVR ${overall}) exige no mínimo a Série ${minimumSerie}. Seu clube está na Série ${clubSerie}.`,
      );
    }
  }

  if (funds.cash < price) {
    return deny('cash', 'Saldo insuficiente em caixa!');
  }

  if (funds.budgetLimited && price > funds.transferBudget) {
    return deny('transfer_budget', 'Fora do orçamento de transferências!', 'warning');
  }

  return {
    allowed: true,
    code: 'ok',
    message: 'Contratação disponível',
    severity: 'success',
    detail: null,
    price,
    funds,
    windowInfo,
    maxSquad,
  };
}

export function getPurchaseActionLabel(eligibility, formatMoney = (value) => String(value)) {
  if (!eligibility) return 'INDISPONÍVEL';
  if (eligibility.allowed) return `💰 CONTRATAR — ${formatMoney(eligibility.price)}`;
  switch (eligibility.code) {
    case 'cash': return 'SEM SALDO';
    case 'transfer_budget': return 'FORA DO ORÇAMENTO';
    case 'window_closed': return 'JANELA FECHADA';
    case 'squad_full': return 'ELENCO CHEIO';
    case 'financial_crisis': return 'CRISE FINANCEIRA';
    case 'seller_min_squad': return 'VENDA BLOQUEADA';
    case 'reputation': return 'JOGADOR RECUSARIA';
    default: return 'INDISPONÍVEL';
  }
}

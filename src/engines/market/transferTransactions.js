import { appendFinancialEntry } from '../finances/financeLedger.js';
import { applyCpuPurchaseFinance, applyCpuSaleFinance, canCpuBuyPlayer, canCpuReceivePlayer, syncTeamWithRoster } from '../cpu/cpuRoster.js';
import { evaluateTransferPurchase } from './transferRules.js';
import {
  getPlayerOwnership,
  playerIdKey,
  removePlayerFromAllCpuRosters,
  samePlayerId,
} from './marketIntegrity.js';

const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);

function transferPrice(candidate = {}, explicitPrice = undefined) {
  const raw = explicitPrice ?? candidate.agreedTransferFee ?? candidate.value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : NaN;
}

function syncPoolWithRoster(pool = [], teamId, roster) {
  return (pool || []).map((team) => String(team?.id) === String(teamId) ? { ...team, squad: roster } : team);
}

function replaceTeamInPool(pool = [], replacement) {
  if (!replacement?.id) return pool || [];
  return (pool || []).map((team) => String(team?.id) === String(replacement.id) ? replacement : team);
}

function findTeam(state = {}, teamId, teamName = null) {
  const pools = [state.teams, ...SERIES_KEYS.map((serie) => state.leagues?.[serie])];
  for (const pool of pools) {
    const found = (pool || []).find((team) => (
      teamId != null ? String(team?.id) === String(teamId) : (teamName && team?.name === teamName)
    ));
    if (found) return found;
  }
  return null;
}

function transactionMeta(state, competition = 'transfer') {
  return {
    season: state.season,
    round: state.round,
    leagueRound: state.leagueRound ?? state.round,
    competition,
  };
}

export function applyUserPurchase(state, candidate, explicitPrice = undefined) {
  if (!state || !candidate?.id) return { state, ok: false, code: 'invalid_player', message: 'Jogador inválido.' };
  const key = playerIdKey(candidate);
  const owned = (state.players || []).some((player) => playerIdKey(player) === key);
  if (owned) return { state, ok: false, code: 'already_owned', message: 'Este jogador já pertence ao seu clube.' };

  const requestedSourceId = candidate.originTeamId ?? candidate.teamId;
  const requestedFree = requestedSourceId == null && (candidate.originTeamName ?? candidate.teamName ?? 'Livre') === 'Livre';
  const ownership = getPlayerOwnership(state, candidate.id);
  if (!ownership) return { state, ok: false, code: 'unavailable', message: `${candidate.name || 'Jogador'} não está mais disponível.` };
  if (ownership.type === 'user') return { state, ok: false, code: 'already_owned', message: 'Este jogador já pertence ao seu clube.' };
  if (requestedFree && ownership.type !== 'free') return { state, ok: false, code: 'unavailable', message: `${candidate.name || 'Jogador'} já acertou com outro clube.` };
  if (!requestedFree && ownership.type !== 'cpu') return { state, ok: false, code: 'unavailable', message: `${candidate.name || 'Jogador'} não pertence mais ao clube vendedor.` };
  if (!requestedFree && requestedSourceId != null && String(ownership.teamId) !== String(requestedSourceId)) {
    return { state, ok: false, code: 'unavailable', message: `${candidate.name || 'Jogador'} mudou de clube e a proposta expirou.` };
  }

  const price = transferPrice(candidate, explicitPrice);
  if (!Number.isFinite(price)) return { state, ok: false, code: 'invalid_price', message: 'Valor de transferência inválido.' };
  const sourcePlayer = ownership.player;
  const eligibilityPlayer = {
    ...sourcePlayer,
    teamId: ownership.teamId,
    teamName: ownership.teamName,
    originTeamId: ownership.teamId,
    originTeamName: ownership.teamName,
  };
  const eligibility = evaluateTransferPurchase(state, eligibilityPlayer, price);
  if (!eligibility.allowed) return { state, ok: false, ...eligibility };

  const stripped = removePlayerFromAllCpuRosters(state, candidate.id);
  let teams = stripped.teams;
  let leagues = { ...(state.leagues || {}), ...stripped.leagues };
  if (ownership.type === 'cpu' && ownership.teamId != null) {
    const sellerState = { ...state, teams, leagues, teamRosters: stripped.teamRosters };
    const seller = findTeam(sellerState, ownership.teamId, ownership.teamName);
    if (seller) {
      const sellerRoster = stripped.teamRosters?.[ownership.teamId] ?? seller.squad ?? [];
      const financedSeller = syncTeamWithRoster(applyCpuSaleFinance(seller, price), sellerRoster);
      teams = replaceTeamInPool(teams, financedSeller);
      SERIES_KEYS.forEach((serie) => { leagues[serie] = replaceTeamInPool(leagues[serie], financedSeller); });
    }
  }
  const shirt = Math.max(...(state.players || []).map((player) => Number(player.shirt) || 0), 0) + 1;
  const playerForUser = {
    ...sourcePlayer,
    value: Math.max(0, Number(sourcePlayer.value) || 0),
    contract: Math.max(2, Math.trunc(Number(sourcePlayer.contract) || 0)),
    teamId: 'user',
    teamName: state.club?.name || 'Meu Clube',
    originTeamId: undefined,
    originTeamName: undefined,
    previousTeam: ownership.type === 'cpu' ? ownership.teamName : (sourcePlayer.previousTeam || null),
    previousTeamId: ownership.type === 'cpu' ? ownership.teamId : (sourcePlayer.previousTeamId ?? null),
    lastTransferFee: price,
    isStarting: false,
    isListed: false,
    shirt,
    goals: 0,
    assists: 0,
    energy: 100,
    injury: null,
    discipline: sourcePlayer.discipline || { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
  };
  const players = [...(state.players || []).filter((player) => !samePlayerId(player, candidate)), playerForUser];
  const teamRosters = { ...stripped.teamRosters, user: players };
  const transaction = {
    round: state.round,
    income: 0,
    expense: price,
    total: -price,
    detail: {
      transfer: price,
      description: `${ownership.type === 'free' ? 'Contratação livre' : 'Compra'}: ${sourcePlayer.name}`,
      sourceTeamId: ownership.teamId,
      sourceTeamName: ownership.teamName,
    },
  };
  const hasBudget = state.club?.transferBudget !== null
    && state.club?.transferBudget !== undefined
    && Number.isFinite(Number(state.club.transferBudget));
  const transfersFromTeam = { ...(state.transfersFromTeam || {}) };
  if (ownership.type === 'cpu' && ownership.teamId != null) {
    transfersFromTeam[ownership.teamId] = (transfersFromTeam[ownership.teamId] || 0) + 1;
  }

  const nextState = {
    ...state,
    players,
    market: (state.market || []).filter((player) => !samePlayerId(player, candidate)),
    watchlist: (state.watchlist || []).filter((item) => !samePlayerId(item, candidate)),
    teams,
    leagues,
    teamRosters,
    club: {
      ...(state.club || {}),
      money: (Number(state.club?.money) || 0) - price,
      ...(hasBudget ? { transferBudget: Math.max(0, Number(state.club.transferBudget) - price) } : {}),
      wage: players.reduce((sum, player) => sum + (Number(player.wage) || 0), 0),
    },
    financialHistory: appendFinancialEntry(state.financialHistory, transaction, transactionMeta(state)),
    transfersFromTeam,
  };
  return { state: nextState, ok: true, code: 'ok', player: playerForUser, price };
}

export function applyUserSale(state, playerOrId, salePrice, { buyerTeamId = null, buyerTeamName = null, messageId = null } = {}) {
  if (!state) return { state, ok: false, code: 'invalid_state' };
  const key = playerIdKey(playerOrId);
  const player = (state.players || []).find((candidate) => playerIdKey(candidate) === key);
  if (!player) return { state, ok: false, code: 'not_owned', message: 'O jogador não pertence mais ao clube.' };
  const price = transferPrice({ value: salePrice }, salePrice);
  if (!Number.isFinite(price)) return { state, ok: false, code: 'invalid_price', message: 'Valor de venda inválido.' };

  const players = (state.players || []).filter((candidate) => playerIdKey(candidate) !== key);
  const teamRosters = { ...(state.teamRosters || {}), user: players };
  let teams = state.teams || [];
  let leagues = { ...(state.leagues || {}) };
  const buyer = findTeam(state, buyerTeamId, buyerTeamName);
  // Propostas que identificam um clube do save não podem virar vendas
  // "externas" silenciosamente se esse comprador deixou de existir.
  if (buyerTeamId != null && (!buyer || buyer.isPlayer || String(buyer.id) === 'user')) {
    return { state, ok: false, code: 'buyer_unavailable', message: 'O clube comprador desta proposta não está mais disponível.' };
  }
  if (buyer && !buyer.isPlayer && String(buyer.id) !== 'user') {
    const currentRoster = Array.isArray(teamRosters[buyer.id]) ? teamRosters[buyer.id] : (buyer.squad || []);
    if (!canCpuReceivePlayer(currentRoster)) {
      return { state, ok: false, code: 'buyer_squad_full', message: 'O clube comprador não tem vaga no elenco.' };
    }
    if (!canCpuBuyPlayer(buyer, price)) {
      return { state, ok: false, code: 'buyer_funds', message: 'O clube comprador não possui recursos para concluir a transferência.' };
    }
    const transferred = {
      ...player,
      teamId: buyer.id,
      teamName: buyer.name,
      previousTeam: state.club?.name || player.teamName,
      contract: Math.max(2, Math.trunc(Number(player.contract) || 0)),
      isStarting: false,
      isListed: false,
    };
    const roster = [...currentRoster.filter((candidate) => playerIdKey(candidate) !== key), transferred];
    teamRosters[buyer.id] = roster;
    const financedBuyer = syncTeamWithRoster(applyCpuPurchaseFinance(buyer, price), roster);
    teams = replaceTeamInPool(teams, financedBuyer);
    SERIES_KEYS.forEach((serie) => { leagues[serie] = replaceTeamInPool(state.leagues?.[serie], financedBuyer); });
  }

  const transfersFromTeam = { ...(state.transfersFromTeam || {}) };
  const previousTeamKey = player.originTeamId ?? player.previousTeamId ?? player.previousTeam;
  if (previousTeamKey != null && transfersFromTeam[previousTeamKey]) {
    if (transfersFromTeam[previousTeamKey] > 1) transfersFromTeam[previousTeamKey] -= 1;
    else delete transfersFromTeam[previousTeamKey];
  }
  const transaction = {
    round: state.round,
    income: price,
    expense: 0,
    total: price,
    detail: {
      transfer: price,
      description: `Venda: ${player.name}${buyerTeamName ? ` → ${buyerTeamName}` : ''}`,
      buyerTeamId,
      buyerTeamName,
    },
  };
  const inbox = (state.inbox || []).filter((message) => {
    if (messageId && message?.id === messageId) return false;
    return !(message?.actionData?.type === 'sell' && samePlayerId(message.actionData?.player, player));
  });

  return {
    state: {
      ...state,
      players,
      teamRosters,
      teams,
      leagues,
      inbox,
      market: (state.market || []).filter((candidate) => playerIdKey(candidate) !== key),
      watchlist: (state.watchlist || []).filter((candidate) => playerIdKey(candidate) !== key),
      club: {
        ...(state.club || {}),
        money: (Number(state.club?.money) || 0) + price,
        ...(state.club?.transferBudget !== null
          && state.club?.transferBudget !== undefined
          && Number.isFinite(Number(state.club.transferBudget))
          ? { transferBudget: Math.max(0, Number(state.club.transferBudget)) + price }
          : {}),
        wage: players.reduce((sum, candidate) => sum + (Number(candidate.wage) || 0), 0),
      },
      financialHistory: appendFinancialEntry(state.financialHistory, transaction, transactionMeta(state)),
      transfersFromTeam,
    },
    ok: true,
    code: 'ok',
    player,
    price,
  };
}

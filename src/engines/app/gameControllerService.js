import { getUpcomingRound } from '../core/playerStatus.js';
import { syncUserRosterState } from '../core/gameStateIntegrity.js';
import { DisciplineEngine } from '../engine_discipline.js';
import { appendFinancialEntry } from '../finances/financeLedger.js';
import { applyUserSale } from '../market/transferTransactions.js';
import { canCpuBuyPlayer, canCpuReceivePlayer, resolveTeamRoster } from '../cpu/cpuRoster.js';

const TRANSFER_BUYERS = [
  'Real Madrid', 'Manchester City', 'Chelsea', 'PSG', 'Al-Hilal',
  'Bayern de Munique', 'Boca Juniors', 'Inter de Milão', 'Al-Nassr', 'Milan',
];

export const formatMoneyBR = value => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`;
export const resolveSaveName = save => (typeof save === 'object' ? save?.name : save);

const pick = (items, rng) => items[Math.min(items.length - 1, Math.floor(rng() * items.length))];

function getEligibleLocalTransferBuyers(gameData = {}, price = 0) {
  const byId = new Map();
  const add = (teams = []) => teams.forEach((team) => {
    if (!team || team.isPlayer || String(team.id) === 'user' || team.id == null) return;
    if (!byId.has(String(team.id))) byId.set(String(team.id), team);
  });
  add(gameData.teams || []);
  ['A', 'B', 'C', 'D'].forEach((serie) => add(gameData.leagues?.[serie] || []));
  return [...byId.values()].filter((team) => {
    const roster = resolveTeamRoster(team, gameData.teamRosters || {});
    return canCpuReceivePlayer(roster) && canCpuBuyPlayer(team, price);
  });
}

function pickTransferBuyer(gameData, price, rng) {
  const local = getEligibleLocalTransferBuyers(gameData, price);
  if (local.length) {
    const team = pick(local, rng);
    return { name: team.name, teamId: team.id };
  }
  return { name: pick(TRANSFER_BUYERS, rng), teamId: null };
}

export function getLeagueRoundForMaintenance(gameData = {}) {
  if (Number.isFinite(Number(gameData.leagueRound))) return Math.max(0, Number(gameData.leagueRound));
  const calendar = gameData.calendar || [];
  if (calendar.length) {
    return calendar.slice(0, Math.max(0, Number(gameData.round) || 0))
      .filter(entry => entry?.type === 'league').length;
  }
  return Math.max(0, Number(gameData.round) || 0);
}

export function didJustCompleteLeagueMatch(gameData = {}) {
  const calendar = gameData.calendar || [];
  if (!calendar.length) return true;
  const completedSlot = Math.max(0, (Number(gameData.round) || 0) - 1);
  return calendar[completedSlot]?.type === 'league';
}

export function buildRoundMaintenanceKey(gameData = {}) {
  const season = Math.max(0, Math.trunc(Number(gameData?.season) || 0));
  const round = Math.max(0, Math.trunc(Number(gameData?.round) || 0));
  return `s${season}|r${round}`;
}

export function hasAppliedRoundMaintenance(gameData = {}) {
  const key = buildRoundMaintenanceKey(gameData);
  return Boolean(key && gameData?.lastRoundMaintenance?.key === key);
}

export function buildRoundMaintenance(gameData, {
  rng = Math.random,
  formatMoney = formatMoneyBR,
  allowTransferOffers = true,
} = {}) {
  if (!gameData) return { state: gameData, toasts: [], changed: false };
  if (hasAppliedRoundMaintenance(gameData)) {
    return { state: gameData, toasts: [], changed: false };
  }

  const nextRound = getUpcomingRound(gameData);
  let hasBenched = false;
  const updatedPlayers = (gameData.players || []).map(player => {
    if (!player.isStarting) return player;
    const suspended = DisciplineEngine.isPlayerSuspended(player, nextRound);
    if (!suspended && !player.injury) return player;
    hasBenched = true;
    return { ...player, isStarting: false, adaptedPosition: null };
  });

  let inbox = [...(gameData.inbox || [])];
  const toasts = [];
  const listedPlayers = updatedPlayers.filter(player => player.isListed);

  // Ofertas formais pertencem à manutenção pós-partida. Avanços de calendário
  // sem jogo (ex.: slot de Copa inativo) chamam este serviço com a opção
  // desabilitada para não criar proposta como se uma partida tivesse ocorrido.
  if (allowTransferOffers && listedPlayers.length > 0 && rng() > 0.2) {
    const target = pick(listedPlayers, rng);
    const offerValue = Math.floor((target.value || 0) * (0.8 + (rng() * 0.4)));
    const buyer = pickTransferBuyer(gameData, offerValue, rng);
    const leagueRound = getLeagueRoundForMaintenance(gameData);
    const maintenanceKey = buildRoundMaintenanceKey(gameData).replace('|', '_');
    const messageId = `msg_transfer_${maintenanceKey}_${target.id}`;
    if (!inbox.some(message => message?.id === messageId)) {
      inbox = [{
        id: messageId,
        icon: '🤝',
        type: 'TRANSFERÊNCIA',
        from: buyer.name,
        subject: `Proposta de Compra: ${target.name}`,
        date: `Rodada ${leagueRound}`,
        preview: `Proposta oficial no valor de ${formatMoney(offerValue)}...`,
        body: `Ao Departamento de Futebol,\n\nO clube ${buyer.name} formalizou uma proposta oficial para adquirir em definitivo os direitos do atleta ${target.name}.\n\nValor oferecido: ${formatMoney(offerValue)}\n\nAguardamos a decisão da diretoria e do Manager.\n\nAtenciosamente,\nDiretoria do ${buyer.name}`,
        read: false,
        actionData: { type: 'sell', player: target, value: offerValue, teamId: buyer.teamId },
      }, ...inbox];
      toasts.push({ delay: 1500, message: `📬 Uma proposta por ${target.name} chegou no e-mail!`, severity: 'info' });
    }
  }

  if (hasBenched) {
    toasts.push({ delay: 1800, message: '⚠️ Escalação incompleta! Suspensos/lesionados foram retirados.', severity: 'warning' });
  }

  // Mesmo sem outra alteração, a rodada é carimbada. Isso torna a manutenção
  // idempotente e impede efeitos aleatórios de reaparecerem por remontagem.
  const lastRoundMaintenance = {
    key: buildRoundMaintenanceKey(gameData),
    season: Math.max(0, Math.trunc(Number(gameData?.season) || 0)),
    round: Math.max(0, Math.trunc(Number(gameData?.round) || 0)),
  };
  return {
    state: syncUserRosterState({ ...gameData, inbox, lastRoundMaintenance }, updatedPlayers),
    toasts,
    changed: true,
  };
}

export function applyQuickPlayerSale(state, player, salePrice, options = {}) {
  const result = applyUserSale(state, player, salePrice, options);
  return result.ok ? result.state : state;
}

export function updatePlayerShirtState(state, playerId, shirt) {
  const parsed = Number.parseInt(shirt, 10);
  if (!state || !Number.isFinite(parsed)) return state;
  const players = (state.players || []).map(player => player.id === playerId ? { ...player, shirt: parsed } : player);
  return syncUserRosterState(state, players);
}

export function updatePlayerWageState(state, playerId, wage) {
  if (!state) return state;
  const requestedWage = Math.max(0, Number(wage) || 0);
  const players = (state.players || []).map(player => {
    if (String(player.id) !== String(playerId)) return player;
    // Contratos vigentes não podem ser rebaixados unilateralmente; aumentar
    // salário não altera a duração. Renovação passa pela transação contratual.
    return { ...player, wage: Math.max(Number(player.wage) || 0, requestedWage) };
  });
return syncUserRosterState(state, players);
}

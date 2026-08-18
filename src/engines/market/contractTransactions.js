import { applyContractRenewal } from '../cpu/cpuContracts.js';
import { appendFinancialEntry } from '../finances/financeLedger.js';

export function applyContractRenewalState(state, action = {}, rng = Math.random) {
  if (!state || action.type !== 'renew_contract') return { state, ok: false, error: 'Ação contratual inválida.' };
  if (action.season !== null && action.season !== undefined
      && state.season !== null && state.season !== undefined
      && Number(action.season) !== Number(state.season)) {
    return { state, ok: false, error: 'Esta proposta de renovação pertence a outra temporada e expirou.' };
  }
  const result = applyContractRenewal(
    state.players || [],
    state.club || {},
    action.playerId,
    action.cost,
    rng,
    { expectedContract: action.expectedContract, expectedWage: action.expectedWage },
  );
  if (result.error) return { state, ok: false, error: result.error };

  const matchingMessageIds = (state.inbox || [])
    .filter((message) => message?.actionData?.type === 'renew_contract'
      && String(message.actionData.playerId) === String(action.playerId))
    .map((message) => message.id);

  const next = {
    ...state,
    players: result.players,
    teamRosters: {
      ...(state.teamRosters || {}),
      user: result.players,
    },
    club: result.club,
    financialHistory: result.transaction
      ? appendFinancialEntry(state.financialHistory, result.transaction, {
          season: state.season,
          round: state.round,
          leagueRound: state.leagueRound ?? state.round,
          competition: 'contract',
        })
      : (state.financialHistory || []),
    trashMsgIds: [...new Set([...(state.trashMsgIds || []), ...matchingMessageIds])],
  };
  return {
    state: next,
    ok: true,
    player: result.players.find((player) => String(player.id) === String(action.playerId)) || null,
    transaction: result.transaction,
  };
}

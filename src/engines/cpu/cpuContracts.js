export const CONTRACT_WARN_ROUNDS = Object.freeze([2, 19]);

export function calculateRenewalCost(player = {}) {
  return Math.max(0, Math.round((Number(player.wage) || 0) * 24));
}

export function getContractWarnings(players = [], round, existingInbox = [], season = null) {
  if (!CONTRACT_WARN_ROUNDS.includes(Number(round))) return [];
  const existing = new Set((existingInbox || []).map((message) => message.id));

  return (players || []).flatMap((player) => {
    if ((player.contract ?? 2) > 1) return [];
    const seasonNumber = season == null || season === '' ? null : Math.max(0, Math.trunc(Number(season) || 0));
    const messageId = seasonNumber == null
      ? `contract_warn_${player.id}_r${round}`
      : `contract_warn_${player.id}_s${seasonNumber}_r${round}`;
    if (existing.has(messageId)) return [];

    const renewCost = calculateRenewalCost(player);
    const isUrgent = (player.contract ?? 1) <= 0;
    const lastName = String(player.name || 'Jogador').split(' ').pop();
    return [{
      id: messageId,
      type: 'contract',
      from: 'Departamento de Futebol',
      subject: isUrgent
        ? `⚠️ CONTRATO EXPIRADO — ${lastName} sairá em livre-arbítrio`
        : `📋 Contrato de ${lastName} expira ao fim da temporada`,
      body: isUrgent
        ? `O contrato de ${player.name} (${player.position} · OVR ${player.overall}) expirou. Se não renovar antes do fim da temporada, ele sairá sem custo de transferência.`
        : `${player.name} (${player.position} · OVR ${player.overall} · ⚡${player.energy ?? 100}%) tem apenas 1 temporada de contrato restante.\nRenove por R$${(renewCost / 1000).toFixed(0)}K (2 anos adicionais) ou perca-o ao final da temporada.`,
      round,
      read: false,
      actionData: {
        type: 'renew_contract',
        playerId: player.id,
        cost: renewCost,
        expectedContract: Math.max(0, Math.trunc(Number(player.contract) || 0)),
        expectedWage: Math.max(0, Number(player.wage) || 0),
        season: seasonNumber,
        label: `Renovar por R$${(renewCost / 1000).toFixed(0)}K`,
      },
    }];
  });
}

export function validateContractRenewal(players = [], club = {}, playerId, quotedCost = null, expected = {}) {
  const target = (players || []).find((player) => String(player.id) === String(playerId));
  if (!target) return { target: null, cost: 0, error: 'Jogador não encontrado.' };
  if ((Number(target.contract) || 0) > 1) {
    return { target, cost: 0, error: 'Esta proposta de renovação já expirou: o jogador já possui contrato longo.' };
  }
  if (expected.expectedContract !== undefined && expected.expectedContract !== null
      && Math.trunc(Number(target.contract) || 0) !== Math.trunc(Number(expected.expectedContract) || 0)) {
    return { target, cost: 0, error: 'A situação contratual mudou. Abra uma nova proposta de renovação.' };
  }
  if (expected.expectedWage !== undefined && expected.expectedWage !== null
      && Math.max(0, Number(target.wage) || 0) !== Math.max(0, Number(expected.expectedWage) || 0)) {
    return { target, cost: 0, error: 'O salário mudou desde esta proposta. Gere uma nova renovação.' };
  }

  const currentCost = calculateRenewalCost(target);
  const quoted = Number(quotedCost);
  // Uma cotação antiga nunca pode baratear uma renovação após reajuste salarial.
  const cost = quotedCost !== null && quotedCost !== undefined && Number.isFinite(quoted) && quoted >= 0
    ? Math.max(currentCost, quoted)
    : currentCost;
  if ((Number(club.money) || 0) < cost) {
    return { target, cost, error: 'Saldo insuficiente!' };
  }
  return { target, cost, error: null };
}

export function applyContractRenewal(players = [], club = {}, playerId, quotedCost = null, rng = Math.random, expected = {}) {
  const validation = validateContractRenewal(players, club, playerId, quotedCost, expected);
  if (validation.error) return { players, club, error: validation.error, transaction: null };
  const { target, cost } = validation;

  const oldWage = Math.max(0, Number(target.wage) || 0);
  const roll = Math.max(0, Math.min(0.999999, Number(rng?.()) || 0));
  const newWage = Math.round(oldWage * (1.10 + roll * 0.10));
  const updatedPlayers = (players || []).map((player) => String(player.id) === String(playerId)
    ? { ...player, contract: Math.max(0, Number(player.contract) || 0) + 2, wage: newWage }
    : player);

  return {
    players: updatedPlayers,
    club: {
      ...club,
      money: (Number(club.money) || 0) - cost,
      wage: updatedPlayers.reduce((sum, player) => sum + (Number(player.wage) || 0), 0),
    },
    transaction: {
      income: 0,
      expense: cost,
      total: -cost,
      detail: { contractRenewal: cost, description: `Renovação: ${target.name}` },
    },
    error: null,
  };
}

export function getSeasonEndDepartures(players = []) {
  return (players || []).filter((player) => (player.contract ?? 1) <= 0);
}

export function getFreeAgentsFromExpiredContracts(leagues = {}, teamRosters = {}) {
  const seen = new Set();
  const freeAgents = [];
  const allTeams = [
    ...(leagues?.A || []), ...(leagues?.B || []),
    ...(leagues?.C || []), ...(leagues?.D || []),
  ];
  allTeams.forEach((team) => {
    if (team?.isPlayer || team?.id === 'user') return;
    const squad = Array.isArray(teamRosters?.[team.id]) ? teamRosters[team.id] : (team?.squad || []);
    squad.forEach((player) => {
      const key = player?.id == null ? null : String(player.id);
      if ((player.contract ?? 2) > 0 || !key || seen.has(key)) return;
      seen.add(key);
      freeAgents.push({
        ...player,
        previousTeam: team.name,
        originTeamId: null,
        originTeamName: null,
        teamName: 'Livre',
        teamId: null,
        isStarting: false,
        isListed: true,
        goals: 0,
        assists: 0,
      });
    });
  });
  return freeAgents;
}

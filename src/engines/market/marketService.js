// Regras puras do mercado. Mantém ScreenMarket focado em estado e apresentação.

export const MARKET_REFRESH_COST = 200000;

export function getMarketOverallRange(serie = 'A') {
  if (serie === 'A') return { min: 68, max: 82 };
  if (serie === 'B') return { min: 62, max: 74 };
  if (serie === 'C') return { min: 55, max: 66 };
  return { min: 48, max: 56 };
}

export function createRefreshedMarket(gameData, playerFactory) {
  const { min, max } = getMarketOverallRange(gameData.serie || 'A');
  const count = gameData.market?.length || 15;
  return Array.from({ length: count }, () => {
    const overall = min + Math.floor(Math.random() * (max - min));
    const player = playerFactory?.(null, 'Livre', overall) || null;
    return player ? { ...player, teamName: 'Livre' } : null;
  }).filter(Boolean);
}

export function normalizeAndFilterMarket(players, { position = 'TODOS', range = { min: 0, max: 99 } } = {}) {
  return (players || [])
    .map(player => ({ ...player, teamName: player.teamName || 'Livre' }))
    .filter(player =>
      (position === 'TODOS' || player.position === position) &&
      player.overall >= range.min && player.overall <= range.max
    );
}

export function collectCpuTeams(gameData) {
  const map = new Map();
  const add = teams => (teams || []).forEach(team => {
    if (!team.isPlayer && team.id !== 'user') map.set(team.id, team);
  });
  add(gameData.teams);
  add(gameData.leagues?.A); add(gameData.leagues?.B);
  add(gameData.leagues?.C); add(gameData.leagues?.D);
  return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export function getTeamSerie(gameData, team) {
  const id = String(team.id);
  if (gameData.leagues?.A?.some(item => String(item.id) === id)) return 'A';
  if (gameData.leagues?.B?.some(item => String(item.id) === id)) return 'B';
  if (gameData.leagues?.C?.some(item => String(item.id) === id)) return 'C';
  if (gameData.leagues?.D?.some(item => String(item.id) === id)) return 'D';
  if (id.startsWith('b')) return 'B';
  if (id.startsWith('c')) return 'C';
  if (id.startsWith('d')) return 'D';
  return 'A';
}

export function enrichTransferPlayer(gameData, player, finalPrice) {
  const enriched = { ...player, value: finalPrice, teamName: gameData.club.name };
  if (enriched.teamId || !player.teamName || player.teamName === 'Livre') return enriched;
  const allTeams = [
    ...(gameData.teams || []), ...(gameData.leagues?.A || []),
    ...(gameData.leagues?.B || []), ...(gameData.leagues?.C || []),
    ...(gameData.leagues?.D || []),
  ];
  const originTeam = allTeams.find(team => team.name === player.teamName);
  return originTeam?.id ? { ...enriched, teamId: originTeam.id } : enriched;
}

export function resolveNegotiationPlayer(gameData, stalePlayer) {
  if (stalePlayer.teamName === 'Livre') {
    return (gameData.market || []).find(player => player.id === stalePlayer.id) || null;
  }
  const allTeams = [
    ...(gameData.teams || []), ...(gameData.leagues?.A || []), ...(gameData.leagues?.B || []),
  ];
  const team = allTeams.find(item => item.name === stalePlayer.teamName);
  return team?.squad?.find(player => player.id === stalePlayer.id) || null;
}

export function getMinimumAcceptedOffer(player) {
  return Math.round(player.value * (player.teamName === 'Livre' ? 0.85 : 0.92));
}

export function applyPlayerSale(state, player, offerData) {
  const updatedPlayers = state.players.filter(item => item.id !== player.id);
  const transaction = {
    round: state.round, income: offerData.value, expense: 0, total: offerData.value,
    detail: { description: `Venda: ${player.name} → ${offerData.team}` },
  };
  const playerForCPU = { ...player, teamName: offerData.team, isStarting: false, isListed: false };
  const updateSquad = teams => (teams || []).map(team =>
    team.name === offerData.team ? { ...team, squad: [...(team.squad || []), playerForCPU] } : team
  );
  const allTeams = [...(state.teams || []), ...(state.leagues?.A || []), ...(state.leagues?.B || [])];
  const buyerTeam = allTeams.find(team => team.name === offerData.team);
  const updatedRosters = { ...state.teamRosters };
  if (buyerTeam?.id) {
    updatedRosters[buyerTeam.id] = [
      ...(updatedRosters[buyerTeam.id] || []).filter(item => item.id !== player.id), playerForCPU,
    ];
  }
  if (updatedRosters.user) updatedRosters.user = updatedRosters.user.filter(item => item.id !== player.id);
  return {
    ...state,
    players: updatedPlayers,
    club: {
      ...state.club,
      money: state.club.money + offerData.value,
      transferBudget: (state.club.transferBudget || 0) + offerData.value,
      wage: Math.max(0, (state.club.wage || 0) - (player.wage || 0)),
    },
    financialHistory: [transaction, ...(state.financialHistory || [])].slice(0, 50),
    inbox: (state.inbox || []).filter(message => message.id !== offerData.msgId),
    teamRosters: updatedRosters,
    teams: updateSquad(state.teams),
    leagues: { ...state.leagues, A: updateSquad(state.leagues?.A), B: updateSquad(state.leagues?.B) },
  };
}

// Regras puras do mercado. Mantém ScreenMarket focado em estado e apresentação.

import { getTransferFunds } from './transferRules.js';

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
    const overall = min + Math.floor(Math.random() * (max - min + 1));
    const player = playerFactory?.(null, 'Livre', overall) || null;
    return player ? { ...player, teamName: 'Livre' } : null;
  }).filter(Boolean);
}

const MARKET_POSITION_ALIASES = Object.freeze({
  LD: ['LD', 'LAT'],
  LE: ['LE', 'LAT'],
  CA: ['CA', 'ATA'],
});

export function matchesMarketPosition(playerPosition, filterPosition) {
  if (filterPosition === 'TODOS') return true;
  const aliases = MARKET_POSITION_ALIASES[filterPosition] || [filterPosition];
  return aliases.includes(playerPosition);
}

export function normalizeAndFilterMarket(players, { position = 'TODOS', range = { min: 0, max: 99 } } = {}) {
  return (players || [])
    .map(player => ({ ...player, teamName: player.teamName || 'Livre' }))
    .filter(player =>
      matchesMarketPosition(player.position, position) &&
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
  const allTeams = [
    ...(gameData.teams || []), ...(gameData.leagues?.A || []),
    ...(gameData.leagues?.B || []), ...(gameData.leagues?.C || []),
    ...(gameData.leagues?.D || []),
  ];
  const originTeam = player.teamId != null
    ? allTeams.find(team => String(team.id) === String(player.teamId))
    : allTeams.find(team => team.name === player.teamName);
  const originTeamName = player.teamName || originTeam?.name || 'Livre';
  const originTeamId = player.teamId ?? originTeam?.id ?? null;
  return {
    ...player,
    value: finalPrice,
    originTeamName,
    originTeamId,
    teamId: originTeamId,
    teamName: gameData.club.name,
  };
}

export function resolveNegotiationPlayer(gameData, stalePlayer) {
  if (stalePlayer.teamName === 'Livre') {
    return (gameData.market || []).find(player => player.id === stalePlayer.id) || null;
  }
  const allTeams = [
    ...(gameData.teams || []), ...(gameData.leagues?.A || []), ...(gameData.leagues?.B || []),
    ...(gameData.leagues?.C || []), ...(gameData.leagues?.D || []),
  ];
  const team = allTeams.find(item => item.name === stalePlayer.teamName || String(item.id) === String(stalePlayer.teamId));
  const roster = team?.id != null && Array.isArray(gameData.teamRosters?.[team.id])
    ? gameData.teamRosters[team.id]
    : (team?.squad || []);
  return roster.find(player => player.id === stalePlayer.id) || null;
}

export function getMinimumAcceptedOffer(player) {
  return Math.round(player.value * (player.teamName === 'Livre' ? 0.85 : 0.92));
}

export function applyPlayerSale(state, player, offerData) {
  const updatedPlayers = (state.players || []).filter(item => item.id !== player.id);
  const transaction = {
    round: state.round, income: offerData.value, expense: 0, total: offerData.value,
    detail: { description: `Venda: ${player.name} → ${offerData.team}` },
  };
  const allTeams = [
    ...(state.teams || []),
    ...(state.leagues?.A || []), ...(state.leagues?.B || []),
    ...(state.leagues?.C || []), ...(state.leagues?.D || []),
  ];
  const buyerTeam = allTeams.find(team => team.name === offerData.team) || null;
  const playerForCPU = {
    ...player,
    teamName: offerData.team,
    teamId: buyerTeam?.id ?? player.teamId ?? null,
    isStarting: false,
    isListed: false,
  };
  const updateSquad = teams => (teams || []).map(team =>
    team.name === offerData.team
      ? { ...team, squad: [...(team.squad || []).filter(item => item.id !== player.id), playerForCPU] }
      : team
  );
  const updatedRosters = { ...(state.teamRosters || {}) };
  if (buyerTeam?.id) {
    const currentRoster = updatedRosters[buyerTeam.id] || buyerTeam.squad || [];
    updatedRosters[buyerTeam.id] = [
      ...currentRoster.filter(item => item.id !== player.id), playerForCPU,
    ];
  }
  if (updatedRosters.user) updatedRosters.user = updatedRosters.user.filter(item => item.id !== player.id);
  return {
    ...state,
    players: updatedPlayers,
    club: {
      ...state.club,
      money: (state.club?.money || 0) + offerData.value,
      transferBudget: (state.club?.transferBudget || 0) + offerData.value,
      wage: Math.max(0, (state.club?.wage || 0) - (player.wage || 0)),
    },
    financialHistory: [transaction, ...(state.financialHistory || [])].slice(0, 50),
    inbox: (state.inbox || []).filter(message => message.id !== offerData.msgId),
    teamRosters: updatedRosters,
    teams: updateSquad(state.teams),
    leagues: {
      ...(state.leagues || {}),
      A: updateSquad(state.leagues?.A),
      B: updateSquad(state.leagues?.B),
      C: updateSquad(state.leagues?.C),
      D: updateSquad(state.leagues?.D),
    },
  };
}
export function findPlayerSaleOffer(inbox, playerId) {
  const message = (inbox || []).find(item =>
    item.actionData?.type === 'sell' && item.actionData?.player?.id === playerId
  );
  return message
    ? { team: message.from || message.sender, value: message.actionData.value, msgId: message.id }
    : null;
}

export function groupPlayersForSale(players, inbox) {
  const withOffer = [];
  const listed = [];
  const rest = [];
  const offerIds = new Set(
    (inbox || [])
      .filter(item => item.actionData?.type === 'sell')
      .map(item => item.actionData?.player?.id)
  );

  [...(players || [])]
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .forEach(player => {
      if (offerIds.has(player.id)) withOffer.push(player);
      else if (player.isListed) listed.push(player);
      else rest.push(player);
    });

  return { withOffer, listed, rest };
}


export function getNegotiationPreview(gameData, stalePlayer, offerPct) {
  if (!stalePlayer) return null;
  const fresh = resolveNegotiationPlayer(gameData, stalePlayer) || stalePlayer;
  const player = { ...fresh, teamName: stalePlayer.teamName };
  const minPct = player.teamName === 'Livre' ? 85 : 92;
  const offerVal = Math.round(player.value * offerPct / 100);
  const minVal = Math.round(player.value * minPct / 100);
  return { player, minPct, offerVal, minVal, aboveMin: offerPct >= minPct };
}

export function buildScoutAnalysis(gameData) {
  const myPlayers = gameData.players || [];
  const myOvr = myPlayers.length > 0
    ? Math.round(myPlayers.reduce((sum, player) => sum + (player.overall || 0), 0) / myPlayers.length)
    : 70;

  const allPositions = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'];
  const posCounts = Object.fromEntries(allPositions.map(position => [
    position,
    myPlayers.filter(player => matchesMarketPosition(player.position, position)).length,
  ]));
  const weakPos = allPositions
    .filter(position => (posCounts[position] || 0) < 3)
    .sort((a, b) => (posCounts[a] || 0) - (posCounts[b] || 0));

  const allSources = Array.from(new Map([
    ...(gameData.market || []),
    ...Object.values(gameData.teamRosters || {}).flatMap(roster => roster || []),
    ...(gameData.leagues?.A || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.B || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.C || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.D || []).flatMap(team => team.squad || []),
  ].filter(player => player && player.id && player.overall).map(player => [player.id, player])).values());

  const ownedIds = new Set(myPlayers.map(player => player.id));
  const budget = getTransferFunds(gameData).available;
  const recommendations = allSources
    .filter(player => !ownedIds.has(player.id))
    .map(player => {
      let score = 0;
      const positionUrgency = weakPos.indexOf(player.position);
      if (positionUrgency === 0) score += 40;
      else if (positionUrgency === 1) score += 25;
      else if (positionUrgency >= 0) score += 10;
      if (player.overall > myOvr + 5) score += 30;
      else if (player.overall > myOvr) score += 15;
      if (player.age <= 21) score += 20;
      if ((player.value || 0) <= budget * 0.3) score += 10;
      return { ...player, _score: score };
    })
    .filter(player => player._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 6);

  return { myOvr, myPlayersCount: myPlayers.length, budget, weakPos, recommendations };
}

export function getWatchlistPlayerState(gameData, watchItem) {
  const live = [
    ...(gameData.players || []),
    ...Object.values(gameData.teamRosters || {}).flatMap(roster => roster || []),
    ...(gameData.market || []),
    ...(gameData.teams || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.A || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.B || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.C || []).flatMap(team => team.squad || []),
    ...(gameData.leagues?.D || []).flatMap(team => team.squad || []),
  ].find(player => player?.id === watchItem.id);
  const isOwned = (gameData.players || []).some(player => player.id === watchItem.id);
  const price = Number(live?.value ?? watchItem.value) || 0;
  const funds = getTransferFunds(gameData);
  const afford = funds.cash >= price && (!funds.budgetLimited || funds.transferBudget >= price);
  return { live, isOwned, afford, price };
}

import { getContractStatus, getPlayerAvailability, getUpcomingRound } from '../core/playerStatus.js';

const POSITION_GROUPS = Object.freeze({
  gk: new Set(['GOL']),
  def: new Set(['LD', 'LE', 'LAT', 'ZAG']),
  mid: new Set(['VOL', 'MC', 'MEI']),
  att: new Set(['PD', 'PE', 'CA', 'ATA']),
});

export const SQUAD_SORT_OPTIONS = Object.freeze([
  { id: 'position', label: 'Posição' },
  { id: 'overall', label: 'Overall' },
  { id: 'energy', label: 'Energia' },
  { id: 'age', label: 'Idade' },
]);

export const POSITION_ORDER = Object.freeze({
  GOL: 10,
  LD: 20,
  LAT: 25,
  ZAG: 30,
  LE: 40,
  VOL: 50,
  MC: 60,
  MEI: 70,
  PD: 80,
  PE: 90,
  CA: 100,
  ATA: 100,
});

const number = (value) => Number(value) || 0;

export function getSquadGroup(players = [], groupId = 'all') {
  if (groupId === 'all') return [...players];
  if (groupId === 'starters') return players.filter((player) => player.isStarting);
  if (groupId === 'bench') return players.filter((player) => !player.isStarting);
  if (groupId === 'campo') return players.filter((player) => player.isStarting);
  const positions = POSITION_GROUPS[groupId];
  return positions ? players.filter((player) => positions.has(player.position)) : [...players];
}

export function sortSquadPlayers(players = [], sortBy = 'position') {
  return [...players].sort((a, b) => {
    if (sortBy === 'overall') return number(b.overall) - number(a.overall) || String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    if (sortBy === 'energy') return number(a.energy ?? 100) - number(b.energy ?? 100) || number(b.overall) - number(a.overall);
    if (sortBy === 'age') return number(a.age) - number(b.age) || number(b.overall) - number(a.overall);
    return (POSITION_ORDER[a.position] || 999) - (POSITION_ORDER[b.position] || 999)
      || number(b.overall) - number(a.overall)
      || String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
  });
}

export function decorateSquadPlayer(player, currentRound = 0) {
  const status = getPlayerAvailability(player, currentRound);
  return {
    player,
    status,
    yellows: number(player.discipline?.yellowCards),
    contract: getContractStatus(player.contract),
  };
}

function buildTabs(players, starters, bench) {
  return [
    { id: 'all', label: 'Todos', count: players.length },
    { id: 'starters', label: 'Titulares', count: starters.length },
    { id: 'campo', label: '⚽ Campo', count: starters.length },
    { id: 'bench', label: 'Reservas', count: bench.length },
    { id: 'gk', label: 'Goleiros', count: getSquadGroup(players, 'gk').length },
    { id: 'def', label: 'Defensores', count: getSquadGroup(players, 'def').length },
    { id: 'mid', label: 'Meio-Campo', count: getSquadGroup(players, 'mid').length },
    { id: 'att', label: 'Atacantes', count: getSquadGroup(players, 'att').length },
  ];
}

export function buildSquadViewModel(gameData = {}, groupTab = 'all', sortBy = 'position') {
  const players = gameData.players || [];
  const round = number(gameData.round);
  const currentRound = getUpcomingRound(gameData);
  const starters = players.filter((player) => player.isStarting);
  const bench = players.filter((player) => !player.isStarting);
  const decorated = players.map((player) => decorateSquadPlayer(player, currentRound));
  const injured = decorated.filter(({ status }) => status.injured);
  const suspended = decorated.filter(({ status }) => status.suspended);
  const unavailableIds = new Set(
    decorated.filter(({ status }) => status.unavailable).map(({ player }) => player.id),
  );
  const sortedGroup = sortSquadPlayers(getSquadGroup(players, groupTab), sortBy).map((player) => decorateSquadPlayer(player, currentRound));
  const sortedStarters = sortSquadPlayers(starters, sortBy).map((player) => decorateSquadPlayer(player, currentRound));
  const sortedBench = sortSquadPlayers(bench, sortBy).map((player) => decorateSquadPlayer(player, currentRound));
  const teamOvr = starters.length
    ? Math.round(starters.reduce((sum, player) => sum + number(player.overall), 0) / starters.length)
    : 0;

  return {
    clubName: gameData.club?.name || 'Meu Clube',
    serie: gameData.serie || '—',
    season: gameData.season || '—',
    round,
    currentRound,
    players,
    starters,
    bench,
    list: sortedGroup,
    starterRows: sortedStarters,
    benchRows: sortedBench,
    tabs: buildTabs(players, starters, bench),
    sortOptions: SQUAD_SORT_OPTIONS,
    formation: gameData.club?.formation || gameData.club?.managerProfile?.formation || '4-4-2',
    teamOvr,
    totalValue: players.reduce((sum, player) => sum + number(player.value), 0),
    injuredCount: injured.length,
    suspendedCount: suspended.length,
    unavailableCount: unavailableIds.size,
  };
}

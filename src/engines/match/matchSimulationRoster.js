import { diexDatabase } from '../../data/database.js';

const FALLBACK_POSITIONS = ['GOL', 'ZAG', 'ZAG', 'LD', 'LE', 'VOL', 'VOL', 'MC', 'MEI', 'CA', 'CA'];
const ATTACK_POSITIONS = new Set(['CA', 'PD', 'PE', 'MEI', 'ATA']);

const safeRandomIndex = (length, rng) => Math.min(Math.max(0, Math.floor(rng() * length)), Math.max(0, length - 1));

const createFallbackName = (index, rng) => {
  const firstNames = diexDatabase?.firstNames || [];
  const lastNames = diexDatabase?.lastNames || [];
  if (!firstNames.length || !lastNames.length) return `Jogador ${index + 1}`;
  const first = firstNames[safeRandomIndex(firstNames.length, rng)];
  const last = lastNames[safeRandomIndex(lastNames.length, rng)];
  return `${first} ${last}`;
};

export const createFallbackRoster = (team, rng = Math.random) => FALLBACK_POSITIONS.map((position, index) => ({
  id: `sim_${team?.id || 'team'}_${index + 1}`,
  name: createFallbackName(index, rng),
  position,
  overall: team?.strength || 70,
  energy: 100,
  isStarting: true,
  teamId: team?.id,
  teamName: team?.name,
}));

export const isSimulationPlayerAvailable = (player, round) => {
  if (!player || player.injury) return false;
  const suspendedUntil = player.discipline?.suspendedUntilRound;
  return suspendedUntil == null || round > suspendedUntil;
};

export const buildTeamRoster = ({ gameData, team, players, rng = Math.random }) => {
  if (team?.isPlayer) {
    return Array.isArray(players) ? players.map((player) => ({ ...player })) : [];
  }
  const stored = gameData?.teamRosters?.[team?.id];
  if (Array.isArray(stored) && stored.length) return stored.map((player) => ({ ...player }));
  if (Array.isArray(team?.squad) && team.squad.length) return team.squad.map((player) => ({ ...player }));
  return createFallbackRoster(team, rng);
};

export const buildActiveLineup = ({ team, roster, starters, round }) => {
  if (team?.isPlayer) {
    const requested = Array.isArray(starters) && starters.length
      ? starters
      : (roster || []).filter((player) => player.isStarting);
    return requested.filter((player) => isSimulationPlayerAvailable(player, round)).slice(0, 11).map((player) => ({ ...player }));
  }

  const available = (roster || []).filter((player) => isSimulationPlayerAvailable(player, round));
  let selected = available.filter((player) => player.isStarting).slice(0, 11);
  let selectedIds = new Set(selected.map((player) => player.id));

  // Se o goleiro titular estiver indisponível, prioriza um goleiro reserva.
  if (!selected.some((player) => player.position === 'GOL')) {
    const reserveGoalkeeper = available
      .filter((player) => player.position === 'GOL' && !selectedIds.has(player.id))
      .sort((a, b) => (b.overall || 0) - (a.overall || 0))[0];
    if (reserveGoalkeeper) {
      if (selected.length >= 11) selected = selected.slice(0, 10);
      selected = [...selected, reserveGoalkeeper];
      selectedIds = new Set(selected.map((player) => player.id));
    }
  }

  const outfieldFill = available
    .filter((player) => player.position !== 'GOL' && !selectedIds.has(player.id))
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .slice(0, Math.max(0, 11 - selected.length));
  selected = [...selected, ...outfieldFill];
  selectedIds = new Set(selected.map((player) => player.id));

  const emergencyFill = available
    .filter((player) => !selectedIds.has(player.id))
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .slice(0, Math.max(0, 11 - selected.length));
  return [...selected, ...emergencyFill].slice(0, 11).map((player) => ({ ...player }));
};

export const createSimulationRosters = ({ gameData, home, away, players, starters, rng = Math.random }) => {
  const round = (gameData?.round || 0) + 1;
  const homeRoster = buildTeamRoster({ gameData, team: home, players, rng });
  const awayRoster = buildTeamRoster({ gameData, team: away, players, rng });
  return {
    full: { home: homeRoster, away: awayRoster },
    active: {
      home: buildActiveLineup({ team: home, roster: homeRoster, starters, round }),
      away: buildActiveLineup({ team: away, roster: awayRoster, starters, round }),
    },
  };
};

export const pickRandomPlayer = (lineup, fallbackTeam, rng = Math.random) => {
  if (!Array.isArray(lineup) || lineup.length === 0) {
    return {
      id: `ghost_${fallbackTeam?.id || 'team'}`,
      name: fallbackTeam?.name || 'Jogador',
      position: 'CA',
      overall: fallbackTeam?.strength || 70,
      teamId: fallbackTeam?.id,
      teamName: fallbackTeam?.name,
    };
  }
  return lineup[safeRandomIndex(lineup.length, rng)];
};

export const pickScorer = (lineup, team, rng = Math.random) => {
  const attackers = (lineup || []).filter((player) => ATTACK_POSITIONS.has(player.position));
  const scorer = pickRandomPlayer(attackers.length ? attackers : lineup, team, rng);
  return {
    ...scorer,
    teamId: scorer.teamId || team?.id,
    teamName: scorer.teamName || team?.name,
  };
};

export const removeActivePlayer = (lineup, player) => {
  if (!player) return lineup || [];
  return (lineup || []).filter((candidate) => (
    player.id != null && String(player.id).trim() !== '' ? String(candidate.id) !== String(player.id) : candidate.name !== player.name
  ));
};

export const applyCpuSubstitutions = ({ activeLineup, fullRoster, count = 1, round = 0 }) => {
  const active = [...(activeLineup || [])];
  const activeIds = new Set(active.map((player) => player.id));
  const bench = (fullRoster || [])
    .filter((player) => !activeIds.has(player.id) && player.position !== 'GOL' && isSimulationPlayerAvailable(player, round))
    .sort((a, b) => (b.overall || 0) - (a.overall || 0));

  const outfield = active
    .filter((player) => player.position !== 'GOL')
    .sort((a, b) => (a.overall || 0) - (b.overall || 0));

  const changes = [];
  let next = active;
  const max = Math.min(count, bench.length, outfield.length);
  for (let index = 0; index < max; index += 1) {
    const outgoing = outfield[index];
    const incoming = bench[index];
    next = next.map((player) => (player.id === outgoing.id ? { ...incoming, isStarting: true } : player));
    changes.push({ outgoing, incoming });
  }
  return { lineup: next, changes };
};

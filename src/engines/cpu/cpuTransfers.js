import {
  CPU_MAX_SQUAD_SIZE,
  CPU_MIN_SQUAD_SIZE,
  CPU_TRADE_CHANCE,
  CPU_TRADE_INTERVAL,
  isTransferWindowOpen,
} from './cpuConfig.js';
import {
  applyCpuPurchaseFinance,
  applyCpuSaleFinance,
  canCpuBuyPlayer,
  getCpuPositionNeed,
  normalizeCpuPosition,
  resolveTeamRoster,
  syncTeamWithRoster,
} from './cpuRoster.js';

const SERIES_KEYS = Object.freeze(['A', 'B', 'C', 'D']);

function collectCpuTeams(leagues = {}) {
  return SERIES_KEYS.flatMap((serie) => (leagues?.[serie] || []).map((team) => ({ team, serie })))
    .filter(({ team }) => team && !team.isPlayer && team.id !== 'user');
}

function choose(items, rng) {
  if (!items.length) return null;
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

function transferCandidateScore(player, buyerNeed, buyerStrength) {
  const positionBonus = normalizeCpuPosition(player?.position) === buyerNeed ? 10 : 0;
  const qualityGap = Math.abs((Number(player?.overall) || 0) - buyerStrength);
  return positionBonus - qualityGap;
}

function pickTransferTarget(sellerRoster, buyerRoster, buyer, rng) {
  const buyerStrength = Number(buyer?.strength) || 70;
  const need = getCpuPositionNeed(buyerRoster);
  const available = (sellerRoster || []).filter((player) => {
    const overall = Number(player?.overall) || 0;
    const movable = !player?.isStarting && (player?.isListed || (player?.contract ?? 2) <= 1);
    const sensibleLevel = overall <= buyerStrength + 5 && overall >= buyerStrength - 12;
    return movable && sensibleLevel;
  });
  if (!available.length) return null;

  const ranked = [...available].sort((a, b) => transferCandidateScore(b, need, buyerStrength) - transferCandidateScore(a, need, buyerStrength));
  const shortlist = ranked.slice(0, Math.min(3, ranked.length));
  return choose(shortlist, rng);
}

function syncLeagueTeams(leagues = {}, teamById = new Map(), rosters = {}) {
  const next = {};
  SERIES_KEYS.forEach((serie) => {
    next[serie] = (leagues?.[serie] || []).map((team) => {
      const current = teamById.get(team.id) || team;
      const roster = rosters[current.id] || current.squad || [];
      return { ...current, squad: roster };
    });
  });
  return next;
}

export function releaseExpiredCpuPlayers(leagues = {}, teamRosters = {}) {
  const updatedRosters = { ...(teamRosters || {}) };
  const released = [];
  const seen = new Set();
  const teamById = new Map();

  collectCpuTeams(leagues).forEach(({ team }) => {
    const roster = resolveTeamRoster(team, updatedRosters);
    const kept = [];
    roster.forEach((player) => {
      if ((player?.contract ?? 2) <= 0) {
        const playerKey = player?.id == null ? null : String(player.id);
        if (playerKey && !seen.has(playerKey)) {
          seen.add(playerKey);
          released.push({
            ...player,
            previousTeam: team.name,
            originTeamId: null,
            originTeamName: null,
            teamId: null,
            teamName: 'Livre',
            isStarting: false,
            isListed: true,
          });
        }
      } else {
        kept.push(player);
      }
    });
    updatedRosters[team.id] = kept;
    teamById.set(team.id, kept.length === roster.length
      ? { ...team, squad: kept }
      : syncTeamWithRoster(team, kept));
  });

  return {
    leagues: syncLeagueTeams(leagues, teamById, updatedRosters),
    teamRosters: updatedRosters,
    freeAgents: released,
  };
}

export function processCpuToCpuTransfers(leagues = {}, teamRosters = {}, round = 1, rng = Math.random, transferContext = null) {
  if (!isTransferWindowOpen(transferContext || round) || Number(round) % CPU_TRADE_INTERVAL !== 0) {
    return { leagues, teamRosters };
  }

  const updatedRosters = { ...(teamRosters || {}) };
  const teamEntries = collectCpuTeams(leagues);
  const teamById = new Map(teamEntries.map(({ team }) => [team.id, { ...team }]));

  teamEntries.forEach(({ team: buyerOriginal }) => {
    if (rng() > CPU_TRADE_CHANCE) return;
    const buyer = teamById.get(buyerOriginal.id) || buyerOriginal;
    const buyerRoster = [...resolveTeamRoster(buyer, updatedRosters)];
    if (buyerRoster.length >= CPU_MAX_SQUAD_SIZE) return;

    const sellers = teamEntries
      .map(({ team }) => teamById.get(team.id) || team)
      .filter((seller) => seller.id !== buyer.id && resolveTeamRoster(seller, updatedRosters).length > CPU_MIN_SQUAD_SIZE);
    const seller = choose(sellers, rng);
    if (!seller) return;

    const sellerRoster = [...resolveTeamRoster(seller, updatedRosters)];
    const target = pickTransferTarget(sellerRoster, buyerRoster, buyer, rng);
    if (!target) return;

    const price = Math.max(0, Number(target.value) || 0);
    if (!canCpuBuyPlayer(buyer, price)) return;

    const nextSellerRoster = sellerRoster.filter((player) => player.id !== target.id);
    if (nextSellerRoster.length < CPU_MIN_SQUAD_SIZE) return;

    const transferred = {
      ...target,
      teamName: buyer.name,
      teamId: buyer.id,
      previousTeam: seller.name,
      isStarting: false,
      isListed: false,
      contract: Math.max(2, Number(target.contract) || 0),
    };
    const nextBuyerRoster = [...buyerRoster, transferred];

    updatedRosters[seller.id] = nextSellerRoster;
    updatedRosters[buyer.id] = nextBuyerRoster;
    teamById.set(seller.id, syncTeamWithRoster(applyCpuSaleFinance(seller, price), nextSellerRoster));
    teamById.set(buyer.id, syncTeamWithRoster(applyCpuPurchaseFinance(buyer, price), nextBuyerRoster));
  });

  return {
    leagues: syncLeagueTeams(leagues, teamById, updatedRosters),
    teamRosters: updatedRosters,
  };
}

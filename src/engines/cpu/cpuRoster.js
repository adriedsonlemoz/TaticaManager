import { CPU_MAX_SQUAD_SIZE, CPU_MIN_SQUAD_SIZE } from './cpuConfig.js';

const POSITION_TARGETS = Object.freeze({
  GOL: 2,
  ZAG: 4,
  LD: 2,
  LE: 2,
  VOL: 3,
  MC: 2,
  MEI: 2,
  PD: 1,
  PE: 1,
  CA: 3,
});

export function normalizeCpuPosition(position) {
  if (position === 'LAT') return 'LD';
  if (position === 'ATA') return 'CA';
  return position || 'CA';
}

export function cloneRoster(roster = []) {
  return Array.isArray(roster) ? roster.map((player) => ({ ...player })) : [];
}

export function resolveTeamRoster(team = {}, teamRosters = {}) {
  const stored = team?.id != null ? teamRosters?.[team.id] : null;
  if (Array.isArray(stored)) return stored;
  return Array.isArray(team?.squad) ? team.squad : [];
}

export function getCpuRosterStrength(roster = [], fallback = 70) {
  const valid = (roster || [])
    .filter((player) => Number.isFinite(Number(player?.overall)))
    .sort((a, b) => Number(b.overall) - Number(a.overall))
    .slice(0, 11);
  if (!valid.length) return Math.max(40, Math.min(99, Number(fallback) || 70));
  const average = valid.reduce((sum, player) => sum + Number(player.overall), 0) / valid.length;
  return Math.max(40, Math.min(99, Math.round(average)));
}

export function syncTeamWithRoster(team = {}, roster = []) {
  const nextRoster = Array.isArray(roster) ? roster : [];
  const rosterStrength = getCpuRosterStrength(nextRoster, team.strength || 70);
  return {
    ...team,
    squad: nextRoster,
    strength: Math.max(40, Math.min(99, Math.round((Number(team.strength) || rosterStrength) * 0.35 + rosterStrength * 0.65))),
  };
}

export function getCpuPositionNeed(roster = []) {
  const counts = {};
  (roster || []).forEach((player) => {
    const position = normalizeCpuPosition(player?.position);
    counts[position] = (counts[position] || 0) + 1;
  });

  // Primeiro garanta uma espinha mínima jogável. Sem isso a IA podia
  // contratar outro zagueiro antes de ter sequer um goleiro.
  if ((counts.GOL || 0) < 1) return 'GOL';
  if ((counts.ZAG || 0) < 2) return 'ZAG';
  if ((counts.LD || 0) < 1) return 'LD';
  if ((counts.LE || 0) < 1) return 'LE';
  if ((counts.CA || 0) < 1) return 'CA';

  const missing = Object.entries(POSITION_TARGETS)
    .map(([position, target]) => ({ position, deficit: Math.max(0, target - (counts[position] || 0)) }))
    .filter((entry) => entry.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit);

  if (missing.length) return missing[0].position;

  const leastCovered = Object.entries(POSITION_TARGETS)
    .map(([position, target]) => ({ position, ratio: (counts[position] || 0) / target }))
    .sort((a, b) => a.ratio - b.ratio);
  return leastCovered[0]?.position || 'CA';
}

export function canCpuBuyPlayer(team = {}, price = 0) {
  const amount = Math.max(0, Number(price) || 0);
  const hasMoney = Number.isFinite(Number(team.money));
  const hasBudget = Number.isFinite(Number(team.budget));
  if (hasMoney && Number(team.money) < amount) return false;
  if (hasBudget && Number(team.budget) < amount) return false;
  return true;
}

export function applyCpuPurchaseFinance(team = {}, price = 0) {
  const amount = Math.max(0, Number(price) || 0);
  return {
    ...team,
    ...(Number.isFinite(Number(team.money)) ? { money: Math.max(0, Number(team.money) - amount) } : {}),
    ...(Number.isFinite(Number(team.budget)) ? { budget: Math.max(0, Number(team.budget) - amount) } : {}),
  };
}

export function applyCpuSaleFinance(team = {}, price = 0) {
  const amount = Math.max(0, Number(price) || 0);
  return {
    ...team,
    ...(Number.isFinite(Number(team.money)) ? { money: Number(team.money) + amount } : {}),
    ...(Number.isFinite(Number(team.budget)) ? { budget: Number(team.budget) + amount } : {}),
  };
}

export function canCpuReceivePlayer(roster = []) {
  return (roster || []).length < CPU_MAX_SQUAD_SIZE;
}

export function canCpuSellPlayer(roster = []) {
  return (roster || []).length > CPU_MIN_SQUAD_SIZE;
}

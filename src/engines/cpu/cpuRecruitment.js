import { generatePlayer } from '../core/playerFactory.js';
import {
  CPU_BUY_CHANCE,
  CPU_MAX_RECRUITS_PER_ROUND,
  CPU_MAX_SQUAD_SIZE,
  CPU_MIN_SQUAD_SIZE,
  CPU_SERIE_BASE_OVR,
  isTransferWindowOpen,
} from './cpuConfig.js';
import {
  applyCpuPurchaseFinance,
  canCpuBuyPlayer,
  getCpuPositionNeed,
  resolveTeamRoster,
  syncTeamWithRoster,
} from './cpuRoster.js';

function getSigningCost(player = {}) {
  const valueFee = Math.round((Number(player.value) || 0) * 0.05);
  const wageFee = (Number(player.wage) || 0) * 6;
  return Math.max(0, valueFee, wageFee);
}

function shouldRecruit(team, roster, round, rng) {
  const lacking = roster.length < CPU_MIN_SQUAD_SIZE;
  if (lacking) return true;
  const seed = team?.id ? (String(team.id).charCodeAt(String(team.id).length - 1) || 0) : 0;
  return ((round + seed) % 4 === 0) && rng() < CPU_BUY_CHANCE * 0.4;
}

export function recruitCpuTeam(team = {}, teamRosters = {}, round = 1, serie = 'A', rng = Math.random, transferContext = null) {
  const roster = [...resolveTeamRoster(team, teamRosters)];
  const unchangedTeam = { ...team, squad: roster };
  if (!isTransferWindowOpen(transferContext || round) || roster.length >= CPU_MAX_SQUAD_SIZE) {
    return { team: unchangedTeam, roster, changed: false, recruits: [] };
  }
  if (!shouldRecruit(team, roster, round, rng)) return { team: unchangedTeam, roster, changed: false, recruits: [] };

  const lacking = roster.length < CPU_MIN_SQUAD_SIZE;
  const recruitCount = lacking
    ? Math.min(CPU_MAX_RECRUITS_PER_ROUND, CPU_MIN_SQUAD_SIZE - roster.length)
    : 1;
  const recruits = [];
  let currentTeam = { ...team };

  for (let index = 0; index < recruitCount; index += 1) {
    const position = getCpuPositionNeed(roster);
    const baseOverall = Number(currentTeam.strength) || CPU_SERIE_BASE_OVR[serie] || CPU_SERIE_BASE_OVR.A;
    const targetOverall = Math.max(40, baseOverall - 4 + Math.floor(rng() * 6));
    const player = generatePlayer(position, currentTeam.name, targetOverall, null, currentTeam.id, rng);
    if (!player) continue;

    const signingCost = getSigningCost(player);
    if (!canCpuBuyPlayer(currentTeam, signingCost)) continue;

    const recruit = {
      ...player,
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      isStarting: false,
      goals: 0,
      assists: 0,
      seasonGoals: 0,
      energy: 90 + Math.floor(rng() * 10),
      injury: null,
      isListed: false,
    };
    roster.push(recruit);
    recruits.push(recruit);
    currentTeam = applyCpuPurchaseFinance(currentTeam, signingCost);
  }

  return {
    team: syncTeamWithRoster(currentTeam, roster),
    roster,
    changed: recruits.length > 0,
    recruits,
  };
}

export function processTransferActivity(leagues = {}, teamRosters = {}, round = 1, rng = Math.random, transferContext = null) {
  const updatedRosters = { ...(teamRosters || {}) };
  if (!isTransferWindowOpen(transferContext || round)) {
    return { leagues, teamRosters: updatedRosters, activities:[] };
  }

  const activities = [];
  const processPool = (pool, serie) => (pool || []).map((team) => {
    if (team?.isPlayer || team?.id === 'user') return team;
    const result = recruitCpuTeam(team, updatedRosters, round, serie, rng, transferContext);
    updatedRosters[team.id] = result.roster;
    (result.recruits || []).forEach((player) => activities.push({
      type:'cpu-signing', serie, toTeamId:team.id, toTeamName:team.name,
      playerId:player.id, playerName:player.name, overall:Number(player.overall) || 0, price:0,
    }));
    return result.team;
  });

  return {
    leagues: {
      A: processPool(leagues?.A, 'A'),
      B: processPool(leagues?.B, 'B'),
      C: processPool(leagues?.C, 'C'),
      D: processPool(leagues?.D, 'D'),
    },
    teamRosters: updatedRosters,
    activities,
  };
}

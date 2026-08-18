// Recent form and CPU squad availability metrics.
import { DisciplineEngine } from '../engine_discipline.js';
import { getCpuRosterStrength } from '../cpu/cpuRoster.js';

const calcTeamRecentForm = (teamId, fixtures, round, maxGames) => {
  maxGames = maxGames || 5;
  const form = [];
  for (var r = round - 1; r >= 0 && form.length < maxGames; r--) {
    const rnd = fixtures[r];
    if (!rnd) continue;
    const m = rnd.find(function(mx) { return mx.home && mx.home.id === teamId || mx.away && mx.away.id === teamId; });
    if (!m || !m.played || !m.result) continue;
    const parts = (m.result || '0-0').split('-').map(function(n) { return parseInt(n) || 0; });
    const [hg, ag] = parts;
    const isHome = m.home && m.home.id === teamId;
    const myG = isHome ? hg : ag, oppG = isHome ? ag : hg;
    form.push(myG > oppG ? 'W' : myG < oppG ? 'L' : 'D');
  }
  return form;
};

// ── calcCPUAvailableStrength: força CPU ajustada por elenco (#19) ────────────
const calcCPUAvailableStrength = (team, teamRosters, currentRound) => {
  const base = team.strength || 70;
  const roster = (teamRosters && teamRosters[team.id]) || team.squad || [];
  if (!roster.length) return base;
  const rosterStrength = getCpuRosterStrength(roster, base);
  const effectiveBase = Math.round(base * 0.40 + rosterStrength * 0.60);
  const unavailable = roster.filter(function(p) {
    const injured = !!p.injury;
    const susp = DisciplineEngine
      ? DisciplineEngine.isPlayerSuspended(p, currentRound)
      : (p.discipline && p.discipline.suspendedUntilRound != null && currentRound <= p.discipline.suspendedUntilRound);
    return injured || susp;
  }).length;
  const penalty = Math.min(4, unavailable * 0.7);
  return Math.max(40, effectiveBase - penalty);
};


export { calcTeamRecentForm, calcCPUAvailableStrength };

import {
  GOAL_PHRASES,
  MATCH_SIMULATION_RATES,
  NEUTRAL_PHRASES,
  PENALTY_PHRASES,
  YELLOW_PHRASES,
  randomItem,
} from './matchSimulationConfig.js';
import {
  applyCpuSubstitutions,
  pickRandomPlayer,
  pickScorer,
  removeActivePlayer,
} from './matchSimulationRoster.js';

const playerKey = (player) => player?.id != null ? `id:${player.id}` : `name:${player?.name || 'unknown'}`;

export const registerMatchYellow = (yellowCounts, player) => {
  const key = playerKey(player);
  const previous = yellowCounts.get(key) || 0;
  const nextCount = previous + 1;
  yellowCounts.set(key, nextCount);
  return { count: nextCount, isSecondYellow: nextCount >= 2 };
};

const applyRedImpact = (runtime, side) => {
  if (side === 'home') {
    runtime.homeRed += 1;
    runtime.homeGoalProbability *= 0.88;
    runtime.awayGoalProbability *= 1.08;
  } else {
    runtime.awayRed += 1;
    runtime.awayGoalProbability *= 0.88;
    runtime.homeGoalProbability *= 1.08;
  }
};

const addGoal = ({ runtime, side, team, opponent, lineup, rng }) => {
  const scorer = pickScorer(lineup, team, rng);
  const ownGoal = rng() < MATCH_SIMULATION_RATES.ownGoalShare;
  if (ownGoal) {
    if (side === 'home') {
      runtime.awayGoals += 1;
      runtime.liveAwayGoals += 1;
    } else {
      runtime.homeGoals += 1;
      runtime.liveHomeGoals += 1;
    }
    runtime.events.push(`${runtime.minute}' 😬 GOL CONTRA! ${scorer.name} manda para dentro do próprio gol! (${team.name})`);
    runtime.rawEvents.push({
      min: runtime.minute,
      type: 'own_goal',
      teamId: opponent.id,
      teamName: opponent.name,
      isPlayer: opponent.isPlayer,
      ownGoal: true,
      ownGoalBy: scorer.name,
      ownGoalById: scorer.id ?? null,
      ownGoalByObj: { ...scorer },
      ownGoalTeamId: team.id,
      ownGoalTeamName: team.name,
    });
    return;
  }

  if (side === 'home') {
    runtime.homeGoals += 1;
    runtime.liveHomeGoals += 1;
  } else {
    runtime.awayGoals += 1;
    runtime.liveAwayGoals += 1;
  }
  runtime.events.push(`${runtime.minute}' ${randomItem(GOAL_PHRASES, rng)} ${team.name}! (${scorer.name})`);
  runtime.rawEvents.push({
    min: runtime.minute,
    type: 'goal',
    teamId: team.id,
    teamName: team.name,
    isPlayer: team.isPlayer,
    scorer: scorer.name,
    scorerObj: scorer,
  });
};

const addYellow = ({ runtime, side, team, rng }) => {
  const lineup = runtime.active[side];
  const player = pickRandomPlayer(lineup, team, rng);
  const yellows = runtime.yellowCounts[side];
  const yellow = registerMatchYellow(yellows, player);

  if (yellow.isSecondYellow) {
    runtime.events.push(`${runtime.minute}' 🟨🟥 SEGUNDO AMARELO! ${player.name} está EXPULSO! (${team.name})`);
    runtime.rawEvents.push({
      min: runtime.minute,
      type: 'red_second_yellow',
      teamId: team.id,
      isPlayer: team.isPlayer,
      playerName: player.name,
      playerId: player.id ?? null,
    });
    runtime.active[side] = removeActivePlayer(lineup, player);
    applyRedImpact(runtime, side);
    return;
  }

  runtime.events.push(`${runtime.minute}' ${randomItem(YELLOW_PHRASES, rng)} ${player.name} (${team.name})`);
  runtime.rawEvents.push({
    min: runtime.minute,
    type: 'yellow',
    teamId: team.id,
    isPlayer: team.isPlayer,
    playerName: player.name,
    playerId: player.id ?? null,
  });
};

const addDirectRed = ({ runtime, side, team, rng }) => {
  const lineup = runtime.active[side];
  const player = pickRandomPlayer(lineup, team, rng);
  runtime.events.push(`${runtime.minute}' 🟥 EXPULSO! Vermelho direto para ${player.name} (${team.name})`);
  runtime.rawEvents.push({
    min: runtime.minute,
    type: 'red_direct',
    teamId: team.id,
    isPlayer: team.isPlayer,
    playerName: player.name,
    playerId: player.id ?? null,
  });
  runtime.active[side] = removeActivePlayer(lineup, player);
  applyRedImpact(runtime, side);
};

const addPenalty = ({ runtime, home, away, strengths, rng }) => {
  const totalProbability = runtime.homeGoalProbability + runtime.awayGoalProbability;
  const homeShare = totalProbability > 0 ? runtime.homeGoalProbability / totalProbability : 0.5;
  const side = rng() < homeShare ? 'home' : 'away';
  const team = side === 'home' ? home : away;
  const teamStrength = side === 'home' ? strengths.homeStrength : strengths.awayStrength;
  const conversionRate = Math.min(0.92, Math.max(0.60, 0.75 + (teamStrength - 70) / 100));
  const converted = rng() < conversionRate;
  const phrase = randomItem(PENALTY_PHRASES, rng);

  if (!converted) {
    runtime.events.push(`${runtime.minute}' ${phrase} — 🧤 DEFENDIDO! Goleiro salva! (${team.name})`);
    runtime.rawEvents.push({ min: runtime.minute, type: 'penalty_saved', teamId: team.id, isPlayer: team.isPlayer });
    return;
  }

  const scorer = pickScorer(runtime.active[side], team, rng);
  runtime.events.push(`${runtime.minute}' ${phrase} — ⚽ CONVERTIDO por ${scorer.name}! (${team.name})`);
  if (side === 'home') {
    runtime.homeGoals += 1;
    runtime.liveHomeGoals += 1;
  } else {
    runtime.awayGoals += 1;
    runtime.liveAwayGoals += 1;
  }
  runtime.rawEvents.push({
    min: runtime.minute,
    type: 'penalty_goal',
    teamId: team.id,
    teamName: team.name,
    isPlayer: team.isPlayer,
    scorer: scorer.name,
    scorerObj: scorer,
  });
};

export const applyCpuTactics = ({ runtime, home, away }) => {
  const teams = [
    { side: 'home', team: home, goals: runtime.liveHomeGoals, opponentGoals: runtime.liveAwayGoals },
    { side: 'away', team: away, goals: runtime.liveAwayGoals, opponentGoals: runtime.liveHomeGoals },
  ];
  teams.forEach(({ side, team, goals, opponentGoals }) => {
    if (team?.isPlayer) return;
    const diff = goals - opponentGoals;
    const key = side === 'home' ? 'homeGoalProbability' : 'awayGoalProbability';
    if (diff <= -2) runtime[key] *= 1.25;
    else if (diff >= 2) runtime[key] *= 0.85;
  });
};

const maybeApplyCpuSubstitution = ({ runtime, side, team, fullRoster, round, rng }) => {
  if (team?.isPlayer || runtime.cpuSubsDone[side]) return;
  if (runtime.minute < 60 || runtime.minute > 75 || rng() >= MATCH_SIMULATION_RATES.cpuSubstitutionChance) return;

  const count = rng() < 0.5 ? 1 : 2;
  const substitution = applyCpuSubstitutions({
    activeLineup: runtime.active[side],
    fullRoster,
    count,
    round,
  });
  if (!substitution.changes.length) {
    runtime.cpuSubsDone[side] = true;
    return;
  }

  runtime.cpuSubsDone[side] = true;
  runtime.active[side] = substitution.lineup;
  const probabilityKey = side === 'home' ? 'homeGoalProbability' : 'awayGoalProbability';
  runtime[probabilityKey] = Math.min(runtime[probabilityKey] * (1 + substitution.changes.length * 0.02), 0.08);
  const detail = substitution.changes
    .map(({ incoming, outgoing }) => `${incoming.name} por ${outgoing.name}`)
    .join(' · ');
  runtime.events.push(`${runtime.minute}' 🔄 ${team.name}: ${detail}.`);
  runtime.rawEvents.push({
    min: runtime.minute,
    type: 'sub',
    teamId: team.id,
    teamName: team.name,
    isPlayer: team.isPlayer,
    changes: substitution.changes.map(({ incoming, outgoing }) => ({
      incomingId: incoming.id ?? null,
      incomingName: incoming.name,
      outgoingId: outgoing.id ?? null,
      outgoingName: outgoing.name,
    })),
  });
};

const maybeAddNeutralEvent = ({ runtime, home, away, rng }) => {
  if (rng() >= MATCH_SIMULATION_RATES.neutralEventChance) return;
  const phrase = randomItem(NEUTRAL_PHRASES, rng);
  const team = rng() < 0.5 ? home : away;
  runtime.events.push(`${runtime.minute}' ${phrase} (${team.name})`);
  runtime.rawEvents.push({ min: runtime.minute, type: 'neutral', teamId: team.id, teamName: team.name, isPlayer: team.isPlayer });
};

export const runMatchTimeline = ({
  gameData,
  home,
  away,
  strengths,
  rosters,
  rng = Math.random,
}) => {
  const runtime = {
    minute: 0,
    homeGoals: 0,
    awayGoals: 0,
    liveHomeGoals: 0,
    liveAwayGoals: 0,
    homeGoalProbability: strengths.homeGoalProbability,
    awayGoalProbability: strengths.awayGoalProbability,
    homeRed: 0,
    awayRed: 0,
    events: [],
    rawEvents: [],
    active: { home: [...rosters.active.home], away: [...rosters.active.away] },
    yellowCounts: { home: new Map(), away: new Map() },
    cpuSubsDone: { home: false, away: false },
  };
  const round = (gameData?.round || 0) + 1;

  for (let minute = 1; minute <= 90; minute += 1) {
    runtime.minute = minute;
    if (minute === 60) applyCpuTactics({ runtime, home, away });

    maybeApplyCpuSubstitution({ runtime, side: 'home', team: home, fullRoster: rosters.full.home, round, rng });
    maybeApplyCpuSubstitution({ runtime, side: 'away', team: away, fullRoster: rosters.full.away, round, rng });

    const roll = rng();
    const goalEnd = runtime.homeGoalProbability + runtime.awayGoalProbability;
    const homeYellowEnd = goalEnd + MATCH_SIMULATION_RATES.yellowPerTeamPerMinute;
    const awayYellowEnd = homeYellowEnd + MATCH_SIMULATION_RATES.yellowPerTeamPerMinute;

    if (roll < runtime.homeGoalProbability) {
      addGoal({ runtime, side: 'home', team: home, opponent: away, lineup: runtime.active.home, rng });
    } else if (roll < goalEnd) {
      addGoal({ runtime, side: 'away', team: away, opponent: home, lineup: runtime.active.away, rng });
    } else if (roll < homeYellowEnd) {
      addYellow({ runtime, side: 'home', team: home, rng });
    } else if (roll < awayYellowEnd) {
      addYellow({ runtime, side: 'away', team: away, rng });
    } else if (roll > 1 - MATCH_SIMULATION_RATES.directRedPerMinuteTotal) {
      const side = rng() < 0.5 ? 'home' : 'away';
      addDirectRed({ runtime, side, team: side === 'home' ? home : away, rng });
    } else if (
      roll > 1 - MATCH_SIMULATION_RATES.directRedPerMinuteTotal - MATCH_SIMULATION_RATES.penaltyPerMinuteTotal
      && roll <= 1 - MATCH_SIMULATION_RATES.directRedPerMinuteTotal
    ) {
      addPenalty({ runtime, home, away, strengths, rng });
    } else {
      maybeAddNeutralEvent({ runtime, home, away, rng });
    }
  }

  runtime.events.push(`90'+ FIM DE JOGO: ${home.name} ${runtime.homeGoals} x ${runtime.awayGoals} ${away.name}`);
  runtime.rawEvents.push({ min: 90, type: 'end', homeGoals: runtime.homeGoals, awayGoals: runtime.awayGoals });
  return {
    homeGoals: runtime.homeGoals,
    awayGoals: runtime.awayGoals,
    events: runtime.events,
    rawEvents: runtime.rawEvents,
  };
};

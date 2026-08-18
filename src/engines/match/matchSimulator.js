import { createSimulationRosters } from './matchSimulationRoster.js';
import { resolveMatchStrengths } from './matchSimulationStrength.js';
import { runMatchTimeline } from './matchSimulationEvents.js';
import { buildMatchStatistics } from './matchSimulationStats.js';

const hasPlayerId = (value) => value != null && String(value).trim() !== '';

// Motor puro de simulação de uma partida.
// O sexto argumento é opcional e preserva compatibilidade com os consumidores antigos.
export const simulateMatch = (gameData, match, tactics, starters, players, options = {}) => {
  const rng = typeof options === 'function' ? options : (options.rng || Math.random);
  const home = match.home;
  const away = match.away;

  const rosters = createSimulationRosters({
    gameData,
    home,
    away,
    players,
    starters,
    rng,
  });

  const strengths = resolveMatchStrengths({
    gameData,
    home,
    away,
    tactics,
    starters,
  });

  const timeline = runMatchTimeline({
    gameData,
    home,
    away,
    strengths,
    rosters,
    rng,
  });

  const statistics = buildMatchStatistics({
    homeGoals: timeline.homeGoals,
    awayGoals: timeline.awayGoals,
    adjustedHomeStrength: strengths.adjustedHomeStrength,
    adjustedAwayStrength: strengths.adjustedAwayStrength,
    rng,
  });

  return {
    ...timeline,
    ...statistics,
    rosters: {
      home: rosters.full.home.map((player) => ({ ...player })),
      away: rosters.full.away.map((player) => ({ ...player })),
    },
    activeLineups: {
      home: rosters.active.home.map((player) => player.id).filter(hasPlayerId),
      away: rosters.active.away.map((player) => player.id).filter(hasPlayerId),
    },
  };
};

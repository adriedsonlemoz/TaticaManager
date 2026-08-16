import { buildMatchRoundContext } from './matchRoundContext.js';

export function progressAcademy(gameData, { leagueIdx = null, rng = Math.random } = {}) {
  if (!gameData.academy?.length) return gameData.academy;

  const { leagueRoundPlayed } = buildMatchRoundContext(gameData, leagueIdx);
  if (leagueRoundPlayed % 8 !== 0) return gameData.academy;

  const level = gameData.club?.academyLevel || 'basic';
  const bonus = { basic: 0.3, advanced: 0.5, elite: 0.8 }[level] || 0.3;

  return gameData.academy.map((player) => {
    const gap = Math.max(0, (player.potential || 70) - (player.overall || 50));
    if (gap <= 0) return player;

    const chance = player.trajectory === 'burst' ? 0.5 + bonus
      : player.trajectory === 'late' ? 0.2 + bonus * 0.5
        : 0.35 + bonus * 0.7;

    return rng() < chance
      ? { ...player, overall: Math.min(player.potential || 70, (player.overall || 50) + 1) }
      : player;
  });
}

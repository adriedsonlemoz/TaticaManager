import { CpuAI } from '../engine_cpu_ai.js';
import { generatePlayer } from '../engine.js';
import { buildMatchRoundContext } from './matchRoundContext.js';

export function processCpuTransfers(gameData, { leagueIdx = null } = {}) {
  const { leagueRoundPlayed } = buildMatchRoundContext(gameData, leagueIdx);
  const activity = CpuAI?.processTransferActivity
    ? CpuAI.processTransferActivity(gameData.leagues, gameData.teamRosters, leagueRoundPlayed)
    : null;

  if (!activity || !CpuAI?.processCpuToCpuTransfers) return activity;
  if (CpuAI?.isTransferWindowOpen && !CpuAI.isTransferWindowOpen(leagueRoundPlayed)) return activity;
  return CpuAI.processCpuToCpuTransfers(activity.leagues, activity.teamRosters, leagueRoundPlayed);
}

export function refreshTransferMarket(gameData, { leagueIdx = null, rng = Math.random } = {}) {
  const previousMarket = gameData.market || [];
  const serie = gameData.serie || 'A';
  const minOvr = serie === 'A' ? 68 : serie === 'B' ? 62 : serie === 'C' ? 55 : 48;
  const maxOvr = serie === 'A' ? 82 : serie === 'B' ? 74 : serie === 'C' ? 66 : 56;
  const { leagueRoundPlayed } = buildMatchRoundContext(gameData, leagueIdx);

  const makePlayer = () => {
    const overall = minOvr + Math.floor(rng() * (maxOvr - minOvr + 1));
    return generatePlayer ? generatePlayer(null, 'Livre', overall) : null;
  };

  const result = previousMarket
    .map((player) => (!player || rng() < 0.35) ? makePlayer() : player)
    .filter(Boolean);

  if (leagueRoundPlayed % 5 === 0 && result.length > 0) {
    const indices = [...Array(result.length).keys()]
      .sort(() => rng() - 0.5)
      .slice(0, 3);
    indices.forEach((index) => {
      const player = makePlayer();
      if (player) result[index] = player;
    });
  }

  if (leagueRoundPlayed % 8 === 0 && CpuAI?.getFreeAgentsFromExpiredContracts && result.length > 0) {
    const freeAgents = CpuAI.getFreeAgentsFromExpiredContracts(gameData.leagues, gameData.teamRosters);
    freeAgents.forEach((freeAgent) => {
      const worstIndex = result.reduce((best, player, index) =>
        (player?.overall || 99) < (result[best]?.overall || 99) ? index : best, 0);
      if ((freeAgent.overall || 0) > (result[worstIndex]?.overall || 0)) {
        result[worstIndex] = { ...freeAgent, teamName: 'Livre' };
      }
    });
  }

  return result;
}

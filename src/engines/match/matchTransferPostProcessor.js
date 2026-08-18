import { CpuAI } from '../engine_cpu_ai.js';
import { generatePlayer } from '../engine.js';
import { buildMatchRoundContext } from './matchRoundContext.js';

export function processCpuTransfers(gameData, { leagueIdx = null, rng = Math.random } = {}) {
  const { leagueRoundPlayed } = buildMatchRoundContext(gameData, leagueIdx);
  const released = CpuAI?.releaseExpiredCpuPlayers
    ? CpuAI.releaseExpiredCpuPlayers(gameData.leagues, gameData.teamRosters)
    : { leagues: gameData.leagues, teamRosters: gameData.teamRosters, freeAgents: [] };

  const activity = CpuAI?.processTransferActivity
    ? CpuAI.processTransferActivity(released.leagues, released.teamRosters, leagueRoundPlayed, rng)
    : released;

  if (!activity || !CpuAI?.processCpuToCpuTransfers) {
    return { ...activity, freeAgents: released.freeAgents || [] };
  }
  if (CpuAI?.isTransferWindowOpen && !CpuAI.isTransferWindowOpen(leagueRoundPlayed)) {
    return { ...activity, freeAgents: released.freeAgents || [] };
  }

  const trades = CpuAI.processCpuToCpuTransfers(activity.leagues, activity.teamRosters, leagueRoundPlayed, rng);
  return { ...trades, freeAgents: released.freeAgents || [] };
}

export function refreshTransferMarket(gameData, {
  leagueIdx = null,
  rng = Math.random,
  extraFreeAgents = [],
} = {}) {
  const previousMarket = gameData.market || [];
  const serie = gameData.serie || 'A';
  const minOvr = serie === 'A' ? 68 : serie === 'B' ? 62 : serie === 'C' ? 55 : 48;
  const maxOvr = serie === 'A' ? 82 : serie === 'B' ? 74 : serie === 'C' ? 66 : 56;
  const { leagueRoundPlayed } = buildMatchRoundContext(gameData, leagueIdx);

  const makePlayer = () => {
    const overall = minOvr + Math.floor(rng() * (maxOvr - minOvr + 1));
    const player = generatePlayer ? generatePlayer(null, 'Livre', overall, null, null, rng) : null;
    return player ? {
      ...player,
      teamName: 'Livre',
      teamId: null,
      originTeamId: null,
      originTeamName: null,
      isStarting: false,
      isListed: true,
    } : null;
  };

  // Jogadores que efetivamente deixaram um clube por fim de contrato não são
  // parte da vitrine aleatória. O refresh automático pode trocar apenas os
  // agentes gerados, nunca apagar o histórico de um atleta liberado.
  const releasedMarket = previousMarket.filter((player) => Boolean(player?.previousTeam));
  const generatedMarket = previousMarket.filter((player) => !player?.previousTeam);
  const refreshedGenerated = generatedMarket
    .map((player) => (!player || rng() < 0.35) ? makePlayer() : player)
    .filter(Boolean);

  if (leagueRoundPlayed % 5 === 0 && refreshedGenerated.length > 0) {
    const indices = [...Array(refreshedGenerated.length).keys()]
      .sort(() => rng() - 0.5)
      .slice(0, 3);
    indices.forEach((index) => {
      const player = makePlayer();
      if (player) refreshedGenerated[index] = player;
    });
  }

  const freeAgents = [...(extraFreeAgents || [])];
  if (leagueRoundPlayed % 8 === 0 && CpuAI?.getFreeAgentsFromExpiredContracts) {
    freeAgents.push(...CpuAI.getFreeAgentsFromExpiredContracts(gameData.leagues, gameData.teamRosters));
  }

  const result = [];
  const seen = new Set();
  const appendUniqueFree = (player) => {
    const key = player?.id == null ? null : String(player.id);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push({
      ...player,
      teamName: 'Livre',
      teamId: null,
      originTeamId: null,
      originTeamName: null,
      isStarting: false,
      isListed: true,
    });
  };

  releasedMarket.forEach(appendUniqueFree);
  refreshedGenerated.forEach(appendUniqueFree);
  // Todos os liberados entram no mercado, independentemente de OVR. A regra
  // antiga descartava atletas abaixo do pior jogador da vitrine.
  freeAgents.forEach(appendUniqueFree);
  return result;
}

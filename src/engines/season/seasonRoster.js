import { generatePlayer } from '../core/playerFactory.js';
import { applySeasonEvolution } from '../core/playerDevelopment.js';

const BASE_OVR = Object.freeze({ A: 72, B: 65, C: 58, D: 47 });

export function advanceUserRoster(prevState = {}, newSerie = 'A', clubName = null, rng = Math.random) {
  const rawPlayers = (prevState.players || []).map((player) => {
    const newAge = (player.age ?? 25) + 1;

    if (newAge >= 42) return null;
    if (newAge >= 38 && !player.isStarting) return null;

    let ovrDecay = 0;
    if (newAge >= 36) ovrDecay = rng() < 0.70 ? 2 : 1;
    else if (newAge >= 34) ovrDecay = rng() < 0.50 ? 1 : 0;
    else if (newAge >= 32) ovrDecay = rng() < 0.25 ? 1 : 0;

    return {
      ...player,
      age: newAge,
      overall: Math.max(50, (player.overall || 60) - ovrDecay),
      wage: Math.round((player.wage || 2000) * 1.08 / 500) * 500,
      energy: 100,
      injury: null,
      contract: Math.max(0, (player.contract ?? 1) - 1),
      discipline: {
        ...(player.discipline || {}),
        yellowCards: 0,
        suspendedUntilRound: null,
      },
    };
  }).filter(Boolean).filter((player) => (player.contract || 0) > 0 || player.isStarting);

  const updatedPlayers = applySeasonEvolution(rawPlayers, prevState.scorers || {}, rng);
  const targetClubName = clubName || prevState.club?.name || 'Meu Clube';

  while (updatedPlayers.length < 18) {
    const generated = generatePlayer(null, targetClubName, BASE_OVR[newSerie] || 58);
    if (!generated) break;
    updatedPlayers.push({ ...generated, teamId: 'user', teamName: targetClubName });
  }

  return updatedPlayers.map((player) => ({
    ...player,
    teamId: 'user',
    teamName: targetClubName,
  }));
}

export function calculateSquadWage(players = []) {
  return players.reduce((sum, player) => sum + (Number(player.wage) || 0), 0);
}

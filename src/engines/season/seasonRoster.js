import { generatePlayer } from '../core/playerFactory.js';
import { applySeasonEvolution } from '../core/playerDevelopment.js';
import { normalizeFreeAgent } from '../market/marketIntegrity.js';

const BASE_OVR = Object.freeze({ A: 72, B: 65, C: 58, D: 47 });

export function advanceUserRosterWithDepartures(prevState = {}, newSerie = 'A', clubName = null, rng = Math.random) {
  const departures = [];
  const rawPlayers = [];

  (prevState.players || []).forEach((player) => {
    const rawAge = Number(player.age);
    const newAge = (Number.isFinite(rawAge) ? rawAge : 25) + 1;
    if (newAge >= 42 || (newAge >= 38 && !player.isStarting)) return;

    let ovrDecay = 0;
    if (newAge >= 36) ovrDecay = rng() < 0.70 ? 2 : 1;
    else if (newAge >= 34) ovrDecay = rng() < 0.50 ? 1 : 0;
    else if (newAge >= 32) ovrDecay = rng() < 0.25 ? 1 : 0;

    const advanced = {
      ...player,
      age: newAge,
      overall: Math.max(50, (player.overall || 60) - ovrDecay),
      wage: Math.round((player.wage || 2000) * 1.08 / 500) * 500,
      energy: 100,
      injury: null,
      contract: Math.max(0, (Number.isFinite(Number(player.contract)) ? Number(player.contract) : 1) - 1),
      discipline: {
        ...(player.discipline || {}),
        yellowCards: 0,
        suspendedUntilRound: null,
      },
    };

    if (advanced.contract <= 0) {
      departures.push(normalizeFreeAgent({
        ...advanced,
        previousTeam: prevState.club?.name || player.teamName || null,
        goals: 0,
        assists: 0,
        seasonGoals: 0,
      }));
      return;
    }
    rawPlayers.push(advanced);
  });

  const updatedPlayers = applySeasonEvolution(rawPlayers, prevState.scorers || {}, rng);
  const targetClubName = clubName || prevState.club?.name || 'Meu Clube';

  while (updatedPlayers.length < 18) {
    const generated = generatePlayer(null, targetClubName, BASE_OVR[newSerie] || 58, null, 'user', rng);
    if (!generated) break;
    updatedPlayers.push({ ...generated, teamId: 'user', teamName: targetClubName });
  }

  return {
    players: updatedPlayers.map((player) => ({
      ...player,
      teamId: 'user',
      teamName: targetClubName,
    })),
    departures,
  };
}

export function advanceUserRoster(prevState = {}, newSerie = 'A', clubName = null, rng = Math.random) {
  return advanceUserRosterWithDepartures(prevState, newSerie, clubName, rng).players;
}

export function calculateSquadWage(players = []) {
  return players.reduce((sum, player) => sum + (Number(player.wage) || 0), 0);
}

import { FatigueEngine } from '../engine_fatigue.js';
import { InjuryEngine } from '../engine_injuries.js';

const safeRound = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
};

const appendInjuryHistory = (player, injury, round) => ({
  ...player,
  injuryHistory: [
    ...(Array.isArray(player?.injuryHistory) ? player.injuryHistory : []),
    {
      round: safeRound(round),
      type: injury?.type || 'Lesão',
      duration: Math.max(1, Number(injury?.roundsLeft) || 1),
      recaida: Boolean(injury?.recaida),
    },
  ].slice(-30),
});

export function processFatigueAndInjuries(players, events, opts = {}) {
  if (!Array.isArray(players)) return players;
  const {
    difficultyMult = 1.0,
    injuryChanceMult = 1.0,
    isCupMatch = false,
    currentRound = 0,
    matchMinutes = {},
  } = opts;

  return players.map((player) => {
    const playerKey = player?.id == null ? null : String(player.id);
    const explicitMinutes = playerKey == null ? null : Number(matchMinutes?.[playerKey]);
    const playedMinutes = Number.isFinite(explicitMinutes)
      ? Math.max(0, Math.min(120, explicitMinutes))
      : (player.isStarting ? 90 : 0);
    let injury = player.injury;
    if (injury) {
      const recovered = InjuryEngine?.processRecovery
        ? InjuryEngine.processRecovery(injury)
        : (injury.roundsLeft > 1 ? { ...injury, roundsLeft: injury.roundsLeft - 1 } : null);

      if (!recovered && InjuryEngine?.rollRecaida) {
        injury = InjuryEngine.rollRecaida(injury) || null;
      } else {
        injury = recovered;
      }
    }

    const energy = FatigueEngine?.calculateNewEnergy
      ? FatigueEngine.calculateNewEnergy(player, { difficultyMult, isCupMatch, minutes: playedMinutes })
      : Math.min(100, Math.max(0, (player.energy ?? 100) + (player.isStarting ? -15 : 12)));

    if (!injury && playedMinutes > 0) {
      const minutes = playedMinutes;
      const lastName = String(player.name || '').split(' ').pop();
      const tookFoul = Array.isArray(events) && events.some((event) => (
        typeof event === 'string' && lastName && event.includes(lastName) && event.includes('🟨')
      ));
      const context = energy < 35 ? 'fatigue' : tookFoul ? 'falta' : 'normal';
      const rolledInjury = InjuryEngine?.rollForInjury
        ? InjuryEngine.rollForInjury(energy, injuryChanceMult, minutes, context)
        : null;

      if (rolledInjury) {
        injury = rolledInjury;
        const withInjury = { ...player, energy, injury };
        if (InjuryEngine?.addToHistory) {
          return InjuryEngine.addToHistory(withInjury, rolledInjury, safeRound(currentRound));
        }
        return appendInjuryHistory(withInjury, rolledInjury, currentRound);
      }
    }

    return { ...player, energy, injury };
  });
}

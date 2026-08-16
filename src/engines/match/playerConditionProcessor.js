import { FatigueEngine } from '../engine_fatigue.js';
import { InjuryEngine } from '../engine_injuries.js';

export function processFatigueAndInjuries(players, events, opts = {}) {
  if (!players) return players;
  const { difficultyMult = 1.0, isCupMatch = false } = opts;

  return players.map((player) => {
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
      ? FatigueEngine.calculateNewEnergy(player, { difficultyMult, isCupMatch })
      : Math.min(100, Math.max(0, (player.energy ?? 100) + (player.isStarting ? -15 : 12)));

    if (!injury && player.isStarting) {
      const minutes = player.minutesPlayed || 0;
      const lastName = String(player.name || '').split(' ').pop();
      const tookFoul = Array.isArray(events) && events.some((event) => (
        typeof event === 'string' && lastName && event.includes(lastName) && event.includes('🟨')
      ));
      const context = energy < 35 ? 'fatigue' : tookFoul ? 'falta' : 'normal';
      const rolledInjury = InjuryEngine?.rollForInjury
        ? InjuryEngine.rollForInjury(energy, difficultyMult, minutes, context)
        : null;

      if (rolledInjury) {
        injury = rolledInjury;
        if (InjuryEngine?.addToHistory) {
          return InjuryEngine.addToHistory(
            { ...player, energy, injury },
            rolledInjury,
            player._currentRound || 0,
          );
        }
      }
    }

    return { ...player, energy, injury };
  });
}

// @migrated to ES module
// engines/engine_injuries.js — Sistema de Lesões e Departamento Médico v1.1
// FIX 4.1: recoveryMod por tipo — lesoes graves recuperam mais devagar.
// FIX 4.2: rollForInjury aceita context (4o param) — 'falta' e 'fatigue' aumentam chance/gravidade.

export const InjuryEngine = {
  // Tipos de lesão, duração e modificador de recuperação
  // recoveryMod: multiplicador sobre roundsLeft a cada rodada (< 1 = recupera mais devagar)
  TYPES: [
    { name: 'Leve (Torcao)',     minRounds: 1, maxRounds: 2, chance: 0.70, recoveryMod: 1.0  },
    { name: 'Media (Muscular)',  minRounds: 2, maxRounds: 4, chance: 0.25, recoveryMod: 0.85 },
    { name: 'Grave (Ruptura)',   minRounds: 5, maxRounds: 9, chance: 0.05, recoveryMod: 0.70 },
  ],

  /**
   * FIX 4.2: rollForInjury(energy, injuryChanceMult, minutes, context)
   * context: 'normal' | 'fatigue' | 'falta'
   *   - 'fatigue': jogador exausto (energy < 35) — aumenta chance e tende a lesoes medias
   *   - 'falta':   sofreu cartao amarelo — aumenta chance e pode puxar lesao mais grave
   */
  rollForInjury: (energy, gameDataOrMult, minutes, context) => {
    let baseChance = 0.005;
    if (energy < 70) baseChance = 0.05;
    if (energy < 35) baseChance = 0.15;

    const mult = typeof gameDataOrMult === 'number'
      ? gameDataOrMult
      : (gameDataOrMult?.difficultyMultipliers?.injuryChance ?? 1);

    // FIX 4.2: ajuste de chance por contexto
    const ctx = context || 'normal';
    if (ctx === 'fatigue') baseChance *= 1.30; // cansaco extremo = +30% chance
    if (ctx === 'falta')   baseChance *= 1.20; // falta recebida  = +20% chance

    baseChance *= mult;

    if (Math.random() < baseChance) {
      const roll = Math.random();
      let selectedType = InjuryEngine.TYPES[0];

      // FIX 4.2: context influencia gravidade do roll
      if (ctx === 'falta') {
        // Falta violenta puxa para lesoes mais graves
        if (roll > 0.60) selectedType = InjuryEngine.TYPES[1];
        if (roll > 0.88) selectedType = InjuryEngine.TYPES[2];
      } else if (ctx === 'fatigue') {
        // Cansaco extremo: tende a lesao media
        if (roll > 0.55) selectedType = InjuryEngine.TYPES[1];
        if (roll > 0.93) selectedType = InjuryEngine.TYPES[2];
      } else {
        if (roll > 0.70) selectedType = InjuryEngine.TYPES[1];
        if (roll > 0.95) selectedType = InjuryEngine.TYPES[2];
      }

      const duration = Math.floor(Math.random() * (selectedType.maxRounds - selectedType.minRounds + 1))
        + selectedType.minRounds;

      return {
        type:        selectedType.name,
        roundsLeft:  duration,
        recoveryMod: selectedType.recoveryMod,
      };
    }

    return null;
  },

  /**
   * FIX 4.1: processRecovery leva em conta recoveryMod.
   * Lesoes graves (recoveryMod < 1) tem chance de NAO reduzir roundsLeft em algumas rodadas,
   * simulando recuperacao mais lenta sem alterar a duracao nominal.
   */
  processRecovery: (injury) => {
    if (!injury) return null;
    const mod = injury.recoveryMod ?? 1.0;
    // Se mod < 1, ha chance de a rodada "nao contar" na recuperacao
    const recovers = Math.random() < mod;
    const remaining = recovers ? injury.roundsLeft - 1 : injury.roundsLeft;
    if (remaining <= 0) return null; // Curado!
    return { ...injury, roundsLeft: remaining };
  },
};
export default InjuryEngine;

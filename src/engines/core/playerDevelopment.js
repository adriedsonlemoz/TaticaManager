// End-of-season player progression and regression.
import { FatigueEngine } from '../engine_fatigue.js';

const applySeasonEvolution = (players, scorers, rng = Math.random) => {
  return players.map(function(p) {
    const goals   = p.seasonGoals || 0;
    const assists = p.assists     || 0;
    const energy  = p.energy      != null ? p.energy : 100;
    const fatMult = FatigueEngine?.getEvolutionFatigueMultiplier
      ? FatigueEngine.getEvolutionFatigueMultiplier(energy)
      : 1.0;

    let evoChance = 0;
    if (['CA','PD','PE'].includes(p.position))              evoChance = goals >= 10 ? 0.80 : goals >= 5 ? 0.55 : goals >= 2 ? 0.30 : 0.08;
    else if (p.position === 'MEI')                           evoChance = (goals + assists) >= 8 ? 0.70 : (goals + assists) >= 4 ? 0.45 : 0.12;
    else if (['VOL','MC'].includes(p.position))              evoChance = assists >= 4 ? 0.50 : 0.15;
    else if (['ZAG','LD','LE'].includes(p.position))         evoChance = 0.18;
    // compat saves antigos
    else if (p.position === 'ATA')                           evoChance = goals >= 10 ? 0.80 : goals >= 5 ? 0.55 : goals >= 2 ? 0.30 : 0.08;
    else if (p.position === 'LAT')                           evoChance = 0.18;
    else evoChance = 0.12;

    // FEATURE: progressão de jovens — bônus escalonado por idade
    // ≤ 18 → +25% | 19-20 → +18% | 21 → +10% | 32+ → penalidade
    if      (p.age <= 18) evoChance += 0.25;
    else if (p.age <= 20) evoChance += 0.18;
    else if (p.age <= 21) evoChance += 0.10;
    else if (p.age >= 32) evoChance -= 0.10;

    if (p.overall >= 88) evoChance *= 0.3;
    else if (p.overall >= 82) evoChance *= 0.6;
    evoChance = Math.max(0, evoChance * fatMult);

    // Jovens excepcionais (≤ 20 com boa performance) podem ganhar +2 OVR
    let evoPoints = 1;
    if (p.age <= 20 && evoChance > 0.6 && rng() < 0.25) evoPoints = 2;

    const evolved    = p.overall < 99 && rng() < evoChance;
    const valueBonus = evolved ? (evoPoints >= 2 ? 1.15 : 1.08) : (goals >= 5 || assists >= 4 ? 1.04 : 1.0);

    // Veteranos (≥ 32) podem regredir
    let regression = 0;
    if (p.age >= 34 && p.overall > 65 && rng() < 0.35) regression = 1;
    else if (p.age >= 32 && p.overall > 70 && rng() < 0.15) regression = 1;

    return {
      ...p,
      overall:      Math.max(40, Math.min(99,
        evolved ? p.overall + evoPoints : p.overall - regression
      )),
      value:        Math.round((p.value || 50000) * valueBonus),
      seasonGoals:  0,
      assists:      0,
      minutesPlayed: 0,
    };
  });
};


export { applySeasonEvolution };

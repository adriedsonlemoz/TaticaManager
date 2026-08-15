// @migrated to ES module
// engines/engine_fatigue.js — v2.0
// ╔══════════════════════════════════════════════════════════════╗
// ║  Sistema de Desgaste Físico integrado ao roadmap vFINAL     ║
// ║  #26 Fadiga automática | #27 Energia afeta OVR              ║
// ║  #28 minutesPlayed | #29 desgaste por intensidade           ║
// ║  #30 multiplicador por posição | #31 baixa energia→lesão    ║
// ║  #33 recuperação base | #37 fadiga impacta evolução         ║
// ║  #38 fadiga impacta valor | #44 dificuldade afeta desgaste  ║
// ╚══════════════════════════════════════════════════════════════╝

export const FatigueEngine = {

  CONSTANTS: {
    LOSS_STARTER_MIN:  12,
    LOSS_STARTER_MAX:  22,
    RECOVERY_BENCH:    15,
    RECOVERY_INJURED:  20,
    CRITICAL_LEVEL:    30,
    WARNING_LEVEL:     70,
  },

  // ── Multiplicador de desgaste por posição (#30) ──────────────
  // Atacantes e Laterais correm mais → desgastam mais rápido
  POSITION_FATIGUE_MULT: {
    GOL: 0.70,  // goleiro esforça menos
    ZAG: 0.85,
    LAT: 1.15,  // lateral corre muito
    VOL: 1.10,
    MEI: 1.00,
    ATA: 1.10,
  },

  // ── Calcular nova energia após rodada (#26, #29, #30, #44) ───
  calculateNewEnergy: (player, opts = {}) => {
    const { difficultyMult = 1.0, isCupMatch = false } = opts;
    let energy = player.energy ?? 100;
    const age  = player.age || 25;
    const C    = FatigueEngine.CONSTANTS;
    const POS  = FatigueEngine.POSITION_FATIGUE_MULT;

    // Lesionado: recupera
    if (player.injury) {
      const recovery = age > 30 ? C.RECOVERY_INJURED - 2 : C.RECOVERY_INJURED;
      return Math.min(100, energy + recovery);
    }

    if (player.isStarting) {
      const loss = Math.floor(
        Math.random() * (C.LOSS_STARTER_MAX - C.LOSS_STARTER_MIN + 1)
      ) + C.LOSS_STARTER_MIN;

      // Multiplicadores
      const posMult  = POS[player.position] || 1.0;
      const cupMult  = isCupMatch ? 1.1 : 1.0;
      const diffMult = difficultyMult;
      // Multiplicador por idade: veteranos cansam mais e recuperam menos
      const ageMult  = age > 33 ? 1.25   // muito cansativo para veteranos
                     : age > 30 ? 1.12   // 30-33: cansa mais
                     : age < 21 ? 0.88   // jovens: recuperam melhor
                     : 1.0;

      const finalLoss = Math.round(loss * posMult * cupMult * diffMult * ageMult);
      return Math.max(0, energy - finalLoss);
    }

    // Banco: recupera — veteranos recuperam menos
    const recovery = age > 30
      ? C.RECOVERY_BENCH - 3  // +9 em vez de +12 para >30
      : C.RECOVERY_BENCH;
    return Math.min(100, energy + recovery);
  },

  // ── Penalidade de OVR por cansaço (#27) ──────────────────────
  // Usada na simulação para calcular força real do time
  getOverallPenalty: (energy) => {
    if (energy < 30) return 8;  // Exausto: -8 OVR (antes era -5)
    if (energy < 50) return 5;  // Muito cansado: -5 OVR (novo)
    if (energy < 70) return 2;  // Cansado: -2 OVR
    return 0;
  },

  // ── Fator de desempenho contínuo (0.5 – 1.0) para simulação (#27, #88) ──
  // Retorna um multiplicador que representa a eficiência do jogador
  getPerformanceFactor: (energy) => {
    if (energy >= 80) return 1.00;
    if (energy >= 65) return 0.95;
    if (energy >= 50) return 0.88;
    if (energy >= 35) return 0.78;
    return 0.65; // exausto: grande queda
  },

  // ── Calcular força média do time considerando energia (#20, #88) ──
  // Substitui o cálculo simples em hooks_simulation
  calcTeamStrength: (players, formation, isValid) => {
    const starters = players.filter(p => p.isStarting);
    if (!starters.length) return 60;
    const raw = starters.reduce((sum, p) => {
      const penalty = FatigueEngine.getOverallPenalty(p.energy ?? 100);
      return sum + Math.max(30, p.overall - penalty);
    }, 0);
    const avg = Math.floor(raw / starters.length);
    return isValid ? avg : avg - 8;
  },

  // ── Impacto da fadiga no valor de mercado (#38) ──────────────
  getValueFatigueMultiplier: (energy) => {
    if (energy >= 80) return 1.00;
    if (energy >= 60) return 0.97;
    if (energy >= 40) return 0.93;
    return 0.88;
  },

  // ── Impacto da fadiga na chance de evolução (#37) ────────────
  // Jogador cansado evolui menos no treino
  getEvolutionFatigueMultiplier: (energy) => {
    if (energy >= 70) return 1.0;
    if (energy >= 50) return 0.7;
    return 0.4; // exausto: dificilmente evolui
  },
};
export default FatigueEngine;

// @migrated to ES module
// engines/engine_finances.js — v3.0
// ╔══════════════════════════════════════════════════════════════╗
// ║  #47 TV dinâmica | #48 visitante recebe bilheteria          ║
// ║  #49 custos operacionais | #51 moral afeta público          ║
// ║  #52 posição suavizada | #53 fator adversário               ║
// ║  #54 importância da partida | #55 clima                     ║
// ║  #65 sistema de risco financeiro                            ║
// ║  v3 BALANÇO: TV recalibrada para cobrir folha típica        ║
// ║     A→R$400K | B→R$280K | C→R$90K | D→R$55K por rodada    ║
// ╚══════════════════════════════════════════════════════════════╝

const FinanceEngine = {

  // ── Direitos de TV dinâmicos por divisão (#47) ──────────────
  // Calibrados para que TV sozinha cubra a folha típica de cada série:
  //   Série A: folha ~R$539K/rod → TV R$400K + bilheteria cobre o resto
  //   Série B: folha ~R$231K/rod → TV R$280K sozinho já cobre
  //   Série C: folha  ~R$66K/rod → TV R$90K com margem
  //   Série D: folha  ~R$44K/rod → TV R$55K com margem
  getTVRights: (serie, round, totalRounds) => {
    const base = { A: 400000, B: 280000, C: 90000, D: 55000 }[serie] || 55000;
    // Rodadas centrais (clássicos) valem até 20% a mais
    const midPoint  = totalRounds / 2;
    const proximity = 1 - Math.abs(round - midPoint) / midPoint;
    const bonus     = 1 + proximity * 0.20;
    return Math.round(base * bonus);
  },

  // ── Bilheteria avançada (#48 visitante recebe parte) ────────
  calculateMatchFinances: (homeTeam, awayTeam, gameData) => {
    const round       = gameData.round || 0;
    const totalRounds = gameData.fixtures?.length || 38;
    const tvRights    = FinanceEngine.getTVRights(gameData.serie, round, totalRounds);

    let ticketRevenue = 0, awayShare = 0, attendance = 0, occupationRate = 0;

    const isUserHome = homeTeam.id === 'user';
    const isUserAway = awayTeam.id === 'user';

    if (isUserHome || isUserAway) {
      const stad     = gameData.club.stadium || {};
      const capacity = stad.capacity || 15000;
      const price    = stad.ticketPrice || 40;

      // ── Ocupação base 40% ────────────────────────────────────
      let occ = 0.40;

      // Fator fidelidade da torcida (#64)
      const fanLoyalty = gameData.club?.fanLoyalty ?? 50;
      occ += ((fanLoyalty - 50) / 100) * 0.25;

      // Fator moral (#51)
      occ += ((gameData.morale || 60) / 100) * 0.25;

      // Fator posição (#52)
      const myPos = (gameData.table?.findIndex(t => t.id === 'user') ?? 9) + 1;
      occ += Math.max(-0.12, (10 - myPos) / 60);

      // Fator preço
      if (price > 80)      occ -= 0.28;
      else if (price > 50) occ -= 0.12;
      else if (price < 25) occ += 0.12;

      // Fator adversário (#53)
      const oppStr = (isUserHome ? awayTeam : homeTeam).strength || 70;
      if (oppStr >= 82)      occ += 0.18;
      else if (oppStr >= 74) occ += 0.08;

      // Fator importância (#54): últimas 8 rodadas
      if (round > totalRounds - 8) occ += 0.10;

      // Clima (#55): 20% de chuva → -15% público
      if (Math.random() < 0.20) occ -= 0.15;

      // Visitante: recebe renda menor
      if (isUserAway) occ *= 0.55;

      occupationRate = Math.max(0.08, Math.min(1.0, occ));
      attendance     = Math.floor(capacity * occupationRate);
      ticketRevenue  = attendance * price;

      // Visitante recebe 10% da bilheteria do mandante (#48)
      if (isUserAway) {
        awayShare     = Math.round(ticketRevenue * 0.10);
        ticketRevenue = awayShare;
      } else {
        awayShare     = Math.round(ticketRevenue * 0.10);
        ticketRevenue = ticketRevenue - awayShare;
      }
    }

    return {
      tvRights,
      ticketRevenue,
      awayShare,
      attendance,
      occupationPct:   Math.round(occupationRate * 100),
      homeTotalIncome: ticketRevenue + tvRights,
      awayTotalIncome: awayShare     + tvRights,
    };
  },

  // ── Custos operacionais mensais (#49) ─────────────────────────
  // Cobrados a cada 4 rodadas. Recalibrado: B/C/D não devem sufocar.
  getOperationalCosts: (gameData) => {
    const serie = gameData.serie || 'A';
    const level = gameData.club?.stadium?.level || 1;
    const base  = { A: 800000, B: 120000, C: 40000, D: 15000 }[serie] || 15000;
    const stadiumMaint = (level - 1) * 30000; // custo extra por upgrade
    return base + stadiumMaint;
  },

  // ── Diagnóstico financeiro (#65 risco de falência) ───────────
  // FIX 7.1: runway agora considera folha + custos operacionais medios por rodada.
  // Antes usava apenas o salario (wage), ignorando custos fixos do estadio/estrutura,
  // o que superestimava o tempo de sobrevivencia financeira.
  getFinancialStatus: (gameData) => {
    const money  = gameData.club?.money || 0;
    const wage   = gameData.club?.wage  || 0;
    // Custos operacionais sao cobrados a cada 4 rodadas; distribui por rodada
    const opCostPerRound = FinanceEngine.getOperationalCosts
      ? Math.round(FinanceEngine.getOperationalCosts(gameData) / 4)
      : 0;
    const avgExpensePerRound = wage + opCostPerRound;
    const runway = avgExpensePerRound > 0 ? Math.floor(money / avgExpensePerRound) : 999;
    return {
      runway,
      status: runway < 3  ? 'critico'
             : runway < 8  ? 'alerta'
             : runway < 15 ? 'atencao'
             : 'saudavel',
      label:  runway < 3  ? '\u{1F534} CRISE FINANCEIRA'
             : runway < 8  ? '\u{1F7E0} Alerta Financeiro'
             : runway < 15 ? '\u{1F7E1} Atencao as Financas'
             : '\u{1F7E2} Financas Saudaveis',
    };
  },
};

export { FinanceEngine };
export default FinanceEngine;

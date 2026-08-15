// @migrated to ES module
// engines/PostMatchAgent.js — v1.0
// ─────────────────────────────────────────────────────────────────────────────
// Agente responsável por analisar o estado IMEDIATAMENTE após uma partida
// e produzir alertas acionáveis para o jogador.
//
// Responsabilidades:
//   • Detectar jogadores que ficaram SUSPENSOS durante este jogo
//     (vermelho direto, segundo amarelo, 3 amarelos acumulados)
//   • Detectar jogadores que saíram LESIONADOS durante este jogo
//   • Classificar a gravidade de cada ocorrência
//   • Retornar dados estruturados para a UI mostrar no ScreenPostMatch
//
// A UI (ScreenPostMatch) usa esses dados para:
//   1. Exibir o painel "DESFALQUES PARA O PRÓXIMO JOGO"
//   2. Bloquear a saída até o usuário reconhecer os desfalques críticos
//
// O agente NÃO modifica estado — apenas lê e analisa.
// ─────────────────────────────────────────────────────────────────────────────

export const PostMatchAgent = {

  /**
   * analyzeDesfalques
   * Compara o estado dos jogadores ANTES e DEPOIS do jogo para descobrir
   * quem ficou indisponível como consequência desta partida.
   *
   * @param {object[]} playersBefore  — gameData.players antes do setGameData
   * @param {object[]} playersAfter   — gameData.players após o setGameData
   * @param {object[]} rawEvents      — rawEvents da simulação (para motivo do cartão)
   * @param {number}   nextRound      — gameData.round + 1 (próxima rodada a jogar)
   * @returns {object} { suspensions: [], injuries: [], hasBlockers: boolean }
   */
  analyzeDesfalques: (playersBefore, playersAfter, rawEvents = [], nextRound) => {
    const suspensions = [];
    const injuries    = [];

    playersAfter.forEach(pAfter => {
      const pBefore = playersBefore.find(p => p.id === pAfter.id);
      if (!pBefore) return;

      // ── SUSPENSÃO nova ──────────────────────────────────────────
      const wasSusp = pBefore.discipline?.suspendedUntilRound != null
        && nextRound <= pBefore.discipline.suspendedUntilRound;
      const isNowSusp = pAfter.discipline?.suspendedUntilRound != null
        && nextRound <= pAfter.discipline.suspendedUntilRound;

      if (!wasSusp && isNowSusp) {
        // Descobre o motivo pelo rawEvents
        const playerRawEvents = rawEvents.filter(e =>
          e.playerId === pAfter.id || e.playerName === pAfter.name
        );
        const hasRedDirect      = playerRawEvents.some(e => e.type === 'red_direct');
        const hasSecondYellow   = playerRawEvents.some(e => e.type === 'red_second_yellow');
        const yellowCount       = playerRawEvents.filter(e => e.type === 'yellow').length;
        const accumulatedYellow = !hasRedDirect && !hasSecondYellow; // suspensão por acúmulo (3 amarelos)

        const roundsLeft = pAfter.discipline.suspendedUntilRound - nextRound + 1;

        let reason, icon, severity;
        if (hasRedDirect) {
          reason   = 'Cartão vermelho direto';
          icon     = '🟥';
          severity = 'high'; // 2 rodadas
        } else if (hasSecondYellow) {
          reason   = 'Segundo amarelo';
          icon     = '🟨🟥';
          severity = 'medium'; // 1 rodada
        } else {
          reason   = `3 amarelos acumulados (${(pBefore.discipline?.yellowCards || 0) + yellowCount} no total)`;
          icon     = '🟨🟨🟨';
          severity = 'medium';
        }

        suspensions.push({
          player:    pAfter,
          reason,
          icon,
          severity,
          roundsLeft,
          wasStarter: pBefore.isStarting,
        });
      }

      // ── LESÃO nova ─────────────────────────────────────────────
      const wasInjured = !!pBefore.injury;
      const isNowInjured = !!pAfter.injury;

      if (!wasInjured && isNowInjured) {
        const roundsLeft  = pAfter.injury?.roundsLeft ?? 1;
        const injuryType  = pAfter.injury?.type || 'Lesão';
        const isTraining  = injuryType.includes('Treino');

        injuries.push({
          player:    pAfter,
          injuryType,
          roundsLeft,
          isTraining,
          severity:  roundsLeft >= 4 ? 'high' : roundsLeft >= 2 ? 'medium' : 'low',
          wasStarter: pBefore.isStarting,
        });
      }
    });

    // Ordena: titulares afetados primeiro, depois por severidade
    const sortFn = (a, b) => {
      if (a.wasStarter !== b.wasStarter) return a.wasStarter ? -1 : 1;
      const sev = { high: 0, medium: 1, low: 2 };
      return (sev[a.severity] || 1) - (sev[b.severity] || 1);
    };

    suspensions.sort(sortFn);
    injuries.sort(sortFn);

    // hasBlockers: tem desfalques que afetam titulares (precisa ajustar escalação)
    const hasBlockers = suspensions.some(s => s.wasStarter) || injuries.some(i => i.wasStarter);

    return { suspensions, injuries, hasBlockers };
  },

  /**
   * formatRoundsLeft
   * Formata a duração da suspensão/lesão em texto
   */
  formatRoundsLeft: (n) => n <= 1 ? 'próximo jogo' : `próximos ${n} jogos`,
};

export default PostMatchAgent;

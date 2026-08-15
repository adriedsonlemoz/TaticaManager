// @migrated to ES module
import React from 'react';
import { FatigueEngine } from '../engines/engine_fatigue.js';
import { FinanceEngine } from '../engines/engine_finances.js';
import { CpuAI } from '../engines/engine_cpu_ai.js';

// hooks/hooks_squad.js — v4.6 (regra de elenco mínimo do time vendedor)

const useSquad = (gameData, setGameData, showToast, formatMoney) => {
  const [playerModal, setPlayerModal] = React.useState(null);

  // ── Comprar Jogador ──
  // Elenco mínimo que o time vendedor deve manter após venda
  const MIN_SELLING_SQUAD = 20;

  const buyPlayer = React.useCallback((p) => {
    if (!gameData) return;
    const budget = gameData.club.transferBudget ?? 0;
    
    // Janela de transferências
    if (CpuAI?.isTransferWindowOpen) {
      if (!CpuAI.isTransferWindowOpen(gameData.round)) {
        const info = CpuAI.getTransferWindowInfo(gameData.round);
        showToast(`🚫 Janela fechada! ${info.label} abre em ${info.opensIn} rodada(s).`, 'error');
        return;
      }
    }

    // Limite de elenco
    const maxSquad = CpuAI?.MAX_SQUAD_SIZE || 30;
    if ((gameData.players || []).length >= maxSquad) {
      showToast(`🚫 Elenco cheio! Máximo de ${maxSquad} jogadores. Libere alguém antes de contratar.`, 'error');
      return;
    }

    // ✅ Regra: protege elenco mínimo do time vendedor
    // Um time CPU não pode vender se ficaria abaixo de MIN_SELLING_SQUAD jogadores
    // (mínimo para disputar o campeonato). Não se aplica a jogadores livres.
    if (p.teamId && p.teamName && p.teamName !== 'Livre') {
      const sellerRoster = (gameData.teamRosters?.[p.teamId] || []);
      if (sellerRoster.length > 0 && sellerRoster.length <= MIN_SELLING_SQUAD) {
        showToast(
          `🚫 ${p.teamName} não pode vender agora.`,
          'error',
          `O clube ficaria com menos de ${MIN_SELLING_SQUAD} jogadores — abaixo do mínimo para disputar o campeonato.`
        );
        return;
      }
    }

    // #56 Bloquear compra se situação financeira crítica
    if (FinanceEngine?.getFinancialStatus) {
      const fin = FinanceEngine.getFinancialStatus(gameData);
      if (fin.status === 'critico') {
        showToast('🚨 Situação financeira crítica! Sem crédito para contratações.', 'error');
        return;
      }
    }

    // Validação de reputação: jogador pode recusar jogar em clube/série muito inferior ao seu OVR
    // Thresholds: OVR > 75 recusa Série C/D | OVR > 82 recusa Série B | OVR > 88 recusa Série A baixo
    const playerOvr = p.overall || 65;
    const clubSerie = gameData.serie || 'A';
    const isLivre   = !p.teamId || p.teamName === 'Livre' || !p.teamName;
    if (!isLivre) { // Jogadores livres aceitam qualquer clube
      const minSerieByOvr =
        playerOvr >= 86 ? 'A' :      // estrela: só Série A
        playerOvr >= 78 ? 'B' :      // muito bom: A ou B
        playerOvr >= 70 ? 'C' :      // bom: até C
        null;                         // mediano: aceita qualquer série
      const serieOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
      if (minSerieByOvr && (serieOrder[clubSerie] || 4) > (serieOrder[minSerieByOvr] || 4)) {
        const stars = playerOvr >= 86 ? 'estrela' : playerOvr >= 78 ? 'experiente' : 'qualificado';
        showToast(
          `🤝 ${p.name.split(' ').pop()} recusou a proposta.`,
          'error',
          `Jogador ${stars} (OVR ${playerOvr}) exige no mínimo a Série ${minSerieByOvr}. Seu clube está na Série ${clubSerie}.`
        );
        return;
      }
    }

    // Trava de Saldo
    if (gameData.club.money < p.value) {
      showToast('Saldo insuficiente em caixa!', 'error');
      return;
    }
    
    // Trava de Orçamento
    if (budget > 0 && p.value > budget) {
      showToast('Fora do orçamento de transferências!', 'warning');
      return;
    }

    const shirt = Math.max(...gameData.players.map(x => x.shirt || 0), 0) + 1;
    const newWage = p.wage || 0;

    setGameData(prev => {
      const transaction = {
        round: prev.round,
        income: 0,
        expense: p.value,
        total: -p.value,
        detail: { transfer: p.value, description: `Compra: ${p.name}` }
      };

      // ✅ FIX #8: Sincroniza teamRosters ao comprar jogador de um time CPU.
      // Antes, o jogador permanecia no roster do time vendedor durante simulações.
      const updatedRosters = { ...prev.teamRosters };
      if (p.teamId && updatedRosters[p.teamId]) {
        updatedRosters[p.teamId] = updatedRosters[p.teamId].filter(r => r.id !== p.id);
      }
      // Também remove do squad do time nas listas leagues.A/B
      const removeFromLeague = (arr) => (arr || []).map(t =>
        t.squad ? { ...t, squad: t.squad.filter(r => r.id !== p.id) } : t
      );

      return {
        ...prev,
        club: {
          ...prev.club,
          money: prev.club.money - p.value,
          transferBudget: Math.max(0, (prev.club.transferBudget || 0) - p.value),
          wage: (prev.club.wage || 0) + newWage,
        },
        players: [...prev.players, {
          ...p,
          isStarting: false, shirt, goals: 0, assists: 0, energy: 100, injury: null,
          discipline: p.discipline || { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
        }],
        market: prev.market.filter(x => x.id !== p.id),
        teamRosters: updatedRosters,
        teams: removeFromLeague(prev.teams),
        leagues: {
          A: removeFromLeague(prev.leagues?.A),
          B: removeFromLeague(prev.leagues?.B),
        },
        financialHistory: [transaction, ...(prev.financialHistory || [])].slice(0, 50),
        // ✅ FIX #transfer-limit: contabiliza compras por time CPU
        transfersFromTeam: (() => {
          if (!p.teamId || p.teamName === 'Livre') return prev.transfersFromTeam || {};
          const curr = prev.transfersFromTeam || {};
          return { ...curr, [p.teamId]: (curr[p.teamId] || 0) + 1 };
        })(),
      };
    });
    showToast(`Contratado: ${p.name}!`);
  }, [gameData, showToast]);

  // ── Treinamento intensivo ──
  const trainSquad = React.useCallback(() => {
    if (!gameData) return;

    // LIMITE: 1 treino por rodada
    if (gameData.club.lastTrainRound === gameData.round) {
      showToast('⏰ Treino já realizado nesta rodada. Aguarde a próxima partida.', 'warning');
      return;
    }
    if (gameData.club.money < 150000) {
      showToast('Sem verba para treinar! (R$ 150.000)', 'error');
      return;
    }
    // FIX 1.1: coleta evoluções ANTES do setGameData para que o setTimeout
    // capture dados estáveis — sem risco de closure sobre estado em mutação.
    let evolvedPlayers = [];

    setGameData(prev => {
      const transaction = {
        round: prev.round, income: 0, expense: 150000, total: -150000,
        detail: { description: 'Taxa: Treinamento Intensivo' }
      };

      const newPlayers = prev.players.map(p => {
        const energyMult = FatigueEngine?.getEvolutionFatigueMultiplier
          ? FatigueEngine.getEvolutionFatigueMultiplier(p.energy ?? 100)
          : 1.0;

        // Multiplicador por idade: jovens evoluem mais, veteranos regridem
        const age = p.age || 25;
        if (age > 33) {
          // Declínio: 30% de chance de -1 OVR por treino
          if (Math.random() < 0.30 && p.overall > 50) {
            evolvedPlayers.push({ name: p.name.split(' ')[0], delta: -1 });
            return { ...p, overall: p.overall - 1 };
          }
          return p;
        }
        if (age > 30) return p; // 30-33: sem evolução no treino (estagnado)

        const ageMult = age < 21 ? 1.40   // -21: grande bônus
                      : age < 23 ? 1.20   // 21-22: bônus
                      : age < 26 ? 1.00   // 23-25: neutro
                      : age < 29 ? 0.75   // 26-28: ligeira queda
                      : 0.45;             // 29-30: dificilmente evolui

        const threshold = 0.65 / energyMult / ageMult;
        if (Math.random() > threshold && p.overall < 99) {
          evolvedPlayers.push({ name: p.name.split(' ')[0], delta: 1 });
          return { ...p, overall: p.overall + 1 };
        }
        return p;
      });

      return {
        ...prev,
        club: {
          ...prev.club,
          money: prev.club.money - 150000,
          lastTrainRound: prev.round,  // registra rodada do treino
        },
        players: newPlayers,
        financialHistory: [transaction, ...(prev.financialHistory || [])].slice(0, 50)
      };
    });

    // FIX 1.1: setTimeout FORA do setGameData — lê evolvedPlayers capturado acima.
    // Garante que o toast reflita exatamente o que aconteceu neste treino.
    setTimeout(() => {
      const gains    = evolvedPlayers.filter(e => e.delta > 0);
      const declines = evolvedPlayers.filter(e => e.delta < 0);
      if (gains.length === 0 && declines.length === 0) {
        showToast('Treino concluído. Nenhuma evolução desta vez.', 'info');
      } else {
        if (gains.length > 0) {
          const names = gains.map(e => e.name).join(', ');
          showToast(`📈 ${names} evoluiu${gains.length > 1 ? 'ram' : ''}! +1 OVR`, 'success');
        }
        if (declines.length > 0) {
          const names = declines.map(e => e.name).join(', ');
          showToast(`📉 ${names} regrediu (desgaste natural da idade). -1 OVR`, 'warning');
        }
      }
    }, 100);
  }, [gameData, showToast]);

  // ── Ampliação do Estádio ──
  const expandStadium = React.useCallback(() => {
    if (!gameData) return;
    if (gameData.club.money < 2500000) {
      showToast('Dinheiro insuficiente (R$ 2.500.000).', 'error');
      return;
    }
    // Verificar se já há obra em andamento
    if (gameData.club.stadium?.underConstruction) {
      const left = gameData.club.stadium.underConstruction;
      showToast(`🏗️ Obras em andamento! Conclusão em ${left} rodada${left > 1 ? 's' : ''}.`, 'warning');
      return;
    }
    setGameData(prev => {
      const transaction = {
        round: prev.round, income: 0, expense: 2500000, total: -2500000,
        detail: { description: 'Obras: Ampliação do Estádio (em andamento)' }
      };
      return {
        ...prev,
        club: {
          ...prev.club,
          money: prev.club.money - 2500000,
          stadium: {
            ...prev.club.stadium,
            // Capacidade NÃO aumenta imediatamente — fica em obra por 4 rodadas
            underConstruction: 4,
            pendingCapacity: (prev.club.stadium?.pendingCapacity || 0) + 5000,
            pendingLevel:    (prev.club.stadium?.level || 1) + 1,
          },
        },
        financialHistory: [transaction, ...(prev.financialHistory || [])].slice(0, 50)
      };
    });
    showToast('🏗️ Obras iniciadas! Conclusão em 4 rodadas.', 'success');
  }, [gameData, showToast]);

  return { playerModal, setPlayerModal, buyPlayer, trainSquad, expandStadium };
};

export { useSquad };
export default useSquad;

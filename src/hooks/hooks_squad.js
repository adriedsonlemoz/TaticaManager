// @migrated to ES module
import React from 'react';
import { FatigueEngine } from '../engines/engine_fatigue.js';
import { evaluateTransferPurchase } from '../engines/market/transferRules.js';
import { appendFinancialEntry } from '../engines/finances/financeLedger.js';
import { applyUserPurchase } from '../engines/market/transferTransactions.js';
import { syncUserRosterState } from '../engines/core/gameStateIntegrity.js';

// hooks/hooks_squad.js — v4.6 (regra de elenco mínimo do time vendedor)

const useSquad = (gameData, setGameData, showToast, formatMoney) => {
  const [playerModal, setPlayerModal] = React.useState(null);

  // ── Comprar Jogador ──
  const buyPlayer = React.useCallback((p) => {
    if (!gameData || !p) return false;
    const agreedPrice = p.agreedTransferFee ?? p.value;
    const eligibility = evaluateTransferPurchase(gameData, p, agreedPrice);
    if (!eligibility.allowed) {
      showToast?.(
        `${eligibility.code === 'window_closed' ? '🚫 ' : eligibility.code === 'financial_crisis' ? '🚨 ' : eligibility.code === 'seller_min_squad' ? '🚫 ' : eligibility.code === 'reputation' ? '🤝 ' : ''}${eligibility.message}`,
        eligibility.severity || 'error',
        eligibility.detail || undefined,
      );
      return false;
    }

    // A validação acima alimenta a UI; a transação abaixo valida novamente
    // dentro do estado mais recente. Isso impede duplo clique/ações simultâneas
    // de gastarem o mesmo orçamento ou manterem o atleta em dois clubes.
    setGameData((prev) => applyUserPurchase(prev, p, agreedPrice).state);
    showToast?.(`Contratado: ${p.name}!`);
    return true;
  }, [gameData, setGameData, showToast]);

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

      return syncUserRosterState({
        ...prev,
        club: {
          ...prev.club,
          money: prev.club.money - 150000,
          lastTrainRound: prev.round,  // registra rodada do treino
        },
        financialHistory: appendFinancialEntry(prev.financialHistory, transaction, { season: prev.season, round: prev.round, leagueRound: prev.leagueRound ?? prev.round, competition: 'training' })
      }, newPlayers);
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
        financialHistory: appendFinancialEntry(prev.financialHistory, transaction, { season: prev.season, round: prev.round, leagueRound: prev.leagueRound ?? prev.round, competition: 'stadium' })
      };
    });
    showToast('🏗️ Obras iniciadas! Conclusão em 4 rodadas.', 'success');
  }, [gameData, showToast]);

  return { playerModal, setPlayerModal, buyPlayer, trainSquad, expandStadium };
};

export { useSquad };
export default useSquad;

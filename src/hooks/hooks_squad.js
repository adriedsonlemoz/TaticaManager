// @migrated to ES module
import React from 'react';
import { FatigueEngine } from '../engines/engine_fatigue.js';
import { evaluateTransferPurchase } from '../engines/market/transferRules.js';

// hooks/hooks_squad.js — v4.6 (regra de elenco mínimo do time vendedor)

const useSquad = (gameData, setGameData, showToast, formatMoney) => {
  const [playerModal, setPlayerModal] = React.useState(null);

  // ── Comprar Jogador ──
  const buyPlayer = React.useCallback((p) => {
    if (!gameData || !p) return false;

    const eligibility = evaluateTransferPurchase(gameData, p, p.value);
    if (!eligibility.allowed) {
      showToast?.(
        `${eligibility.code === 'window_closed' ? '🚫 ' : eligibility.code === 'financial_crisis' ? '🚨 ' : eligibility.code === 'seller_min_squad' ? '🚫 ' : eligibility.code === 'reputation' ? '🤝 ' : ''}${eligibility.message}`,
        eligibility.severity || 'error',
        eligibility.detail || undefined,
      );
      return false;
    }

    const shirt = Math.max(...(gameData.players || []).map(x => x.shirt || 0), 0) + 1;
    const newWage = p.wage || 0;
    const sourceTeamId = p.originTeamId ?? p.teamId;
    const playerForUser = {
      ...p,
      originTeamId: undefined,
      originTeamName: undefined,
      teamId: 'user',
      teamName: gameData.club.name,
      isStarting: false,
      shirt,
      goals: 0,
      assists: 0,
      energy: 100,
      injury: null,
      discipline: p.discipline || { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
    };

    setGameData(prev => {
      const transaction = {
        round: prev.round,
        income: 0,
        expense: p.value,
        total: -p.value,
        detail: { transfer: p.value, description: `Compra: ${p.name}` },
      };

      const updatedRosters = { ...(prev.teamRosters || {}) };
      if (sourceTeamId != null && updatedRosters[sourceTeamId]) {
        updatedRosters[sourceTeamId] = updatedRosters[sourceTeamId].filter(r => r.id !== p.id);
      }
      updatedRosters.user = [
        ...(updatedRosters.user || []).filter(r => r.id !== p.id),
        playerForUser,
      ];

      const removeFromPool = (arr) => (arr || []).map(team => {
        if (sourceTeamId == null || String(team.id) !== String(sourceTeamId)) return team;
        return { ...team, squad: (team.squad || []).filter(r => r.id !== p.id) };
      });

      return {
        ...prev,
        club: {
          ...prev.club,
          money: prev.club.money - p.value,
          transferBudget: Math.max(0, (prev.club.transferBudget || 0) - p.value),
          wage: (prev.club.wage || 0) + newWage,
        },
        players: [...(prev.players || []), playerForUser],
        market: (prev.market || []).filter(x => x.id !== p.id),
        watchlist: (prev.watchlist || []).filter(item => item.id !== p.id),
        teamRosters: updatedRosters,
        teams: removeFromPool(prev.teams),
        leagues: {
          ...(prev.leagues || {}),
          A: removeFromPool(prev.leagues?.A),
          B: removeFromPool(prev.leagues?.B),
          C: removeFromPool(prev.leagues?.C),
          D: removeFromPool(prev.leagues?.D),
        },
        financialHistory: [transaction, ...(prev.financialHistory || [])].slice(0, 50),
        transfersFromTeam: (() => {
          if (!sourceTeamId || p.originTeamName === 'Livre') return prev.transfersFromTeam || {};
          const curr = prev.transfersFromTeam || {};
          return { ...curr, [sourceTeamId]: (curr[sourceTeamId] || 0) + 1 };
        })(),
      };
    });
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

// @migrated to ES module
import React from 'react';
import { DisciplineEngine }  from '../engines/engine_discipline.js';
import { FinanceEngine }      from '../engines/engine_finances.js';
import { isSeasonScheduleComplete } from '../engines/season/seasonOutcome.js';
import { prepareSeasonTransition } from '../engines/season/seasonTransitionService.js';

// hooks/useRoundAdvance.js — v1.0
// Extraído de hooks_simulation.js.
// Gerencia avanço de rodada, fim de temporada, validação de escalação
// e demissão do técnico.

const useRoundAdvance = (
  gameData, setGameData, setScreen, showToast, setLineupDialog,
  intervalRef, matchControlsRef, setSimulating
) => {
  const handleGoToNextMatch = React.useCallback(() => {
    if (!gameData) return;

    // Garante que qualquer simulação em andamento é encerrada antes de avançar
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSimulating(false);
    matchControlsRef.current.isPaused = false;

    // ── FIM DE TEMPORADA ────────────────────────────────
    // #96 Verificar falência antes de avançar rodada
    if (gameData && FinanceEngine?.getFinancialStatus) {
      const fin = FinanceEngine.getFinancialStatus(gameData);
      if (fin.status === 'critico' && fin.runway <= 0) {
        setScreen('game_over');
        return;
      }
    }

    // O calendário completo é a fonte de verdade quando há Copa.
    // Assim finais pós-Liga não são puladas só porque as 38 rodadas acabaram.
    if (isSeasonScheduleComplete(gameData)) {
      const transition = prepareSeasonTransition(gameData);
      if (transition.status === 'fired') {
        setGameData(prev => ({
          ...prev,
          gameOverReason: 'fired',
          gameOverMessage: transition.reason,
        }));
        setScreen('game_over');
        return;
      }
      if (transition.status !== 'advanced' || !transition.nextState) {
        showToast('Não foi possível iniciar a próxima temporada.', 'error');
        return;
      }
      setGameData(transition.nextState);
      setScreen('season_end');
      return;
    }

    // Verificar 11 titulares
    const starters = gameData.players.filter(p => p.isStarting);
    if (starters.length !== 11) {
      setLineupDialog({ open: true, n: starters.length });
      return;
    }

    // Verificar lesionados/suspensos — BLOQUEIA e remove o jogador da escalação
    // FIX 5.1: usa round+1 porque gameData.round e o indice da rodada JA jogada;
    // a proxima partida sera disputada na rodada round+1.
    // Sem isso, um jogador suspenso "ate a rodada 5" nao seria barrado ao iniciar a rodada 5.
    const nextRound = gameData.round + 1;
    const illegal = starters.find(p => {
      const isSusp = DisciplineEngine
        ? DisciplineEngine.isPlayerSuspended(p, nextRound)
        : (p.discipline?.suspendedUntilRound != null && nextRound <= p.discipline.suspendedUntilRound);
      return isSusp || !!p.injury;
    });
    if (illegal) {
      const isInj = !!illegal.injury;
      setGameData(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === illegal.id ? { ...p, isStarting: false } : p
        ),
      }));
      showToast(
        isInj
          ? `🚑 DM: ${illegal.name.split(' ').pop()} está lesionado e foi retirado da escalação!`
          : `🟥 Árbitro: ${illegal.name.split(' ').pop()} está suspenso e não pode jogar!`,
        'error'
      );
      setScreen('lineup');
      return;
    }

    setScreen('next_match');
  }, [gameData, setGameData, setScreen, showToast, setLineupDialog]);


  return { handleGoToNextMatch };
};

export { useRoundAdvance };
export default useRoundAdvance;

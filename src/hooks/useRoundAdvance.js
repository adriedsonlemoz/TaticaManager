// @migrated to ES module
import React from 'react';
import { FinanceEngine }      from '../engines/engine_finances.js';
import { isSeasonScheduleComplete } from '../engines/season/seasonOutcome.js';
import { prepareSeasonTransition } from '../engines/season/seasonTransitionService.js';
import { getLineupValidation } from '../engines/lineup/lineupRules.js';
import { findIllegalStarter } from '../engines/match/matchPreflight.js';
import { advanceInactiveCalendarSlots, getInactiveCupSkipCount } from '../engines/calendar/idleCalendarAdvance.js';
import { buildRoundMaintenance } from '../engines/app/gameControllerService.js';
import { syncUserRosterState } from '../engines/core/gameStateIntegrity.js';
import { getDaysUntilCalendarSlot } from '../engines/calendar/calendarDateEngine.js';

// hooks/useRoundAdvance.js — v1.0
// Extraído de hooks_simulation.js.
// Gerencia avanço de rodada, fim de temporada, validação de escalação
// e demissão do técnico.

const useRoundAdvance = (
  gameData, setGameData, setScreen, showToast, setLineupDialog,
  intervalRef, matchControlsRef, setSimulating, persistGameState = null
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
        showToast(transition.reason || 'Não foi possível iniciar a próxima temporada.', 'error');
        return;
      }
      setGameData(transition.nextState);
      if (typeof persistGameState === 'function') void persistGameState(transition.nextState);
      setScreen('season_end');
      return;
    }

    // O calendário civil é a autoridade: não pulamos um compromisso futuro
    // apenas porque ele não terá partida do usuário. Primeiro o dia precisa chegar.
    if (getDaysUntilCalendarSlot(gameData) > 0) {
      setScreen('next_match');
      return;
    }

    // Datas de Copa/competição em que o clube não tem jogo são processadas
    // somente quando sua data canônica chegou (um dia civil por vez entre elas).
    const idleSkipCount = getInactiveCupSkipCount(gameData);
    let stateForNextMatch = gameData;
    if (idleSkipCount > 0) {
      const idleAdvance = advanceInactiveCalendarSlots(gameData, { skipCount: idleSkipCount });
      const maintenance = buildRoundMaintenance(idleAdvance.state, { allowTransferOffers: false });
      stateForNextMatch = maintenance.state;
      setGameData(stateForNextMatch);
      if (typeof persistGameState === 'function') void persistGameState(stateForNextMatch);

      const recovered = idleAdvance.recoveredPlayers.length;
      showToast(
        `⏭️ ${idleAdvance.skippedSlots} data(s) sem partida: elenco descansou${recovered > 0 ? ` e ${recovered} jogador(es) se recuperaram de lesão` : ''}.`,
        'info',
      );
      maintenance.toasts.forEach(effect => {
        setTimeout(() => showToast(effect.message, effect.severity), effect.delay || 0);
      });

      // O calendário pode terminar apenas com slots de Copa que ficaram inativos.
      if (isSeasonScheduleComplete(stateForNextMatch)) {
        const transition = prepareSeasonTransition(stateForNextMatch);
        if (transition.status === 'fired') {
          setGameData({
            ...stateForNextMatch,
            gameOverReason: 'fired',
            gameOverMessage: transition.reason,
          });
          setScreen('game_over');
          return;
        }
        if (transition.status === 'advanced' && transition.nextState) {
          setGameData(transition.nextState);
          if (typeof persistGameState === 'function') void persistGameState(transition.nextState);
          setScreen('season_end');
          return;
        }
        if (transition.status === 'invalid-season') {
          showToast(transition.reason || 'A temporada não pôde ser encerrada por inconsistência na Liga.', 'error');
          return;
        }
      }
    }

    // A mesma regra estrutural usada pelo preflight real também governa a navegação.
    // Isso impede a tela da próxima partida de aceitar um estado que o motor deveria rejeitar.
    const validation = getLineupValidation(stateForNextMatch);
    const starters = validation.starters;
    if (!validation.isComplete) {
      setLineupDialog({ open: true, n: validation.uniqueStarterCount });
      return;
    }
    if (!validation.isValid) {
      showToast(
        !validation.formationValid
          ? '🚫 Formação inválida. Revise a escalação antes de jogar.'
          : !validation.hasGoalkeeper
            ? '🚫 A escalação precisa ter um goleiro.'
            : '🚫 A escalação contém titulares duplicados ou inválidos.',
        'error',
      );
      setScreen('lineup');
      return;
    }

    // Verificar lesionados/suspensos — BLOQUEIA e remove o jogador da escalação.
    const illegal = findIllegalStarter(stateForNextMatch, starters);
    if (illegal) {
      const isInj = !!illegal.injury;
      const correctedState = syncUserRosterState(
        stateForNextMatch,
        (stateForNextMatch.players || []).map(p => p.id === illegal.id ? { ...p, isStarting: false } : p),
      );
      setGameData(correctedState);
      if (typeof persistGameState === 'function') void persistGameState(correctedState);
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
  }, [gameData, setGameData, setScreen, showToast, setLineupDialog, persistGameState]);


  return { handleGoToNextMatch };
};

export { useRoundAdvance };
export default useRoundAdvance;

// @migrated to ES module
import React from 'react';
import { DisciplineEngine }  from '../engines/engine_discipline.js';
import { FinanceEngine }      from '../engines/engine_finances.js';
import { CupsEngine }         from '../engines/cups_engine.js';
import { generateNextSeason, sortLeagueTable } from '../engines/engine.js';

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

    if ((gameData.leagueRound ?? gameData.round) >= (gameData.fixtures?.length || 38)) {
      if (!generateNextSeason) return showToast('Temporada encerrada!', 'warning');
      // #14 Histórico de carreira acumulado por temporada
      const _sortedFinal = sortLeagueTable ? sortLeagueTable(gameData.table) : gameData.table;
      const _finalPos    = _sortedFinal.findIndex(t => t.id === 'user') + 1;
      const _myRow       = _sortedFinal.find(t => t.id === 'user') || {};

      // FEATURE: verificar objetivo de temporada → demissão se não cumprido
      const _objective = gameData.seasonObjective || 'survive';
      const _serie     = gameData.serie || 'A';
      const _objFailed = (() => {
        if (_objective === 'champion'    && _finalPos !== 1)   return `Objetivo: ser CAMPEÃO. Você terminou em ${_finalPos}º.`;
        if (_objective === 'top4'        && _finalPos > 4)     return `Objetivo: TOP 4. Você terminou em ${_finalPos}º.`;
        if (_objective === 'promotion'   && _finalPos > 4 && _serie !== 'A') return `Objetivo: ACESSO. Você terminou em ${_finalPos}º.`;
        if (_objective === 'survive'     && _finalPos >= 17)   return `Objetivo: NÃO REBAIXAR. Você terminou em ${_finalPos}º.`;
        return null;
      })();

      if (_objFailed) {
        // Guarda o motivo no estado e manda para game_over
        setGameData(prev => ({ ...prev, gameOverReason: 'fired', gameOverMessage: _objFailed }));
        setScreen('game_over');
        return;
      }

      const seasonEntry  = {
        season:    gameData.season,
        serie:     gameData.serie,
        position:  _finalPos,
        pts:       _myRow.pts  || 0,
        wins:      _myRow.w    || 0,
        draws:     _myRow.d    || 0,
        losses:    _myRow.l    || 0,
        topScorer: Object.values(gameData.scorers || {})
          .filter(p => p.isUserTeam)
          .sort((a, b) => (b.goals || 0) - (a.goals || 0))[0]?.name || null,
        money:     gameData.club.money || 0,
        cupResult: gameData.cups?.copaBrasil?.status || null,
      };
      const _careerHistory = [...(gameData.careerHistory || []), seasonEntry];
      const nextState = generateNextSeason({ ...gameData, careerHistory: _careerHistory });
      nextState.careerHistory = _careerHistory;
      if (CupsEngine?.autoInitCupsForSeason) {
        nextState.cups = CupsEngine.autoInitCupsForSeason(nextState, false);
      }
      setGameData(nextState);
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

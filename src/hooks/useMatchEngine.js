import React from 'react';
import { calculateMorale } from '../helpers.js';
import { getLineupValidation } from '../engines/lineup/lineupRules.js';
import useRoundAdvance from './useRoundAdvance.js';
import { startMatchPlayback } from '../engines/match/matchPlayback.js';
import { processLeaguePlayers } from '../engines/match/matchPostProcessor.js';
import { inspectMatchStart } from '../engines/match/matchPreflight.js';
import { simulateCupRound, buildCupPostMatchState } from '../engines/match/matchCupRound.js';
import { simulateLeagueRound } from '../engines/match/matchLeagueRound.js';
import { completeLeagueRound } from '../engines/match/matchRoundState.js';

// Hook de orquestração da partida.
// Regras de calendário, copa, liga e pós-jogo vivem em engines/match/.
const useMatchSimulation = (gameData, setGameData, setScreen, showToast, setLineupDialog) => {
  const [simulating, setSimulating] = React.useState(false);
  const [visibleEvents, setVisibleEvents] = React.useState([]);
  const [liveScore, setLiveScore] = React.useState({ home: 0, away: 0 });
  const [matchResultData, setMatchResultData] = React.useState(null);
  const [roundSummary, setRoundSummary] = React.useState([]);
  const matchFeedRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const matchControlsRef = React.useRef({
    isPaused: false,
    addEvent: null,
    setLiveScore: null,
    setVisibleEvents: null,
    pauseMatch: null,
    resumeMatch: null,
    forceEnd: null,
    resumeSecondHalf: null,
    autoSimulate: false,
  });

  const { handleGoToNextMatch } = useRoundAdvance(
    gameData,
    setGameData,
    setScreen,
    showToast,
    setLineupDialog,
    intervalRef,
    matchControlsRef,
    setSimulating,
  );

  const playResult = React.useCallback((matchData) => {
    setScreen('match_result');
    startMatchPlayback({
      matchData,
      intervalRef,
      matchControlsRef,
      setSimulating,
      setVisibleEvents,
      setLiveScore,
    });
  }, [setScreen]);

  const startMatchSimulation = React.useCallback((options = {}) => {
    if (!gameData || simulating) return;

    const preflight = inspectMatchStart(gameData);
    if (preflight.status === 'blocked') return;

    if (preflight.status === 'state-update') {
      setGameData(preflight.nextState);
      return;
    }

    if (preflight.status === 'lineup-count') {
      setLineupDialog({ open: true, n: preflight.starters.length });
      setScreen('lineup');
      return;
    }

    if (preflight.status === 'illegal-player') {
      const illegal = preflight.illegalPlayer;
      const injured = Boolean(illegal.injury);
      showToast(
        `🚨 JUIZ BARROU: ${illegal.name} está ${injured ? 'lesionado 🚑' : 'suspenso 🟥'} e não pode jogar!`,
        'error',
      );
      setGameData((prev) => ({
        ...prev,
        players: (prev.players || []).map((player) => (
          player.id === illegal.id ? { ...player, isStarting: false } : player
        )),
      }));
      setScreen('lineup');
      return;
    }

    if (preflight.status === 'skip-inactive-cups') {
      setGameData((prev) => ({ ...prev, round: prev.round + preflight.skipCount }));
      return;
    }

    const starters = preflight.starters;
    const tactics = getLineupValidation(gameData);
    const calendarEntry = preflight.calendarEntry;
    matchControlsRef.current.autoSimulate = options?.autoSimulate === true;

    if (calendarEntry?.type === 'cup') {
      const cupRound = simulateCupRound({ gameData, calendarEntry, tactics, starters });
      if (cupRound.inactive) {
        setGameData((prev) => ({ ...prev, round: prev.round + 1 }));
        return;
      }

      setRoundSummary([]);
      setMatchResultData({ ...cupRound.userMatchData, cupEvents: cupRound.cupEvents });
      setGameData(buildCupPostMatchState(gameData, cupRound));
      playResult(cupRound.userMatchData);
      return;
    }

    const leagueIdx = calendarEntry?.leagueIdx ?? gameData.round;
    const leagueRound = simulateLeagueRound({ gameData, leagueIdx, tactics, starters });
    if (leagueRound.empty) {
      setGameData((prev) => ({
        ...prev,
        round: prev.round + 1,
        leagueRound: (prev.leagueRound ?? 0) + 1,
      }));
      return;
    }

    leagueRound.updatedPlayers = processLeaguePlayers({
      gameData,
      userMatchData: leagueRound.userMatchData,
      allRawEvents: leagueRound.allRawEvents,
    });

    const completed = completeLeagueRound({
      gameData,
      leagueRound,
      calculateMorale,
    });

    setRoundSummary(leagueRound.currentMatches);
    setMatchResultData({ ...leagueRound.userMatchData, cupEvents: [] });
    setGameData(completed.nextState);
    if (completed.stadiumCompleted) {
      setTimeout(() => showToast('🏟️ Obras concluídas! +5.000 lugares no estádio.', 'success'), 200);
    }
    playResult(leagueRound.userMatchData);
  }, [gameData, simulating, setGameData, setScreen, showToast, setLineupDialog, playResult]);

  return {
    simulating,
    visibleEvents,
    liveScore,
    matchResultData,
    roundSummary,
    matchFeedRef,
    matchControlsRef,
    handleGoToNextMatch,
    startMatchSimulation,
  };
};

export { useMatchSimulation };
export default useMatchSimulation;

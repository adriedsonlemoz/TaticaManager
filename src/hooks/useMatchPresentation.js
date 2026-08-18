import React from 'react';
import { SoundEngine } from '../engines/engine_sound.js';
import {
  buildInitialLiveUserPlayers,
  getFinalPossession,
  getUserMatchSide,
  updateLivePossession,
} from '../engines/match/matchPresentationViewModel.js';
import { buildLiveEventMeta } from '../engines/match/matchEventViewModel.js';

const useMatchPresentation = ({
  gameData,
  matchResultData,
  simulating,
  visibleEvents,
  liveScore,
  matchControlsRef,
}) => {
  const [step, setStep] = React.useState(-1);
  const [minute, setMinute] = React.useState(0);
  const [possession, setPossession] = React.useState({ home:50, away:50 });
  const [fieldEvent, setFieldEvent] = React.useState(null);
  const [ballPos, setBallPos] = React.useState({ x:150, y:55 });
  const [showSubs, setShowSubs] = React.useState(false);
  const [subsDone, setSubsDone] = React.useState([]);
  const [selectedStarter, setSelectedStarter] = React.useState(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [goalCelebration, setGoalCelebration] = React.useState(null);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [liveUserPlayers, setLiveUserPlayers] = React.useState([]);
  const [liveFormation, setLiveFormation] = React.useState('4-4-2');
  const [liveStyle, setLiveStyle] = React.useState('Equilibrado');

  const soundEnabledRef = React.useRef(soundEnabled);
  const minuteTimerRef = React.useRef(null);
  const ballTimerRef = React.useRef(null);
  const fieldTimerRef = React.useRef(null);
  const celebrationTimerRef = React.useRef(null);
  const handledEventCountRef = React.useRef(0);
  const matchIdentity = React.useMemo(() => [
    matchResultData?.calendarRound ?? '',
    matchResultData?.leagueRound ?? '',
    matchResultData?.isCupMatch ? 'cup' : 'league',
    matchResultData?.cupLabel ?? '',
    matchResultData?.cupLeg ?? '',
    matchResultData?.homeId ?? matchResultData?.homeName ?? '',
    matchResultData?.awayId ?? matchResultData?.awayName ?? '',
  ].join('|'), [
    matchResultData?.calendarRound,
    matchResultData?.leagueRound,
    matchResultData?.isCupMatch,
    matchResultData?.cupLabel,
    matchResultData?.cupLeg,
    matchResultData?.homeId,
    matchResultData?.awayId,
    matchResultData?.homeName,
    matchResultData?.awayName,
  ]);

  React.useEffect(() => () => {
    clearInterval(minuteTimerRef.current);
    clearInterval(ballTimerRef.current);
    clearTimeout(fieldTimerRef.current);
    clearTimeout(celebrationTimerRef.current);
    SoundEngine?.stopAmbient();
  }, []);

  React.useEffect(() => {
    const unlock = () => SoundEngine?.setEnabled(soundEnabledRef.current);
    window.addEventListener('touchstart', unlock, { once:true });
    window.addEventListener('click', unlock, { once:true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  React.useEffect(() => {
    if (!matchResultData) return;
    handledEventCountRef.current = 0;
    clearTimeout(fieldTimerRef.current);
    clearTimeout(celebrationTimerRef.current);
    fieldTimerRef.current = null;
    celebrationTimerRef.current = null;
    setStep(-1);
    setMinute(0);
    setPossession({ home:50, away:50 });
    setFieldEvent(null);
    setBallPos({ x:150, y:55 });
    setShowSubs(false);
    setSubsDone([]);
    setSelectedStarter(null);
    setIsPaused(false);
    setGoalCelebration(null);
    setLiveUserPlayers(buildInitialLiveUserPlayers(gameData, matchResultData));
    setLiveFormation(gameData?.club?.formation || gameData?.club?.managerProfile?.formation || '4-4-2');
    setLiveStyle(gameData?.club?.managerProfile?.style || 'Equilibrado');

    if (matchControlsRef?.current?.autoSimulate === true) {
      matchControlsRef.current.autoSimulate = false;
      matchControlsRef.current.matchStarted = true;
      matchControlsRef.current.forceEnd?.();
      const resolvedMatch = matchControlsRef.current.getResolvedMatchData?.() || matchResultData;
      matchControlsRef.current.syncLiveState?.();
      setPossession(getFinalPossession(resolvedMatch));
      setMinute(90);
      setStep(5);
    }
  }, [matchIdentity]);

  React.useEffect(() => {
    if ((step === 0 || step === 2) && simulating && !isPaused) SoundEngine?.startAmbient();
    else SoundEngine?.stopAmbient();
    return () => SoundEngine?.stopAmbient();
  }, [step, simulating, isPaused]);

  React.useEffect(() => {
    clearInterval(minuteTimerRef.current);
    if ((step === 0 || step === 2) && simulating && !isPaused) {
      const increment = 45 / (30000 / 100);
      minuteTimerRef.current = setInterval(() => {
        setMinute((current) => Math.min(current + increment, step === 0 ? 45 : 90));
      }, 100);
    }
    return () => clearInterval(minuteTimerRef.current);
  }, [step, simulating, isPaused]);

  React.useEffect(() => {
    if (!simulating && !isPaused && step === 0 && matchResultData) {
      clearInterval(minuteTimerRef.current);
      setMinute(45);
      const timer = setTimeout(() => setStep(1), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [simulating, isPaused, step, matchResultData]);

  React.useEffect(() => {
    if (!simulating && !isPaused && step === 2 && matchResultData) {
      clearInterval(minuteTimerRef.current);
      setMinute(90);
      setPossession(getFinalPossession(matchResultData, possession));
      const timer = setTimeout(() => setStep(5), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [simulating, isPaused, step, matchResultData]);

  React.useEffect(() => {
    clearInterval(ballTimerRef.current);
    if (!simulating || isPaused || (step !== 0 && step !== 2)) return undefined;
    ballTimerRef.current = setInterval(() => {
      setBallPos({ x:40 + Math.random()*220, y:15 + Math.random()*80 });
    }, 1800);
    return () => clearInterval(ballTimerRef.current);
  }, [simulating, isPaused, step]);

  React.useEffect(() => {
    if (!visibleEvents?.length || !matchResultData) return;
    if (visibleEvents.length <= handledEventCountRef.current) return;
    handledEventCountRef.current = visibleEvents.length;

    clearTimeout(fieldTimerRef.current);
    clearTimeout(celebrationTimerRef.current);
    fieldTimerRef.current = null;
    celebrationTimerRef.current = null;
    setFieldEvent(null);
    setGoalCelebration(null);

    const last = visibleEvents[visibleEvents.length - 1];
    const context = {
      homeName: matchResultData.homeName,
      awayName: matchResultData.awayName,
      userTeamName: gameData?.club?.name || '',
    };
    const meta = buildLiveEventMeta(last, context);
    setPossession((prev) => updateLivePossession(prev, last, context));

    if (meta.kind === 'goal') {
      const isHome = meta.side === 'home';
      setFieldEvent({ x:isHome?120:40, y:50, type:'goal' });
      fieldTimerRef.current = setTimeout(() => {
        setFieldEvent(null);
        fieldTimerRef.current = null;
      }, 2500);
      SoundEngine?.playGoal(meta.isUserEvent);
      setGoalCelebration({
        scorer: meta.goal?.scorer || '',
        team: meta.teamName,
        minute: meta.goal?.minuteLabel || meta.goal?.minute || '?',
        isUser: meta.isUserEvent,
        score:`${liveScore.home}–${liveScore.away}`,
      });
      celebrationTimerRef.current = setTimeout(() => {
        setGoalCelebration(null);
        celebrationTimerRef.current = null;
      }, 3500);
      return;
    }

    if (meta.kind === 'red' || meta.kind === 'yellow') {
      setFieldEvent({ x:40+Math.random()*80, y:15+Math.random()*70, type:meta.kind });
      fieldTimerRef.current = setTimeout(() => {
        setFieldEvent(null);
        fieldTimerRef.current = null;
      }, 2500);
      if (meta.kind === 'red') {
        SoundEngine?.playRedCard();
        const userSide = getUserMatchSide(gameData, matchResultData);
        const rawEvent = matchControlsRef?.current?.lastResolvedRawEvent;
        if (userSide && meta.side === userSide && rawEvent && /^(red|red_direct|red_second_yellow)$/.test(String(rawEvent.type || ''))) {
          const redId = rawEvent.playerId == null ? null : String(rawEvent.playerId);
          const redName = String(rawEvent.playerName ?? '').trim();
          setLiveUserPlayers((current) => (Array.isArray(current) ? current : []).map((player) => {
            const sameId = redId != null && player?.id != null && String(player.id) === redId;
            const sameName = redId == null && redName && String(player?.name ?? '').trim() === redName;
            return sameId || sameName ? { ...player, isStarting:false, liveUnavailable:true } : player;
          }));
          if (
            (redId != null && selectedStarter != null && String(selectedStarter) === redId)
            || (redId == null && redName && liveUserPlayers.find((player) => String(player?.id) === String(selectedStarter))?.name === redName)
          ) setSelectedStarter(null);
        }
      } else SoundEngine?.playYellowCard();
      return;
    }

    if (meta.kind === 'end') {
      setPossession(getFinalPossession(matchResultData));
      SoundEngine?.playWhistle('triple');
    }
  }, [visibleEvents?.length, matchResultData, gameData?.club?.name, liveScore.home, liveScore.away]);

  React.useEffect(() => {
    if (step === 0 && simulating) SoundEngine?.playWhistle('double');
    if (step === 2 && simulating) SoundEngine?.playWhistle('single');
  }, [step, simulating]);

  React.useEffect(() => {
    if (!simulating && isPaused && matchControlsRef?.current?.isPaused !== true) {
      setIsPaused(false);
    }
  }, [simulating, isPaused, matchControlsRef]);

  const startMatch = React.useCallback(() => {
    const controls = matchControlsRef?.current;
    if (typeof controls?.startMatch !== 'function') return false;
    if (controls.startMatch() !== true) return false;
    setShowSubs(false);
    setSelectedStarter(null);
    setIsPaused(false);
    setStep(0);
    setMinute(0);
    return true;
  }, [matchControlsRef]);

  const startSecondHalf = React.useCallback(() => {
    const controls = matchControlsRef?.current;
    if (typeof controls?.resumeSecondHalf !== 'function') return false;
    if (controls.resumeSecondHalf() !== true) return false;
    setShowSubs(false);
    setSelectedStarter(null);
    setIsPaused(false);
    setStep(2);
    setMinute(45);
    return true;
  }, [matchControlsRef]);

  const togglePause = React.useCallback(() => {
    const controls = matchControlsRef?.current;
    if (!controls) return false;

    if (isPaused) {
      const resumed = controls.resumeMatch?.() === true;
      setIsPaused(!resumed && controls.isPaused === true);
      return resumed;
    }

    if (!simulating) return false;
    const paused = controls.pauseMatch?.() === true;
    setIsPaused(paused);
    return paused;
  }, [isPaused, simulating, matchControlsRef]);

  const toggleSound = React.useCallback(() => {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    SoundEngine?.setEnabled(next);
  }, []);

  return {
    step,
    setStep,
    minute,
    possession,
    fieldEvent,
    ballPos,
    showSubs,
    setShowSubs,
    subsDone,
    setSubsDone,
    selectedStarter,
    setSelectedStarter,
    isPaused,
    setIsPaused,
    goalCelebration,
    setGoalCelebration,
    soundEnabled,
    liveUserPlayers,
    setLiveUserPlayers,
    liveFormation,
    setLiveFormation,
    liveStyle,
    setLiveStyle,
    startMatch,
    startSecondHalf,
    togglePause,
    toggleSound,
  };
};

export default useMatchPresentation;

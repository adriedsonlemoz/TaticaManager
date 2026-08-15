// @migrated to ES module
import React from 'react';
import { THEME } from '../theme.js';
import { SoundEngine } from '../engines/engine_sound.js';
import ScreenPostMatch from './ScreenPostMatch.jsx';
import SMR_PreMatch from './SMR_PreMatch.jsx';
import SMR_Halftime from './SMR_Halftime.jsx';
import MatchHeader from './match/MatchHeader.jsx';
import MatchLiveView from './match/MatchLiveView.jsx';
import SubstitutionDialog from './match/SubstitutionDialog.jsx';

const C = THEME || {};

const ScreenMatchResult = ({
  gameData, setGameData, matchResultData, simulating, visibleEvents, liveScore,
  matchFeedRef, matchControlsRef, roundSummary, setScreen, formatMoney,
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

  const playersBeforeRef = React.useRef(gameData?.players || []);
  const rawEventsRef = React.useRef([]);
  const timerRef = React.useRef(null);
  const ballRef = React.useRef(null);

  React.useEffect(() => {
    const unlock = () => SoundEngine?.setEnabled(soundEnabled);
    window.addEventListener('touchstart', unlock, { once:true });
    window.addEventListener('click', unlock, { once:true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  React.useEffect(() => {
    if ((step === 0 || step === 2) && simulating && !isPaused) SoundEngine?.startAmbient();
    else SoundEngine?.stopAmbient();
  }, [step, simulating, isPaused]);

  React.useEffect(() => {
    if (!matchResultData || !simulating || step !== -1) return;
    if (matchResultData.rawEvents?.length) rawEventsRef.current = matchResultData.rawEvents;

    if (matchControlsRef?.current?.autoSimulate === true) {
      matchControlsRef.current.autoSimulate = false;
      matchControlsRef.current.forceEnd?.();
      matchControlsRef.current.setLiveScore?.({
        home:matchResultData.homeGoals ?? 0,
        away:matchResultData.awayGoals ?? 0,
      });
      matchControlsRef.current.setVisibleEvents?.(matchResultData.events || []);
      setStep(5);
      setMinute(90);
      return;
    }

    if (matchControlsRef?.current) matchControlsRef.current.autoSimulate = false;
    setStep(0);
    setMinute(0);
    const initHome = matchResultData.homePoss ?? 50;
    setPossession({ home:initHome, away:matchResultData.awayPoss ?? (100-initHome) });
    setSubsDone([]);
  }, [simulating, matchResultData, step, matchControlsRef]);

  React.useEffect(() => {
    clearInterval(timerRef.current);
    if ((step === 0 || step === 2) && simulating && !isPaused) {
      const increment = 45 / (30000 / 100);
      timerRef.current = setInterval(() => {
        setMinute(current => Math.min(current + increment, step === 0 ? 45 : 90));
      }, 100);
    }
    return () => clearInterval(timerRef.current);
  }, [step, simulating, isPaused]);

  React.useEffect(() => {
    if (!simulating && step === 0 && matchResultData) {
      clearInterval(timerRef.current);
      setIsPaused(false);
      setMinute(45);
      const timer = setTimeout(() => setStep(1), 600);
      return () => clearTimeout(timer);
    }
  }, [simulating, step, matchResultData]);

  React.useEffect(() => {
    if (!simulating && step === 2 && matchResultData) {
      clearInterval(timerRef.current);
      setIsPaused(false);
      setMinute(90);
      const timer = setTimeout(() => setStep(5), 600);
      return () => clearTimeout(timer);
    }
  }, [simulating, step, matchResultData]);

  React.useEffect(() => {
    clearInterval(ballRef.current);
    if (!simulating || isPaused) return;
    ballRef.current = setInterval(() => {
      setBallPos({ x:40 + Math.random()*220, y:15 + Math.random()*80 });
    }, 1800);
    return () => clearInterval(ballRef.current);
  }, [simulating, isPaused]);

  React.useEffect(() => {
    if (!visibleEvents.length || !matchResultData) return;
    const last = visibleEvents[visibleEvents.length - 1];
    const isHomeEvent = last.includes(matchResultData.homeName);
    const isUserEvent = last.includes(gameData?.club?.name || '');

    setPossession(prev => {
      const home = isHomeEvent
        ? Math.min(72, prev.home + Math.floor(Math.random()*4) + 1)
        : Math.max(28, prev.home - Math.floor(Math.random()*4) - 1);
      return { home, away:100-home };
    });

    const eventType = last.includes('⚽') || last.includes('GOL') ? 'goal'
      : last.includes('🟥') ? 'red'
      : last.includes('🟨') ? 'yellow'
      : last.includes('FIM DE JOGO') ? 'end'
      : null;

    if (eventType === 'goal') {
      setFieldEvent({ x:isHomeEvent?120:40, y:50, type:'goal' });
      const fieldTimer = setTimeout(() => setFieldEvent(null), 2500);
      SoundEngine?.playGoal(isUserEvent);
      const goalMinute = last.match(/^(\d+)'/)?.[1] || '?';
      const scorer = last.match(/\(([^)]+)\)/)?.[1] || '';
      const team = isHomeEvent ? matchResultData.homeName : matchResultData.awayName;
      setGoalCelebration({ scorer, team, minute:goalMinute, isUser:isUserEvent, score:`${liveScore.home}–${liveScore.away}` });
      const celebrationTimer = setTimeout(() => setGoalCelebration(null), 3500);
      return () => { clearTimeout(fieldTimer); clearTimeout(celebrationTimer); };
    }

    if (eventType === 'red' || eventType === 'yellow') {
      setFieldEvent({ x:40+Math.random()*80, y:15+Math.random()*70, type:eventType });
      const timer = setTimeout(() => setFieldEvent(null), 2500);
      if (eventType === 'red') SoundEngine?.playRedCard();
      else SoundEngine?.playYellowCard();
      return () => clearTimeout(timer);
    }

    if (eventType === 'end') SoundEngine?.playWhistle('triple');
    else setFieldEvent(null);
  }, [visibleEvents.length]);

  React.useEffect(() => {
    if (step === 0 && simulating) SoundEngine?.playWhistle('double');
    if (step === 2 && simulating) SoundEngine?.playWhistle('single');
  }, [step, simulating]);

  if (!matchResultData) return null;

  const { homeName, awayName, events = [] } = matchResultData;
  const isUserH = homeName === gameData?.club?.name;
  const userScore = isUserH ? liveScore.home : liveScore.away;
  const opponentScore = isUserH ? liveScore.away : liveScore.home;
  const resultColor = userScore > opponentScore ? C.green : userScore < opponentScore ? C.red : C.yellow;
  const goalEvts = events.filter(e => e.includes('GOL') || e.includes('⚽'));
  const yellowEvts = events.filter(e => e.includes('🟨'));

  const parseGoal = event => {
    const min = event.match(/^(\d+)'/)?.[1] || '';
    const scorer = event.match(/\(([^)]+)\)/)?.[1] || '';
    const isOwnGoal = event.includes('GOL CONTRA');
    const isHome = isOwnGoal ? !event.includes(`(${homeName})`) : event.includes(homeName);
    return { min, scorer, isHome };
  };

  const headerJSX = (
    <MatchHeader
      gameData={gameData}
      matchResultData={matchResultData}
      liveScore={liveScore}
      minute={minute}
      step={step}
      simulating={simulating}
      resultColor={resultColor}
    />
  );

  const halftimeSubsDialog = (
    <SubstitutionDialog
      open={showSubs}
      onClose={() => setShowSubs(false)}
      step={1}
      minute={45}
      players={gameData?.players || []}
      setGameData={setGameData}
      subsDone={subsDone}
      setSubsDone={setSubsDone}
      selectedStarter={selectedStarter}
      setSelectedStarter={setSelectedStarter}
      matchControlsRef={matchControlsRef}
      isUserH={isUserH}
      homeName={homeName}
      awayName={awayName}
    />
  );

  if (step === -1) {
    return <SMR_PreMatch gameData={gameData} matchResultData={matchResultData} headerJSX={headerJSX} onStart={() => setStep(0)} />;
  }

  if (step === 0 || step === 2) {
    return (
      <MatchLiveView
        step={step}
        header={headerJSX}
        gameData={gameData}
        setGameData={setGameData}
        matchResultData={matchResultData}
        liveScore={liveScore}
        possession={possession}
        fieldEvent={fieldEvent}
        ballPos={ballPos}
        visibleEvents={visibleEvents}
        matchFeedRef={matchFeedRef}
        simulating={simulating}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        matchControlsRef={matchControlsRef}
        subsDone={subsDone}
        setSubsDone={setSubsDone}
        showSubs={showSubs}
        setShowSubs={setShowSubs}
        selectedStarter={selectedStarter}
        setSelectedStarter={setSelectedStarter}
        minute={minute}
        goalCelebration={goalCelebration}
        setGoalCelebration={setGoalCelebration}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onContinue={() => {
          if (step === 2 && matchControlsRef?.current) matchControlsRef.current.isPaused = false;
          setStep(step === 0 ? 1 : 5);
        }}
      />
    );
  }

  if (step === 1) {
    return (
      <SMR_Halftime
        gameData={gameData}
        matchResultData={matchResultData}
        possession={possession}
        goalEvts={goalEvts}
        yellowEvts={yellowEvts}
        subsDone={subsDone}
        isUserH={isUserH}
        headerJSX={headerJSX}
        subsDialogJSX={halftimeSubsDialog}
        parseGoal={parseGoal}
        setShowSubs={setShowSubs}
        setSelectedStarter={setSelectedStarter}
        setGameData={setGameData}
        onStart2T={() => {
          setStep(2);
          matchControlsRef.current?.resumeSecondHalf?.();
        }}
      />
    );
  }

  if (step >= 5) {
    return (
      <ScreenPostMatch
        gameData={gameData}
        matchResultData={matchResultData}
        liveScore={liveScore}
        possession={possession}
        subsDone={subsDone}
        roundSummary={roundSummary}
        setScreen={setScreen}
        formatMoney={formatMoney}
        playersBefore={playersBeforeRef.current}
        rawEvents={rawEventsRef.current}
      />
    );
  }

  return null;
};

export default ScreenMatchResult;

import React from 'react';
import { THEME } from '../theme.js';
import useMatchPresentation from '../hooks/useMatchPresentation.js';
import { getMatchResultMeta } from '../engines/match/matchPresentationViewModel.js';
import { isGoalMatchEvent } from '../engines/match/matchEventViewModel.js';
import ScreenPostMatch from './ScreenPostMatch.jsx';
import SMR_PreMatch from './SMR_PreMatch.jsx';
import SMR_Halftime from './SMR_Halftime.jsx';
import MatchHeader from './match/MatchHeader.jsx';
import MatchLiveView from './match/MatchLiveView.jsx';
import SubstitutionDialog from './match/SubstitutionDialog.jsx';

const C = THEME || {};
const resultColorMap = { win:C.green, loss:C.red, draw:C.yellow };

const ScreenMatchResult = ({
  gameData, matchResultData, simulating, visibleEvents, liveScore, liveMinute,
  matchFeedRef, matchControlsRef, roundSummary, setScreen, formatMoney,
}) => {
  const presentation = useMatchPresentation({
    gameData,
    matchResultData,
    simulating,
    visibleEvents,
    liveScore,
    liveMinute,
    matchControlsRef,
  });

  if (!matchResultData) return null;

  const {
    step, setStep, minute, possession, fieldEvent, ballPos,
    showSubs, setShowSubs, subsDone, setSubsDone,
    selectedStarter, setSelectedStarter, isPaused,
    goalCelebration, setGoalCelebration, soundEnabled,
    liveUserPlayers, setLiveUserPlayers, liveFormation, setLiveFormation,
    liveStyle, setLiveStyle, startMatch, startSecondHalf,
    togglePause, toggleSound,
  } = presentation;

  const { homeName, awayName } = matchResultData;
  const events = Array.isArray(matchResultData.events) ? matchResultData.events : [];
  const meta = getMatchResultMeta({ gameData, matchResultData, liveScore });
  const resultColor = resultColorMap[meta.result] || C.yellow;
  const goalEvts = events.filter(isGoalMatchEvent);
  const yellowEvts = events.filter((event) => typeof event === 'string' && event.includes('🟨'));

  const userRosterBefore = meta.isUserHome ? matchResultData?.rosters?.home : matchResultData?.rosters?.away;
  const playersBefore = Array.isArray(userRosterBefore) && userRosterBefore.length
    ? userRosterBefore
    : (gameData?.players || []);

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
      players={liveUserPlayers}
      setPlayers={setLiveUserPlayers}
      subsDone={subsDone}
      setSubsDone={setSubsDone}
      selectedStarter={selectedStarter}
      setSelectedStarter={setSelectedStarter}
      matchControlsRef={matchControlsRef}
      userSide={meta.userSide}
      canSubstitute={Boolean(meta.userSide)}
      homeName={homeName}
      awayName={awayName}
      matchRound={matchResultData.calendarRound ?? 0}
    />
  );

  if (step === -1) {
    return <SMR_PreMatch gameData={gameData} matchResultData={matchResultData} headerJSX={headerJSX} onStart={startMatch} />;
  }

  if (step === 0 || step === 2) {
    return (
      <MatchLiveView
        step={step}
        header={headerJSX}
        gameData={gameData}
        matchResultData={matchResultData}
        liveScore={liveScore}
        possession={possession}
        fieldEvent={fieldEvent}
        ballPos={ballPos}
        visibleEvents={visibleEvents}
        matchFeedRef={matchFeedRef}
        simulating={simulating}
        isPaused={isPaused}
        togglePause={togglePause}
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
        toggleSound={toggleSound}
        liveUserPlayers={liveUserPlayers}
        setLiveUserPlayers={setLiveUserPlayers}
        liveFormation={liveFormation}
        onContinue={() => setStep(step === 0 ? 1 : 5)}
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
        isUserH={meta.isUserHome}
        headerJSX={headerJSX}
        subsDialogJSX={halftimeSubsDialog}
        setShowSubs={setShowSubs}
        setSelectedStarter={setSelectedStarter}
        liveFormation={liveFormation}
        liveStyle={liveStyle}
        livePlayers={liveUserPlayers}
        onApplyTactics={({ formation, style }) => {
          setLiveFormation(formation);
          setLiveStyle(style);
        }}
        onStart2T={startSecondHalf}
      />
    );
  }

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
      playersBefore={playersBefore}
      rawEvents={Array.isArray(matchResultData.rawEvents) ? matchResultData.rawEvents : []}
    />
  );
};

export default ScreenMatchResult;

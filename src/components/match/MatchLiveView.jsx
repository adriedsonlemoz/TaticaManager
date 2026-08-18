import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import MatchField from './MatchField.jsx';
import MatchNarration from './MatchNarration.jsx';
import MatchBench from './MatchBench.jsx';
import SubstitutionDialog from './SubstitutionDialog.jsx';
import { GoalCelebration, PausedOverlay, SoundToggle } from './MatchOverlays.jsx';
import { getUserMatchSide } from '../../engines/match/matchPresentationViewModel.js';
import { MAX_LIVE_SUBSTITUTIONS, normalizeLiveSubstitutions } from '../../engines/match/matchSubstitutionViewModel.js';

const C = THEME || {};

const ActionPill = ({ onClick, children, sx = {} }) => (
  <Box component="button" type="button" onClick={onClick} sx={{ border:0, fontFamily:'inherit', ...sx }}>
    {children}
  </Box>
);

const MatchLiveView = ({
  step, header, gameData, matchResultData, liveScore,
  possession, fieldEvent, ballPos, visibleEvents, matchFeedRef,
  simulating, isPaused, togglePause, matchControlsRef,
  subsDone, setSubsDone, showSubs, setShowSubs,
  selectedStarter, setSelectedStarter, minute,
  goalCelebration, setGoalCelebration, soundEnabled, toggleSound,
  liveUserPlayers, setLiveUserPlayers, liveFormation,
  onContinue,
}) => {
  const isSecondHalf = step === 2;
  const isLive = simulating && !isPaused;
  const userSide = getUserMatchSide(gameData, matchResultData);
  const substitutions = normalizeLiveSubstitutions(subsDone);
  const canOpenSubs = Boolean(userSide) && substitutions.length < MAX_LIVE_SUBSTITUTIONS && (simulating || isPaused);

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:isSecondHalf?1:14 }}>
      {header}
      <Box sx={{ px:1.5, pt:1, pb:isSecondHalf?2:0 }}>
        <MatchField
          gameData={gameData}
          matchResultData={matchResultData}
          liveUserPlayers={liveUserPlayers}
          liveFormation={liveFormation}
          liveActiveLineups={matchControlsRef?.current?.liveActiveLineups}
          isLive={isLive}
          fieldEvent={fieldEvent}
          ballPos={ballPos}
          possession={possession}
        />
        <MatchNarration step={step} isLive={isLive} visibleEvents={visibleEvents} matchFeedRef={matchFeedRef} />
        <MatchBench players={liveUserPlayers} subsDone={substitutions} />
      </Box>

      <Box sx={{ position:'fixed', bottom:76, left:0, right:0, zIndex:50, display:'flex', justifyContent:'center', gap:1, px:1.5, pointerEvents:'none' }}>
        {(simulating || isPaused) && (
          <ActionPill onClick={togglePause} sx={{ pointerEvents:'auto', bgcolor:isPaused?C.green:C.yellow, borderRadius:'50px', px:1.6, py:0.85, display:'flex', alignItems:'center', gap:0.6, boxShadow:`0 4px 16px ${isPaused?C.green:C.yellow}60`, cursor:'pointer', '&:active':{filter:'brightness(0.85)'} }}>
            <Typography sx={{fontSize:'0.9rem',lineHeight:1}}>{isPaused?'▶':'⏸'}</Typography>
            <Typography sx={{color:'#0f172a',fontWeight:900,fontSize:'0.65rem'}}>{isPaused?'RETOMAR':'PAUSAR'}</Typography>
          </ActionPill>
        )}
        {canOpenSubs && (
          <ActionPill onClick={() => { setShowSubs(true); setSelectedStarter(null); }} sx={{ pointerEvents:'auto', bgcolor:C.card, border:`1.5px solid ${C.yellow}`, borderRadius:'50px', px:1.4, py:0.85, display:'flex', alignItems:'center', gap:0.6, boxShadow:'0 4px 14px rgba(0,0,0,0.4)', cursor:'pointer', '&:active':{filter:'brightness(1.15)'} }}>
            <Typography sx={{fontSize:'0.9rem',lineHeight:1}}>🔄</Typography>
            <Typography sx={{color:C.yellow,fontWeight:900,fontSize:'0.65rem'}}>SUB ({MAX_LIVE_SUBSTITUTIONS-substitutions.length})</Typography>
          </ActionPill>
        )}
      </Box>

      {isPaused && <PausedOverlay secondHalf={isSecondHalf} />}
      <SubstitutionDialog
        open={showSubs}
        onClose={() => setShowSubs(false)}
        step={step}
        minute={minute}
        players={liveUserPlayers}
        setPlayers={setLiveUserPlayers}
        subsDone={substitutions}
        setSubsDone={setSubsDone}
        selectedStarter={selectedStarter}
        setSelectedStarter={setSelectedStarter}
        matchControlsRef={matchControlsRef}
        userSide={userSide}
        canSubstitute={Boolean(userSide) && (simulating || isPaused)}
        homeName={matchResultData.homeName}
        awayName={matchResultData.awayName}
        matchRound={matchResultData.calendarRound ?? 0}
      />
      <GoalCelebration celebration={goalCelebration} onClose={() => setGoalCelebration(null)} />
      <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />

      {!simulating && !isPaused && (
        <Box sx={{ position:'fixed', bottom:62, left:0, right:0, zIndex:50, px:1.5, pb:1.5, pt:1.5, background:`linear-gradient(transparent 0%,${C.bg} 35%)`, boxShadow:`0 -12px 28px ${C.bg}` }}>
          <ActionPill onClick={onContinue} sx={{ width:'100%', bgcolor:isSecondHalf?C.green:C.yellow, borderRadius:'14px', py:1.4, display:'flex', alignItems:'center', justifyContent:'center', gap:1, cursor:'pointer', boxShadow:`0 0 ${isSecondHalf?28:24}px ${isSecondHalf?C.green:C.yellow}50`, '&:active':{filter:'brightness(0.88)'} }}>
            <Typography sx={{fontSize:'1.1rem',lineHeight:1}}>{isSecondHalf?'✅':'⏸'}</Typography>
            <Typography sx={{color:'#000',fontWeight:900,fontSize:'0.95rem'}}>{isSecondHalf?'VER RESUMO DO JOGO':'VER INTERVALO'}</Typography>
          </ActionPill>
        </Box>
      )}
    </Box>
  );
};

export default MatchLiveView;

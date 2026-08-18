import React from 'react';
import { Box } from '@mui/material';
import { buildMatchFieldViewModel } from '../../engines/match/matchFieldViewModel.js';
import MatchFieldFooter from './MatchFieldFooter.jsx';
import MatchPitchSvg from './MatchPitchSvg.jsx';
import MatchPlayerMarkers from './MatchPlayerMarkers.jsx';

const MatchField = ({ gameData, matchResultData, liveUserPlayers, liveFormation, liveActiveLineups, isLive, fieldEvent, ballPos, possession }) => {
  const model = buildMatchFieldViewModel({ gameData, matchResultData, liveUserPlayers, liveFormation, liveActiveLineups });
  return (
    <Box sx={{ borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', mb:1 }}>
      <Box sx={{ position:'relative', width:'100%' }}>
        <MatchPitchSvg isLive={isLive} fieldEvent={fieldEvent} ballPos={ballPos} />
        <MatchPlayerMarkers homeDots={model.homeDots} awayDots={model.awayDots} />
      </Box>
      <MatchFieldFooter
        homeName={model.homeName}
        awayName={model.awayName}
        homeFormation={model.homeFormation}
        awayFormation={model.awayFormation}
        isUserHome={model.isUserHome}
        possession={possession}
      />
    </Box>
  );
};

export default MatchField;

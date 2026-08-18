import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TeamIcon } from '../../data/database_branding.js';
import { getMatchCompetitionLabel } from '../../engines/match/matchPresentationViewModel.js';

const C = THEME;

const PostMatchHeader = ({ gameData, matchResultData, liveScore, resultLabel, resultColor, matchDateStr }) => {
  const { homeName, awayName } = matchResultData;

  return (
    <Box sx={{
      background: `linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,
      borderBottom: `1px solid ${C.border}`,
      px: 1.5,
      pt: 3.2,
      pb: 1,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.8 }}>
        <Box sx={{ bgcolor: `${resultColor}12`, border: `1px solid ${resultColor}50`, borderRadius: 20, px: 1, py: 0.25 }}>
          <Typography sx={{ color: resultColor, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 2 }}>{resultLabel}</Typography>
        </Box>
        <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>
          {getMatchCompetitionLabel(gameData, matchResultData)}
          {matchDateStr ? ` · ${matchDateStr}` : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[{ name: homeName }, null, { name: awayName }].map(side => side === null ? (
          <Box key="score" sx={{ bgcolor: C.bgCard, border: `2px solid ${resultColor}60`, borderRadius: '10px', px: 1.4, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0, boxShadow: `0 0 12px ${resultColor}25` }}>
            <Typography sx={{ fontWeight: 900, fontSize: '1.55rem', lineHeight: 1, color: resultColor, fontFamily: 'monospace', minWidth: 22, textAlign: 'center' }}>{liveScore.home}</Typography>
            <Typography sx={{ color: C.ink3, fontWeight: 900, fontSize: '1rem', px: 0.1 }}>–</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: '1.55rem', lineHeight: 1, color: resultColor, fontFamily: 'monospace', minWidth: 22, textAlign: 'center' }}>{liveScore.away}</Typography>
          </Box>
        ) : (
          <Box key={side.name} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: 'rgba(44,24,0,0.04)', border: `1.5px solid ${side.name === gameData?.club?.name ? C.green : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {TeamIcon ? React.createElement(TeamIcon, { name: side.name, size: 26 }) : <Typography sx={{ fontSize: '1rem' }}>⚽</Typography>}
            </Box>
            <Typography sx={{ color: side.name === gameData?.club?.name ? C.green : C.ink2, fontWeight: 900, fontSize: '0.6rem', textAlign: 'center', lineHeight: 1.1, maxWidth: 68, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {side.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PostMatchHeader;

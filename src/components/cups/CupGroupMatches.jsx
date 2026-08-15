import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { getGroupMatchDisplay } from './cupPresentation.js';

const CupGroupMatches = ({ matches = [], color }) => {
  const C = THEME;
  if (!matches.length) return null;

  return (
    <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1 }}>
      <Box sx={{ px: 1.5, py: 0.8, bgcolor: `${color}15`, borderBottom: `1px solid ${color}40` }}>
        <Typography sx={{ color, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>JOGOS DO GRUPO</Typography>
      </Box>
      {matches.map((match, index) => {
        const display = getGroupMatchDisplay(match);
        return (
          <Box key={match.id || index} sx={{
            display: 'flex', alignItems: 'center', px: 1.2, py: 0.7,
            borderBottom: index < matches.length - 1 ? `1px solid ${C.border}` : 'none',
            bgcolor: display.isUserGame ? 'rgba(34,197,94,0.04)' : 'transparent',
          }}>
            <Box sx={{ bgcolor: C.cardAlt, borderRadius: '4px', px: 0.6, py: 0.2, minWidth: 36, textAlign: 'center', mr: 1, flexShrink: 0 }}>
              <Typography sx={{ color: C.txt3, fontSize: '0.52rem', fontWeight: 700 }}>R {display.rounds}</Typography>
            </Box>
            <Typography sx={{ flex: 1, textAlign: 'right', color: match.home?.isPlayer ? C.primary : C.txt2, fontWeight: match.home?.isPlayer ? 900 : 600, fontSize: '0.68rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {match.home?.name || '?'}
            </Typography>
            <Box sx={{ mx: 0.8, minWidth: 62, textAlign: 'center', flexShrink: 0, bgcolor: C.cardAlt, borderRadius: '4px', px: 0.5, py: 0.2 }}>
              <Typography sx={{ color: match.leg1?.played ? C.txt1 : C.txt3, fontWeight: 900, fontSize: '0.56rem', fontFamily: 'monospace' }}>
                I {display.leg1Score}
              </Typography>
              <Typography sx={{ color: match.leg2?.played ? C.txt1 : C.txt3, fontWeight: 900, fontSize: '0.56rem', fontFamily: 'monospace' }}>
                V {display.leg2Score}
              </Typography>
            </Box>
            <Typography sx={{ flex: 1, color: match.away?.isPlayer ? C.primary : C.txt2, fontWeight: match.away?.isPlayer ? 900 : 600, fontSize: '0.68rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {match.away?.name || '?'}
            </Typography>
            {match.leg1?.played && (
              <Box sx={{ ml: 0.8, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.65rem' }}>{match.decided ? '✓' : '🔄'}</Typography>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default CupGroupMatches;

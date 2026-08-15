import React from 'react';
import { Box, Typography } from '@mui/material';
import { C, N } from './matchesTheme.js';

const MatchesHeader = ({ gameData, setScreen }) => {
  const maxRounds = gameData.fixtures?.length || 0;
  const leagueRound = gameData.leagueRound ?? Math.min(gameData.round ?? 0, maxRounds);
  return (
    <Box sx={{
      background: `linear-gradient(180deg, ${C.bgHeader} 0%, ${C.bg} 100%)`,
      px: 2, pt: 2.5, pb: 1.5,
      borderBottom: `1px solid ${N.border}`,
      display: 'flex', alignItems: 'center', gap: 1.2,
    }}>
      <Box onClick={() => setScreen('home')} sx={{
        width: 32, height: 32, borderRadius: '50%',
        bgcolor: C.bgDark, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: N.txt2, fontSize: '1rem', fontWeight: 900,
        '&:active': { bgcolor: C.bgDark },
      }}>❮</Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: N.txt1, fontWeight: 900, fontSize: '0.92rem', letterSpacing: 1.5 }}>
          PRÓXIMAS PARTIDAS
        </Typography>
        <Typography sx={{ color: N.txt3, fontSize: '0.52rem', fontWeight: 700, mt: 0.2 }}>
          {gameData.club?.name?.toUpperCase()} · TEMPORADA {gameData.season || 2026}
        </Typography>
      </Box>
      <Box sx={{ bgcolor: `${N.accent}20`, border: `1px solid ${N.accent}40`, borderRadius: '8px', px: 1, py: 0.4 }}>
        <Typography sx={{ color: N.accent, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5 }}>
          ROD {Math.min(leagueRound + 1, maxRounds)}/{maxRounds}
        </Typography>
      </Box>
    </Box>
  );
};

export default MatchesHeader;

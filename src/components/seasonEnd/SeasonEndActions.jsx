import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';

export default function SeasonEndActions({ color, nextSeason, onStart, onTable }) {
  return (
    <Box sx={{ px: 1.5, mt: 2 }}>
      <Box
        component="button"
        type="button"
        onClick={onStart}
        sx={{ width: '100%', border: 0, bgcolor: color, borderRadius: '12px', py: 1.6, textAlign: 'center', cursor: 'pointer', boxShadow: `0 0 24px ${color}40`, mb: 1, '&:active': { filter: 'brightness(0.9)' } }}
      >
        <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '1rem', letterSpacing: 1 }}>
          🏟️ INICIAR TEMPORADA {nextSeason}
        </Typography>
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onTable}
        sx={{ width: '100%', bgcolor: 'transparent', border: `1px solid ${D.border}`, borderRadius: '10px', py: 1.2, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}
      >
        <Typography sx={{ color: D.txt2, fontWeight: 700, fontSize: '0.82rem' }}>📊 Ver Tabela Final</Typography>
      </Box>
    </Box>
  );
}

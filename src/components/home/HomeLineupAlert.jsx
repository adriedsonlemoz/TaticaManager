import React from 'react';
import { Box, Typography } from '@mui/material';
import { HOME_THEME } from './homeTheme.js';

export default function HomeLineupAlert({ lineup, onOpenLineup }) {
  if (!lineup.needsAttention) return null;

  const title = lineup.invalidStarters.length > 0
    ? `Corrija ${lineup.invalidStarters.length} jogador(es) inapto(s)!`
    : 'Escale o time antes de jogar!';

  return (
    <Box component="button" type="button" onClick={onOpenLineup} sx={{
      width: 'calc(100% - 32px)', mx: 2, mb: 1.2, bgcolor: '#fef2f2', border: '1.5px solid #fca5a5',
      borderRadius: '14px', px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1,
      cursor: 'pointer', animation: 'v1-pulse 2s infinite', textAlign: 'left', font: 'inherit',
    }}>
      <Typography sx={{ fontSize: '1.3rem' }}>📋</Typography>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: HOME_THEME.red, fontWeight: 900, fontSize: '0.78rem' }}>{title}</Typography>
        <Typography sx={{ color: '#9ca3af', fontSize: '0.58rem', fontWeight: 700 }}>Toque para abrir a prancheta →</Typography>
      </Box>
    </Box>
  );
}

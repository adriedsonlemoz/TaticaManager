import React from 'react';
import { Box, Typography } from '@mui/material';
import { HOME_THEME } from './homeTheme.js';

export default function HomeLineupAlert({ lineup, onOpenLineup, theme = HOME_THEME }) {
  if (!lineup.needsAttention) return null;

  const title = lineup.invalidStarters.length > 0
    ? `Corrija ${lineup.invalidStarters.length} jogador(es) inapto(s)!`
    : 'Escale o time antes de jogar!';

  return (
    <Box component="button" type="button" onClick={onOpenLineup} sx={{
      width: 'calc(100% - 20px)', mx: 1.25, mb: 0.75, bgcolor: '#fef2f2', border: '1.5px solid #fca5a5',
      borderRadius: '11px', px: 1, py: 0.7, display: 'flex', alignItems: 'center', gap: 1,
      cursor: 'pointer', animation: 'v1-pulse 2s infinite', textAlign: 'left', font: 'inherit',
    }}>
      <Typography sx={{ fontSize: '1.05rem' }}>📋</Typography>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: theme.red, fontWeight: 900, fontSize: '0.78rem' }}>{title}</Typography>
        <Typography sx={{ color: '#9ca3af', fontSize: '0.58rem', fontWeight: 700 }}>Toque para abrir a prancheta →</Typography>
      </Box>
    </Box>
  );
}

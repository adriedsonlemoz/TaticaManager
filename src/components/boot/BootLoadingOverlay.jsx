import React from 'react';
import { Box, Typography } from '@mui/material';

const BootLoadingOverlay = ({ saveName, theme }) => {
  if (!saveName) return null;
  const C = theme;
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 9999, bgcolor: 'rgba(245,239,228,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Typography sx={{ fontSize: '3.5rem', lineHeight: 1, animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }}>⚽</Typography>
      <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.2rem', letterSpacing: 1 }}>CARREGANDO CARREIRA…</Typography>
      <Typography sx={{ color: C.ink3, fontSize: '0.9rem', fontWeight: 700 }}>{saveName}</Typography>
    </Box>
  );
};

export default BootLoadingOverlay;

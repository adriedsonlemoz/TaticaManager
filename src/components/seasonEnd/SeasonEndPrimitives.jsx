import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';

export function SeasonEndStatCard({ label, value, color = D.txt1 }) {
  return (
    <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', py: 1, px: 0.7, textAlign: 'center' }}>
      <Typography sx={{ color, fontWeight: 900, fontSize: '0.92rem', lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: D.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.2 }}>{label}</Typography>
    </Box>
  );
}

export function SeasonEndSectionTitle({ children }) {
  return (
    <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8, mb: 0.8 }}>
      {children}
    </Typography>
  );
}

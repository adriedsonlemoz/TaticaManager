import React from 'react';
import { Box, Typography } from '@mui/material';
import { HOME_THEME } from './homeTheme.js';

export default function HomeSectionTitle({ children }) {
  return (
    <Typography sx={{
      color: HOME_THEME.grass, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 2,
      fontFamily: '"Cinzel",serif', mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5,
    }}>
      <Box component="span" sx={{ display: 'inline-block', width: 16, height: 2, bgcolor: HOME_THEME.grass, borderRadius: 1 }} />
      {children}
      <Box component="span" sx={{ display: 'inline-block', flex: 1, height: 2, bgcolor: `${HOME_THEME.grass}30`, borderRadius: 1 }} />
    </Typography>
  );
}

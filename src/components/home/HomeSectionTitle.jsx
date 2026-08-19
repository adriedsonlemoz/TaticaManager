import React from 'react';
import { Box, Typography } from '@mui/material';
import { HOME_THEME } from './homeTheme.js';

export default function HomeSectionTitle({ children, theme = HOME_THEME }) {
  return (
    <Typography sx={{
      color: theme.grass, fontWeight: 900, fontSize: '0.64rem', letterSpacing: 1.7,
      fontFamily: '"Cinzel",serif', mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.55,
    }}>
      <Box component="span" sx={{ display: 'inline-block', width: 20, height: 2.5, bgcolor: theme.grass, borderRadius: 1 }} />
      {children}
      <Box component="span" sx={{ display: 'inline-block', flex: 1, height: 2, bgcolor: `${theme.grass}30`, borderRadius: 1 }} />
    </Typography>
  );
}

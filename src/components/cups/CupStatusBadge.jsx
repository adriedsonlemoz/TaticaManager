import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { getCupStatusMeta } from './cupPresentation.js';

const CupStatusBadge = ({ status }) => {
  const C = THEME;
  const meta = getCupStatusMeta(status);
  const palette = {
    primary: { bg: C.primary, text: '#000' },
    danger: { bg: C.red, text: '#fff' },
    gold: { bg: C.gold, text: '#000' },
    neutral: { bg: C.border, text: C.txt2 },
  }[meta.tone];

  return (
    <Box sx={{ bgcolor: palette.bg, borderRadius: '5px', px: 0.8, py: 0.2 }}>
      <Typography sx={{ color: palette.text, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 0.5 }}>
        {meta.label}
      </Typography>
    </Box>
  );
};

export default CupStatusBadge;

import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../../theme.js';

const C = THEME || {};

const MatchCard = ({ children, accent, sx }) => (
  <Box sx={{ bgcolor:C.card, border:`1.5px solid ${accent || C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.2, ...sx }}>
    {children}
  </Box>
);

export default MatchCard;

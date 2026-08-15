import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const C = THEME;

export const PostMatchCard = ({ children, accent, sx: sxExtra }) => (
  <Box sx={{
    bgcolor: C.bgCard,
    border: `1.5px solid ${accent || C.border}`,
    borderRadius: '14px',
    overflow: 'hidden',
    mb: 1.2,
    ...sxExtra,
  }}>
    {children}
  </Box>
);

export const PostMatchCardHead = ({ label, icon, color }) => (
  <Box sx={{
    px: 1.5,
    py: 0.85,
    borderBottom: `1px solid ${C.border}`,
    bgcolor: color ? `${color}0f` : C.bgCardAlt,
    display: 'flex',
    alignItems: 'center',
    gap: 0.8,
  }}>
    {icon && <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</Typography>}
    <Typography sx={{ color: color || C.ink3, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 1.2 }}>
      {label}
    </Typography>
  </Box>
);

export const PostMatchStatRow = ({ label, h, a, lower }) => {
  const total = (h + a) || 1;
  const pct = (h / total) * 100;
  const homeWins = lower ? h <= a : h >= a;

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
        <Typography sx={{ color: homeWins ? C.ink : C.ink3, fontWeight: homeWins ? 900 : 600, fontSize: '0.82rem', width: 32, textAlign: 'right', mr: 0.8 }}>{h}</Typography>
        <Typography sx={{ flex: 1, textAlign: 'center', color: C.ink2, fontWeight: 700, fontSize: '0.56rem', letterSpacing: 0.5 }}>{label}</Typography>
        <Typography sx={{ color: !homeWins ? C.ink : C.ink3, fontWeight: !homeWins ? 900 : 600, fontSize: '0.82rem', width: 32, ml: 0.8 }}>{a}</Typography>
      </Box>
      <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: C.bgCardAlt }}>
        <Box sx={{ width: `${pct}%`, bgcolor: C.green, transition: 'width 0.5s ease' }} />
        <Box sx={{ flex: 1, bgcolor: C.blue, opacity: 0.55 }} />
      </Box>
    </Box>
  );
};

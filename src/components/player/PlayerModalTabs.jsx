import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { PLAYER_MODAL_TABS } from '../../engines/player/playerProfileService.js';

export default function PlayerModalTabs({ tab, onChange }) {
  const C = THEME;
  return (
    <Box sx={{ display: 'flex', bgcolor: C.bg, borderBottom: `1px solid ${C.border}` }}>
      {PLAYER_MODAL_TABS.map((item) => (
        <Box
          key={item.key}
          onClick={() => onChange(item.key)}
          sx={{
            flex: 1,
            py: 1.2,
            textAlign: 'center',
            cursor: 'pointer',
            borderBottom: tab === item.key ? `3px solid ${C.primary}` : '3px solid transparent',
            bgcolor: tab === item.key ? 'rgba(17,138,139,0.05)' : 'transparent',
            transition: 'background 0.2s',
          }}
        >
          <Typography sx={{
            fontWeight: 900,
            fontSize: '0.65rem',
            letterSpacing: 0.5,
            color: tab === item.key ? C.primary : C.txt2,
          }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

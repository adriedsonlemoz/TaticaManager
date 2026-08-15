import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const CupHistory = ({ history = [] }) => {
  const C = THEME;
  if (!history.length) return null;

  return (
    <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: `1px solid ${C.border}` }}>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5 }}>HISTÓRICO</Typography>
      </Box>
      {history.map((item, index) => (
        <Box key={item.id || `${item.phase || item.label || 'fase'}-${index}`} sx={{ px: 1.5, py: 0.6, display: 'flex', justifyContent: 'space-between', borderBottom: index < history.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700 }}>{item.phase || item.label}</Typography>
          {item.winner && (
            <Typography sx={{ color: item.winner.isPlayer ? C.primary : C.red, fontSize: '0.65rem', fontWeight: 900 }}>
              {item.winner.isPlayer ? '✓ Avançou' : '✗ Eliminado'}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CupHistory;

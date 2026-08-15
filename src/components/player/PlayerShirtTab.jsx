import React from 'react';
import { Box, Typography } from '@mui/material';
import { JerseyBadge } from '../../helpers.js';
import { THEME } from '../../theme.js';

export default function PlayerShirtTab({ player, takenShirts, onUpdateShirt }) {
  const C = THEME;
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 900, color: C.txt2, fontSize: '0.7rem', letterSpacing: 1, mb: 0.8 }}>CAMISA ATUAL</Typography>
        <Box sx={{ display: 'inline-flex', justifyContent: 'center' }}>
          <JerseyBadge pos={player.position} num={player.shirt ?? '?'} size={64} showPos />
        </Box>
      </Box>

      <Typography sx={{ color: C.txt3, textAlign: 'center', display: 'block', mb: 1, fontStyle: 'italic', fontSize: '0.65rem' }}>
        Selecione um número livre abaixo.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', maxHeight: 220, overflowY: 'auto', pr: 0.5, pb: 0.5 }}>
        {Array.from({ length: 99 }, (_, index) => index + 1).map((number) => {
          const taken = takenShirts.has(number);
          const current = player.shirt === number;
          return (
            <Box
              key={number}
              onClick={() => { if (!taken) onUpdateShirt(player.id, number); }}
              sx={{
                position: 'relative',
                height: 38,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: taken ? 'default' : 'pointer',
                userSelect: 'none',
                bgcolor: current ? C.primary : taken ? 'rgba(0,0,0,0.05)' : C.card,
                color: current ? '#fff' : taken ? 'rgba(0,0,0,0.2)' : C.txt1,
                border: current ? `2px solid ${C.prim2}` : taken ? '1px solid rgba(0,0,0,0.05)' : `1.5px solid ${C.bord2}`,
                transition: 'all 0.15s',
                '&:hover': !taken && !current ? { bgcolor: 'rgba(17,138,139,0.1)', borderColor: C.primary } : {},
              }}
            >
              {number}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

export const CUP_TABS = [
  { id: 'estadual', label: '🏟️ Estadual', title: '🏟️ Campeonato Estadual', colorKey: 'primary' },
  { id: 'copa', label: '🏆 Copa BR', title: '🏆 Copa do Brasil', colorKey: 'copa' },
  { id: 'liberta', label: '🌟 Liberta', title: '🌟 Libertadores', colorKey: 'liberta' },
  { id: 'sulam', label: '🌎 Sul-Am', title: '🌎 Sul-Americana', colorKey: 'sulam' },
  { id: 'regional', label: '🧭 Regional', title: '🧭 Copa Regional', colorKey: 'primary' },
];

export const CupScreenHeader = () => {
  const C = THEME;
  return (
    <Box sx={{ background: `linear-gradient(180deg, ${C.bgCard} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, px: 2, pt: 4, pb: 2 }}>
      <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem', fontFamily: '"Nunito", sans-serif', letterSpacing: 1 }}>COPAS & TORNEIOS</Typography>
      <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700, mt: 0.2 }}>Os jogos aparecem automaticamente no Calendário</Typography>
    </Box>
  );
};

export const CupTabs = ({ tab, onChange }) => {
  const C = THEME;
  return (
    <Box sx={{ display: 'flex', bgcolor: C.card, borderBottom: `1px solid ${C.border}`, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display:'none' } }}>
      {CUP_TABS.map((item) => {
        const color = C[item.colorKey];
        const active = tab === item.id;
        return (
          <Box key={item.id} onClick={() => onChange(item.id)} sx={{
            flex: '1 0 72px', minWidth: 72, py: 0.9, textAlign: 'center', cursor: 'pointer',
            borderBottom: `3px solid ${active ? color : 'transparent'}`,
            bgcolor: active ? `${color}0d` : 'transparent',
            transition: 'all 0.2s',
          }}>
            <Typography sx={{ color: active ? color : C.txt2, fontWeight: 900, fontSize: '0.65rem' }}>{item.label}</Typography>
          </Box>
        );
      })}
    </Box>
  );
};

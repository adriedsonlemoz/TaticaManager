import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

export const CUP_TABS = [
  { id: 'overview', label: '📋 Visão geral', title: '📋 Competições', colorKey: 'primary' },
  { id: 'estadual', label: '🏟️ Estadual', title: '🏟️ Campeonato Estadual', colorKey: 'primary' },
  { id: 'copa', label: '🏆 Copa BR', title: '🏆 Copa do Brasil', colorKey: 'copa' },
  { id: 'liberta', label: '🌟 Liberta', title: '🌟 Libertadores', colorKey: 'liberta' },
  { id: 'sulam', label: '🌎 Sul-Am', title: '🌎 Sul-Americana', colorKey: 'sulam' },
  { id: 'regional', label: '🧭 Regional', title: '🧭 Copa Regional', colorKey: 'primary' },
];

export const CupScreenHeader = ({ theme = THEME }) => (
  <Box sx={{ background: `linear-gradient(180deg, ${theme.clubTint || theme.bgCard} 0%, ${theme.bg} 100%)`, borderBottom: `1px solid ${theme.clubBorder || theme.border}`, px: 1.5, pt: 3.7, pb: 1.35 }}>
    <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '1.08rem', fontFamily: '"Nunito", sans-serif', letterSpacing: .7 }}>COMPETIÇÕES</Typography>
    <Typography sx={{ color: theme.txt2, fontSize: '0.68rem', fontWeight: 700, mt: 0.2 }}>Classificações, fases, chave do clube e calendário em um só lugar</Typography>
  </Box>
);

export const CupTabs = ({ tab, onChange, theme = THEME }) => (
  <Box sx={{ display: 'flex', bgcolor: theme.card, borderBottom: `1px solid ${theme.border}`, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display:'none' } }}>
    {CUP_TABS.map((item) => {
      const color = item.id === 'overview' || item.id === 'estadual' || item.id === 'regional' ? theme.primary : theme[item.colorKey];
      const active = tab === item.id;
      return (
        <Box key={item.id} onClick={() => onChange(item.id)} sx={{ flex: '0 0 auto', minWidth: item.id === 'overview' ? 92 : 78, px:.7, py: .9, textAlign: 'center', cursor: 'pointer', borderBottom: `3px solid ${active ? color : 'transparent'}`, bgcolor: active ? `${color}0d` : 'transparent', transition: 'all 0.2s' }}>
          <Typography sx={{ color: active ? color : theme.txt2, fontWeight: 900, fontSize: '0.66rem', whiteSpace:'nowrap' }}>{item.label}</Typography>
        </Box>
      );
    })}
  </Box>
);

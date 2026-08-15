import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { ACADEMY_ACCENT, getLevelVisual } from './academyPresentation.js';

export default function AcademyHeader({ clubName, viewModel, tab, onTabChange }) {
  const C = THEME;
  const { academyLevel, levelInfo, prestige, stats } = viewModel;
  const visual = getLevelVisual(academyLevel, C.txt3);
  const tabs = [
    { id: 'squad', label: 'Elenco', icon: '👥' },
    { id: 'invest', label: 'Investir', icon: '🏗️' },
  ];
  const statCards = [
    { label: 'GAROTOS', value: stats.total, color: C.txt1, icon: '👥' },
    { label: 'PRONTOS', value: stats.readyCount, color: stats.readyCount > 0 ? C.green : C.txt3, icon: '🌟' },
    { label: 'OVR MÉD.', value: stats.averageOverall || '—', color: ACADEMY_ACCENT, icon: '⚡' },
    { label: 'POT. MÉD.', value: stats.averagePotential || '—', color: C.green, icon: '🎯' },
  ];

  return (
    <Box sx={{
      background: `linear-gradient(160deg, rgba(124,58,237,0.1) 0%, ${C.card} 55%)`,
      borderBottom: `1px solid ${C.border}`,
      px: 2,
      pt: 4,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
        <Box>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 2, mb: 0.2 }}>🏫 CATEGORIA DE BASE</Typography>
          <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1 }}>{clubName}</Typography>
        </Box>
        <Box sx={{ bgcolor: `${visual.color}18`, border: `1.5px solid ${visual.color}50`, borderRadius: '10px', px: 1, py: 0.5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1rem', lineHeight: 1, mb: 0.1 }}>{visual.icon}</Typography>
          <Typography sx={{ color: visual.color, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 0.5 }}>{levelInfo.label.toUpperCase()}</Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 1.2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
          <Typography sx={{ color: C.txt3, fontWeight: 700, fontSize: '0.52rem' }}>PRESTÍGIO DA ACADEMIA</Typography>
          <Typography sx={{ color: visual.color, fontWeight: 900, fontSize: '0.52rem' }}>{prestige}/100</Typography>
        </Box>
        <Box sx={{ height: 5, bgcolor: C.border, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', width: `${prestige}%`, borderRadius: 3,
            background: `linear-gradient(90deg,${visual.color},${visual.color}bb)`,
            boxShadow: `0 0 8px ${visual.color}60`, transition: 'width 0.5s',
          }} />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.6 }}>
        {statCards.map((item) => (
          <Box key={item.label} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', py: 0.7, px: 0.5, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', lineHeight: 1, mb: 0.15 }}>{item.icon}</Typography>
            <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>{item.value}</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.15 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box role="tablist" aria-label="Seções da categoria de base" sx={{ display: 'flex', mt: 1.2 }}>
        {tabs.map((item) => (
          <Box
            component="button"
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            sx={{
              flex: 1, py: 0.8, textAlign: 'center', cursor: 'pointer', border: 0,
              borderBottom: `2.5px solid ${tab === item.id ? ACADEMY_ACCENT : 'transparent'}`,
              bgcolor: tab === item.id ? 'rgba(124,58,237,0.06)' : 'transparent', transition: 'all 0.15s',
            }}
          >
            <Typography sx={{ fontSize: '0.85rem', lineHeight: 1, mb: 0.1 }}>{item.icon}</Typography>
            <Typography sx={{ color: tab === item.id ? ACADEMY_ACCENT : C.txt3, fontWeight: 900, fontSize: '0.48rem', letterSpacing: 0.3 }}>{item.label.toUpperCase()}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

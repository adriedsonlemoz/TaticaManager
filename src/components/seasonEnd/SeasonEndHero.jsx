import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';

export default function SeasonEndHero({ vm, color }) {
  const r = vm.result;
  const stats = [
    { value: `${r.userPos || '—'}º`, label: 'LUGAR', color },
    { value: r.pts || 0, label: 'PONTOS', color: D.txt1 },
    { value: `${vm.league.wins}V ${vm.league.draws}E ${vm.league.losses}D`, label: 'RESULTADOS', color: D.green, fontSize: '1.1rem' },
  ];

  return (
    <Box sx={{ px: 2, pt: 5, pb: 2.5, textAlign: 'center', background: `linear-gradient(180deg,${color}18 0%,transparent 100%)` }}>
      <Typography sx={{ fontSize: '4rem', lineHeight: 1, mb: 0.8 }}>{vm.icon}</Typography>
      <Typography sx={{ color, fontWeight: 900, fontSize: '1.6rem', letterSpacing: 2, lineHeight: 1, mb: 0.5 }}>{vm.title}</Typography>
      <Typography sx={{ color: D.txt2, fontSize: '0.78rem', fontWeight: 700, mb: 0.3 }}>
        Temporada {r.season || '—'} · Série {r.prevSerie || '—'}
      </Typography>

      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, mt: 1, bgcolor: `${color}18`, border: `1px solid ${color}40`, borderRadius: '12px', px: 2, py: 0.8 }}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            {index > 0 && <Box sx={{ width: 1, height: 28, bgcolor: `${color}40` }} />}
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: stat.color, fontWeight: 900, fontSize: stat.fontSize || '1.4rem', lineHeight: 1 }}>{stat.value}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>{stat.label}</Typography>
            </Box>
          </React.Fragment>
        ))}
      </Box>

      {vm.achievements.length > 0 && (
        <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.6, justifyContent: 'center' }}>
          {vm.achievements.map((achievement) => (
            <Box key={`${achievement.icon}-${achievement.text}`} sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '8px', px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem' }}>{achievement.icon}</Typography>
              <Typography sx={{ color: D.txt1, fontWeight: 700, fontSize: '0.6rem' }}>{achievement.text}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

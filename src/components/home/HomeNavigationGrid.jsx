import React from 'react';
import { Box, Typography } from '@mui/material';
import HomeSectionTitle from './HomeSectionTitle.jsx';
import { HOME_THEME } from './homeTheme.js';

export default function HomeNavigationGrid({ cards, onNavigate, theme = HOME_THEME }) {
  return (
    <Box sx={{ px: 1.25 }}>
      <HomeSectionTitle theme={theme}>NAVEGAÇÃO</HomeSectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.8 }}>
        {cards.map((card, index) => (
          <Box key={card.id} component="button" type="button" onClick={() => onNavigate(card.screen)} aria-label={`${card.label}: ${card.sub}`} sx={{
            position: 'relative', minHeight: 84, borderRadius: '14px', overflow: 'hidden', bgcolor: theme.card,
            border: `1.5px solid ${card.pulse ? '#fca5a5' : theme.border}`, boxShadow: theme.shadow,
            cursor: 'pointer', animation: card.pulse ? 'v1-pulse 2s infinite' : `v1-in ${0.05 + index * 0.04}s ease both`,
            '&:active': { transform: 'scale(0.975)' }, transition: 'transform .15s', p: 0, textAlign: 'left', font: 'inherit',
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${card.color}, ${card.color}55)` }} />
            <Box aria-hidden="true" sx={{ position: 'absolute', bottom: -8, right: 2, fontSize: '3.1rem', opacity: 0.055, pointerEvents: 'none', userSelect: 'none' }}>
              {card.emoji}
            </Box>
            <Box sx={{ px: 1.05, pt: 0.9, pb: 0.9, position: 'relative', display:'grid', gridTemplateColumns:'34px 1fr', columnGap:.75, alignItems:'start' }}>
              {card.badge && (
                <Box sx={{ position: 'absolute', top: 7, right: 8, bgcolor: typeof card.badge === 'number' ? theme.red : card.color, borderRadius: '11px', minWidth: 19, height: 19, px: 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff' }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.58rem' }}>{card.badge}</Typography>
                </Box>
              )}
              <Box sx={{ width:34, height:34, borderRadius:'10px', bgcolor:`${card.color}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Typography aria-hidden="true" sx={{ fontSize: '1.35rem', lineHeight: 1 }}>{card.emoji}</Typography>
              </Box>
              <Box sx={{ minWidth:0, pr:card.badge ? 1.5 : 0 }}>
                <Typography sx={{ color: theme.ink, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1.1, mb: 0.3 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ color: card.color !== theme.ink3 ? card.color : theme.ink3, fontSize: '0.63rem', fontWeight: 750, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {card.sub}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

import React from 'react';
import { Box, Typography } from '@mui/material';
import HomeSectionTitle from './HomeSectionTitle.jsx';
import { HOME_THEME } from './homeTheme.js';

export default function HomeNavigationGrid({ cards, onNavigate }) {
  return (
    <Box sx={{ px: 1.25 }}>
      <HomeSectionTitle>NAVEGAÇÃO</HomeSectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.6 }}>
        {cards.map((card, index) => (
          <Box key={card.id} component="button" type="button" onClick={() => onNavigate(card.screen)} aria-label={`${card.label}: ${card.sub}`} sx={{
            position: 'relative', borderRadius: '12px', overflow: 'hidden', bgcolor: HOME_THEME.card,
            border: `1.5px solid ${card.pulse ? '#fca5a5' : HOME_THEME.border}`, boxShadow: HOME_THEME.shadow,
            cursor: 'pointer', animation: card.pulse ? 'v1-pulse 2s infinite' : `v1-in ${0.05 + index * 0.04}s ease both`,
            '&:active': { transform: 'scale(0.96)' }, transition: 'transform .15s', p: 0, textAlign: 'left', font: 'inherit',
          }}>
            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${card.color}, ${card.color}66)` }} />
            <Box aria-hidden="true" sx={{
              position: 'absolute', bottom: -6, right: -2, fontSize: '2.1rem', opacity: 0.06,
              pointerEvents: 'none', userSelect: 'none', filter: 'saturate(0.5)',
            }}>
              {card.emoji}
            </Box>

            <Box sx={{ px: 0.8, pt: 0.7, pb: 0.72, position: 'relative' }}>
              {card.badge && (
                <Box sx={{
                  position: 'absolute', top: 6, right: 6,
                  bgcolor: typeof card.badge === 'number' ? HOME_THEME.red : 'transparent',
                  borderRadius: '10px', minWidth: 16, height: 16, px: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: typeof card.badge === 'number' ? '1px solid #fff' : 'none',
                }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.4rem' }}>{card.badge}</Typography>
                </Box>
              )}
              <Typography aria-hidden="true" sx={{ fontSize: '1.05rem', lineHeight: 1, mb: 0.4 }}>{card.emoji}</Typography>
              <Typography sx={{ color: HOME_THEME.ink, fontWeight: 900, fontSize: '0.67rem', lineHeight: 1.1, mb: 0.2 }}>
                {card.label}
              </Typography>
              <Typography sx={{
                color: card.color !== HOME_THEME.ink3 ? card.color : HOME_THEME.ink3, fontSize: '0.45rem', fontWeight: 700,
                lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {card.sub}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

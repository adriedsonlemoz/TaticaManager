import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';

const NextMatchOverview = ({ viewModel, theme }) => {
  const {
    displayHome, displayAway, userRow, opponentRow, userPosition, opponentPosition,
    userStrength, opponentStrength, h2hRecord, recentForm,
  } = viewModel;
  const userStrengthColor = userStrength > opponentStrength + 4
    ? theme.green
    : userStrength < opponentStrength - 4 ? theme.red : theme.yellow;
  const homeStrength = displayHome?.isPlayer ? userStrength : opponentStrength;
  const awayStrength = displayAway?.isPlayer ? userStrength : opponentStrength;
  const homeStrengthColor = displayHome?.isPlayer ? userStrengthColor : theme.blue;
  const awayStrengthColor = displayAway?.isPlayer ? userStrengthColor : theme.blue;

  return (
    <Box sx={{ bgcolor: theme.card, border: `1.5px solid ${theme.border}`, borderRadius: '16px', overflow: 'hidden', mb: 1.2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <Box sx={{ px: 2, pt: 1.8, pb: 1.2, display: 'flex', alignItems: 'center', gap: 1, background: `linear-gradient(135deg, ${theme.green}08 0%, transparent 60%)` }}>
        {[displayHome, displayAway].map((team, side) => {
          const isUser = !!team?.isPlayer;
          const row = isUser ? userRow : opponentRow;
          const position = isUser ? userPosition : opponentPosition;
          const isHome = side === 0;
          const accentColor = isUser ? theme.green : theme.blue;
          const label = isHome ? '🏠 CASA' : '✈️ FORA';
          return (
            <Box key={side} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 58, height: 58, borderRadius: '14px', bgcolor: theme.cardAlt, border: `2px solid ${isUser ? theme.green : theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isUser ? `0 0 16px ${theme.green}40` : 'none' }}>
                {team ? <TeamIcon name={team.name} size={42} /> : <Typography sx={{ fontSize: '1.6rem' }}>⚽</Typography>}
              </Box>
              <Typography sx={{ color: isUser ? theme.green : theme.txt1, fontWeight: 900, fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.1, maxWidth: 85 }}>
                {team?.name || '—'}
              </Typography>
              <Box sx={{ bgcolor: `${accentColor}18`, border: `1px solid ${accentColor}35`, borderRadius: '5px', px: 0.7, py: 0.15 }}>
                <Typography sx={{ color: accentColor, fontWeight: 900, fontSize: '0.5rem' }}>{label} · {position > 0 ? `${position}º` : '—'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[
                  { label: 'V', value: row.w || 0, color: theme.green },
                  { label: 'E', value: row.d || 0, color: theme.yellow },
                  { label: 'D', value: row.l || 0, color: theme.red },
                  { label: 'PTS', value: row.pts || 0, color: theme.txt1 },
                ].map((stat) => (
                  <Box key={stat.label} sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: stat.color, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>{stat.value}</Typography>
                    <Typography sx={{ color: theme.txt3, fontSize: '0.42rem', fontWeight: 700 }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ position: 'relative', height: 0, overflow: 'visible' }}>
        <Box sx={{ position: 'absolute', left: '50%', top: 0, transform: 'translate(-50%, -110px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, pointerEvents: 'none', zIndex: 2 }}>
          <Box sx={{ bgcolor: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: '10px', px: 1, py: 0.5 }}>
            <Typography sx={{ color: theme.txt3, fontWeight: 900, fontSize: '1rem', letterSpacing: 3 }}>VS</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ color: homeStrengthColor, fontWeight: 900, fontSize: '0.72rem' }}>{homeStrength}</Typography>
            <Typography sx={{ color: theme.txt3, fontSize: '0.5rem' }}>vs</Typography>
            <Typography sx={{ color: awayStrengthColor, fontWeight: 900, fontSize: '0.72rem' }}>{awayStrength}</Typography>
          </Box>
          <Box sx={{ width: 60, height: 5, bgcolor: theme.bgDark, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${Math.round((homeStrength / Math.max(1, homeStrength + awayStrength)) * 100)}%`, bgcolor: homeStrengthColor, borderRadius: 3 }} />
          </Box>
          {h2hRecord && (
            <Box sx={{ bgcolor: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: '6px', px: 0.8, py: 0.25 }}>
              <Typography sx={{ color: theme.txt3, fontSize: '0.4rem', fontWeight: 700, textAlign: 'center' }}>H2H</Typography>
              <Box sx={{ display: 'flex', gap: 0.4 }}>
                <Typography sx={{ color: theme.green, fontWeight: 900, fontSize: '0.58rem' }}>{h2hRecord.w}V</Typography>
                <Typography sx={{ color: theme.yellow, fontWeight: 900, fontSize: '0.58rem' }}>{h2hRecord.d}E</Typography>
                <Typography sx={{ color: theme.red, fontWeight: 900, fontSize: '0.58rem' }}>{h2hRecord.l}D</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {recentForm.length > 0 && (
        <Box sx={{ px: 2, pb: 1.2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Typography sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 700, flexShrink: 0 }}>FORMA:</Typography>
          {recentForm.map((form, index) => {
            const color = form === 'V' ? theme.green : form === 'D' ? theme.red : theme.yellow;
            return (
              <Box key={`${form}-${index}`} sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: `${color}20`, border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color, fontWeight: 900, fontSize: '0.6rem' }}>{form}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default NextMatchOverview;

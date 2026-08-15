import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { C, N } from './matchesTheme.js';

const UpcomingMatches = ({ events, gameData, currentRound }) => (
  <Box sx={{ mx: 1.5, mb: 1 }}>
    <Typography sx={{ color: N.txt2, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 2, mb: 1 }}>
      JOGOS FUTUROS
    </Typography>
    {events.length === 0 ? (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>🏆</Typography>
        <Typography sx={{ color: N.txt2, fontSize: '0.8rem', fontStyle: 'italic' }}>Temporada encerrada!</Typography>
      </Box>
    ) : events.map((event) => {
      const isNext = event.calendarSlot === currentRound;
      const accentColor = event.isCup ? (event.cupColor || N.teal) : isNext ? N.accent : N.border;
      const dateColBg = isNext ? N.accent : event.isCup ? `${accentColor}30` : N.cardAlt;
      const dateColTxt = isNext ? '#fff' : accentColor;
      return (
        <Box key={`${event.calendarSlot}-${event.cupKey || 'league'}`} sx={{
          bgcolor: N.card, border: `1.5px solid ${accentColor}`, borderRadius: '12px', mb: 0.9, overflow: 'hidden',
          display: 'flex', boxShadow: isNext ? `0 4px 20px ${C.blue}20` : `0 1px 4px ${C.shadow}`,
        }}>
          <Box sx={{ width: 58, flexShrink: 0, bgcolor: dateColBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 1.2, px: 0.5, borderRight: `1px solid ${accentColor}40` }}>
            <Typography sx={{ color: dateColTxt, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 1, lineHeight: 1, mb: 0.2 }}>{event.weekDay}</Typography>
            <Typography sx={{ color: dateColTxt, fontSize: '1.35rem', fontWeight: 900, lineHeight: 1 }}>{event.day}</Typography>
            <Typography sx={{ color: isNext ? 'rgba(255,255,255,0.8)' : N.txt3, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 1, mt: 0.2 }}>{event.monthName}</Typography>
          </Box>
          <Box sx={{ flex: 1, py: 0.9, px: 1.2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography sx={{ color: accentColor, fontSize: '0.52rem', fontWeight: 900, letterSpacing: 0.8 }}>
                {event.isCup ? `🏆 ${event.cupLabel}` : `🏟️ BRASILEIRÃO ${gameData.serie}`}
              </Typography>
              {isNext && !event.isCup ? (
                <Box sx={{ bgcolor: N.accent, borderRadius: '4px', px: 0.7, py: 0.1 }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.44rem', fontWeight: 900 }}>PRÓXIMO</Typography>
                </Box>
              ) : event.isCup ? (
                <Typography sx={{ color: N.txt3, fontSize: '0.48rem', fontWeight: 700 }}>{event.legLabel}</Typography>
              ) : (
                <Typography sx={{ color: N.txt3, fontSize: '0.5rem', fontWeight: 700 }}>Rod {event.leagueRound}</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <TeamIcon name={event.match?.home?.name || '?'} size={28} />
              <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '0.75rem', color: event.match?.home?.isPlayer ? (isNext ? N.accent : N.green) : N.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {event.match?.home?.name}
              </Typography>
              <Typography sx={{ color: N.txt3, fontWeight: 900, fontSize: '0.62rem', flexShrink: 0 }}>vs</Typography>
              <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '0.75rem', textAlign: 'right', color: event.match?.away?.isPlayer ? (isNext ? N.accent : N.green) : N.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {event.match?.away?.name}
              </Typography>
              <TeamIcon name={event.match?.away?.name || '?'} size={28} />
            </Box>
            <Typography sx={{ color: N.txt3, fontSize: '0.5rem', fontWeight: 700, mt: 0.5 }}>
              {event.isCup
                ? `${event.phase || ''}`
                : event.match?.home?.isPlayer
                  ? `🏠 Casa · ${gameData.club?.stadium?.name || 'Seu Estádio'}`
                  : `✈️ Visitante · ${event.match?.home?.name || ''}`}
            </Typography>
          </Box>
        </Box>
      );
    })}
  </Box>
);

export default UpcomingMatches;

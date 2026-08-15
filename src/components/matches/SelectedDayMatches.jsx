import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { getLineupValidation } from '../../helpers.js';
import { WEEK_DAYS_SHORT, getMatchResult } from '../../engines/matches/matchesViewModel.js';
import { C, N, getResultColor } from './matchesTheme.js';

const Stat = ({ label, value, color }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Typography sx={{ color, fontWeight: 900, fontSize: '0.75rem', lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ color: N.txt3, fontSize: '0.42rem', fontWeight: 700 }}>{label}</Typography>
  </Box>
);

const SelectedDayMatches = ({ events, gameData, onOpenSummary }) => {
  if (!events?.length) return null;
  const lineupValidation = getLineupValidation(gameData);

  return (
    <Box sx={{ mx: 1.5, mb: 1 }}>
      {events.map((event, index) => {
        const result = event.played ? getMatchResult(event.match) : null;
        const resultColor = getResultColor(result);
        const accentColor = event.isCup ? (event.cupColor || N.teal) : event.isUser ? N.accent : N.border;
        const isFuture = !event.played && event.isUser;
        const opponent = isFuture && event.match
          ? (event.match.home?.isPlayer ? event.match.away : event.match.home)
          : null;
        const opponentRow = opponent ? gameData.table?.find((row) => row.name === opponent.name) : null;
        const opponentPos = opponentRow ? (gameData.table?.findIndex((row) => row.name === opponent.name) ?? -1) + 1 : null;
        const myRow = isFuture ? gameData.table?.find((row) => row.id === 'user') : null;
        const myPos = myRow ? (gameData.table?.findIndex((row) => row.id === 'user') ?? -1) + 1 : null;
        const canOpen = event.played && event.match?.result;

        return (
          <Box key={`${event.calendarSlot}-${index}`} onClick={() => canOpen && onOpenSummary({ ...event.match, cupLabel: event.cupLabel, legLabel: event.legLabel })} sx={{
            bgcolor: N.card, border: `1.5px solid ${accentColor}60`, borderRadius: '14px', overflow: 'hidden', mb: 1,
            boxShadow: `0 2px 8px ${C.shadow}`, cursor: canOpen ? 'pointer' : 'default',
            '&:active': canOpen ? { filter: 'brightness(0.9)' } : {},
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.4, py: 0.8, bgcolor: `${accentColor}18`, borderBottom: `1px solid ${accentColor}30` }}>
              <Typography sx={{ color: accentColor, fontSize: '0.6rem', fontWeight: 900, letterSpacing: 0.8 }}>
                {event.isCup ? `🏆 ${event.cupLabel} · ${event.legLabel}` : `🏟️ SÉRIE ${gameData.serie} · ROD ${event.leagueRound}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ bgcolor: event.played ? `${N.green}20` : `${N.accent}20`, border: `1px solid ${event.played ? N.green : N.accent}40`, borderRadius: '5px', px: 0.7, py: 0.1 }}>
                  <Typography sx={{ color: event.played ? N.green : N.accent, fontSize: '0.5rem', fontWeight: 900 }}>
                    {event.played ? '✅ ENCERRADA' : '🕐 AGENDADA'}
                  </Typography>
                </Box>
                {event.date && (
                  <Typography sx={{ color: N.txt3, fontSize: '0.52rem', fontWeight: 700 }}>
                    {WEEK_DAYS_SHORT[(event.date.getDay() + 6) % 7]}
                  </Typography>
                )}
              </Box>
            </Box>

            {event.match && (
              <Box sx={{ px: 1.5, py: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TeamIcon name={event.match.home?.name || '?'} size={32} />
                <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 900, fontSize: '0.8rem', color: event.match.home?.isPlayer ? accentColor : N.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {event.match.home?.name}
                </Typography>
                <Box sx={{ px: 1.4, py: 0.5, borderRadius: '8px', bgcolor: event.played ? C.ink : N.cardAlt, border: `1px solid ${event.played ? `${accentColor}60` : N.border}`, minWidth: 50, textAlign: 'center', flexShrink: 0 }}>
                  {event.played ? (
                    <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: resultColor, fontFamily: 'monospace' }}>
                      {result?.homeGoals}–{result?.awayGoals}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontWeight: 900, fontSize: '0.68rem', color: N.txt3 }}>VS</Typography>
                  )}
                </Box>
                <Typography sx={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '0.8rem', color: event.match.away?.isPlayer ? accentColor : N.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {event.match.away?.name}
                </Typography>
                <TeamIcon name={event.match.away?.name || '?'} size={32} />
              </Box>
            )}

            {isFuture && opponent && (
              <Box sx={{ px: 1.4, pb: 1.2, borderTop: `1px solid ${N.border}40` }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0.5, mt: 1 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: N.txt3, fontSize: '0.46rem', fontWeight: 700, mb: 0.4 }}>MEU TIME</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Stat label="POS" value={`${myPos || '—'}º`} color={myPos && myPos <= 4 ? N.green : myPos && myPos >= 17 ? N.red : N.txt1} />
                      <Stat label="PTS" value={myRow?.pts || 0} color={N.txt1} />
                      <Stat label="OVR" value={lineupValidation?.avgStrength || '—'} color={N.green} />
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: N.border }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: N.txt3, fontSize: '0.46rem', fontWeight: 700, mb: 0.4 }}>ADVERSÁRIO</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Stat label="POS" value={opponentPos ? `${opponentPos}º` : '—'} color={opponentPos && opponentPos <= 4 ? N.green : opponentPos && opponentPos >= 17 ? N.red : N.txt1} />
                      <Stat label="PTS" value={opponentRow?.pts || 0} color={N.txt1} />
                      <Stat label="OVR" value={opponent?.strength || '—'} color={N.accent} />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.8 }}>
                  <Typography sx={{ fontSize: '0.65rem' }}>{event.match?.home?.isPlayer ? '🏠' : '✈️'}</Typography>
                  <Typography sx={{ color: N.txt3, fontSize: '0.56rem', fontWeight: 700 }}>
                    {event.match?.home?.isPlayer
                      ? `Mandante — ${gameData.club?.stadium?.name || 'Seu Estádio'}`
                      : `Visitante em ${opponent.name}`}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default SelectedDayMatches;

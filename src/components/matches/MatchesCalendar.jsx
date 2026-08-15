import React from 'react';
import { Box, Typography } from '@mui/material';
import { C, N, getResultColor } from './matchesTheme.js';
import { MONTH_NAMES, WEEK_DAYS, getMatchResult } from '../../engines/matches/matchesViewModel.js';

const FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'CAMP', label: '🏟️ Campeonato' },
  { key: 'COPA', label: '🏆 Copas' },
];

const getDotColor = (event) => {
  if (event.isCup) return event.cupColor || N.teal;
  if (!event.isUser) return N.accent;
  if (!event.played) return N.gold;
  return getResultColor(getMatchResult(event.match));
};

const MatchesCalendar = ({
  calendarWindow,
  calMonth,
  setCalMonth,
  compFilter,
  setCompFilter,
  selectedDay,
  setSelectedDay,
  getDayEvents,
  currentRound,
}) => {
  const { totalMonths, realMonth, realYear, daysInMonth, startPad } = calendarWindow;

  return (
    <Box sx={{ mx: 1.5, mt: 1.5, mb: 1, bgcolor: N.card, borderRadius: '14px', border: `1px solid ${N.border}`, overflow: 'hidden', boxShadow: `0 2px 8px ${C.shadow}` }}>
      <Box sx={{ display: 'flex', gap: 0.5, px: 1.2, pt: 1, pb: 0.6, borderBottom: `1px solid ${N.border}20` }}>
        {FILTERS.map((filter) => (
          <Box key={filter.key} onClick={() => setCompFilter(filter.key)} sx={{
            px: 1.2, py: 0.4, borderRadius: '20px', cursor: 'pointer',
            bgcolor: compFilter === filter.key ? N.accent : 'transparent',
            border: `1px solid ${compFilter === filter.key ? N.accent : N.border}`,
            '&:active': { opacity: 0.7 }, transition: 'all 0.15s',
          }}>
            <Typography sx={{ color: compFilter === filter.key ? '#fff' : N.txt3, fontWeight: 900, fontSize: '0.58rem' }}>
              {filter.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: N.cardAlt, px: 2, py: 1.2, borderBottom: `1px solid ${N.border}` }}>
        <Box onClick={() => setCalMonth((month) => Math.max(0, month - 1))} sx={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
          cursor: calMonth > 0 ? 'pointer' : 'default', bgcolor: calMonth > 0 ? C.bgDark : 'transparent',
          color: calMonth > 0 ? N.txt1 : N.txt3, fontSize: '1rem', fontWeight: 900,
        }}>❮</Box>
        <Typography sx={{ color: N.txt1, fontWeight: 900, fontSize: '0.92rem', letterSpacing: 1.5 }}>
          {MONTH_NAMES[realMonth]} {realYear}
        </Typography>
        <Box onClick={() => setCalMonth((month) => Math.min(totalMonths - 1, month + 1))} sx={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
          cursor: calMonth < totalMonths - 1 ? 'pointer' : 'default', bgcolor: calMonth < totalMonths - 1 ? C.bgDark : 'transparent',
          color: calMonth < totalMonths - 1 ? N.txt1 : N.txt3, fontSize: '1rem', fontWeight: 900,
        }}>❯</Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', px: 1, py: 0.9 }}>
        {WEEK_DAYS.map((day, index) => (
          <Typography key={`${day}-${index}`} sx={{ textAlign: 'center', fontWeight: 900, fontSize: '0.68rem', color: index >= 5 ? N.accent : N.txt3 }}>
            {day}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', px: 1, pb: 1.2, gap: 0 }}>
        {Array.from({ length: startPad }).map((_, index) => <Box key={`pad-${index}`} />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const events = getDayEvents(realYear, realMonth, day);
          const hasUser = events.some((event) => event.isUser);
          const isNextGame = events.some((event) => event.calendarSlot === currentRound);
          const isSelected = selectedDay === day && events.length > 0;
          const isWeekend = ((startPad + index) % 7) >= 5;
          const dots = events.slice(0, 3);
          const bgColor = isNextGame && hasUser ? N.accent : isSelected ? `${N.accent}30` : 'transparent';
          const border = isSelected && !isNextGame ? `1.5px solid ${N.accent}` : 'none';

          return (
            <Box key={day} onClick={() => events.length > 0 && setSelectedDay(isSelected ? null : day)} sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5,
              cursor: events.length > 0 ? 'pointer' : 'default', position: 'relative',
            }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: bgColor, border, transition: 'all 0.15s' }}>
                <Typography sx={{
                  fontWeight: events.length > 0 ? 900 : 400, fontSize: '0.8rem',
                  color: isNextGame && hasUser ? '#fff' : events.length > 0 ? (isWeekend ? N.accent : N.txt1) : N.txt3,
                  lineHeight: 1,
                }}>{day}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: '1.5px', mt: 0.3, height: 5, alignItems: 'center' }}>
                {dots.map((event, dotIndex) => (
                  <Box key={`${event.calendarSlot}-${dotIndex}`} sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: getDotColor(event), flexShrink: 0 }} />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', px: 1.4, pb: 1, pt: 0.2, borderTop: `1px solid ${N.border}30` }}>
        {[
          { color: N.green, label: 'Vitória' }, { color: N.gold, label: 'Empate' },
          { color: N.red, label: 'Derrota' }, { color: N.accent, label: 'Próximo' },
          { color: '#00695c', label: 'Copa Br.' }, { color: '#1a237e', label: 'Libert.' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: item.color }} />
            <Typography sx={{ color: N.txt3, fontSize: '0.5rem', fontWeight: 700 }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MatchesCalendar;

import React from 'react';
import { Box, Typography } from '@mui/material';
import { C, N } from './matchesTheme.js';
import { getCareerCurrentDate, getDayLabel, getDaysUntilCalendarSlot, getCareerDayActivity } from '../../engines/calendar/calendarDateEngine.js';
import { getAnnualCalendarContext } from '../../engines/calendar/seasonCalendar.js';

const MatchesHeader = ({ gameData, setScreen }) => {
  const maxRounds = gameData.fixtures?.length || 0;
  const leagueRound = gameData.leagueRound ?? Math.min(gameData.round ?? 0, maxRounds);
  const currentDate = getCareerCurrentDate(gameData);
  const daysUntilMatch = getDaysUntilCalendarSlot(gameData);
  const activity = getCareerDayActivity(daysUntilMatch);
  const annualContext = getAnnualCalendarContext(currentDate, { season:gameData.season || 2026, serie:gameData.serie || 'A' });
  return (
    <Box sx={{
      background: `linear-gradient(180deg, ${C.bgHeader} 0%, ${C.bg} 100%)`,
      px: 1.25, pt: 1.35, pb: 0.9,
      borderBottom: `1px solid ${N.border}`,
      display: 'flex', alignItems: 'center', gap: 1.2,
    }}>
      <Box onClick={() => setScreen('home')} sx={{
        width: 30, height: 30, borderRadius: '50%',
        bgcolor: C.bgDark, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: N.txt2, fontSize: '1rem', fontWeight: 900,
        '&:active': { bgcolor: C.bgDark },
      }}>❮</Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ color: N.txt1, fontWeight: 900, fontSize: '0.84rem', letterSpacing: 1.5 }}>
          PRÓXIMAS PARTIDAS
        </Typography>
        <Typography sx={{ color: N.txt3, fontSize: '0.52rem', fontWeight: 700, mt: 0.2 }}>
          {gameData.club?.name?.toUpperCase()} · TEMPORADA {gameData.season || 2026}
        </Typography>
        {currentDate && (
          <>
            <Typography sx={{ color:N.teal, fontSize:'0.5rem', fontWeight:900, mt:0.2, textTransform:'capitalize' }}>
              📅 Hoje: {getDayLabel(currentDate)} · {activity.icon} {activity.label}
            </Typography>
            {annualContext.badges.length > 0 && (
              <Box sx={{ display:'flex', gap:0.35, mt:0.35, flexWrap:'wrap' }}>
                {annualContext.badges.map((badge) => (
                  <Box key={badge.key} title={badge.detail} sx={{ bgcolor:C.bgDark, border:`1px solid ${C.border}`, borderRadius:'999px', px:0.55, py:0.12 }}>
                    <Typography sx={{ color:N.txt3, fontWeight:800, fontSize:'0.42rem', lineHeight:1.2 }}>{badge.icon} {badge.label}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
      <Box sx={{ bgcolor: `${N.accent}20`, border: `1px solid ${N.accent}40`, borderRadius: '8px', px: 1, py: 0.4 }}>
        <Typography sx={{ color: N.accent, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5 }}>
          ROD {Math.min(leagueRound + 1, maxRounds)}/{maxRounds}
        </Typography>
      </Box>
    </Box>
  );
};

export default MatchesHeader;

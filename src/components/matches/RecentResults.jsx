import React from 'react';
import { Box, Typography } from '@mui/material';
import { MONTH_NAMES, WEEK_DAYS_SHORT, getMatchResult } from '../../engines/matches/matchesViewModel.js';
import { C, N, getResultColor } from './matchesTheme.js';

const RecentResults = ({ results, gameData, onOpenSummary }) => {
  if (!results.length) return null;
  return (
    <Box sx={{ mx: 1.5, mb: 1 }}>
      <Typography sx={{ color: N.txt2, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 2, mb: 1 }}>
        RESULTADOS RECENTES
      </Typography>
      {results.map((item, index) => {
        const result = getMatchResult(item.match);
        const date = item.date;
        const monthName = date ? MONTH_NAMES[date.getMonth()].substring(0, 3) : '';
        const weekDay = date ? WEEK_DAYS_SHORT[(date.getDay() + 6) % 7] : '';
        const resultColor = item.isCup ? (item.cupColor || N.teal) : getResultColor(result);
        const resultLabel = item.isCup ? '🏆' : result?.outcome === 'win' ? 'VIT' : result?.outcome === 'loss' ? 'DER' : 'EMP';
        return (
          <Box key={`${item.cupLabel || 'league'}-${item.round}-${index}`} onClick={() => item.match?.result && onOpenSummary({ ...item.match, cupLabel: item.cupLabel, legLabel: item.legLabel })} sx={{
            bgcolor: N.card, border: `1px solid ${N.border}`, borderRadius: '12px', mb: 0.8, overflow: 'hidden', display: 'flex', cursor: 'pointer',
            boxShadow: `0 1px 4px ${C.shadow}`, '&:active': { filter: 'brightness(0.96)' },
          }}>
            <Box sx={{ width: 52, flexShrink: 0, bgcolor: N.cardAlt, borderRight: `1px solid ${N.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 1, px: 0.5 }}>
              <Typography sx={{ color: N.txt1, fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>{date ? date.getDate() : '—'}</Typography>
              <Typography sx={{ color: N.txt3, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', mt: 0.2 }}>{monthName}</Typography>
              <Typography sx={{ color: N.txt3, fontSize: '0.4rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', mt: 0.1 }}>{weekDay}</Typography>
            </Box>
            <Box sx={{ flex: 1, py: 0.9, px: 1.2, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: N.txt3, fontSize: '0.48rem', fontWeight: 900, letterSpacing: 0.8, mb: 0.5 }}>
                  {item.isCup ? `${item.cupLabel} · ${item.legLabel}` : `🏟️ BRASILEIRÃO ${gameData.serie} · ROD ${item.round}`}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '0.72rem', textAlign: 'right', color: item.match.home?.isPlayer ? N.accent : N.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {item.match.home?.name}
                  </Typography>
                  <Box sx={{ bgcolor: C.ink, border: `1px solid ${resultColor}50`, borderRadius: '6px', px: 0.8, py: 0.2, flexShrink: 0 }}>
                    <Typography sx={{ color: resultColor, fontWeight: 900, fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1 }}>
                      {result?.homeGoals}–{result?.awayGoals}
                    </Typography>
                    {result?.penaltiesLabel && (
                      <Typography sx={{ color: C.bg, fontSize: '0.4rem', fontWeight: 700, textAlign: 'center' }}>{result.penaltiesLabel}</Typography>
                    )}
                  </Box>
                  <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '0.72rem', color: item.match.away?.isPlayer ? N.accent : N.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {item.match.away?.name}
                  </Typography>
                </Box>
                <Typography sx={{ color: N.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.4 }}>🔍 ver súmula</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, flexShrink: 0, pl: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: resultColor }} />
                <Typography sx={{ color: resultColor, fontSize: '0.45rem', fontWeight: 900, letterSpacing: 0.5 }}>{resultLabel}</Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RecentResults;

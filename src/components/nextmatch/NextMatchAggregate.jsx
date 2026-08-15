import React from 'react';
import { Box, Typography } from '@mui/material';
import { getNextMatchColor } from './nextMatchPresentation.js';

const NextMatchAggregate = ({ viewModel, theme }) => {
  const aggregate = viewModel.aggregateInfo;
  if (!aggregate) return null;

  const matchColor = getNextMatchColor(viewModel.competition, theme);
  const requirementColor = aggregate.requirementTone === 'ahead'
    ? theme.green
    : aggregate.requirementTone === 'behind' ? theme.red : theme.yellow;
  const requirementIcon = aggregate.requirementTone === 'ahead' ? '🟢' : aggregate.requirementTone === 'behind' ? '🔴' : '🟡';

  return (
    <Box sx={{ bgcolor: `${matchColor}10`, border: `1.5px solid ${matchColor}50`, borderRadius: '12px', p: 1.3, mb: 1.2 }}>
      <Typography sx={{ color: matchColor, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.8, mb: 0.8 }}>
        🏆 PLACAR AGREGADO — {viewModel.cupInfo.label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '0.72rem' }}>{aggregate.homeTeam?.split(' ')[0]}</Typography>
          <Typography sx={{ color: aggregate.leg1Home > aggregate.leg1Away ? theme.green : aggregate.leg1Home < aggregate.leg1Away ? theme.red : theme.yellow, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>{aggregate.leg1Home}</Typography>
          <Typography sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 700 }}>Gols ida</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: theme.txt3, fontSize: '0.6rem', fontWeight: 700, mb: 0.2 }}>IDA</Typography>
          <Box sx={{ bgcolor: theme.cardAlt, border: `1px solid ${theme.border}`, borderRadius: '6px', px: 1, py: 0.3 }}>
            <Typography sx={{ color: theme.txt2, fontWeight: 900, fontSize: '0.75rem', fontFamily: 'monospace' }}>{aggregate.leg1Home} – {aggregate.leg1Away}</Typography>
          </Box>
          <Typography sx={{ color: theme.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.2 }}>Resultado da ida</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: theme.txt1, fontWeight: 900, fontSize: '0.72rem' }}>{aggregate.awayTeam?.split(' ')[0]}</Typography>
          <Typography sx={{ color: aggregate.leg1Away > aggregate.leg1Home ? theme.green : aggregate.leg1Away < aggregate.leg1Home ? theme.red : theme.yellow, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>{aggregate.leg1Away}</Typography>
          <Typography sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 700 }}>Gols ida</Typography>
        </Box>
      </Box>
      <Box sx={{ mt: 0.8, bgcolor: theme.cardAlt, borderRadius: '8px', px: 1, py: 0.5, textAlign: 'center' }}>
        <Typography sx={{ color: requirementColor, fontWeight: 900, fontSize: '0.58rem' }}>
          {requirementIcon} {aggregate.requirementText}
        </Typography>
      </Box>
    </Box>
  );
};

export default NextMatchAggregate;

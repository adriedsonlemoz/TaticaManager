import React from 'react';
import { Box, Typography } from '@mui/material';
import { DisciplineEngine } from '../../engines/engine_discipline.js';
import { getNextMatchPositionAccent } from './nextMatchPresentation.js';

const NextMatchLineupStatus = ({ viewModel, theme }) => {
  const { isFullyReady, validation, starters, illegalStarters, nextRound } = viewModel;

  return (
    <Box sx={{
      bgcolor: isFullyReady ? `${theme.green}08` : `${theme.red}08`,
      border: `1.5px solid ${isFullyReady ? theme.green : theme.red}40`,
      borderRadius: '12px', overflow: 'hidden', mb: 1.2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.4, py: 0.9, borderBottom: `1px solid ${isFullyReady ? theme.green : theme.red}20`, background: isFullyReady ? `${theme.green}06` : `${theme.red}06` }}>
        <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{isFullyReady ? '✅' : '🚨'}</Typography>
        <Typography sx={{ color: isFullyReady ? theme.green : theme.red, fontWeight: 900, fontSize: '0.78rem', flex: 1 }}>
          {isFullyReady ? 'Elenco pronto para jogar' : !validation.isValid ? `Escalação incompleta (${starters.length}/11)` : 'Jogadores inaptos na escalação'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: isFullyReady ? `${theme.green}18` : `${theme.red}18`, borderRadius: '8px', px: 0.9, py: 0.3 }}>
          <Typography sx={{ color: theme.txt3, fontSize: '0.48rem', fontWeight: 700 }}>OVR</Typography>
          <Typography sx={{ color: isFullyReady ? theme.green : theme.red, fontWeight: 900, fontSize: '0.82rem', lineHeight: 1 }}>{validation.avgStrength || 0}</Typography>
        </Box>
      </Box>

      {illegalStarters.length > 0 && (
        <Box sx={{ px: 1.4, py: 0.8, borderBottom: `1px solid ${theme.red}15` }}>
          <Typography sx={{ color: theme.red, fontWeight: 900, fontSize: '0.58rem', mb: 0.5 }}>⛔ REMOVA DA ESCALAÇÃO:</Typography>
          {illegalStarters.map((player) => {
            const suspended = DisciplineEngine.isPlayerSuspended(player, nextRound);
            return (
              <Typography key={player.id || player.name} sx={{ color: theme.red, fontSize: '0.62rem', fontWeight: 700, mb: 0.2 }}>
                • {player.name.split(' ').pop()} ({suspended ? 'suspenso 🟥' : 'lesionado 🚑'})
              </Typography>
            );
          })}
        </Box>
      )}

      <Box sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {['GOL', 'ZAG', 'LD', 'LE', 'VOL', 'MC', 'MEI', 'PD', 'PE', 'CA'].map((position) => {
            const required = validation.req?.[position] || 0;
            if (!required) return null;
            const count = validation.counts?.[position] || 0;
            const okay = count >= required;
            const hasUnavailable = illegalStarters.some((player) => player.position === position);
            const color = getNextMatchPositionAccent(position);
            const percentage = Math.min(1, count / required);
            return (
              <Box key={position} sx={{
                flex: '1 1 calc(33% - 4px)', minWidth: 80,
                bgcolor: hasUnavailable ? `${theme.red}10` : okay ? `${color}10` : `${theme.red}06`,
                border: `1.5px solid ${hasUnavailable ? theme.red : okay ? `${color}60` : `${theme.red}40`}`,
                borderRadius: '8px', p: 0.7,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                  <Typography sx={{ color: hasUnavailable ? theme.red : okay ? color : theme.red, fontWeight: 900, fontSize: '0.6rem' }}>
                    {hasUnavailable ? '⚠️ ' : ''}{position}
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.7rem', color: hasUnavailable ? theme.red : okay ? theme.txt1 : theme.red, lineHeight: 1 }}>
                    {count}<Typography component="span" sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 700 }}>/{required}</Typography>
                  </Typography>
                </Box>
                <Box sx={{ height: 3, bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${percentage * 100}%`, bgcolor: hasUnavailable ? theme.red : okay ? color : theme.red, borderRadius: 99 }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default NextMatchLineupStatus;

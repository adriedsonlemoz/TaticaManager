import React from 'react';
import { Box, Typography } from '@mui/material';
import { getNextMatchColor } from './nextMatchPresentation.js';

const NextMatchHeader = ({ viewModel, canPlay, simulating, startMatchSimulation, onAutoSimulate, setScreen, theme }) => {
  const matchColor = getNextMatchColor(viewModel.competition, theme);
  const { isCupRound, matchLabel, matchInfo, matchInfoSecondary, isFullyReady, validation, starters, illegalStarters } = viewModel;

  return (
    <Box sx={{
      background: `linear-gradient(180deg,${theme.bgCard} 0%,${theme.bg} 100%)`,
      borderBottom: `1px solid ${theme.border}`, px: 1.5, pt: 3.8, pb: 1.2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: theme.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 1.5, mb: 0.3 }}>
            {isCupRound ? '🏆 COPA' : '🏟️ PRÓXIMA PARTIDA'}
          </Typography>
          {matchLabel && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: `${matchColor}15`, border: `1px solid ${matchColor}30`, borderRadius: '6px', px: 0.8, py: 0.2, mb: 0.3 }}>
              <Typography sx={{ color: matchColor, fontWeight: 900, fontSize: '0.58rem' }}>{matchLabel}</Typography>
            </Box>
          )}
          {matchInfo?.fullStr && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
              <Typography sx={{ fontSize: '0.7rem' }}>📅</Typography>
              <Typography sx={{ color: theme.txt2, fontSize: '0.6rem', fontWeight: 700 }}>{matchInfo.fullStr}</Typography>
            </Box>
          )}
          {matchInfoSecondary && (
            <Typography sx={{ color: theme.txt3, fontSize: '0.54rem', fontWeight: 700, display: 'block' }}>{matchInfoSecondary}</Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
          <Box onClick={canPlay ? () => startMatchSimulation() : undefined} sx={{
            bgcolor: canPlay ? theme.green : theme.cardAlt,
            border: `1.5px solid ${canPlay ? theme.green : theme.border}`,
            borderRadius: '10px', px: 1.4, py: 0.7,
            display: 'flex', alignItems: 'center', gap: 0.6,
            cursor: canPlay ? 'pointer' : 'default',
            boxShadow: canPlay ? `0 0 16px ${theme.green}45` : 'none',
            opacity: simulating ? 0.6 : 1,
            '&:active': canPlay ? { filter: 'brightness(0.88)' } : {},
          }}>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>
              {simulating ? '⏳' : !isFullyReady ? '🚫' : isCupRound ? '🏆' : '▶'}
            </Typography>
            <Box>
              <Typography sx={{ color: canPlay ? '#000' : theme.txt3, fontWeight: 900, fontSize: '0.65rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {simulating ? 'SIMULANDO...'
                  : !validation.isValid ? `${starters.length}/11`
                    : illegalStarters.length > 0 ? `${illegalStarters.length} INAPTO`
                      : isCupRound ? 'JOGAR COPA' : 'JOGAR PARTIDA'}
              </Typography>
              <Typography sx={{ color: canPlay ? '#00000080' : theme.txt3, fontSize: '0.48rem', fontWeight: 700, lineHeight: 1 }}>
                com animação
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box onClick={canPlay ? onAutoSimulate : undefined} sx={{
              flex: 1,
              bgcolor: canPlay ? `${theme.teal}15` : theme.cardAlt,
              border: `1.5px solid ${canPlay ? theme.teal : theme.border}`,
              borderRadius: '9px', px: 1, py: 0.6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
              cursor: canPlay ? 'pointer' : 'default',
              '&:active': canPlay ? { filter: 'brightness(0.88)' } : {},
            }}>
              <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>⚡</Typography>
              <Typography sx={{ color: canPlay ? theme.teal : theme.txt3, fontWeight: 900, fontSize: '0.58rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                Simular
              </Typography>
            </Box>
            <Box onClick={() => setScreen('home')} sx={{
              flex: 1, bgcolor: 'transparent', border: `1.5px solid ${theme.border}`,
              borderRadius: '9px', px: 1, py: 0.6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
              cursor: 'pointer', '&:active': { bgcolor: theme.cardAlt },
            }}>
              <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>←</Typography>
              <Typography sx={{ color: theme.txt3, fontWeight: 900, fontSize: '0.58rem', lineHeight: 1, whiteSpace: 'nowrap' }}>Menu</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {!isFullyReady && (
        <Box onClick={() => setScreen('lineup')} sx={{
          mt: 0.8, bgcolor: `${theme.red}08`, border: `1px solid ${theme.red}40`,
          borderRadius: '8px', px: 1.2, py: 0.6, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 0.7,
          '&:active': { bgcolor: `${theme.red}15` },
        }}>
          <Typography sx={{ fontSize: '0.8rem' }}>📋</Typography>
          <Typography sx={{ color: theme.red, fontWeight: 900, fontSize: '0.62rem' }}>
            {illegalStarters.length > 0 ? `${illegalStarters.length} jogador(es) inapto(s) na escalação — corrigir` : 'Escalação incompleta — corrigir'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NextMatchHeader;

import React from 'react';
import { Box, Typography } from '@mui/material';
import { getNextMatchColor } from './nextMatchPresentation.js';

const NextMatchHeader = ({ viewModel, canPlay, simulating, startMatchSimulation, onAutoSimulate, setScreen, theme }) => {
  const matchColor = getNextMatchColor(viewModel.competition, theme);
  const { isCupRound, matchLabel, matchInfo, matchInfoSecondary, isFullyReady, validation, starters, illegalStarters, identityValid, skippedSlots = 0, restDaysBeforeMatch = 0, currentDateISO = null } = viewModel;
  const pendingDayAdvance = restDaysBeforeMatch > 0;
  const pendingIdleAdvance = !pendingDayAdvance && skippedSlots > 0;
  const canAutoSimulate = canPlay && !pendingDayAdvance && !pendingIdleAdvance && isFullyReady;

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
              {simulating ? '⏳' : pendingDayAdvance ? '🛌' : pendingIdleAdvance ? '⏭️' : !isFullyReady ? '🚫' : isCupRound ? '🏆' : '▶'}
            </Typography>
            <Box>
              <Typography sx={{ color: canPlay ? '#000' : theme.txt3, fontWeight: 900, fontSize: '0.65rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {simulating ? 'SIMULANDO...'
                  : pendingDayAdvance ? 'AVANÇAR 1 DIA'
                  : pendingIdleAdvance ? `AVANÇAR ${skippedSlots} DATA${skippedSlots > 1 ? 'S' : ''}`
                  : !identityValid ? 'ERRO DE EQUIPE'
                    : !validation.isComplete ? `${validation.uniqueStarterCount}/11`
                      : !validation.isValid ? 'ESCALAÇÃO INVÁLIDA'
                        : illegalStarters.length > 0 ? `${illegalStarters.length} INAPTO`
                          : isCupRound ? 'JOGAR COPA' : 'JOGAR PARTIDA'}
              </Typography>
              <Typography sx={{ color: canPlay ? '#00000080' : theme.txt3, fontSize: '0.48rem', fontWeight: 700, lineHeight: 1 }}>
                {pendingDayAdvance ? `${restDaysBeforeMatch} dia(s) até o jogo` : pendingIdleAdvance ? 'descanso antes do jogo' : 'com animação'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box onClick={canAutoSimulate ? onAutoSimulate : undefined} sx={{
              flex: 1,
              bgcolor: canAutoSimulate ? `${theme.teal}15` : theme.cardAlt,
              border: `1.5px solid ${canAutoSimulate ? theme.teal : theme.border}`,
              borderRadius: '9px', px: 1, py: 0.6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
              cursor: canAutoSimulate ? 'pointer' : 'default',
              '&:active': canAutoSimulate ? { filter: 'brightness(0.88)' } : {},
            }}>
              <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>⚡</Typography>
              <Typography sx={{ color: canAutoSimulate ? theme.teal : theme.txt3, fontWeight: 900, fontSize: '0.58rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
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

      {pendingDayAdvance && (
        <Box sx={{
          mt: 0.8, bgcolor: `${theme.teal}10`, border: `1px solid ${theme.teal}45`,
          borderRadius: '8px', px: 1.2, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.7,
        }}>
          <Typography sx={{ fontSize: '0.8rem' }}>🛌</Typography>
          <Typography sx={{ color: theme.teal, fontWeight: 900, fontSize: '0.62rem' }}>
            Hoje: {currentDateISO || 'dia de descanso'} · faltam {restDaysBeforeMatch} dia(s) para a partida. Avance o calendário um dia por vez.
          </Typography>
        </Box>
      )}

      {pendingIdleAdvance && (
        <Box sx={{
          mt: 0.8, bgcolor: `${theme.yellow}10`, border: `1px solid ${theme.yellow}50`,
          borderRadius: '8px', px: 1.2, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.7,
        }}>
          <Typography sx={{ fontSize: '0.8rem' }}>⏭️</Typography>
          <Typography sx={{ color: theme.yellow, fontWeight: 900, fontSize: '0.62rem' }}>
            {skippedSlots} data(s) sem partida serão processadas antes de validar a escalação.
          </Typography>
        </Box>
      )}

      {!pendingDayAdvance && !pendingIdleAdvance && !isFullyReady && (
        <Box onClick={() => setScreen('lineup')} sx={{
          mt: 0.8, bgcolor: `${theme.red}08`, border: `1px solid ${theme.red}40`,
          borderRadius: '8px', px: 1.2, py: 0.6, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 0.7,
          '&:active': { bgcolor: `${theme.red}15` },
        }}>
          <Typography sx={{ fontSize: '0.8rem' }}>📋</Typography>
          <Typography sx={{ color: theme.red, fontWeight: 900, fontSize: '0.62rem' }}>
            {!identityValid
              ? 'Não foi possível identificar o lado do seu clube — partida bloqueada'
              : illegalStarters.length > 0
                ? `${illegalStarters.length} jogador(es) inapto(s) na escalação — corrigir`
                : !validation.isComplete
                  ? `Escalação incompleta (${validation.uniqueStarterCount}/11) — corrigir`
                  : !validation.formationValid
                    ? 'Formação inválida — corrigir'
                    : !validation.hasGoalkeeper
                      ? 'Escalação sem goleiro — corrigir'
                      : 'Escalação inválida — corrigir'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NextMatchHeader;

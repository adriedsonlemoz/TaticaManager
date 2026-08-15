import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { ACADEMY_ACCENT, getLevelVisual } from './academyPresentation.js';

export default function AcademyInvestTab({ viewModel, money, formatMoney, onInvest }) {
  const C = THEME;

  return (
    <>
      <Box sx={{ bgcolor: `${ACADEMY_ACCENT}10`, border: `1px solid ${ACADEMY_ACCENT}30`, borderRadius: '12px', p: 1.2, mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
          <Typography sx={{ color: ACADEMY_ACCENT, fontWeight: 900, fontSize: '0.7rem' }}>💰 Verba disponível</Typography>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.9rem' }}>{formatMoney(money)}</Typography>
        </Box>
        <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>
          Instalações melhores aumentam a chance de evolução dos garotos. O nível da academia não infla o OVR ou o potencial inicial do jogador.
        </Typography>
      </Box>

      {viewModel.investmentOptions.map((option) => {
        const visual = getLevelVisual(option.key, C.txt2);
        const unavailable = !option.isCurrent && !option.canInvest;
        const status = option.isCurrent ? 'ATUAL ✓' : option.isPrevious ? 'CONCLUÍDO' : !option.canAfford ? 'SALDO INSUFICIENTE' : null;

        return (
          <Box
            component="button"
            type="button"
            disabled={!option.canInvest}
            key={option.key}
            onClick={() => option.canInvest && onInvest(option.key)}
            sx={{
              width: '100%', textAlign: 'left', p: 0, mb: 1.2, borderRadius: '14px', overflow: 'hidden',
              border: `2px solid ${option.isCurrent ? visual.color : option.canInvest ? `${visual.color}50` : C.border}`,
              bgcolor: option.isCurrent ? `${visual.color}12` : C.card, opacity: unavailable ? 0.6 : 1,
              cursor: option.canInvest ? 'pointer' : 'default', boxShadow: option.isCurrent ? `0 0 20px ${visual.color}30` : 'none',
              transition: 'all 0.15s',
            }}
          >
            {option.isCurrent && <Box sx={{ height: 3, bgcolor: visual.color }} />}
            <Box sx={{ px: 1.4, py: 1.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${visual.color}20`, border: `1.5px solid ${visual.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{visual.icon}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                      <Typography sx={{ color: option.isCurrent ? visual.color : C.txt1, fontWeight: 900, fontSize: '0.9rem' }}>{option.label}</Typography>
                      {status && (
                        <Box sx={{ bgcolor: option.isCurrent ? visual.color : C.cardAlt, border: `1px solid ${option.isCurrent ? visual.color : C.border}`, borderRadius: '5px', px: 0.6, py: 0.05 }}>
                          <Typography sx={{ color: option.isCurrent ? '#fff' : C.txt3, fontWeight: 900, fontSize: '0.44rem' }}>{status}</Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700 }}>{option.desc}</Typography>
                  </Box>
                </Box>
                {option.isUpgrade && (
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ color: option.canAfford ? C.green : C.red, fontWeight: 900, fontSize: '0.82rem' }}>{formatMoney(option.cost)}</Typography>
                    <Typography sx={{ color: C.txt3, fontSize: '0.48rem', fontWeight: 700 }}>investimento único</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.5 }}>
                {[
                  { label: 'BÔNUS ANUAL', value: `+${option.evolutionBonusPct} p.p.` },
                  { label: 'PRESTÍGIO', value: `${option.prestige}/100` },
                  { label: 'FOCO', value: option.focus },
                ].map((benefit) => (
                  <Box key={benefit.label} sx={{ bgcolor: C.cardAlt, borderRadius: '7px', py: 0.6, px: 0.5, textAlign: 'center', border: `1px solid ${C.border}` }}>
                    <Typography sx={{ color: option.isCurrent ? visual.color : C.txt2, fontWeight: 900, fontSize: '0.6rem', lineHeight: 1 }}>{benefit.value}</Typography>
                    <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.15 }}>{benefit.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        );
      })}

      <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', p: 1.2 }}>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.56rem', letterSpacing: 0.8, mb: 0.7 }}>ℹ️ COMO FUNCIONA</Typography>
        {[
          { icon: '📅', text: 'A base recebe progresso periódico durante a temporada e evolução anual' },
          { icon: '🚀', text: 'Explosivos têm vantagem de desenvolvimento quando mais jovens' },
          { icon: '⏳', text: 'Revelações tendem a crescer mais nas idades finais da base' },
          { icon: '🌟', text: `Garotos com ${viewModel.promoteAge}+ anos podem ser promovidos` },
          { icon: '💸', text: 'Dispensar remove o garoto; novos recrutas chegam na renovação da temporada' },
        ].map((row) => (
          <Box key={row.text} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>{row.icon}</Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700 }}>{row.text}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

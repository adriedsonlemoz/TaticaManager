import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import JerseyBadge from '../player/JerseyBadge.jsx';
import {
  getProspectDevelopmentProgress,
  getProspectWage,
  getTrajectoryInfo,
} from '../../engines/academy/academyViewModel.js';
import { ACADEMY_ACCENT, getTrajectoryVisual } from './academyPresentation.js';

export default function AcademyProspectCard({
  prospect,
  selected,
  promoteAge,
  formatMoney,
  onToggle,
  onRequestPromote,
  onRequestDispense,
}) {
  const C = THEME;
  const isReady = (prospect.age || 0) >= promoteAge;
  const gap = Math.max(0, (prospect.potential || 70) - (prospect.overall || 50));
  const progress = getProspectDevelopmentProgress(prospect);
  const trajectory = getTrajectoryInfo(prospect.trajectory);
  const trajectoryVisual = getTrajectoryVisual(prospect.trajectory);
  const wage = getProspectWage(prospect);

  return (
    <Box
      onClick={() => onToggle(prospect)}
      sx={{
        bgcolor: selected ? (isReady ? `${C.green}10` : 'rgba(124,58,237,0.07)') : C.card,
        border: `1.5px solid ${selected ? (isReady ? C.green : ACADEMY_ACCENT) : C.border}`,
        borderRadius: '14px', overflow: 'hidden', mb: 1, cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: selected ? `0 0 16px ${isReady ? C.green : ACADEMY_ACCENT}25` : 'none',
        '&:active': { transform: 'scale(0.985)' },
      }}
    >
      <Box sx={{ px: 1.3, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <JerseyBadge pos={prospect.position} num={prospect.shirt ?? '?'} size={44} showPos />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: C.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{prospect.name}</Typography>
            {isReady && (
              <Box sx={{ bgcolor: `${C.green}20`, border: `1px solid ${C.green}50`, borderRadius: '4px', px: 0.5, flexShrink: 0 }}>
                <Typography sx={{ color: C.green, fontSize: '0.42rem', fontWeight: 900 }}>PRONTO</Typography>
              </Box>
            )}
            <Box sx={{ bgcolor: `${trajectoryVisual.color}18`, border: `1px solid ${trajectoryVisual.color}40`, borderRadius: '4px', px: 0.5, flexShrink: 0 }}>
              <Typography sx={{ color: trajectoryVisual.color, fontSize: '0.42rem', fontWeight: 900 }}>{trajectory.shortLabel}</Typography>
            </Box>
          </Box>
          <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>
            {prospect.age} anos · Ano {prospect.academyYear || 1}{prospect.formerClub ? ` · 🏫 ${prospect.formerClub}` : ''}
          </Typography>
          <Box sx={{ mt: 0.4, display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ flex: 1, height: 4, bgcolor: C.border, borderRadius: 2, overflow: 'hidden', maxWidth: 100 }}>
              <Box sx={{ height: '100%', width: `${progress}%`, bgcolor: ACADEMY_ACCENT, borderRadius: 2, transition: 'width 0.5s' }} />
            </Box>
            <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700 }}>{progress}%</Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
          <Box sx={{ bgcolor: ACADEMY_ACCENT, borderRadius: '8px', px: 0.9, py: 0.3, mb: 0.25 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: '#fff', lineHeight: 1 }}>{prospect.overall}</Typography>
          </Box>
          <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>→ {prospect.potential}</Typography>
          {gap > 0 && <Typography sx={{ color: ACADEMY_ACCENT, fontSize: '0.46rem', fontWeight: 900 }}>+{gap}</Typography>}
        </Box>
      </Box>

      {selected && (
        <Box sx={{ px: 1.3, pb: 1.2, pt: 0.5, borderTop: `1px solid ${C.border}` }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.5, mb: 1 }}>
            {[
              { label: 'TRAJETÓRIA', value: trajectory.label, color: trajectoryVisual.color },
              { label: 'MARGEM', value: `+${gap}`, color: ACADEMY_ACCENT },
              { label: 'VALOR', value: formatMoney(prospect.value || 50000), color: C.green },
              { label: 'SALÁRIO', value: `${formatMoney(wage)}/R`, color: C.red },
            ].map((item) => (
              <Box key={item.label} sx={{ bgcolor: C.cardAlt, borderRadius: '7px', p: 0.6, textAlign: 'center', border: `1px solid ${C.border}` }}>
                <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '0.62rem', lineHeight: 1.2 }}>{item.value}</Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.42rem', fontWeight: 700, mt: 0.2 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ bgcolor: C.cardAlt, borderRadius: '8px', p: 0.9, mb: 0.9, border: `1px solid ${C.border}` }}>
            <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 0.8, mb: 0.5 }}>PROJEÇÃO DE DESENVOLVIMENTO</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: ACADEMY_ACCENT, fontWeight: 900, fontSize: '0.72rem', minWidth: 28 }}>{prospect.overall}</Typography>
              <Box sx={{ flex: 1, height: 8, bgcolor: C.border, borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${progress}%`, bgcolor: ACADEMY_ACCENT, borderRadius: 4 }} />
              </Box>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.72rem', minWidth: 28 }}>{prospect.potential}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
              <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700 }}>OVR atual</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700 }}>Potencial máximo</Typography>
            </Box>
            <Box sx={{ mt: 0.5, bgcolor: `${trajectoryVisual.color}10`, borderRadius: '5px', px: 0.7, py: 0.35 }}>
              <Typography sx={{ color: trajectoryVisual.color, fontSize: '0.52rem', fontWeight: 700 }}>{trajectory.label} — {trajectory.desc}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.7 }}>
            <Box
              component="button"
              type="button"
              onClick={(event) => { event.stopPropagation(); onRequestDispense(prospect); }}
              sx={{ flex: 1, border: `1.5px solid ${C.red}50`, bgcolor: 'transparent', borderRadius: '9px', py: 0.8, textAlign: 'center', cursor: 'pointer', '&:active': { bgcolor: `${C.red}08` } }}
            >
              <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.7rem' }}>✗ Dispensar</Typography>
            </Box>
            <Box
              component="button"
              type="button"
              disabled={!isReady}
              onClick={(event) => { event.stopPropagation(); if (isReady) onRequestPromote(prospect); }}
              sx={{
                flex: 2, bgcolor: isReady ? C.green : C.cardAlt, border: `1.5px solid ${isReady ? C.green : C.border}`,
                borderRadius: '9px', py: 0.8, textAlign: 'center', cursor: isReady ? 'pointer' : 'default', opacity: isReady ? 1 : 0.5,
                boxShadow: isReady ? `0 0 12px ${C.green}40` : 'none', '&:active': isReady ? { filter: 'brightness(0.88)' } : {},
              }}
            >
              <Typography sx={{ color: isReady ? '#000' : C.txt3, fontWeight: 900, fontSize: '0.7rem' }}>
                {isReady ? '🌟 Promover ao Profissional' : `⏳ Pronto aos ${promoteAge} anos`}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

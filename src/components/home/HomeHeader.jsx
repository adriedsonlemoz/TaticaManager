import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { HOME_THEME } from './homeTheme.js';

const moneyFallback = (value) => `R$${((Number(value) || 0) / 1e6).toFixed(1)}M`;

export default function HomeHeader({ viewModel, formatMoney }) {
  const { club, clubSummary, headerStats, recentForm } = viewModel;
  const fmoney = (value) => formatMoney ? formatMoney(value) : moneyFallback(value);
  const position = clubSummary.position;

  const stats = [
    { value: fmoney(headerStats.money), label: 'Caixa', color: headerStats.money > headerStats.wage * 8 ? '#bbf7d0' : headerStats.money > headerStats.wage * 3 ? '#fef08a' : '#fecaca' },
    { value: fmoney(headerStats.wage), label: 'Folha/R', color: '#fecaca' },
    { value: `${headerStats.goalsFor}×${headerStats.goalsAgainst}`, label: 'Gols', color: '#e0f2fe' },
    { value: `${headerStats.points}pts`, label: 'Pontos', color: '#fef9c3' },
  ];

  return (
    <Box sx={{
      background: `linear-gradient(180deg, ${HOME_THEME.grassDk} 0%, ${HOME_THEME.grass} 100%)`,
      pt: 5, pb: 0, position: 'relative', overflow: 'hidden',
    }}>
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', bgcolor: '#fff' }} />
        <Box sx={{ position: 'absolute', left: '50%', top: '20%', width: 60, height: 60, borderRadius: '50%', border: '1px solid #fff', transform: 'translate(-50%,-50%)' }} />
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '18%', borderRight: '1px solid #fff' }} />
        <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '18%', borderLeft: '1px solid #fff' }} />
      </Box>

      <Box sx={{ px: 2, pb: 2, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            width: 58, height: 58, borderRadius: '16px', flexShrink: 0,
            bgcolor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {club.name
              ? React.createElement(TeamIcon, { name: club.name, size: 40 })
              : <Typography sx={{ fontSize: '1.8rem' }}>⚽</Typography>}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              color: '#fff', fontWeight: 900, fontSize: '1.15rem', fontFamily: '"Cinzel", serif',
              lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.4)', overflow: 'hidden',
              whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {club.name || 'Meu Clube'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.6rem', fontWeight: 700, mt: 0.3 }}>
              👔 {club.manager || 'Treinador'} · {club.managerProfile?.style || 'Equilibrado'}
            </Typography>
          </Box>

          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.35)',
            borderRadius: '14px', px: 1.2, py: 0.6, textAlign: 'center', backdropFilter: 'blur(4px)',
          }}>
            <Typography sx={{
              color: position > 0 && position <= 4 ? '#fbbf24' : position >= 17 ? '#fca5a5' : '#fff',
              fontWeight: 900, fontSize: '1.8rem', lineHeight: 1, fontFamily: '"Cinzel",serif',
            }}>
              {position > 0 ? position : '—'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.38rem', fontWeight: 800, letterSpacing: 1 }}>
              POSIÇÃO
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.7, overflowX: 'auto', pb: 0.3 }}>
          {stats.map((stat) => (
            <Box key={stat.label} sx={{
              flexShrink: 0, bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', px: 1, py: 0.5,
              textAlign: 'center', minWidth: 62,
            }}>
              <Typography sx={{ color: stat.color, fontWeight: 900, fontSize: '0.65rem', lineHeight: 1.1 }}>{stat.value}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: '0.38rem', letterSpacing: 0.5 }}>{stat.label}</Typography>
            </Box>
          ))}

          <Box aria-label={`Forma recente: ${recentForm.join(', ') || 'sem partidas'}`} sx={{
            flexShrink: 0, bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', px: 0.8, py: 0.5,
            display: 'flex', alignItems: 'center', gap: 0.3,
          }}>
            {recentForm.length === 0
              ? <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.56rem', px: 0.5 }}>—</Typography>
              : recentForm.map((result, index) => (
                <Box key={`${result}-${index}`} sx={{
                  width: 15, height: 15, borderRadius: '50%',
                  bgcolor: result === 'V' ? '#22c55e' : result === 'D' ? '#ef4444' : '#fbbf24',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.3)',
                }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.38rem' }}>{result}</Typography>
                </Box>
              ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: 18, bgcolor: HOME_THEME.bg, borderRadius: '40px 40px 0 0', position: 'relative', zIndex: 2 }} />
    </Box>
  );
}

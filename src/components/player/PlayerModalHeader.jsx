import React from 'react';
import { Box, Typography } from '@mui/material';
import { JerseyBadge } from '../../helpers.js';
import { THEME } from '../../theme.js';

export default function PlayerModalHeader({ player }) {
  const C = THEME;
  const position = ({
    GOL: { bg: C.posGol, text: '#fff' }, ZAG: { bg: C.posZag, text: '#fff' },
    LD: { bg: C.posLat, text: '#fff' }, LE: { bg: C.posLat, text: '#fff' },
    VOL: { bg: C.posVol, text: '#fff' }, MC: { bg: C.posVol, text: '#fff' },
    MEI: { bg: C.posMei, text: '#fff' }, PD: { bg: C.posAta, text: '#fff' },
    PE: { bg: C.posAta, text: '#fff' }, CA: { bg: C.posAta, text: '#fff' },
    LAT: { bg: C.posLat, text: '#fff' }, ATA: { bg: C.posAta, text: '#fff' },
  }[player.position] || { bg: C.posDef, text: '#fff' });
  const overallColor = player.overall >= 80 ? C.ovrGood : player.overall >= 70 ? C.ovrMid : C.ovrBad;

  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${position.bg}30 0%, ${C.bgCard} 70%)`,
      px: 2,
      pt: 2,
      pb: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      position: 'relative',
      borderBottom: `3px solid ${position.bg}`,
    }}>
      <JerseyBadge pos={player.position} num={player.shirt ?? '?'} size={56} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontWeight: 900,
          color: C.ink,
          fontSize: '1.1rem',
          lineHeight: 1.1,
          mb: 0.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {player.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
          <Typography sx={{ color: C.ink2, fontSize: '0.7rem', fontWeight: 700 }}>
            {player.shirt ?? '?'} · {player.age} anos · {player.nationality || player.country || ''}
          </Typography>
          <Box sx={{
            bgcolor: player.isStarting ? C.primary : C.bgDark,
            color: player.isStarting ? '#fff' : C.ink2,
            px: 0.8,
            py: 0.1,
            borderRadius: 1,
            fontSize: '0.55rem',
            fontWeight: 900,
          }}>
            {player.isStarting ? 'TITULAR' : 'RESERVA'}
          </Box>
          {player.age <= 21 && (
            <Box sx={{ bgcolor: '#7c3aed20', border: '1px solid #7c3aed60', color: '#7c3aed', px: 0.8, py: 0.1, borderRadius: 1, fontSize: '0.55rem', fontWeight: 900 }}>
              ⭐ JOVEM
            </Box>
          )}
          {player.age >= 33 && (
            <Box sx={{ bgcolor: `${C.orange || '#f97316'}20`, border: `1px solid ${C.orange || '#f97316'}50`, color: C.orange || '#f97316', px: 0.8, py: 0.1, borderRadius: 1, fontSize: '0.55rem', fontWeight: 900 }}>
              🕰️ VETERANO
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{
        bgcolor: overallColor,
        borderRadius: '8px',
        px: 1.2,
        py: 0.5,
        textAlign: 'center',
        flexShrink: 0,
        border: `1.5px solid ${C.border}`,
        boxShadow: `0 2px 8px ${overallColor}60`,
      }}>
        <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: '#fff', lineHeight: 1 }}>
          {player.overall}
        </Typography>
        <Typography sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 900, opacity: 0.9 }}>OVR</Typography>
      </Box>
    </Box>
  );
}

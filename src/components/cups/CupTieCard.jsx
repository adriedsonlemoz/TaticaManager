import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TeamIcon } from '../../data/database_branding.js';
import { getTieLegRows, hasAggregateScore } from './cupPresentation.js';

const CupTieCard = ({ tie, cupColor, label, formatMoney }) => {
  if (!tie) return null;
  const C = THEME;
  const legRows = getTieLegRows(tie);

  return (
    <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1.2 }}>
      <Box sx={{ px: 1.5, py: 0.8, bgcolor: `${cupColor}18`, borderBottom: `1px solid ${cupColor}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: cupColor, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>
          {label} · {tie.phase}
        </Typography>
        {tie.decided && tie.winner && (
          <Box sx={{ bgcolor: tie.winner.isPlayer ? C.primary : C.red, borderRadius: '4px', px: 0.7, py: 0.1 }}>
            <Typography sx={{ color: tie.winner.isPlayer ? '#000' : '#fff', fontWeight: 900, fontSize: '0.55rem' }}>
              {tie.winner.isPlayer ? 'CLASSIFICADO ✓' : 'ELIMINADO'}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TeamIcon name={tie.home?.name} size={28} />
        <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '0.78rem', color: tie.home?.isPlayer ? C.primary : C.txt1 }}>
          {tie.home?.name}
        </Typography>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.7rem', mx: 0.5 }}>vs</Typography>
        <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 900, fontSize: '0.78rem', color: tie.away?.isPlayer ? C.primary : C.txt1 }}>
          {tie.away?.name}
        </Typography>
        <TeamIcon name={tie.away?.name} size={28} />
      </Box>

      <Box sx={{ px: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {legRows.map((row) => (
          <Box key={row.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: C.cardAlt, borderRadius: '6px', px: 1, py: 0.5 }}>
            <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, minWidth: 78 }}>
              {row.label} (Rod {row.round || '?'})
            </Typography>
            <Typography sx={{ color: row.played ? C.txt1 : C.txt3, fontWeight: row.played ? 900 : 400, fontSize: row.played ? '0.75rem' : '0.65rem', fontFamily: row.played ? 'monospace' : 'inherit', fontStyle: row.played ? 'normal' : 'italic' }}>
              {row.score}
            </Typography>
          </Box>
        ))}

        {tie.decided && hasAggregateScore(tie) && (
          <Box sx={{ bgcolor: `${cupColor}12`, border: `1px solid ${cupColor}40`, borderRadius: '6px', px: 1, py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: C.txt2, fontSize: '0.6rem', fontWeight: 700 }}>
              {tie.leg2 ? 'AGREGADO' : 'PLACAR FINAL'}
            </Typography>
            <Typography sx={{ color: cupColor, fontWeight: 900, fontSize: '0.82rem', fontFamily: 'monospace' }}>
              {tie.homeAggr} – {tie.awayAggr}
              {tie.penalties && ` (Pen: ${tie.penalties.home}x${tie.penalties.away})`}
            </Typography>
          </Box>
        )}
      </Box>

      {(tie.prize || 0) > 0 && (
        <Box sx={{ px: 1.5, pb: 0.8 }}>
          <Typography sx={{ color: C.primary, fontSize: '0.62rem', fontWeight: 700 }}>
            💰 Premiação desta fase: {formatMoney ? formatMoney(tie.prize) : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CupTieCard;

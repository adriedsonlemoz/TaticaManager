import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { DisciplineEngine } from '../../engines/engine_discipline.js';
import { getDisciplineStatus } from '../../engines/player/playerProfileService.js';

export default function PlayerDisciplineTab({ player, currentRound, onClose }) {
  const C = THEME;
  const status = getDisciplineStatus(player, currentRound, DisciplineEngine);
  const yellows = Math.min(3, status.yellows);
  const statusColor = status.tone === 'danger' ? C.red : status.tone === 'warning' ? C.orange : C.green;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1, bgcolor: `${statusColor}15`, border: `2px solid ${statusColor}`, borderRadius: '10px', p: 1.5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.8rem', mb: 0.5, lineHeight: 1 }}>{status.icon}</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: '0.8rem', color: statusColor }}>{status.label}</Typography>
        </Box>
        <Box sx={{ flex: 1, bgcolor: C.bgCard, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', mb: 0.5, letterSpacing: 0.5 }}>CARTÕES AMARELOS</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((index) => (
              <Box key={index} sx={{ flex: 1, height: 20, borderRadius: '4px', bgcolor: index < yellows ? '#fbc02d' : 'rgba(0,0,0,0.08)', border: index < yellows ? '1px solid #f57f17' : 'none' }} />
            ))}
          </Box>
          <Typography sx={{ color: C.txt2, fontSize: '0.55rem', mt: 0.5, fontWeight: 700 }}>{Math.max(0, 3 - yellows)} para suspensão</Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 1.5, mb: 1.5, bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px' }}>
        <Typography sx={{ color: C.primary, fontWeight: 900, fontSize: '0.65rem', mb: 1, letterSpacing: 0.5 }}>📜 REGRAS DO CAMPEONATO</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: C.txt2, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>• <span style={{ color: C.txt1, fontWeight: 700 }}>3 Amarelos</span> geram suspensão.</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: C.txt2, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>• <span style={{ color: C.red, fontWeight: 700 }}>1 Vermelho</span> gera suspensão imediata.</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: C.txt2, display: 'flex', alignItems: 'center', gap: 0.5 }}>• Contadores zeram após o cumprimento.</Typography>
      </Paper>

      <Button fullWidth variant="outlined" onClick={onClose} sx={{ color: C.txt2, borderColor: C.border, fontWeight: 900, borderRadius: '8px' }}>FECHAR</Button>
    </Box>
  );
}

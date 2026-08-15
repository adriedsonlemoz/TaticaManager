import React from 'react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { getProspectWage } from '../../engines/academy/academyViewModel.js';

export function AcademyPromoteDialog({ prospect, formatMoney, onClose, onConfirm }) {
  const C = THEME;
  return (
    <Dialog open={!!prospect} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: C.bg, borderRadius: '16px', border: `2px solid ${C.green}`, m: 2 } }}>
      {prospect && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
            <Typography sx={{ fontSize: '2.5rem', lineHeight: 1, mb: 0.5 }}>🌟</Typography>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem' }}>Promover ao Profissional</Typography>
          </Box>
          <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', p: 1.2, mb: 1.5 }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.9rem', mb: 0.3 }}>{prospect.name}</Typography>
            {[
              { label: 'Posição', value: prospect.position },
              { label: 'OVR', value: prospect.overall },
              { label: 'Potencial', value: prospect.potential },
              { label: 'Contrato', value: '2 temporadas' },
              { label: 'Salário', value: `${formatMoney(getProspectWage(prospect))}/rodada` },
            ].map((row, index, rows) => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.35, borderBottom: index < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <Typography sx={{ color: C.txt3, fontSize: '0.65rem', fontWeight: 700 }}>{row.label}</Typography>
                <Typography sx={{ color: C.txt1, fontSize: '0.65rem', fontWeight: 900 }}>{row.value}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            <Button fullWidth onClick={onClose} sx={{ color: C.txt2, fontWeight: 900, borderRadius: '10px', border: `1.5px solid ${C.border}` }}>Cancelar</Button>
            <Button fullWidth onClick={() => onConfirm(prospect)} sx={{ bgcolor: C.green, color: '#000', fontWeight: 900, borderRadius: '10px', boxShadow: `0 0 14px ${C.green}40` }}>🌟 Promover</Button>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}

export function AcademyDispenseDialog({ prospect, onClose, onConfirm }) {
  const C = THEME;
  return (
    <Dialog open={!!prospect} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: C.bg, borderRadius: '16px', border: `2px solid ${C.red}`, m: 2 } }}>
      {prospect && (
        <Box sx={{ p: 2 }}>
          <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '1rem', mb: 0.5 }}>Dispensar da Base</Typography>
          <Typography sx={{ color: C.txt2, fontSize: '0.82rem', mb: 1.8 }}>
            Dispensar <strong>{prospect.name}</strong> (OVR {prospect.overall}, {prospect.age} anos)? Essa ação não pode ser desfeita.
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            <Button fullWidth onClick={onClose} sx={{ color: C.txt2, fontWeight: 900, borderRadius: '10px', border: `1.5px solid ${C.border}` }}>Cancelar</Button>
            <Button fullWidth onClick={() => onConfirm(prospect)} sx={{ bgcolor: C.red, color: '#fff', fontWeight: 900, borderRadius: '10px' }}>Dispensar</Button>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}

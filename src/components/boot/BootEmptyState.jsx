import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const BootEmptyState = ({ onNewCareer, theme }) => {
  const C = theme;
  return (
    <Box sx={{ textAlign: 'center', py: 3.5, px: 1.5, bgcolor: C.bgCard, border: `1.5px dashed ${C.border}`, borderRadius: '14px', mt: 1, boxShadow: `0 2px 12px ${C.shadow}` }}>
      <Typography sx={{ fontSize: '2.5rem', mb: 0.6, opacity: 0.3 }}>📂</Typography>
      <Typography sx={{ color: C.ink, fontWeight: 700, fontSize: '1rem', mb: 0.35 }}>Nenhuma carreira encontrada</Typography>
      <Typography sx={{ color: C.ink2, fontSize: '0.82rem', mb: 1.6 }}>Inicie sua jornada agora mesmo!</Typography>
      <Button onClick={onNewCareer} sx={{ bgcolor: C.green, color: '#fff', fontWeight: 900, px: 2.6, py: 0.85, borderRadius: '10px', fontSize: '1rem', boxShadow: `0 4px 16px ${C.shadow}`, '&:hover': { bgcolor: C.primaryDim } }}>✍️ Nova Carreira</Button>
    </Box>
  );
};

export default BootEmptyState;

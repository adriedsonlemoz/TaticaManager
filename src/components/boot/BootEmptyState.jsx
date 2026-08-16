import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const BootEmptyState = ({ onNewCareer, theme }) => {
  const C = theme;
  return (
    <Box sx={{ textAlign: 'center', py: 7, px: 2, bgcolor: C.bgCard, border: `1.5px dashed ${C.border}`, borderRadius: '14px', mt: 1, boxShadow: `0 2px 12px ${C.shadow}` }}>
      <Typography sx={{ fontSize: '3.5rem', mb: 1, opacity: 0.3 }}>📂</Typography>
      <Typography sx={{ color: C.ink, fontWeight: 700, fontSize: '1.2rem', mb: 0.5 }}>Nenhuma carreira encontrada</Typography>
      <Typography sx={{ color: C.ink2, fontSize: '1rem', mb: 3 }}>Inicie sua jornada agora mesmo!</Typography>
      <Button onClick={onNewCareer} sx={{ bgcolor: C.green, color: '#fff', fontWeight: 900, px: 3.5, py: 1.2, borderRadius: '10px', fontSize: '1rem', boxShadow: `0 4px 16px ${C.shadow}`, '&:hover': { bgcolor: C.primaryDim } }}>✍️ Nova Carreira</Button>
    </Box>
  );
};

export default BootEmptyState;

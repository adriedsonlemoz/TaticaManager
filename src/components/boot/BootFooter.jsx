import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const BootFooter = ({ onNewCareer, onAbout, theme }) => {
  const C = theme;
  return (
    <Box sx={{ display: 'flex', borderTop: `1.5px solid ${C.border}`, bgcolor: C.bgCard }}>
      <Button onClick={onNewCareer} sx={{ flex: 1.3, py: 1.8, borderRadius: 0, bgcolor: C.green, color: '#fff', fontWeight: 900, fontSize: '0.8rem', letterSpacing: 0.3, display: 'flex', flexDirection: 'column', gap: 0.2, borderRight: '1px solid rgba(0,0,0,0.15)', '&:hover': { bgcolor: C.primaryDim } }}>
        <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>＋</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5 }}>NOVA CARREIRA</Typography>
      </Button>
      <Button onClick={onAbout} sx={{ flex: 1, py: 1.8, borderRadius: 0, bgcolor: 'transparent', color: C.ink2, fontWeight: 900, display: 'flex', flexDirection: 'column', gap: 0.2, borderLeft: `1.5px solid ${C.border}`, '&:hover': { bgcolor: C.bgDark, color: C.ink } }}>
        <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>ℹ️</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: '0.68rem', letterSpacing: 0.5 }}>SOBRE</Typography>
      </Button>
    </Box>
  );
};

export default BootFooter;

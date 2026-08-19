import React from 'react';
import { Box, Button } from '@mui/material';

const BootFooter = ({ onNewCareer, onAbout, theme }) => {
  const C = theme;
  return (
    <Box sx={{ borderTop:`1.5px solid ${C.border}`, bgcolor:C.bgCard, px:1, py:.8, display:'grid', gridTemplateColumns:'1fr auto', gap:.7 }}>
      <Button onClick={onNewCareer} sx={{ minHeight:48, borderRadius:'11px', bgcolor:C.green, color:'#fff', fontWeight:900, fontSize:'.9rem', boxShadow:`0 3px 12px ${C.shadow}`, '&:hover':{ bgcolor:C.primaryDim } }}>
        ＋ NOVA CARREIRA
      </Button>
      <Button onClick={onAbout} sx={{ minWidth:82, minHeight:48, borderRadius:'11px', bgcolor:C.bgCardAlt, color:C.ink2, border:`1px solid ${C.border}`, fontWeight:900, fontSize:'.8rem' }}>
        ℹ️ Sobre
      </Button>
    </Box>
  );
};

export default BootFooter;

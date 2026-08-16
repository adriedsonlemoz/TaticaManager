import React from 'react';
import { Box, Typography } from '@mui/material';

export default function MedicalSectionHeader({ icon, title, count, color }) {
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:1, px:1.5, py:0.8, mb:0.8, bgcolor:`${color}12`, borderRadius:'8px', border:`1px solid ${color}40` }}>
      <Typography sx={{ fontSize:'1.1rem' }}>{icon}</Typography>
      <Typography sx={{ color, fontWeight:900, fontSize:'0.8rem', flex:1 }}>{title}</Typography>
      <Box sx={{ bgcolor:color, color:'#fff', borderRadius:'10px', px:0.8, py:0.1, fontSize:'0.68rem', fontWeight:900 }}>{count}</Box>
    </Box>
  );
}

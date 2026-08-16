import React from 'react';
import { Box, Typography } from '@mui/material';

export default function FieldHeader({ formation, startersCount, teamOvr, C }) {
  return (
    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
      <Box>
        <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.88rem' }}>{formation}</Typography>
        <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>{startersCount} titulares · OVR médio {teamOvr}</Typography>
      </Box>
      <Box sx={{ bgcolor:`${C.green}18`, border:`1.5px solid ${C.green}40`, borderRadius:'10px', px:1.2, py:0.5, textAlign:'center' }}>
        <Typography sx={{ color:C.green, fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{teamOvr}</Typography>
        <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:900, letterSpacing:0.5 }}>OVR</Typography>
      </Box>
    </Box>
  );
}

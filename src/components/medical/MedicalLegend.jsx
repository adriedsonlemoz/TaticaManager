import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

export default function MedicalLegend() {
  const C = THEME;
  const rows = [
    { icon:'🟢', range:'80–100%', effect:'Forma ideal — sem penalidade de OVR' },
    { icon:'🟢', range:'70–79%', effect:'Sem perda de OVR, mas rendimento começa a cair' },
    { icon:'🟡', range:'50–69%', effect:'Cansado — -2 de OVR efetivo e maior risco de lesão' },
    { icon:'🟠', range:'30–49%', effect:'Muito cansado — -5 de OVR efetivo' },
    { icon:'🔴', range:'0–29%', effect:'Exausto — -8 de OVR efetivo e risco elevado' },
  ];

  return (
    <Paper sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.bord2}`, borderRadius:'10px', p:1.5, mb:2 }}>
      <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.65rem', mb:0.8, letterSpacing:0.5 }}>ℹ️ COMO FUNCIONA O CANSAÇO</Typography>
      {rows.map((row) => (
        <Box key={row.range} sx={{ display:'flex', gap:1, mb:0.4, alignItems:'center' }}>
          <Typography sx={{ fontSize:'0.7rem' }}>{row.icon}</Typography>
          <Typography sx={{ fontWeight:900, fontSize:'0.65rem', color:C.txt1, minWidth:60 }}>{row.range}</Typography>
          <Typography sx={{ fontSize:'0.62rem', color:C.txt2 }}>{row.effect}</Typography>
        </Box>
      ))}
    </Paper>
  );
}

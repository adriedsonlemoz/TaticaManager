import React from 'react';
import { Box, Typography } from '@mui/material';
import { POSITION_LEGEND } from '../../engines/field/fieldViewModel.js';

export default function FieldLegend({ C }) {
  return (
    <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.6, mt:1 }} aria-label="Legenda de posições">
      {POSITION_LEGEND.map(({ pos, label, color }) => (
        <Box key={pos} sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
          <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:color, flexShrink:0 }} />
          <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700 }}>{pos} · {label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

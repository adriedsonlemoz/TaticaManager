import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

export default function MedicalHeader({ viewModel }) {
  const C = THEME;
  const cards = [
    { icon:'🚑', label:'Lesionados', value:viewModel.counts.injured, color:C.red },
    { icon:'🚫', label:'Suspensos', value:viewModel.counts.suspended, color:C.yellow },
    { icon:'😓', label:'Críticos', value:viewModel.counts.criticalFatigue, color:C.red },
  ];

  return (
    <Box sx={{ background:'linear-gradient(180deg,#ffffff 0%,#f4f7f6 100%)', borderBottom:`2px solid ${C.border}`, px:1.5, pt:3.8, pb:1.4 }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.2 }}>
        <Box sx={{ width:44, height:44, borderRadius:'10px', flexShrink:0, bgcolor:'rgba(248,81,73,0.1)', border:'1.5px solid rgba(248,81,73,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Typography sx={{ fontSize:'1.5rem', lineHeight:1 }}>🏥</Typography>
        </Box>
        <Box sx={{ flex:1 }}>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.05rem', lineHeight:1, letterSpacing:0.5 }}>CENTRO MÉDICO</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700, mt:0.2 }}>{viewModel.clubName} · Rodada {viewModel.round}</Typography>
        </Box>
      </Box>

      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.8 }}>
        {cards.map((card) => (
          <Box key={card.label} sx={{ bgcolor:`${card.color}10`, borderRadius:'8px', border:`1px solid ${card.color}35`, p:0.8, textAlign:'center' }}>
            <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>{card.icon}</Typography>
            <Typography sx={{ color:card.color, fontWeight:900, fontSize:'1.1rem', lineHeight:1.1 }}>{card.value}</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700, letterSpacing:0.5, mt:0.1 }}>{card.label.toUpperCase()}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

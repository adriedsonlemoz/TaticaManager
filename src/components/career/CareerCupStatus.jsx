import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerCupStatus = ({ cup, theme, formatMoney }) => {
  const C = theme;
  if (!cup) return null;
  const statusColor = cup.status==='champion'?C.gold:cup.status==='eliminated'?C.red:C.green;
  const statusLabel = cup.status==='champion'?'🏆 CAMPEÃO!':cup.status==='eliminated'?'❌ Eliminado':'✅ Ativo';
  return <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', p:1.4, mb:1.5 }}>
    <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2, mb:0.8 }}>🏆 COPA DO BRASIL</Typography>
    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <Typography sx={{ color:C.txt2, fontSize:'0.75rem', fontWeight:700 }}>{cup.phaseLabel || 'Em andamento'}</Typography>
      <Typography sx={{ color:statusColor, fontWeight:900, fontSize:'0.75rem' }}>{statusLabel}</Typography>
    </Box>
    {(cup.totalPrize||0)>0 && formatMoney && <Typography sx={{ color:C.green, fontSize:'0.62rem', fontWeight:700, mt:0.4 }}>💰 Premiação acumulada: {formatMoney(cup.totalPrize)}</Typography>}
  </Box>;
};
export default CareerCupStatus;

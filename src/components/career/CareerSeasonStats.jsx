import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerSeasonStats = ({ season, viewModel, theme }) => {
  const C = theme;
  const { myRow, seasonWinPct, goalDifference } = viewModel;
  return <>
    <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2, mb:1 }}>TEMPORADA {season || 2026}</Typography>
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0.7, mb:1 }}>
      {[{ l:'VITÓRIAS',v:myRow.w??0,c:C.green },{ l:'EMPATES',v:myRow.d??0,c:C.gold },{ l:'DERROTAS',v:myRow.l??0,c:C.red }].map(s => (
        <Box key={s.l} sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', py:1.2, textAlign:'center' }}>
          <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1.3rem', lineHeight:1 }}>{s.v}</Typography>
          <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.44rem', letterSpacing:0.5, mt:0.3 }}>{s.l}</Typography>
        </Box>
      ))}
    </Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:0.7, mb:1.5 }}>
      {[
        { l:'JOGOS',v:myRow.p??0,c:C.txt1 },
        { l:'APRV %',v:`${seasonWinPct}%`,c:seasonWinPct>=60?C.green:seasonWinPct>=40?C.gold:C.red },
        { l:'PONTOS',v:myRow.pts??0,c:C.txt1 },
        { l:'SALDO',v:`${goalDifference>0?'+':''}${goalDifference}`,c:goalDifference>=0?C.green:C.red },
      ].map(s => <Box key={s.l} sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', py:0.9, textAlign:'center' }}>
        <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{s.v}</Typography>
        <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.42rem', mt:0.2 }}>{s.l}</Typography>
      </Box>)}
    </Box>
  </>;
};
export default CareerSeasonStats;

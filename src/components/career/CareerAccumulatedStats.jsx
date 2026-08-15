import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerAccumulatedStats = ({ viewModel, theme }) => {
  const C = theme;
  const { profile, total, careerWinPct, managerLevel } = viewModel;
  const pctColor = careerWinPct>=60?C.green:careerWinPct>=40?C.gold:C.red;
  return <>
    <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2, mb:1 }}>CARREIRA ACUMULADA</Typography>
    <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.5 }}>
      <Box sx={{ px:1.4, pt:1.2, pb:0.8 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.6 }}>
          <Typography sx={{ color:C.txt2, fontWeight:700, fontSize:'0.68rem' }}>Aproveitamento de carreira</Typography>
          <Typography sx={{ color:pctColor, fontWeight:900, fontSize:'0.78rem' }}>{careerWinPct}%</Typography>
        </Box>
        <Box sx={{ height:8, bgcolor:C.bgDark||'#f1f5f9', borderRadius:4, overflow:'hidden', mb:0.3 }}>
          <Box sx={{ height:'100%', borderRadius:4, width:`${careerWinPct}%`, bgcolor:pctColor, transition:'width 0.6s' }}/>
        </Box>
        <Box sx={{ display:'flex', justifyContent:'space-between' }}>
          <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>{total} jogo{total!==1?'s':''}</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>{profile.seasonsTotal||0} temporada{(profile.seasonsTotal||0)!==1?'s':''}</Typography>
        </Box>
      </Box>
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid ${C.border}` }}>
        {[
          { l:'V',v:profile.wins??0,c:C.green },{ l:'E',v:profile.draws??0,c:C.gold },
          { l:'D',v:profile.losses??0,c:C.red },{ l:'XP',v:profile.experience??0,c:managerLevel.color },
        ].map((s,i,arr) => <Box key={s.l} sx={{ py:1.2, textAlign:'center', borderRight:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
          <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1.1rem', lineHeight:1 }}>{s.v}</Typography>
          <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.44rem', mt:0.2 }}>{s.l}</Typography>
        </Box>)}
      </Box>
    </Box>
  </>;
};
export default CareerAccumulatedStats;

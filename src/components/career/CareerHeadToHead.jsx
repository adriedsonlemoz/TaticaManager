import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerHeadToHead = ({ entries, theme }) => {
  const C = theme;
  if (!entries?.length) return null;
  return <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.5 }}>
    <Box sx={{ px:1.4, py:1, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:0.8 }}>
      <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>⚔️</Typography>
      <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.62rem', letterSpacing:0.8 }}>CONFRONTOS DIRETOS</Typography>
    </Box>
    {entries.map((entry,i) => {
      const wc = entry.w>entry.l?C.green:entry.l>entry.w?C.red:C.yellow;
      return <Box key={entry.name} sx={{ px:1.4, py:0.85, borderBottom:i<entries.length-1?`1px solid ${C.border}`:'none' }}>
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.4 }}>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.72rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:140 }}>{entry.name}</Typography>
          <Box sx={{ display:'flex', gap:0.4, flexShrink:0 }}>
            {[{v:entry.w,c:C.green,l:'V'},{v:entry.d,c:C.yellow,l:'E'},{v:entry.l,c:C.red,l:'D'}].map(s => <Box key={s.l} sx={{ bgcolor:`${s.c}15`, borderRadius:'4px', px:0.5, py:0.1 }}>
              <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.58rem' }}>{s.v}{s.l}</Typography>
            </Box>)}
          </Box>
        </Box>
        <Box sx={{ height:4, bgcolor:C.border, borderRadius:2, overflow:'hidden' }}>
          <Box sx={{ height:'100%', width:`${entry.winPct}%`, bgcolor:wc, borderRadius:2 }}/>
        </Box>
      </Box>;
    })}
  </Box>;
};
export default CareerHeadToHead;

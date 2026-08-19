import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

export default function NewsCard({ item }) {
  const C = THEME;
  const color = item?.meta?.color || C.act;
  return (
    <Box component="article" sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 10px rgba(15,23,42,.05)' }}>
      <Box sx={{ height:3, bgcolor:color }} />
      <Box sx={{ p:1.15, display:'flex', gap:1 }}>
        <Box sx={{ width:34, height:34, borderRadius:'9px', bgcolor:`${color}12`, border:`1px solid ${color}28`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="material-icons" style={{ color, fontSize:'1rem' }}>{item.icon || item.meta?.icon || 'newspaper'}</span>
        </Box>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', gap:0.8, alignItems:'center', mb:0.3 }}>
            <Typography sx={{ color, fontWeight:900, fontSize:'0.48rem', textTransform:'uppercase', letterSpacing:.6 }}>{item.meta?.label || 'Notícia'}</Typography>
            <Typography sx={{ color:C.txt4, fontWeight:700, fontSize:'0.46rem', whiteSpace:'nowrap' }}>{item.displayDate}</Typography>
          </Box>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.78rem', lineHeight:1.2 }}>{item.title}</Typography>
          {item.summary && <Typography sx={{ color:C.txt3, fontWeight:650, fontSize:'0.58rem', lineHeight:1.4, mt:0.38 }}>{item.summary}</Typography>}
          {(item.competition || item.playerName) && (
            <Box sx={{ display:'flex', gap:.45, flexWrap:'wrap', mt:.7 }}>
              {item.competition && <Box sx={{ px:.55, py:.18, borderRadius:'5px', bgcolor:C.cardB }}><Typography sx={{ color:C.txt3, fontSize:'0.45rem', fontWeight:800 }}>{item.competition}</Typography></Box>}
              {item.playerName && <Box sx={{ px:.55, py:.18, borderRadius:'5px', bgcolor:`${color}0d` }}><Typography sx={{ color, fontSize:'0.45rem', fontWeight:800 }}>{item.playerName}</Typography></Box>}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

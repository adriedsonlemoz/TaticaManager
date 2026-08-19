import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerHistory = ({ entries, theme, formatMoney }) => {
  const C = theme;
  if (!entries?.length) return null;
  return <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.5 }}>
    <Box sx={{ px:1.4, py:1, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:0.8 }}>
      <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>📅</Typography>
      <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.62rem', letterSpacing:0.8 }}>HISTÓRICO DE TEMPORADAS</Typography>
    </Box>
    {entries.map((entry,i) => {
      const sc = entry.serieColor || C.txt2;
      const pc = entry.position===1?C.gold:entry.position<=4?C.green:entry.position>=17?C.red:C.txt1;
      const pctColor = entry.winPct>=60?C.green:entry.winPct>=40?C.gold:C.red;
      return <Box key={`${entry.season}-${entry.serie}-${i}`} sx={{ display:'flex', alignItems:'center', gap:1, px:1.4, py:0.85, borderBottom:i<entries.length-1?`1px solid ${C.border}`:'none' }}>
        <Box sx={{ minWidth:44, textAlign:'center' }}>
          <Box sx={{ bgcolor:`${sc}18`, border:`1px solid ${sc}40`, borderRadius:'6px', px:0.5, py:0.2, mb:0.2 }}>
            <Typography sx={{ color:sc, fontWeight:900, fontSize:'0.58rem', lineHeight:1 }}>S{entry.serie}</Typography>
          </Box>
          <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>{entry.season}</Typography>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.4, minWidth:38 }}>
          <Typography sx={{ fontSize:'0.75rem' }}>{entry.positionIcon}</Typography>
          <Typography sx={{ color:pc, fontWeight:900, fontSize:'0.82rem' }}>{entry.position}º</Typography>
        </Box>
        <Box sx={{ flex:1 }}>
          <Box sx={{ display:'flex', gap:0.6, mb:0.3 }}>
            <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.62rem' }}>{entry.wins}V</Typography>
            <Typography sx={{ color:C.gold, fontWeight:900, fontSize:'0.62rem' }}>{entry.draws}E</Typography>
            <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.62rem' }}>{entry.losses}D</Typography>
            <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.62rem' }}>{entry.pts}pts</Typography>
          </Box>
          <Box sx={{ height:3, bgcolor:C.border, borderRadius:2, overflow:'hidden', width:'80%' }}>
            <Box sx={{ height:'100%', width:`${entry.winPct}%`, bgcolor:pctColor, borderRadius:2 }}/>
          </Box>
        </Box>
        {entry.cupTitleCount > 0 && <Typography title={entry.cupTitles.join(', ')} sx={{ fontSize:'0.72rem', flexShrink:0, color:C.gold, fontWeight:900 }}>🏆{entry.cupTitleCount > 1 ? `×${entry.cupTitleCount}` : ''}</Typography>}
        {entry.money > 0 && formatMoney && <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700, textAlign:'right', flexShrink:0 }}>{formatMoney(entry.money)}</Typography>}
      </Box>;
    })}
  </Box>;
};
export default CareerHistory;

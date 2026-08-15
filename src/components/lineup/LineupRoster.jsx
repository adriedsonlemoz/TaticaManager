import React from 'react';
import { Box, Typography } from '@mui/material';
import LineupPlayerCard from './LineupPlayerCard.jsx';

function SectionTitle({ children, color, C }) { return <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1.4, mb:0.9 }}><Box sx={{height:'1px',flex:1,bgcolor:color||C.border}}/><Typography sx={{ color:color||C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5 }}>{children}</Typography><Box sx={{height:'1px',flex:1,bgcolor:color||C.border}}/></Box>; }

export default function LineupRoster({ bench, unavailable, currentRound, onToggle, C }) {
  return <Box sx={{ px:1.5, pt:0.5, maxHeight:340, overflowY:'auto', '&::-webkit-scrollbar':{width:'3px'}, '&::-webkit-scrollbar-thumb':{bgcolor:C.border,borderRadius:2} }}>
    {bench.length>0&&<><SectionTitle C={C}>BANCO ({bench.length})</SectionTitle>{bench.map(p=><LineupPlayerCard key={p.id} player={p} currentRound={currentRound} C={C} onClick={() => onToggle(p)}/>)}</>}
    {unavailable.length>0&&<><SectionTitle C={C} color={C.red}>INDISPONÍVEIS ({unavailable.length})</SectionTitle>{unavailable.map(p=><LineupPlayerCard key={p.id} player={p} currentRound={currentRound} C={C}/>)}</>}
    <Box sx={{height:80}}/>
  </Box>;
}

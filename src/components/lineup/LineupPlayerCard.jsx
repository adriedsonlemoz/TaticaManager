import React from 'react';
import { Box, Typography } from '@mui/material';
import { JerseyBadge, ovrColor } from '../../helpers.js';
import { isPlayerInjured, isPlayerSuspended } from '../../engines/lineup/lineupService.js';

const batteryColor=(energy,C)=>energy<50?C.red:energy<75?C.yellow:C.green;

export default function LineupPlayerCard({ player:p, currentRound, C, onClick, modal=false, adapted=false, adaptedRole=null }) {
  const susp=isPlayerSuspended(p,currentRound), inj=isPlayerInjured(p), blocked=susp||inj, energy=p.energy??100, yellows=p.discipline?.yellowCards||0;
  const showAdapted=adapted||(p.adaptedPosition&&p.adaptedPosition!==p.position);
  return <Box onClick={() => !blocked && onClick?.(p)} sx={{ display:'flex', alignItems:'center', gap:1.2, bgcolor:blocked?`${C.red}05`:p.isStarting?`${C.green}05`:C.card, border:`1.5px solid ${blocked?C.red+'40':p.isStarting?C.borderG:adapted?'#f59e0b60':C.border}`, borderRadius:'12px', px:1.2, py:0.9, mb:0.7, cursor:blocked?'not-allowed':'pointer', opacity:blocked?0.65:1, '&:active':{transform:blocked?'none':'scale(0.98)'} }}>
    <JerseyBadge pos={p.position} num={p.shirt??'?'} size={40}/>
    <Box sx={{ flex:1, minWidth:0 }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.25 }}><Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:blocked?C.red:C.txt1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>{inj&&<Typography sx={{fontSize:'0.7rem'}}>🚑</Typography>}{susp&&<Typography sx={{fontSize:'0.7rem'}}>🟥</Typography>}{p.isStarting&&!blocked&&!modal&&<Box sx={{ bgcolor:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:'4px', px:0.5, py:0.1 }}><Typography sx={{ color:C.green, fontSize:'0.44rem', fontWeight:900 }}>{p.adaptedPosition&&p.adaptedPosition!==p.position?`ADAPTADO (${p.adaptedPosition})`:'TITULAR'}</Typography></Box>}</Box>
      <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}><Box sx={{ flex:1, height:4, bgcolor:C.border, borderRadius:2, overflow:'hidden', maxWidth:80 }}><Box sx={{ height:'100%', width:`${energy}%`, bgcolor:batteryColor(energy,C) }}/></Box><Typography sx={{ fontSize:'0.5rem', fontWeight:900, color:batteryColor(energy,C), minWidth:26 }}>{energy}%</Typography>{yellows>0&&!susp&&<Box sx={{display:'flex',gap:'2px'}}>{Array.from({length:Math.min(yellows,3)}).map((_,i)=><Box key={i} sx={{width:5,height:8,bgcolor:C.yellow,borderRadius:'1px'}}/>)}</Box>}</Box>
      {inj&&<Typography sx={{ color:C.red, fontSize:'0.48rem', fontWeight:700, mt:0.2 }}>🚑 Lesionado · {p.injury.roundsLeft} rod.</Typography>}
      {susp&&<Typography sx={{ color:C.red, fontSize:'0.48rem', fontWeight:700, mt:0.2 }}>🟥 Suspenso</Typography>}
      {showAdapted&&!inj&&!susp&&<Typography sx={{ color:'#f59e0b', fontSize:'0.44rem', fontWeight:900, mt:0.2 }}>⚠️ ADAPTADO ({p.position} → {adapted?adaptedRole:p.adaptedPosition}) · -10 OVR</Typography>}
    </Box>
    <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.4 }}><Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}><Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#fff' }}>{p.overall}</Typography></Box>{!blocked&&<Typography sx={{ fontSize:'0.5rem', fontWeight:900, color:modal?(adapted?'#f59e0b':C.green):p.isStarting?C.red:C.teal }}>{modal?(adapted?'⚠️ ADAPTAR':'✅ ESCALAR'):p.isStarting?'↓ BANCO':'↑ TITULAR'}</Typography>}</Box>
  </Box>;
}

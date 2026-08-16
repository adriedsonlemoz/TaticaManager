import React from 'react';
import { Box, Typography } from '@mui/material';
import JerseyBadge from '../player/JerseyBadge.jsx';
import { ovrColor } from '../../utils/playerVisuals.js';
import { THEME } from '../../theme.js';

const energyColor = (energy, C) => energy >= 75 ? C.green : energy >= 50 ? C.yellow : C.red;

function ContractBadge({ contract, C }) {
  if (contract.key === 'expired') return <Box sx={{ bgcolor:`${C.red}22`, border:`1.5px solid ${C.red}`, borderRadius:'5px', px:0.6, py:0.15, animation:'pulse 1.5s ease-in-out infinite', '@keyframes pulse':{ '0%,100%':{ boxShadow:`0 0 0 0 ${C.red}50` }, '50%':{ boxShadow:`0 0 0 3px ${C.red}00` } } }}><Typography sx={{ color:C.red, fontSize:'0.5rem', fontWeight:900, letterSpacing:0.3 }}>⚠️ {contract.label}</Typography></Box>;
  if (contract.key === 'last_year') return <Box sx={{ bgcolor:`${C.orange || '#f97316'}18`, border:`1.5px solid ${C.orange || '#f97316'}80`, borderRadius:'5px', px:0.6, py:0.15 }}><Typography sx={{ color:C.orange || '#f97316', fontSize:'0.5rem', fontWeight:900 }}>⏰ {contract.label}</Typography></Box>;
  if (contract.key === 'short') return <Box sx={{ bgcolor:`${C.yellow}12`, border:`1px solid ${C.yellow}50`, borderRadius:'4px', px:0.5, py:0.1 }}><Typography sx={{ color:C.yellow, fontSize:'0.47rem', fontWeight:700 }}>📋 {contract.label}</Typography></Box>;
  return <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'4px', px:0.5, py:0.1 }}><Typography sx={{ color:C.txt3, fontSize:'0.47rem', fontWeight:700 }}>📋 {contract.label}</Typography></Box>;
}

export default function SquadPlayerCard({ row, onOpenPlayer, formatMoney }) {
  const C = THEME;
  const p = row.player;
  const energy = row.status.energy;
  const isStarter = Boolean(p.isStarting);
  const color = energyColor(energy, C);

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpenPlayer(p)}
      aria-label={`Abrir perfil de ${p.name}`}
      sx={{ width:'100%', display:'flex', alignItems:'center', gap:1.2, bgcolor:isStarter ? 'rgba(34,197,94,0.06)' : C.card, border:`1.5px solid ${isStarter ? C.borderG : C.border}`, borderRadius:'12px', px:1.2, py:1, mb:0.8, cursor:'pointer', transition:'all 0.12s', textAlign:'left', '&:active':{ transform:'scale(0.98)', opacity:0.9 } }}
    >
      <JerseyBadge pos={p.position} num={p.shirt ?? '?'} size={44}/>
      <Box sx={{ flex:1, minWidth:0 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.25 }}>
          <Typography sx={{ color:isStarter ? C.txt1 : C.txt2, fontWeight:900, fontSize:'0.88rem', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
          {row.status.injured && <Typography sx={{ fontSize:'0.7rem', flexShrink:0 }}>🚑</Typography>}
          {row.status.suspended && <Typography sx={{ fontSize:'0.7rem', flexShrink:0 }}>🟥</Typography>}
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.7, mb:0.25 }}>
          <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700, flexShrink:0 }}>⚡</Typography>
          <Box sx={{ flex:1, height:5, bgcolor:C.bgDark || '#f1f5f9', borderRadius:3, overflow:'hidden' }}><Box sx={{ height:'100%', width:`${energy}%`, bgcolor:color, borderRadius:3, transition:'width 0.4s ease' }}/></Box>
          <Typography sx={{ color, fontWeight:900, fontSize:'0.55rem', minWidth:24, textAlign:'right' }}>{energy}%</Typography>
          {row.status.energyBand.ovrPenalty > 0 && <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.5rem' }}>-{row.status.energyBand.ovrPenalty}</Typography>}
        </Box>
        <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap', alignItems:'center' }}>
          <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'4px', px:0.5, py:0.1 }}><Typography sx={{ color:C.txt2, fontSize:'0.47rem', fontWeight:700 }}>🎂 {p.age}a</Typography></Box>
          <ContractBadge contract={row.contract} C={C}/>
          {(p.wage || 0) > 0 && <Box sx={{ bgcolor:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.2)', borderRadius:'4px', px:0.5, py:0.1 }}><Typography sx={{ color:'#f85149', fontSize:'0.47rem', fontWeight:700 }}>💰 {formatMoney(p.wage)}</Typography></Box>}
          {(p.releaseClause || 0) > 0 && <Box sx={{ bgcolor:`${C.red}08`, border:`1px solid ${C.red}25`, borderRadius:'4px', px:0.5, py:0.1 }}><Typography sx={{ color:C.red, fontSize:'0.47rem', fontWeight:700 }}>🔒 {formatMoney(p.releaseClause)}</Typography></Box>}
          {!row.status.suspended && row.yellows > 0 && <Box sx={{ display:'flex', gap:'2px' }}>{Array.from({ length:row.yellows }).map((_, index) => <Box key={index} sx={{ width:5, height:8, bgcolor:C.yellow, borderRadius:'1.5px' }}/>)}</Box>}
        </Box>
      </Box>
      <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.5, flexShrink:0 }}>
        <Box sx={{ width:36, height:36, borderRadius:'8px', background:`linear-gradient(135deg,${ovrColor(p.overall)},${ovrColor(p.overall)}aa)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 2px 6px ${ovrColor(p.overall)}50` }}><Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.88rem', lineHeight:1 }}>{p.overall}</Typography></Box>
        <Box sx={{ width:34, height:22, borderRadius:'6px', bgcolor:C.green, display:'flex', alignItems:'center', justifyContent:'center' }}><span className="material-icons" style={{ color:'#000', fontSize:'0.85rem' }}>person_search</span></Box>
      </Box>
    </Box>
  );
}

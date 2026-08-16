import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import JerseyBadge from '../player/JerseyBadge.jsx';
import MatchCard from './MatchCard.jsx';

const C = THEME || {};
const POS_ORDER = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'];

const MatchBench = ({ players = [], subsDone = [] }) => {
  const bench = players.filter(p => !p.isStarting)
    .sort((a,b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position));
  const subsLeft = 3 - subsDone.length;
  if (!bench.length) return null;

  return (
    <MatchCard accent={subsLeft > 0 ? C.yellow : C.border}>
      <Box sx={{ px:1.5, py:0.8, borderBottom:`1px solid ${C.border}`, bgcolor:C.cardAlt, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.7 }}>
          <Typography sx={{ fontSize:'0.95rem', lineHeight:1 }}>🪑</Typography>
          <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.6rem', letterSpacing:1.2 }}>BANCO DE RESERVAS</Typography>
        </Box>
        {subsLeft > 0 ? (
          <Box sx={{ bgcolor:`${C.yellow}20`, border:`1px solid ${C.yellow}50`, borderRadius:'6px', px:0.8, py:0.2 }}>
            <Typography sx={{ color:C.yellow, fontWeight:900, fontSize:'0.58rem' }}>🔄 {subsLeft} SUB{subsLeft > 1 ? 'S' : ''}</Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor:`${C.txt3}15`, border:`1px solid ${C.border}`, borderRadius:'6px', px:0.8, py:0.2 }}>
            <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.56rem' }}>SEM SUBS</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ px:1, py:0.9, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(68px,1fr))', gap:0.7 }}>
        {bench.map((p, i) => {
          const isInjured = !!p.injury;
          const energy = p.energy ?? 100;
          const eColor = energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;
          const ovrC = p.overall >= 80 ? C.green : p.overall >= 70 ? C.yellow : C.red;
          const goals = p.seasonGoals || p.goals || 0;
          return (
            <Box key={p.id||i} sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.4, bgcolor:isInjured?`${C.red}08`:C.cardAlt, border:`1px solid ${isInjured?C.red+'40':C.border}`, borderRadius:'10px', px:0.6, py:0.7, opacity:isInjured?0.55:1, transition:'all 0.12s' }}>
              {JerseyBadge ? React.createElement(JerseyBadge, { pos:p.position, num:p.shirt ?? '?', size:38, showPos:true }) : <Box sx={{width:38,height:38}} />}
              <Typography sx={{ color:C.txt1, fontSize:'0.56rem', fontWeight:900, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:62, textAlign:'center', lineHeight:1 }}>{p.name.split(' ').pop()}</Typography>
              <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                <Typography sx={{ color:ovrC, fontSize:'0.55rem', fontWeight:900 }}>{p.overall}</Typography>
                <Box sx={{ width:20, height:3, bgcolor:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}><Box sx={{ height:'100%', width:`${energy}%`, bgcolor:eColor, borderRadius:2 }}/></Box>
              </Box>
              {isInjured ? <Typography sx={{fontSize:'0.58rem',lineHeight:1}}>🚑</Typography> : goals > 0 ? <Typography sx={{color:C.green,fontSize:'0.5rem',fontWeight:900}}>⚽{goals}</Typography> : null}
            </Box>
          );
        })}
      </Box>

      {subsDone.length > 0 && (
        <Box sx={{ px:1.2, pb:0.8, display:'flex', flexWrap:'wrap', gap:0.5 }}>
          {subsDone.map((s, i) => (
            <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.4, bgcolor:'rgba(240,165,0,0.08)', border:`1px solid ${C.yellow}30`, borderRadius:'6px', px:0.7, py:0.3 }}>
              <Typography sx={{ color:C.yellow, fontSize:'0.52rem', fontWeight:900 }}>🔄 {s.out} → {s.in}</Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700 }}>{s.min}'</Typography>
            </Box>
          ))}
        </Box>
      )}
    </MatchCard>
  );
};

export default MatchBench;

import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import JerseyBadge from '../player/JerseyBadge.jsx';
import { THEME } from '../../theme.js';

const energyColor = (energy, C) => energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;

export function InjuryCard({ row, onTreat, treatmentLabel }) {
  const C = THEME;
  const p = row.player;
  const roundsLeft = Math.max(0, Number(p.injury?.roundsLeft) || 0);
  const progress = Math.max(10, Math.min(100, 100 - roundsLeft * 20));

  return (
    <Paper sx={{ mb:1, bgcolor:C.card, border:`1.5px solid ${C.red}40`, borderRadius:'10px', overflow:'hidden' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, px:1.5, py:1.1 }}>
        <JerseyBadge pos={p.position} num={p.shirt ?? '?'} size={44} showPos />
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontWeight:900, fontSize:'0.88rem', color:C.txt1, lineHeight:1.2 }}>{p.name}</Typography>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.6, mt:0.3, flexWrap:'wrap' }}>
            <Typography sx={{ fontSize:'0.6rem', fontWeight:900, color:C.red, bgcolor:`${C.red}15`, px:0.6, py:0.15, borderRadius:'4px', border:`1px solid ${C.red}30` }}>🚑 {p.injury?.type || 'Lesão'}</Typography>
            {p.injury?.recaida && <Typography sx={{ fontSize:'0.56rem', fontWeight:900, color:C.orange, bgcolor:`${C.orange}18`, px:0.6, py:0.15, borderRadius:'4px', border:`1px solid ${C.orange}40` }}>⚠️ RECAÍDA</Typography>}
            {(p.injury?.ovrPenalty || 0) > 0 && <Typography sx={{ fontSize:'0.56rem', fontWeight:900, color:C.txt3, bgcolor:C.bgDark, px:0.6, py:0.15, borderRadius:'4px' }}>-{p.injury.ovrPenalty} OVR no retorno</Typography>}
            <Typography sx={{ fontSize:'0.6rem', color:C.txt2, fontWeight:700 }}>{roundsLeft} rod. restante{roundsLeft === 1 ? '' : 's'}</Typography>
          </Box>
        </Box>
        <Button onClick={() => onTreat(p)} size="small" aria-label={`Tratar lesão de ${p.name}`} sx={{ flexShrink:0, bgcolor:C.primary, color:'#fff', fontWeight:900, fontSize:'0.62rem', px:1.2, py:0.5, borderRadius:'8px', border:`1.5px solid ${C.prim2}`, '&:hover':{ bgcolor:C.prim2 } }}>
          Tratar<br/><span style={{ fontSize:'0.55rem', opacity:0.85 }}>{treatmentLabel}</span>
        </Button>
      </Box>
      <Box sx={{ px:1.5, pb:1 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.3 }}>
          <Typography sx={{ fontSize:'0.5rem', fontWeight:700, color:C.txt3 }}>RECUPERAÇÃO</Typography>
          <Typography sx={{ fontSize:'0.5rem', fontWeight:900, color:C.red }}>{roundsLeft} rodada{roundsLeft === 1 ? '' : 's'} até retorno</Typography>
        </Box>
        <Box sx={{ height:5, bgcolor:'rgba(148,24,24,0.12)', borderRadius:3, overflow:'hidden' }}>
          <Box sx={{ height:'100%', borderRadius:3, bgcolor:roundsLeft <= 1 ? C.green : roundsLeft <= 3 ? C.yellow : C.red, width:`${progress}%`, transition:'width 0.3s' }} />
        </Box>
      </Box>
    </Paper>
  );
}

export function SuspensionCard({ row }) {
  const C = THEME;
  const p = row.player;
  const left = row.status.suspensionRounds;
  return (
    <Paper sx={{ mb:1, bgcolor:C.card, border:`1.5px solid ${C.yellow}60`, borderRadius:'10px', overflow:'hidden' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, px:1.5, py:1 }}>
        <JerseyBadge pos={p.position} num={p.shirt ?? '?'} size={42} showPos />
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontWeight:900, fontSize:'0.88rem', color:C.txt1, lineHeight:1.2 }}>{p.name}</Typography>
          <Typography sx={{ fontSize:'0.62rem', color:C.yellow, fontWeight:700 }}>🟥 Suspenso — {left} rodada{left === 1 ? '' : 's'} restante{left === 1 ? '' : 's'}</Typography>
        </Box>
        <Typography sx={{ fontSize:'1.4rem' }}>🚫</Typography>
      </Box>
    </Paper>
  );
}

export function FatigueCard({ row, onRecover, recoveryLabel }) {
  const C = THEME;
  const p = row.player;
  const energy = row.status.energy;
  const color = energyColor(energy, C);
  return (
    <Paper sx={{ mb:0.8, bgcolor:C.card, border:`1.5px solid ${color}40`, borderRadius:'10px', overflow:'hidden' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, px:1.5, py:0.9 }}>
        <JerseyBadge pos={p.position} num={p.shirt ?? '?'} size={42} showPos />
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1, lineHeight:1.2 }}>{p.name}</Typography>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mt:0.3 }}>
            <Box sx={{ flex:1, height:5, bgcolor:'rgba(54,36,20,0.1)', borderRadius:3, overflow:'hidden' }}>
              <Box sx={{ height:'100%', width:`${energy}%`, bgcolor:color, borderRadius:3 }} />
            </Box>
            <Typography sx={{ fontSize:'0.62rem', fontWeight:900, color, minWidth:28 }}>{energy}%</Typography>
            {row.status.energyBand.ovrPenalty > 0 && <Typography sx={{ fontSize:'0.55rem', fontWeight:900, color:C.red }}>-{row.status.energyBand.ovrPenalty} OVR</Typography>}
          </Box>
        </Box>
        <Button onClick={() => onRecover(p)} size="small" aria-label={`Recuperar energia de ${p.name}`} sx={{ flexShrink:0, bgcolor:C.yellow, color:'#fff', fontWeight:900, fontSize:'0.6rem', px:1, py:0.5, borderRadius:'8px', border:`1.5px solid ${C.yellow}`, '&:hover':{ bgcolor:'#9e6a00' } }}>
          Recuperar<br/><span style={{ fontSize:'0.52rem', opacity:0.9 }}>{recoveryLabel}</span>
        </Button>
      </Box>
    </Paper>
  );
}

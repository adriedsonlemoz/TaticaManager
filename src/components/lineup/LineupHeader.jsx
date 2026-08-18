import React from 'react';
import { Box, Typography } from '@mui/material';
import { ovrColor } from '../../utils/playerVisuals.js';
import { FORMATION_DESCRIPTIONS } from '../../engines/lineup/lineupService.js';

export default function LineupHeader({ club, currentRound, avgOvr, startersCount, energyPenaltyTotal, formation, isDirty, onFormation, onAuto, onSave, C }) {
  const info = FORMATION_DESCRIPTIONS[formation] || {};
  return (
    <Box sx={{ background:'linear-gradient(180deg,#fff 0%,#f4f7f6 100%)', borderBottom:`1px solid ${C.border}`, px:1.5, pt:4.2, pb:1.4 }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.4 }}>
        <Box>
          <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2, mb:0.3 }}>ESCALAÇÃO</Typography>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.1rem', lineHeight:1 }}>{club.name || 'Meu Time'}</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.2 }}>{formation} · Rod. {currentRound}</Typography>
        </Box>
        <Box sx={{ textAlign:'center' }}>
          <Box sx={{ background:`linear-gradient(135deg,${ovrColor(avgOvr)},${ovrColor(avgOvr)}bb)`, borderRadius:'14px', px:1.6, py:0.8, mb:0.35, boxShadow:`0 0 20px ${ovrColor(avgOvr)}40` }}>
            <Typography sx={{ fontWeight:900, fontSize:'1.6rem', color:'#fff', lineHeight:1 }}>{avgOvr || '—'}</Typography>
            <Typography sx={{ fontSize:'0.42rem', color:'rgba(255,255,255,0.7)', fontWeight:900, letterSpacing:1 }}>OVR REAL</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:0.4, justifyContent:'center' }}>
            <Box sx={{ bgcolor:startersCount===11?`${C.green}15`:`${C.red}15`, border:`1px solid ${startersCount===11?C.green+'50':C.red+'50'}`, borderRadius:'6px', px:0.7, py:0.15 }}>
              <Typography sx={{ color:startersCount===11?C.green:C.red, fontWeight:900, fontSize:'0.5rem' }}>{startersCount}/11 {startersCount===11?'✅':'⚠️'}</Typography>
            </Box>
            {energyPenaltyTotal > 0 && <Box sx={{ bgcolor:`${C.red}10`, border:`1px solid ${C.red}35`, borderRadius:'6px', px:0.7, py:0.15 }}><Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.5rem' }}>⚡-{energyPenaltyTotal}</Typography></Box>}
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb:1.2 }}>
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5, mb:0.6 }}>FORMAÇÃO</Typography>
        <Box sx={{ display:'flex', gap:0.6, overflowX:'auto', '&::-webkit-scrollbar':{display:'none'} }}>
          {Object.entries(FORMATION_DESCRIPTIONS).map(([f, meta]) => {
            const active = formation === f;
            return <Box key={f} onClick={() => onFormation(f)} sx={{ flexShrink:0, px:1.1, py:0.65, borderRadius:'9px', cursor:'pointer', bgcolor:active?C.primary:'#f1f5f9', border:`1.5px solid ${active?C.primary:C.border}`, boxShadow:active?`0 0 14px ${C.primary}40`:'none', transition:'all 0.12s', '&:active':{filter:'brightness(0.88)'} }}>
              <Typography sx={{ color:active?'#fff':C.txt3, fontWeight:900, fontSize:'0.75rem', lineHeight:1 }}>{meta.icon} {f}</Typography>
            </Box>;
          })}
        </Box>
        {info.desc && <Box sx={{ display:'flex', gap:0.8, mt:0.7, alignItems:'center' }}>
          <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>{info.desc}</Typography>
          {info.atk !== 0 && <Box sx={{ bgcolor:info.atk>0?`${C.red}15`:`${C.blue}15`, border:`1px solid ${info.atk>0?C.red:C.blue}40`, borderRadius:'5px', px:0.6, py:0.1 }}><Typography sx={{ color:info.atk>0?C.red:C.blue, fontWeight:900, fontSize:'0.5rem' }}>ATQ {info.atk>0?'+':''}{info.atk}</Typography></Box>}
          {info.def !== 0 && <Box sx={{ bgcolor:info.def>0?`${C.blue}15`:`${C.red}15`, border:`1px solid ${info.def>0?C.blue:C.red}40`, borderRadius:'5px', px:0.6, py:0.1 }}><Typography sx={{ color:info.def>0?C.blue:C.red, fontWeight:900, fontSize:'0.5rem' }}>DEF {info.def>0?'+':''}{info.def}</Typography></Box>}
        </Box>}
      </Box>

      <Box sx={{ display:'flex', gap:0.8 }}>
        <Box onClick={onAuto} sx={{ flex:1, borderRadius:'10px', py:1, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', gap:0.7, cursor:'pointer', boxShadow:'0 0 16px rgba(99,102,241,0.35)', '&:active':{filter:'brightness(0.85)'} }}>
          <Typography sx={{ fontSize:'0.95rem', lineHeight:1 }}>🤖</Typography><Box><Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.72rem', lineHeight:1 }}>AUTO-ESCALAR</Typography><Typography sx={{ color:'rgba(255,255,255,0.6)', fontSize:'0.44rem', fontWeight:700 }}>melhor time disponível</Typography></Box>
        </Box>
        <Box onClick={onSave} sx={{ flex:1, borderRadius:'10px', py:1, bgcolor:isDirty?C.gold:C.cardAlt, border:`1.5px solid ${isDirty?C.gold:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', gap:0.6, cursor:'pointer', boxShadow:isDirty?`0 0 14px ${C.gold}40`:'none', '&:active':{filter:'brightness(0.88)'} }}>
          <Typography sx={{ fontSize:'0.9rem', lineHeight:1 }}>{isDirty?'⚠️':'💾'}</Typography><Typography sx={{ color:isDirty?'#fff':C.txt2, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{isDirty?'SALVAR':'SALVO'}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

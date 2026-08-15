import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const C = THEME || {};

export const GoalCelebration = ({ celebration, onClose }) => {
  if (!celebration) return null;
  const { scorer, team, minute, isUser, score } = celebration;
  const accentColor = isUser ? '#22c55e' : '#ef4444';
  const emoji = isUser ? '⚽' : '😤';
  const title = isUser ? 'GOOOOOL!' : 'GOL DO ADVERSÁRIO';
  return (
    <Box onClick={onClose} sx={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', zIndex:200, width:'calc(100% - 32px)', maxWidth:360, '@keyframes goalCardIn':{'0%':{transform:'translateX(-50%) translateY(40px)',opacity:0},'60%':{transform:'translateX(-50%) translateY(-6px)'},'100%':{transform:'translateX(-50%) translateY(0)',opacity:1}}, animation:'goalCardIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}>
      <Box sx={{ bgcolor:C.card, border:`2.5px solid ${accentColor}`, borderRadius:'18px', overflow:'hidden', boxShadow:`0 8px 32px ${accentColor}50, 0 2px 8px rgba(0,0,0,0.3)` }}>
        <Box sx={{ bgcolor:accentColor, px:2, py:0.9, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box sx={{display:'flex',alignItems:'center',gap:0.8}}><Typography sx={{fontSize:'1.4rem',lineHeight:1}}>{emoji}</Typography><Typography sx={{color:'#000',fontWeight:900,fontSize:'1rem',letterSpacing:2}}>{title}</Typography></Box>
          <Typography sx={{color:'rgba(0,0,0,0.55)',fontWeight:700,fontSize:'0.6rem'}}>{minute}'</Typography>
        </Box>
        <Box sx={{ px:2, py:1.2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box>{scorer && <Typography sx={{color:C.txt1,fontWeight:900,fontSize:'1.05rem',lineHeight:1,mb:0.2}}>{scorer}</Typography>}<Typography sx={{color:C.txt3,fontWeight:700,fontSize:'0.68rem'}}>{team}</Typography></Box>
          <Box sx={{bgcolor:accentColor+'18',border:`1.5px solid ${accentColor}40`,borderRadius:'12px',px:1.8,py:0.6,textAlign:'center'}}><Typography sx={{color:accentColor,fontWeight:900,fontSize:'1.6rem',fontFamily:'monospace',letterSpacing:2,lineHeight:1}}>{score}</Typography></Box>
        </Box>
        <Box sx={{textAlign:'center',py:0.4,bgcolor:C.cardAlt}}><Typography sx={{color:C.txt3,fontSize:'0.5rem',fontWeight:700}}>toque para fechar</Typography></Box>
      </Box>
    </Box>
  );
};

export const SoundToggle = ({ enabled, onToggle }) => (
  <Box onClick={onToggle} sx={{ position:'fixed', top:12, right:12, zIndex:100, width:36, height:36, borderRadius:'50%', bgcolor:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', '&:active':{filter:'brightness(0.75)'} }}>
    <Typography sx={{fontSize:'1rem',lineHeight:1}}>{enabled ? '🔊' : '🔇'}</Typography>
  </Box>
);

export const PausedOverlay = ({ secondHalf = false }) => (
  <Box sx={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', bgcolor:'rgba(0,0,0,0.82)', border:`2px solid ${C.yellow}`, borderRadius:'14px', px:2.5, py:1.5, zIndex:60, textAlign:'center', pointerEvents:'none' }}>
    <Typography sx={{fontSize:'1.8rem',lineHeight:1,mb:0.4}}>⏸</Typography>
    <Typography sx={{color:C.yellow,fontWeight:900,fontSize:'0.85rem',letterSpacing:1}}>JOGO PAUSADO</Typography>
    {secondHalf && <Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:700,mt:0.3}}>Pressione ▶ para retomar</Typography>}
  </Box>
);

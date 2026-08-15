import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerHero = ({ gameData, viewModel, theme }) => {
  const C = theme;
  const { profile, manager, initials, myPos, managerLevel, styleIcon } = viewModel;
  const { label:level, color:levelColor, experience:exp, progressPct } = managerLevel;
  return (
    <Box sx={{
      background:'linear-gradient(160deg, #0f172a 0%, #1e3a5f 55%, #0f2040 100%)',
      px:1.8, pt:4.8, pb:2.4, borderBottom:'1px solid rgba(255,255,255,0.08)',
      position:'relative', overflow:'hidden',
    }}>
      <Box sx={{ position:'absolute', top:-60, right:-40, width:180, height:180, borderRadius:'50%', bgcolor:'rgba(34,197,94,0.07)', filter:'blur(40px)', pointerEvents:'none' }}/>
      <Box sx={{ display:'flex', alignItems:'flex-start', gap:1.6 }}>
        <Box sx={{ width:72, height:72, borderRadius:'18px', flexShrink:0, background:'linear-gradient(135deg,#1e3a5f,#0f2040)', border:`2.5px solid ${levelColor}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 24px ${levelColor}50` }}>
          <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1.8rem', lineHeight:1 }}>{initials || '👔'}</Typography>
        </Box>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ color:'#f0f6fc', fontWeight:900, fontSize:'1.15rem', fontFamily:'"Nunito",sans-serif', lineHeight:1, mb:0.3 }}>{manager}</Typography>
          <Typography sx={{ color:'rgba(255,255,255,0.55)', fontSize:'0.62rem', fontWeight:700, mb:0.8 }}>
            Treinador do {gameData.club?.name} · Série {gameData.serie}
          </Typography>
          <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap' }}>
            <Box sx={{ bgcolor:`${levelColor}20`, border:`1px solid ${levelColor}50`, borderRadius:'6px', px:0.8, py:0.2 }}>
              <Typography sx={{ color:levelColor, fontWeight:900, fontSize:'0.58rem' }}>⭐ {level}</Typography>
            </Box>
            {profile.nationality && <Box sx={{ bgcolor:'rgba(56,139,253,0.12)', border:'1px solid rgba(56,139,253,0.3)', borderRadius:'6px', px:0.8, py:0.2 }}>
              <Typography sx={{ color:'#60a5fa', fontWeight:900, fontSize:'0.58rem' }}>🌍 {profile.nationality}</Typography>
            </Box>}
            {profile.style && <Box sx={{ bgcolor:'rgba(240,165,0,0.12)', border:'1px solid rgba(240,165,0,0.3)', borderRadius:'6px', px:0.8, py:0.2 }}>
              <Typography sx={{ color:C.gold, fontWeight:900, fontSize:'0.58rem' }}>{styleIcon} {profile.style}</Typography>
            </Box>}
          </Box>
        </Box>
        <Box sx={{ textAlign:'center', flexShrink:0 }}>
          <Box sx={{ bgcolor:'rgba(255,255,255,0.06)', borderRadius:'12px', px:1.2, py:0.8, border:'1px solid rgba(255,255,255,0.1)' }}>
            <Typography sx={{ color:myPos > 0 && myPos<=4?C.green:myPos>=17?C.red:'#f0f6fc', fontWeight:900, fontSize:'1.6rem', lineHeight:1 }}>
              {myPos > 0 ? `${myPos}º` : '—'}
            </Typography>
            <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:'0.42rem', fontWeight:900, letterSpacing:0.8 }}>POSIÇÃO</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt:1.6 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
          <Typography sx={{ color:'rgba(255,255,255,0.5)', fontSize:'0.5rem', fontWeight:900, letterSpacing:1 }}>EXPERIÊNCIA</Typography>
          <Typography sx={{ color:levelColor, fontSize:'0.5rem', fontWeight:900 }}>{exp} XP</Typography>
        </Box>
        <Box sx={{ height:5, bgcolor:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
          <Box sx={{ height:'100%', borderRadius:3, width:`${progressPct}%`, background:`linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`, transition:'width 0.6s ease', boxShadow:`0 0 8px ${levelColor}60` }}/>
        </Box>
      </Box>
    </Box>
  );
};
export default CareerHero;

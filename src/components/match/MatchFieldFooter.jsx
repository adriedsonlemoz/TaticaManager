import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const C = THEME || {};
const short = (value, length = 14) => String(value || '').substring(0, length);

const MatchFieldFooter = ({ homeName, awayName, homeFormation, awayFormation, isUserHome, possession = { home:50, away:50 } }) => (
  <>
    <Box sx={{ px:1.2, py:0.55, bgcolor:'rgba(0,0,0,0.35)', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
        <Typography sx={{ color:isUserHome?C.green:C.txt3, fontWeight:900, fontSize:'0.5rem', maxWidth:60, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{short(homeName, 12)}</Typography>
        <Box sx={{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:'4px', px:0.6, py:0.15 }}><Typography sx={{ color:'rgba(255,255,255,0.85)', fontWeight:900, fontSize:'0.5rem', letterSpacing:0.3 }}>{homeFormation}</Typography></Box>
      </Box>
      <Typography sx={{ color:'rgba(255,255,255,0.25)', fontSize:'0.42rem', fontWeight:700 }}>FORMAÇÕES</Typography>
      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
        <Box sx={{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:'4px', px:0.6, py:0.15 }}><Typography sx={{ color:'rgba(255,255,255,0.85)', fontWeight:900, fontSize:'0.5rem', letterSpacing:0.3 }}>{awayFormation}</Typography></Box>
        <Typography sx={{ color:!isUserHome?C.green:C.txt3, fontWeight:900, fontSize:'0.5rem', maxWidth:60, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{short(awayName, 12)}</Typography>
      </Box>
    </Box>
    <Box sx={{ px:1.5, py:0.6, bgcolor:C.possessionBg, display:'flex', flexDirection:'column', gap:0.3 }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.6rem' }}>{short(homeName)} {possession.home}%</Typography>
        <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.5rem', letterSpacing:1 }}>POSSE</Typography>
        <Typography sx={{ color:C.blue, fontWeight:900, fontSize:'0.6rem' }}>{possession.away}% {short(awayName)}</Typography>
      </Box>
      <Box sx={{ height:4, bgcolor:C.cardAlt, borderRadius:2, overflow:'hidden' }}>
        <Box sx={{ height:'100%', width:`${possession.home}%`, bgcolor:C.green, transition:'width 0.9s ease', borderRadius:2 }}/>
      </Box>
    </Box>
  </>
);

export default MatchFieldFooter;

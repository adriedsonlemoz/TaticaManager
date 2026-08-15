import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { THEME } from '../../theme.js';
import MatchCard from './MatchCard.jsx';

const C = THEME || {};

const MatchNarration = ({ step, isLive, visibleEvents = [], matchFeedRef }) => (
  <MatchCard>
    <Box sx={{ px:1.5, py:0.7, borderBottom:`1px solid ${C.border}`, bgcolor:C.cardAlt, display:'flex', alignItems:'center', gap:0.8 }}>
      <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.58rem', letterSpacing:1.5 }}>⚽ NARRAÇÃO {step===2?'· 2º TEMPO':'· 1º TEMPO'}</Typography>
      <Box sx={{flex:1}}>{isLive && <LinearProgress sx={{height:2,borderRadius:1,bgcolor:C.border,'& .MuiLinearProgress-bar':{bgcolor:C.green}}}/>}</Box>
    </Box>
    <Box ref={matchFeedRef} sx={{ maxHeight:200, overflowY:'auto', p:0.8, display:'flex', flexDirection:'column', gap:0.4 }}>
      {visibleEvents.length === 0 ? (
        <Box sx={{textAlign:'center',py:3}}><Typography sx={{fontSize:'1.8rem',mb:0.5}}>🏟️</Typography><Typography sx={{color:C.txt3,fontSize:'0.72rem',fontStyle:'italic'}}>Aguardando lances...</Typography></Box>
      ) : [...visibleEvents].reverse().map((evt,i) => {
        const isGoal=evt.includes('GOL')||evt.includes('⚽'); const isRed=evt.includes('🟥'); const isYellow=evt.includes('🟨'); const isFim=evt.includes('FIM DE JOGO');
        const min=evt.match(/^(\d+)'/)?.[1]; const text=evt.replace(/^\d+' /,'').replace(/^90'\+ /,'');
        const color=isGoal?C.green:isRed?C.red:isYellow?C.yellow:isFim?C.blue:C.txt2;
        const bg=isGoal?'rgba(34,197,94,0.09)':isRed?'rgba(248,81,73,0.08)':isYellow?'rgba(240,165,0,0.07)':isFim?'rgba(56,139,253,0.08)':'transparent';
        return <Box key={`evt-${i}-${min||'x'}`} sx={{display:'flex',gap:0.7,alignItems:'flex-start',bgcolor:bg,borderRadius:'6px',px:0.8,py:0.45}}><Typography sx={{color:C.txt3,fontWeight:900,fontSize:'0.54rem',minWidth:26,pt:0.15,fontFamily:'monospace',flexShrink:0}}>{min?`${min}'`:''}</Typography><Typography sx={{flex:1,color,lineHeight:1.45,fontSize:isGoal||isRed||isFim?'0.78rem':'0.7rem',fontWeight:isGoal||isRed||isFim?900:700}}>{text}</Typography></Box>;
      })}
    </Box>
  </MatchCard>
);

export default MatchNarration;

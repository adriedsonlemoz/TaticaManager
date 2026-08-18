import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TeamIcon } from '../../data/database_branding.js';
import { getMatchCompetitionLabel } from '../../engines/match/matchPresentationViewModel.js';

const C = THEME || {};

const MatchHeader = ({ gameData, matchResultData, liveScore, minute, step, simulating, resultColor }) => {
  const { homeName, awayName } = matchResultData;
  const minDisplay = String(Math.floor(Math.min(minute, step <= 1 ? 45 : 90))).padStart(2, '0');
  const isLive = simulating && (step === 0 || step === 2);

  return (
    <Box sx={{ background:'linear-gradient(180deg,#ffffff 0%,#f4f7f6 100%)', borderBottom:`1px solid ${C.border}`, px:1.5, pt:3.2, pb:1, position:'sticky', top:0, zIndex:10 }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.8, mb:0.8 }}>
        {isLive && (
          <Box sx={{ display:'flex', alignItems:'center', gap:0.4, bgcolor:'#ef444418', border:`1px solid #ef444440`, borderRadius:20, px:0.9, py:0.2 }}>
            <Box sx={{ width:5, height:5, borderRadius:'50%', bgcolor:C.red, '@keyframes blink':{'0%,100%':{opacity:1},'50%':{opacity:0.1}}, animation:'blink 1s infinite' }} />
            <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.5rem', letterSpacing:2 }}>AO VIVO</Typography>
          </Box>
        )}
        <Box sx={{ bgcolor:'rgba(44,24,0,0.05)', border:`1px solid ${C.border}`, borderRadius:20, px:1, py:0.2 }}>
          <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.58rem', fontFamily:'monospace' }}>
            {isLive
              ? `⏱ ${minDisplay}'`
              : step === -1
                ? '🏟️ PRÉ-JOGO'
                : step === 1
                  ? `⏸ INTERVALO · 45'`
                  : step >= 5
                    ? `✅ ENCERRADO · 90'`
                    : `⏱ ${minDisplay}'`}
          </Typography>
        </Box>
        <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700 }}>
          {getMatchCompetitionLabel(gameData, matchResultData)}
        </Typography>
      </Box>
      <Box sx={{ display:'flex', alignItems:'center' }}>
        {[homeName, awayName].map((teamName, index) => (
          <React.Fragment key={teamName}>
            {index === 1 && (
              <Box sx={{ bgcolor:'#ffffff', border:`1.5px solid ${isLive ? C.border : resultColor+'60'}`, borderRadius:'10px', px:1.4, py:0.6, display:'flex', alignItems:'center', gap:0.3, flexShrink:0, boxShadow:isLive?'none':`0 0 12px ${resultColor}30` }}>
                <Typography sx={{ fontWeight:900, fontSize:'1.55rem', lineHeight:1, color:isLive?C.txt1:resultColor, fontFamily:'monospace', minWidth:22, textAlign:'center' }}>{liveScore.home}</Typography>
                <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'1rem', px:0.1 }}>–</Typography>
                <Typography sx={{ fontWeight:900, fontSize:'1.55rem', lineHeight:1, color:isLive?C.txt1:resultColor, fontFamily:'monospace', minWidth:22, textAlign:'center' }}>{liveScore.away}</Typography>
              </Box>
            )}
            <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.3 }}>
              <Box sx={{ width:36, height:36, borderRadius:'9px', bgcolor:'rgba(44,24,0,0.04)', border:`1.5px solid ${teamName===gameData?.club?.name?C.green:C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {TeamIcon ? React.createElement(TeamIcon, { name:teamName, size:26 }) : <Typography sx={{fontSize:'1rem'}}>⚽</Typography>}
              </Box>
              <Typography sx={{ color:teamName===gameData?.club?.name?C.green:C.txt2, fontWeight:900, fontSize:'0.6rem', textAlign:'center', lineHeight:1.1, maxWidth:68, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{teamName}</Typography>
            </Box>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default MatchHeader;

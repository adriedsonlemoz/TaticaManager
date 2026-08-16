import React from 'react';
import { Box, Typography } from '@mui/material';
import JerseyBadge from '../player/JerseyBadge.jsx';

const energyColor = (energy, C) => energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;

export default function FieldPlayerMarker({ marker, viewWidth = 100, viewHeight = 140, onPlayerClick, C }) {
  const { x, y, player, status, displayName, index, improvised } = marker;
  const hasProblem = status.injured || status.suspended || improvised;
  const problemColor = status.injured ? C.red : status.suspended ? C.yellow : '#f59e0b';
  const problemIcon = status.injured ? '🚑' : status.suspended ? '🟥' : '!';

  return (
    <Box
      component="button"
      type="button"
      aria-label={`${player.name || 'Jogador'}${status.injured ? ', lesionado' : ''}${status.suspended ? ', suspenso' : ''}${improvised ? ', improvisado' : ''}`}
      onClick={() => onPlayerClick?.(player)}
      sx={{
        position:'absolute', left:`${(x / viewWidth) * 100}%`, top:`${(y / viewHeight) * 100}%`,
        transform:'translate(-50%, -50%)', display:'flex', flexDirection:'column', alignItems:'center',
        cursor:onPlayerClick ? 'pointer' : 'default', gap:'1px', p:0, m:0, border:0, bgcolor:'transparent',
        '&:active': onPlayerClick ? { transform:'translate(-50%, -50%) scale(0.92)' } : undefined,
      }}
    >
      <Box sx={{ position:'relative' }}>
        <JerseyBadge pos={player.position} num={player.shirt ?? (index + 1)} size={28} />
        {hasProblem && (
          <Box sx={{ position:'absolute', top:-3, right:-4, minWidth:12, height:12, px:improvised && !status.injured && !status.suspended ? 0.2 : 0, borderRadius:'6px', bgcolor:problemColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.35rem', border:'1px solid rgba(255,255,255,0.6)', boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }}>
            {problemIcon}
          </Box>
        )}
        <Box sx={{ position:'absolute', bottom:-2, left:'5%', width:'90%', height:'2.5px', bgcolor:'rgba(0,0,0,0.4)', borderRadius:1, overflow:'hidden' }}>
          <Box sx={{ height:'100%', width:`${status.energy}%`, bgcolor:energyColor(status.energy, C), borderRadius:1 }} />
        </Box>
      </Box>
      <Box sx={{ bgcolor:'rgba(0,0,0,0.62)', borderRadius:'3px', px:'3px', py:'1.5px', backdropFilter:'blur(3px)' }}>
        <Typography component="span" sx={{ color:'#fff', fontSize:'0.35rem', fontWeight:900, lineHeight:1, whiteSpace:'nowrap', letterSpacing:0.2 }}>{displayName}</Typography>
      </Box>
    </Box>
  );
}

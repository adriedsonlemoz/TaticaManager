import React from 'react';
import { Box, Typography } from '@mui/material';
import JerseyBadge from '../player/JerseyBadge.jsx';
import { FieldPitchHorizontal } from '../field/FieldPitch.jsx';
import { LINEUP_VIEWBOX, isPlayerInjured, isPlayerSuspended } from '../../engines/lineup/lineupService.js';

const batteryColor = (energy, C) => energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;

export default function LineupField({ slotPlayers, currentRound, onEmptySlot, onPlayer, onPressStart, onPressEnd, C }) {
  const { width:VW, height:VH } = LINEUP_VIEWBOX;
  return <Box sx={{ px:1.5, pt:1.4 }}><Box sx={{ position:'relative', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.18)' }}>
    <FieldPitchHorizontal VW={VW} VH={VH}/>
    <Box sx={{ position:'absolute', inset:0 }}>
      {slotPlayers.map(({ slot, player, improvised }, i) => {
        if (!player) return <Box key={`e${i}`} onClick={() => onEmptySlot({ role:slot.role })} sx={{ position:'absolute', left:`${slot.x/VW*100}%`, top:`${slot.y/VH*100}%`, transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', cursor:'pointer' }}>
          <Box sx={{ width:22, height:22, borderRadius:'5px', border:'1.5px dashed rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}><Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem' }}>+</Typography></Box>
          <Box sx={{ bgcolor:'rgba(0,0,0,0.5)', borderRadius:'3px', px:'3px', py:'1px' }}><Typography sx={{ color:'rgba(255,255,255,0.5)', fontSize:'0.42rem', fontWeight:900 }}>{slot.role}</Typography></Box>
        </Box>;
        const energy=player.energy??100; const injured=isPlayerInjured(player); const suspended=isPlayerSuspended(player,currentRound);
        return <Box key={player.id} onClick={() => onPlayer(player)} onMouseDown={() => onPressStart(player)} onMouseUp={onPressEnd} onMouseLeave={onPressEnd} onTouchStart={() => onPressStart(player)} onTouchEnd={onPressEnd} sx={{ position:'absolute', left:`${slot.x/VW*100}%`, top:`${slot.y/VH*100}%`, transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'1px', cursor:'pointer', zIndex:1, '&:active':{transform:'translate(-50%,-50%) scale(0.9)'} }}>
          <Box sx={{ position:'relative' }}>
            <JerseyBadge pos={player.position} num={player.shirt??'?'} size={22}/>
            <Box sx={{ position:'absolute', bottom:-2, left:'5%', width:'90%', height:'2.5px', bgcolor:'rgba(0,0,0,0.4)', borderRadius:1, overflow:'hidden' }}><Box sx={{ height:'100%', width:`${energy}%`, bgcolor:batteryColor(energy,C), borderRadius:1 }}/></Box>
            {(injured||suspended||improvised) && <Box sx={{ position:'absolute', top:-4, right:-5, minWidth:10, height:10, px:improvised?0.2:0, borderRadius:'5px', bgcolor:injured?C.red:suspended?C.yellow:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.5)', fontSize:'0.3rem' }}>{injured?'🚑':suspended?'🟥':'!'}</Box>}
          </Box>
          <Box sx={{ bgcolor:'rgba(0,0,0,0.65)', borderRadius:'3px', px:'3px', py:'1.5px' }}><Typography sx={{ color:'#fff', fontSize:'0.38rem', fontWeight:900, whiteSpace:'nowrap', lineHeight:1 }}>{player.name.split(' ').pop().slice(0,7)}</Typography></Box>
        </Box>;
      })}
    </Box>
  </Box></Box>;
}

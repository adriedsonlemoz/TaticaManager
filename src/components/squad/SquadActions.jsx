import React from 'react';
import { Box, Button } from '@mui/material';
import { THEME } from '../../theme.js';

export default function SquadActions({ onTrain, onLineup, onMarket }) {
  const C = THEME;
  const base = { flex:1, py:1.4, borderRadius:0, color:'#fff', fontWeight:900, fontSize:'0.72rem', display:'flex', gap:0.5 };
  return (
    <Box sx={{ position:'fixed', bottom:62, left:0, right:0, display:'flex', gap:0, zIndex:50, borderTop:`1px solid ${C.border}` }}>
      <Button onClick={onTrain} sx={{ ...base, bgcolor:C.blue, '&:hover':{ bgcolor:'#1d4ed8' } }}><span className="material-icons" style={{ fontSize:'1rem' }}>fitness_center</span>Treinar Jogadores</Button>
      <Button onClick={onLineup} sx={{ ...base, bgcolor:C.green, borderLeft:'1px solid rgba(0,0,0,0.2)', '&:hover':{ bgcolor:'#16a34a' } }}><span className="material-icons" style={{ fontSize:'1rem' }}>assignment</span>Escalação</Button>
      <Button onClick={onMarket} sx={{ ...base, bgcolor:C.red, borderLeft:'1px solid rgba(0,0,0,0.2)', '&:hover':{ bgcolor:'#dc2626' } }}><span className="material-icons" style={{ fontSize:'1rem' }}>swap_horiz</span>Transferências</Button>
    </Box>
  );
}

import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

export default function SquadSortBar({ options, sortBy, onSortChange }) {
  const C = THEME;
  return (
    <Box sx={{ px:1.5, py:0.8, display:'flex', alignItems:'center', gap:0.7, overflowX:'auto', '&::-webkit-scrollbar':{ display:'none' }, bgcolor:C.cardAlt, borderBottom:`1px solid ${C.border}` }}>
      <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700, flexShrink:0 }}>Ordenar:</Typography>
      {options.map((option) => {
        const active = sortBy === option.id;
        return (
          <Box
            key={option.id}
            component="button"
            type="button"
            aria-pressed={active}
            onClick={() => onSortChange(option.id)}
            sx={{ flexShrink:0, px:1.2, py:0.4, borderRadius:'20px', cursor:'pointer', bgcolor:active ? C.green : 'transparent', border:`1px solid ${active ? C.green : C.border}`, transition:'all 0.12s' }}
          >
            <Typography component="span" sx={{ color:active ? '#000' : C.txt3, fontWeight:900, fontSize:'0.62rem' }}>{option.label}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

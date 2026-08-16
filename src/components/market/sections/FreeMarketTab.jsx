import React from 'react';
import { Box, Typography } from '@mui/material';
import { MARKET_POSITIONS, MARKET_OVR_RANGES } from '../../../engines/market/marketViewModel.js';
import { MARKET_REFRESH_COST } from '../../../engines/market/marketService.js';

export default function FreeMarketTab({ filterPos, setFilterPos, filterOvr, setFilterOvr, marketPlayers, onRefresh, renderPlayerCard, formatMoney, C }) {
  return (
    <>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.8 }}>
        <Box sx={{ display:'flex', gap:0.5, overflowX:'auto', '&::-webkit-scrollbar':{display:'none'} }}>
          {MARKET_POSITIONS.map((position) => (
            <Box component="button" type="button" key={position} onClick={() => setFilterPos(position)} sx={{ flexShrink:0, px:1.4, py:0.5, borderRadius:'20px', cursor:'pointer', bgcolor:filterPos === position ? C.teal : C.card, border:`1.5px solid ${filterPos === position ? C.teal : C.border}` }}>
              <Typography sx={{ color:filterPos === position ? '#000' : C.txt2, fontWeight:900, fontSize:'0.6rem' }}>{position}</Typography>
            </Box>
          ))}
        </Box>
        <Box component="button" type="button" onClick={onRefresh} sx={{ ml:0.8, flexShrink:0, bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'8px', px:1, py:0.5, cursor:'pointer' }}>
          <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.6rem' }}>🔄 {formatMoney(MARKET_REFRESH_COST)}</Typography>
        </Box>
      </Box>
      <Box sx={{ display:'flex', gap:0.6, mb:1.2 }}>
        {MARKET_OVR_RANGES.map((range) => (
          <Box component="button" type="button" key={range.label} onClick={() => setFilterOvr(range.label)} sx={{ flex:1, py:0.5, textAlign:'center', borderRadius:'7px', cursor:'pointer', bgcolor:filterOvr === range.label ? C.cardAlt : C.card, border:`1.5px solid ${filterOvr === range.label ? C.bord2 : C.border}` }}>
            <Typography sx={{ color:filterOvr === range.label ? C.txt1 : C.txt3, fontWeight:filterOvr === range.label ? 900 : 700, fontSize:'0.6rem' }}>{range.label}</Typography>
          </Box>
        ))}
      </Box>
      {marketPlayers.length === 0 && <Typography sx={{ textAlign:'center', color:C.txt3, mt:4, fontStyle:'italic', fontWeight:700 }}>Nenhum jogador encontrado.</Typography>}
      {marketPlayers.map(renderPlayerCard)}
    </>
  );
}

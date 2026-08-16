import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import JerseyBadge from '../../player/JerseyBadge.jsx';
import { getWatchlistPlayerState } from '../../../engines/market/marketService.js';
import { evaluateTransferPurchase, getPurchaseActionLabel } from '../../../engines/market/transferRules.js';
import { ovrColor } from '../../../utils/playerVisuals.js';

export default function WatchlistMarketTab({ watchlist, gameData, setGameData, onBuy, toggleWatchlist, formatMoney, C }) {
  if (watchlist.length === 0) return <Box sx={{ textAlign:'center', py:8 }}><Typography sx={{ fontSize:'3rem', mb:1.5, opacity:0.3 }}>☆</Typography><Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.88rem', mb:0.5 }}>Nenhum favorito ainda</Typography><Typography sx={{ color:C.txt3, fontSize:'0.7rem', fontWeight:700 }}>Toque em ☆ nos cards dos jogadores para acompanhá-los</Typography></Box>;

  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.2 }}>
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:1 }}>{watchlist.length} JOGADOR{watchlist.length > 1 ? 'ES' : ''} MONITORADO{watchlist.length > 1 ? 'S' : ''}</Typography>
        <Box component="button" type="button" onClick={() => setGameData((prev) => ({ ...prev, watchlist: [] }))} sx={{ cursor:'pointer', color:C.txt3, fontSize:'0.58rem', fontWeight:700, bgcolor:'transparent', border:0 }}>Limpar tudo</Box>
      </Box>
      {watchlist.map((item) => {
        const { live, isOwned, price } = getWatchlistPlayerState(gameData, item);
        const eligibility = live && !isOwned ? evaluateTransferPurchase(gameData, live, price) : null;
        return (
          <Paper key={item.id} elevation={0} sx={{ overflow:'hidden', borderRadius:'12px', mb:0.8, border:`1px solid ${isOwned ? `${C.green}50` : `${C.gold}30`}`, bgcolor:isOwned ? `${C.green}06` : `${C.gold}04` }}>
            <Box sx={{ px:1.3, py:0.9, display:'flex', alignItems:'center', gap:1 }}>
              <JerseyBadge pos={item.position} num="?" size={40}/>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.1 }}><Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</Typography>{isOwned && <Box sx={{ bgcolor:`${C.green}25`, border:`1px solid ${C.green}50`, borderRadius:'4px', px:0.5, py:0.05 }}><Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.green }}>NO ELENCO</Typography></Box>}</Box>
                <Typography sx={{ color:C.txt3, fontSize:'0.56rem', fontWeight:700 }}>{item.age}a · {live?.teamName || item.teamName}{live && live.overall !== item.overall && <span style={{ color:live.overall > item.overall ? C.green : C.red, marginLeft:6 }}>OVR {live.overall > item.overall ? '↑' : '↓'}{live.overall}</span>}</Typography>
              </Box>
              <Box sx={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.3, flexShrink:0 }}><Box sx={{ bgcolor:ovrColor(live?.overall ?? item.overall), borderRadius:'6px', px:0.8, py:0.15 }}><Typography sx={{ fontWeight:900, fontSize:'0.78rem', color:'#000' }}>{live?.overall ?? item.overall}</Typography></Box><Typography sx={{ fontWeight:900, fontSize:'0.65rem', color:eligibility?.allowed ? C.teal : C.red }}>{formatMoney(price)}</Typography></Box>
              <Box component="button" type="button" aria-label={`Remover ${item.name} dos favoritos`} onClick={(event) => toggleWatchlist(item, event)} sx={{ flexShrink:0, width:26, height:26, borderRadius:'50%', bgcolor:`${C.gold}20`, border:`1px solid ${C.gold}50`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', ml:0.5 }}><Typography sx={{ fontSize:'0.7rem', lineHeight:1 }}>⭐</Typography></Box>
            </Box>
            {!isOwned && live && <Box component="button" type="button" disabled={!eligibility?.allowed} onClick={() => eligibility?.allowed && onBuy(live, price)} sx={{ width:'100%', border:0, borderTop:`1px solid ${C.border}`, px:1.3, py:0.7, textAlign:'center', cursor:eligibility?.allowed ? 'pointer' : 'not-allowed', bgcolor:eligibility?.allowed ? `${C.teal}06` : C.cardAlt, opacity:eligibility?.allowed ? 1 : 0.6 }}><Typography sx={{ color:eligibility?.allowed ? C.teal : C.txt3, fontWeight:900, fontSize:'0.72rem' }}>{getPurchaseActionLabel(eligibility, formatMoney)}</Typography></Box>}
            {!isOwned && !live && <Typography sx={{ borderTop:`1px solid ${C.border}`, py:0.7, textAlign:'center', color:C.txt3, fontWeight:800, fontSize:'0.6rem' }}>JOGADOR NÃO ESTÁ MAIS DISPONÍVEL</Typography>}
          </Paper>
        );
      })}
    </Box>
  );
}

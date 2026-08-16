import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { findPlayerSaleOffer } from '../../engines/market/marketService.js';
import { evaluateTransferPurchase, getPurchaseActionLabel } from '../../engines/market/transferRules.js';
import { ovrColor } from '../../utils/playerVisuals.js';
import JerseyBadge from '../player/JerseyBadge.jsx';

function PlayerMiniStats({ player, formatMoney, C }) {
  const energy = player.energy ?? 100;
  const contract = player.contract ?? 2;
  return (
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.5, mb:0.9 }}>
      {[
        { l:'ENERGIA', v:`${energy}%`, c:energy >= 70 ? C.green : energy >= 50 ? C.gold : C.red },
        { l:'SALÁRIO', v:formatMoney(player.wage || 0), c:C.txt2 },
        { l:'CONTRATO', v:`${contract} ano(s)`, c:contract <= 1 ? C.red : C.txt2 },
      ].map((stat) => (
        <Box key={stat.l} sx={{ bgcolor:C.cardAlt, borderRadius:'6px', px:0.6, py:0.45, textAlign:'center' }}>
          <Typography sx={{ color:stat.c, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{stat.v}</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, mt:0.1 }}>{stat.l}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function MarketPlayerCard({
  player: p,
  gameData,
  selected,
  setSelected,
  setNegotiating,
  setOfferPct,
  handleBuyDirect,
  toggleWatchlist,
  isWatched,
  formatMoney,
  C,
}) {
  const eligibility = evaluateTransferPurchase(gameData, p, p.value);
  const expanded = selected?.id === p.id;
  const canNegotiate = eligibility.allowed || ['cash', 'transfer_budget'].includes(eligibility.code);
  const watched = isWatched(p.id);

  return (
    <Paper onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{
      overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
      border:expanded ? `1.5px solid ${C.teal}` : eligibility.allowed ? `1px solid ${C.border}` : `1px solid ${C.red}40`,
      bgcolor:expanded ? `${C.teal}08` : !eligibility.allowed ? `${C.red}04` : C.card,
      transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' },
    }}>
      <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
        <Box sx={{ position:'relative', flexShrink:0 }}>
          <JerseyBadge pos={p.position} num={p.shirt ?? '?'} size={40}/>
          {p.injury && <Box sx={{ position:'absolute', bottom:-2, right:-2, bgcolor:C.card, borderRadius:'50%', width:13, height:13, display:'flex', alignItems:'center', justifyContent:'center' }}><Typography sx={{fontSize:'0.5rem'}}>🚑</Typography></Box>}
        </Box>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:eligibility.allowed ? C.txt1 : C.red, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.1 }}>{p.age} anos · {p.teamName || 'Livre'}</Typography>
        </Box>
        <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.25 }}>
          <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}><Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography></Box>
          <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:eligibility.allowed ? C.teal : C.red }}>{formatMoney(p.value)}</Typography>
        </Box>
        <Box component="button" type="button" aria-label={watched ? `Remover ${p.name} dos favoritos` : `Favoritar ${p.name}`} onClick={(event) => toggleWatchlist(p, event)} sx={{ flexShrink:0, width:28, height:28, borderRadius:'50%', bgcolor:watched ? `${C.gold}25` : C.cardAlt, border:`1px solid ${watched ? C.gold : C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <Typography sx={{ fontSize:'0.75rem', lineHeight:1 }}>{watched ? '⭐' : '☆'}</Typography>
        </Box>
      </Box>

      {expanded && <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
        <PlayerMiniStats player={p} formatMoney={formatMoney} C={C}/>
        {p.releaseClause > 0 && <Box sx={{ bgcolor:`${C.red}08`, border:`1px solid ${C.red}25`, borderRadius:'6px', px:0.9, py:0.5, mb:0.7, display:'flex', alignItems:'center', justifyContent:'space-between' }}><Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}><Typography sx={{ fontSize:'0.75rem' }}>🔒</Typography><Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.56rem' }}>Multa rescisória</Typography></Box><Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.68rem' }}>{formatMoney(p.releaseClause)}</Typography></Box>}
        {!eligibility.allowed && <Typography sx={{ color:C.red, fontSize:'0.58rem', fontWeight:800, mb:0.7, textAlign:'center' }}>{eligibility.message}</Typography>}
        <Box sx={{ display:'flex', flexDirection:'column', gap:0.6 }}>
          <Box component="button" type="button" disabled={!eligibility.allowed} onClick={(event) => { event.stopPropagation(); if (eligibility.allowed) handleBuyDirect(p, event); }} sx={{ border:0, bgcolor:eligibility.allowed ? C.teal : C.cardAlt, borderRadius:'8px', py:0.85, textAlign:'center', cursor:eligibility.allowed ? 'pointer' : 'not-allowed', opacity:eligibility.allowed ? 1 : 0.55 }}>
            <Typography sx={{ color:eligibility.allowed ? '#000' : C.txt3, fontWeight:900, fontSize:'0.76rem' }}>{getPurchaseActionLabel(eligibility, formatMoney)}</Typography>
          </Box>
          <Box component="button" type="button" disabled={!canNegotiate} onClick={(event) => { event.stopPropagation(); if (!canNegotiate) return; setNegotiating({ player:p }); setOfferPct(85); setSelected(null); }} sx={{ border:`1px solid ${C.border}`, bgcolor:'transparent', borderRadius:'8px', py:0.85, textAlign:'center', cursor:canNegotiate ? 'pointer' : 'not-allowed', opacity:canNegotiate ? 1 : 0.45 }}>
            <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.76rem' }}>🤝 NEGOCIAR</Typography>
          </Box>
        </Box>
      </Box>}
    </Paper>
  );
}

export function OwnedPlayerSaleCard({ player:p, gameData, setGameData, selected, setSelected, handleAcceptSell, handleToggleList, formatMoney, C }) {
  const expanded = selected?.id === p.id;
  const offerData = findPlayerSaleOffer(gameData.inbox, p.id);
  const energy = p.energy ?? 100;
  const contract = p.contract ?? 2;

  return (
    <Paper onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{ overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8, border:expanded ? `1.5px solid ${offerData ? C.blue : C.teal}` : offerData ? `1px solid ${C.blue}50` : p.isListed ? `1px solid ${C.orange}40` : `1px solid ${C.border}`, bgcolor:expanded ? `${offerData ? C.blue : C.teal}08` : offerData ? `${C.blue}06` : p.isListed ? `${C.orange}05` : C.card, transition:'all 0.15s' }}>
      <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
        <JerseyBadge pos={p.position} num={p.shirt ?? '?'} size={40}/>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.1 }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
            {offerData && <Box sx={{ bgcolor:`${C.blue}30`, border:`1px solid ${C.blue}60`, borderRadius:'4px', px:0.5, py:0.05 }}><Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.blue }}>📩 PROPOSTA</Typography></Box>}
            {!offerData && p.isListed && <Box sx={{ bgcolor:`${C.orange}25`, border:`1px solid ${C.orange}50`, borderRadius:'4px', px:0.5, py:0.05 }}><Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.orange }}>À VENDA</Typography></Box>}
          </Box>
          <Box sx={{ display:'flex', gap:0.6, alignItems:'center' }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>{p.age}a</Typography><Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
            <Typography sx={{ color:energy >= 70 ? C.green : energy >= 50 ? C.gold : C.red, fontSize:'0.54rem', fontWeight:700 }}>⚡{energy}%</Typography><Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
            <Typography sx={{ color:C.txt2, fontSize:'0.54rem', fontWeight:700 }}>{formatMoney(p.wage || 0)}/rod</Typography>
            {contract <= 1 && <><Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography><Typography sx={{ color:C.red, fontSize:'0.52rem', fontWeight:900 }}>{contract}a contr.</Typography></>}
          </Box>
        </Box>
        <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.25 }}><Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}><Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography></Box><Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:C.txt2 }}>{formatMoney(p.value)}</Typography></Box>
      </Box>

      {expanded && <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
        {offerData ? <Box sx={{ bgcolor:`${C.blue}0a`, border:`1.5px dashed ${C.blue}50`, p:1.2, borderRadius:'10px', textAlign:'center' }}>
          <Typography sx={{ color:C.txt3, fontSize:'0.62rem', fontWeight:700, mb:0.3 }}>Proposta de <strong style={{color:C.txt1}}>{offerData.team}</strong></Typography>
          <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'1.15rem', mb:1 }}>{formatMoney(offerData.value)}</Typography>
          <Box sx={{ display:'flex', gap:0.8 }}>
            <Box component="button" type="button" onClick={(event) => { event.stopPropagation(); setGameData((prev) => ({ ...prev, inbox:(prev.inbox || []).filter((message) => message.id !== offerData.msgId) })); }} sx={{ flex:1, bgcolor:'transparent', border:`1px solid ${C.red}`, borderRadius:'7px', py:0.7, textAlign:'center', cursor:'pointer' }}><Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.72rem' }}>RECUSAR</Typography></Box>
            <Box component="button" type="button" onClick={(event) => { event.stopPropagation(); handleAcceptSell(p, offerData); }} sx={{ flex:1, border:0, bgcolor:C.green, borderRadius:'7px', py:0.7, textAlign:'center', cursor:'pointer' }}><Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.72rem' }}>VENDER</Typography></Box>
          </Box>
        </Box> : <Box component="button" type="button" onClick={(event) => handleToggleList(p, event)} sx={{ width:'100%', bgcolor:'transparent', border:`1px solid ${p.isListed ? C.red : C.teal}`, borderRadius:'8px', py:0.9, textAlign:'center', cursor:'pointer' }}><Typography sx={{ color:p.isListed ? C.red : C.teal, fontWeight:900, fontSize:'0.76rem' }}>{p.isListed ? '❌ RETIRAR DA LISTA' : '📢 COLOCAR À VENDA'}</Typography></Box>}
      </Box>}
    </Paper>
  );
}

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { findPlayerSaleOffer } from '../../engines/market/marketService.js';

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
  posColor,
  ovrColor,
  C,
}) {
  const afford = gameData.club.money >= p.value;
  const expanded = selected?.id === p.id;
  const pc = posColor(p.position);

  return (
    <Paper onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{
      overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
      border: expanded ? `1.5px solid ${C.teal}` : afford ? `1px solid ${C.border}` : `1px solid ${C.red}40`,
      bgcolor: expanded ? `${C.teal}08` : !afford ? `${C.red}04` : C.card,
      transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' },
    }}>
      <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
        <Box sx={{ position:'relative', flexShrink:0 }}>
          {window.JerseyBadge
            ? React.createElement(window.JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 40 })
            : <Box sx={{ width:40, height:40, borderRadius:'50%', bgcolor:pc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900, color:pc.text }}>{p.position}</Box>
          }
          {p.injury && (
            <Box sx={{ position:'absolute', bottom:-2, right:-2, bgcolor:C.card, borderRadius:'50%',
              width:13, height:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Typography sx={{fontSize:'0.5rem'}}>🚑</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color: afford?C.txt1:C.red,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.1 }}>
            {p.age} anos · {p.teamName || 'Livre'}
          </Typography>
        </Box>
        <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.25 }}>
          <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography>
          </Box>
          <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color: afford?C.teal:C.red }}>
            {formatMoney(p.value)}
          </Typography>
        </Box>
        <Box onClick={e => toggleWatchlist(p, e)} sx={{
          flexShrink:0, width:28, height:28, borderRadius:'50%',
          bgcolor: isWatched(p.id) ? `${C.gold}25` : C.cardAlt,
          border: `1px solid ${isWatched(p.id) ? C.gold : C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', transition:'all 0.15s',
          '&:active':{ transform:'scale(0.85)' },
        }}>
          <Typography sx={{ fontSize:'0.75rem', lineHeight:1 }}>
            {isWatched(p.id) ? '⭐' : '☆'}
          </Typography>
        </Box>
      </Box>

      {expanded && (
        <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
          <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.5, mb:0.9 }}>
            {[
              { l:'ENERGIA', v:`${p.energy??100}%`, c:(p.energy??100)>=70?C.green:(p.energy??100)>=50?C.gold:C.red },
              { l:'SALÁRIO', v:formatMoney(p.wage||0), c:C.txt2 },
              { l:'CONTRATO', v:`${p.contract??2} ano(s)`, c:(p.contract??2)<=1?C.red:C.txt2 },
            ].map((s,i) => (
              <Box key={i} sx={{ bgcolor:C.cardAlt, borderRadius:'6px', px:0.6, py:0.45, textAlign:'center' }}>
                <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{s.v}</Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, mt:0.1 }}>{s.l}</Typography>
              </Box>
            ))}
          </Box>
          {p.releaseClause > 0 && (
            <Box sx={{ bgcolor:`${C.red}08`, border:`1px solid ${C.red}25`, borderRadius:'6px', px:0.9, py:0.5, mb:0.7, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                <Typography sx={{ fontSize:'0.75rem' }}>🔒</Typography>
                <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.56rem' }}>Multa rescisória</Typography>
              </Box>
              <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.68rem' }}>{formatMoney(p.releaseClause)}</Typography>
            </Box>
          )}
          <Box sx={{ display:'flex', flexDirection:'column', gap:0.6 }}>
            <Box onClick={e => { e.stopPropagation(); if(afford) handleBuyDirect(p,e); }}
              sx={{ bgcolor:afford?C.teal:C.cardAlt, borderRadius:'8px', py:0.85,
                textAlign:'center', cursor:afford?'pointer':'not-allowed', opacity:afford?1:0.5 }}>
              <Typography sx={{ color:afford?'#000':C.txt3, fontWeight:900, fontSize:'0.76rem' }}>
                {afford ? `💰 COMPRAR — ${formatMoney(p.value)}` : 'SEM VERBA'}
              </Typography>
            </Box>
            <Box onClick={e => { e.stopPropagation(); setNegotiating({player:p}); setOfferPct(85); setSelected(null); }}
              sx={{ border:`1px solid ${C.border}`, borderRadius:'8px', py:0.85,
                textAlign:'center', cursor:'pointer', '&:active':{opacity:0.7} }}>
              <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.76rem' }}>🤝 NEGOCIAR</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export function OwnedPlayerSaleCard({
  player: p,
  gameData,
  setGameData,
  selected,
  setSelected,
  handleAcceptSell,
  handleToggleList,
  formatMoney,
  posColor,
  ovrColor,
  C,
}) {
  const expanded = selected?.id === p.id;
  const offerData = findPlayerSaleOffer(gameData.inbox, p.id);
  const pc = posColor(p.position);

  return (
    <Paper onClick={() => setSelected(expanded ? null : p)} elevation={0} sx={{
      overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8,
      border: expanded ? `1.5px solid ${offerData?C.blue:C.teal}`
        : offerData ? `1px solid ${C.blue}50`
        : p.isListed ? `1px solid ${C.orange}40`
        : `1px solid ${C.border}`,
      bgcolor: expanded ? `${offerData?C.blue:C.teal}08`
        : offerData ? `${C.blue}06`
        : p.isListed ? `${C.orange}05`
        : C.card,
      transition:'all 0.15s', '&:active':{ transform:'scale(0.985)' },
    }}>
      <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
        {window.JerseyBadge
          ? React.createElement(window.JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 40 })
          : <Box sx={{ width:38, height:38, borderRadius:'50%', flexShrink:0, bgcolor:pc.bg,
              color:pc.text, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.62rem', fontWeight:900 }}>{p.position}</Box>
        }

        <Box sx={{ flex:1, minWidth:0 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.1 }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</Typography>
            {offerData && (
              <Box sx={{ bgcolor:`${C.blue}30`, border:`1px solid ${C.blue}60`,
                borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                <Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.blue }}>📩 PROPOSTA</Typography>
              </Box>
            )}
            {!offerData && p.isListed && (
              <Box sx={{ bgcolor:`${C.orange}25`, border:`1px solid ${C.orange}50`,
                borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}>
                <Typography sx={{ fontSize:'0.42rem', fontWeight:900, color:C.orange }}>À VENDA</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display:'flex', gap:0.6, alignItems:'center' }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>{p.age}a</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
            <Typography sx={{ color:(p.energy??100)>=70?C.green:(p.energy??100)>=50?C.gold:C.red, fontSize:'0.54rem', fontWeight:700 }}>
              ⚡{p.energy??100}%
            </Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
            <Typography sx={{ color:C.txt2, fontSize:'0.54rem', fontWeight:700 }}>
              {formatMoney(p.wage||0)}/rod
            </Typography>
            {(p.contract??2) <= 1 && (
              <>
                <Typography sx={{ color:C.txt3, fontSize:'0.42rem' }}>·</Typography>
                <Typography sx={{ color:C.red, fontSize:'0.52rem', fontWeight:900 }}>{p.contract??0}a contr.</Typography>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.25 }}>
          <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2 }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{p.overall}</Typography>
          </Box>
          <Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:C.txt2 }}>{formatMoney(p.value)}</Typography>
        </Box>
      </Box>

      {expanded && (
        <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
          {offerData ? (
            <Box sx={{ bgcolor:`${C.blue}0a`, border:`1.5px dashed ${C.blue}50`,
              p:1.2, borderRadius:'10px', textAlign:'center' }}>
              <Typography sx={{ color:C.txt3, fontSize:'0.62rem', fontWeight:700, mb:0.3 }}>
                Proposta de <strong style={{color:C.txt1}}>{offerData.team}</strong>
              </Typography>
              <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'1.15rem', mb:1 }}>
                {formatMoney(offerData.value)}
              </Typography>
              <Box sx={{ display:'flex', gap:0.8 }}>
                <Box onClick={e => { e.stopPropagation();
                  setGameData(prev => ({ ...prev, inbox: prev.inbox.filter(m => m.id!==offerData.msgId) })); }}
                  sx={{ flex:1, border:`1px solid ${C.red}`, borderRadius:'7px', py:0.7,
                    textAlign:'center', cursor:'pointer', '&:active':{opacity:0.7} }}>
                  <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.72rem' }}>RECUSAR</Typography>
                </Box>
                <Box onClick={e => { e.stopPropagation(); handleAcceptSell(p, offerData); }}
                  sx={{ flex:1, bgcolor:C.green, borderRadius:'7px', py:0.7,
                    textAlign:'center', cursor:'pointer', '&:active':{filter:'brightness(0.85)'} }}>
                  <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.72rem' }}>VENDER</Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box onClick={e => handleToggleList(p,e)}
              sx={{ border:`1px solid ${p.isListed?C.red:C.teal}`, borderRadius:'8px',
                py:0.9, textAlign:'center', cursor:'pointer', '&:active':{opacity:0.7} }}>
              <Typography sx={{ color:p.isListed?C.red:C.teal, fontWeight:900, fontSize:'0.76rem' }}>
                {p.isListed ? '❌ RETIRAR DA LISTA' : '📢 COLOCAR À VENDA'}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

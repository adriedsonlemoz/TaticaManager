import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import JerseyBadge from '../../player/JerseyBadge.jsx';
import { evaluateTransferPurchase, getPurchaseActionLabel } from '../../../engines/market/transferRules.js';
import { ovrColor } from '../../../utils/playerVisuals.js';

export default function ScoutMarketTab({ scoutData, gameData, selected, setSelected, onBuy, formatMoney, C }) {
  const { myOvr, myPlayersCount, budget, weakPos, recommendations } = scoutData;
  return (
    <Box>
      <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.2 }}>
        <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.72rem', mb:0.8 }}>📊 ANÁLISE DO ELENCO</Typography>
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.6, mb:0.8 }}>
          {[
            { l:'OVR MÉDIO', v:myOvr, c:myOvr >= 75 ? C.green : myOvr >= 65 ? C.yellow : C.red },
            { l:'JOGADORES', v:myPlayersCount, c:myPlayersCount >= 22 ? C.green : C.yellow },
            { l:'VERBA REAL', v:formatMoney(budget), c:C.teal },
          ].map((stat) => <Box key={stat.l} sx={{ bgcolor:C.card, borderRadius:'7px', p:0.7, textAlign:'center' }}><Typography sx={{ color:stat.c, fontWeight:900, fontSize:'0.82rem', lineHeight:1 }}>{stat.v}</Typography><Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700, mt:0.2 }}>{stat.l}</Typography></Box>)}
        </Box>
        {weakPos.length > 0 && <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap' }}><Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>Posições fracas:</Typography>{weakPos.slice(0,4).map((position) => <Box key={position} sx={{ bgcolor:`${C.red}18`, border:`1px solid ${C.red}40`, borderRadius:'5px', px:0.7, py:0.1 }}><Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.58rem' }}>{position}</Typography></Box>)}</Box>}
      </Box>

      <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:0.8, mb:0.8 }}>🔍 RECOMENDAÇÕES DE REFORÇO</Typography>
      {recommendations.length === 0 ? <Box sx={{ textAlign:'center', py:5 }}><Typography sx={{ fontSize:'2.5rem', mb:1, opacity:0.4 }}>🔭</Typography><Typography sx={{ color:C.txt2, fontWeight:700, fontSize:'0.82rem' }}>Sem candidatos encontrados.</Typography></Box> : recommendations.map((player) => {
        const eligibility = evaluateTransferPurchase(gameData, player, player.value || 0);
        const isYoung = player.age <= 21;
        const expanded = selected?.id === player.id;
        return (
          <Paper key={player.id} onClick={() => setSelected(expanded ? null : player)} elevation={0} sx={{ overflow:'hidden', cursor:'pointer', borderRadius:'12px', mb:0.8, border:expanded ? `1.5px solid ${C.teal}` : `1px solid ${eligibility.allowed ? C.border : `${C.red}40`}`, bgcolor:expanded ? `${C.teal}08` : C.card, transition:'all 0.15s' }}>
            <Box sx={{ px:1.3, py:0.85, display:'flex', alignItems:'center', gap:1 }}>
              <JerseyBadge pos={player.position} num={player.shirt ?? '?'} size={40}/>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                  <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:eligibility.allowed ? C.txt1 : C.red, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.name}</Typography>
                  {isYoung && <Box sx={{ bgcolor:'#7c3aed20', border:'1px solid #7c3aed60', borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}><Typography sx={{ color:'#7c3aed', fontSize:'0.42rem', fontWeight:900 }}>⭐ JOVEM</Typography></Box>}
                  {weakPos.includes(player.position) && <Box sx={{ bgcolor:`${C.red}15`, border:`1px solid ${C.red}40`, borderRadius:'4px', px:0.5, py:0.05, flexShrink:0 }}><Typography sx={{ color:C.red, fontSize:'0.42rem', fontWeight:900 }}>URGENTE</Typography></Box>}
                </Box>
                <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.1 }}>{player.age} anos · {player.teamName || 'Livre'}</Typography>
              </Box>
              <Box sx={{ textAlign:'right', flexShrink:0 }}><Box sx={{ bgcolor:ovrColor(player.overall), borderRadius:'6px', px:0.9, py:0.2, mb:0.3 }}><Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#000' }}>{player.overall}</Typography></Box><Typography sx={{ fontWeight:900, fontSize:'0.7rem', color:eligibility.allowed ? C.teal : C.red }}>{formatMoney(player.value || 0)}</Typography></Box>
            </Box>
            {expanded && <Box sx={{ px:1.3, pb:1.1, pt:0.6, borderTop:`1px solid ${C.border}` }}>
              {!eligibility.allowed && <Typography sx={{ color:C.red, fontSize:'0.58rem', fontWeight:800, mb:0.7, textAlign:'center' }}>{eligibility.message}</Typography>}
              <Box component="button" type="button" disabled={!eligibility.allowed} onClick={(event) => { event.stopPropagation(); if (eligibility.allowed) { onBuy(player, player.value || 0); setSelected(null); } }} sx={{ width:'100%', border:0, bgcolor:eligibility.allowed ? C.teal : C.cardAlt, borderRadius:'8px', py:0.85, textAlign:'center', cursor:eligibility.allowed ? 'pointer' : 'not-allowed', opacity:eligibility.allowed ? 1 : 0.55 }}>
                <Typography sx={{ color:eligibility.allowed ? '#000' : C.txt3, fontWeight:900, fontSize:'0.76rem' }}>{getPurchaseActionLabel(eligibility, formatMoney)}</Typography>
              </Box>
            </Box>}
          </Paper>
        );
      })}
    </Box>
  );
}

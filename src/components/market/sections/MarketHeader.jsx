import React from 'react';
import { Box, Typography } from '@mui/material';
import { MARKET_TABS, getMarketHeaderSummary } from '../../../engines/market/marketViewModel.js';

export default function MarketHeader({ gameData, formatMoney, tab, setTab, salesCount, watchCount, C }) {
  const summary = getMarketHeaderSummary(gameData);
  const { funds, windowInfo } = summary;
  const stats = [
    { label:'CAIXA', value:formatMoney(funds.cash), color:C.green },
    { label:'ORÇ. TRANSF.', value:funds.budgetLimited ? formatMoney(funds.transferBudget) : 'SEM LIMITE', color:C.blue },
    { label:`FOLHA (${summary.playerCount})`, value:`${formatMoney(summary.wage)}/rod`, color:C.red },
  ];

  return (
    <Box sx={{ background:`linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`, borderBottom:`1px solid ${C.border}`, px:1.5, pt:3.8, pb:1.3, position:'relative', overflow:'hidden' }}>
      <Typography sx={{ position:'absolute', right:-8, top:-5, fontSize:'6rem', opacity:0.04, lineHeight:1, pointerEvents:'none' }}>🤝</Typography>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.2 }}>
        <Box sx={{ width:44, height:44, borderRadius:'10px', flexShrink:0, bgcolor:`${C.blue}15`, border:`1.5px solid ${C.blue}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Typography sx={{ fontSize:'1.5rem', lineHeight:1 }}>🤝</Typography>
        </Box>
        <Box sx={{ flex:1 }}>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.05rem', letterSpacing:0.5 }}>TRANSFERÊNCIAS</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700, mt:0.15 }}>{summary.clubName}</Typography>
        </Box>
      </Box>

      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.6, mb:1.2 }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'8px', px:0.8, py:0.7, minWidth:0 }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, letterSpacing:0.35, whiteSpace:'nowrap' }}>{stat.label}</Typography>
            <Typography sx={{ color:stat.color, fontWeight:900, fontSize:'0.7rem', lineHeight:1.25, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{stat.value}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display:'flex', gap:0.6 }} role="tablist" aria-label="Seções do mercado">
        {MARKET_TABS.map((item) => {
          const active = tab === item.id;
          const badge = item.id === 'sales' ? salesCount : item.id === 'watch' ? watchCount : 0;
          return (
            <Box component="button" type="button" role="tab" aria-selected={active} key={item.id} onClick={() => setTab(item.id)} sx={{
              flex:1, py:0.7, px:0.2, borderRadius:'8px', textAlign:'center', cursor:'pointer', font:'inherit',
              bgcolor:active ? (item.id === 'watch' ? C.gold : C.teal) : C.cardAlt,
              border:`1px solid ${active ? (item.id === 'watch' ? C.gold : C.teal) : C.border}`,
              transition:'all 0.15s', position:'relative',
            }}>
              <Typography component="span" sx={{ color:active ? '#000' : C.txt2, fontWeight:900, fontSize:'0.64rem' }}>
                {item.label}
                {badge > 0 && (
                  <Typography component="span" sx={{ ml:0.35, bgcolor:item.id === 'watch' ? C.gold : C.blue, color:item.id === 'watch' ? '#000' : '#fff', fontSize:'0.42rem', fontWeight:900, borderRadius:'10px', px:0.45, py:0.1 }}>
                    {badge}
                  </Typography>
                )}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt:0.8, bgcolor:windowInfo.open ? 'rgba(34,197,94,0.08)' : `${C.red}08`, border:`1px solid ${windowInfo.open ? `${C.green}40` : `${C.red}30`}`, borderRadius:'8px', px:1.2, py:0.6, display:'flex', alignItems:'center', gap:0.8 }}>
        <Typography sx={{ fontSize:'0.8rem' }}>{windowInfo.open ? '🟢' : '🔴'}</Typography>
        <Box sx={{ flex:1 }}>
          <Typography sx={{ color:windowInfo.open ? C.green : C.red, fontWeight:900, fontSize:'0.65rem' }}>
            {windowInfo.open ? `JANELA ABERTA — ${windowInfo.label}` : 'JANELA FECHADA'}
          </Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.54rem', fontWeight:700 }}>
            {windowInfo.open ? `Fecha em ${windowInfo.closesIn} rodada(s) · rodada de liga ${windowInfo.transferRound}` : `${windowInfo.label} abre em ${windowInfo.opensIn} rodada(s) · rodada de liga ${windowInfo.transferRound}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

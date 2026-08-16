import React from 'react';
import { Box, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { THEME } from '../../theme.js';

export default function SquadHeader({ viewModel, groupTab, onGroupChange, formatMoney }) {
  const C = THEME;
  const statusCard = viewModel.injuredCount > 0
    ? { icon:'🚑', label:'LESION.', value:viewModel.injuredCount, color:C.red, bg:`${C.red}15`, border:`${C.red}40` }
    : viewModel.suspendedCount > 0
      ? { icon:'🟥', label:'SUSP.', value:viewModel.suspendedCount, color:C.yellow, bg:`${C.yellow}15`, border:`${C.yellow}40` }
      : { icon:'✅', label:'STATUS', value:'OK', color:C.green, bg:`${C.green}12`, border:`${C.green}30` };
  const cards = [
    { icon:'⚡', label:'FORÇA', value:viewModel.teamOvr, color:C.green, bg:`${C.green}18`, border:`${C.green}40` },
    { icon:'💰', label:'VALOR', value:formatMoney(viewModel.totalValue), color:C.blue, bg:`${C.blue}15`, border:`${C.blue}35` },
    { icon:'👥', label:'ELENCO', value:viewModel.players.length, color:C.txt1, bg:C.cardAlt, border:C.border },
    statusCard,
  ];

  return (
    <Box sx={{ background:`linear-gradient(160deg,${C.green}18 0%,${C.bg} 60%)`, borderBottom:`1px solid ${C.border}`, px:1.5, pt:3.8, pb:0 }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.4 }}>
        <Box sx={{ width:48, height:48, borderRadius:'12px', bgcolor:C.cardAlt, border:`2px solid ${C.borderG}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${C.green}30` }}>
          <TeamIcon name={viewModel.clubName} size={34}/>
        </Box>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.1rem', fontFamily:'"Nunito",sans-serif', lineHeight:1, mb:0.2 }}>{viewModel.clubName}</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700 }}>Série {viewModel.serie} · Temporada {viewModel.season}</Typography>
        </Box>
      </Box>

      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0.7, mb:1.2 }}>
        {cards.map((card) => (
          <Box key={card.label} sx={{ bgcolor:card.bg, border:`1.5px solid ${card.border}`, borderRadius:'10px', p:0.7, textAlign:'center' }}>
            <Typography sx={{ fontSize:'1rem', lineHeight:1, mb:0.2 }}>{card.icon}</Typography>
            <Typography sx={{ color:card.color, fontWeight:900, fontSize:'0.88rem', lineHeight:1 }}>{card.value}</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:900, letterSpacing:0.3, mt:0.15 }}>{card.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box role="tablist" aria-label="Filtros do elenco" sx={{ display:'flex', overflowX:'auto', '&::-webkit-scrollbar':{ display:'none' } }}>
        {viewModel.tabs.map((tab) => {
          const active = groupTab === tab.id;
          return (
            <Box
              key={tab.id}
              component="button"
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onGroupChange(tab.id)}
              sx={{ flexShrink:0, px:1.4, py:1, cursor:'pointer', border:0, borderBottom:`2.5px solid ${active ? C.green : 'transparent'}`, bgcolor:active ? 'rgba(34,197,94,0.05)' : 'transparent', transition:'all 0.15s' }}
            >
              <Typography component="span" sx={{ color:active ? C.green : C.txt3, fontWeight:900, fontSize:'0.65rem', whiteSpace:'nowrap' }}>
                {tab.label}{tab.count > 0 && <Typography component="span" sx={{ color:active ? C.green : C.txt3, fontSize:'0.58rem', ml:0.3 }}>({tab.count})</Typography>}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

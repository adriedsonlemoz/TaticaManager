import React from 'react';
import { Box, Typography } from '@mui/material';

function SectionTitle({ textColor, lineColor, children }) {
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.6 }}>
      <Box sx={{ flex:1, height:1, bgcolor:lineColor }}/>
      <Typography sx={{ color:textColor, fontWeight:900, fontSize:'0.58rem', letterSpacing:0.5 }}>{children}</Typography>
      <Box sx={{ flex:1, height:1, bgcolor:lineColor }}/>
    </Box>
  );
}

export default function SalesMarketTab({ salesData, playerCount, renderMyPlayerCard, C }) {
  return (
    <Box>
      <Box sx={{ bgcolor:C.cardAlt, p:1.1, borderRadius:'10px', border:`1px dashed ${C.border}`, mb:1.2, textAlign:'center' }}>
        <Typography sx={{ color:C.txt1, fontSize:'0.7rem', fontWeight:900, mb:0.2 }}>GERENCIE SUAS VENDAS</Typography>
        <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:600 }}>Expanda um jogador para colocá-lo na lista ou aceitar propostas.</Typography>
      </Box>
      {salesData.withOffer.length > 0 && <Box sx={{ mb:1.2 }}><SectionTitle textColor={C.blue} lineColor={`${C.blue}40`}>📩 PROPOSTAS RECEBIDAS ({salesData.withOffer.length})</SectionTitle>{salesData.withOffer.map(renderMyPlayerCard)}</Box>}
      {salesData.listed.length > 0 && <Box sx={{ mb:1.2 }}><SectionTitle textColor={C.orange} lineColor={`${C.orange}40`}>📋 À VENDA ({salesData.listed.length})</SectionTitle>{salesData.listed.map(renderMyPlayerCard)}</Box>}
      {salesData.rest.length > 0 && <Box><SectionTitle textColor={C.txt3} lineColor={C.border}>ELENCO ({salesData.rest.length})</SectionTitle>{salesData.rest.map(renderMyPlayerCard)}</Box>}
      {playerCount === 0 && <Typography sx={{ textAlign:'center', color:C.txt3, mt:4, fontStyle:'italic' }}>Sem jogadores no elenco.</Typography>}
    </Box>
  );
}

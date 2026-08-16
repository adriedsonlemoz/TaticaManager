import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { getNegotiationPreview } from '../../../engines/market/marketService.js';
import { evaluateTransferPurchase, getPurchaseActionLabel } from '../../../engines/market/transferRules.js';
import { ovrColor } from '../../../utils/playerVisuals.js';

export default function NegotiationPanel({ negotiating, gameData, offerPct, setOfferPct, setNegotiating, onSubmit, formatMoney, C }) {
  if (!negotiating) return null;
  const preview = getNegotiationPreview(gameData, negotiating.player, offerPct);
  if (!preview) return null;
  const { player, minPct, offerVal, minVal, aboveMin } = preview;
  const eligibility = evaluateTransferPurchase(gameData, player, offerVal);
  const canSubmit = aboveMin && eligibility.allowed;
  const statusText = !aboveMin
    ? `Mínimo: ${minPct}% (${formatMoney(minVal)})`
    : eligibility.allowed ? 'Proposta válida' : eligibility.message;

  return (
    <Paper sx={{ mb:1.5, border:`1.5px solid ${C.teal}`, borderRadius:'12px', overflow:'hidden' }}>
      <Box sx={{ bgcolor:C.teal, px:1.8, py:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.82rem' }}>🤝 NEGOCIAR PROPOSTA</Typography>
        <Box component="button" type="button" aria-label="Fechar negociação" onClick={() => setNegotiating(null)} sx={{ cursor:'pointer', color:'rgba(0,0,0,0.6)', fontSize:'1.1rem', fontWeight:900, bgcolor:'transparent', border:0 }}>✕</Box>
      </Box>
      <Box sx={{ p:1.5, bgcolor:C.bg }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.2 }}>
          <Box>
            <Typography sx={{ fontWeight:900, color:C.txt1, fontSize:'0.95rem' }}>{player.name}</Typography>
            <Typography sx={{ fontSize:'0.65rem', color:C.txt3, fontWeight:700 }}>{player.teamName || 'Livre'}</Typography>
          </Box>
          <Box sx={{ bgcolor:ovrColor(player.overall), borderRadius:'8px', px:1, py:0.4 }}>
            <Typography sx={{ color:'#000', fontWeight:900, fontSize:'0.95rem' }}>{player.overall}</Typography>
          </Box>
        </Box>
        <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.2 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.6 }}>
            <Typography sx={{ color:C.txt2, fontSize:'0.68rem', fontWeight:700 }}>Valor de mercado:</Typography>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.75rem' }}>{formatMoney(player.value)}</Typography>
          </Box>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
            <Typography sx={{ color:C.txt2, fontSize:'0.68rem', fontWeight:900 }}>Sua oferta ({offerPct}%):</Typography>
            <Typography sx={{ color:C.teal, fontWeight:900, fontSize:'0.95rem' }}>{formatMoney(offerVal)}</Typography>
          </Box>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.4 }}>
            <Typography sx={{ color:C.txt3, fontSize:'0.52rem', fontWeight:700 }}>50%</Typography>
            <Typography sx={{ color:canSubmit ? C.green : C.red, fontSize:'0.55rem', fontWeight:900, textAlign:'center' }}>
              {canSubmit ? '✅ Aceitável' : `❌ ${statusText}`}
            </Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.52rem', fontWeight:700 }}>100%</Typography>
          </Box>
          <Box sx={{ position:'relative', height:16, mb:1 }}>
            <Box sx={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:0, right:0, height:4, bgcolor:C.cardAlt, borderRadius:2, overflow:'hidden' }}>
              <Box sx={{ height:'100%', width:`${(offerPct - 50) * 2}%`, bgcolor:canSubmit ? C.green : C.red, transition:'width 0.1s, background-color 0.2s', borderRadius:2 }}/>
            </Box>
            <Box sx={{ position:'absolute', top:0, bottom:0, left:`${(minPct - 50) * 2}%`, width:2, bgcolor:C.red, borderRadius:1, opacity:0.8 }}/>
            <input aria-label="Percentual da oferta" type="range" min={50} max={100} value={offerPct} onChange={(event) => setOfferPct(Number(event.target.value))}
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer', margin:0 }}/>
          </Box>
        </Box>
        <Box component="button" type="button" disabled={!canSubmit} onClick={canSubmit ? onSubmit : undefined} sx={{ width:'100%', border:0, bgcolor:canSubmit ? C.teal : C.cardAlt, borderRadius:'9px', py:1, textAlign:'center', cursor:canSubmit ? 'pointer' : 'not-allowed', opacity:canSubmit ? 1 : 0.55 }}>
          <Typography sx={{ color:canSubmit ? '#000' : C.txt3, fontWeight:900, fontSize:'0.78rem' }}>
            {canSubmit ? 'ENVIAR PROPOSTA' : !aboveMin ? 'OFERTA ABAIXO DO MÍNIMO' : getPurchaseActionLabel(eligibility, formatMoney)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

import React from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { SERIE_COLORS } from '../../engines/career/careerViewModel.js';

const CareerOfferDialog = ({ open, offerMessage, season, formatMoney, theme, onClose, onAccept, onDecline }) => {
  const C = theme;
  if (!offerMessage) return null;
  const offer = offerMessage.actionData || {};
  const club = offer.offeringClub || {};
  const sc = SERIE_COLORS[club.serie] || C.txt2;
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'18px', border:'2px solid rgba(124,58,237,0.5)', boxShadow:'0 12px 48px rgba(124,58,237,0.3)', backgroundImage:'none', m:1.5 } }} BackdropProps={{ sx:{ backdropFilter:'blur(5px)', bgcolor:'rgba(0,0,0,0.55)' } }}>
    <Box>
      <Box sx={{ background:'linear-gradient(135deg,#4c1d95,#5b21b6)', px:2, py:1.8, borderRadius:'16px 16px 0 0', textAlign:'center' }}>
        <Typography sx={{ fontSize:'2.5rem', lineHeight:1, mb:0.5 }}>💼</Typography>
        <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1rem', lineHeight:1 }}>PROPOSTA DE CONTRATO</Typography>
        <Typography sx={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:700, mt:0.3 }}>Próxima temporada</Typography>
      </Box>
      <Box sx={{ px:2, py:2 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.8, bgcolor:`${sc}0d`, border:`1.5px solid ${sc}35`, borderRadius:'12px', px:1.4, py:1.1 }}>
          <TeamIcon name={club.name} size={42} />
          <Box>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{club.name}</Typography>
            <Box sx={{ display:'flex', gap:0.5, mt:0.3 }}>
              <Box sx={{ bgcolor:`${sc}20`, border:`1px solid ${sc}40`, borderRadius:'5px', px:0.7, py:0.1 }}><Typography sx={{ color:sc, fontWeight:900, fontSize:'0.55rem' }}>Série {club.serie}</Typography></Box>
              {club.strength && <Box sx={{ bgcolor:`${C.blue}15`, border:`1px solid ${C.blue}35`, borderRadius:'5px', px:0.7, py:0.1 }}><Typography sx={{ color:C.blue, fontWeight:900, fontSize:'0.55rem' }}>⚡ Força {club.strength}</Typography></Box>}
            </Box>
          </Box>
        </Box>
        <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.6 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', py:0.5, borderBottom:`1px solid ${C.border}` }}>
            <Typography sx={{ color:C.txt2, fontSize:'0.7rem', fontWeight:700 }}>Salário</Typography>
            <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.78rem' }}>{formatMoney ? formatMoney(offer.offeredSalary) : `R$ ${(offer.offeredSalary||0).toLocaleString('pt-BR')}`}/rodada</Typography>
          </Box>
          <Box sx={{ display:'flex', justifyContent:'space-between', py:0.5 }}>
            <Typography sx={{ color:C.txt2, fontSize:'0.7rem', fontWeight:700 }}>Início</Typography>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.7rem' }}>Temporada {(season||2026) + 1}</Typography>
          </Box>
        </Box>
        <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700, textAlign:'center', mb:1.6, lineHeight:1.5 }}>Ao aceitar, seu histórico e conquistas são preservados. A transferência ocorre na virada de temporada.</Typography>
        <Box sx={{ display:'flex', gap:0.8 }}>
          <Box role="button" tabIndex={0} onClick={onDecline} onKeyDown={e => (e.key==='Enter'||e.key===' ') && onDecline()} sx={{ flex:1, borderRadius:'10px', py:1.2, textAlign:'center', cursor:'pointer', bgcolor:C.cardAlt, border:`1.5px solid ${C.border}`, '&:active':{ filter:'brightness(0.9)' } }}><Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.75rem' }}>❌ Recusar</Typography></Box>
          <Box role="button" tabIndex={0} onClick={onAccept} onKeyDown={e => (e.key==='Enter'||e.key===' ') && onAccept()} sx={{ flex:2, borderRadius:'10px', py:1.2, textAlign:'center', cursor:'pointer', background:'linear-gradient(135deg,#6d28d9,#5b21b6)', boxShadow:'0 0 20px rgba(109,40,217,0.4)', '&:active':{ filter:'brightness(0.88)' } }}><Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.82rem' }}>✅ Aceitar Proposta</Typography></Box>
        </Box>
      </Box>
    </Box>
  </Dialog>;
};
export default CareerOfferDialog;

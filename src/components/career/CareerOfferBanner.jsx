import React from 'react';
import { Box, Typography } from '@mui/material';

const CareerOfferBanner = ({ offer, onOpen }) => !offer ? null : (
  <Box role="button" tabIndex={0} onClick={onOpen} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen()} sx={{
    mx:1.5, mt:1.5, background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.06))',
    border:'1.5px solid rgba(124,58,237,0.5)', borderRadius:'14px', px:1.4, py:1.1, cursor:'pointer', display:'flex', alignItems:'center', gap:1,
    boxShadow:'0 0 20px rgba(124,58,237,0.2)', '&:active':{ filter:'brightness(0.92)' },
    animation:'pulseOffer 2s ease-in-out infinite', '@keyframes pulseOffer':{'0%,100%':{ boxShadow:'0 0 20px rgba(124,58,237,0.2)' }, '50%':{ boxShadow:'0 0 32px rgba(124,58,237,0.45)' }},
  }}>
    <Typography sx={{ fontSize:'1.5rem', lineHeight:1, flexShrink:0 }}>💼</Typography>
    <Box sx={{ flex:1, minWidth:0 }}>
      <Typography sx={{ color:'#c4b5fd', fontWeight:900, fontSize:'0.78rem', lineHeight:1 }}>PROPOSTA DE CLUBE</Typography>
      <Typography sx={{ color:'rgba(196,181,253,0.7)', fontSize:'0.58rem', fontWeight:700, mt:0.2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
        {offer.actionData?.offeringClub?.name} quer te contratar • toque para ver
      </Typography>
    </Box>
    <Typography sx={{ color:'#c4b5fd', fontSize:'1rem' }}>›</Typography>
  </Box>
);
export default CareerOfferBanner;

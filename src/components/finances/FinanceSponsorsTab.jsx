import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { THEME as C } from '../../theme.js';

function ActiveSponsorCard({ sponsor, type, formatMoney }) {
  const isStadium = type === 'stadium';
  return (
    <Paper sx={{ p: 1.8, borderRadius: '12px', bgcolor: C.cardAlt, border: `2px solid ${sponsor.color || C.primary}`, position: 'relative', overflow: 'hidden', mb: 2 }}>
      <Box sx={{ position: 'absolute', right: -20, top: -10, opacity: 0.08 }}>
        <Typography sx={{ fontSize: '6rem' }}>{isStadium ? '🏟️' : '👕'}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem' }}>{isStadium ? `Arena ${sponsor.name}` : sponsor.name}</Typography>
        <Box sx={{ bgcolor: C.green, color: '#fff', px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>ATIVO</Box>
      </Box>
      <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.88rem' }}>
        +{formatMoney(sponsor.roundValue)}<Typography component="span" sx={{ fontSize: '0.58rem', color: C.txt2 }}> /rodada</Typography>
      </Typography>
    </Paper>
  );
}

function OfferList({ offers, type, formatMoney, onSign }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      {offers.map((offer) => (
        <Paper key={offer.name} sx={{ p: 1.4, borderRadius: '12px', bgcolor: C.card, border: `1px solid ${C.bord2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography sx={{ color: offer.color || C.txt1, fontWeight: 900, fontSize: '0.92rem' }}>{offer.name}</Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700, mt: 0.2 }}>Luvas: <span style={{ color: C.green }}>+{formatMoney(offer.val)}</span></Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700 }}>Por rodada: <span style={{ color: C.green }}>+{formatMoney(offer.roundVal)}</span></Typography>
          </Box>
          <Button
            variant={type === 'master' ? 'contained' : 'outlined'}
            onClick={() => onSign(type, offer)}
            sx={type === 'master'
              ? { bgcolor: C.primary, color: '#fff', fontWeight: 900, fontSize: '0.68rem', '&:hover': { bgcolor: C.prim2 } }
              : { borderColor: C.primary, color: C.primary, fontWeight: 900, fontSize: '0.68rem' }}
          >
            Assinar
          </Button>
        </Paper>
      ))}
    </Box>
  );
}

export function FinanceSponsorsTab({ sponsors, offers, formatMoney, onSign }) {
  return (
    <Box>
      <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 1.5, mb: 1 }}>DEPARTAMENTO COMERCIAL</Typography>

      <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1, mb: 0.5 }}>MÁSTER (CAMISA)</Typography>
      {sponsors.master
        ? <ActiveSponsorCard sponsor={sponsors.master} type="master" formatMoney={formatMoney} />
        : <OfferList offers={offers.master} type="master" formatMoney={formatMoney} onSign={onSign} />}

      <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1, mb: 0.5, mt: 1.5 }}>NAMING RIGHTS (ESTÁDIO)</Typography>
      {sponsors.stadium
        ? <ActiveSponsorCard sponsor={sponsors.stadium} type="stadium" formatMoney={formatMoney} />
        : <OfferList offers={offers.stadium} type="stadium" formatMoney={formatMoney} onSign={onSign} />}
    </Box>
  );
}

export default FinanceSponsorsTab;

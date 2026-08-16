import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';
import { SeasonEndSectionTitle } from './SeasonEndPrimitives.jsx';

function zoneColor(index, serie) {
  if (serie === 'A') {
    if (index < 4) return D.green;
    if (index < 6) return D.teal;
    if (index < 12) return D.blue;
    if (index >= 16) return D.red;
    return 'transparent';
  }
  if (index < 4) return D.green;
  if (index >= 16) return D.red;
  return 'transparent';
}

export default function SeasonEndFinalTable({ vm }) {
  const rows = vm.result.finalTable || [];
  const serie = vm.result.prevSerie || 'A';
  return (
    <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      <Box sx={{ px: 1.2, pt: 1, pb: 0.6 }}>
        <SeasonEndSectionTitle>CLASSIFICAÇÃO FINAL · SÉRIE {serie}</SeasonEndSectionTitle>
      </Box>
      {rows.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}><Typography sx={{ color: D.txt3, fontSize: '0.7rem' }}>Tabela final indisponível neste save antigo.</Typography></Box>
      ) : rows.map((row, index) => {
        const user = row.id === 'user';
        const saldo = (Number(row.gf) || 0) - (Number(row.ga) || 0);
        const zone = zoneColor(index, serie);
        return (
          <Box key={row.id || `${row.name}-${index}`} sx={{ display: 'grid', gridTemplateColumns: '4px 28px 1fr 30px 30px 34px', gap: 0.5, alignItems: 'center', px: 0.8, py: 0.6, bgcolor: user ? `${D.teal}12` : 'transparent', borderTop: `1px solid ${D.border}30` }}>
            <Box sx={{ width: 4, height: 22, borderRadius: 4, bgcolor: zone }} />
            <Typography sx={{ color: user ? D.teal : D.txt3, fontWeight: 900, fontSize: '0.64rem' }}>{index + 1}º</Typography>
            <Typography sx={{ color: user ? D.txt1 : D.txt2, fontWeight: user ? 900 : 700, fontSize: '0.67rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</Typography>
            <Typography sx={{ color: D.txt3, fontWeight: 700, fontSize: '0.58rem', textAlign: 'center' }}>{row.w || 0}V</Typography>
            <Typography sx={{ color: saldo >= 0 ? D.green : D.red, fontWeight: 700, fontSize: '0.58rem', textAlign: 'center' }}>{saldo >= 0 ? '+' : ''}{saldo}</Typography>
            <Typography sx={{ color: user ? D.teal : D.txt1, fontWeight: 900, fontSize: '0.7rem', textAlign: 'right' }}>{row.pts || 0}</Typography>
          </Box>
        );
      })}
      {rows.length > 0 && (
        <Box sx={{ px: 1, py: 0.8, display: 'flex', gap: 1.2, flexWrap: 'wrap', borderTop: `1px solid ${D.border}` }}>
          <Typography sx={{ color: D.txt3, fontSize: '0.48rem' }}>V = vitórias</Typography>
          <Typography sx={{ color: D.txt3, fontSize: '0.48rem' }}>SG = saldo</Typography>
          <Typography sx={{ color: D.txt3, fontSize: '0.48rem' }}>PTS = pontos</Typography>
        </Box>
      )}
    </Box>
  );
}

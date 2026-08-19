import React from 'react';
import { Box, Typography } from '@mui/material';

const statusMeta = (status, C) => {
  if (status === 'champion') return { color:C.gold, label:'🏆 CAMPEÃO!' };
  if (status === 'eliminated') return { color:C.red, label:'❌ Eliminado' };
  return { color:C.green, label:'✅ Ativo' };
};

const CareerCupStatus = ({ entries = [], theme, formatMoney }) => {
  const C = theme;
  if (!entries.length) return null;
  return (
    <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.5 }}>
      <Box sx={{ px:1.4, py:0.9, borderBottom:`1px solid ${C.border}` }}>
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2 }}>🏆 COMPETIÇÕES DA TEMPORADA</Typography>
      </Box>
      {entries.map((entry, index) => {
        const status = statusMeta(entry.status, C);
        return (
          <Box key={`${entry.storageKey}-${entry.competitionKey}`} sx={{ px:1.4, py:0.9, borderBottom:index < entries.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:1 }}>
              <Box sx={{ minWidth:0 }}>
                <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.68rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{entry.label}</Typography>
                <Typography sx={{ color:C.txt2, fontSize:'0.6rem', fontWeight:700 }}>{entry.phaseLabel}</Typography>
              </Box>
              <Typography sx={{ color:status.color, fontWeight:900, fontSize:'0.62rem', flexShrink:0 }}>{status.label}</Typography>
            </Box>
            {entry.totalPrize > 0 && formatMoney && (
              <Typography sx={{ color:C.green, fontSize:'0.56rem', fontWeight:700, mt:0.35 }}>💰 Premiação acumulada: {formatMoney(entry.totalPrize)}</Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
export default CareerCupStatus;

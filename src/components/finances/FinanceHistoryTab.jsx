import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { THEME as C } from '../../theme.js';
import { parseFinancialEntry } from '../../engines/finances/financeViewModel.js';

export function FinanceHistoryTab({ history, formatMoney }) {
  return (
    <Paper sx={{ bgcolor: C.card, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.bord2}` }}>
      <Box sx={{ bgcolor: C.dark, p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '0.78rem', letterSpacing: 1 }}>MOVIMENTAÇÕES</Typography>
        <Typography sx={{ color: C.txt3, fontSize: '0.62rem' }}>{history.length} registros</Typography>
      </Box>

      {history.length === 0 ? (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.5 }}>📭</Typography>
          <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.85rem' }}>Sem movimentações ainda.</Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {history.map((entry, index) => {
            const parsed = parseFinancialEntry(entry, formatMoney);
            return (
              <Box key={`${entry?.round ?? 'r'}-${index}`} sx={{
                display: 'flex', alignItems: 'center', px: 1.4, py: 1,
                borderBottom: `1px solid ${C.bord2}`,
                bgcolor: index % 2 === 0 ? C.card : C.cardAlt,
                borderLeft: `3px solid ${parsed.positive ? C.green : C.red}`,
              }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', mr: 1.2, flexShrink: 0 }}>
                  {parsed.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: C.txt1, fontWeight: 700, fontSize: '0.72rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {parsed.description}
                  </Typography>
                  <Typography sx={{ color: C.txt3, fontSize: '0.54rem', mt: 0.1 }}>Rodada {entry?.round || '?'}</Typography>
                </Box>
                <Typography sx={{ color: parsed.positive ? C.green : C.red, fontWeight: 900, fontSize: '0.82rem', flexShrink: 0, ml: 0.8 }}>
                  {parsed.positive ? '+' : '-'}{formatMoney(Math.abs(parsed.value))}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

export default FinanceHistoryTab;

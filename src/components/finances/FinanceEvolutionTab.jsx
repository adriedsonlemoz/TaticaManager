import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME as C } from '../../theme.js';
import { buildEvolutionEntries } from '../../engines/finances/financeViewModel.js';

export function FinanceEvolutionTab({ history, summary, formatMoney }) {
  const evolution = React.useMemo(() => buildEvolutionEntries(history), [history]);

  if (evolution.chronological.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📈</Typography>
        <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.85rem' }}>Sem histórico. Jogue algumas rodadas.</Typography>
      </Box>
    );
  }

  const rows = [
    { icon: '📅', label: 'Receitas de partidas', value: summary.ticket + summary.tv + summary.sponsor + summary.cup, color: C.green },
    { icon: '🎟', label: 'Bilheteria total', value: summary.ticket, color: C.primary },
    { icon: '📺', label: 'Cotas de TV', value: summary.tv, color: C.blue },
    { icon: '✍️', label: 'Patrocinadores', value: summary.sponsor, color: C.gold },
    { icon: '🏆', label: 'Premiações de copa', value: summary.cup, color: C.gold },
    { icon: '🤝', label: 'Vendas de jogadores', value: summary.transfersIn, color: C.green },
    { icon: '🛒', label: 'Compras de jogadores', value: -summary.transfersOut, color: C.red },
    { icon: '🏋️', label: 'Taxas de treinamento', value: -summary.training, color: C.red },
    { icon: '🏟️', label: 'Obras do estádio', value: -summary.stadium, color: C.red },
    { icon: '🔄', label: 'Atualização de mercado', value: -summary.market, color: C.red },
    { icon: '💸', label: 'Folha salarial total', value: -summary.wage, color: C.red },
    { icon: '🏢', label: 'Custos operacionais', value: -summary.opCost, color: C.red },
  ].filter((row) => row.value !== 0);

  return (
    <Box>
      <Box sx={{ bgcolor: C.card, border: `1px solid ${C.bord2}`, borderRadius: '12px', overflow: 'hidden', mb: 1.5 }}>
        <Box sx={{ px: 1.5, py: 1, bgcolor: C.dark, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5 }}>📈 EVOLUÇÃO FINANCEIRA</Typography>
          <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>{evolution.chronological.length} entradas</Typography>
        </Box>
        <Box sx={{ px: 1, py: 1.5, display: 'flex', alignItems: 'flex-end', gap: '2px', height: 110, overflowX: 'auto' }}>
          {evolution.chart.map((entry, index) => (
            <Box key={`${entry.round}-${index}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', minWidth: 10, flex: 1 }}>
              <Box sx={{ width: '100%', height: Math.round((entry.income / evolution.maxAbs) * 80), bgcolor: C.green, borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
              <Box sx={{ width: '100%', height: Math.round((entry.expense / evolution.maxAbs) * 80), bgcolor: C.red, borderRadius: '0 0 2px 2px', opacity: 0.85 }} />
              <Typography sx={{ color: C.txt3, fontSize: '0.36rem', mt: 0.2 }}>{entry.round}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', gap: 1.5 }}>
          {[{ color: C.green, label: 'Receita' }, { color: C.red, label: 'Despesa' }].map((legend) => (
            <Box key={legend.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: legend.color, borderRadius: '2px' }} />
              <Typography sx={{ color: C.txt2, fontSize: '0.58rem', fontWeight: 700 }}>{legend.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ bgcolor: C.card, border: `1px solid ${C.bord2}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, py: 1, bgcolor: C.dark }}>
          <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5 }}>💰 RESUMO DA TEMPORADA</Typography>
        </Box>
        <Box sx={{ px: 1.4, py: 0.8 }}>
          {rows.map((row, index) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.55, borderBottom: index < rows.length - 1 ? `1px solid ${C.bord2}` : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Typography sx={{ fontSize: '0.85rem' }}>{row.icon}</Typography>
                <Typography sx={{ color: C.txt2, fontSize: '0.7rem', fontWeight: 700 }}>{row.label}</Typography>
              </Box>
              <Typography sx={{ color: row.color, fontWeight: 900, fontSize: '0.75rem' }}>
                {row.value >= 0 ? '+' : ''}{formatMoney(row.value)}
              </Typography>
            </Box>
          ))}

          <Box sx={{ mt: 0.8, pt: 0.8, borderTop: `2px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.75rem' }}>💼 RESULTADO LÍQUIDO</Typography>
            <Typography sx={{ color: summary.net >= 0 ? C.green : C.red, fontWeight: 900, fontSize: '0.9rem' }}>
              {summary.net >= 0 ? '+' : ''}{formatMoney(summary.net)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default FinanceEvolutionTab;

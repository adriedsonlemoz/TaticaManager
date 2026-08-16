import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';
import { SeasonEndSectionTitle, SeasonEndStatCard } from './SeasonEndPrimitives.jsx';

export default function SeasonEndFinanceTab({ vm, formatMoney }) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 1.2 }}>
        <SeasonEndStatCard label="CAIXA NOVA TEMP." value={formatMoney(vm.nextSeason.money)} color={D.teal} />
        <SeasonEndStatCard label="FOLHA NOVA" value={`${formatMoney(vm.nextSeason.wage)}/rod`} color={D.red} />
        <SeasonEndStatCard label="RECEITAS REG." value={formatMoney(vm.finances.income)} color={D.green} />
        <SeasonEndStatCard label="DESPESAS REG." value={formatMoney(vm.finances.expense)} color={D.red} />
        <SeasonEndStatCard label="ORÇ. TRANSF." value={formatMoney(vm.nextSeason.transferBudget)} color={D.blue} />
        <SeasonEndStatCard label="VALOR ELENCO" value={formatMoney(vm.squad.totalValue)} color={D.teal} />
      </Box>

      <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
        <Box sx={{ px: 1.4, py: 0.8, borderBottom: `1px solid ${D.border}` }}>
          <SeasonEndSectionTitle>ÚLTIMAS TRANSAÇÕES ANTES DA VIRADA</SeasonEndSectionTitle>
        </Box>
        {vm.finances.transactions.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}><Typography sx={{ color: D.txt3, fontSize: '0.7rem' }}>Sem histórico financeiro</Typography></Box>
        ) : vm.finances.transactions.map((entry, index) => {
          const total = Number(entry?.total) || ((Number(entry?.income) || 0) - (Number(entry?.expense) || 0));
          return (
            <Box key={`${entry?.round ?? 'r'}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.2, py: 0.55, borderBottom: `1px solid ${D.border}30` }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: D.txt1, fontSize: '0.62rem', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{entry?.detail?.description || entry?.description || 'Transação'}</Typography>
                <Typography sx={{ color: D.txt3, fontSize: '0.48rem' }}>Rod. {entry?.leagueRound ?? entry?.round ?? '—'}</Typography>
              </Box>
              <Typography sx={{ color: total >= 0 ? D.green : D.red, fontWeight: 900, fontSize: '0.7rem', flexShrink: 0 }}>
                {total >= 0 ? '+' : '-'}{formatMoney(Math.abs(total))}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

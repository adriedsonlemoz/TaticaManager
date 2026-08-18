import React from 'react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { THEME as C } from '../../theme.js';
import { getSuggestionSeverity } from '../../engines/finances/financeViewModel.js';

function MoneyLine({ label, value, color = C.txt1, prefix = '' }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>{label}</Typography>
      <Typography sx={{ color, fontSize: '0.62rem', fontWeight: 700, textAlign: 'right' }}>{prefix}{value}</Typography>
    </Box>
  );
}

export function FinanceOverviewTab({ gameData, overview, suggestions, formatMoney }) {
  const {
    totalWage,
    sponsorIncomePerRound,
    tvIncome,
    ticketIncome,
    avgRealTicket,
    recurringOpCost,
    totalIncome,
    totalExpense,
    estimatedBalance,
    summary,
    projectedMatch,
    operationalChargeNext,
  } = overview;

  const fees = summary.training + summary.stadium + summary.market + summary.academy + summary.medical + summary.contracts;
  const transferBalance = summary.transfersIn - summary.transfersOut;

  return (
    <Box>
      {operationalChargeNext && (
        <Box sx={{ mb: 1.2, px: 1.2, py: 0.8, bgcolor: `${C.blue}08`, border: `1px solid ${C.blue}25`, borderRadius: '8px', display: 'flex', gap: 0.8, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>🏢</Typography>
          <Box>
            <Typography sx={{ color: C.ink2, fontWeight: 900, fontSize: '0.64rem', lineHeight: 1 }}>Custos Operacionais</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.56rem', fontWeight: 700 }}>Manutenção do estádio e staff — cobrado a cada 4 rodadas</Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>FLUXO ESTIMADO POR RODADA</Typography>
        <Box sx={{ bgcolor: `${C.gold}20`, border: `1px solid ${C.gold}40`, borderRadius: '5px', px: 0.7, py: 0.2 }}>
          <Typography sx={{ color: C.gold, fontSize: '0.48rem', fontWeight: 900 }}>⚠️ ESTIMATIVA</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mb: 1.5 }}>
        <Paper sx={{ bgcolor: C.card, p: 1.4, borderRadius: '12px', borderTop: `3px solid ${C.green}`, border: `1px solid ${C.bord2}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
            <Typography sx={{ fontSize: '1rem' }}>📈</Typography>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.78rem' }}>RECEITAS</Typography>
          </Box>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem', mb: 0.8 }}>+{formatMoney(totalIncome)}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <MoneyLine label="📺 TV/Cota" value={formatMoney(tvIncome)} />
            <MoneyLine label="🤝 Patrocínios" value={sponsorIncomePerRound > 0 ? formatMoney(sponsorIncomePerRound) : '—'} color={sponsorIncomePerRound > 0 ? C.txt1 : C.txt3} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Box>
                <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>🏟️ Bilheteria</Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.48rem' }}>
                  {projectedMatch
                    ? (projectedMatch.userIsHome ? 'Próximo jogo em casa' : 'Cota de visitante no próximo jogo')
                    : (avgRealTicket !== null ? 'Média real usada na projeção' : 'Sem partida projetável')}
                </Typography>
              </Box>
              <Typography sx={{ color: C.txt1, fontSize: '0.62rem', fontWeight: 700 }}>{formatMoney(ticketIncome)}</Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ bgcolor: C.card, p: 1.4, borderRadius: '12px', borderTop: `3px solid ${C.red}`, border: `1px solid ${C.bord2}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
            <Typography sx={{ fontSize: '1rem' }}>📉</Typography>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.78rem' }}>DESPESAS</Typography>
          </Box>
          <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '1.1rem', mb: 0.8 }}>-{formatMoney(totalExpense)}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <MoneyLine label="👥 Salários/rod" value={formatMoney(totalWage)} />
            <MoneyLine label="🏢 Operacional/rod (média)" value={formatMoney(recurringOpCost)} />
            {summary.transfersOut > 0 && <MoneyLine label="🛒 Compras (acum.)" value={formatMoney(summary.transfersOut)} color={C.red} prefix="-" />}
            {fees > 0 && <MoneyLine label="⚙️ Outras despesas (acum.)" value={formatMoney(fees)} color={C.red} prefix="-" />}
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ bgcolor: C.card, borderRadius: '12px', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${estimatedBalance >= 0 ? C.green : C.red}`, boxShadow: `0 4px 15px ${estimatedBalance >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`, mb: 1.5 }}>
        <Box>
          <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>SALDO ESTIMADO/RODADA</Typography>
          <Typography sx={{ color: estimatedBalance >= 0 ? C.green : C.red, fontWeight: 900, fontSize: '1.4rem', mt: 0.2 }}>
            {estimatedBalance >= 0 ? '+' : ''}{formatMoney(estimatedBalance)}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '2.2rem', opacity: 0.8 }}>{estimatedBalance >= 0 ? '🤑' : '😰'}</Typography>
      </Paper>

      {(summary.transfersIn > 0 || summary.transfersOut > 0) && (
        <Paper sx={{ bgcolor: C.card, borderRadius: '12px', p: 1.2, border: `1px solid ${C.bord2}`, mb: 1.5 }}>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1, mb: 0.8 }}>💱 TRANSFERÊNCIAS (ACUMULADO)</Typography>
          {summary.transfersIn > 0 && <MoneyLine label="⬆️ Vendas de jogadores" value={formatMoney(summary.transfersIn)} color={C.green} prefix="+" />}
          {summary.transfersOut > 0 && <MoneyLine label="⬇️ Compras de jogadores" value={formatMoney(summary.transfersOut)} color={C.red} prefix="-" />}
          <Box sx={{ mt: 0.8, pt: 0.8, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 900 }}>Saldo transferências</Typography>
            <Typography sx={{ color: transferBalance >= 0 ? C.green : C.red, fontSize: '0.65rem', fontWeight: 900 }}>
              {transferBalance >= 0 ? '+' : ''}{formatMoney(transferBalance)}
            </Typography>
          </Box>
        </Paper>
      )}

      {suggestions.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1.5, mb: 1 }}>📬 DIRETOR FINANCEIRO</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {suggestions.map((message) => {
              const severity = getSuggestionSeverity(message);
              return (
                <Alert key={message} severity={severity} sx={{ bgcolor: C.cardAlt, color: C.txt1, border: `1px solid ${C.bord2}`, '& .MuiAlert-icon': { color: severity === 'error' ? C.red : C.primary }, py: 0.2 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{message}</Typography>
                </Alert>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default FinanceOverviewTab;

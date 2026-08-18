import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME as C } from '../../theme.js';

const TABS = [
  { id: 0, label: 'Resumo', icon: '📊' },
  { id: 1, label: 'Extrato', icon: '🧾' },
  { id: 2, label: 'Acordos', icon: '🤝' },
  { id: 3, label: 'Evolução', icon: '📈' },
];

export function FinanceHeader({ gameData, overview, formatMoney, currentTab, onTabChange }) {
  const { totalWage, estimatedBalance, status, currentLeagueRound } = overview;
  const riskColor = status?.status === 'critico'
    ? C.red
    : status?.status === 'alerta'
      ? C.orange
      : C.gold;

  return (
    <>
      <Box sx={{
        background: 'linear-gradient(180deg, #ddc9a8 0%, #e8d9bf 100%)',
        borderBottom: `1px solid ${C.border}`,
        px: 1.5,
        pt: 3.8,
        pb: 1.4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Typography sx={{ position: 'absolute', right: -10, top: -5, fontSize: '7rem', opacity: 0.04, lineHeight: 1, pointerEvents: 'none' }}>💰</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '10px', flexShrink: 0, bgcolor: `${C.teal}15`, border: `1.5px solid ${C.teal}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>💰</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1, letterSpacing: 0.5 }}>FINANÇAS</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>{gameData?.club?.name}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ color: C.txt3, fontSize: '0.48rem', fontWeight: 700, letterSpacing: 0.5 }}>SALDO</Typography>
            <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.1 }}>{formatMoney(gameData?.club?.money || 0)}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.7 }}>
          {[
            { label: 'FOLHA SALARIAL', value: formatMoney(totalWage), color: C.red },
            { label: 'SALDO EST./ROD', value: formatMoney(estimatedBalance), color: estimatedBalance >= 0 ? C.green : C.red },
            { label: 'ORÇ. TRANSF.', value: formatMoney(gameData?.club?.transferBudget || 0), color: C.blue },
          ].map((item) => (
            <Box key={item.label} sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '8px', px: 0.8, py: 0.65, textAlign: 'center' }}>
              <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>{item.value}</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.15, letterSpacing: 0.3 }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {currentLeagueRound > 30 && (
          <Box sx={{ mt: 0.8, bgcolor: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: '8px', px: 1.2, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <Typography sx={{ fontSize: '0.8rem' }}>📈</Typography>
            <Typography sx={{ color: C.yellow, fontWeight: 700, fontSize: '0.58rem' }}>
              Na virada de temporada, salários sobem +8% (inflação do mercado). Planeje o orçamento.
            </Typography>
          </Box>
        )}
      </Box>

      {status && status.status !== 'saudavel' && (
        <Box sx={{ mx: 1.5, mt: 1.5, px: 1.4, py: 1, bgcolor: `${riskColor}12`, border: `1.5px solid ${riskColor}50`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.2rem', lineHeight: 1, flexShrink: 0 }}>
            {status.status === 'critico' ? '🚨' : status.status === 'alerta' ? '⚠️' : '💡'}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: riskColor, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>{status.label}</Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.58rem', fontWeight: 700, mt: 0.2 }}>
              {status.runway >= 999
                ? 'Receitas fixas cobrem os custos recorrentes, mas o caixa atual exige atenção.'
                : `Saldo cobre aprox. ${status.runway} rodada${status.runway !== 1 ? 's' : ''} do déficit recorrente.`}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', bgcolor: C.card, mt: 1.5, mx: 1.5, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
        {TABS.map((tab) => (
          <Box
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            sx={{
              flex: 1,
              py: 1.1,
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.4,
              borderBottom: currentTab === tab.id ? `2.5px solid ${C.teal}` : '2.5px solid transparent',
              bgcolor: currentTab === tab.id ? `${C.teal}0d` : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <Typography sx={{ fontSize: '1.1rem', opacity: currentTab === tab.id ? 1 : 0.45 }}>{tab.icon}</Typography>
            <Typography sx={{ color: currentTab === tab.id ? C.teal : C.txt3, fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>{tab.label}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

export default FinanceHeader;

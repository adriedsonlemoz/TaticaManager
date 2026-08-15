// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { FinanceEngine } from '../engines/engine_finances.js';

// components/ScreenFinances.js — v7.0
// ─────────────────────────────────────────────────────────────────────────────
// CORREÇÕES v7:
//  Bug 1: handleSignSponsor usava formato legado → nunca somava em totals.sponsor (tab 3)
//  Bug 2: financialHistory limitado a 20 → perdía histórico (fix em hooks_simulation)
//  Bug 3: aba Resumo não indicava que valores são estimativas
//  Bug 4: compras, vendas, treinamento, estádio e mercado não apareciam no resumo
//  Bug 5: C.dark usado mas não definido → bgcolor transparente no header do extrato
//  Bug 7: card DESPESAS só listava salários, ignorava outros gastos reais
//  Bug 9: bilheteria estimada sem indicação visual
// ─────────────────────────────────────────────────────────────────────────────

const ScreenFinances = ({ gameData, setGameData, formatMoney, showToast }) => {
  const [currentTab, setCurrentTab] = React.useState(0);

  const sponsors   = gameData?.club?.sponsors || { master: null, stadium: null };
  const history    = gameData?.financialHistory || [];
  const players    = gameData?.players || [];
  const totalWage  = players.reduce((s, p) => s + (p.wage || 0), 0);
  const dicas      = window.getFinancialSuggestions ? window.getFinancialSuggestions(gameData) : [];

  const stad = gameData?.club?.stadium || { capacity: 15000, ticketPrice: 40 };
  const sponsorIncomePerRound = (sponsors.master?.roundValue || 0) + (sponsors.stadium?.roundValue || 0);
  const tvMap = { A: 400000, B: 280000, C: 90000, D: 55000 };
  const tvIncome = tvMap[gameData?.serie] || 6000;
  const ticketIncome = (stad.ticketPrice || 40) * Math.floor((stad.capacity || 15000) * 0.75);
  const totalIncome  = tvIncome + sponsorIncomePerRound + ticketIncome;
  const bal          = totalIncome - totalWage;

  // Média real de bilheteria do histórico (quando disponível)
  const realTicketEntries = history.filter(h => h.detail?.ticket > 0);
  const avgRealTicket = realTicketEntries.length > 0
    ? Math.round(realTicketEntries.reduce((s, h) => s + (h.detail.ticket || 0), 0) / realTicketEntries.length)
    : null;

  const [offers] = React.useState(() => {
    // Luvas (assinatura) e valor por rodada escalados por série e força do clube
    const serie = gameData?.serie || 'A';
    const str   = gameData?.club?.strength || 70;
    const mult  = str / 70; // fator força

    const baseLuvas = { A: 30_000_000, B: 3_000_000, C: 500_000, D: 100_000 }[serie] || 100_000;
    const baseRound = { A: 800_000,    B: 100_000,   C: 20_000,  D: 10_000  }[serie] || 10_000;

    // Pool completo de patrocinadores máster por série
    const masterPool = {
      A: [
        { name: 'PixBet',         color: '#16a34a', lf: 1.15, rf: 1.30 },
        { name: 'Betano',         color: '#00a859', lf: 1.10, rf: 1.20 },
        { name: 'Banco BMG',      color: '#ff6600', lf: 1.00, rf: 1.00 },
        { name: 'Mercado Livre',  color: '#f5a623', lf: 1.05, rf: 1.10 },
        { name: 'Itaú',           color: '#003d8f', lf: 1.20, rf: 1.40 },
        { name: 'Bradesco',       color: '#cc0000', lf: 1.18, rf: 1.35 },
        { name: 'Caixa',          color: '#005b9a', lf: 1.08, rf: 1.15 },
        { name: 'Claro',          color: '#e4003a', lf: 1.02, rf: 1.05 },
        { name: 'Vivo',           color: '#660099', lf: 0.98, rf: 1.00 },
        { name: 'Ambev',          color: '#f7b500', lf: 1.12, rf: 1.25 },
        { name: 'Petrobras',      color: '#009b3a', lf: 1.10, rf: 1.20 },
        { name: 'Vale',           color: '#005ca9', lf: 1.05, rf: 1.10 },
      ],
      B: [
        { name: 'Betnacional',    color: '#f97316', lf: 1.10, rf: 1.20 },
        { name: 'Esportes da Sorte', color: '#16a34a', lf: 1.05, rf: 1.10 },
        { name: 'Estrela Bet',    color: '#f59e0b', lf: 0.95, rf: 1.00 },
        { name: 'Banco do Brasil',color: '#f7b500', lf: 1.20, rf: 1.30 },
        { name: 'Sicredi',        color: '#006400', lf: 1.00, rf: 1.05 },
        { name: 'Tim',            color: '#003087', lf: 0.90, rf: 0.95 },
        { name: 'Oi',             color: '#7b2d8b', lf: 0.85, rf: 0.90 },
        { name: 'OdontoGroup',    color: '#0e7490', lf: 1.02, rf: 1.08 },
      ],
      C: [
        { name: 'BetFair',        color: '#f97316', lf: 1.10, rf: 1.15 },
        { name: 'VarBet',         color: '#16a34a', lf: 0.95, rf: 1.00 },
        { name: 'Coop',           color: '#006400', lf: 1.05, rf: 1.10 },
        { name: 'Sicredi',        color: '#006400', lf: 1.00, rf: 1.05 },
        { name: 'Planium',        color: '#0e7490', lf: 0.90, rf: 0.95 },
        { name: "Rede D'Or",     color: '#cc0000', lf: 1.02, rf: 1.08 },
      ],
      D: [
        { name: 'SuperBet',       color: '#f59e0b', lf: 1.10, rf: 1.15 },
        { name: 'LotoFácil',      color: '#16a34a', lf: 1.00, rf: 1.05 },
        { name: 'Unimed Local',   color: '#006400', lf: 0.95, rf: 1.00 },
        { name: 'Sicoob',         color: '#003087', lf: 1.05, rf: 1.08 },
        { name: 'FarmaTotal',     color: '#e4003a', lf: 0.90, rf: 0.95 },
        { name: 'BetRegional',    color: '#7b2d8b', lf: 0.85, rf: 0.90 },
      ],
    };

    const stadiumPool = {
      A: [
        { name: 'Allianz',       color: '#0038a8', lf: 0.75, rf: 0.80 },
        { name: 'Neo Química',   color: '#0d4aab', lf: 0.80, rf: 0.85 },
        { name: 'Ligga',         color: '#941818', lf: 0.85, rf: 0.90 },
        { name: 'MRV',           color: '#e4003a', lf: 0.70, rf: 0.75 },
        { name: 'BRB',           color: '#003087', lf: 0.78, rf: 0.82 },
        { name: 'Minha Casa',    color: '#f7b500', lf: 0.72, rf: 0.78 },
      ],
      B: [
        { name: 'VaideBet',      color: '#941818', lf: 0.75, rf: 0.80 },
        { name: 'CondoBet',      color: '#16a34a', lf: 0.70, rf: 0.75 },
        { name: 'Paraná Bet',    color: '#003087', lf: 0.80, rf: 0.85 },
        { name: 'Nordeste Play', color: '#f97316', lf: 0.72, rf: 0.78 },
      ],
      C: [
        { name: 'Arena Bet',     color: '#f97316', lf: 0.70, rf: 0.75 },
        { name: 'TotoArena',     color: '#16a34a', lf: 0.75, rf: 0.80 },
        { name: 'GolArena',      color: '#0038a8', lf: 0.65, rf: 0.72 },
      ],
      D: [
        { name: 'EstádioPlus',   color: '#6b7280', lf: 0.70, rf: 0.75 },
        { name: 'ArenaLocal',    color: '#374151', lf: 0.65, rf: 0.70 },
        { name: 'CampoBet',      color: '#16a34a', lf: 0.75, rf: 0.80 },
      ],
    };

    const pick = (pool, n) => (pool[serie] || pool.D)
      .map(p => ({
        name:     p.name,
        val:      Math.floor(baseLuvas * mult * p.lf / 50000) * 50000,
        roundVal: Math.max(10000, Math.floor(baseRound * mult * p.rf / 1000) * 1000),
        color:    p.color,
      }))
      .sort(() => Math.random() - 0.5)
      .slice(0, n);

    return { master: pick(masterPool, 3), stadium: pick(stadiumPool, 3) };
  });

  // BUG 1 FIX: usar formato novo com detail.sponsor para somar corretamente no resumo da temporada
  const handleSignSponsor = (type, offer) => {
    setGameData(prev => {
      const transaction = {
        round:   prev.round,
        income:  offer.val,
        expense: 0,
        total:   offer.val,
        detail: {
          description: `Luvas: Patrocínio ${type === 'master' ? 'Máster' : 'Estádio'} (${offer.name})`,
          sponsor:     offer.val,
        },
      };
      return {
        ...prev,
        club: {
          ...prev.club,
          money: (prev.club.money || 0) + offer.val,
          sponsors: {
            ...(prev.club.sponsors || {}),
            [type]: { name: offer.name, value: offer.val, roundValue: offer.roundVal, signedRound: prev.round, color: offer.color },
          },
        },
        financialHistory: [transaction, ...(prev.financialHistory || [])].slice(0, 100),
      };
    });
    showToast(`Contrato assinado com ${offer.name}! +${formatMoney(offer.val)} em caixa.`);
  };

  const dicaSeverity = (d) => {
    if (d.includes('crítico') || d.includes('insuficient')) return 'error';
    if (d.includes('pesada')  || d.includes('caro'))        return 'warning';
    if (d.includes('estável') || d.includes('Bom trabalho'))return 'success';
    return 'info';
  };

  const C = THEME;

  const TabBtn = ({ id, label, icon }) => (
    <Box onClick={() => setCurrentTab(id)} sx={{
      flex: 1, py: 1.1, textAlign: 'center', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4,
      borderBottom: currentTab === id ? `2.5px solid ${C.teal}` : '2.5px solid transparent',
      bgcolor: currentTab === id ? `${C.teal}0d` : 'transparent',
      transition: 'all 0.2s',
    }}>
      <Typography sx={{ fontSize: '1.1rem', opacity: currentTab === id ? 1 : 0.45 }}>{icon}</Typography>
      <Typography sx={{ color: currentTab === id ? C.teal : C.txt3, fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
    </Box>
  );

  // BUG 4 FIX: calcular totais de transferências e outras despesas do histórico
  const transferSummary = React.useMemo(() => {
    const totals = {
      transfersIn: 0, transfersOut: 0,
      training: 0, stadium: 0, market: 0,
      ticket: 0, tv: 0, sponsor: 0, cup: 0, wage: 0, opCost: 0,
    };
    history.forEach(h => {
      if (h.detail) {
        totals.ticket  += h.detail.ticket  || 0;
        totals.tv      += h.detail.tv      || 0;
        totals.sponsor += h.detail.sponsor || 0;
        totals.cup     += h.detail.cup     || 0;
        // v3: wage e opCost agora vêm diretamente do detail
        totals.wage    += h.detail.wage    || 0;
        totals.opCost  += h.detail.opCost  || 0;
        const desc = h.detail.description || '';
        if (desc.includes('Venda:') || desc.includes('Venda →'))
          totals.transfersIn  += h.income || 0;
        else if (desc.includes('Compra:'))
          totals.transfersOut += h.expense || Math.abs(h.total || 0);
        else if (desc.includes('Treinamento'))
          totals.training     += h.expense || 0;
        else if (desc.includes('Estádio') || desc.includes('Obras'))
          totals.stadium      += h.expense || 0;
        else if (desc.includes('Mercado'))
          totals.market       += h.expense || 0;
        // despesas genéricas sem description (legado pré-v3)
        else if (!h.detail.wage && !h.detail.opCost && h.expense > 0)
          totals.wage += h.expense;
      } else {
        // formato muito antigo (sem detail)
        if (h.isPositive) {
          const desc = h.description || '';
          if (desc.includes('Venda')) totals.transfersIn += h.value || 0;
          else if (desc.includes('Patrocínio')) totals.sponsor += h.value || 0;
        } else {
          const desc = h.description || '';
          if (desc.includes('Compra')) totals.transfersOut += h.value || 0;
          else totals.wage += h.value || 0;
        }
      }
    });
    return totals;
  }, [history]);

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 12 }}>

      {/* HEADER */}
      <Box sx={{
        background: 'linear-gradient(180deg, #ddc9a8 0%, #e8d9bf 100%)',
        borderBottom: `1px solid ${C.border}`,
        px: 1.5, pt: 3.8, pb: 1.4,
        position: 'relative', overflow: 'hidden',
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
            { l: 'FOLHA SALARIAL',  v: formatMoney(gameData?.club?.wage || totalWage), c: C.red },
            { l: 'SALDO EST./ROD',  v: formatMoney(bal), c: bal >= 0 ? C.green : C.red },
            { l: 'ORÇ. TRANSF.',   v: formatMoney(gameData?.club?.transferBudget || 0), c: C.blue },
          ].map((s, i) => (
            <Box key={i} sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '8px', px: 0.8, py: 0.65, textAlign: 'center' }}>
              <Typography sx={{ color: s.c, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.15, letterSpacing: 0.3 }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>
        {/* Aviso de inflação salarial na virada */}
        {gameData.round > 30 && (
          <Box sx={{ mt: 0.8, bgcolor: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: '8px', px: 1.2, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <Typography sx={{ fontSize: '0.8rem' }}>📈</Typography>
            <Typography sx={{ color: C.yellow, fontWeight: 700, fontSize: '0.58rem' }}>
              Na virada de temporada, salários sobem +8% (inflação do mercado). Planeje o orçamento.
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Banner diagnóstico financeiro (#65) ── */}
      {(() => {
        const status = window.FinanceEngine?.getFinancialStatus
          ? window.FinanceEngine.getFinancialStatus(gameData)
          : null;
        if (!status || status.status === 'saudavel') return null;
        const bColor = status.status === 'critico' ? C.red
          : status.status === 'alerta' ? C.orange
          : C.gold;
        return (
          <Box sx={{
            mx: 1.5, mt: 1.5, px: 1.4, py: 1,
            bgcolor: `${bColor}12`, border: `1.5px solid ${bColor}50`,
            borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Typography sx={{ fontSize: '1.2rem', lineHeight: 1, flexShrink: 0 }}>
              {status.status === 'critico' ? '🚨' : status.status === 'alerta' ? '⚠️' : '💡'}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: bColor, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>
                {status.label}
              </Typography>
              <Typography sx={{ color: C.txt2, fontSize: '0.58rem', fontWeight: 700, mt: 0.2 }}>
                Saldo cobre aprox. {status.runway} rodada{status.runway !== 1 ? 's' : ''} de salários
              </Typography>
            </Box>
          </Box>
        );
      })()}

      {/* ABAS */}
      <Box sx={{ display: 'flex', bgcolor: C.card, mt: 1.5, mx: 1.5, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <TabBtn id={0} label="Resumo"   icon="📊" />
        <TabBtn id={1} label="Extrato"  icon="🧾" />
        <TabBtn id={2} label="Acordos"  icon="🤝" />
        <TabBtn id={3} label="Evolução" icon="📈" />
      </Box>

      <Box sx={{ px: 1.5, mt: 2 }}>

        {/* ── ABA 0: RESUMO ── */}
        {currentTab === 0 && (
          <Box>
            {/* Custos operacionais (#49): a cada 4 rodadas */}
            {gameData.round > 0 && (gameData.round % 4 === 0 || (gameData.round + 1) % 4 === 0) && (
              <Box sx={{ mb: 1.2, px: 1.2, py: 0.8, bgcolor: `${C.blue}08`,
                border: `1px solid ${C.blue}25`, borderRadius: '8px',
                display: 'flex', gap: 0.8, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.9rem' }}>🏢</Typography>
                <Box>
                  <Typography sx={{ color: C.ink2, fontWeight: 900, fontSize: '0.64rem', lineHeight: 1 }}>
                    Custos Operacionais
                  </Typography>
                  <Typography sx={{ color: C.txt3, fontSize: '0.56rem', fontWeight: 700 }}>
                    Manutenção do estádio e staff — cobrado a cada 4 rodadas
                  </Typography>
                </Box>
              </Box>
            )}
            {/* BUG 3 + 9 FIX: indicar claramente que são estimativas */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>
                FLUXO ESTIMADO POR RODADA
              </Typography>
              <Box sx={{ bgcolor: `${C.gold}20`, border: `1px solid ${C.gold}40`, borderRadius: '5px', px: 0.7, py: 0.2 }}>
                <Typography sx={{ color: C.gold, fontSize: '0.48rem', fontWeight: 900 }}>⚠️ ESTIMATIVA</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mb: 1.5 }}>
              {/* Receitas */}
              <Paper sx={{ bgcolor: C.card, p: 1.4, borderRadius: '12px', borderTop: `3px solid ${C.green}`, border: `1px solid ${C.bord2}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                  <Typography sx={{ fontSize: '1rem' }}>📈</Typography>
                  <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.78rem' }}>RECEITAS</Typography>
                </Box>
                <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem', mb: 0.8 }}>+{formatMoney(totalIncome)}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>📺 TV/Cota</Typography>
                    <Typography sx={{ color: C.txt1, fontSize: '0.62rem', fontWeight: 700 }}>{formatMoney(tvIncome)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>🤝 Patrocínios</Typography>
                    <Typography sx={{ color: sponsorIncomePerRound > 0 ? C.txt1 : C.txt3, fontSize: '0.62rem', fontWeight: 700 }}>
                      {sponsorIncomePerRound > 0 ? formatMoney(sponsorIncomePerRound) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>🏟️ Bilheteria</Typography>
                      {avgRealTicket && (
                        <Typography sx={{ color: C.txt3, fontSize: '0.48rem' }}>
                          Real (média): {formatMoney(avgRealTicket)}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{ color: C.txt1, fontSize: '0.62rem', fontWeight: 700 }}>{formatMoney(ticketIncome)}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* BUG 7 FIX: card Despesas com outros gastos do histórico */}
              <Paper sx={{ bgcolor: C.card, p: 1.4, borderRadius: '12px', borderTop: `3px solid ${C.red}`, border: `1px solid ${C.bord2}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                  <Typography sx={{ fontSize: '1rem' }}>📉</Typography>
                  <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.78rem' }}>DESPESAS</Typography>
                </Box>
                <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '1.1rem', mb: 0.8 }}>-{formatMoney(totalWage)}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>👥 Salários/rod</Typography>
                    <Typography sx={{ color: C.txt1, fontSize: '0.62rem', fontWeight: 700 }}>{formatMoney(totalWage)}</Typography>
                  </Box>
                  {transferSummary.transfersOut > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>🛒 Compras (acum.)</Typography>
                      <Typography sx={{ color: C.red, fontSize: '0.62rem', fontWeight: 700 }}>-{formatMoney(transferSummary.transfersOut)}</Typography>
                    </Box>
                  )}
                  {(transferSummary.training + transferSummary.stadium + transferSummary.market) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem' }}>⚙️ Taxas (acum.)</Typography>
                      <Typography sx={{ color: C.red, fontSize: '0.62rem', fontWeight: 700 }}>
                        -{formatMoney(transferSummary.training + transferSummary.stadium + transferSummary.market)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

            {/* Saldo estimado */}
            <Paper sx={{
              bgcolor: C.card, borderRadius: '12px', p: 1.5,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: `1px solid ${bal >= 0 ? C.green : C.red}`,
              boxShadow: `0 4px 15px ${bal >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`,
              mb: 1.5,
            }}>
              <Box>
                <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>SALDO ESTIMADO/RODADA</Typography>
                <Typography sx={{ color: bal >= 0 ? C.green : C.red, fontWeight: 900, fontSize: '1.4rem', mt: 0.2 }}>
                  {bal >= 0 ? '+' : ''}{formatMoney(bal)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '2.2rem', opacity: 0.8 }}>{bal >= 0 ? '🤑' : '😰'}</Typography>
            </Paper>

            {/* Receitas de transferências no histórico */}
            {transferSummary.transfersIn > 0 && (
              <Paper sx={{ bgcolor: C.card, borderRadius: '12px', p: 1.2, border: `1px solid ${C.bord2}`, mb: 1.5 }}>
                <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1, mb: 0.8 }}>
                  💱 TRANSFERÊNCIAS (ACUMULADO)
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                  <Typography sx={{ color: C.txt2, fontSize: '0.65rem' }}>⬆️ Vendas de jogadores</Typography>
                  <Typography sx={{ color: C.green, fontSize: '0.65rem', fontWeight: 700 }}>+{formatMoney(transferSummary.transfersIn)}</Typography>
                </Box>
                {transferSummary.transfersOut > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: C.txt2, fontSize: '0.65rem' }}>⬇️ Compras de jogadores</Typography>
                    <Typography sx={{ color: C.red, fontSize: '0.65rem', fontWeight: 700 }}>-{formatMoney(transferSummary.transfersOut)}</Typography>
                  </Box>
                )}
                <Box sx={{ mt: 0.8, pt: 0.8, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 900 }}>Saldo transferências</Typography>
                  <Typography sx={{
                    color: (transferSummary.transfersIn - transferSummary.transfersOut) >= 0 ? C.green : C.red,
                    fontSize: '0.65rem', fontWeight: 900,
                  }}>
                    {(transferSummary.transfersIn - transferSummary.transfersOut) >= 0 ? '+' : ''}
                    {formatMoney(transferSummary.transfersIn - transferSummary.transfersOut)}
                  </Typography>
                </Box>
              </Paper>
            )}

            {dicas.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1.5, mb: 1 }}>📬 DIRETOR FINANCEIRO</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {dicas.map((d, i) => (
                    <Alert key={i} severity={dicaSeverity(d)} sx={{ bgcolor: C.cardAlt, color: C.txt1, border: `1px solid ${C.bord2}`, '& .MuiAlert-icon': { color: dicaSeverity(d) === 'error' ? C.red : C.primary }, py: 0.2 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{d}</Typography>
                    </Alert>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ── ABA 1: EXTRATO ── */}
        {currentTab === 1 && (
          <Paper sx={{ bgcolor: C.card, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.bord2}` }}>
            {/* BUG 5 FIX: usar C.dark definido */}
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
                {history.map((h, i) => {
                  const isNew = h.detail !== undefined || h.income !== undefined;
                  let descricao, balanceVal, isPos, icon;

                  if (isNew) {
                    const desc     = h.detail?.description || '';
                    const income   = h.income  || 0;
                    const expense  = h.expense || 0;
                    balanceVal     = h.total ?? (income - expense);
                    isPos          = balanceVal >= 0;
                    descricao      = desc || (income > 0 ? `Receita · Rodada ${h.round||'?'}` : `Despesa · Rodada ${h.round||'?'}`);
                    if (desc.includes('Venda'))                                         icon = '🤝';
                    else if (desc.includes('Compra'))                                   icon = '🛒';
                    else if (desc.includes('Patrocínio') || desc.includes('Luvas'))     icon = '✍️';
                    else if (desc.includes('Treinamento'))                              icon = '🏋️';
                    else if (desc.includes('Estádio') || desc.includes('Obras'))        icon = '🏟️';
                    else if (desc.includes('Mercado'))                                  icon = '🔄';
                    else if (desc.includes('Copa') || desc.includes('Libertadores') || desc.includes('Sul-Americana')) icon = '🏆';
                    else if (income > 0 && (h.detail?.ticket || h.detail?.tv || h.detail?.sponsor)) icon = '📅';
                    else icon = '💰';
                    // Se for fechamento de rodada, mostrar breakdown
                    if (!desc && income > 0) {
                      const parts = [];
                      if (h.detail?.tv)      parts.push(`TV: ${formatMoney(h.detail.tv)}`);
                      if (h.detail?.ticket)  parts.push(`Bil.: ${formatMoney(h.detail.ticket)}`);
                      if (h.detail?.sponsor) parts.push(`Pat.: ${formatMoney(h.detail.sponsor)}`);
                      if (h.detail?.cup)     parts.push(`Copa: ${formatMoney(h.detail.cup)}`);
                      if (parts.length) descricao = `Fechamento Rod. ${h.round||'?'} · ${parts.join(' · ')}`;
                    }
                  } else {
                    balanceVal = h.value || 0;
                    isPos      = h.isPositive;
                    descricao  = h.description || `Rodada ${h.round||'?'}`;
                    if (descricao.includes('Venda'))          icon = '🤝';
                    else if (descricao.includes('Compra'))    icon = '🛒';
                    else if (descricao.includes('Patrocínio'))icon = '✍️';
                    else if (descricao.includes('Treinamento'))icon = '🏋️';
                    else if (descricao.includes('Estádio'))   icon = '🏟️';
                    else icon = '🔄';
                  }

                  return (
                    <Box key={i} sx={{
                      display: 'flex', alignItems: 'center', px: 1.4, py: 1,
                      borderBottom: `1px solid ${C.bord2}`,
                      bgcolor: i % 2 === 0 ? C.card : C.cardAlt,
                      borderLeft: `3px solid ${isPos ? C.green : C.red}`,
                    }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', mr: 1.2, flexShrink: 0 }}>
                        {icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ color: C.txt1, fontWeight: 700, fontSize: '0.72rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {descricao}
                        </Typography>
                        <Typography sx={{ color: C.txt3, fontSize: '0.54rem', mt: 0.1 }}>Rodada {h.round||'?'}</Typography>
                      </Box>
                      <Typography sx={{ color: isPos ? C.green : C.red, fontWeight: 900, fontSize: '0.82rem', flexShrink: 0, ml: 0.8 }}>
                        {isPos ? '+' : '-'}{formatMoney(Math.abs(balanceVal))}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        )}

        {/* ── ABA 2: ACORDOS ── */}
        {currentTab === 2 && (
          <Box>
            <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 1.5, mb: 1 }}>DEPARTAMENTO COMERCIAL</Typography>

            <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1, mb: 0.5 }}>MÁSTER (CAMISA)</Typography>
            {sponsors.master ? (
              <Paper sx={{ p: 1.8, borderRadius: '12px', bgcolor: C.cardAlt, border: `2px solid ${sponsors.master.color || C.primary}`, position: 'relative', overflow: 'hidden', mb: 2 }}>
                <Box sx={{ position: 'absolute', right: -20, top: -10, opacity: 0.08 }}><Typography sx={{ fontSize: '6rem' }}>👕</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem' }}>{sponsors.master.name}</Typography>
                  <Box sx={{ bgcolor: C.green, color: '#fff', px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>ATIVO</Box>
                </Box>
                <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.88rem' }}>
                  +{formatMoney(sponsors.master.roundValue)}<Typography component="span" sx={{ fontSize: '0.58rem', color: C.txt2 }}> /rodada</Typography>
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {offers.master.map((offer, idx) => (
                  <Paper key={idx} sx={{ p: 1.4, borderRadius: '12px', bgcolor: C.card, border: `1px solid ${C.bord2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: offer.color || C.txt1, fontWeight: 900, fontSize: '0.92rem' }}>{offer.name}</Typography>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700, mt: 0.2 }}>Luvas: <span style={{color: C.green}}>+{formatMoney(offer.val)}</span></Typography>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700 }}>Por rodada: <span style={{color: C.green}}>+{formatMoney(offer.roundVal)}</span></Typography>
                    </Box>
                    <Button variant="contained" onClick={() => handleSignSponsor('master', offer)} sx={{ bgcolor: C.primary, color: '#fff', fontWeight: 900, fontSize: '0.68rem', '&:hover': { bgcolor: C.prim2 } }}>Assinar</Button>
                  </Paper>
                ))}
              </Box>
            )}

            <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1, mb: 0.5, mt: 1.5 }}>NAMING RIGHTS (ESTÁDIO)</Typography>
            {sponsors.stadium ? (
              <Paper sx={{ p: 1.8, borderRadius: '12px', bgcolor: C.cardAlt, border: `2px solid ${sponsors.stadium.color || C.primary}`, position: 'relative', overflow: 'hidden', mb: 2 }}>
                <Box sx={{ position: 'absolute', right: -20, top: -10, opacity: 0.08 }}><Typography sx={{ fontSize: '6rem' }}>🏟️</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem' }}>Arena {sponsors.stadium.name}</Typography>
                  <Box sx={{ bgcolor: C.green, color: '#fff', px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.55rem', fontWeight: 900 }}>ATIVO</Box>
                </Box>
                <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.88rem' }}>
                  +{formatMoney(sponsors.stadium.roundValue)}<Typography component="span" sx={{ fontSize: '0.58rem', color: C.txt2 }}> /rodada</Typography>
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {offers.stadium.map((offer, idx) => (
                  <Paper key={idx} sx={{ p: 1.4, borderRadius: '12px', bgcolor: C.card, border: `1px solid ${C.bord2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ color: offer.color || C.txt1, fontWeight: 900, fontSize: '0.92rem' }}>{offer.name}</Typography>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700, mt: 0.2 }}>Luvas: <span style={{color: C.green}}>+{formatMoney(offer.val)}</span></Typography>
                      <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700 }}>Por rodada: <span style={{color: C.green}}>+{formatMoney(offer.roundVal)}</span></Typography>
                    </Box>
                    <Button variant="outlined" onClick={() => handleSignSponsor('stadium', offer)} sx={{ borderColor: C.primary, color: C.primary, fontWeight: 900, fontSize: '0.68rem' }}>Assinar</Button>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── ABA 3: EVOLUÇÃO ── */}
        {currentTab === 3 && (() => {
          const hist = [...history].reverse();
          if (hist.length === 0) return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📈</Typography>
              <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.85rem' }}>Sem histórico. Jogue algumas rodadas.</Typography>
            </Box>
          );

          const maxAbs = Math.max(...hist.map(h => Math.max(h.income||0, h.expense||0, Math.abs(h.value||0))), 1);

          return (
            <Box>
              {/* Gráfico */}
              <Box sx={{ bgcolor: C.card, border: `1px solid ${C.bord2}`, borderRadius: '12px', overflow: 'hidden', mb: 1.5 }}>
                <Box sx={{ px: 1.5, py: 1, bgcolor: C.dark, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5 }}>📈 EVOLUÇÃO FINANCEIRA</Typography>
                  <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>{hist.length} entradas</Typography>
                </Box>
                <Box sx={{ px: 1, py: 1.5, display: 'flex', alignItems: 'flex-end', gap: '2px', height: 110, overflowX: 'auto' }}>
                  {hist.slice(-30).map((h, i) => {
                    const inc  = h.income  || (h.isPositive ? h.value||0 : 0);
                    const exp  = h.expense || (!h.isPositive ? h.value||0 : 0);
                    const incH = Math.round((inc / maxAbs) * 80);
                    const expH = Math.round((exp / maxAbs) * 80);
                    return (
                      <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', minWidth: 10, flex: 1 }}>
                        <Box sx={{ width: '100%', height: incH, bgcolor: C.green, borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                        <Box sx={{ width: '100%', height: expH, bgcolor: C.red, borderRadius: '0 0 2px 2px', opacity: 0.85 }} />
                        <Typography sx={{ color: C.txt3, fontSize: '0.36rem', mt: 0.2 }}>{h.round||i+1}</Typography>
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ px: 1.5, pb: 1, display: 'flex', gap: 1.5 }}>
                  {[{ color: C.green, label: 'Receita' }, { color: C.red, label: 'Despesa' }].map((l, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: l.color, borderRadius: '2px' }} />
                      <Typography sx={{ color: C.txt2, fontSize: '0.58rem', fontWeight: 700 }}>{l.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* BUG 4 FIX: resumo completo incluindo transferências, taxas, etc. */}
              <Box sx={{ bgcolor: C.card, border: `1px solid ${C.bord2}`, borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ px: 1.5, py: 1, bgcolor: C.dark }}>
                  <Typography sx={{ color: C.teal, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5 }}>💰 RESUMO DA TEMPORADA</Typography>
                </Box>
                <Box sx={{ px: 1.4, py: 0.8 }}>
                  {[
                    { icon: '📅', label: 'Fechamentos de rodada', val: transferSummary.ticket + transferSummary.tv + transferSummary.sponsor + transferSummary.cup, color: C.green, show: true },
                    { icon: '🎟', label: 'Bilheteria total',       val: transferSummary.ticket,       color: C.primary, show: transferSummary.ticket > 0 },
                    { icon: '📺', label: 'Cotas de TV',            val: transferSummary.tv,           color: C.blue,    show: transferSummary.tv > 0 },
                    { icon: '✍️', label: 'Patrocinadores',          val: transferSummary.sponsor,      color: C.gold,    show: transferSummary.sponsor > 0 },
                    { icon: '🏆', label: 'Premiações de copa',      val: transferSummary.cup,          color: C.gold,    show: transferSummary.cup > 0 },
                    { icon: '🤝', label: 'Vendas de jogadores',     val: transferSummary.transfersIn,  color: C.green,   show: transferSummary.transfersIn > 0 },
                    { icon: '🛒', label: 'Compras de jogadores',    val: -transferSummary.transfersOut,color: C.red,     show: transferSummary.transfersOut > 0 },
                    { icon: '🏋️', label: 'Taxas de treinamento',    val: -transferSummary.training,    color: C.red,     show: transferSummary.training > 0 },
                    { icon: '🏟️', label: 'Obras do estádio',        val: -transferSummary.stadium,     color: C.red,     show: transferSummary.stadium > 0 },
                    { icon: '🔄', label: 'Atualização de mercado',  val: -transferSummary.market,      color: C.red,     show: transferSummary.market > 0 },
                    { icon: '💸', label: 'Folha salarial total',    val: -(history.filter(h => !h.detail?.description).reduce((s,h) => s + (h.expense||0), 0) + history.filter(h => h.detail && !h.detail.description).reduce((s,h) => s + (h.expense||0), 0)), color: C.red, show: true },
                  ].filter(r => r.show && r.val !== 0).map((row, i, arr) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.55, borderBottom: i < arr.length-1 ? `1px solid ${C.bord2}` : 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Typography sx={{ fontSize: '0.85rem' }}>{row.icon}</Typography>
                        <Typography sx={{ color: C.txt2, fontSize: '0.7rem', fontWeight: 700 }}>{row.label}</Typography>
                      </Box>
                      <Typography sx={{ color: row.color, fontWeight: 900, fontSize: '0.75rem' }}>
                        {row.val >= 0 ? '+' : ''}{formatMoney(row.val)}
                      </Typography>
                    </Box>
                  ))}

                  {/* Total líquido */}
                  {(() => {
                    const totalRec = history.reduce((s,h) => s + (h.income || (h.isPositive ? h.value||0 : 0)), 0);
                    const totalDesp = history.reduce((s,h) => s + (h.expense || (!h.isPositive ? h.value||0 : 0)), 0);
                    const net = totalRec - totalDesp;
                    return (
                      <Box sx={{ mt: 0.8, pt: 0.8, borderTop: `2px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.75rem' }}>💼 RESULTADO LÍQUIDO</Typography>
                        <Typography sx={{ color: net >= 0 ? C.green : C.red, fontWeight: 900, fontSize: '0.9rem' }}>
                          {net >= 0 ? '+' : ''}{formatMoney(net)}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              </Box>
            </Box>
          );
        })()}

      </Box>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </Box>
  );
};

export default ScreenFinances;

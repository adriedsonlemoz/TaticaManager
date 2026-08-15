// @migrated to ES module
import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME, DARK_THEME } from '../theme.js';

// ScreenSeasonEnd.jsx — v1.0
// Extraído de app.jsx (era SeasonEndScreen definido inline).
// Exibe o resumo de fim de temporada com 3 abas: Temporada · Elenco · Financeiro.

const C = THEME;

// Paleta escura vem do DARK_THEME em theme.js — fonte única de verdade.
const D = DARK_THEME;

const ScreenSeasonEnd = ({ gameData, setScreen, formatMoney, saveGame }) => {
  const [tab, setTab] = React.useState(0); // 0=Temporada 1=Elenco 2=Financeiro

  const r       = gameData?.seasonResult || {};
  const players = gameData?.players || [];

  const icon  = r.champion ? '🏆' : r.promoted ? '🎉' : r.relegated ? '😰' : '📋';
  const title = r.champion ? 'CAMPEÃO!'
              : r.promoted  ? 'PROMOVIDO!'
              : r.relegated ? 'REBAIXADO'
              : 'TEMPORADA ENCERRADA';
  const color   = r.champion || r.promoted ? D.green : r.relegated ? D.red : D.gold;
  const newSerie = gameData?.serie || r.newSerie || 'A';

  // Estatísticas do elenco
  const topScorer = [...players].sort((a, b) => (b.goals   || 0) - (a.goals   || 0))[0];
  const topAssist = [...players].sort((a, b) => (b.assists || 0) - (a.assists || 0))[0];
  const avgOvr    = players.length
    ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length)
    : 0;
  const totalValue = players.reduce((s, p) => s + (p.value || 0), 0);
  const totalWage  = players.reduce((s, p) => s + (p.wage  || 0), 0);

  // Histórico financeiro
  const history      = gameData?.financialHistory || [];
  const totalIncome  = history.filter(t => t.income  > 0).reduce((s, t) => s + (t.income  || 0), 0);
  const totalExpense = history.filter(t => t.expense > 0).reduce((s, t) => s + (t.expense || 0), 0);

  // Resultados da temporada
  const myRow = (gameData?.table || []).find(t => t.id === 'user') || {};
  const wins   = myRow.w || 0;
  const draws  = myRow.d || 0;
  const losses = myRow.l || 0;
  const gf     = myRow.gf || 0;
  const ga     = myRow.ga || 0;

  // Conquistas
  const achievements = [];
  if (r.champion)  achievements.push({ icon: '🏆', text: `Campeão da Série ${r.prevSerie}!` });
  if (r.promoted)  achievements.push({ icon: '⬆️', text: `Promovido para a Série ${r.newSerie}!` });
  if (r.relegated) achievements.push({ icon: '⬇️', text: `Rebaixado para a Série ${r.newSerie}` });
  if (topScorer && (topScorer.goals || 0) > 0)
    achievements.push({ icon: '⚽', text: `Artilheiro: ${topScorer.name.split(' ').pop()} (${topScorer.goals} gols)` });
  if (wins >= 20)  achievements.push({ icon: '💪', text: `${wins} vitórias na temporada!` });
  if (gf   >= 50)  achievements.push({ icon: '🎯', text: `${gf} gols marcados!` });

  const fm = (v) => formatMoney ? formatMoney(v) : `R$${(v / 1e6).toFixed(1)}M`;

  // ── Aba 0: Temporada ──────────────────────────────────
  const tabTemporada = (
    <>
      {/* Stats 4 colunas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.7, mb: 1.2 }}>
        {[
          { l: 'VITÓRIAS',  v: wins,                                           c: D.green },
          { l: 'EMPATES',   v: draws,                                          c: D.gold  },
          { l: 'DERROTAS',  v: losses,                                         c: D.red   },
          { l: 'SALDO GOL', v: `${gf - ga >= 0 ? '+' : ''}${gf - ga}`,        c: gf - ga >= 0 ? D.green : D.red },
        ].map((s, i) => (
          <Box key={i} sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', py: 1, textAlign: 'center' }}>
            <Typography sx={{ color: s.c, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{s.v}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.2 }}>{s.l}</Typography>
          </Box>
        ))}
      </Box>

      {/* Gols */}
      <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', px: 1.4, py: 1, mb: 1.2 }}>
        <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8, mb: 0.8 }}>GOLS DA TEMPORADA</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography sx={{ color: D.green, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1 }}>{gf}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>MARCADOS</Typography>
          </Box>
          <Box sx={{ width: 1, bgcolor: D.border }} />
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography sx={{ color: D.red, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1 }}>{ga}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>SOFRIDOS</Typography>
          </Box>
        </Box>
      </Box>

      {/* Destaque da temporada */}
      {topScorer && (topScorer.goals || 0) > 0 && (
        <Box sx={{ bgcolor: D.card, border: `1px solid ${D.gold}30`, borderRadius: '10px', px: 1.4, py: 1, mb: 1.2 }}>
          <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8, mb: 0.8 }}>🌟 DESTAQUE DA TEMPORADA</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: D.cardAlt, border: `1.5px solid ${D.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Typography sx={{ color: D.gold, fontWeight: 900, fontSize: '1rem' }}>{topScorer.overall}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: D.txt1, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>{topScorer.name}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.6rem', fontWeight: 700 }}>{topScorer.position} · Artilheiro</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: D.gold, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>{topScorer.goals || 0}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>GOLS</Typography>
            </Box>
          </Box>
          {topAssist && topAssist.id !== topScorer.id && (topAssist.assists || 0) > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, pt: 0.8, borderTop: `1px solid ${D.border}` }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: D.cardAlt, border: `1px solid ${D.blue}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography sx={{ color: D.blue, fontWeight: 900, fontSize: '0.85rem' }}>{topAssist.overall}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: D.txt1, fontWeight: 700, fontSize: '0.78rem' }}>{topAssist.name}</Typography>
                <Typography sx={{ color: D.txt3, fontSize: '0.55rem' }}>Garçom da temporada</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: D.blue, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{topAssist.assists || 0}</Typography>
                <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>ASSIST.</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Próxima temporada */}
      <Box sx={{ bgcolor: `${color}0d`, border: `1px solid ${color}35`, borderRadius: '10px', px: 1.4, py: 1 }}>
        <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8, mb: 0.8 }}>PRÓXIMA TEMPORADA</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.7 }}>
          {[
            { l: 'TEMPORADA', v: `Nº ${(r.season || 0) + 1}`,          c: D.txt1  },
            { l: 'SÉRIE',     v: `Série ${newSerie}`,                   c: color   },
            { l: 'JOGADORES', v: players.length,                        c: D.txt1  },
            { l: 'CAIXA',     v: fm(gameData?.club?.money || 0),        c: D.green },
          ].map((s, i) => (
            <Box key={i} sx={{ bgcolor: D.card, borderRadius: '8px', p: 0.9, textAlign: 'center' }}>
              <Typography sx={{ color: s.c, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.15 }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );

  // ── Aba 1: Elenco ──────────────────────────────────────
  const tabElenco = (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.7, mb: 1.2 }}>
        {[
          { l: 'OVR MÉDIO',    v: avgOvr,         c: avgOvr >= 80 ? D.green : avgOvr >= 70 ? D.gold : D.red },
          { l: 'JOGADORES',    v: players.length,  c: D.txt1 },
          { l: 'VALOR ELENCO', v: fm(totalValue),  c: D.teal },
        ].map((s, i) => (
          <Box key={i} sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', py: 1, textAlign: 'center' }}>
            <Typography sx={{ color: s.c, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>{s.v}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.2 }}>{s.l}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1.2 }}>
        <Box sx={{ px: 1.4, py: 0.8, borderBottom: `1px solid ${D.border}` }}>
          <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8 }}>TOP JOGADORES</Typography>
        </Box>
        {[...players].sort((a, b) => b.overall - a.overall).slice(0, 8).map((p, i) => (
          <Box key={p.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.2, py: 0.6, borderBottom: `1px solid ${D.border}40` }}>
            <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.6rem', minWidth: 14 }}>{i + 1}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: D.txt1, fontWeight: 800, fontSize: '0.72rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.52rem', fontWeight: 700 }}>{p.position} · {p.age} anos</Typography>
            </Box>
            <Typography sx={{ color: p.overall >= 80 ? D.green : p.overall >= 70 ? D.gold : D.red, fontWeight: 900, fontSize: '0.88rem' }}>{p.overall}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );

  // ── Aba 2: Financeiro ──────────────────────────────────
  const tabFinanceiro = (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 1.2 }}>
        {[
          { l: 'CAIXA ATUAL',  v: fm(gameData?.club?.money || 0),            c: D.teal  },
          { l: 'FOLHA/ROD',    v: `${fm(totalWage)}/rod`,                    c: D.red   },
          { l: 'RECEITAS T.',  v: fm(totalIncome),                           c: D.green },
          { l: 'DESPESAS T.',  v: fm(totalExpense),                          c: D.red   },
          { l: 'ORÇ. TRANSF.', v: fm(gameData?.club?.transferBudget || 0),   c: D.blue  },
          { l: 'VALOR ELENCO', v: fm(totalValue),                            c: D.teal  },
        ].map((s, i) => (
          <Box key={i} sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', px: 1, py: 0.9, textAlign: 'center' }}>
            <Typography sx={{ color: s.c, fontWeight: 900, fontSize: '0.82rem', lineHeight: 1 }}>{s.v}</Typography>
            <Typography sx={{ color: D.txt3, fontSize: '0.44rem', fontWeight: 700, mt: 0.2 }}>{s.l}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
        <Box sx={{ px: 1.4, py: 0.8, borderBottom: `1px solid ${D.border}` }}>
          <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.8 }}>ÚLTIMAS TRANSAÇÕES</Typography>
        </Box>
        {history.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography sx={{ color: D.txt3, fontSize: '0.7rem' }}>Sem histórico financeiro</Typography>
          </Box>
        ) : history.slice(0, 8).map((t, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.2, py: 0.55, borderBottom: `1px solid ${D.border}30` }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: D.txt1, fontSize: '0.62rem', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {t.detail?.description || 'Transação'}
              </Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.48rem' }}>Rod. {t.round || 0}</Typography>
            </Box>
            <Typography sx={{ color: (t.total || 0) >= 0 ? D.green : D.red, fontWeight: 900, fontSize: '0.7rem', flexShrink: 0 }}>
              {(t.total || 0) >= 0 ? '+' : ''}{fm(Math.abs(t.total || 0))}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );

  return (
    <Box sx={{
      bgcolor: D.bg, minHeight: '100vh', pb: 10,
      background: `radial-gradient(ellipse at 50% 0%, ${color}15 0%, transparent 50%), ${D.bg}`,
    }}>
      {/* Hero */}
      <Box sx={{ px: 2, pt: 5, pb: 2.5, textAlign: 'center', background: `linear-gradient(180deg,${color}18 0%,transparent 100%)` }}>
        <Typography sx={{ fontSize: '4rem', lineHeight: 1, mb: 0.8 }}>{icon}</Typography>
        <Typography sx={{ color, fontWeight: 900, fontSize: '1.6rem', letterSpacing: 2, lineHeight: 1, mb: 0.5 }}>{title}</Typography>
        <Typography sx={{ color: D.txt2, fontSize: '0.78rem', fontWeight: 700, mb: 0.3 }}>
          Temporada {r.season || gameData?.season} · Série {r.prevSerie}
        </Typography>

        {/* Resumo de posição/pontos */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, mt: 1, bgcolor: `${color}18`, border: `1px solid ${color}40`, borderRadius: '12px', px: 2, py: 0.8 }}>
          {[
            { v: `${r.userPos}º`,                          label: 'LUGAR'     },
            { v: r.pts || myRow.pts || 0,                  label: 'PONTOS'    },
            { v: `${wins}V ${draws}E ${losses}D`,           label: 'RESULTADOS', color: D.green, fontSize: '1.1rem' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Box sx={{ width: 1, height: 28, bgcolor: `${color}40` }} />}
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: s.color || (i === 0 ? color : D.txt1), fontWeight: 900, fontSize: s.fontSize || '1.4rem', lineHeight: 1 }}>{s.v}</Typography>
                <Typography sx={{ color: D.txt3, fontSize: '0.5rem', fontWeight: 700 }}>{s.label}</Typography>
              </Box>
            </React.Fragment>
          ))}
        </Box>

        {/* Conquistas */}
        {achievements.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.6, justifyContent: 'center' }}>
            {achievements.map((a, i) => (
              <Box key={i} sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '8px', px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem' }}>{a.icon}</Typography>
                <Typography sx={{ color: D.txt1, fontWeight: 700, fontSize: '0.6rem' }}>{a.text}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Abas */}
      <Box sx={{ display: 'flex', mx: 1.5, mb: 1.2, bgcolor: D.card, borderRadius: '10px', p: 0.4, border: `1px solid ${D.border}` }}>
        {['Temporada', 'Elenco', 'Financeiro'].map((t, i) => (
          <Box key={i} onClick={() => setTab(i)} sx={{ flex: 1, py: 0.8, textAlign: 'center', borderRadius: '7px', cursor: 'pointer', bgcolor: tab === i ? D.teal : 'transparent', transition: 'all 0.15s' }}>
            <Typography sx={{ color: tab === i ? '#000' : D.txt3, fontWeight: 900, fontSize: '0.65rem' }}>{t}</Typography>
          </Box>
        ))}
      </Box>

      {/* Conteúdo da aba */}
      <Box sx={{ px: 1.5 }}>
        {tab === 0 && tabTemporada}
        {tab === 1 && tabElenco}
        {tab === 2 && tabFinanceiro}
      </Box>

      {/* Ações */}
      <Box sx={{ px: 1.5, mt: 2 }}>
        <Box
          onClick={() => { saveGame?.(); setScreen('home'); }}
          sx={{ bgcolor: color, borderRadius: '12px', py: 1.6, textAlign: 'center', cursor: 'pointer', boxShadow: `0 0 24px ${color}40`, mb: 1, '&:active': { filter: 'brightness(0.9)' } }}
        >
          <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '1rem', letterSpacing: 1 }}>
            🏟️ INICIAR TEMPORADA {(r.season || 0) + 1}
          </Typography>
        </Box>
        <Box
          onClick={() => setScreen('table')}
          sx={{ border: `1px solid ${D.border}`, borderRadius: '10px', py: 1.2, textAlign: 'center', cursor: 'pointer', '&:active': { opacity: 0.7 } }}
        >
          <Typography sx={{ color: D.txt2, fontWeight: 700, fontSize: '0.82rem' }}>📊 Ver Tabela Final</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ScreenSeasonEnd;

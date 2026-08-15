// @migrated to ES module
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { sortLeagueTable } from '../engines/engine.js';
import { PostMatchAgent } from '../engines/PostMatchAgent.js';
import { resolveMatchInfo, formatMatchDate, formatMatchDateTime } from '../utils/matchDateUtils.js';

// ScreenPostMatch.jsx — v1.0
// Tela unificada pós-partida com 3 abas: Súmula · Finanças · Classificação
// Substituiu os steps 5, 6 e 7 do ScreenMatchResult (eram telas separadas com
// navegação encadeada). Recebe os dados já resolvidos do jogo encerrado.

const C = THEME;

// ── Sub-componentes locais ────────────────────────────────

const Card = ({ children, accent, sx: sxExtra }) => (
  <Box sx={{
    bgcolor: C.bgCard, border: `1.5px solid ${accent || C.border}`,
    borderRadius: '14px', overflow: 'hidden', mb: 1.2, ...sxExtra,
  }}>
    {children}
  </Box>
);

const CardHead = ({ label, icon, color }) => (
  <Box sx={{
    px: 1.5, py: 0.85, borderBottom: `1px solid ${C.border}`,
    bgcolor: color ? `${color}0f` : C.bgCardAlt,
    display: 'flex', alignItems: 'center', gap: 0.8,
  }}>
    {icon && <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</Typography>}
    <Typography sx={{ color: color || C.ink3, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 1.2 }}>
      {label}
    </Typography>
  </Box>
);

const StatRow = ({ label, h, a, lower }) => {
  const tot  = (h + a) || 1;
  const pct  = (h / tot) * 100;
  const hWins = lower ? h <= a : h >= a;
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
        <Typography sx={{ color: hWins ? C.ink : C.ink3, fontWeight: hWins ? 900 : 600, fontSize: '0.82rem', width: 32, textAlign: 'right', mr: 0.8 }}>{h}</Typography>
        <Typography sx={{ flex: 1, textAlign: 'center', color: C.ink2, fontWeight: 700, fontSize: '0.56rem', letterSpacing: 0.5 }}>{label}</Typography>
        <Typography sx={{ color: !hWins ? C.ink : C.ink3, fontWeight: !hWins ? 900 : 600, fontSize: '0.82rem', width: 32, ml: 0.8 }}>{a}</Typography>
      </Box>
      <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: C.bgCardAlt }}>
        <Box sx={{ width: `${pct}%`, bgcolor: C.green, transition: 'width 0.5s ease' }} />
        <Box sx={{ flex: 1, bgcolor: C.blue, opacity: 0.55 }} />
      </Box>
    </Box>
  );
};

// ── Componente principal ──────────────────────────────────

const ScreenPostMatch = ({
  gameData,
  matchResultData,
  liveScore,
  possession,
  subsDone,
  roundSummary,
  setScreen,
  formatMoney,
  playersBefore = [],
  rawEvents     = [],
}) => {
  const [tab,            setTab]            = React.useState(0);
  const [posPopup,       setPosPopup]       = React.useState(null);
  const [showPosPopup,   setShowPosPopup]   = React.useState(false);
  const [acknowledged,   setAcknowledged]   = React.useState(false);

  if (!matchResultData) return null;

  const nextRound  = (gameData?.round || 1); // round já incrementado pelo hook
  const _matchRound = nextRound - 1; // slot 0-indexed que foi jogado

  // ── Data e hora do jogo (via utilitário compartilhado) ────
  const playedMatchInfo = React.useMemo(
    () => resolveMatchInfo(gameData, _matchRound),
    [] // eslint-disable-line — estável após montagem
  );
  const matchDateStr = playedMatchInfo.fullStrWithYear;

  // ── PostMatchAgent ────────────────────────────────────────
  const desfalques = React.useMemo(() => {
    if (!playersBefore.length || !gameData?.players?.length)
      return { suspensions: [], injuries: [], hasBlockers: false };
    return PostMatchAgent.analyzeDesfalques(playersBefore, gameData.players, rawEvents, nextRound);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasDesfalques = desfalques.suspensions.length > 0 || desfalques.injuries.length > 0;
  const isBlocked     = desfalques.hasBlockers && !acknowledged;

  const {
    homeName, awayName,
    homeShots, awayShots,
    attendance, income,
    events = [],
    isCupMatch, cupLeg, cupKey, cupLabel, cupEvents = [],
  } = matchResultData;

  const isUserH    = homeName === gameData?.club?.name;
  const uScore     = isUserH ? liveScore.home : liveScore.away;
  const oScore     = isUserH ? liveScore.away : liveScore.home;
  const resLabel   = uScore > oScore ? 'VITÓRIA' : uScore < oScore ? 'DERROTA' : 'EMPATE';
  const resColor   = uScore > oScore ? C.green   : uScore < oScore ? C.red     : C.gold;

  // Finanças da rodada
  const tvIncome   = gameData?.serie === 'A' ? 500000 : 150000;
  const sponsorInc = (gameData?.club?.sponsors?.master?.roundValue || 0) +
                     (gameData?.club?.sponsors?.stadium?.roundValue || 0);
  const totalIncome = (income || 0) + tvIncome + sponsorInc;

  // Parsing de eventos
  const goalEvts   = events.filter(e => e.includes('GOL') || e.includes('⚽'));
  const yellowEvts = events.filter(e => e.includes('🟨'));
  const redEvts    = events.filter(e => e.includes('🟥'));

  const parseGoal = (e) => {
    const min       = e.match(/^(\d+)'/)?.[1] || '';
    const scorer    = e.match(/\(([^)]+)\)/)?.[1] || '';
    const isOwnGoal = e.includes('GOL CONTRA');
    const isHome    = isOwnGoal ? !e.includes(`(${homeName})`) : e.includes(homeName);
    return { min, scorer, isHome };
  };

  const parseCard = (e) => {
    const min    = e.match(/^(\d+)'/)?.[1] || '';
    const player = e.match(/para (.+?) \(/)?.[1]
                || e.match(/de (.+?) \(/)?.[1]
                || e.match(/EXPULSO! (?:Vermelho direto para )?(.+?) \(/)?.[1] || '';
    const team   = e.includes(homeName) ? homeName : awayName;
    return { min, player, team };
  };

  // Estatísticas
  const hS  = Math.max(liveScore.home * 2 + 3, homeShots || 4);
  const aS  = Math.max(liveScore.away * 2 + 3, awayShots || 4);
  const hOT = Math.max(liveScore.home, Math.round(hS * 0.4));
  const aOT = Math.max(liveScore.away, Math.round(aS * 0.4));
  const hF  = React.useMemo(() => 7 + Math.floor(Math.random() * 9), [matchResultData?.homeName]);
  const aF  = React.useMemo(() => 7 + Math.floor(Math.random() * 9), [matchResultData?.homeName]);
  const hC  = React.useMemo(() => Math.round(possession.home / 11 + 1), [matchResultData?.homeName]);
  const aC  = React.useMemo(() => Math.round(possession.away / 11 + 1), [matchResultData?.homeName]);

  // Classificação — calcular delta de posição na montagem
  React.useEffect(() => {
    if (!gameData?.table || !matchResultData) return;
    const sorted    = sortLeagueTable ? sortLeagueTable(gameData.table) : gameData.table;
    const posAfter  = (sorted.findIndex(t => t.id === 'user') ?? -1) + 1;
    const myRow     = gameData.table.find(t => t.id === 'user') || {};
    const myG       = isUserH ? (matchResultData.homeGoals ?? 0) : (matchResultData.awayGoals ?? 0);
    const oppG      = isUserH ? (matchResultData.awayGoals ?? 0) : (matchResultData.homeGoals ?? 0);
    const ptsGained = myG > oppG ? 3 : myG === oppG ? 1 : 0;
    const fakeRow   = {
      ...myRow,
      pts: (myRow.pts || 0) - ptsGained, p: (myRow.p || 0) - 1,
      w:  myG >  oppG ? (myRow.w || 0) - 1 : myRow.w || 0,
      d:  myG === oppG ? (myRow.d || 0) - 1 : myRow.d || 0,
      l:  myG <  oppG ? (myRow.l || 0) - 1 : myRow.l || 0,
      gf: (myRow.gf || 0) - myG, ga: (myRow.ga || 0) - oppG,
    };
    const fakeTable  = gameData.table.map(t => t.id === 'user' ? fakeRow : t);
    const fakeSorted = sortLeagueTable ? sortLeagueTable(fakeTable) : fakeTable;
    const posBefore  = (fakeSorted.findIndex(t => t.id === 'user') ?? -1) + 1;
    setPosPopup({ posBefore, posAfter, delta: posBefore - posAfter });
    setShowPosPopup(true);
    const t = setTimeout(() => setShowPosPopup(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // ── Header com placar ──────────────────────────────────
  const header = (
    <Box sx={{
      background: `linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,
      borderBottom: `1px solid ${C.border}`, px: 1.5, pt: 3.2, pb: 1,
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.8 }}>
        <Box sx={{ bgcolor: `${resColor}12`, border: `1px solid ${resColor}50`, borderRadius: 20, px: 1, py: 0.25 }}>
          <Typography sx={{ color: resColor, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 2 }}>
            {resLabel}
          </Typography>
        </Box>
        <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>
          {isCupMatch
            ? `${cupLabel || '🏆 Copa'} · ${cupLeg === 'leg1' ? 'Jogo de Ida' : cupLeg === 'leg2' ? 'Jogo de Volta' : 'Jogo Único'}`
            : `Série ${gameData?.serie} · Rod ${gameData?.round}`}
          {matchDateStr ? ` · ${matchDateStr}` : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[{ name: homeName, score: liveScore.home }, null, { name: awayName, score: liveScore.away }].map((side, i) =>
          side === null ? (
            <Box key="score" sx={{ bgcolor: C.bgCard, border: `2px solid ${resColor}60`, borderRadius: '10px', px: 1.4, py: 0.6, display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0, boxShadow: `0 0 12px ${resColor}25` }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.55rem', lineHeight: 1, color: resColor, fontFamily: 'monospace', minWidth: 22, textAlign: 'center' }}>{liveScore.home}</Typography>
              <Typography sx={{ color: C.ink3, fontWeight: 900, fontSize: '1rem', px: 0.1 }}>–</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.55rem', lineHeight: 1, color: resColor, fontFamily: 'monospace', minWidth: 22, textAlign: 'center' }}>{liveScore.away}</Typography>
            </Box>
          ) : (
            <Box key={side.name} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: 'rgba(44,24,0,0.04)', border: `1.5px solid ${side.name === gameData?.club?.name ? C.green : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {TeamIcon ? React.createElement(TeamIcon, { name: side.name, size: 26 }) : <Typography sx={{ fontSize: '1rem' }}>⚽</Typography>}
              </Box>
              <Typography sx={{ color: side.name === gameData?.club?.name ? C.green : C.ink2, fontWeight: 900, fontSize: '0.6rem', textAlign: 'center', lineHeight: 1.1, maxWidth: 68, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {side.name}
              </Typography>
            </Box>
          )
        )}
      </Box>
    </Box>
  );

  // ── Abas ──────────────────────────────────────────────
  const TABS = [
    '⚽ Súmula',
    '💰 Finanças',
    '🏆 Tabela',
    ...(hasDesfalques ? [`🚨 Desfalques${desfalques.hasBlockers ? ' !' : ''}`] : []),
  ];

  // ── Aba 0: Súmula ──────────────────────────────────────
  const tabSumula = (
    <>
      {/* Banner de resultado */}
      <Box sx={{ bgcolor: `${resColor}0e`, border: `2px solid ${resColor}50`, borderRadius: '16px', p: 1.8, mb: 1.2, textAlign: 'center', boxShadow: `0 0 24px ${resColor}18` }}>
        <Typography sx={{ color: resColor, fontWeight: 900, fontSize: '1.05rem', letterSpacing: 3 }}>{resLabel}</Typography>
        <Typography sx={{ color: C.ink3, fontSize: '0.65rem', fontWeight: 700, mt: 0.3 }}>
          {isCupMatch
            ? `${cupLabel || '🏆 Copa'} · ${cupLeg === 'leg1' ? 'Jogo de Ida' : cupLeg === 'leg2' ? 'Jogo de Volta' : 'Jogo Único'}`
            : `${homeName} × ${awayName} · Rod ${gameData?.round}`}
          {matchDateStr ? `\n${matchDateStr}` : ''}
        </Typography>
      </Box>

      {/* Placar agregado de copa (jogo de volta) */}
      {isCupMatch && cupLeg === 'leg2' && (() => {
        const cup = gameData?.cups?.[cupKey];
        if (!cup?.currentTie?.decided) return null;
        const tie     = cup.currentTie;
        const userWon = tie.winner?.isPlayer;
        const hAggr   = tie.homeAggr ?? 0;
        const aAggr   = tie.awayAggr ?? 0;
        return (
          <Box sx={{ bgcolor: userWon ? `${C.green}10` : `${C.red}08`, border: `2px solid ${userWon ? C.green : C.red}60`, borderRadius: '14px', overflow: 'hidden', mb: 1.2, boxShadow: `0 0 20px ${userWon ? C.green : C.red}25` }}>
            <Box sx={{ bgcolor: userWon ? C.green : C.red, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{userWon ? '🎉' : '😞'}</Typography>
              <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.88rem' }}>{userWon ? 'CLASSIFICADO!' : 'ELIMINADO'}</Typography>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{userWon ? '🎉' : '😞'}</Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
              <Typography sx={{ flex: 1, textAlign: 'right', color: tie.home?.isPlayer ? (userWon ? C.green : C.red) : C.ink2, fontWeight: 900, fontSize: '0.75rem' }}>{tie.home?.name || homeName}</Typography>
              <Box sx={{ bgcolor: C.bgCardAlt, border: `2px solid ${userWon ? C.green : C.red}40`, borderRadius: '10px', px: 1.5, py: 0.6, textAlign: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, fontFamily: 'monospace', color: hAggr > aAggr ? (tie.home?.isPlayer ? C.green : C.red) : aAggr > hAggr ? (tie.away?.isPlayer ? C.green : C.red) : C.gold }}>
                  {hAggr} – {aAggr}
                </Typography>
                {tie.penalties && <Typography sx={{ color: C.ink3, fontSize: '0.48rem', fontWeight: 700 }}>Pênaltis: {tie.penalties.home}×{tie.penalties.away}</Typography>}
              </Box>
              <Typography sx={{ flex: 1, color: tie.away?.isPlayer ? (userWon ? C.green : C.red) : C.ink2, fontWeight: 900, fontSize: '0.75rem' }}>{tie.away?.name || awayName}</Typography>
            </Box>
          </Box>
        );
      })()}

      {/* Gols */}
      <Card accent={`${C.green}50`}>
        <CardHead label="GOLS DA PARTIDA" icon="⚽" color={C.green} />
        <Box sx={{ px: 1.5, py: 1 }}>
          {goalEvts.length === 0
            ? <Typography sx={{ color: C.ink3, fontSize: '0.72rem', fontStyle: 'italic' }}>Nenhum gol marcado</Typography>
            : goalEvts.map((g, i) => {
                const { min, scorer, isHome } = parseGoal(g);
                return (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                    <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                      <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{min}'</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.9rem' }}>⚽</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: isHome ? C.green : C.blue, fontWeight: 900, fontSize: '0.78rem', lineHeight: 1 }}>{scorer || '—'}</Typography>
                      <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{isHome ? homeName : awayName}</Typography>
                    </Box>
                  </Box>
                );
              })
          }
        </Box>
      </Card>

      {/* Substituições */}
      {subsDone.length > 0 && (
        <Card>
          <CardHead label="SUBSTITUIÇÕES" icon="🔄" color={C.gold} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {subsDone.map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                  <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{s.min}'</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.85rem' }}>🔄</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>↓ {s.out}</Typography>
                  <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>↑ {s.in}</Typography>
                </Box>
                <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{gameData?.club?.name}</Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Cartões */}
      {(yellowEvts.length > 0 || redEvts.length > 0) && (
        <Card>
          <CardHead label="CARTÕES" icon="🟨" />
          <Box sx={{ px: 1.5, py: 1 }}>
            {yellowEvts.slice(0, 6).map((e, i) => {
              const { min, player, team } = parseCard(e);
              return (
                <Box key={`y${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                  <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                    <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{min}'</Typography>
                  </Box>
                  <Box sx={{ width: 9, height: 13, bgcolor: C.gold, borderRadius: '2px', flexShrink: 0 }} />
                  <Typography sx={{ flex: 1, color: C.ink, fontWeight: 900, fontSize: '0.72rem' }}>{player}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{team}</Typography>
                </Box>
              );
            })}
            {redEvts.map((e, i) => {
              const { min, player, team } = parseCard(e);
              return (
                <Box key={`r${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                  <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                    <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{min}'</Typography>
                  </Box>
                  <Box sx={{ width: 9, height: 13, bgcolor: C.red, borderRadius: '2px', flexShrink: 0 }} />
                  <Typography sx={{ flex: 1, color: C.ink, fontWeight: 900, fontSize: '0.72rem' }}>{player}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{team}</Typography>
                </Box>
              );
            })}
          </Box>
        </Card>
      )}

      {/* Estatísticas */}
      <Card>
        <CardHead label="ESTATÍSTICAS" icon="📊" />
        <Box sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ color: homeName === gameData?.club?.name ? C.green : C.ink2, fontWeight: 900, fontSize: '0.68rem' }}>{homeName}</Typography>
            <Typography sx={{ color: awayName === gameData?.club?.name ? C.green : C.ink2, fontWeight: 900, fontSize: '0.68rem' }}>{awayName}</Typography>
          </Box>
          <StatRow label="POSSE (%)"    h={possession.home} a={possession.away} />
          <StatRow label="FINALIZAÇÕES" h={hS}  a={aS} />
          <StatRow label="NO ALVO"      h={hOT} a={aOT} />
          <StatRow label="ESCANTEIOS"   h={hC}  a={aC} />
          <StatRow label="FALTAS"        h={hF}  a={aF} lower />
          <StatRow label="AMARELOS"
            h={yellowEvts.filter(e => e.includes(homeName)).length}
            a={yellowEvts.filter(e => e.includes(awayName)).length}
            lower
          />
        </Box>
      </Card>
    </>
  );

  // ── Aba 1: Finanças ────────────────────────────────────
  const tabFinancas = (
    <>
      {/* Bilheteria */}
      <Card accent={`${C.green}50`}>
        <CardHead label="BILHETERIA & PÚBLICO" icon="🏟️" color={C.green} />
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '10px', p: 1.2, mb: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: C.ink3, fontSize: '0.54rem', fontWeight: 700, letterSpacing: 0.5 }}>TOTAL DE TORCEDORES</Typography>
              <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '1.35rem', lineHeight: 1.1, fontFamily: 'monospace' }}>{(attendance || 0).toLocaleString('pt-BR')}</Typography>
            </Box>
            <Typography sx={{ fontSize: '2.2rem', opacity: 0.5 }}>👥</Typography>
          </Box>

          {[
            { icon: '🎟', label: 'Bilheteria',  value: income || 0,  color: C.green },
            { icon: '📺', label: 'Cota de TV',  value: tvIncome,     color: C.blue  },
            ...(sponsorInc > 0 ? [{ icon: '🤝', label: 'Patrocinador', value: sponsorInc, color: C.purple }] : []),
          ].map((r, i, arr) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: i < arr.length - 1 ? 0.75 : 0, mb: i < arr.length - 1 ? 0.75 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography sx={{ fontSize: '1rem' }}>{r.icon}</Typography>
                <Typography sx={{ color: C.ink2, fontWeight: 700, fontSize: '0.75rem' }}>{r.label}</Typography>
              </Box>
              <Typography sx={{ color: r.color, fontWeight: 900, fontSize: '0.9rem' }}>{formatMoney(r.value)}</Typography>
            </Box>
          ))}

          <Box sx={{ height: 1, bgcolor: C.border, my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.85rem' }}>TOTAL ARRECADADO</Typography>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem' }}>{formatMoney(totalIncome)}</Typography>
          </Box>
        </Box>
      </Card>

      {/* Prêmios de copa */}
      {cupEvents.length > 0 && (
        <Card accent={`${C.gold}50`}>
          <CardHead label="PRÊMIOS DE COPA" icon="🏆" color={C.gold} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {cupEvents.map((ev, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.6 }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.72rem' }}>{ev.cup}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700, mt: 0.15 }}>{ev.msg}</Typography>
                </Box>
                {(ev.earned || 0) > 0 && (
                  <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.82rem', flexShrink: 0 }}>+{formatMoney(ev.earned)}</Typography>
                )}
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Resultados da rodada */}
      <Card>
        <CardHead label={`RESULTADOS · ROD ${gameData?.round}`} icon="📋" />
        {(roundSummary || []).map((m, i) => {
          const isUser = m.home.id === 'user' || m.away.id === 'user';
          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', px: 1.2, py: 0.6, borderBottom: i < (roundSummary?.length || 0) - 1 ? `1px solid ${C.border}` : 'none', bgcolor: isUser ? 'rgba(22,163,74,0.04)' : 'transparent' }}>
              <Typography sx={{ flex: 1, textAlign: 'right', color: m.home.id === 'user' ? C.green : C.ink2, fontSize: '0.66rem', fontWeight: m.home.id === 'user' ? 900 : 600, mr: 0.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{m.home.name}</Typography>
              <Typography sx={{ color: isUser ? C.ink : C.ink3, fontWeight: 900, fontSize: '0.72rem', fontFamily: 'monospace', minWidth: 40, textAlign: 'center', bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.5, py: 0.2, flexShrink: 0 }}>{m.result || 'vs'}</Typography>
              <Typography sx={{ flex: 1, color: m.away.id === 'user' ? C.green : C.ink2, fontSize: '0.66rem', fontWeight: m.away.id === 'user' ? 900 : 600, ml: 0.5, overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.away.name}</Typography>
            </Box>
          );
        })}
      </Card>
    </>
  );

  // ── Aba 2: Classificação ───────────────────────────────
  const tabTabela = (() => {
    const sorted      = sortLeagueTable ? sortLeagueTable(gameData?.table || []) : (gameData?.table || []);
    const serie       = gameData?.serie || 'A';
    const myPos       = (sorted.findIndex(t => t.id === 'user') ?? -1) + 1;
    const userInTop10 = myPos <= 10;
    const displayRows = userInTop10
      ? sorted.slice(0, 10)
      : [...sorted.slice(0, 9), sorted.find(t => t.id === 'user')].filter(Boolean);

    const getZC = (idx) => {
      if (serie === 'A') { if (idx < 4) return C.green; if (idx < 6) return C.blue; if (idx >= 16) return C.red; }
      else               { if (idx < 4) return C.green; if (idx >= 16) return C.red; }
      return 'transparent';
    };

    const getZoneLabel = (idx) => {
      if (serie === 'A') {
        if (idx < 4)  return { label: 'Libertadores',  color: C.green };
        if (idx < 6)  return { label: 'Pré-Libert.',   color: C.blue  };
        if (idx < 12) return { label: 'Sul-Americana', color: C.purple };
        if (idx >= 16) return { label: 'Rebaixamento', color: C.red   };
      } else {
        if (idx < 4)   return { label: 'Acesso',       color: C.green };
        if (idx >= 16) return { label: 'Rebaixamento', color: C.red   };
      }
      return null;
    };

    return (
      <>
        {/* Popup de posição */}
        {showPosPopup && posPopup && (
          <Box sx={{
            mb: 1.2,
            '@keyframes popIn': { '0%': { opacity: 0, transform: 'scale(0.85)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
            animation: 'popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
          }}>
            <Box sx={{ bgcolor: C.bgCard, border: `2.5px solid ${posPopup.delta > 0 ? C.green : posPopup.delta < 0 ? C.red : C.border}`, borderRadius: '18px', overflow: 'hidden', boxShadow: `0 8px 32px ${posPopup.delta > 0 ? C.green : posPopup.delta < 0 ? C.red : '#000'}40` }}>
              <Box sx={{ bgcolor: posPopup.delta > 0 ? C.green : posPopup.delta < 0 ? C.red : C.bgCardAlt, px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{posPopup.delta > 0 ? '🚀' : posPopup.delta < 0 ? '😰' : '➡️'}</Typography>
                <Typography sx={{ color: posPopup.delta !== 0 ? '#000' : C.ink, fontWeight: 900, fontSize: '0.95rem' }}>
                  {posPopup.delta > 0
                    ? `Subimos ${posPopup.delta} posição${posPopup.delta > 1 ? 'ões' : ''}!`
                    : posPopup.delta < 0
                    ? `Caímos ${Math.abs(posPopup.delta)} posição${Math.abs(posPopup.delta) > 1 ? 'ões' : ''}`
                    : 'Mantivemos a posição'}
                </Typography>
              </Box>
              <Box sx={{ px: 2, py: 1.2, display: 'flex', justifyContent: 'center', gap: 3 }}>
                {[{ label: 'ANTES', val: posPopup.posBefore, color: C.ink }, { label: 'AGORA', val: posPopup.posAfter, color: posPopup.delta > 0 ? C.green : posPopup.delta < 0 ? C.red : C.ink }].map((s, i) => (
                  <React.Fragment key={i}>
                    {i === 1 && <Typography sx={{ color: C.ink3, fontSize: '1.5rem', alignSelf: 'center' }}>→</Typography>}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>{s.label}</Typography>
                      <Typography sx={{ color: s.color, fontWeight: 900, fontSize: '1.8rem', lineHeight: 1 }}>{s.val}º</Typography>
                    </Box>
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Tabela */}
        <Box sx={{ bgcolor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '34px 18px 1fr 26px 24px 28px 34px', px: 1, py: 0.7, bgcolor: C.bgCardAlt, borderBottom: `1px solid ${C.border}` }}>
            {['#', '', 'TIME', 'V', 'D', 'SG', 'PTS'].map((h, i) => (
              <Typography key={i} sx={{ color: C.ink3, fontSize: '0.52rem', fontWeight: 900, textAlign: i <= 2 ? 'left' : 'center', pl: i === 2 ? 0.5 : 0 }}>{h}</Typography>
            ))}
          </Box>

          {displayRows.map((t, rowIdx) => {
            const idx    = sorted.findIndex(r => r.id === t.id);
            const isUser = t.id === 'user';
            const zc     = getZC(idx);
            const sg     = (t.gf || 0) - (t.ga || 0);
            const zone   = getZoneLabel(idx);
            const isLast = rowIdx === displayRows.length - 1;
            const gapBefore = !userInTop10 && rowIdx === 9;
            const mv = isUser && posPopup
              ? (posPopup.delta > 0 ? { icon: '↑', color: C.green } : posPopup.delta < 0 ? { icon: '↓', color: C.red } : { icon: '–', color: C.ink3 })
              : null;
            return (
              <React.Fragment key={t.id}>
                {gapBefore && (
                  <Box sx={{ px: 1, py: 0.25, bgcolor: C.bgCardAlt, borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>· · · · ·</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'grid', gridTemplateColumns: '34px 18px 1fr 26px 24px 28px 34px', px: 1, py: 0.65, alignItems: 'center', borderBottom: isLast ? 'none' : `1px solid ${C.border}`, bgcolor: isUser ? `${C.green}08` : 'transparent', borderLeft: `3px solid ${zc !== 'transparent' ? zc : 'transparent'}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: zc !== 'transparent' ? zc : C.bgCardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: zc !== 'transparent' ? '#fff' : C.ink2, fontWeight: 900, fontSize: '0.65rem' }}>{idx + 1}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {TeamIcon ? React.createElement(TeamIcon, { name: t.name, size: 14 }) : null}
                  </Box>
                  <Typography sx={{ color: isUser ? C.green : C.ink, fontWeight: isUser ? 900 : 600, fontSize: '0.68rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', pl: 0.5 }}>{t.name}</Typography>
                  <Typography sx={{ textAlign: 'center', color: C.green, fontSize: '0.62rem', fontWeight: 900 }}>{t.w}</Typography>
                  <Typography sx={{ textAlign: 'center', color: C.red,   fontSize: '0.62rem', fontWeight: 700 }}>{t.l}</Typography>
                  <Typography sx={{ textAlign: 'center', color: sg >= 0 ? C.ink2 : C.red, fontSize: '0.62rem', fontWeight: 700 }}>{sg >= 0 ? `+${sg}` : sg}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.3 }}>
                    {mv && <Typography sx={{ color: mv.color, fontWeight: 900, fontSize: '0.62rem', lineHeight: 1 }}>{mv.icon}</Typography>}
                    <Box sx={{ bgcolor: isUser ? C.green : C.bgCardAlt, borderRadius: '5px', px: 0.5, py: 0.1, minWidth: 22, textAlign: 'center' }}>
                      <Typography sx={{ color: isUser ? '#000' : C.ink, fontWeight: 900, fontSize: '0.68rem' }}>{t.pts}</Typography>
                    </Box>
                  </Box>
                </Box>
                {isUser && zone && (
                  <Box sx={{ px: 1, py: 0.3, bgcolor: `${zone.color}10`, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: zone.color }} />
                    <Typography sx={{ color: zone.color, fontSize: '0.48rem', fontWeight: 900 }}>{zone.label}</Typography>
                  </Box>
                )}
              </React.Fragment>
            );
          })}
        </Box>

        {/* Legenda de zonas */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
          {(serie === 'A'
            ? [{ color: C.green, label: 'Libertadores G4' }, { color: C.blue, label: 'Pré-Libert. G6' }, { color: C.purple, label: 'Sul-Am. G12' }, { color: C.red, label: 'Rebaixamento Z4' }]
            : [{ color: C.green, label: 'Acesso G4' }, { color: C.red, label: 'Rebaixamento Z4' }]
          ).map((z, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: z.color }} />
              <Typography sx={{ color: C.ink3, fontSize: '0.52rem', fontWeight: 700 }}>{z.label}</Typography>
            </Box>
          ))}
        </Box>
      </>
    );
  })();

  // ── Aba 3: Desfalques pós-jogo ────────────────────────
  const tabDesfalques = hasDesfalques ? (
    <>
      {/* Aviso de bloqueio se há titulares afetados */}
      {desfalques.hasBlockers && !acknowledged && (
        <Box sx={{
          bgcolor: `${C.red}0e`, border: `2px solid ${C.red}60`,
          borderRadius: '14px', p: 1.5, mb: 1.2,
          display: 'flex', alignItems: 'flex-start', gap: 1,
        }}>
          <Typography sx={{ fontSize: '1.4rem', lineHeight: 1.2, flexShrink: 0 }}>🚨</Typography>
          <Box>
            <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.82rem', lineHeight: 1.2, mb: 0.3 }}>
              TITULARES INDISPONÍVEIS
            </Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.4 }}>
              Jogadores que estavam no time foram suspensos ou lesionados neste jogo.
              Você precisa ajustar a escalação antes de continuar.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Suspensões */}
      {desfalques.suspensions.length > 0 && (
        <Card accent={`${C.red}50`}>
          <CardHead label="SUSPENSOS" icon="🟥" color={C.red} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {desfalques.suspensions.map((s, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                py: 0.85, borderBottom: i < desfalques.suspensions.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                  bgcolor: `${C.red}15`, border: `1.5px solid ${C.red}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{s.icon}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.82rem', color: C.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {s.player.name}
                    </Typography>
                    {s.wasStarter && (
                      <Box sx={{ bgcolor: `${C.red}20`, border: `1px solid ${C.red}40`, borderRadius: '4px', px: 0.5, py: 0.05, flexShrink: 0 }}>
                        <Typography sx={{ color: C.red, fontSize: '0.4rem', fontWeight: 900 }}>ERA TITULAR</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>
                    {s.reason}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem' }}>
                    Fora do
                  </Typography>
                  <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem' }}>
                    {PostMatchAgent.formatRoundsLeft(s.roundsLeft)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Lesionados */}
      {desfalques.injuries.length > 0 && (
        <Card accent={`${C.gold}50`}>
          <CardHead label="LESIONADOS" icon="🚑" color={C.gold} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {desfalques.injuries.map((inj, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                py: 0.85, borderBottom: i < desfalques.injuries.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                  bgcolor: `${C.gold}15`, border: `1.5px solid ${C.gold}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>🚑</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.82rem', color: C.txt1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {inj.player.name}
                    </Typography>
                    {inj.wasStarter && (
                      <Box sx={{ bgcolor: `${C.gold}20`, border: `1px solid ${C.gold}40`, borderRadius: '4px', px: 0.5, py: 0.05, flexShrink: 0 }}>
                        <Typography sx={{ color: C.gold, fontSize: '0.4rem', fontWeight: 900 }}>ERA TITULAR</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>
                    {inj.injuryType} · {PostMatchAgent.formatRoundsLeft(inj.roundsLeft)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Box sx={{
                    bgcolor: inj.severity === 'high' ? `${C.red}15` : `${C.gold}15`,
                    border: `1px solid ${inj.severity === 'high' ? C.red : C.gold}40`,
                    borderRadius: '6px', px: 0.8, py: 0.3,
                  }}>
                    <Typography sx={{ color: inj.severity === 'high' ? C.red : C.gold, fontWeight: 900, fontSize: '0.62rem' }}>
                      {inj.roundsLeft} rod.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Botão de confirmação — só aparece se há titulares afetados */}
      {desfalques.hasBlockers && !acknowledged && (
        <Button
          fullWidth
          onClick={() => { setAcknowledged(true); setScreen('lineup'); }}
          sx={{
            py: 1.4, borderRadius: '12px', fontWeight: 900, fontSize: '0.88rem',
            bgcolor: C.red, color: '#fff',
            boxShadow: `0 4px 16px ${C.red}40`,
            '&:hover': { bgcolor: '#b91c1c' },
            mb: 1,
          }}
        >
          📋 ENTENDIDO — IR PARA ESCALAÇÃO
        </Button>
      )}
      {desfalques.hasBlockers && acknowledged && (
        <Box sx={{ bgcolor: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: '10px', p: 1.2, mb: 1, textAlign: 'center' }}>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.72rem' }}>
            ✅ Lembrete reconhecido — ajuste a escalação antes do próximo jogo
          </Typography>
        </Box>
      )}
    </>
  ) : null;

  // ── Render ─────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10 }}>
      {header}

      {/* Seletor de abas */}
      <Box sx={{ display: 'flex', mx: 1.5, mt: 1.2, mb: 0.8, bgcolor: C.bgCard, borderRadius: '10px', p: 0.4, border: `1px solid ${C.border}` }}>
        {TABS.map((label, i) => (
          <Box
            key={i}
            onClick={() => setTab(i)}
            sx={{
              flex: 1, py: 0.8, textAlign: 'center', borderRadius: '7px', cursor: 'pointer',
              bgcolor: tab === i ? C.green : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <Typography sx={{ color: tab === i ? '#000' : C.ink3, fontWeight: 900, fontSize: '0.6rem' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Conteúdo da aba */}
      <Box sx={{ px: 1.5, pt: 0.5 }}>
        {tab === 0 && tabSumula}
        {tab === 1 && tabFinancas}
        {tab === 2 && tabTabela}
        {tab === 3 && tabDesfalques}
      </Box>

      {/* Botão Voltar ao Painel */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        {isBlocked ? (
          <Button
            fullWidth
            onClick={() => setTab(3)}
            sx={{
              py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem',
              bgcolor: C.red, color: '#fff',
              boxShadow: `0 4px 16px ${C.red}40`,
              '&:hover': { bgcolor: '#b91c1c' },
              animation: 'pulse-red 1.8s infinite',
              '@keyframes pulse-red': {
                '0%, 100%': { boxShadow: `0 4px 16px ${C.red}40` },
                '50%': { boxShadow: `0 4px 28px ${C.red}80` },
              },
            }}
          >
            🚨 VER DESFALQUES ANTES DE SAIR
          </Button>
        ) : (
          <Button
            fullWidth
            onClick={() => setScreen('home')}
            sx={{
              py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem',
              bgcolor: C.green, color: '#000',
              boxShadow: `0 4px 16px ${C.green}40`,
              '&:hover': { bgcolor: C.primaryDim },
            }}
          >
            🏠 VOLTAR AO PAINEL
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ScreenPostMatch;

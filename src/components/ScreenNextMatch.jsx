// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { CupsEngine } from '../engines/cups_engine.js';
import { CalendarEngine } from '../engines/CalendarEngine.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';
import { resolveMatchInfo } from '../utils/matchDateUtils.js';

// components/ScreenNextMatch.js — v4.0 (Reestilizado: escalações + stats + bug fix)
const ScreenNextMatch = ({ gameData, startMatchSimulation, simulating, setScreen }) => {
  const TeamIcon = window.TeamIcon;
  const C = THEME;

  // ── Fim de temporada ─────────────────────────────────────
  const _calLen = gameData.calendar?.length || gameData.fixtures.length;
  if (gameData.round >= _calLen) {
    const myRow = gameData.table.find(t => t.id === 'user') || {};
    const pos   = gameData.table.findIndex(t => t.id === 'user') + 1;
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box sx={{ bgcolor: C.card, border: `2px solid ${C.green}`, borderRadius: '16px', p: 3, textAlign: 'center', maxWidth: 340, width: '100%' }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>🏆</Typography>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.2rem', mb: 0.8 }}>FIM DA TEMPORADA!</Typography>
          <Typography sx={{ color: C.txt2, mb: 2.5, fontSize: '0.85rem' }}>
            {gameData.club.name} finalizou em <strong style={{ color: C.txt1 }}>{pos}º lugar</strong> com <strong style={{ color: C.green }}>{myRow.pts} pts</strong>
          </Typography>
          <Button fullWidth onClick={() => setScreen('table')} sx={{ bgcolor: C.green, color: '#fff', fontWeight: 900, borderRadius: '10px', py: 1.2 }}>
            Ver Tabela Final
          </Button>
        </Box>
      </Box>
    );
  }

  // ── FONTE ÚNICA DE VERDADE: o calendário ─────────────────
  // gameData.round = índice do SLOT no calendário (inclui slots de copa).
  // gameData.fixtures é indexado por RODADA DE LIGA apenas (leagueIdx).
  const calendar  = gameData.calendar || [];
  const calEntry  = calendar[gameData.round];
  const isCalCup  = calEntry?.type === 'cup';

  const cupInfo    = isCalCup && CalendarEngine?.getCupMatchForCalendarSlot
    ? CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calEntry)
    : { hasCupMatch: false };
  const isCupRound = cupInfo.hasCupMatch;

  // Se o slot é copa sem jogo ativo → mostra o jogo de liga do próximo slot de liga.
  // Inicia busca em round+1 para não travar no próprio slot de copa.
  const _leagueIdx = (() => {
    if (!isCalCup) return calEntry?.leagueIdx ?? gameData.round;
    for (let i = gameData.round + 1; i < calendar.length; i++) {
      if (calendar[i]?.type === 'league') return calendar[i].leagueIdx;
    }
    // Fallback: última liga antes deste slot
    for (let i = gameData.round - 1; i >= 0; i--) {
      if (calendar[i]?.type === 'league') return calendar[i].leagueIdx;
    }
    return gameData.round;
  })();

  const roundMatches = _leagueIdx >= 0 ? (gameData.fixtures[_leagueIdx] || []) : [];
  const myMatch      = (!isCupRound) ? roundMatches.find(m => m.home?.isPlayer || m.away?.isPlayer) : null;
  const thisRound    = gameData.round + 1;

  const val = window.getLineupValidation
    ? window.getLineupValidation(gameData)
    : { isValid: true, avgStrength: 0, req: {}, counts: {} };

  // ── Data e hora do jogo ───────────────────────────────────
  const matchInfo = resolveMatchInfo(gameData, gameData.round);

  let displayHome, displayAway, matchLabel, matchColor, matchInfo2;
  if (isCupRound && cupInfo.tie) {
    const tie    = cupInfo.tie;
    const isLeg2 = cupInfo.leg === 'leg2';
    displayHome  = isLeg2 ? tie.away : tie.home;
    displayAway  = isLeg2 ? tie.home : tie.away;
    matchLabel   = `${cupInfo.label} · ${tie.phase} · ${isLeg2 ? 'Jogo de Volta' : 'Jogo de Ida'}`;
    matchColor   = cupInfo.label?.includes('Brasil') ? '#00695c' : cupInfo.label?.includes('Libert') ? '#1a237e' : '#b71c1c';
    if (isLeg2 && tie.leg1?.played) matchInfo2 = `Ida: ${tie.home?.name} ${tie.leg1.home}×${tie.leg1.away} ${tie.away?.name}`;
  } else if (myMatch) {
    displayHome = myMatch.home;
    displayAway = myMatch.away;
    matchLabel  = `Série ${gameData.serie} · Rodada ${(_leagueIdx >= 0 ? _leagueIdx : (calEntry?.leagueIdx ?? gameData.round)) + 1}/${gameData.fixtures.length}`;
    matchColor  = C.blue;
  }

  const isUserHome   = displayHome?.isPlayer;
  const opponent     = isUserHome ? displayAway : displayHome;
  const myRow        = gameData.table?.find(t => t.id === 'user') || {};
  const oppRow       = gameData.table?.find(t => t.name === opponent?.name) || {};
  const myPos        = (gameData.table?.findIndex(t => t.id === 'user') ?? -1) + 1;
  const oppPos       = (gameData.table?.findIndex(t => t.name === opponent?.name) ?? -1) + 1;
  // #17 H2H: histórico de confrontos diretos
  const h2hRecord = opponent?.name && gameData.h2hHistory?.[opponent.name]
    ? gameData.h2hHistory[opponent.name]
    : null;
  const myStr        = val.avgStrength || 70;
  const oppStr       = opponent?.strength || 70;
  const myStrColor   = myStr > oppStr + 4 ? C.green : myStr < oppStr - 4 ? C.red : C.yellow;

  // Escalação dos dois times
  const myPlayers    = (gameData.players || []).filter(p => p.isStarting);
  const oppSquadRaw  = gameData.teamRosters?.[opponent?.id] || opponent?.squad || [];
  const POS_ORDER_ADV = { GOL:0, ZAG:1, LD:2, LE:3, VOL:4, MC:5, MEI:6, PD:7, PE:8, CA:9, LAT:2, ATA:9 };
  const _sortByPos = arr => [...arr].sort((a, b) =>
    (POS_ORDER_ADV[a.position] ?? 9) - (POS_ORDER_ADV[b.position] ?? 9) ||
    (b.overall || 0) - (a.overall || 0)
  );
  // Preferir titulares marcados; fallback: melhores 11 do squad ordenados por posição
  const oppStarters  = (() => {
    const marked = oppSquadRaw.filter(p => p.isStarting);
    if (marked.length >= 11) return _sortByPos(marked).slice(0, 11);
    const byPos = {};
    oppSquadRaw.forEach(p => {
      if (!byPos[p.position]) byPos[p.position] = [];
      byPos[p.position].push(p);
    });
    Object.keys(byPos).forEach(k => byPos[k].sort((a,b) => (b.overall||0)-(a.overall||0)));
    const pick = (pos, n) => (byPos[pos] || []).slice(0, n);
    const auto = [
      ...pick('GOL', 1),
      ...pick('ZAG', 2), ...pick('LD', 1), ...pick('LE', 1),
      ...pick('VOL', 2), ...pick('MC', 1),
      ...pick('PD', 1), ...pick('PE', 1), ...pick('CA', 1),
      // compat saves antigos
      ...pick('LAT', 2), ...pick('ATA', 3),
    ].slice(0, 11);
    if (auto.length < 11) {
      const autoIds = new Set(auto.map(p => p.id));
      const rest = oppSquadRaw.filter(p => !autoIds.has(p.id)).sort((a,b) => (b.overall||0)-(a.overall||0));
      auto.push(...rest.slice(0, 11 - auto.length));
    }
    return _sortByPos(auto);
  })();

  // Validação
  const starters = myPlayers;
  const illegalStarters = starters.filter(p => {
    const nextRound = gameData.round + 1;
    const isSusp = window.DisciplineEngine
      ? window.DisciplineEngine.isPlayerSuspended(p, nextRound)
      : (p.discipline?.suspendedUntilRound != null && nextRound <= p.discipline.suspendedUntilRound);
    return isSusp || !!p.injury;
  });
  const isFullyReady = val.isValid && illegalStarters.length === 0;
  const canPlay      = isFullyReady && !simulating && !!displayHome;

  // Forma recente
  const recentForm = [];
  for (let r = gameData.round - 1; r >= 0 && recentForm.length < 5; r--) {
    const m = (gameData.fixtures[r] || []).find(mx => mx.home.isPlayer || mx.away.isPlayer);
    if (!m || !m.played || !m.result) continue;
    const [hg, ag] = (m.result || '0-0').split('-').map(n => parseInt(n.trim()) || 0);
    const myG = m.home.isPlayer ? hg : ag, oppG = m.home.isPlayer ? ag : hg;
    recentForm.push(myG > oppG ? 'V' : myG < oppG ? 'D' : 'E');
  }

  const POS_ORDER = { GOL:0, ZAG:1, LD:2, LE:3, VOL:4, MC:5, MEI:6, PD:7, PE:8, CA:9, LAT:2, ATA:9 };
  const sortPos   = arr => [...arr].sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9));

  // ── Auto-simular (sem animação) ───────────────────────────
  const handleAutoSimulate = React.useCallback(() => {
    if (!canPlay) return;
    window._smrAutoSimulate = true;  // ScreenMatchResult lê e reseta
    startMatchSimulation();
  }, [canPlay, startMatchSimulation]);

  // ── Placar agregado (jogo de volta) ──────────────────────
  const aggregateInfo = (() => {
    if (!isCupRound || cupInfo.leg !== 'leg2' || !cupInfo.tie?.leg1?.played) return null;
    const tie = cupInfo.tie;
    // Gol de ida: homeAggr = leg1.home (time home original)
    //             awayAggr = leg1.away (time away original)
    const leg1Home = tie.leg1.home ?? 0;
    const leg1Away = tie.leg1.away ?? 0;
    const isUserHome   = tie.home?.isPlayer;
    const userIdaGols  = isUserHome ? leg1Home : leg1Away;
    const oppIdaGols   = isUserHome ? leg1Away : leg1Home;
    return {
      homeTeam:  tie.home?.name,
      awayTeam:  tie.away?.name,
      leg1Home, leg1Away,
      userIdaGols, oppIdaGols,
      isUserHome,
    };
  })();
  const posColor = (pos) => {
    if (pos === 'GOL') return '#f59e0b';
    if (['ZAG','LD','LE','LAT'].includes(pos)) return '#3b82f6';
    if (['VOL','MC','MEI'].includes(pos)) return '#22c55e';
    return '#ef4444'; // CA, PD, PE, ATA
  };

  const PlayerRow = ({ p, align = 'left' }) => {
    const JB = window.JerseyBadge;
    const goals = p.seasonGoals || p.goals || 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, py: 0.35,
        flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
        {JB ? React.createElement(JB, { pos: p.position, num: p.shirt ?? '?', size: 32, showPos: false })
          : <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: posColor(p.position), flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#fff', fontSize: '0.52rem', fontWeight: 900 }}>{p.position}</Typography>
            </Box>
        }
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: C.txt1, lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textAlign: align }}>
            {p.name?.split(' ').slice(-1)[0] || p.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
            <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>
              OVR {p.overall}
            </Typography>
            {goals > 0 && (
              <Typography sx={{ color: C.green, fontSize: '0.5rem', fontWeight: 900 }}>⚽{goals}</Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 12,
      background: `radial-gradient(ellipse at 50% 0%, #dcfce7 0%, transparent 35%), ${C.bg}` }}>

      {/* ── HEADER COM BOTÕES DE AÇÃO ── */}
      <Box sx={{
        background: `linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,
        borderBottom: `1px solid ${C.border}`, px: 1.5, pt: 3.8, pb: 1.2,
      }}>
        {/* Linha de info + botões */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0 }}>
          {/* Info da partida */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 1.5, mb: 0.3 }}>
              {isCupRound ? '🏆 COPA' : '🏟️ PRÓXIMA PARTIDA'}
            </Typography>
            {matchLabel && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
                bgcolor: `${matchColor}15`, border: `1px solid ${matchColor}30`,
                borderRadius: '6px', px: 0.8, py: 0.2, mb: 0.3 }}>
                <Typography sx={{ color: matchColor, fontWeight: 900, fontSize: '0.58rem' }}>{matchLabel}</Typography>
              </Box>
            )}
            {/* Data e hora do jogo */}
            {matchInfo.fullStr && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
                <Typography sx={{ fontSize: '0.7rem' }}>📅</Typography>
                <Typography sx={{ color: C.txt2, fontSize: '0.6rem', fontWeight: 700 }}>
                  {matchInfo.fullStr}
                </Typography>
              </Box>
            )}
            {matchInfo2 && (
              <Typography sx={{ color: C.txt3, fontSize: '0.54rem', fontWeight: 700, display: 'block' }}>{matchInfo2}</Typography>
            )}
          </Box>

          {/* Botões de ação — coluna direita */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
            {/* JOGAR */}
            <Box onClick={canPlay ? startMatchSimulation : undefined} sx={{
              bgcolor: canPlay ? C.green : C.cardAlt,
              border: `1.5px solid ${canPlay ? C.green : C.border}`,
              borderRadius: '10px', px: 1.4, py: 0.7,
              display: 'flex', alignItems: 'center', gap: 0.6,
              cursor: canPlay ? 'pointer' : 'default',
              boxShadow: canPlay ? `0 0 16px ${C.green}45` : 'none',
              opacity: simulating ? 0.6 : 1,
              '&:active': canPlay ? { filter: 'brightness(0.88)' } : {},
            }}>
              <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>
                {simulating ? '⏳' : !isFullyReady ? '🚫' : isCupRound ? '🏆' : '▶'}
              </Typography>
              <Box>
                <Typography sx={{ color: canPlay ? '#000' : C.txt3, fontWeight: 900, fontSize: '0.65rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {simulating ? 'SIMULANDO...'
                    : !val.isValid ? `${starters.length}/11`
                    : illegalStarters.length > 0 ? `${illegalStarters.length} INAPTO`
                    : isCupRound ? 'JOGAR COPA'
                    : 'JOGAR PARTIDA'}
                </Typography>
                <Typography sx={{ color: canPlay ? '#00000080' : C.txt3, fontSize: '0.48rem', fontWeight: 700, lineHeight: 1 }}>
                  com animação
                </Typography>
              </Box>
            </Box>

            {/* SIMULAR + VOLTAR em linha */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box onClick={canPlay ? handleAutoSimulate : undefined} sx={{
                flex: 1,
                bgcolor: canPlay ? `${C.teal}15` : C.cardAlt,
                border: `1.5px solid ${canPlay ? C.teal : C.border}`,
                borderRadius: '9px', px: 1, py: 0.6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
                cursor: canPlay ? 'pointer' : 'default',
                '&:active': canPlay ? { filter: 'brightness(0.88)' } : {},
              }}>
                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>⚡</Typography>
                <Typography sx={{ color: canPlay ? C.teal : C.txt3, fontWeight: 900, fontSize: '0.58rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  Simular
                </Typography>
              </Box>
              <Box onClick={() => setScreen('home')} sx={{
                flex: 1,
                bgcolor: 'transparent', border: `1.5px solid ${C.border}`,
                borderRadius: '9px', px: 1, py: 0.6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4,
                cursor: 'pointer', '&:active': { bgcolor: C.cardAlt },
              }}>
                <Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>←</Typography>
                <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.58rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  Menu
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Corrigir escalação */}
        {!isFullyReady && (
          <Box onClick={() => setScreen('lineup')} sx={{
            mt: 0.8, bgcolor: `${C.red}08`, border: `1px solid ${C.red}40`,
            borderRadius: '8px', px: 1.2, py: 0.6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0.7,
            '&:active': { bgcolor: `${C.red}15` },
          }}>
            <Typography sx={{ fontSize: '0.8rem' }}>📋</Typography>
            <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.62rem' }}>
              {illegalStarters.length > 0 ? `${illegalStarters.length} jogador(es) inapto(s) na escalação — corrigir` : 'Escalação incompleta — corrigir'}
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ px: 1.5, pt: 1.5 }}>

        {/* ── CARD PRINCIPAL: VS ── */}
        <Box sx={{ bgcolor: C.card, border: `1.5px solid ${C.border}`, borderRadius: '16px',
          overflow: 'hidden', mb: 1.2, boxShadow: `0 4px 20px rgba(0,0,0,0.12)` }}>

          {/* Faixa VS */}
          <Box sx={{ px: 2, pt: 1.8, pb: 1.2, display: 'flex', alignItems: 'center', gap: 1,
            background: `linear-gradient(135deg, ${C.green}08 0%, transparent 60%)` }}>

            {/* ── TIME MANDANTE (sempre à esquerda) ── */}
            {[displayHome, displayAway].map((team, side) => {
              const isUser = team?.isPlayer;
              const row    = isUser ? myRow : oppRow;
              const pos    = isUser ? myPos : oppPos;
              const isHome = side === 0;
              const accentColor = isUser ? C.green : C.blue;
              const label  = isHome ? '🏠 CASA' : '✈️ FORA';
              return (
                <Box key={side} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 58, height: 58, borderRadius: '14px', bgcolor: C.cardAlt,
                    border: `2px solid ${isUser ? C.green : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isUser ? `0 0 16px ${C.green}40` : 'none' }}>
                    {TeamIcon && team
                      ? React.createElement(TeamIcon, { name: team.name, size: 42 })
                      : <Typography sx={{ fontSize: '1.6rem' }}>⚽</Typography>}
                  </Box>
                  <Typography sx={{ color: isUser ? C.green : C.txt1,
                    fontWeight: 900, fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.1, maxWidth: 85 }}>
                    {team?.name || '—'}
                  </Typography>
                  <Box sx={{ bgcolor: `${accentColor}18`, border: `1px solid ${accentColor}35`,
                    borderRadius: '5px', px: 0.7, py: 0.15 }}>
                    <Typography sx={{ color: accentColor, fontWeight: 900, fontSize: '0.5rem' }}>
                      {label} · {pos > 0 ? `${pos}º` : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[{ l:'V', v: row.w||0, c: C.green }, { l:'E', v: row.d||0, c: C.yellow },
                      { l:'D', v: row.l||0, c: C.red },   { l:'PTS', v: row.pts||0, c: C.txt1 }].map((s,i) => (
                      <Box key={i} sx={{ textAlign:'center' }}>
                        <Typography sx={{ color: s.c, fontWeight:900, fontSize:'0.72rem', lineHeight:1 }}>{s.v}</Typography>
                        <Typography sx={{ color: C.txt3, fontSize:'0.42rem', fontWeight:700 }}>{s.l}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* VS central — inserido entre os dois times */}
            {/* (React renderiza array na ordem — o central precisa ser entre os dois) */}
          </Box>

          {/* VS overlay — colocado separado para não quebrar o flex */}
          <Box sx={{ position: 'relative', height: 0, overflow: 'visible' }}>
            <Box sx={{
              position: 'absolute', left: '50%', top: 0,
              transform: 'translate(-50%, -110px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
              pointerEvents: 'none', zIndex: 2,
            }}>
              <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '10px', px: 1, py: 0.5 }}>
                <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '1rem', letterSpacing: 3 }}>VS</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ color: myStrColor, fontWeight: 900, fontSize: '0.72rem' }}>{myStr}</Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.5rem' }}>vs</Typography>
                <Typography sx={{ color: C.blue, fontWeight: 900, fontSize: '0.72rem' }}>{oppStr}</Typography>
              </Box>
              <Box sx={{ width: 60, height: 5, bgcolor: C.bgDark, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${Math.round((myStr / (myStr + oppStr)) * 100)}%`, bgcolor: myStrColor, borderRadius: 3 }} />
              </Box>
              {h2hRecord && (
                <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '6px', px: 0.8, py: 0.25 }}>
                  <Typography sx={{ color: C.txt3, fontSize: '0.4rem', fontWeight: 700, textAlign: 'center' }}>H2H</Typography>
                  <Box sx={{ display: 'flex', gap: 0.4 }}>
                    <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.58rem' }}>{h2hRecord.w}V</Typography>
                    <Typography sx={{ color: C.yellow, fontWeight: 900, fontSize: '0.58rem' }}>{h2hRecord.d}E</Typography>
                    <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem' }}>{h2hRecord.l}D</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Forma recente */}
          {recentForm.length > 0 && (
            <Box sx={{ px: 2, pb: 1.2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700, flexShrink: 0 }}>FORMA:</Typography>
              {recentForm.map((f, i) => {
                const fc = f === 'V' ? C.green : f === 'D' ? C.red : C.yellow;
                return (
                  <Box key={i} sx={{ width: 22, height: 22, borderRadius: '6px',
                    bgcolor: `${fc}20`, border: `1.5px solid ${fc}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: fc, fontWeight: 900, fontSize: '0.6rem' }}>{f}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ── ESCALAÇÕES ── */}
        <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2 }}>
          <Box sx={{ bgcolor: C.cardAlt, px: 1.5, py: 0.8, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Typography sx={{ fontSize: '0.9rem' }}>📋</Typography>
            <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.8 }}>ESCALAÇÕES</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
            {/* Meu time — SEMPRE À ESQUERDA */}
            <Box sx={{ px: 1.2, py: 0.8 }}>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 0.5, mb: 0.5 }}>
                {gameData.club.name?.split(' ').slice(0,2).join(' ')} ({myPlayers.length}/11)
              </Typography>
              {sortPos(myPlayers).map((p, i) => (
                <PlayerRow key={i} p={p} align="left" />
              ))}
              {myPlayers.length === 0 && (
                <Typography sx={{ color: C.red, fontSize: '0.6rem', fontWeight: 700, py: 1 }}>Nenhum titular</Typography>
              )}
            </Box>
            {/* Divisor */}
            <Box sx={{ bgcolor: C.border }} />
            {/* Adversário — SEMPRE À DIREITA */}
            <Box sx={{ px: 1.2, py: 0.8 }}>
              <Typography sx={{ color: C.blue, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 0.5, mb: 0.5, textAlign: 'right' }}>
                {opponent?.name?.split(' ').slice(0,2).join(' ')} ({oppStarters.length}/11)
              </Typography>
              {sortPos(oppStarters).map((p, i) => (
                <PlayerRow key={i} p={p} align="right" />
              ))}
              {oppStarters.length === 0 && (
                <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, py: 1, textAlign: 'right' }}>Elenco CPU</Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── STATUS DA ESCALAÇÃO ── */}
        <Box sx={{
          bgcolor: isFullyReady ? `${C.green}08` : `${C.red}08`,
          border: `1.5px solid ${isFullyReady ? C.green : C.red}40`,
          borderRadius: '12px', overflow: 'hidden', mb: 1.2,
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.4, py: 0.9,
            borderBottom: `1px solid ${isFullyReady ? C.green : C.red}20`,
            background: isFullyReady ? `${C.green}06` : `${C.red}06` }}>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>
              {isFullyReady ? '✅' : '🚨'}
            </Typography>
            <Typography sx={{ color: isFullyReady ? C.green : C.red, fontWeight: 900, fontSize: '0.78rem', flex: 1 }}>
              {isFullyReady ? 'Elenco pronto para jogar' : !val.isValid ? `Escalação incompleta (${starters.length}/11)` : 'Jogadores inaptos na escalação'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
              bgcolor: isFullyReady ? `${C.green}18` : `${C.red}18`, borderRadius: '8px', px: 0.9, py: 0.3 }}>
              <Typography sx={{ color: C.txt3, fontSize: '0.48rem', fontWeight: 700 }}>OVR</Typography>
              <Typography sx={{ color: isFullyReady ? C.green : C.red, fontWeight: 900, fontSize: '0.82rem', lineHeight: 1 }}>
                {val.avgStrength || 0}
              </Typography>
            </Box>
          </Box>

          {/* Jogadores inaptos */}
          {illegalStarters.length > 0 && (
            <Box sx={{ px: 1.4, py: 0.8, borderBottom: `1px solid ${C.red}15` }}>
              <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem', mb: 0.5 }}>⛔ REMOVA DA ESCALAÇÃO:</Typography>
              {illegalStarters.map((p, i) => {
                const isSusp = window.DisciplineEngine?.isPlayerSuspended(p, gameData.round + 1);
                return (
                  <Typography key={i} sx={{ color: C.red, fontSize: '0.62rem', fontWeight: 700, mb: 0.2 }}>
                    • {p.name.split(' ').pop()} ({isSusp ? 'suspenso 🟥' : 'lesionado 🚑'})
                  </Typography>
                );
              })}
            </Box>
          )}

          {/* Grid de posições */}
          <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'].map(pos => {
                const req = val.req?.[pos] || 0;
                if (!req) return null;
                const cnt = val.counts?.[pos] || 0;
                const ok  = cnt >= req;
                const bad = illegalStarters.some(p => p.position === pos);
                const col = posColor(pos);
                const pct = req > 0 ? Math.min(1, cnt / req) : 0;
                return (
                  <Box key={pos} sx={{
                    flex: '1 1 calc(33% - 4px)', minWidth: 80,
                    bgcolor: bad ? `${C.red}10` : ok ? `${col}10` : `${C.red}06`,
                    border: `1.5px solid ${bad ? C.red : ok ? `${col}60` : `${C.red}40`}`,
                    borderRadius: '8px', p: 0.7,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                      <Typography sx={{ color: bad ? C.red : ok ? col : C.red, fontWeight: 900, fontSize: '0.6rem' }}>
                        {bad ? '⚠️ ' : ''}{pos}
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '0.7rem', color: bad ? C.red : ok ? C.txt1 : C.red, lineHeight: 1 }}>
                        {cnt}<Typography component="span" sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>/{req}</Typography>
                      </Typography>
                    </Box>
                    {/* Mini barra de preenchimento */}
                    <Box sx={{ height: 3, bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct * 100}%`, bgcolor: bad ? C.red : ok ? col : C.red, borderRadius: 99 }} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* ── PLACAR AGREGADO (jogo de volta) ── */}
        {aggregateInfo && (
          <Box sx={{ bgcolor: `${matchColor}10`, border: `1.5px solid ${matchColor}50`, borderRadius: '12px', p: 1.3, mb: 1.2 }}>
            <Typography sx={{ color: matchColor, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.8, mb: 0.8 }}>
              🏆 PLACAR AGREGADO — {cupInfo.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.72rem' }}>
                  {aggregateInfo.homeTeam?.split(' ').slice(0, 1).join(' ')}
                </Typography>
                <Typography sx={{ color: aggregateInfo.leg1Home > aggregateInfo.leg1Away ? C.green : aggregateInfo.leg1Home < aggregateInfo.leg1Away ? C.red : C.yellow, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>
                  {aggregateInfo.leg1Home}
                </Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>Gols ida</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, mb: 0.2 }}>IDA</Typography>
                <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '6px', px: 1, py: 0.3 }}>
                  <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {aggregateInfo.leg1Home} – {aggregateInfo.leg1Away}
                  </Typography>
                </Box>
                <Typography sx={{ color: C.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.2 }}>Quem marca avança</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.72rem' }}>
                  {aggregateInfo.awayTeam?.split(' ').slice(0, 1).join(' ')}
                </Typography>
                <Typography sx={{ color: aggregateInfo.leg1Away > aggregateInfo.leg1Home ? C.green : aggregateInfo.leg1Away < aggregateInfo.leg1Home ? C.red : C.yellow, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>
                  {aggregateInfo.leg1Away}
                </Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>Gols ida</Typography>
              </Box>
            </Box>
            {/* Quem precisa de quê */}
            <Box sx={{ mt: 0.8, bgcolor: C.cardAlt, borderRadius: '8px', px: 1, py: 0.5, textAlign: 'center' }}>
              {aggregateInfo.userIdaGols > aggregateInfo.oppIdaGols
                ? <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.58rem' }}>
                    🟢 Você está na frente! Empate classifica.
                  </Typography>
                : aggregateInfo.userIdaGols < aggregateInfo.oppIdaGols
                ? <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem' }}>
                    🔴 Precisamos vencer! Empate leva a pênaltis.
                  </Typography>
                : <Typography sx={{ color: C.yellow, fontWeight: 900, fontSize: '0.58rem' }}>
                    🟡 Empate no agregado! Vencer classifica ou pênaltis.
                  </Typography>
              }
            </Box>
          </Box>
        )}

        {/* ── BOTÃO CORRIGIR ESCALAÇÃO (inline, dentro do conteúdo) ── */}

        {/* ── PLACAR AGREGADO (jogo de volta) ── */}
      </Box>
    </Box>
  );
};

export default ScreenNextMatch;

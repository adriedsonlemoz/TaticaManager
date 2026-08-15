// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { CupsEngine } from '../engines/cups_engine.js';
import { CalendarEngine } from '../engines/CalendarEngine.js';

// components/ScreenMatches.js — v11.0
// ─────────────────────────────────────────────────────────────────────────────
// FIXES v11:
//  Bug 1: datas fictícias → datas reais (terças e sextas a partir de 05/abr)
//  Bug 2: copa do Brasil não aparecia em Resultados Recentes
//  Bug 3: dots de copa não apareciam no calendário
//  Bug 4: getRoundDateInfo não alinhava com dias da semana reais
//  Bug 5: totalMonths fixo em 5 → dinâmico
//  Bug 6: DAYS_IN_MONTH fixo em 28 → real por mês
//  Bug 8: eventos da mesma rodada sem agrupamento visual
//  Bug 9: jogos de copa passados faltavam no calendário
// ─────────────────────────────────────────────────────────────────────────────
const ScreenMatches = ({ gameData, setScreen }) => {
  const [calMonth,     setCalMonth]     = React.useState(0);
  const [selectedDay,  setSelectedDay]  = React.useState(null);
  const [sumulaModal,  setSumulaModal]  = React.useState(null);
  // 3.2: filtro por competição
  const [compFilter,   setCompFilter]   = React.useState('TODOS'); // 'TODOS' | 'CAMP' | 'COPA'

  const maxRounds    = gameData.fixtures.length;
  const currentRound = gameData.round;

  const TeamIcon = window.TeamIcon || (({ name, size }) => (
    <Box sx={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      bgcolor:'#1a6e2e', color:'#fff', border:'2px solid rgba(255,255,255,0.3)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size>28?'0.55rem':'0.4rem', fontWeight:900 }}>
      {(name||'?').substring(0,3).toUpperCase()}
    </Box>
  ));

  const C = THEME;

  // ═══════════════════════════════════════════════════════════
  // SISTEMA DE DATAS REAIS v2
  //
  // Liga: padrão Sáb → Qua → Sáb → Qua (gap 3–4 dias, nunca dois fins de semana seguidos)
  //   Rod 1 = Sáb 04/abr/2026 → Rod 2 = Qua 08/abr → Rod 3 = Sáb 11/abr → ...
  //   Sáb(+4d)→Qua(+3d)→Sáb(+4d)→Qua → gap mínimo 3d, máximo 4d
  //
  // Copa: busca o dia útil livre (seg–sex) ENTRE a rodada anterior e a rodada seguinte.
  //   Copa da rodada N ocorre entre ROUND_DATES[N-1] e ROUND_DATES[N].
  //   Preferência: um dia antes da próxima rodada de liga (Sex ou Ter).
  // ═══════════════════════════════════════════════════════════
  const SEASON_START = new Date(2026, 3, 4); // Sáb 04/abr/2026

  // Liga: Sáb/Qua alternados, gap 3–4 dias
  const ROUND_DATES = React.useMemo(() => {
    const dates = [];
    let cur = new Date(SEASON_START);
    for (let r = 0; r < maxRounds; r++) {
      dates.push(new Date(cur));
      cur = new Date(cur);
      const dow = cur.getDay();
      // Sáb(6)→+4→Qua(3), Qua(3)→+3→Sáb(6)
      if (dow === 6) cur.setDate(cur.getDate() + 4);
      else if (dow === 3) cur.setDate(cur.getDate() + 3);
      else cur.setDate(cur.getDate() + 3); // fallback (não deve ocorrer)
    }
    return dates;
  }, [maxRounds]);

  // ── getCupRoundDate ────────────────────────────────────────
  // Converte rodada de liga 1-based → data para jogo de copa.
  // A copa da rodada N ocorre APÓS ROUND_DATES[N-1] e ANTES de ROUND_DATES[N].
  // Âncora: ROUND_DATES[round1Based - 1] = rodada de liga imediatamente anterior.
  //
  // FIX v2: era getCupRoundDate(afterLeague+1) com ROUND_DATES[round1Based] → off-by-1.
  //         Agora: âncora em ROUND_DATES[round1Based - 1] (rodada anterior) e busca
  //         para frente (não para trás), garantindo cair entre as duas rodadas.
  const getCupRoundDate = React.useCallback((round1Based) => {
    // round1Based: a copa ocorre ENTRE a rodada (round1Based-1) e (round1Based).
    const prevLeague = ROUND_DATES[round1Based - 1];  // rodada de liga anterior (âncora)
    const nextLeague = ROUND_DATES[round1Based];       // rodada de liga seguinte

    const occupiedDates = new Set(ROUND_DATES.map(d => d.toDateString()));

    if (prevLeague && nextLeague) {
      const gapDays = Math.round((nextLeague - prevLeague) / (1000 * 60 * 60 * 24));
      // Busca do dia mais próximo de nextLeague para trás (evitar cola com liga anterior)
      for (let back = 1; back < gapDays; back++) {
        const cand = new Date(nextLeague);
        cand.setDate(cand.getDate() - back);
        const dow = cand.getDay();
        if (dow >= 1 && dow <= 5 && !occupiedDates.has(cand.toDateString())) return cand;
      }
    }

    // Pós-temporada: copa depois da última rodada
    if (prevLeague && !nextLeague) {
      for (let fwd = 2; fwd <= 7; fwd++) {
        const cand = new Date(prevLeague);
        cand.setDate(cand.getDate() + fwd);
        const dow = cand.getDay();
        if (dow >= 1 && dow <= 5 && !occupiedDates.has(cand.toDateString())) return cand;
      }
    }

    // Fallback: 2 dias após a rodada anterior
    if (prevLeague) {
      const fb = new Date(prevLeague);
      fb.setDate(fb.getDate() + 2);
      return fb;
    }
    return null;
  }, [ROUND_DATES]);

  const MONTH_NAMES = [
    'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
    'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO',
  ];
  const WEEK_DAYS_SHORT = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];

  const firstDate = ROUND_DATES[0];
  const lastDate  = ROUND_DATES[maxRounds - 1];
  const totalMonths = (lastDate.getFullYear() - firstDate.getFullYear()) * 12
    + (lastDate.getMonth() - firstDate.getMonth()) + 1;

  const displayMonthIdx = Math.max(0, Math.min(calMonth, totalMonths - 1));
  const realMonth = (firstDate.getMonth() + displayMonthIdx) % 12;
  const realYear  = firstDate.getFullYear()
    + Math.floor((firstDate.getMonth() + displayMonthIdx) / 12);

  const daysInMonth = new Date(realYear, realMonth + 1, 0).getDate();
  const firstDow    = new Date(realYear, realMonth, 1).getDay(); // 0=dom
  const startPad    = firstDow === 0 ? 6 : firstDow - 1; // seg=0

  // Fonte única de verdade: lê o calendar slot, não getCupMatchForRound
  const _getCupInfoForSlot = React.useCallback((calEntry) => {
    if (!calEntry || calEntry.type !== 'cup' || !gameData.cups) return { hasCupMatch: false };
    if (CalendarEngine?.getCupMatchForCalendarSlot)
      return CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calEntry);
    return { hasCupMatch: false };
  }, [gameData.cups]);

  // dayRounds: { "2026-4-7": [eventos] }
  const dayRoundsMap = React.useMemo(() => {
    const map     = {};
    const calendar = gameData.calendar || [];

    const addEvent = (date, event) => {
      if (!date) return;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    };

    // Percorre o calendário slot a slot
    for (let slotIdx = 0; slotIdx < calendar.length; slotIdx++) {
      const entry = calendar[slotIdx];
      if (!entry) continue;

      if (entry.type === 'league') {
        const r    = entry.leagueIdx;
        const date = ROUND_DATES[r];
        if (!date) continue;
        const fixtures  = gameData.fixtures[r] || [];
        const userMatch = fixtures.find(m => m.home.isPlayer || m.away.isPlayer);
        addEvent(date, {
          roundIdx: r, round: r + 1,
          played: slotIdx < currentRound,
          isUser: !!userMatch, isCup: false,
          match: userMatch, allMatches: fixtures,
        });
      } else if (entry.type === 'cup') {
        const cupInfo = _getCupInfoForSlot(entry);
        if (!cupInfo.hasCupMatch) continue;
        const leagueRoundAfter = entry.afterLeague ?? (entry.leagueIdx ?? 0);
        const date = getCupRoundDate(leagueRoundAfter); // afterLeague é 1-based; sem +1 com nova semântica
        if (!date) continue;
        const tie    = cupInfo.tie;
        const isLeg2 = cupInfo.leg === 'leg2';
        const home   = isLeg2 ? tie.away : tie.home;
        const away   = isLeg2 ? tie.home : tie.away;
        const played = isLeg2 ? (tie.leg2?.played || false) : (tie.leg1?.played || false);
        addEvent(date, {
          roundIdx: slotIdx, round: slotIdx + 1,
          played, isUser: true, isCup: true,
          cupLabel: cupInfo.label,
          cupColor: cupInfo.label?.includes('Brasil') ? '#00695c'
            : cupInfo.label?.includes('Libert') ? '#1a237e' : '#b71c1c',
          legLabel: cupInfo.leg === 'leg1'
            ? (tie.leg2 ? 'Jogo de Ida' : 'Jogo Único')
            : 'Jogo de Volta',
          phase: tie.phase, match: { home, away },
          cupKey: cupInfo.cupKey, leg: cupInfo.leg, tie,
        });
      }
    }

    return map;
  }, [currentRound, gameData.cups, gameData.calendar, maxRounds, ROUND_DATES, getCupRoundDate, _getCupInfoForSlot]);

  // 3.2: getMatchesForDay — função intermediária de acesso ao calendário
  const getMatchesForDay = React.useCallback((year, month, day) => {
    const key = `${year}-${month}-${day}`;
    const events = dayRoundsMap[key] || [];
    if (compFilter === 'CAMP') return events.filter(e => !e.isCup);
    if (compFilter === 'COPA') return events.filter(e => e.isCup);
    return events;
  }, [dayRoundsMap, compFilter]);

  // Manter getDayEvents como alias por compatibilidade interna
  const getDayEvents = (year, month, day) => getMatchesForDay(year, month, day);

  // ── Resultado/cor ─────────────────────────────────────────
  const getMatchResult = (match) => {
    if (!match?.result) return null;
    const [hg, ag] = match.result.split('-').map(Number);
    const won  = (match.home.isPlayer && hg > ag) || (match.away.isPlayer && ag > hg);
    const draw = hg === ag;
    // Pênaltis: armazenados em match.penalties = { home: N, away: N }
    const pen = match.penalties;
    const penLabel = pen ? `pen. ${pen.home}×${pen.away}` : null;
    return { hg, ag, pen: penLabel, color: won ? C.primary : draw ? C.gold : C.red, label: won ? 'V' : draw ? 'E' : 'D' };
  };

  const getDotColor = (ev) => {
    if (ev.isCup) return ev.cupColor || C.teal;
    if (!ev.isUser) return C.blue;
    if (!ev.played) return C.orange;
    const res = getMatchResult(ev.match);
    return res ? res.color : C.txt3;
  };

  // ── Upcoming events ───────────────────────────────────────
  // Percorre o calendário a partir do slot atual, não por índice de rodada
  const upcomingEvents = React.useMemo(() => {
    const events   = [];
    const calendar = gameData.calendar || [];

    for (let slotIdx = currentRound; slotIdx < calendar.length && events.length < 10; slotIdx++) {
      const entry = calendar[slotIdx];
      if (!entry) continue;

      if (entry.type === 'league') {
        const r = entry.leagueIdx;
        if (r === undefined || r >= maxRounds) continue;
        const leagueDate    = ROUND_DATES[r];
        if (!leagueDate) continue;
        const fixtures      = gameData.fixtures[r] || [];
        const userMatch     = fixtures.find(m => m.home.isPlayer || m.away.isPlayer);
        if (!userMatch) continue;
        const mName   = MONTH_NAMES[leagueDate.getMonth()].substring(0, 3);
        const weekDay = WEEK_DAYS_SHORT[(leagueDate.getDay() + 6) % 7];
        events.push({
          r, round: r + 1, date: leagueDate, mName, weekDay,
          day: leagueDate.getDate(), match: userMatch, isCup: false,
        });
      } else if (entry.type === 'cup') {
        const cupInfo = _getCupInfoForSlot(entry);
        if (!cupInfo.hasCupMatch) continue;
        const leagueRoundAfter = entry.afterLeague ?? (entry.leagueIdx ?? 0);
        const cupDate    = getCupRoundDate(leagueRoundAfter) || ROUND_DATES[leagueRoundAfter - 1]; // sem +1 com nova semântica
        if (!cupDate) continue;
        const mName   = MONTH_NAMES[cupDate.getMonth()].substring(0, 3);
        const weekDay = WEEK_DAYS_SHORT[(cupDate.getDay() + 6) % 7];
        const tie  = cupInfo.tie;
        const home = cupInfo.leg === 'leg2' ? tie.away : tie.home;
        const away = cupInfo.leg === 'leg2' ? tie.home : tie.away;
        events.push({
          r: slotIdx, round: slotIdx + 1, date: cupDate, mName, weekDay,
          day: cupDate.getDate(), isCup: true,
          cupLabel: cupInfo.label,
          cupColor: cupInfo.label?.includes('Brasil') ? '#00695c'
            : cupInfo.label?.includes('Libert') ? '#1a237e' : '#b71c1c',
          legLabel: cupInfo.leg === 'leg1'
            ? (tie.leg2 ? 'Jogo de Ida' : 'Jogo Único')
            : 'Jogo de Volta',
          phase: tie.phase, match: { home, away },
          cupKey: cupInfo.cupKey, leg: cupInfo.leg, tie,
        });
      }
    }
    return events.sort((a, b) => {
      const diff = a.date - b.date;
      if (diff !== 0) return diff;
      return a.isCup ? 1 : -1;
    }).slice(0, 8);
  }, [currentRound, gameData.fixtures, gameData.cups, gameData.calendar, maxRounds, ROUND_DATES, getCupRoundDate, _getCupInfoForSlot]);

  // BUG 2 FIX: resultados recentes incluindo copas jogadas
  const recentResults = React.useMemo(() => {
    const results = [];
    // Campeonato
    for (let r = currentRound - 1; r >= 0 && results.length < 5; r--) {
      const match = (gameData.fixtures[r]||[]).find(m => m.home.isPlayer || m.away.isPlayer);
      if (match?.played && match.result) {
        results.push({ match, round: r+1, date: ROUND_DATES[r], isCup: false });
      }
    }
    // Copa (leg1 e leg2 jogados) — BUG 2 FIX
    if (gameData.cups && window.CupsEngine) {
      const cups = gameData.cups;
      const addCupResult = (cup, label, color, cupKey) => {
        if (!cup || cup.status === 'inactive') return;
        const checkTie = (tie) => {
          if (!tie) return;
          if (tie.leg1?.played && tie.leg2?.played) {
            // Ambas as pernas jogadas
            const isLeg2UserHome = tie.away?.isPlayer;
            const leg2match = {
              home: tie.away, away: tie.home,
              result: `${tie.leg2.home}-${tie.leg2.away}`,
              played: true, events: [],
            };
            results.push({ match: leg2match, round: tie.leg2.round, isCup:true,
              date: getCupRoundDate(tie.leg2.round), cupLabel:label, cupColor:color,
              legLabel:'Jogo de Volta', phase: tie.phase });
          }
          if (tie.leg1?.played) {
            const leg1match = {
              home: tie.home, away: tie.away,
              result: `${tie.leg1.home}-${tie.leg1.away}`,
              played: true, events: tie.events || [],
            };
            results.push({ match: leg1match, round: tie.leg1.round, isCup:true,
              date: getCupRoundDate(tie.leg1.round), cupLabel:label, cupColor:color,
              legLabel: tie.leg2 ? 'Jogo de Ida' : 'Jogo Único', phase: tie.phase });
          }
        };
        if (cup.phase === 'group') {
          (cup.groupMatches||[]).forEach(gm => {
            if (gm.leg1?.played) {
              results.push({ match:{ home:gm.home,away:gm.away,
                result:`${gm.leg1.home}-${gm.leg1.away}`,played:true,events:[] },
                round: gm.leg1.round, isCup:true,
                date: getCupRoundDate(gm.leg1.round),
                cupLabel:label, cupColor:color, legLabel:'Fase de Grupos', phase:gm.phase });
            }
          });
        } else {
          checkTie(cup.currentTie);
          checkTie(cup.knockoutTie);
        }
      };
      addCupResult(cups.copaBrasil,   '🏆 Copa do Brasil', '#00695c', 'copaBrasil');
      addCupResult(cups.libertadores, '🌟 Libertadores',   '#1a237e', 'libertadores');
      addCupResult(cups.sulAmericana, '🌎 Sul-Americana',  '#b71c1c', 'sulAmericana');
    }
    return results
      .filter(r => r.round <= currentRound)
      .sort((a,b) => b.round - a.round)
      .slice(0, 6);
  }, [currentRound, gameData.fixtures, gameData.cups, ROUND_DATES, getCupRoundDate]);

  // Auto-scroll para mês atual
  React.useEffect(() => {
    const idx = Math.max(0, currentRound - 1);
    const d   = ROUND_DATES[idx];
    if (!d) return;
    const mOff = (d.getFullYear() - firstDate.getFullYear()) * 12 + (d.getMonth() - firstDate.getMonth());
    setCalMonth(mOff);
    if (currentRound > 0) setSelectedDay(d.getDate());
  }, []);

  const WEEK_DAYS = ['S','T','Q','Q','S','S','D'];

  // Paleta Navy para o novo design
  // Paleta unificada com o restante do jogo (THEME claro)
  const N = {
    bg:      C.bg,
    card:    C.card,
    cardAlt: C.cardAlt,
    border:  C.border,
    accent:  C.blue,
    green:   C.green,
    teal:    C.teal,
    red:     C.red,
    gold:    C.gold,
    txt1:    C.txt1,
    txt2:    C.txt2,
    txt3:    C.txt3,
  };

  return (
    <Box sx={{ bgcolor: N.bg, minHeight:'100vh', pb: 10 }}>

      {/* ── HEADER ── */}
      <Box sx={{
        background: `linear-gradient(180deg, ${C.bgHeader} 0%, ${C.bg} 100%)`,
        px: 2, pt: 2.5, pb: 1.5,
        borderBottom: `1px solid ${N.border}`,
        display: 'flex', alignItems: 'center', gap: 1.2,
      }}>
        <Box onClick={() => setScreen('home')} sx={{
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: C.bgDark, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: N.txt2, fontSize: '1rem', fontWeight: 900,
          '&:active': { bgcolor: C.bgDark },
        }}>❮</Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: N.txt1, fontWeight: 900, fontSize: '0.92rem', letterSpacing: 1.5 }}>
            PRÓXIMAS PARTIDAS
          </Typography>
          <Typography sx={{ color: N.txt3, fontSize: '0.52rem', fontWeight: 700, mt: 0.2 }}>
            {gameData.club?.name?.toUpperCase()} · TEMPORADA {gameData.season || 2026}
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: `${N.accent}20`, border: `1px solid ${N.accent}40`,
          borderRadius: '8px', px: 1, py: 0.4,
        }}>
          <Typography sx={{ color: N.accent, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5 }}>
            ROD {currentRound + 1}/{gameData.fixtures.length}
          </Typography>
        </Box>
      </Box>

      {/* ── CALENDÁRIO ── */}
      <Box sx={{ mx: 1.5, mt: 1.5, mb: 1, bgcolor: N.card, borderRadius: '14px',
        border: `1px solid ${N.border}`, overflow: 'hidden',
        boxShadow: `0 2px 8px ${C.shadow}` }}>

        {/* Filtros */}
        <Box sx={{ display: 'flex', gap: 0.5, px: 1.2, pt: 1, pb: 0.6, borderBottom: `1px solid ${N.border}20` }}>
          {[
            { key:'TODOS', label:'Todos' },
            { key:'CAMP',  label:'🏟️ Campeonato' },
            { key:'COPA',  label:'🏆 Copas' },
          ].map(f => (
            <Box key={f.key} onClick={() => setCompFilter(f.key)} sx={{
              px: 1.2, py: 0.4, borderRadius: '20px', cursor: 'pointer',
              bgcolor: compFilter === f.key ? N.accent : 'transparent',
              border: `1px solid ${compFilter === f.key ? N.accent : N.border}`,
              '&:active': { opacity: 0.7 },
              transition: 'all 0.15s',
            }}>
              <Typography sx={{ color: compFilter === f.key ? '#fff' : N.txt3, fontWeight: 900, fontSize: '0.58rem' }}>
                {f.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Navegação mês */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: N.cardAlt, px: 2, py: 1.2, borderBottom: `1px solid ${N.border}` }}>
          <Box onClick={() => setCalMonth(m => Math.max(0, m-1))} sx={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', cursor: calMonth > 0 ? 'pointer' : 'default',
            bgcolor: calMonth > 0 ? C.bgDark : 'transparent',
            color: calMonth > 0 ? N.txt1 : N.txt3, fontSize: '1rem', fontWeight: 900,
            '&:active': calMonth > 0 ? { bgcolor: C.border } : {},
          }}>❮</Box>
          <Typography sx={{ color: N.txt1, fontWeight: 900, fontSize: '0.92rem', letterSpacing: 1.5 }}>
            {MONTH_NAMES[realMonth]} {realYear}
          </Typography>
          <Box onClick={() => setCalMonth(m => Math.min(totalMonths-1, m+1))} sx={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', cursor: calMonth < totalMonths-1 ? 'pointer' : 'default',
            bgcolor: calMonth < totalMonths-1 ? C.bgDark : 'transparent',
            color: calMonth < totalMonths-1 ? N.txt1 : N.txt3, fontSize: '1rem', fontWeight: 900,
            '&:active': calMonth < totalMonths-1 ? { bgcolor: C.border } : {},
          }}>❯</Box>
        </Box>

        {/* Cabeçalho dias da semana */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', px: 1, py: 0.9 }}>
          {WEEK_DAYS.map((d, i) => (
            <Typography key={i} sx={{
              textAlign: 'center', fontWeight: 900, fontSize: '0.68rem',
              color: i >= 5 ? N.accent : N.txt3,
            }}>{d}</Typography>
          ))}
        </Box>

        {/* Grid dias */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', px: 1, pb: 1.2, gap: 0 }}>
          {Array.from({ length: startPad }).map((_, i) => <Box key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1;
            const events   = getDayEvents(realYear, realMonth, day);
            const hasUser  = events.some(e => e.isUser);
            const isNextGame = events.some(e => e.round === currentRound + 1);
            const isSelected = selectedDay === day && events.length > 0;
            const isWeekend  = ((startPad + i) % 7) >= 5;
            const dots = events.slice(0, 3);
            const bgColor = isNextGame && hasUser ? N.accent
              : isSelected ? `${N.accent}30`
              : 'transparent';
            const border = isSelected && !isNextGame ? `1.5px solid ${N.accent}` : 'none';

            return (
              <Box key={day}
                onClick={() => events.length > 0 && setSelectedDay(isSelected ? null : day)}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  py: 0.5, cursor: events.length > 0 ? 'pointer' : 'default', position: 'relative' }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: bgColor, border,
                  transition: 'all 0.15s' }}>
                  <Typography sx={{
                    fontWeight: events.length > 0 ? 900 : 400, fontSize: '0.8rem',
                    color: isNextGame && hasUser ? '#fff'
                      : events.length > 0 ? (isWeekend ? N.accent : N.txt1)
                      : N.txt3,
                    lineHeight: 1,
                  }}>{day}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '1.5px', mt: 0.3, height: 5, alignItems: 'center' }}>
                  {dots.map((ev, di) => (
                    <Box key={di} sx={{ width: 5, height: 5, borderRadius: '50%',
                      bgcolor: getDotColor(ev), flexShrink: 0 }} />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Legenda */}
        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', px: 1.4, pb: 1, pt: 0.2, borderTop: `1px solid ${N.border}30` }}>
          {[
            { color: N.green,  label: 'Vitória' },
            { color: N.gold,   label: 'Empate'  },
            { color: N.red,    label: 'Derrota' },
            { color: N.accent, label: 'Próximo' },
            { color: '#00695c',label: 'Copa Br.' },
            { color: '#3b82f6',label: 'Libert.'  },
          ].map((l, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: l.color }} />
              <Typography sx={{ color: N.txt3, fontSize: '0.5rem', fontWeight: 700 }}>{l.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── DETALHE DO DIA SELECIONADO ── */}
      {selectedDay && (() => {
        const events = getDayEvents(realYear, realMonth, selectedDay);
        if (!events.length) return null;
        return (
          <Box sx={{ mx: 1.5, mb: 1 }}>
            {events.map((ev, ri) => {
              const res = ev.played ? getMatchResult(ev.match) : null;
              const accentColor = ev.isCup ? (ev.cupColor || N.teal) : ev.isUser ? N.accent : N.border;
              const isFuture = !ev.played && ev.isUser;
              const opponent = isFuture && ev.match
                ? (ev.match.home?.isPlayer ? ev.match.away : ev.match.home) : null;
              const oppRow = opponent ? (gameData.table?.find(t => t.name === opponent.name) || null) : null;
              const oppPos = oppRow ? (gameData.table?.findIndex(t => t.name === opponent.name) ?? -1) + 1 : null;
              const myRow  = isFuture ? (gameData.table?.find(t => t.id === 'user') || null) : null;
              const myPos  = myRow ? (gameData.table?.findIndex(t => t.id === 'user') ?? -1) + 1 : null;
              const val    = isFuture && window.getLineupValidation ? window.getLineupValidation(gameData) : null;
              return (
                <Box key={ri}
                  onClick={() => ev.played && ev.match?.result && setSumulaModal({...ev.match, cupLabel:ev.cupLabel, legLabel:ev.legLabel})}
                  sx={{ bgcolor: N.card, border: `1.5px solid ${accentColor}60`,
                    borderRadius: '14px', overflow: 'hidden', mb: 1,
                    boxShadow: `0 2px 8px ${C.shadow}`,
                    cursor: ev.played && ev.match?.result ? 'pointer' : 'default',
                    '&:active': ev.played ? { filter: 'brightness(0.9)' } : {},
                  }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 1.4, py: 0.8, bgcolor: `${accentColor}18`,
                    borderBottom: `1px solid ${accentColor}30` }}>
                    <Typography sx={{ color: accentColor, fontSize: '0.6rem', fontWeight: 900, letterSpacing: 0.8 }}>
                      {ev.isCup ? `🏆 ${ev.cupLabel} · ${ev.legLabel}` : `🏟️ SÉRIE ${gameData.serie} · ROD ${ev.round}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      {ev.played
                        ? <Box sx={{ bgcolor: `${N.green}20`, border: `1px solid ${N.green}40`, borderRadius: '5px', px: 0.7, py: 0.1 }}>
                            <Typography sx={{ color: N.green, fontSize: '0.5rem', fontWeight: 900 }}>✅ ENCERRADA</Typography>
                          </Box>
                        : <Box sx={{ bgcolor: `${N.accent}20`, border: `1px solid ${N.accent}40`, borderRadius: '5px', px: 0.7, py: 0.1 }}>
                            <Typography sx={{ color: N.accent, fontSize: '0.5rem', fontWeight: 900 }}>🕐 AGENDADA</Typography>
                          </Box>
                      }
                      {ROUND_DATES[ev.roundIdx] && (
                        <Typography sx={{ color: N.txt3, fontSize: '0.52rem', fontWeight: 700 }}>
                          {WEEK_DAYS_SHORT[(ROUND_DATES[ev.roundIdx].getDay()+6)%7]}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {/* Placar */}
                  {ev.match && (
                    <Box sx={{ px: 1.5, py: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TeamIcon name={ev.match.home?.name||'?'} size={32}/>
                      <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 900, fontSize: '0.8rem',
                        color: ev.match.home?.isPlayer ? accentColor : N.txt1,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {ev.match.home?.name}
                      </Typography>
                      <Box sx={{ px: 1.4, py: 0.5, borderRadius: '8px',
                        bgcolor: ev.played ? C.ink : N.cardAlt,
                        border: `1px solid ${ev.played ? accentColor+'60' : N.border}`,
                        minWidth: 50, textAlign: 'center', flexShrink: 0 }}>
                        {ev.played
                          ? <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: res?.color||C.bg, fontFamily: 'monospace' }}>
                              {res?.hg}–{res?.ag}
                            </Typography>
                          : <Typography sx={{ fontWeight: 900, fontSize: '0.68rem', color: N.txt3 }}>VS</Typography>
                        }
                      </Box>
                      <Typography sx={{ flex: 1, textAlign: 'left', fontWeight: 900, fontSize: '0.8rem',
                        color: ev.match.away?.isPlayer ? accentColor : N.txt1,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {ev.match.away?.name}
                      </Typography>
                      <TeamIcon name={ev.match.away?.name||'?'} size={32}/>
                    </Box>
                  )}
                  {/* Info antecipada */}
                  {isFuture && opponent && (
                    <Box sx={{ px: 1.4, pb: 1.2, borderTop: `1px solid ${N.border}40` }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0.5, mt: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography sx={{ color: N.txt3, fontSize: '0.46rem', fontWeight: 700, mb: 0.4 }}>MEU TIME</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            {[{l:'POS',v:`${myPos}º`,c:myPos<=4?N.green:myPos>=17?N.red:N.txt1},
                              {l:'PTS',v:myRow?.pts||0,c:N.txt1},
                              {l:'OVR',v:val?.avgStrength||'—',c:N.green}].map((s,i)=>(
                              <Box key={i} sx={{ textAlign:'center' }}>
                                <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.75rem', lineHeight:1 }}>{s.v}</Typography>
                                <Typography sx={{ color:N.txt3, fontSize:'0.42rem', fontWeight:700 }}>{s.l}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ bgcolor: N.border }} />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography sx={{ color: N.txt3, fontSize: '0.46rem', fontWeight: 700, mb: 0.4 }}>ADVERSÁRIO</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            {[{l:'POS',v:oppPos?`${oppPos}º`:'—',c:oppPos<=4?N.green:oppPos>=17?N.red:N.txt1},
                              {l:'PTS',v:oppRow?.pts||0,c:N.txt1},
                              {l:'OVR',v:opponent?.strength||'—',c:N.accent}].map((s,i)=>(
                              <Box key={i} sx={{ textAlign:'center' }}>
                                <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.75rem', lineHeight:1 }}>{s.v}</Typography>
                                <Typography sx={{ color:N.txt3, fontSize:'0.42rem', fontWeight:700 }}>{s.l}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.8 }}>
                        <Typography sx={{ fontSize: '0.65rem' }}>{ev.match?.home?.isPlayer ? '🏠' : '✈️'}</Typography>
                        <Typography sx={{ color: N.txt3, fontSize: '0.56rem', fontWeight: 700 }}>
                          {ev.match?.home?.isPlayer
                            ? `Mandante — ${gameData.club?.stadium?.name || 'Seu Estádio'}`
                            : `Visitante em ${opponent.name}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })()}

      {/* ── JOGOS FUTUROS (estilo A: col data esquerda) ── */}
      <Box sx={{ mx: 1.5, mb: 1 }}>
        <Typography sx={{ color: N.txt2, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 2, mb: 1 }}>
          JOGOS FUTUROS
        </Typography>
        {upcomingEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>🏆</Typography>
            <Typography sx={{ color: N.txt2, fontSize: '0.8rem', fontStyle: 'italic' }}>Temporada encerrada!</Typography>
          </Box>
        ) : upcomingEvents.map((ev, i) => {
          const isNext      = ev.r === currentRound;
          const accentColor = ev.isCup ? (ev.cupColor || N.teal) : isNext ? N.accent : N.border;
          const dateColBg   = isNext ? N.accent : ev.isCup ? `${accentColor}30` : N.cardAlt;
          const dateColTxt  = isNext ? '#fff' : accentColor;
          return (
            <Box key={i} sx={{
              bgcolor: N.card, border: `1.5px solid ${accentColor}`,
              borderRadius: '12px', mb: 0.9, overflow: 'hidden',
              display: 'flex', boxShadow: isNext ? `0 4px 20px ${C.blue}20` : `0 1px 4px ${C.shadow}`,
            }}>
              {/* Coluna data */}
              <Box sx={{
                width: 58, flexShrink: 0, bgcolor: dateColBg,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', py: 1.2, px: 0.5,
                borderRight: `1px solid ${accentColor}40`,
              }}>
                <Typography sx={{ color: dateColTxt, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 1, lineHeight: 1, mb: 0.2 }}>
                  {ev.weekDay}
                </Typography>
                <Typography sx={{ color: dateColTxt, fontSize: '1.35rem', fontWeight: 900, lineHeight: 1 }}>
                  {ev.day}
                </Typography>
                <Typography sx={{ color: isNext ? 'rgba(255,255,255,0.8)' : N.txt3, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 1, mt: 0.2 }}>
                  {ev.mName}
                </Typography>
              </Box>
              {/* Corpo */}
              <Box sx={{ flex: 1, py: 0.9, px: 1.2, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                  <Typography sx={{ color: accentColor, fontSize: '0.52rem', fontWeight: 900, letterSpacing: 0.8 }}>
                    {ev.isCup ? `🏆 ${ev.cupLabel}` : `🏟️ BRASILEIRÃO ${gameData.serie}`}
                  </Typography>
                  {isNext && !ev.isCup && (
                    <Box sx={{ bgcolor: N.accent, borderRadius: '4px', px: 0.7, py: 0.1 }}>
                      <Typography sx={{ color: '#fff', fontSize: '0.44rem', fontWeight: 900 }}>PRÓXIMO</Typography>
                    </Box>
                  )}
                  {ev.isCup && (
                    <Typography sx={{ color: N.txt3, fontSize: '0.48rem', fontWeight: 700 }}>{ev.legLabel}</Typography>
                  )}
                  {!isNext && !ev.isCup && (
                    <Typography sx={{ color: N.txt3, fontSize: '0.5rem', fontWeight: 700 }}>Rod {ev.round}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <TeamIcon name={ev.match?.home?.name||'?'} size={28}/>
                  <Typography sx={{
                    flex: 1, fontWeight: 900, fontSize: '0.75rem',
                    color: ev.match?.home?.isPlayer ? (isNext ? N.accent : N.green) : N.txt1,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>{ev.match?.home?.name}</Typography>
                  <Typography sx={{ color: N.txt3, fontWeight: 900, fontSize: '0.62rem', flexShrink: 0 }}>vs</Typography>
                  <Typography sx={{
                    flex: 1, fontWeight: 900, fontSize: '0.75rem', textAlign: 'right',
                    color: ev.match?.away?.isPlayer ? (isNext ? N.accent : N.green) : N.txt1,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>{ev.match?.away?.name}</Typography>
                  <TeamIcon name={ev.match?.away?.name||'?'} size={28}/>
                </Box>
                <Typography sx={{ color: N.txt3, fontSize: '0.5rem', fontWeight: 700, mt: 0.5 }}>
                  {ev.isCup
                    ? `${ev.phase || ''}`
                    : ev.match?.home?.isPlayer
                      ? `🏠 Casa · ${gameData.club.stadium?.name || 'Seu Estádio'}`
                      : `✈️ Visitante · ${(ev.match?.home)?.name || ''}`
                  }
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ── RESULTADOS RECENTES (estilo D: card com col data + dot resultado) ── */}
      {recentResults.length > 0 && (
        <Box sx={{ mx: 1.5, mb: 1 }}>
          <Typography sx={{ color: N.txt2, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 2, mb: 1 }}>
            RESULTADOS RECENTES
          </Typography>
          {recentResults.map((r, i) => {
            const res = getMatchResult(r.match);
            const d   = r.date;
            const mName = d ? MONTH_NAMES[d.getMonth()].substring(0, 3) : '';
            const weekD = d ? WEEK_DAYS_SHORT[(d.getDay()+6)%7] : '';
            const resultColor = r.isCup ? (r.cupColor || N.teal)
              : res?.label === 'V' ? N.green
              : res?.label === 'D' ? N.red
              : N.gold;
            const resultLabel = r.isCup ? '🏆'
              : res?.label === 'V' ? 'VIT'
              : res?.label === 'D' ? 'DER'
              : 'EMP';
            return (
              <Box key={i}
                onClick={() => r.match?.result && setSumulaModal({...r.match, cupLabel:r.cupLabel, legLabel:r.legLabel})}
                sx={{
                  bgcolor: N.card, border: `1px solid ${N.border}`,
                  borderRadius: '12px', mb: 0.8, overflow: 'hidden',
                  display: 'flex', cursor: 'pointer',
                  boxShadow: `0 1px 4px ${C.shadow}`,
                  '&:active': { filter: 'brightness(0.96)' },
                }}>
                {/* Coluna data (estilo D) */}
                <Box sx={{
                  width: 52, flexShrink: 0,
                  bgcolor: N.cardAlt, borderRight: `1px solid ${N.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', py: 1, px: 0.5,
                }}>
                  <Typography sx={{ color: N.txt1, fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>
                    {d ? d.getDate() : '—'}
                  </Typography>
                  <Typography sx={{ color: N.txt3, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', mt: 0.2 }}>
                    {mName}
                  </Typography>
                  <Typography sx={{ color: N.txt3, fontSize: '0.4rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', mt: 0.1 }}>
                    {weekD}
                  </Typography>
                </Box>
                {/* Corpo */}
                <Box sx={{ flex: 1, py: 0.9, px: 1.2, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: N.txt3, fontSize: '0.48rem', fontWeight: 900, letterSpacing: 0.8, mb: 0.5 }}>
                      {r.isCup ? `${r.cupLabel} · ${r.legLabel}` : `🏟️ BRASILEIRÃO ${gameData.serie} · ROD ${r.round}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                      <Typography sx={{
                        flex: 1, fontWeight: 900, fontSize: '0.72rem', textAlign: 'right',
                        color: r.match.home?.isPlayer ? N.accent : N.txt1,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>{r.match.home?.name}</Typography>
                      <Box sx={{ bgcolor: C.ink, border: `1px solid ${resultColor}50`, borderRadius: '6px', px: 0.8, py: 0.2, flexShrink: 0 }}>
                        <Typography sx={{ color: resultColor, fontWeight: 900, fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1 }}>
                          {res?.hg}–{res?.ag}
                        </Typography>
                        {res?.pen && (
                          <Typography sx={{ color: C.bg, fontSize: '0.4rem', fontWeight: 700, textAlign: 'center' }}>
                            {res.pen}
                          </Typography>
                        )}
                      </Box>
                      <Typography sx={{
                        flex: 1, fontWeight: 900, fontSize: '0.72rem',
                        color: r.match.away?.isPlayer ? N.accent : N.txt1,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>{r.match.away?.name}</Typography>
                    </Box>
                    <Typography sx={{ color: N.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.4 }}>
                      🔍 ver súmula
                    </Typography>
                  </Box>
                  {/* Dot resultado (estilo D) */}
                  <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 0.4, flexShrink: 0, pl: 0.5,
                  }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: resultColor }} />
                    <Typography sx={{ color: resultColor, fontSize: '0.45rem', fontWeight: 900, letterSpacing: 0.5 }}>
                      {resultLabel}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── MODAL SÚMULA ── */}
      <Dialog open={!!sumulaModal} onClose={() => setSumulaModal(null)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { bgcolor: N.card, border: `2px solid ${N.accent}`, borderRadius: '16px', m: 2, overflow: 'hidden' } }}>
        <Box sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ bgcolor: N.cardAlt, px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `1px solid ${N.border}` }}>
            <Box>
              <Typography sx={{ color: N.accent, fontWeight: 900, fontSize: '0.82rem', letterSpacing: 1.5 }}>
                SÚMULA DA PARTIDA
              </Typography>
              {sumulaModal?.cupLabel && (
                <Typography sx={{ color: N.teal, fontSize: '0.58rem', fontWeight: 700, mt: 0.2 }}>
                  {sumulaModal.cupLabel} · {sumulaModal.legLabel}
                </Typography>
              )}
            </Box>
            <Box onClick={() => setSumulaModal(null)} sx={{
              width: 28, height: 28, borderRadius: '50%', bgcolor: C.bgDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: N.txt2, fontSize: '0.9rem', fontWeight: 900,
              '&:active': { bgcolor: C.border },
            }}>✕</Box>
          </Box>
          {/* Placar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.8, bgcolor: C.ink }}>
            <Typography sx={{ fontWeight: 900, color: sumulaModal?.home?.isPlayer ? N.accent : C.bg,
              textAlign: 'right', flex: 1, fontSize: '0.8rem',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {sumulaModal?.home?.name}
            </Typography>
            <Box sx={{ bgcolor: 'rgba(0,0,0,0.85)', border: `2px solid ${N.accent}60`, borderRadius: '10px', px: 1.8, py: 0.7, mx: 1.5, flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: N.accent, fontFamily: 'monospace', letterSpacing: 3 }}>
                {sumulaModal?.result}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, color: sumulaModal?.away?.isPlayer ? N.accent : C.bg,
              flex: 1, fontSize: '0.8rem',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {sumulaModal?.away?.name}
            </Typography>
          </Box>
          {/* Eventos */}
          <Box sx={{ maxHeight: '50vh', overflowY: 'auto', px: 1.5, py: 1 }}>
            {sumulaModal?.events?.length > 0
              ? sumulaModal.events.map((ev, idx) => {
                  const parsed   = window.SMR_parseEvent ? window.SMR_parseEvent(ev) : {};
                  const isGoal   = parsed.type === 'goal'   || ev.includes('GOL') || ev.includes('⚽');
                  const isRed    = parsed.type === 'red'    || ev.includes('🟥') || ev.includes('EXPULSO');
                  const isYellow = parsed.type === 'yellow' || ev.includes('🟨');
                  const isFim    = parsed.type === 'end'    || ev.includes('FIM DE JOGO');
                  const color    = isGoal ? N.accent : isRed ? N.red : isYellow ? N.gold : isFim ? N.green : N.txt2;
                  return (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.7,
                      borderBottom: `1px solid ${N.border}40` }}>
                      <Typography sx={{ fontSize: '0.62rem', color: N.txt3, fontWeight: 900,
                        fontFamily: 'monospace', minWidth: 28, pt: 0.1, flexShrink: 0 }}>
                        {ev.match(/^(\d+)'/)?.[1] ? `${ev.match(/^(\d+)'/)[1]}'` : ''}
                      </Typography>
                      <Typography sx={{ flex: 1, fontSize: '0.72rem', color, fontWeight: isGoal||isRed ? 900 : 700, lineHeight: 1.45 }}>
                        {ev.replace(/^\d+' /, '')}
                      </Typography>
                    </Box>
                  );
                })
              : <Typography sx={{ textAlign: 'center', color: N.txt3, fontStyle: 'italic', py: 3 }}>
                  Súmula não disponível.
                </Typography>
            }
          </Box>
          <Box sx={{ p: 1.5, borderTop: `1px solid ${N.border}` }}>
            <Button fullWidth variant="contained" onClick={() => setSumulaModal(null)}
              sx={{ bgcolor: N.accent, color: '#fff', fontWeight: 900, py: 1.2, borderRadius: '10px',
                fontSize: '0.78rem', letterSpacing: 1, '&:hover': { bgcolor: C.primaryDim } }}>
              FECHAR
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ScreenMatches;

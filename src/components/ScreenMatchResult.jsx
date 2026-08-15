// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { SoundEngine } from '../engines/engine_sound.js';
import ScreenPostMatch from './ScreenPostMatch.jsx';
import SMR_PreMatch from './SMR_PreMatch.jsx';
import SMR_Halftime from './SMR_Halftime.jsx';

// ScreenMatchResult.js — v6.0 (Arquitetura limpa — sem componentes aninhados)
// Todos os sub-componentes são definidos FORA do ScreenMatchResult

// ── Paleta ────────────────────────────────────────────────
const SMR_C = THEME || {}; // app_theme.js carrega antes (script normal, não babel)

// ── Sub-componentes externos (sem re-criação por render) ──
const SMR_AdvBtn = ({ label, onClick, disabled }) => {
  return (
    <Box sx={{ px: 1.5, pt: 1.2, pb: 3 }}>
      <Button fullWidth disabled={!!disabled} onClick={onClick} sx={{
        py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem',
        bgcolor: disabled ? SMR_C.cardAlt : SMR_C.green,
        color:   disabled ? SMR_C.txt3   : '#0f172a',
        boxShadow: disabled ? 'none' : '0 0 18px rgba(34,197,94,0.3)',
        '&:hover': { bgcolor: disabled ? SMR_C.cardAlt : '#16a34a' },
      }}>
        {disabled ? '⏳ Aguardando...' : `${label} ›`}
      </Button>
    </Box>
  );
};

const SMR_Card = ({ children, accent, sx: sxExtra }) => {
  return (
    <Box sx={{ bgcolor: SMR_C.card, border: `1.5px solid ${accent || SMR_C.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2, ...sxExtra }}>
      {children}
    </Box>
  );
};

const SMR_CardHead = ({ label, icon, color }) => {
  return (
    <Box sx={{ px: 1.5, py: 0.85, borderBottom: `1px solid ${SMR_C.border}`, bgcolor: color ? `${color}0f` : SMR_C.cardAlt, display: 'flex', alignItems: 'center', gap: 0.8 }}>
      {icon && <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</Typography>}
      <Typography sx={{ color: color || SMR_C.txt3, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 1.2 }}>{label}</Typography>
    </Box>
  );
};

const SMR_StatRow = ({ label, h, a, lower }) => {
  const tot = (h + a) || 1;
  const pct = (h / tot) * 100;
  const hWins = lower ? h <= a : h >= a;
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
        <Typography sx={{ color: hWins ? SMR_C.txt1 : SMR_C.txt3, fontWeight: hWins ? 900 : 600, fontSize: '0.82rem', width: 32, textAlign: 'right', mr: 0.8 }}>{h}</Typography>
        <Typography sx={{ flex: 1, textAlign: 'center', color: SMR_C.ink2 || '#334155', fontWeight: 700, fontSize: '0.56rem', letterSpacing: 0.5 }}>{label}</Typography>
        <Typography sx={{ color: !hWins ? SMR_C.txt1 : SMR_C.txt3, fontWeight: !hWins ? 900 : 600, fontSize: '0.82rem', width: 32, ml: 0.8 }}>{a}</Typography>
      </Box>
      <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', bgcolor: SMR_C.cardAlt }}>
        <Box sx={{ width: `${pct}%`, bgcolor: SMR_C.green, transition: 'width 0.5s ease' }} />
        <Box sx={{ flex: 1, bgcolor: SMR_C.blue, opacity: 0.55 }} />
      </Box>
    </Box>
  );
};

// ════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════
const ScreenMatchResult = ({
  gameData, setGameData, matchResultData, simulating, visibleEvents, liveScore,
  matchFeedRef, matchControlsRef, roundSummary, setScreen, formatMoney
}) => {
  const [step,          setStep]          = React.useState(-1);
  const [minute,        setMinute]        = React.useState(0);
  const [possession,    setPossession]    = React.useState({ home: 50, away: 50 });
  const [fieldEvent,    setFieldEvent]    = React.useState(null);
  const [ballPos,       setBallPos]       = React.useState({ x: 150, y: 55 });
  const [showSubs,      setShowSubs]      = React.useState(false);
  const [subsDone,      setSubsDone]      = React.useState([]);
  const [selectedStarter, setSelectedStarter] = React.useState(null);
  const [isPaused,        setIsPaused]        = React.useState(false);
  const [goalCelebration, setGoalCelebration] = React.useState(null);
  const [soundEnabled,    setSoundEnabled]    = React.useState(true);
  const [posPopup,        setPosPopup]        = React.useState(null);
  const [showPosPopup,    setShowPosPopup]    = React.useState(false);
  // Táticas do intervalo — DEVEM ficar aqui fora (Rules of Hooks)
  const [selForm,  setSelForm]  = React.useState(gameData?.club?.managerProfile?.formation || gameData?.club?.managerProfile?.preferredFormation || '4-4-2');
  const [selStyle, setSelStyle] = React.useState(gameData?.club?.managerProfile?.style || 'Equilibrado');

  // Snapshot dos jogadores ANTES do jogo (para PostMatchAgent comparar)
  const playersBeforeRef = React.useRef(gameData?.players || []);
  // RawEvents acumulados do jogo (passados ao PostMatchAgent)
  const rawEventsRef = React.useRef([]);

  const timerRef  = React.useRef(null);
  const ballRef   = React.useRef(null);

  // ── Ativar sons na primeira interação (Web Audio requer gesto) ──
  React.useEffect(() => {
    const unlock = () => SoundEngine && SoundEngine.setEnabled(soundEnabled);
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('click',      unlock, { once: true });
    return () => {
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click',      unlock);
    };
  }, []);

  // ── Iniciar/parar ambiente sonoro com a simulação ───────────
  React.useEffect(() => {
    if (!SoundEngine) return;
    if ((step === 0 || step === 2) && simulating && !isPaused) {
      SoundEngine.startAmbient();
    } else {
      SoundEngine.stopAmbient();
    }
  }, [step, simulating, isPaused]);
  const C = SMR_C;

  // ── Quando começa a simulação: vai para step 0 (ou auto-simula) ────────
  React.useEffect(() => {
    if (matchResultData && simulating && step === -1) {
      // Captura rawEvents para o PostMatchAgent comparar suspensos/lesionados
      if (matchResultData.rawEvents?.length) {
        rawEventsRef.current = matchResultData.rawEvents;
      }
      // Se auto-simular foi ativado, encerra o intervalo imediatamente,
      // exibe o placar final e pula direto para o resumo (step 5)
      if (matchControlsRef?.current?.autoSimulate === true) {
        matchControlsRef.current.autoSimulate = false;
        matchControlsRef.current.forceEnd?.();
        // Usa globals expostos pelo hook — setLiveScore/setVisibleEvents não existem neste escopo
        matchControlsRef.current.setLiveScore?.({
          home: matchResultData.homeGoals ?? 0,
          away: matchResultData.awayGoals ?? 0,
        });
        matchControlsRef.current.setVisibleEvents?.(matchResultData.events || []);
        setStep(5);
        setMinute(90);
        return;
      }
      // Bug #4 fix: garantir que a flag sempre existe como false, nunca undefined
      matchControlsRef.current.autoSimulate = false;
      setStep(0);
      setMinute(0);
      // Usar posse dinâmica do engine se disponível, senão 50/50
      const initHome = matchResultData?.homePoss ?? 50;
      const initAway = matchResultData?.awayPoss ?? (100 - initHome);
      setPossession({ home: initHome, away: initAway });
      setSubsDone([]);
    }
  }, [simulating, matchResultData]);

  // ── Cronômetro unificado: monitora step + simulating + isPaused ─────
  React.useEffect(() => {
    clearInterval(timerRef.current);
    if ((step === 0 || step === 2) && simulating && !isPaused) {
      const INC = 45 / (30000 / 100);
      timerRef.current = setInterval(() => {
        setMinute(m => Math.min(m + INC, step === 0 ? 45 : 90));
      }, 100);
    }
    return () => clearInterval(timerRef.current);
  }, [step, simulating, isPaused]);

  // ── Fim do 1T: simulating=false no step 0 → intervalo ──
  React.useEffect(() => {
    if (!simulating && step === 0 && matchResultData) {
      clearInterval(timerRef.current);
      setIsPaused(false);
      setMinute(45);
      setTimeout(() => setStep(1), 600);
    }
  }, [simulating]);

  // ── Fim do 2T: simulating=false no step 2 → resumo ────
  React.useEffect(() => {
    if (!simulating && step === 2 && matchResultData) {
      clearInterval(timerRef.current);
      setIsPaused(false);
      setMinute(90);
      setTimeout(() => setStep(5), 600);
    }
  }, [simulating]);

  // ── Calcular popup de posição quando vai para step 7 ──
  React.useEffect(() => {
    if (step !== 7 || !gameData?.table || !matchResultData) return;
    const sorted = sortLeagueTable ? sortLeagueTable(gameData.table) : gameData.table;
    const posAfter  = (sorted.findIndex(t => t.id === 'user') ?? -1) + 1;
    // Estimativa da posição anterior: recalcula sem este jogo
    const myRow = gameData.table.find(t => t.id === 'user') || {};
    const isH   = matchResultData.homeName === gameData.club?.name;
    const myG   = isH ? (matchResultData.homeGoals ?? 0) : (matchResultData.awayGoals ?? 0);
    const oppG  = isH ? (matchResultData.awayGoals ?? 0) : (matchResultData.homeGoals ?? 0);
    const ptsGained = myG > oppG ? 3 : myG === oppG ? 1 : 0;
    const fakeRow = { ...myRow, pts: (myRow.pts||0) - ptsGained, p: (myRow.p||0) - 1,
      w: myG>oppG?(myRow.w||0)-1:myRow.w||0, d: myG===oppG?(myRow.d||0)-1:myRow.d||0,
      l: myG<oppG?(myRow.l||0)-1:myRow.l||0,
      gf: (myRow.gf||0) - myG, ga: (myRow.ga||0) - oppG };
    const fakeTable = gameData.table.map(t => t.id === 'user' ? fakeRow : t);
    const fakeSorted = sortLeagueTable ? sortLeagueTable(fakeTable) : fakeTable;
    const posBefore = (fakeSorted.findIndex(t => t.id === 'user') ?? -1) + 1;
    const delta = posBefore - posAfter; // positivo = subiu
    setPosPopup({ posBefore, posAfter, delta });
    setShowPosPopup(true);
    setTimeout(() => setShowPosPopup(false), 4000);
  }, [step]);

  // ── Bola animada durante simulação ────────────────────
  React.useEffect(() => {
    clearInterval(ballRef.current);
    if (!simulating || isPaused) return;
    ballRef.current = setInterval(() => {
      setBallPos({ x: 40 + Math.random() * 220, y: 15 + Math.random() * 80 });
    }, 1800);
    return () => clearInterval(ballRef.current);
  }, [simulating, isPaused]);

  // ── Reage a novos eventos: posse + campo + sons + celebração ──
  React.useEffect(() => {
    if (!visibleEvents.length || !matchResultData) return;
    const last    = visibleEvents[visibleEvents.length - 1];
    const isH     = last.includes(matchResultData.homeName);
    const isUser  = last.includes(gameData?.club?.name || '');
    const S       = SoundEngine;

    setPossession(prev => {
      const nh = isH ? Math.min(72, prev.home + Math.floor(Math.random()*4)+1)
                     : Math.max(28, prev.home - Math.floor(Math.random()*4)-1);
      return { home: nh, away: 100 - nh };
    });

    const _ev = last.includes('⚽')||last.includes('GOL') ? 'goal'
               : last.includes('🟥') ? 'red'
               : last.includes('🟨') ? 'yellow'
               : last.includes('FIM DE JOGO') ? 'end' : null;

    if (_ev === 'goal') {
      // Campo
      setFieldEvent({ x: isH ? 120 : 40, y: 50, type: 'goal' });
      setTimeout(() => setFieldEvent(null), 2500);

      // Som
      if (S) S.playGoal(isUser);

      // Overlay de celebração — extrair scorer e minuto
      const min    = last.match(/^(\d+)'/)?.[1] || '?';
      const scorer = last.match(/\(([^)]+)\)/)?.[1] || '';
      const team   = isH ? matchResultData.homeName : matchResultData.awayName;
      const curH   = liveScore.home;
      const curA   = liveScore.away;
      setGoalCelebration({ scorer, team, minute: min, isUser, score: `${curH}–${curA}` });
      setTimeout(() => setGoalCelebration(null), 3500);

    } else if (_ev === 'red') {
      setFieldEvent({ x: 40+Math.random()*80, y:15+Math.random()*70, type:'red' });
      setTimeout(() => setFieldEvent(null), 2500);
      if (S) S.playRedCard();

    } else if (_ev === 'yellow') {
      setFieldEvent({ x: 40+Math.random()*80, y:15+Math.random()*70, type:'yellow' });
      setTimeout(() => setFieldEvent(null), 2500);
      if (S) S.playYellowCard();

    } else if (_ev === 'end') {
      if (S) S.playWhistle('triple');

    } else {
      setFieldEvent(null);
    }
  }, [visibleEvents.length]);

  // ── Apito de início (step 0 e 2 começam) ──────────────────
  React.useEffect(() => {
    if (!SoundEngine) return;
    if (step === 0 && simulating) SoundEngine.playWhistle('double');
    if (step === 2 && simulating) SoundEngine.playWhistle('single');
  }, [step]);

  if (!matchResultData) return null;

  const { homeName, awayName, homeShots, awayShots, attendance, income, events = [] } = matchResultData;

  const isUserH   = homeName === gameData?.club?.name;
  const uScore    = isUserH ? liveScore.home : liveScore.away;
  const oScore    = isUserH ? liveScore.away : liveScore.home;
  const resLabel  = uScore > oScore ? 'VITÓRIA' : uScore < oScore ? 'DERROTA' : 'EMPATE';
  const resColor  = uScore > oScore ? C.green   : uScore < oScore ? C.red     : C.yellow;
  const tvIncome  = gameData?.serie === 'A' ? 500000 : 150000;
  const sponsorInc = (gameData?.club?.sponsors?.master?.roundValue||0) + (gameData?.club?.sponsors?.stadium?.roundValue||0);
  const totalIncome = (income||0) + tvIncome + sponsorInc;

  // Todos os eventos de gol, cartão
  const goalEvts   = events.filter(e => e.includes('GOL') || e.includes('⚽'));
  const yellowEvts = events.filter(e => e.includes('🟨'));
  const redEvts    = events.filter(e => e.includes('🟥'));

  const parseGoal = (e) => {
    const min    = e.match(/^(\d+)'/)?.[1] || '';
    const scorer = e.match(/\(([^)]+)\)/)?.[1] || '';
    const isOwnGoal = e.includes('GOL CONTRA');
    // Para gol contra: o time em parênteses é o AUTOR — o beneficiado é o adversário
    // "(HomeName)" → home cometeu → isHome = false (gol no campo do home, beneficia away)
    const isHome = isOwnGoal
      ? !e.includes(`(${homeName})`)   // own goal pelo home → beneficia away
      : e.includes(homeName);
    return { min, scorer, isHome };
  };
  const parseCard = (e) => {
    const min    = e.match(/^(\d+)'/)?.[1] || '';
    const player = e.match(/para (.+?) \(/)?.[1] || e.match(/de (.+?) \(/)?.[1] || e.match(/EXPULSO! (?:Vermelho direto para )?(.+?) \(/)?.[1] || '';
    const team   = e.includes(homeName) ? homeName : awayName;
    return { min, player, team };
  };

  // Stats — todos via useMemo para evitar re-cálculo por re-render
  const hS  = Math.max(liveScore.home*2+3, homeShots||4);
  const aS  = Math.max(liveScore.away*2+3, awayShots||4);
  const hOT = Math.max(liveScore.home, Math.round(hS*0.4));
  const aOT = Math.max(liveScore.away, Math.round(aS*0.4));
  const hF  = React.useMemo(() => 7+Math.floor(Math.random()*9), [matchResultData?.homeName]);
  const aF  = React.useMemo(() => 7+Math.floor(Math.random()*9), [matchResultData?.homeName]);
  const hC  = React.useMemo(() => Math.round(possession.home/11+1), [matchResultData?.homeName]);
  const aC  = React.useMemo(() => Math.round(possession.away/11+1), [matchResultData?.homeName]);

  // ── Header (placar fixo no topo) ─────────────────────
  const minDisplay = String(Math.floor(Math.min(minute, step <= 1 ? 45 : 90))).padStart(2,'0');
  const isLive     = simulating && (step === 0 || step === 2);

  const headerJSX = (
    <Box sx={{ background:'linear-gradient(180deg,#ffffff 0%,#f4f7f6 100%)', borderBottom:`1px solid ${C.border}`, px:1.5, pt:3.2, pb:1, position:'sticky', top:0, zIndex:10 }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.8, mb:0.8 }}>
        {isLive && (
          <Box sx={{ display:'flex', alignItems:'center', gap:0.4, bgcolor:'#ef444418', border:`1px solid #ef444440`, borderRadius:20, px:0.9, py:0.2 }}>
            <Box sx={{ width:5, height:5, borderRadius:'50%', bgcolor:C.red, '@keyframes blink':{'0%,100%':{opacity:1},'50%':{opacity:0.1}}, animation:'blink 1s infinite' }} />
            <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.5rem', letterSpacing:2 }}>AO VIVO</Typography>
          </Box>
        )}
        <Box sx={{ bgcolor:'rgba(44,24,0,0.05)', border:`1px solid ${C.border}`, borderRadius:20, px:1, py:0.2 }}>
          <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.58rem', fontFamily:'monospace' }}>
            {isLive ? `⏱ ${minDisplay}'` : step === 1 ? `⏸ INTERVALO · 45'` : `✅ ENCERRADO · 90'`}
          </Typography>
        </Box>
        <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700 }}>
          {matchResultData?.isCupMatch
            ? `${matchResultData.cupLabel || '🏆 Copa'} · ${matchResultData.cupLeg === 'leg1' ? 'Jogo de Ida' : matchResultData.cupLeg === 'leg2' ? 'Jogo de Volta' : matchResultData.cupLeg || 'Jogo Único'}`
            : `Série ${gameData?.serie} · Rod ${gameData?.round}`
          }
        </Typography>
      </Box>
      <Box sx={{ display:'flex', alignItems:'center' }}>
        <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.3 }}>
          <Box sx={{ width:36, height:36, borderRadius:'9px', bgcolor:'rgba(44,24,0,0.04)', border:`1.5px solid ${homeName===gameData?.club?.name?C.green:C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {TeamIcon ? React.createElement(TeamIcon,{name:homeName,size:26}) : <Typography sx={{fontSize:'1rem'}}>⚽</Typography>}
          </Box>
          <Typography sx={{ color:homeName===gameData?.club?.name?C.green:C.txt2, fontWeight:900, fontSize:'0.6rem', textAlign:'center', lineHeight:1.1, maxWidth:68, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{homeName}</Typography>
        </Box>
        <Box sx={{ bgcolor:'#ffffff', border:`1.5px solid ${isLive?C.border:resColor+'60'}`, borderRadius:'10px', px:1.4, py:0.6, display:'flex', alignItems:'center', gap:0.3, flexShrink:0, boxShadow:isLive?'none':`0 0 12px ${resColor}30` }}>
          <Typography sx={{ fontWeight:900, fontSize:'1.55rem', lineHeight:1, color:isLive?C.txt1:resColor, fontFamily:'monospace', minWidth:22, textAlign:'center' }}>{liveScore.home}</Typography>
          <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'1rem', px:0.1 }}>–</Typography>
          <Typography sx={{ fontWeight:900, fontSize:'1.55rem', lineHeight:1, color:isLive?C.txt1:resColor, fontFamily:'monospace', minWidth:22, textAlign:'center' }}>{liveScore.away}</Typography>
        </Box>
        <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.3 }}>
          <Box sx={{ width:36, height:36, borderRadius:'9px', bgcolor:'rgba(44,24,0,0.04)', border:`1.5px solid ${awayName===gameData?.club?.name?C.green:C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {TeamIcon ? React.createElement(TeamIcon,{name:awayName,size:26}) : <Typography sx={{fontSize:'1rem'}}>⚽</Typography>}
          </Box>
          <Typography sx={{ color:awayName===gameData?.club?.name?C.green:C.txt2, fontWeight:900, fontSize:'0.6rem', textAlign:'center', lineHeight:1.1, maxWidth:68, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{awayName}</Typography>
        </Box>
      </Box>
    </Box>
  );

  // ── Mini campo com jogadores dos dois times ───────────────
  const fieldJSX = (() => {
    // Formação do usuário
    const userStarters  = (gameData?.players || []).filter(p => p.isStarting);
    const userFormation = gameData?.club?.formation || '4-4-2';
    const primaryColor  = gameData?.club?.colorPrimary || C.green;

    // Layouts por formação: cada entrada tem { pos, x, y }
    // Campo 160×100: x=0..160 (comprimento), y=0..100 (largura)
    // Lado esquerdo = defesa do usuário (GOL x≈6), lado direito = ataque
    // Cada formação define exatamente 11 slots com a posição correta.
    // LAYOUTS: cada time ocupa SUA METADE do campo (viewBox 160×100)
    // Usuário: metade ESQUERDA (x: 5–74) atacando para direita
    // Adversário: metade DIREITA (x: 86–155) espelhado — GOL à direita
    const LAYOUTS = {
      '4-4-2': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'LD',  x:20, y:12 }, { pos:'ZAG', x:20, y:36 },
        { pos:'ZAG', x:20, y:64 }, { pos:'LE',  x:20, y:88 },
        { pos:'PD',  x:44, y:20 }, { pos:'VOL', x:44, y:40 },
        { pos:'VOL', x:44, y:60 }, { pos:'PE',  x:44, y:80 },
        { pos:'CA',  x:66, y:36 }, { pos:'CA',  x:66, y:64 },
      ],
      '4-3-3': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'LD',  x:20, y:12 }, { pos:'ZAG', x:20, y:36 },
        { pos:'ZAG', x:20, y:64 }, { pos:'LE',  x:20, y:88 },
        { pos:'VOL', x:42, y:24 }, { pos:'MC',  x:42, y:50 }, { pos:'MEI', x:42, y:76 },
        { pos:'PD',  x:66, y:16 }, { pos:'CA',  x:66, y:50 }, { pos:'PE',  x:66, y:84 },
      ],
      '4-2-3-1': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'LD',  x:18, y:12 }, { pos:'ZAG', x:18, y:36 },
        { pos:'ZAG', x:18, y:64 }, { pos:'LE',  x:18, y:88 },
        { pos:'VOL', x:36, y:36 }, { pos:'VOL', x:36, y:64 },
        { pos:'PD',  x:54, y:16 }, { pos:'MEI', x:54, y:50 }, { pos:'PE',  x:54, y:84 },
        { pos:'CA',  x:70, y:50 },
      ],
      '3-5-2': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'ZAG', x:20, y:22 }, { pos:'ZAG', x:20, y:50 }, { pos:'ZAG', x:20, y:78 },
        { pos:'LD',  x:42, y:8  }, { pos:'VOL', x:42, y:30 },
        { pos:'MC',  x:42, y:50 }, { pos:'VOL', x:42, y:70 }, { pos:'LE',  x:42, y:92 },
        { pos:'CA',  x:66, y:36 }, { pos:'CA',  x:66, y:64 },
      ],
      '5-3-2': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'LD',  x:18, y:8  }, { pos:'ZAG', x:18, y:28 },
        { pos:'ZAG', x:18, y:50 }, { pos:'ZAG', x:18, y:72 }, { pos:'LE',  x:18, y:92 },
        { pos:'VOL', x:44, y:26 }, { pos:'MC',  x:44, y:50 }, { pos:'VOL', x:44, y:74 },
        { pos:'CA',  x:66, y:36 }, { pos:'CA',  x:66, y:64 },
      ],
      '3-4-3': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'ZAG', x:18, y:22 }, { pos:'ZAG', x:18, y:50 }, { pos:'ZAG', x:18, y:78 },
        { pos:'LD',  x:40, y:12 }, { pos:'VOL', x:40, y:38 },
        { pos:'VOL', x:40, y:62 }, { pos:'LE',  x:40, y:88 },
        { pos:'PD',  x:66, y:16 }, { pos:'CA',  x:66, y:50 }, { pos:'PE',  x:66, y:84 },
      ],
      '4-1-4-1': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'LD',  x:18, y:12 }, { pos:'ZAG', x:18, y:36 },
        { pos:'ZAG', x:18, y:64 }, { pos:'LE',  x:18, y:88 },
        { pos:'VOL', x:36, y:50 },
        { pos:'PD',  x:54, y:12 }, { pos:'MC',  x:54, y:38 },
        { pos:'MC',  x:54, y:62 }, { pos:'PE',  x:54, y:88 },
        { pos:'CA',  x:70, y:50 },
      ],
      '4-5-1': [
        { pos:'GOL', x:5,  y:50 },
        { pos:'LD',  x:18, y:12 }, { pos:'ZAG', x:18, y:36 },
        { pos:'ZAG', x:18, y:64 }, { pos:'LE',  x:18, y:88 },
        { pos:'PD',  x:42, y:8  }, { pos:'VOL', x:42, y:30 },
        { pos:'MC',  x:42, y:50 }, { pos:'VOL', x:42, y:70 }, { pos:'PE',  x:42, y:92 },
        { pos:'CA',  x:66, y:50 },
      ],
    };

    // Mapeamento de jogador → slot: para cada slot, pega o jogador com
    // a posição correspondente que ainda não foi alocado.
    const layout = LAYOUTS[userFormation] || LAYOUTS['4-4-2'];
    const playersByPos = {};
    userStarters.forEach(p => {
      if (!playersByPos[p.position]) playersByPos[p.position] = [];
      playersByPos[p.position].push(p);
    });
    const usedIds = new Set();

    const userDots = layout.map(slot => {
      const candidates = (playersByPos[slot.pos] || []).filter(p => !usedIds.has(p.id));
      // Fallback: qualquer jogador disponível
      const pool = candidates.length > 0
        ? candidates
        : userStarters.filter(p => !usedIds.has(p.id));
      if (!pool.length) return null;
      const p = pool[0];
      usedIds.add(p.id);
      return { x: slot.x, y: slot.y, name: p.name.split(' ').pop().slice(0,7), pos: p.position, shirt: p.shirt ?? (i + 1) };
    }).filter(Boolean);

    // Adversário: espelhado em relação à linha do meio (x=80)
    const mirrorX = (x) => 160 - x;
    const oppLayout = LAYOUTS['4-4-2'];

    const oppName    = isUserH ? awayName : homeName;
    const oppTeam    = gameData?.teams?.find(t => t.name === oppName)
                    || gameData?.leagues?.A?.find(t => t.name === oppName)
                    || gameData?.leagues?.B?.find(t => t.name === oppName)
                    || gameData?.leagues?.C?.find(t => t.name === oppName)
                    || gameData?.leagues?.D?.find(t => t.name === oppName);
    const oppSquadRaw = gameData?.teamRosters?.[oppTeam?.id] || oppTeam?.squad || [];
    const oppStartersRaw = oppSquadRaw.filter(p => p.isStarting).length > 0
      ? oppSquadRaw.filter(p => p.isStarting)
      : oppSquadRaw.sort((a,b) => (b.overall||0)-(a.overall||0)).slice(0,11);

    const oppByPos = {};
    oppStartersRaw.forEach(p => {
      if (!oppByPos[p.position]) oppByPos[p.position] = []
      oppByPos[p.position].push(p);
    });
    const usedOppIds = new Set();

    const oppDots = oppLayout.map(slot => {
      const candidates = (oppByPos[slot.pos] || []).filter(p => !usedOppIds.has(p.id));
      const pool = candidates.length > 0
        ? candidates
        : oppStartersRaw.filter(p => !usedOppIds.has(p.id));
      if (!pool.length) return null;
      const p = pool[0];
      usedOppIds.add(p.id);
      // opp sempre na direita (espelhado) — depois aplicamos swap se user for visitante
      return { x: mirrorX(slot.x), y: slot.y, name: p.name.split(' ').pop().slice(0,7), pos: p.position, shirt: p.shirt ?? (i + 1) };
    }).filter(Boolean);

    // ── CORREÇÃO DE LADO: mandante à esquerda, visitante à direita ──
    // Se o user é VISITANTE (isUserH=false), ele deve ficar na DIREITA do campo,
    // e o adversário (que é o mandante) fica na ESQUERDA.
    const userDotsPositioned = userDots.map(d => ({
      ...d, x: isUserH ? d.x : mirrorX(d.x),
    }));
    const oppDotsPositioned = oppDots.map(d => ({
      ...d, x: isUserH ? d.x : (160 - d.x), // 160 - mirrorX(orig) = orig → volta para esquerda
    }));

    // Formações para exibir abaixo do campo
    const homeFormation = isUserH ? userFormation : '4-4-2';
    const awayFormation = isUserH ? '4-4-2'        : userFormation;
    const homeLabel     = isUserH ? homeName        : homeName;
    const awayLabel     = isUserH ? awayName         : awayName;

    return (
      <Box sx={{ borderRadius:'10px', overflow:'hidden', border:`1px solid rgba(255,255,255,0.07)`, mb:1 }}>
        <Box sx={{ position:'relative', width:'100%' }}>
          {/* viewBox 160×100 = proporção 1.6:1 de campo de futebol real */}
          <svg viewBox="0 0 160 100" style={{ width:'100%', display:'block' }} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="smrfg2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1b6b1b"/>
                <stop offset="100%" stopColor="#0f4010"/>
              </linearGradient>
            </defs>
            <rect width="160" height="100" fill="url(#smrfg2)"/>
            {/* Listras verticais de grama */}
            {[0,1,2,3,4,5,6,7].map(i=>(
              <rect key={i} x={i*20} y="0" width="20" height="100" fill={i%2===0?'rgba(255,255,255,0.018)':'transparent'}/>
            ))}
            {/* Borda do campo */}
            <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" rx="1"/>
            {/* Linha do meio */}
            <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
            {/* Círculo central */}
            <circle cx="80" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
            <circle cx="80" cy="50" r="1.2" fill="rgba(255,255,255,0.65)"/>
            {/* Área grande esquerda */}
            <rect x="2" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
            {/* Área pequena esquerda */}
            <rect x="2" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
            {/* Pênalti esq */}
            <circle cx="14" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
            {/* Arco da área esq */}
            <path d="M 20 38 A 14 14 0 0 1 20 62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
            {/* Área grande direita */}
            <rect x="140" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
            {/* Área pequena direita */}
            <rect x="150" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
            {/* Pênalti dir */}
            <circle cx="146" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
            {/* Arco da área dir */}
            <path d="M 140 38 A 14 14 0 0 0 140 62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
            {/* Goleiras */}
            <rect x="2" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
            <rect x="154" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
            {/* Bola ao vivo */}
            {isLive && !fieldEvent && (
              <circle cx={(ballPos.x/300)*160} cy={(ballPos.y/110)*100} r="2.8" fill="white" opacity="0.92">
                <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1s" repeatCount="indefinite"/>
              </circle>
            )}
            {/* Evento de campo */}
            {fieldEvent && (() => {
              const cfg = {goal:{c:'#16a34a',icon:'⚽'},red:{c:'#f85149',icon:'🟥'},yellow:{c:'#f0a500',icon:'🟨'}}[fieldEvent.type];
              const fx = (fieldEvent.x/300)*160, fy = (fieldEvent.y/110)*100;
              return (
                <g>
                  <circle cx={fx} cy={fy} r="5" fill={cfg.c} opacity="0.88">
                    <animate attributeName="r" values="3;7;3" dur="0.5s" repeatCount="4"/>
                    <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.5s" repeatCount="4"/>
                  </circle>
                  <text x={fx} y={fy+1} textAnchor="middle" dominantBaseline="middle" fontSize="5">{cfg.icon}</text>
                </g>
              );
            })()}
          </svg>

          {/* ── HTML overlay: camisas SVG dos jogadores ── */}
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {userDotsPositioned.map((d, i) => {
              const JB = JerseyBadge;
              return (
                <Box key={`u${i}`} sx={{
                  position: 'absolute',
                  left: `${(d.x / 160) * 100}%`,
                  top:  `${(d.y / 100) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  {JB && React.createElement(JB, { pos: d.pos, num: d.shirt, size: 20 })}
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '3px', px: '2.5px', py: '1px', mt: '1px', backdropFilter: 'blur(2px)' }}>
                    <Typography sx={{ color: '#fff', fontSize: '0.3rem', fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {d.name}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            {oppDotsPositioned.map((d, i) => {
              const JB = JerseyBadge;
              return (
                <Box key={`o${i}`} sx={{
                  position: 'absolute',
                  left: `${(d.x / 160) * 100}%`,
                  top:  `${(d.y / 100) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  {JB && React.createElement(JB, { pos: d.pos, num: d.shirt, size: 20 })}
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '3px', px: '2.5px', py: '1px', mt: '1px', backdropFilter: 'blur(2px)' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.3rem', fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {d.name}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
        {/* ── Formações dos times ── */}
        <Box sx={{ px:1.2, py:0.55, bgcolor:'rgba(0,0,0,0.35)', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
            <Typography sx={{ color: isUserH ? C.green : C.txt3, fontWeight:900, fontSize:'0.5rem', maxWidth:60, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
              {homeLabel.substring(0,12)}
            </Typography>
            <Box sx={{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:'4px', px:0.6, py:0.15 }}>
              <Typography sx={{ color:'rgba(255,255,255,0.85)', fontWeight:900, fontSize:'0.5rem', letterSpacing:0.3 }}>
                {homeFormation}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color:'rgba(255,255,255,0.25)', fontSize:'0.42rem', fontWeight:700 }}>FORMAÇÕES</Typography>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
            <Box sx={{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:'4px', px:0.6, py:0.15 }}>
              <Typography sx={{ color:'rgba(255,255,255,0.85)', fontWeight:900, fontSize:'0.5rem', letterSpacing:0.3 }}>
                {awayFormation}
              </Typography>
            </Box>
            <Typography sx={{ color: !isUserH ? C.green : C.txt3, fontWeight:900, fontSize:'0.5rem', maxWidth:60, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
              {awayLabel.substring(0,12)}
            </Typography>
          </Box>
        </Box>
        {/* Barra de posse */}
        <Box sx={{ px:1.5, py:0.6, bgcolor:SMR_C.possessionBg, display:'flex', flexDirection:'column', gap:0.3 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.6rem' }}>{homeName.substring(0,14)} {possession.home}%</Typography>
            <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.5rem', letterSpacing:1 }}>POSSE</Typography>
            <Typography sx={{ color:C.blue, fontWeight:900, fontSize:'0.6rem' }}>{possession.away}% {awayName.substring(0,14)}</Typography>
          </Box>
          <Box sx={{ height:4, bgcolor:C.cardAlt, borderRadius:2, overflow:'hidden' }}>
            <Box sx={{ height:'100%', width:`${possession.home}%`, bgcolor:C.green, transition:'width 0.9s ease', borderRadius:2 }}/>
          </Box>
        </Box>
      </Box>
    );
  })();

  // ── Banco de reservas (exibido abaixo do campo) ──────────
  const benchJSX = (() => {
    const POS_ORDER = ['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'];
    const bench = (gameData?.players||[])
      .filter(p => !p.isStarting)
      .sort((a,b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position));
    const subsLeft = 3 - subsDone.length;
    const Chip = JerseyBadge;

    if (!bench.length) return null;

    return (
      <SMR_Card accent={subsLeft > 0 ? C.yellow : C.border}>
        {/* Header */}
        <Box sx={{ px:1.5, py:0.8, borderBottom:`1px solid ${C.border}`,
          bgcolor: C.cardAlt, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.7 }}>
            <Typography sx={{ fontSize:'0.95rem', lineHeight:1 }}>🪑</Typography>
            <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.6rem', letterSpacing:1.2 }}>BANCO DE RESERVAS</Typography>
          </Box>
          {subsLeft > 0
            ? <Box sx={{ bgcolor:`${C.yellow}20`, border:`1px solid ${C.yellow}50`, borderRadius:'6px', px:0.8, py:0.2 }}>
                <Typography sx={{ color:C.yellow, fontWeight:900, fontSize:'0.58rem' }}>🔄 {subsLeft} SUB{subsLeft > 1 ? 'S' : ''}</Typography>
              </Box>
            : <Box sx={{ bgcolor:`${C.txt3}15`, border:`1px solid ${C.border}`, borderRadius:'6px', px:0.8, py:0.2 }}>
                <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.56rem' }}>SEM SUBS</Typography>
              </Box>
          }
        </Box>

        {/* Grade de jogadores */}
        <Box sx={{ px:1, py:0.9, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(68px,1fr))', gap:0.7 }}>
          {bench.map((p, i) => {
            const isInjured = !!p.injury;
            const energy    = p.energy ?? 100;
            const eColor    = energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;
            const ovrC      = p.overall >= 80 ? C.green : p.overall >= 70 ? C.yellow : C.red;
            const goals     = p.seasonGoals || p.goals || 0;

            return (
              <Box key={p.id||i} sx={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:0.4,
                bgcolor: isInjured ? `${C.red}08` : C.cardAlt,
                border:`1px solid ${isInjured ? C.red+'40' : C.border}`,
                borderRadius:'10px', px:0.6, py:0.7,
                opacity: isInjured ? 0.55 : 1,
                transition:'all 0.12s',
              }}>
                {/* PlayerChip */}
                {Chip
                  ? React.createElement(Chip, { pos: p.position, num: p.shirt ?? '?', size: 38, showPos: true })
                  : <Box sx={{ width:38, height:38 }} />
                }

                {/* Nome */}
                <Typography sx={{ color:C.txt1, fontSize:'0.56rem', fontWeight:900,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  maxWidth:62, textAlign:'center', lineHeight:1 }}>
                  {p.name.split(' ').pop()}
                </Typography>

                {/* OVR + Energia */}
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                  <Typography sx={{ color:ovrC, fontSize:'0.55rem', fontWeight:900 }}>{p.overall}</Typography>
                  <Box sx={{ width:20, height:3, bgcolor:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
                    <Box sx={{ height:'100%', width:`${energy}%`, bgcolor:eColor, borderRadius:2 }}/>
                  </Box>
                </Box>

                {/* Gols / Lesão */}
                {isInjured
                  ? <Typography sx={{ fontSize:'0.58rem', lineHeight:1 }}>🚑</Typography>
                  : goals > 0
                  ? <Typography sx={{ color:C.green, fontSize:'0.5rem', fontWeight:900 }}>⚽{goals}</Typography>
                  : null
                }
              </Box>
            );
          })}
        </Box>

        {/* Subs feitas */}
        {subsDone.length > 0 && (
          <Box sx={{ px:1.2, pb:0.8, display:'flex', flexWrap:'wrap', gap:0.5 }}>
            {subsDone.map((s, i) => (
              <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.4,
                bgcolor:'rgba(240,165,0,0.08)', border:`1px solid ${C.yellow}30`,
                borderRadius:'6px', px:0.7, py:0.3 }}>
                <Typography sx={{ color:C.yellow, fontSize:'0.52rem', fontWeight:900 }}>
                  🔄 {s.out} → {s.in}
                </Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.46rem', fontWeight:700 }}>{s.min}'</Typography>
              </Box>
            ))}
          </Box>
        )}
      </SMR_Card>
    );
  })();

  // ── Narração ──────────────────────────────────────────
  const narrationJSX = (
    <SMR_Card>
      <Box sx={{ px:1.5, py:0.7, borderBottom:`1px solid ${C.border}`, bgcolor:C.cardAlt, display:'flex', alignItems:'center', gap:0.8 }}>
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.58rem', letterSpacing:1.5 }}>
          ⚽ NARRAÇÃO {step===2?'· 2º TEMPO':'· 1º TEMPO'}
        </Typography>
        <Box sx={{ flex:1 }}>
          {isLive && <LinearProgress sx={{ height:2, borderRadius:1, bgcolor:C.border, '& .MuiLinearProgress-bar':{bgcolor:C.green} }}/>}
        </Box>
      </Box>
      <Box ref={matchFeedRef} sx={{ maxHeight:200, overflowY:'auto', p:0.8, display:'flex', flexDirection:'column', gap:0.4 }}>
        {visibleEvents.length===0 ? (
          <Box sx={{ textAlign:'center', py:3 }}>
            <Typography sx={{ fontSize:'1.8rem', mb:0.5 }}>🏟️</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.72rem', fontStyle:'italic' }}>Aguardando lances...</Typography>
          </Box>
        ) : [...visibleEvents].reverse().map((evt,i)=>{
          const isGoal   = evt.includes('GOL')||evt.includes('⚽');
          const isRed    = evt.includes('🟥');
          const isYellow = evt.includes('🟨');
          const isFim    = evt.includes('FIM DE JOGO');
          const isNeutral= !isGoal&&!isRed&&!isYellow&&!isFim;
          const min  = evt.match(/^(\d+)'/)?.[1];
          const text = evt.replace(/^\d+' /,'').replace(/^90'\+ /,'');
          const color= isGoal?C.green:isRed?C.red:isYellow?C.yellow:isFim?C.blue:C.txt2;
          const bg   = isGoal?'rgba(34,197,94,0.09)':isRed?'rgba(248,81,73,0.08)':isYellow?'rgba(240,165,0,0.07)':isFim?'rgba(56,139,253,0.08)':'transparent';
          return (
            <Box key={`evt-${i}-${min||'x'}`} sx={{ display:'flex', gap:0.7, alignItems:'flex-start', bgcolor:bg, borderRadius:'6px', px:0.8, py:0.45 }}>
              <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.54rem', minWidth:26, pt:0.15, fontFamily:'monospace', flexShrink:0 }}>{min?`${min}'`:''}</Typography>
              <Typography sx={{ flex:1, color, lineHeight:1.45, fontSize:isGoal||isRed||isFim?'0.78rem':'0.7rem', fontWeight:isGoal||isRed||isFim?900:700 }}>{text}</Typography>
            </Box>
          );
        })}
      </Box>
    </SMR_Card>
  );

  // ── Overlay de celebração de gol ──────────────────────────
  const goalOverlayJSX = goalCelebration ? (() => {
    const { scorer, team, minute, isUser, score } = goalCelebration;
    const accentColor = isUser ? '#22c55e' : '#ef4444';
    const emoji  = isUser ? '⚽' : '😤';
    const titulo = isUser ? 'GOOOOOL!' : 'GOL DO ADVERSÁRIO';

    return (
      <Box sx={{
        position: 'fixed', bottom: 80, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200, width: 'calc(100% - 32px)', maxWidth: 360,
        '@keyframes goalCardIn': {
          '0%':   { transform: 'translateX(-50%) translateY(40px)', opacity: 0 },
          '60%':  { transform: 'translateX(-50%) translateY(-6px)' },
          '100%': { transform: 'translateX(-50%) translateY(0)',    opacity: 1 },
        },
        animation: 'goalCardIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
      }}
        onClick={() => setGoalCelebration(null)}
      >
        <Box sx={{
          bgcolor: C.card,
          border: `2.5px solid ${accentColor}`,
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: `0 8px 32px ${accentColor}50, 0 2px 8px rgba(0,0,0,0.3)`,
        }}>
          {/* Faixa colorida */}
          <Box sx={{
            bgcolor: accentColor,
            px: 2, py: 0.9,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{emoji}</Typography>
              <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '1rem', letterSpacing: 2 }}>
                {titulo}
              </Typography>
            </Box>
            <Typography sx={{ color: 'rgba(0,0,0,0.55)', fontWeight: 700, fontSize: '0.6rem' }}>{minute}'</Typography>
          </Box>

          {/* Corpo */}
          <Box sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              {scorer && (
                <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1, mb: 0.2 }}>
                  {scorer}
                </Typography>
              )}
              <Typography sx={{ color: C.txt3, fontWeight: 700, fontSize: '0.68rem' }}>{team}</Typography>
            </Box>
            {/* Placar em destaque */}
            <Box sx={{
              bgcolor: accentColor + '18',
              border: `1.5px solid ${accentColor}40`,
              borderRadius: '12px', px: 1.8, py: 0.6, textAlign: 'center',
            }}>
              <Typography sx={{
                color: accentColor, fontWeight: 900, fontSize: '1.6rem',
                fontFamily: 'monospace', letterSpacing: 2, lineHeight: 1,
              }}>{score}</Typography>
            </Box>
          </Box>

          {/* Barra de toque */}
          <Box sx={{ textAlign: 'center', py: 0.4, bgcolor: C.cardAlt }}>
            <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>toque para fechar</Typography>
          </Box>
        </Box>
      </Box>
    );
  })() : null;

  // ── Botão de som (persistente durante a partida) ──────────
  const soundBtnJSX = (step === 0 || step === 2) ? (
    <Box
      onClick={() => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        if (SoundEngine) SoundEngine.setEnabled(next);
      }}
      sx={{
        position:'fixed', top:12, right:12, zIndex:100,
        width:36, height:36, borderRadius:'50%',
        bgcolor:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)',
        border:'1px solid rgba(255,255,255,0.2)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', '&:active':{ filter:'brightness(0.75)' },
      }}
    >
      <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>
        {soundEnabled ? '🔊' : '🔇'}
      </Typography>
    </Box>
  ) : null;

  // ═══════════════════════════════════════════════
  // DIALOG GLOBAL DE SUBSTITUIÇÕES (step 0 e 2)
  // ═══════════════════════════════════════════════
  const subsDialogJSX = (() => {
    if (!showSubs) return null;
    const maxSubs   = 3;
    const subsLeft  = maxSubs - subsDone.length;
    const subMin    = step === 1 ? 'HT' : `${Math.floor(minute)}'`;
    const titulares = (gameData?.players||[]).filter(p=>p.isStarting)
      .sort((a,b)=>(['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'].indexOf(a.position)+1||99)
                  -(['GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA','LAT','ATA'].indexOf(b.position)+1||99));
    const posCol = pos => ({
      GOL:'#b45309', ZAG:'#1d4ed8',
      LD:'#0369a1',  LE:'#0369a1',
      VOL:'#15803d', MC:'#16a34a', MEI:'#16a34a',
      PD:'#9a3412',  PE:'#9a3412', CA:'#b91c1c',
      // compat saves antigos
      LAT:'#0369a1', ATA:'#b91c1c',
    })[pos]||C.txt3;
    const selPlayer  = titulares.find(p => p.id === selectedStarter) || null;
    const selReserves = selPlayer
      ? (gameData?.players||[]).filter(q=>!q.isStarting&&q.position===selPlayer.position&&!q.injury)
          .sort((a,b)=>b.overall-a.overall).slice(0,5)
      : [];

    const doSub = (res) => {
      if (subsDone.length >= maxSubs) return;
      const subMinNum = step === 1 ? 45 : Math.floor(minute);
      setGameData(prev=>({...prev, players:prev.players.map(pl=>{
        if(pl.id===selPlayer.id) return{...pl, isStarting:false, minutesPlayed:(pl.minutesPlayed||0)+subMinNum};
        if(pl.id===res.id)       return{...pl, isStarting:true,  minutesPlayed:(pl.minutesPlayed||0)+(90-subMinNum)};
        return pl;
      })}));
      const subEntry = {out:selPlayer.name.split(' ')[0], in:res.name.split(' ')[0], min:subMin};
      setSubsDone(prev=>[...prev, subEntry]);
      matchControlsRef.current.addEvent?.(`${subMin} 🔄 SUBSTITUIÇÃO: ↓ ${selPlayer.name} → ↑ ${res.name} (${isUserH?homeName:awayName})`);
      setSelectedStarter(null);
      setShowSubs(false);
      if (SoundEngine) SoundEngine.playSub();
    };

    return (
      <Dialog open={showSubs} onClose={()=>{setShowSubs(false);setSelectedStarter(null);}}
        fullWidth maxWidth="xs"
        PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.yellow}`, m:1.5, maxHeight:'85vh' } }}
        BackdropProps={{ sx:{ backdropFilter:'blur(3px)', bgcolor:'rgba(0,0,0,0.5)' } }}>
        <Box sx={{ px:1.5, py:1.2, bgcolor:C.yellow, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Box>
            <Typography sx={{color:'#000',fontWeight:900,fontSize:'0.85rem'}}>🔄 SUBSTITUIÇÕES</Typography>
            <Typography sx={{color:'rgba(0,0,0,0.6)',fontSize:'0.58rem',fontWeight:700}}>
              {subsLeft>0?`${subsLeft} restante(s) · ${subMin}`:'Limite atingido'}
            </Typography>
          </Box>
          <Box onClick={()=>{setShowSubs(false);setSelectedStarter(null);}}
            sx={{cursor:'pointer',color:'rgba(0,0,0,0.7)',fontSize:'1.3rem',fontWeight:900}}>✕</Box>
        </Box>
        <Box sx={{ p:1.4, overflowY:'auto' }}>
          {/* Subs já feitas */}
          {subsDone.length>0 && (
            <Box sx={{bgcolor:`${C.yellow}0a`,border:`1px solid ${C.yellow}30`,borderRadius:'8px',p:1,mb:1}}>
              <Typography sx={{color:C.yellow,fontSize:'0.56rem',fontWeight:900,letterSpacing:0.5,mb:0.4}}>
                FEITAS ({subsDone.length}/{maxSubs})
              </Typography>
              {subsDone.map((s,i)=>(
                <Box key={i} sx={{display:'flex',alignItems:'center',gap:0.6,mb:0.2}}>
                  <Typography sx={{color:C.txt3,fontSize:'0.54rem',fontFamily:'monospace',minWidth:22}}>{s.min}'</Typography>
                  <Typography sx={{color:C.red,fontWeight:900,fontSize:'0.6rem'}}>↓ {s.out}</Typography>
                  <Typography sx={{color:C.txt3,fontSize:'0.54rem'}}>→</Typography>
                  <Typography sx={{color:C.green,fontWeight:900,fontSize:'0.6rem'}}>↑ {s.in}</Typography>
                </Box>
              ))}
            </Box>
          )}
          {subsLeft===0 ? (
            <Box sx={{textAlign:'center',py:3}}>
              <Typography sx={{fontSize:'1.8rem',mb:0.5}}>✅</Typography>
              <Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.8rem'}}>Limite atingido</Typography>
            </Box>
          ) : !selPlayer ? (
            <>
              <Typography sx={{color:C.txt3,fontSize:'0.6rem',fontWeight:900,letterSpacing:0.5,mb:0.8}}>
                TOQUE NO TITULAR QUE VAI SAIR:
              </Typography>
              {titulares.map(p=>{
                const pc = posCol(p.position);
                const sel = selectedStarter===p.id;
                return (
                  <Box key={p.id} onClick={()=>setSelectedStarter(sel?null:p.id)} sx={{
                    display:'flex',alignItems:'center',gap:0.8,mb:0.6,
                    bgcolor:sel?`${C.yellow}15`:C.card,
                    border:`1px solid ${sel?C.yellow:C.border}`,
                    borderRadius:'8px',px:1.2,py:0.85,cursor:'pointer',
                    '&:active':{bgcolor:`${C.yellow}10`,borderColor:C.yellow},
                  }}>
                    <Box sx={{width:26,height:26,borderRadius:'5px',bgcolor:pc+'20',border:`1px solid ${pc}50`,
                      display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <Typography sx={{color:pc,fontSize:'0.48rem',fontWeight:900}}>{p.position}</Typography>
                    </Box>
                    <Box sx={{flex:1}}>
                      <Typography sx={{color:sel?C.yellow:C.txt1,fontWeight:900,fontSize:'0.78rem',lineHeight:1}}>{p.name}</Typography>
                      <Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>OVR {p.overall} · ⚡{p.energy??100}%</Typography>
                    </Box>
                    <Typography sx={{color:sel?C.yellow:C.txt3,fontSize:'0.75rem'}}>{sel?'✕':'↕'}</Typography>
                  </Box>
                );
              })}
            </>
          ) : (
            <>
              <Box sx={{bgcolor:`${C.red}0d`,border:`1.5px solid ${C.red}50`,borderRadius:'10px',p:1,mb:1}}>
                <Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:900,letterSpacing:0.5,mb:0.5}}>SAI:</Typography>
                <Box sx={{display:'flex',alignItems:'center',gap:0.8}}>
                  <Box sx={{width:26,height:26,borderRadius:'5px',bgcolor:posCol(selPlayer.position)+'25',
                    border:`1px solid ${posCol(selPlayer.position)}50`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Typography sx={{color:posCol(selPlayer.position),fontSize:'0.48rem',fontWeight:900}}>{selPlayer.position}</Typography>
                  </Box>
                  <Box sx={{flex:1}}>
                    <Typography sx={{color:C.txt1,fontWeight:900,fontSize:'0.8rem',lineHeight:1}}>{selPlayer.name}</Typography>
                    <Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>OVR {selPlayer.overall} · ⚡{selPlayer.energy??100}%</Typography>
                  </Box>
                  <Box onClick={()=>setSelectedStarter(null)} sx={{bgcolor:C.cardAlt,border:`1px solid ${C.border}`,
                    borderRadius:'6px',px:0.9,py:0.45,cursor:'pointer','&:active':{opacity:0.7},flexShrink:0}}>
                    <Typography sx={{color:C.txt2,fontWeight:900,fontSize:'0.58rem'}}>✕ Cancelar</Typography>
                  </Box>
                </Box>
              </Box>
              <Typography sx={{color:C.txt3,fontSize:'0.55rem',fontWeight:900,letterSpacing:0.5,mb:0.6}}>ENTRA:</Typography>
              {selReserves.length===0 ? (
                <Box sx={{textAlign:'center',py:1.5,bgcolor:C.cardAlt,borderRadius:'8px'}}>
                  <Typography sx={{color:C.txt3,fontSize:'0.65rem',fontStyle:'italic'}}>
                    Sem reserva disponível para {selPlayer.position}
                  </Typography>
                </Box>
              ) : selReserves.map(res=>(
                <Box key={res.id} onClick={()=>doSub(res)} sx={{
                  display:'flex',alignItems:'center',gap:0.8,mb:0.6,
                  bgcolor:`${C.green}0d`,border:`1.5px solid ${C.green}40`,
                  borderRadius:'8px',px:1.2,py:0.85,cursor:'pointer',
                  '&:active':{bgcolor:`${C.green}20`,transform:'scale(0.98)'},
                  transition:'all 0.12s',
                }}>
                  <Box sx={{width:30,height:30,borderRadius:'7px',bgcolor:C.green+'18',border:`1px solid ${C.green}40`,
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Typography sx={{color:C.green,fontSize:'0.7rem',fontWeight:900}}>{res.overall}</Typography>
                  </Box>
                  <Box sx={{flex:1,minWidth:0}}>
                    <Typography sx={{color:C.green,fontWeight:900,fontSize:'0.78rem',lineHeight:1}}>{res.name}</Typography>
                    <Typography sx={{color:C.txt3,fontSize:'0.54rem',fontWeight:700}}>{res.position} · ⚡{res.energy??100}%</Typography>
                  </Box>
                  <Typography sx={{color:C.green,fontSize:'1rem',fontWeight:900}}>↑</Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      </Dialog>
    );
  })();

  // ═══════════════════════════════════════════════
  // STEP -1 — PRÉ-JOGO
  // ═══════════════════════════════════════════════
  // ═══════════════════════════════════════════════
  // STEP -1 — PRÉ-JOGO
  // Delegado ao SMR_PreMatch para manter este arquivo focado
  // apenas na simulação ao vivo.
  // ═══════════════════════════════════════════════
  if (step === -1) return (
    <SMR_PreMatch
      gameData={gameData}
      matchResultData={matchResultData}
      headerJSX={headerJSX}
      onStart={() => setStep(0)}
    />
  );

  if (step === 0) return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:14 }}>
      {headerJSX}
      <Box sx={{ px:1.5, pt:1 }}>
        {fieldJSX}
        {narrationJSX}
        {benchJSX}
      </Box>
      {/* Botões flutuantes — 1T */}
      <Box sx={{ position:'fixed', bottom:76, left:0, right:0, zIndex:50,
        display:'flex', justifyContent:'center', gap:1, px:1.5, pointerEvents:'none' }}>
        {(simulating || isPaused) && (
          <Box onClick={() => { if(isPaused){matchControlsRef.current.resumeMatch?.();setIsPaused(false);}else{matchControlsRef.current.pauseMatch?.();setIsPaused(true);} }}
            sx={{ pointerEvents:'auto', bgcolor:isPaused?C.green:C.yellow,
              borderRadius:'50px', px:1.6, py:0.85, display:'flex', alignItems:'center', gap:0.6,
              boxShadow:`0 4px 16px ${isPaused?C.green:C.yellow}60`, cursor:'pointer', '&:active':{filter:'brightness(0.85)'} }}>
            <Typography sx={{fontSize:'0.9rem',lineHeight:1}}>{isPaused?'▶':'⏸'}</Typography>
            <Typography sx={{color:'#0f172a',fontWeight:900,fontSize:'0.65rem'}}>{isPaused?'RETOMAR':'PAUSAR'}</Typography>
          </Box>
        )}
        {subsDone.length < 3 && (simulating || isPaused) && (
          <Box onClick={() => { setShowSubs(true); setSelectedStarter(null); }}
            sx={{ pointerEvents:'auto', bgcolor:C.card, border:`1.5px solid ${C.yellow}`,
              borderRadius:'50px', px:1.4, py:0.85, display:'flex', alignItems:'center', gap:0.6,
              boxShadow:'0 4px 14px rgba(0,0,0,0.4)', cursor:'pointer', '&:active':{filter:'brightness(1.15)'} }}>
            <Typography sx={{fontSize:'0.9rem',lineHeight:1}}>🔄</Typography>
            <Typography sx={{color:C.yellow,fontWeight:900,fontSize:'0.65rem'}}>SUB ({3-subsDone.length})</Typography>
          </Box>
        )}
      </Box>
      {isPaused && (
        <Box sx={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          bgcolor:'rgba(0,0,0,0.82)', border:`2px solid ${C.yellow}`, borderRadius:'14px',
          px:2.5, py:1.5, zIndex:60, textAlign:'center', pointerEvents:'none' }}>
          <Typography sx={{fontSize:'1.8rem',lineHeight:1,mb:0.4}}>⏸</Typography>
          <Typography sx={{color:C.yellow,fontWeight:900,fontSize:'0.85rem',letterSpacing:1}}>JOGO PAUSADO</Typography>
        </Box>
      )}
      {subsDialogJSX}
      {goalOverlayJSX}
      {soundBtnJSX}
      {!simulating && !isPaused && (
        <Box sx={{position:'fixed',bottom:62,left:0,right:0,zIndex:50,px:1.5,pb:1.5,pt:1.5,background:`linear-gradient(transparent 0%,${C.bg} 35%)`,boxShadow:`0 -12px 28px ${C.bg}`}}>
          <Box onClick={()=>setStep(1)} sx={{bgcolor:C.yellow,borderRadius:'14px',py:1.4,display:'flex',alignItems:'center',justifyContent:'center',gap:1,cursor:'pointer',boxShadow:`0 0 24px ${C.yellow}50`,'&:active':{filter:'brightness(0.88)'}}}>
            <Typography sx={{fontSize:'1.1rem',lineHeight:1}}>⏸</Typography>
            <Typography sx={{color:'#000',fontWeight:900,fontSize:'0.95rem'}}>VER INTERVALO</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  // ═══════════════════════════════════════════════
  // ═══════════════════════════════════════════════
  // STEP 1 — INTERVALO REDESENHADO
  // ═══════════════════════════════════════════════
  // ═══════════════════════════════════════════════
  // STEP 1 — INTERVALO
  // Delegado ao SMR_Halftime para manter este arquivo focado
  // apenas na simulação ao vivo.
  // ═══════════════════════════════════════════════
  if (step === 1) return (
    <SMR_Halftime
      gameData={gameData}
      matchResultData={matchResultData}
      possession={possession}
      goalEvts={goalEvts}
      yellowEvts={yellowEvts}
      subsDone={subsDone}
      isUserH={isUserH}
      headerJSX={headerJSX}
      subsDialogJSX={subsDialogJSX}
      parseGoal={parseGoal}
      setShowSubs={setShowSubs}
      setSelectedStarter={setSelectedStarter}
      setGameData={setGameData}
      onStart2T={() => {
        setStep(2);
        if (matchControlsRef.current.resumeSecondHalf) matchControlsRef.current.resumeSecondHalf();
      }}
    />
  );

  if (step === 2) return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:1 }}>
      {headerJSX}
      <Box sx={{ px:1.5, pt:1, pb:2 }}>
        {fieldJSX}
        {narrationJSX}
        {benchJSX}
      </Box>

      {/* Barra de ações flutuante no 2T */}
      <Box sx={{
        position:'fixed', bottom:76, left:0, right:0, zIndex:50,
        display:'flex', justifyContent:'center', gap:1, px:1.5,
        pointerEvents:'none',
      }}>
        {/* Botão PAUSAR / RETOMAR */}
        {(simulating || isPaused) ? (
          <Box
            onClick={() => {
              if (isPaused) {
                matchControlsRef.current.resumeMatch?.();
                setIsPaused(false);
              } else {
                matchControlsRef.current.pauseMatch?.();
                setIsPaused(true);
              }
            }}
            sx={{
              pointerEvents:'auto',
              bgcolor: isPaused ? C.green : C.yellow,
              borderRadius:'50px', px:1.6, py:0.85,
              display:'flex', alignItems:'center', gap:0.6,
              boxShadow:`0 4px 16px ${isPaused ? C.green : C.yellow}60`,
              cursor:'pointer', '&:active':{filter:'brightness(0.85)'},
            }}
          >
            <Typography sx={{fontSize:'0.9rem',lineHeight:1}}>
              {isPaused ? '▶' : '⏸'}
            </Typography>
            <Typography sx={{color:'#0f172a',fontWeight:900,fontSize:'0.65rem'}}>
              {isPaused ? 'RETOMAR' : 'PAUSAR'}
            </Typography>
          </Box>
        ) : null}

        {/* Botão SUBSTITUIÇÃO */}
        {subsDone.length < 3 && (
          <Box
            onClick={() => { setShowSubs(true); setSelectedStarter(null); }}
            sx={{
              pointerEvents:'auto',
              bgcolor: C.card,
              border:`1.5px solid ${C.yellow}`,
              borderRadius:'50px', px:1.4, py:0.85,
              display:'flex', alignItems:'center', gap:0.6,
              boxShadow:`0 4px 14px rgba(0,0,0,0.4)`,
              cursor:'pointer', '&:active':{filter:'brightness(1.15)'},
            }}
          >
            <Typography sx={{fontSize:'0.9rem',lineHeight:1}}>🔄</Typography>
            <Typography sx={{color:C.yellow,fontWeight:900,fontSize:'0.65rem'}}>
              SUB ({3-subsDone.length})
            </Typography>
          </Box>
        )}
      </Box>

      {/* Indicador de PAUSADO */}
      {isPaused && (
        <Box sx={{
          position:'fixed', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          bgcolor:'rgba(0,0,0,0.82)', border:`2px solid ${C.yellow}`,
          borderRadius:'14px', px:2.5, py:1.5, zIndex:60,
          textAlign:'center', pointerEvents:'none',
        }}>
          <Typography sx={{fontSize:'1.8rem',lineHeight:1,mb:0.4}}>⏸</Typography>
          <Typography sx={{color:C.yellow,fontWeight:900,fontSize:'0.85rem',letterSpacing:1}}>JOGO PAUSADO</Typography>
          <Typography sx={{color:C.txt3,fontSize:'0.58rem',fontWeight:700,mt:0.3}}>Pressione ▶ para retomar</Typography>
        </Box>
      )}

      {subsDialogJSX}
      {goalOverlayJSX}
      {soundBtnJSX}
      {!simulating && !isPaused && (
        <Box sx={{position:'fixed',bottom:62,left:0,right:0,zIndex:50,px:1.5,pb:1.5,pt:1.5,background:`linear-gradient(transparent 0%,${C.bg} 35%)`,boxShadow:`0 -12px 28px ${C.bg}`}}>
          <Box onClick={()=>{ if(matchControlsRef?.current) matchControlsRef.current.isPaused=false; setStep(5); }} sx={{bgcolor:C.green,borderRadius:'14px',py:1.4,display:'flex',alignItems:'center',justifyContent:'center',gap:1,cursor:'pointer',boxShadow:`0 0 28px ${C.green}50`,'&:active':{filter:'brightness(0.88)'}}}>
            <Typography sx={{fontSize:'1.1rem',lineHeight:1}}>✅</Typography>
            <Typography sx={{color:'#000',fontWeight:900,fontSize:'0.95rem'}}>VER RESUMO DO JOGO</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  // ═══════════════════════════════════════════════
  // STEP 5+ — PÓS-JOGO (Súmula · Finanças · Tabela)
  // Delegado ao ScreenPostMatch para manter este arquivo focado
  // apenas na simulação ao vivo (steps 0–4).
  // ═══════════════════════════════════════════════
  if (step >= 5) return (
    <ScreenPostMatch
      gameData={gameData}
      matchResultData={matchResultData}
      liveScore={liveScore}
      possession={possession}
      subsDone={subsDone}
      roundSummary={roundSummary}
      setScreen={setScreen}
      formatMoney={formatMoney}
      playersBefore={playersBeforeRef.current}
      rawEvents={rawEventsRef.current}
    />
  );

  return null;
};

export default ScreenMatchResult;

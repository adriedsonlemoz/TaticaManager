// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor, FORMATION_SLOTS, canPlayAs } from '../helpers.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';
import { FatigueEngine } from '../engines/engine_fatigue.js';
import { FieldPitchHorizontal } from './FieldView.jsx';

// components/ScreenLineup.js — v6.2 (Corrigido e Completo)
const ScreenLineup = ({
  gameData, setGameData, toggleStarter, changeFormation,
  showToast, updateShirt, saveGame, formatMoney
}) => {
  // ── 1. ESTADOS ──
  const [pickerSlot, setPickerSlot]   = React.useState(null);
  const [shirtEdit, setShirtEdit]     = React.useState(null);
  const [isDirty, setIsDirty]         = React.useState(false);

  // ── 2. DADOS BLINDADOS ──
  const players      = gameData?.players || [];
  const club         = gameData?.club    || {};
  const currentRound = (gameData?.round || 0) + 1; // próxima rodada a jogar

  const starters     = players.filter(p => p.isStarting);
  const benchPlayers = players.filter(p => !p.isStarting);
  const unavailable  = players.filter(p =>
    p.injury || (window.DisciplineEngine
      ? window.DisciplineEngine.isPlayerSuspended(p, currentRound)
      : (p.discipline?.suspendedUntilRound != null && currentRound <= p.discipline.suspendedUntilRound))
  );
  const unavailIds   = new Set(unavailable.map(p => p.id));

  // OVR real: considera penalidade de energia e validade da formação
  const avgOvr = starters.length > 0
    ? Math.round(starters.reduce((s, p) => {
        const energyPenalty = window.FatigueEngine?.getOverallPenalty
          ? window.FatigueEngine.getOverallPenalty(p.energy ?? 100)
          : 0;
        return s + Math.max(30, (p.overall || 0) - energyPenalty);
      }, 0) / starters.length)
    : 0;

  // OVR puro sem penalidade (para comparação)
  const avgOvrPure = starters.length > 0
    ? Math.round(starters.reduce((s, p) => s + (p.overall || 0), 0) / starters.length)
    : 0;
  const energyPenaltyTotal = avgOvrPure - avgOvr;

  const val = window.getLineupValidation
    ? window.getLineupValidation(gameData)
    : { isValid: true, avgStrength: 0, req: {} };

  const posOrder = { GOL:0, ZAG:1, LD:2, LE:3, VOL:4, MC:5, MEI:6, PD:7, PE:8, CA:9,
                     LAT:2, ATA:9 }; // compat saves antigos
  const bench = [...benchPlayers]
    .filter(p => !unavailIds.has(p.id))
    .sort(
      (a, b) =>
        (posOrder[a.position] ?? 9) - (posOrder[b.position] ?? 9) ||
        (b.overall || 0) - (a.overall || 0)
    );

  // ── 3. CORES ──
  const C = THEME;

  // ── 4. HELPERS ──
  const isSuspended = React.useCallback((player) =>
    window.DisciplineEngine
      ? window.DisciplineEngine.isPlayerSuspended(player, currentRound)
      : (player?.discipline?.suspendedUntilRound !== null &&
         currentRound <= player?.discipline?.suspendedUntilRound),
  [currentRound]);

  const isInjured        = (player) => !!player?.injury;
  const getBatteryColor  = (energy) => energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;
  const firstName        = (n) => (n || '').split(' ')[0].substring(0, 9);

  const posColor = window.posColor || ((pos) =>
    pos === 'GOL'                          ? { bg: '#f59e0b', text: '#000' } :
    pos === 'ZAG'                          ? { bg: '#1d4ed8', text: '#fff' } :
    (pos === 'LD' || pos === 'LE')         ? { bg: '#0284c7', text: '#fff' } :
    pos === 'VOL'                          ? { bg: '#14532d', text: '#fff' } :
    pos === 'MC'                           ? { bg: '#15803d', text: '#fff' } :
    pos === 'MEI'                          ? { bg: '#166534', text: '#fff' } :
    (pos === 'PD' || pos === 'PE')         ? { bg: '#9a3412', text: '#fff' } :
    pos === 'CA'                           ? { bg: '#991b1b', text: '#fff' } :
    // compat saves antigos
    (pos === 'LAT')                        ? { bg: '#0284c7', text: '#fff' } :
                                             { bg: '#f85149', text: '#fff' });

  const ovrColor = window.ovrColor || ((o) =>
    o >= 80 ? C.green : o >= 70 ? C.yellow : C.red);

  // ── 5. MAPAS DE FORMAÇÃO (campo horizontal 160×100) ──
  // GOL x≈8 | Defesa x≈32-34 | Meio x≈68-100 | Ataque x≈130-140
  const formationPositions = {
    '4-4-2':   [
      { role:'GOL', x:8,   y:50 },
      { role:'LD',  x:34,  y:10 }, { role:'ZAG', x:34, y:34 },
      { role:'ZAG', x:34,  y:66 }, { role:'LE',  x:34, y:90 },
      { role:'PD',  x:82,  y:14 }, { role:'VOL', x:82, y:40 },
      { role:'VOL', x:82,  y:60 }, { role:'PE',  x:82, y:86 },
      { role:'CA',  x:130, y:34 }, { role:'CA',  x:130,y:66 },
    ],
    '4-3-3':   [
      { role:'GOL', x:8,   y:50 },
      { role:'LD',  x:34,  y:10 }, { role:'ZAG', x:34, y:34 },
      { role:'ZAG', x:34,  y:66 }, { role:'LE',  x:34, y:90 },
      { role:'VOL', x:82,  y:24 }, { role:'MC',  x:82, y:50 }, { role:'MEI', x:82, y:76 },
      { role:'PD',  x:132, y:12 }, { role:'CA',  x:132,y:50 }, { role:'PE',  x:132,y:88 },
    ],
    '4-2-3-1': [
      { role:'GOL', x:8,   y:50 },
      { role:'LD',  x:32,  y:10 }, { role:'ZAG', x:32, y:34 },
      { role:'ZAG', x:32,  y:66 }, { role:'LE',  x:32, y:90 },
      { role:'VOL', x:68,  y:36 }, { role:'VOL', x:68, y:64 },
      { role:'PD',  x:100, y:14 }, { role:'MEI', x:100,y:50 }, { role:'PE',  x:100,y:86 },
      { role:'CA',  x:140, y:50 },
    ],
    '3-5-2':   [
      { role:'GOL', x:8,   y:50 },
      { role:'ZAG', x:34,  y:22 }, { role:'ZAG', x:34, y:50 }, { role:'ZAG', x:34, y:78 },
      { role:'LD',  x:76,  y:6  }, { role:'VOL', x:76, y:30 },
      { role:'MC',  x:76,  y:50 }, { role:'VOL', x:76, y:70 }, { role:'LE',  x:76, y:94 },
      { role:'CA',  x:130, y:34 }, { role:'CA',  x:130,y:66 },
    ],
    '3-4-3':   [
      { role:'GOL', x:8,   y:50 },
      { role:'ZAG', x:34,  y:22 }, { role:'ZAG', x:34, y:50 }, { role:'ZAG', x:34, y:78 },
      { role:'LD',  x:78,  y:10 }, { role:'VOL', x:78, y:38 },
      { role:'VOL', x:78,  y:62 }, { role:'LE',  x:78, y:90 },
      { role:'PD',  x:132, y:14 }, { role:'CA',  x:132,y:50 }, { role:'PE',  x:132,y:86 },
    ],
    '5-3-2':   [
      { role:'GOL', x:8,   y:50 },
      { role:'LD',  x:32,  y:6  }, { role:'ZAG', x:32, y:28 },
      { role:'ZAG', x:32,  y:50 }, { role:'ZAG', x:32, y:72 }, { role:'LE',  x:32, y:94 },
      { role:'VOL', x:82,  y:26 }, { role:'MC',  x:82, y:50 }, { role:'VOL', x:82, y:74 },
      { role:'CA',  x:130, y:34 }, { role:'CA',  x:130,y:66 },
    ],
    '4-1-4-1': [
      { role:'GOL', x:8,   y:50 },
      { role:'LD',  x:32,  y:10 }, { role:'ZAG', x:32, y:34 },
      { role:'ZAG', x:32,  y:66 }, { role:'LE',  x:32, y:90 },
      { role:'VOL', x:62,  y:50 },
      { role:'PD',  x:92,  y:12 }, { role:'MC',  x:92, y:38 },
      { role:'MC',  x:92,  y:62 }, { role:'PE',  x:92, y:88 },
      { role:'CA',  x:140, y:50 },
    ],
    '4-5-1':   [
      { role:'GOL', x:8,   y:50 },
      { role:'LD',  x:32,  y:10 }, { role:'ZAG', x:32, y:34 },
      { role:'ZAG', x:32,  y:66 }, { role:'LE',  x:32, y:90 },
      { role:'PD',  x:82,  y:6  }, { role:'VOL', x:82, y:30 },
      { role:'MC',  x:82,  y:50 }, { role:'VOL', x:82, y:70 }, { role:'PE',  x:82, y:94 },
      { role:'CA',  x:140, y:50 },
    ],
  };

  const formationDesc = {
    '4-4-2':   { icon:'⚖️', atk:0,  def:0,  desc:'Equilibrado'    },
    '4-3-3':   { icon:'⚡', atk:+2, def:-1, desc:'+Ataque'         },
    '4-2-3-1': { icon:'🧠', atk:+1, def:+1, desc:'Controle'        },
    '3-5-2':   { icon:'🎯', atk:+1, def:0,  desc:'+Meio-campo'     },
    '3-4-3':   { icon:'🔥', atk:+3, def:-2, desc:'+++ Ofensivo'    },
    '5-3-2':   { icon:'🛡️', atk:-1, def:+3, desc:'+++ Defensivo'  },
    '4-1-4-1': { icon:'🔒', atk:-2, def:+4, desc:'Ultra-Defensivo' },
    '4-5-1':   { icon:'🏃', atk:0,  def:+2, desc:'Contra-Ataque'   },
  };
  const fInfo = formationDesc[club.formation || '4-4-2'] || {};
  const VW = 160, VH = 100; // campo horizontal viewBox

  // ── 6. AÇÕES ──
  const doChangeFormation = (f) => {
    const newPositions = formationPositions[f];
    if (!newPositions) return;

    setGameData(prev => {
      const currentPlayers  = prev.players || [];
      const currentStarters = currentPlayers.filter(p => p.isStarting);

      // Cópia dos arrays por posição para não mutar estado
      const pool = {};
      currentStarters.forEach(p => {
        if (!pool[p.position]) pool[p.position] = [];
        pool[p.position].push({ ...p });
      });

      const assignedIds = new Set();
      newPositions.forEach(slot => {
        const arr = pool[slot.role];
        if (arr && arr.length > 0) assignedIds.add(arr.shift().id);
      });

      const unassigned  = currentStarters
        .filter(p => !assignedIds.has(p.id))
        .sort((a, b) => (b.overall || 0) - (a.overall || 0));
      const slotsNeeded = newPositions.length - assignedIds.size;
      unassigned.slice(0, slotsNeeded).forEach(p => assignedIds.add(p.id));

      return {
        ...prev,
        club:    { ...prev.club, formation: f },
        players: currentPlayers.map(p => ({ ...p, isStarting: assignedIds.has(p.id) })),
      };
    });

    setIsDirty(true);
  };

  const doSaveGame = () => { saveGame(); setIsDirty(false); };

  const handleAutoLineup = () => {
    const formation = club.formation || "4-4-2";
    const pos       = formationPositions[formation];
    const needed    = {};
    pos.forEach(slot => { needed[slot.role] = (needed[slot.role] || 0) + 1; });

    // CORREÇÃO #3 — captura o tamanho real dentro do updater via closure
    let resultSize = 0;

    setGameData(prev => {
      const currentPlayers = prev.players || [];
      const available      = currentPlayers.filter(p => !isInjured(p) && !isSuspended(p));
      const sorted         = [...available].sort((a, b) => (b.overall || 0) - (a.overall || 0));

      const starterIds = new Set();

      Object.entries(needed).forEach(([role, count]) => {
        let picked = 0;
        for (let i = 0; i < sorted.length && picked < count; i++) {
          if (sorted[i].position === role && !starterIds.has(sorted[i].id)) {
            starterIds.add(sorted[i].id);
            picked++;
          }
        }
      });

      for (let i = 0; i < sorted.length && starterIds.size < pos.length; i++) {
        if (!starterIds.has(sorted[i].id)) starterIds.add(sorted[i].id);
      }

      resultSize = starterIds.size;
      return {
        ...prev,
        players: currentPlayers.map(p => ({ ...p, isStarting: starterIds.has(p.id) })),
      };
    });

    setIsDirty(true);

    // Toast no próximo tick, após o batch do React
    setTimeout(() => {
      if (resultSize > 0 && resultSize < 11)
        showToast('⚠️ Faltam jogadores saudáveis! Escalando com improviso.', 'warning');
      else
        showToast('Escalação automática aplicada! ✅', 'success');
    }, 0);
  };

  const handleSlotClick = (slot, player) => {
    if (shirtEdit) { setShirtEdit(null); return; }
    if (player)    doToggleStarter(player);
    else           setPickerSlot(slot);
  };

  const handlePickerSelect = (p, isAdapted = false) => {
    const formation     = club.formation || '4-4-2';
    const slots         = formationPositions[formation] || [];
    const slotRole      = pickerSlot?.role;
    const roleCount     = slots.filter(s => s.role === slotRole).length;
    const currentInRole = starters.filter(s => (s.adaptedPosition || s.position) === slotRole).length;
    if (currentInRole >= roleCount) {
      showToast(`Posição ${slotRole} já está completa nessa formação!`, 'warning');
      return;
    }
    if (isAdapted && slotRole && p.position !== slotRole) {
      // Salva adaptedPosition no jogador antes de escalá-lo
      setGameData(prev => ({
        ...prev,
        players: prev.players.map(x =>
          x.id === p.id ? { ...x, isStarting: true, adaptedPosition: slotRole } : x
        ),
      }));
      setIsDirty(true);
    } else {
      doToggleStarter({ ...p, adaptedPosition: null });
    }
    setPickerSlot(null);
  };

  const pressTimer  = React.useRef(null);
  const handleLongPress = (player) => {
    if (!player) return;
    setShirtEdit({ playerId: player.id, value: String(player.shirt ?? '') });
    setPickerSlot(null);
  };
  const startPress = (player) => {
    if (!player) return;
    pressTimer.current = setTimeout(() => handleLongPress(player), 500);
  };
  const endPress = () => clearTimeout(pressTimer.current);

  const saveShirt = () => {
    if (!shirtEdit) return;
    updateShirt(shirtEdit.playerId, shirtEdit.value);
    setShirtEdit(null);
  };

  // ── CORREÇÃO #6 — cópia defensiva do posMap para evitar mutação ──
  const positions = formationPositions[club.formation || "4-4-2"];
  const posMap    = { GOL:[], ZAG:[], LD:[], LE:[], VOL:[], MC:[], MEI:[], PD:[], PE:[], CA:[],
                      LAT:[], ATA:[] }; // compat saves antigos
  // Usa adaptedPosition para preencher o slot correto no campo
  starters.forEach(p => {
    const effectivePos = p.adaptedPosition || p.position;
    if (posMap[effectivePos]) posMap[effectivePos].push(p);
    else if (posMap[p.position]) posMap[p.position].push(p); // fallback
  });

  // Clona os arrays antes de usar .shift() para não mutar o posMap original
  const posMapCopy = Object.fromEntries(
    Object.entries(posMap).map(([k, v]) => [k, [...v]])
  );
  const slotPlayers = positions.map((slot, idx) => ({
    slot,
    idx,
    player: posMapCopy[slot.role]?.length > 0 ? posMapCopy[slot.role].shift() : null,
  }));

  // ── CORREÇÃO #2 — ghost starters com ref estável para evitar loop ──
  const prevGhostKeyRef = React.useRef('');
  const ghostStarters   = starters.filter(p => slotPlayers.every(sp => sp.player?.id !== p.id));
  const ghostKey        = ghostStarters.map(g => g.id).sort().join(',');

  React.useEffect(() => {
    if (!ghostKey || ghostKey === prevGhostKeyRef.current) return;
    prevGhostKeyRef.current = ghostKey;
    const ghostIds = new Set(ghostKey.split(','));
    setGameData(prev => ({
      ...prev,
      players: prev.players.map(p => ghostIds.has(p.id) ? { ...p, isStarting: false } : p),
    }));
  }, [ghostKey, setGameData]);

  // Retorna jogadores do banco para uma posição: exatos e compatíveis (com penalidade)
  const getAvailable = (role) => {
    const exact    = bench.filter(p => !p.adaptedPosition && p.position === role);
    const adapted  = bench.filter(p => p.position !== role && canPlayAs(p.position, role));
    return { exact, adapted, all: [...exact, ...adapted] };
  };

  const doToggleStarter = (p) => {
    // Ao mandar para o banco, limpa adaptedPosition
    if (p.isStarting && p.adaptedPosition) {
      setGameData(prev => ({
        ...prev,
        players: prev.players.map(x => x.id === p.id ? { ...x, isStarting: false, adaptedPosition: null } : x),
      }));
      setIsDirty(true);
      return;
    }
    toggleStarter(p);
    setIsDirty(true);
  };
  // ── renderPlayerCard para banco/unavailable/picker ───────
  // isAdapted: quando o jogador aparece no picker como compatível (não é posição nativa)
  const renderPlayerCard = React.useCallback((p, isModalPicker = false, isAdapted = false) => {
    const susp    = isSuspended(p);
    const inj     = isInjured(p);
    const blocked = susp || inj;
    const energy  = p.energy ?? 100;
    const yellows = p.discipline?.yellowCards || 0;
    const showAdaptedBadge = isAdapted || (p.adaptedPosition && p.adaptedPosition !== p.position);
    return (
      <Box key={p.id}
        onClick={() => { if (!blocked) { if (isModalPicker) handlePickerSelect(p, isAdapted); else doToggleStarter(p); } }}
        sx={{
          display:'flex', alignItems:'center', gap:1.2,
          bgcolor: blocked ? `${C.red}05` : p.isStarting ? `${C.green}05` : C.card,
          border: `1.5px solid ${blocked ? C.red+'40' : p.isStarting ? C.borderG : isAdapted ? '#f59e0b60' : C.border}`,
          borderRadius:'12px', px:1.2, py:0.9, mb:0.7,
          cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.65 : 1,
          transition:'all 0.12s', '&:active': { transform: blocked ? 'none' : 'scale(0.98)' },
        }}
      >
        {window.JerseyBadge
          ? React.createElement(window.JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 40 })
          : <Box sx={{ width:40, height:40, flexShrink:0 }}/>
        }
        <Box sx={{ flex:1, minWidth:0 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.25 }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color: blocked ? C.red : C.txt1,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {p.name}
            </Typography>
            {inj  && <Typography sx={{ fontSize:'0.7rem' }}>🚑</Typography>}
            {susp && <Typography sx={{ fontSize:'0.7rem' }}>🟥</Typography>}
            {p.isStarting && !blocked && !isModalPicker && (
              <Box sx={{ bgcolor:`${C.green}15`, border:`1px solid ${C.green}40`,
                borderRadius:'4px', px:0.5, py:0.1, flexShrink:0 }}>
                <Typography sx={{ color:C.green, fontSize:'0.44rem', fontWeight:900 }}>
                  {p.adaptedPosition && p.adaptedPosition !== p.position ? `ADAPTADO (${p.adaptedPosition})` : 'TITULAR'}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
            <Box sx={{ flex:1, height:4, bgcolor:C.border, borderRadius:2, overflow:'hidden', maxWidth:80 }}>
              <Box sx={{ height:'100%', width:`${energy}%`, bgcolor:getBatteryColor(energy) }}/>
            </Box>
            <Typography sx={{ fontSize:'0.5rem', fontWeight:900, color:getBatteryColor(energy), minWidth:26 }}>
              {energy}%
            </Typography>
            {yellows > 0 && !susp && (
              <Box sx={{ display:'flex', gap:'2px' }}>
                {Array.from({ length: Math.min(yellows,3) }).map((_,i2) => (
                  <Box key={i2} sx={{ width:5, height:8, bgcolor:C.yellow, borderRadius:'1px' }}/>
                ))}
              </Box>
            )}
          </Box>
          {inj  && <Typography sx={{ color:C.red, fontSize:'0.48rem', fontWeight:700, mt:0.2 }}>🚑 Lesionado · {p.injury.roundsLeft} rod.</Typography>}
          {susp && <Typography sx={{ color:C.red, fontSize:'0.48rem', fontWeight:700, mt:0.2 }}>🟥 Suspenso</Typography>}
          {showAdaptedBadge && !inj && !susp && (
            <Typography sx={{ color:'#f59e0b', fontSize:'0.44rem', fontWeight:900, mt:0.2 }}>
              ⚠️ ADAPTADO ({p.position} → {isAdapted ? pickerSlot?.role : p.adaptedPosition}) · -10 OVR
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:0.4 }}>
          <Box sx={{ bgcolor:ovrColor(p.overall), borderRadius:'6px', px:0.9, py:0.2, boxShadow:`0 2px 6px ${ovrColor(p.overall)}40` }}>
            <Typography sx={{ fontWeight:900, fontSize:'0.82rem', color:'#fff' }}>{p.overall}</Typography>
          </Box>
          {!blocked && (
            <Typography sx={{ fontSize:'0.5rem', fontWeight:900,
              color: isModalPicker ? (isAdapted ? '#f59e0b' : C.green) : p.isStarting ? C.red : C.teal }}>
              {isModalPicker ? (isAdapted ? '⚠️ ADAPTAR' : '✅ ESCALAR') : p.isStarting ? '↓ BANCO' : '↑ TITULAR'}
            </Typography>
          )}
          {inj && <Typography sx={{ color:C.red, fontSize:'0.5rem', fontWeight:900 }}>{p.injury.roundsLeft} rod.</Typography>}
        </Box>
      </Box>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starters, bench, isSuspended, pickerSlot]);

  // ── 8. RENDER ────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 12 }}>

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <Box sx={{
        background: 'linear-gradient(180deg,#fff 0%,#f4f7f6 100%)',
        borderBottom: `1px solid ${C.border}`,
        px: 1.5, pt: 4.2, pb: 1.4,
      }}>
        {/* Clube + OVR */}
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.4 }}>
          <Box>
            <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2, mb:0.3 }}>ESCALAÇÃO</Typography>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.1rem', lineHeight:1 }}>{club.name || 'Meu Time'}</Typography>
            <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700, mt:0.2 }}>{club.formation || '4-4-2'} · Rod. {currentRound}</Typography>
          </Box>
          <Box sx={{ textAlign:'center' }}>
            <Box sx={{ background:`linear-gradient(135deg,${ovrColor(avgOvr)},${ovrColor(avgOvr)}bb)`, borderRadius:'14px', px:1.6, py:0.8, mb:0.35, boxShadow:`0 0 20px ${ovrColor(avgOvr)}40` }}>
              <Typography sx={{ fontWeight:900, fontSize:'1.6rem', color:'#fff', lineHeight:1 }}>{avgOvr||'—'}</Typography>
              <Typography sx={{ fontSize:'0.42rem', color:'rgba(255,255,255,0.7)', fontWeight:900, letterSpacing:1 }}>OVR REAL</Typography>
            </Box>
            <Box sx={{ display:'flex', gap:0.4, justifyContent:'center' }}>
              <Box sx={{ bgcolor:starters.length===11?`${C.green}15`:`${C.red}15`, border:`1px solid ${starters.length===11?C.green+'50':C.red+'50'}`, borderRadius:'6px', px:0.7, py:0.15 }}>
                <Typography sx={{ color:starters.length===11?C.green:C.red, fontWeight:900, fontSize:'0.5rem' }}>{starters.length}/11 {starters.length===11?'✅':'⚠️'}</Typography>
              </Box>
              {energyPenaltyTotal > 0 && (
                <Box sx={{ bgcolor:`${C.red}10`, border:`1px solid ${C.red}35`, borderRadius:'6px', px:0.7, py:0.15 }}>
                  <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.5rem' }}>⚡-{energyPenaltyTotal}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Formações */}
        <Box sx={{ mb:1.2 }}>
          <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5, mb:0.6 }}>FORMAÇÃO</Typography>
          <Box sx={{ display:'flex', gap:0.6, overflowX:'auto', '&::-webkit-scrollbar':{display:'none'} }}>
            {Object.entries(formationDesc).map(([f, info]) => {
              const active = (club.formation||'4-4-2') === f;
              return (
                <Box key={f} onClick={() => doChangeFormation(f)} sx={{
                  flexShrink:0, px:1.1, py:0.65, borderRadius:'9px', cursor:'pointer',
                  bgcolor: active ? C.primary : '#f1f5f9',
                  border: `1.5px solid ${active ? C.primary : C.border}`,
                  boxShadow: active ? `0 0 14px ${C.primary}40` : 'none',
                  transition:'all 0.12s', '&:active':{ filter:'brightness(0.88)' },
                }}>
                  <Typography sx={{ color:active?'#fff':C.txt3, fontWeight:900, fontSize:'0.75rem', lineHeight:1 }}>{info.icon} {f}</Typography>
                </Box>
              );
            })}
          </Box>
          {fInfo.desc && (
            <Box sx={{ display:'flex', gap:0.8, mt:0.7, alignItems:'center' }}>
              <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>{fInfo.desc}</Typography>
              {fInfo.atk !== 0 && <Box sx={{ bgcolor:fInfo.atk>0?`${C.red}15`:`${C.blue}15`, border:`1px solid ${fInfo.atk>0?C.red:C.blue}40`, borderRadius:'5px', px:0.6, py:0.1 }}><Typography sx={{ color:fInfo.atk>0?C.red:C.blue, fontWeight:900, fontSize:'0.5rem' }}>⚔️{fInfo.atk>0?'+':''}{fInfo.atk}</Typography></Box>}
              {fInfo.def !== 0 && <Box sx={{ bgcolor:fInfo.def>0?`${C.blue}15`:`${C.red}15`, border:`1px solid ${fInfo.def>0?C.blue:C.red}40`, borderRadius:'5px', px:0.6, py:0.1 }}><Typography sx={{ color:fInfo.def>0?C.blue:C.red, fontWeight:900, fontSize:'0.5rem' }}>🛡️{fInfo.def>0?'+':''}{fInfo.def}</Typography></Box>}
            </Box>
          )}
        </Box>

        {/* AUTO-ESCALAR + SALVAR */}
        <Box sx={{ display:'flex', gap:0.8 }}>
          <Box onClick={handleAutoLineup} sx={{ flex:1, borderRadius:'10px', py:1, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', gap:0.7, cursor:'pointer', boxShadow:'0 0 16px rgba(99,102,241,0.35)', '&:active':{ filter:'brightness(0.85)' } }}>
            <Typography sx={{ fontSize:'0.95rem', lineHeight:1 }}>🤖</Typography>
            <Box>
              <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.72rem', lineHeight:1 }}>AUTO-ESCALAR</Typography>
              <Typography sx={{ color:'rgba(255,255,255,0.6)', fontSize:'0.44rem', fontWeight:700 }}>melhor time disponível</Typography>
            </Box>
          </Box>
          <Box onClick={doSaveGame} sx={{ flex:1, borderRadius:'10px', py:1, bgcolor:isDirty?C.gold:C.cardAlt, border:`1.5px solid ${isDirty?C.gold:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', gap:0.6, cursor:'pointer', boxShadow:isDirty?`0 0 14px ${C.gold}40`:'none', '&:active':{ filter:'brightness(0.88)' } }}>
            <Typography sx={{ fontSize:'0.9rem', lineHeight:1 }}>{isDirty?'⚠️':'💾'}</Typography>
            <Typography sx={{ color:isDirty?'#fff':C.txt2, fontWeight:900, fontSize:'0.68rem', lineHeight:1 }}>{isDirty?'SALVAR':'SALVO'}</Typography>
          </Box>
        </Box>
      </Box>

      {/* ══ CAMPO HORIZONTAL ════════════════════════════════ */}
      <Box sx={{ px:1.5, pt:1.4 }}>
        <Box sx={{ position:'relative', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.18)' }}>
          <FieldPitchHorizontal VW={VW} VH={VH} />
          {/* Camisas */}
          <Box sx={{ position:'absolute', inset:0 }}>
            {slotPlayers.map(({ slot, player }, i) => {
              const JB = window.JerseyBadge;
              if (!player) return (
                <Box key={`e${i}`} onClick={() => setPickerSlot({ role: slot.role })} sx={{ position:'absolute', left:`${(slot.x/VW)*100}%`, top:`${(slot.y/VH)*100}%`, transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', cursor:'pointer' }}>
                  <Box sx={{ width:22, height:22, borderRadius:'5px', border:'1.5px dashed rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', '&:active':{ bgcolor:'rgba(255,255,255,0.1)' } }}>
                    <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem', lineHeight:1 }}>+</Typography>
                  </Box>
                  <Box sx={{ bgcolor:'rgba(0,0,0,0.5)', borderRadius:'3px', px:'3px', py:'1px' }}>
                    <Typography sx={{ color:'rgba(255,255,255,0.5)', fontSize:'0.42rem', fontWeight:900 }}>{slot.role}</Typography>
                  </Box>
                </Box>
              );
              const energy = player.energy ?? 100;
              return (
                <Box key={`d${i}`}
                  onClick={() => doToggleStarter(player)}
                  onMouseDown={() => startPress(player)} onMouseUp={endPress}
                  onTouchStart={() => startPress(player)} onTouchEnd={endPress}
                  sx={{ position:'absolute', left:`${(slot.x/VW)*100}%`, top:`${(slot.y/VH)*100}%`, transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'1px', cursor:'pointer', zIndex:1, '&:active':{ transform:'translate(-50%,-50%) scale(0.9)' } }}
                >
                  <Box sx={{ position:'relative' }}>
                    {JB && React.createElement(JB, { pos: player.position, num: player.shirt ?? '?', size: 22 })}
                    <Box sx={{ position:'absolute', bottom:-2, left:'5%', width:'90%', height:'2.5px', bgcolor:'rgba(0,0,0,0.4)', borderRadius:1, overflow:'hidden' }}>
                      <Box sx={{ height:'100%', width:`${energy}%`, bgcolor:getBatteryColor(energy), borderRadius:1 }}/>
                    </Box>
                    {(isInjured(player)||isSuspended(player)) && (
                      <Box sx={{ position:'absolute', top:-3, right:-4, width:10, height:10, borderRadius:'50%', bgcolor:isInjured(player)?C.red:C.yellow, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.5)', fontSize:'0.3rem' }}>
                        {isInjured(player)?'🚑':'🟥'}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ bgcolor:'rgba(0,0,0,0.65)', borderRadius:'3px', px:'3px', py:'1.5px', backdropFilter:'blur(2px)' }}>
                    <Typography sx={{ color:'#fff', fontSize:'0.38rem', fontWeight:900, whiteSpace:'nowrap', lineHeight:1 }}>
                      {player.name.split(' ').pop().slice(0, 7)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* ══ LISTA ROLÁVEL ════════════════════════════════════ */}
      <Box sx={{ px:1.5, pt:0.5, maxHeight:340, overflowY:'auto', '&::-webkit-scrollbar':{ width:'3px' }, '&::-webkit-scrollbar-thumb':{ bgcolor:C.border, borderRadius:2 } }}>
        {bench.length > 0 && (
          <>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1.4, mb:0.9 }}>
              <Box sx={{ height:'1px', flex:1, bgcolor:C.border }}/>
              <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5 }}>BANCO ({bench.length})</Typography>
              <Box sx={{ height:'1px', flex:1, bgcolor:C.border }}/>
            </Box>
            {bench.map(p => renderPlayerCard(p))}
          </>
        )}
        {unavailable.length > 0 && (
          <>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1.4, mb:0.9 }}>
              <Box sx={{ height:'1px', flex:1, bgcolor:`${C.red}35` }}/>
              <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5 }}>INDISPONÍVEIS ({unavailable.length})</Typography>
              <Box sx={{ height:'1px', flex:1, bgcolor:`${C.red}35` }}/>
            </Box>
            {unavailable.map(p => renderPlayerCard(p))}
          </>
        )}
        <Box sx={{ height:80 }}/>
      </Box>

      {/* Fade */}
      <Box sx={{ position:'sticky', bottom:62, left:0, right:0, height:32, background:`linear-gradient(transparent,${C.bg}F2)`, pointerEvents:'none' }}/>

      {/* ══ EDIÇÃO CAMISA ════════════════════════════════════ */}
      {shirtEdit && (
        <Box sx={{ position:'fixed', bottom:70, left:14, right:14, zIndex:200, bgcolor:C.card, border:`1.5px solid ${C.green}`, borderRadius:'14px', p:1.5, boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
          <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.8rem', mb:1 }}>✏️ Número da camisa</Typography>
          <Box sx={{ display:'flex', gap:0.8 }}>
            <input type="number" value={shirtEdit.value} min="1" max="99"
              onChange={e => setShirtEdit(prev => ({ ...prev, value: e.target.value }))}
              style={{ flex:1, padding:'8px 12px', borderRadius:'8px', border:`1.5px solid ${C.border}`, fontSize:'1rem', fontWeight:900, color:C.txt1, background:C.bg, outline:'none' }}/>
            <Button variant="contained" onClick={saveShirt} sx={{ bgcolor:C.green, color:'#fff', fontWeight:900, px:2, borderRadius:'8px', '&:hover':{ bgcolor:'#15803d' } }}>✔</Button>
            <Button variant="outlined" onClick={() => setShirtEdit(null)} sx={{ borderColor:C.border, color:C.txt2, fontWeight:900, px:1.5, borderRadius:'8px' }}>✕</Button>
          </Box>
        </Box>
      )}

      {/* ══ PICKER DIALOG ════════════════════════════════════ */}
      <Dialog open={Boolean(pickerSlot)} onClose={() => setPickerSlot(null)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.primary}60`, boxShadow:'0 10px 40px rgba(0,0,0,0.2)', maxHeight:'80vh', backgroundImage:'none', m:1.5 } }}
        BackdropProps={{ sx:{ backdropFilter:'blur(3px)', bgcolor:'rgba(0,0,0,0.35)' } }}
      >
        <Box sx={{ px:2, py:1.4, bgcolor:C.primary, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.85rem', letterSpacing:1 }}>ESCALAR: {pickerSlot?.role}</Typography>
          <Typography onClick={() => setPickerSlot(null)} sx={{ color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'1.3rem', lineHeight:1, fontWeight:900 }}>✕</Typography>
        </Box>
        <Box sx={{ p:1.5, overflowY:'auto' }}>
          {(() => {
            const avail = getAvailable(pickerSlot?.role);
            if (avail.all.length === 0) return (
              <Box sx={{ textAlign:'center', py:5 }}>
                <Typography sx={{ fontSize:'2.5rem', mb:1 }}>🪑</Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.8rem', fontStyle:'italic', fontWeight:700 }}>Nenhum jogador disponível para {pickerSlot?.role}.</Typography>
              </Box>
            );
            return (
              <>
                {avail.exact.length > 0 && (
                  <>
                    <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:900, letterSpacing:0.5, mb:1 }}>POSIÇÃO EXATA ({avail.exact.length})</Typography>
                    {avail.exact.map(p => renderPlayerCard(p, true, false))}
                  </>
                )}
                {avail.adapted.length > 0 && (
                  <>
                    <Typography sx={{ color:'#f59e0b', fontSize:'0.58rem', fontWeight:900, letterSpacing:0.5, mb:1, mt: avail.exact.length > 0 ? 1.5 : 0 }}>⚠️ COMPATÍVEIS — -10 OVR ({avail.adapted.length})</Typography>
                    {avail.adapted.map(p => renderPlayerCard(p, true, true))}
                  </>
                )}
              </>
            );
          })()}
        </Box>
      </Dialog>

    </Box>
  );
};

export default ScreenLineup;

// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { AcademyEngine } from '../engines/engine_academy.js';

// components/ScreenAcademy.js — v3.0 (Redesign completo)
const ScreenAcademy = ({ gameData, setGameData, setScreen, showToast, formatMoney }) => {
  const C   = THEME;
  const AE  = window.AcademyEngine;

  const [tab,            setTab]            = React.useState('squad');   // squad | invest | history
  const [selectedP,      setSelectedP]      = React.useState(null);
  const [confirmPromote, setConfirmPromote] = React.useState(null);
  const [confirmDispense,setConfirmDispense]= React.useState(null);
  const [filter,         setFilter]         = React.useState('all');     // all | ready | burst | steady | late

  const academy      = gameData.academy || [];
  const academyLevel = gameData.club?.academyLevel || 'basic';
  const levelInfo    = AE?.LEVELS?.[academyLevel] || { label:'Básica', cost:500000, desc:'' };
  const PROMOTE_AGE  = AE?.PROMOTE_AGE || 18;
  const readyCount   = academy.filter(p => (p.age||0) >= PROMOTE_AGE).length;
  const avgOvr       = academy.length > 0 ? Math.round(academy.reduce((s,p)=>s+(p.overall||0),0)/academy.length) : 0;
  const avgPot       = academy.length > 0 ? Math.round(academy.reduce((s,p)=>s+(p.potential||0),0)/academy.length) : 0;
  const totalValue   = academy.reduce((s,p)=>s+(p.value||0),0);

  const LEVEL_COLORS = { basic:'#64748b', advanced:'#3b82f6', elite:'#f59e0b' };
  const LEVEL_ICONS  = { basic:'🏫', advanced:'🏟️', elite:'⭐' };
  const TRAJ = {
    burst:  { label:'🚀 Explosivo', color:'#ef4444', desc:'Evolui rápido jovem' },
    steady: { label:'📈 Constante', color:'#22c55e', desc:'Progresso equilibrado' },
    late:   { label:'⏳ Revelação', color:'#3b82f6', desc:'Floresceu mais tarde' },
  };
  const posColor = (pos) => ({
    GOL:'#b45309', ZAG:'#1d4ed8',
    LD:'#0369a1',  LE:'#0369a1',
    VOL:'#15803d', MC:'#16a34a', MEI:'#166534',
    PD:'#9a3412',  PE:'#9a3412', CA:'#b91c1c',
    // compat saves antigos
    LAT:'#0369a1', ATA:'#b91c1c',
  }[pos] || '#555');

  const handlePromote = (p) => {
    if (!AE) return;
    const pro = AE.promoteProspect(p, gameData.club.name);
    setGameData(prev => ({
      ...prev,
      players: [...prev.players, pro],
      academy: (prev.academy||[]).filter(x => x.id !== p.id),
    }));
    showToast(`🌟 ${p.name} promovido ao profissional!`, 'success');
    setConfirmPromote(null); setSelectedP(null);
  };

  const handleDispense = (p) => {
    setGameData(prev => ({ ...prev, academy: (prev.academy||[]).filter(x => x.id !== p.id) }));
    showToast(`${p.name} dispensado da base.`, 'info');
    setConfirmDispense(null); setSelectedP(null);
  };

  const handleInvest = (level) => {
    if (!AE) return;
    const result = AE.investAcademy(gameData, level);
    if (result.error) { showToast(result.error, 'error'); return; }
    setGameData(prev => ({
      ...prev,
      club: { ...prev.club, money: prev.club.money - result.cost, academyLevel: result.newLevel },
      financialHistory: [{ round: prev.round, income:0, expense: result.cost, total: -result.cost,
        detail: { description: `Investimento: Academia (${AE.LEVELS[level].label})` } },
        ...(prev.financialHistory||[])].slice(0,50),
    }));
    showToast(`✅ Academia atualizada: ${AE.LEVELS[level].label}!`, 'success');
    setTab('squad');
  };

  React.useEffect(() => {
    if (!gameData.academy && AE?.initUserAcademy) {
      setGameData(prev => ({ ...prev, academy: AE.initUserAcademy(prev.club.name, 'user', academyLevel) }));
    }
  }, []);

  const filteredAcademy = academy.filter(p => {
    if (filter === 'ready')  return (p.age||0) >= PROMOTE_AGE;
    if (filter === 'burst')  return p.trajectory === 'burst';
    if (filter === 'steady') return p.trajectory === 'steady';
    if (filter === 'late')   return p.trajectory === 'late';
    return true;
  });

  // ── Nível da Academia (0-100) baseado em nível + rodadas jogadas
  const academyPrestige = { basic:20, advanced:55, elite:90 }[academyLevel] || 20;

  const levelColor = LEVEL_COLORS[academyLevel] || C.txt3;
  const fmt = v => formatMoney ? formatMoney(v) : `R$${(v/1e6).toFixed(1)}M`;

  // ── Prospect Card ─────────────────────────────────────────
  const ProspectCard = ({ p }) => {
    const isReady  = (p.age||0) >= PROMOTE_AGE;
    const isOpen   = selectedP?.id === p.id;
    const gap      = Math.max(0, (p.potential||70) - (p.overall||50));
    const pctDev   = Math.round(((p.overall||50) - 40) / Math.max(1, (p.potential||70) - 40) * 100);
    const traj     = TRAJ[p.trajectory||'steady'];
    const JB       = window.JerseyBadge;

    return (
      <Box onClick={() => setSelectedP(isOpen ? null : p)} sx={{
        bgcolor: isOpen ? (isReady?`${C.green}10`:'rgba(124,58,237,0.07)') : C.card,
        border: `1.5px solid ${isOpen ? (isReady?C.green:'#7c3aed') : C.border}`,
        borderRadius:'14px', overflow:'hidden', mb:1,
        cursor:'pointer', transition:'all 0.15s',
        boxShadow: isOpen ? `0 0 16px ${isReady?C.green:'#7c3aed'}25` : 'none',
        '&:active':{ transform:'scale(0.985)' },
      }}>
        <Box sx={{ px:1.3, py:1, display:'flex', alignItems:'center', gap:1 }}>
          {/* Chip de posição */}
          {JB
            ? React.createElement(JB, { pos:p.position, num:p.shirt??'?', size:44, showPos:true })
            : <Box sx={{ width:44, height:44, borderRadius:'50%', bgcolor:posColor(p.position), flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.6rem' }}>{p.position}</Typography>
              </Box>
          }

          {/* Info central */}
          <Box sx={{ flex:1, minWidth:0 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mb:0.2 }}>
              <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:C.txt1, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                {p.name}
              </Typography>
              {isReady && (
                <Box sx={{ bgcolor:`${C.green}20`, border:`1px solid ${C.green}50`, borderRadius:'4px', px:0.5, flexShrink:0 }}>
                  <Typography sx={{ color:C.green, fontSize:'0.42rem', fontWeight:900 }}>PRONTO</Typography>
                </Box>
              )}
              <Box sx={{ bgcolor:`${traj.color}18`, border:`1px solid ${traj.color}40`, borderRadius:'4px', px:0.5, flexShrink:0 }}>
                <Typography sx={{ color:traj.color, fontSize:'0.42rem', fontWeight:900 }}>{p.trajectory?.toUpperCase()||'—'}</Typography>
              </Box>
            </Box>
            <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>
              {p.age} anos · Ano {p.academyYear||1} · {p.formerClub?`🏫 ${p.formerClub}`:''}
            </Typography>
            {/* Barra de desenvolvimento */}
            <Box sx={{ mt:0.4, display:'flex', alignItems:'center', gap:0.6 }}>
              <Box sx={{ flex:1, height:4, bgcolor:C.border, borderRadius:2, overflow:'hidden', maxWidth:100 }}>
                <Box sx={{ height:'100%', width:`${pctDev}%`, bgcolor:'#7c3aed', borderRadius:2, transition:'width 0.5s' }}/>
              </Box>
              <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700 }}>{pctDev}%</Typography>
            </Box>
          </Box>

          {/* OVR/Pot */}
          <Box sx={{ textAlign:'center', flexShrink:0 }}>
            <Box sx={{ bgcolor:'#7c3aed', borderRadius:'8px', px:0.9, py:0.3, mb:0.25 }}>
              <Typography sx={{ fontWeight:900, fontSize:'0.85rem', color:'#fff', lineHeight:1 }}>{p.overall}</Typography>
            </Box>
            <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700 }}>→ {p.potential}</Typography>
            {gap > 0 && <Typography sx={{ color:'#7c3aed', fontSize:'0.46rem', fontWeight:900 }}>+{gap}</Typography>}
          </Box>
        </Box>

        {/* Expanded */}
        {isOpen && (
          <Box sx={{ px:1.3, pb:1.2, pt:0.5, borderTop:`1px solid ${C.border}` }}>
            <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0.5, mb:1 }}>
              {[
                { l:'TRAJETÓRIA', v:traj.label, c:traj.color },
                { l:'MARGEM',     v:`+${gap}`,   c:'#7c3aed' },
                { l:'VALOR',      v:fmt(p.value||50000), c:C.green },
                { l:'SALÁRIO',    v:`${fmt(Math.max(3000,Math.round((p.value||50000)*0.012/1000)*1000))}/R`, c:C.red },
              ].map((s,i) => (
                <Box key={i} sx={{ bgcolor:C.cardAlt, borderRadius:'7px', p:0.6, textAlign:'center', border:`1px solid ${C.border}` }}>
                  <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.62rem', lineHeight:1.2 }}>{s.v}</Typography>
                  <Typography sx={{ color:C.txt3, fontSize:'0.42rem', fontWeight:700, mt:0.2 }}>{s.l}</Typography>
                </Box>
              ))}
            </Box>

            {/* Projeção de desenvolvimento */}
            <Box sx={{ bgcolor:C.cardAlt, borderRadius:'8px', p:0.9, mb:0.9, border:`1px solid ${C.border}` }}>
              <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:0.8, mb:0.5 }}>PROJEÇÃO DE DESENVOLVIMENTO</Typography>
              <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                <Typography sx={{ color:'#7c3aed', fontWeight:900, fontSize:'0.72rem', minWidth:28 }}>{p.overall}</Typography>
                <Box sx={{ flex:1, position:'relative', height:8 }}>
                  <Box sx={{ position:'absolute', inset:0, bgcolor:C.border, borderRadius:4, overflow:'hidden' }}>
                    <Box sx={{ height:'100%', width:`${Math.round((p.overall-40)/Math.max(1,p.potential-40)*100)}%`, bgcolor:'#7c3aed', borderRadius:4 }}/>
                  </Box>
                </Box>
                <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.72rem', minWidth:28 }}>{p.potential}</Typography>
              </Box>
              <Box sx={{ display:'flex', justifyContent:'space-between', mt:0.3 }}>
                <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700 }}>OVR atual</Typography>
                <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700 }}>Potencial máximo</Typography>
              </Box>
              <Box sx={{ mt:0.5, bgcolor:`${traj.color}10`, borderRadius:'5px', px:0.7, py:0.35 }}>
                <Typography sx={{ color:traj.color, fontSize:'0.52rem', fontWeight:700 }}>{traj.label} — {traj.desc}</Typography>
              </Box>
            </Box>

            <Box sx={{ display:'flex', gap:0.7 }}>
              <Box onClick={e=>{e.stopPropagation(); setConfirmDispense(p);}} sx={{
                flex:1, border:`1.5px solid ${C.red}50`, borderRadius:'9px', py:0.8,
                textAlign:'center', cursor:'pointer', '&:active':{bgcolor:`${C.red}08`},
              }}>
                <Typography sx={{ color:C.red, fontWeight:900, fontSize:'0.7rem' }}>✗ Dispensar</Typography>
              </Box>
              <Box onClick={e=>{e.stopPropagation(); isReady && setConfirmPromote(p);}} sx={{
                flex:2,
                bgcolor: isReady?C.green:C.cardAlt,
                border:`1.5px solid ${isReady?C.green:C.border}`,
                borderRadius:'9px', py:0.8, textAlign:'center',
                cursor:isReady?'pointer':'default', opacity:isReady?1:0.5,
                boxShadow: isReady?`0 0 12px ${C.green}40`:'none',
                '&:active': isReady?{filter:'brightness(0.88)'}:{},
              }}>
                <Typography sx={{ color:isReady?'#000':C.txt3, fontWeight:900, fontSize:'0.7rem' }}>
                  {isReady ? '🌟 Promover ao Profissional' : `⏳ Pronto aos ${PROMOTE_AGE} anos`}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:10 }}>

      {/* ── HEADER ── */}
      <Box sx={{
        background:`linear-gradient(160deg, rgba(124,58,237,0.1) 0%, ${C.card} 55%)`,
        borderBottom:`1px solid ${C.border}`, px:2, pt:4, pb:0,
      }}>
        {/* Título + Badge */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:1.2 }}>
          <Box>
            <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.55rem', letterSpacing:2, mb:0.2 }}>🏫 CATEGORIA DE BASE</Typography>
            <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1.1rem', fontFamily:'"Nunito",sans-serif', lineHeight:1 }}>{gameData.club?.name}</Typography>
          </Box>
          <Box sx={{ bgcolor:`${levelColor}18`, border:`1.5px solid ${levelColor}50`, borderRadius:'10px', px:1, py:0.5, textAlign:'center' }}>
            <Typography sx={{ fontSize:'1rem', lineHeight:1, mb:0.1 }}>{LEVEL_ICONS[academyLevel]}</Typography>
            <Typography sx={{ color:levelColor, fontWeight:900, fontSize:'0.58rem', letterSpacing:0.5 }}>{levelInfo.label.toUpperCase()}</Typography>
          </Box>
        </Box>

        {/* Prestígio da academia */}
        <Box sx={{ mb:1.2 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.3 }}>
            <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.52rem' }}>PRESTÍGIO DA ACADEMIA</Typography>
            <Typography sx={{ color:levelColor, fontWeight:900, fontSize:'0.52rem' }}>{academyPrestige}/100</Typography>
          </Box>
          <Box sx={{ height:5, bgcolor:C.border, borderRadius:3, overflow:'hidden' }}>
            <Box sx={{ height:'100%', width:`${academyPrestige}%`, borderRadius:3,
              background:`linear-gradient(90deg,${levelColor},${levelColor}bb)`,
              boxShadow:`0 0 8px ${levelColor}60`, transition:'width 0.5s' }}/>
          </Box>
        </Box>

        {/* Stats cards */}
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0.6, mb:0 }}>
          {[
            { l:'GAROTOS',  v:academy.length,   c:C.txt1,   i:'👥' },
            { l:'PRONTOS',  v:readyCount,        c:readyCount>0?C.green:C.txt3, i:'🌟' },
            { l:'OVR MÉD.', v:avgOvr||'—',      c:'#7c3aed', i:'⚡' },
            { l:'POT. MÉD.',v:avgPot||'—',       c:C.green,  i:'🎯' },
          ].map((s,i) => (
            <Box key={i} sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', py:0.7, px:0.5, textAlign:'center' }}>
              <Typography sx={{ fontSize:'0.85rem', lineHeight:1, mb:0.15 }}>{s.i}</Typography>
              <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1.0rem', lineHeight:1 }}>{s.v}</Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700, mt:0.15 }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>

        {/* Tabs */}
        <Box sx={{ display:'flex', mt:1.2 }}>
          {[
            { id:'squad',   label:'Elenco',     icon:'👥' },
            { id:'invest',  label:'Investir',   icon:'🏗️' },
          ].map(t => (
            <Box key={t.id} onClick={()=>setTab(t.id)} sx={{
              flex:1, py:0.8, textAlign:'center', cursor:'pointer',
              borderBottom:`2.5px solid ${tab===t.id?'#7c3aed':'transparent'}`,
              bgcolor: tab===t.id?'rgba(124,58,237,0.06)':'transparent',
              transition:'all 0.15s',
            }}>
              <Typography sx={{ fontSize:'0.85rem', lineHeight:1, mb:0.1 }}>{t.icon}</Typography>
              <Typography sx={{ color:tab===t.id?'#7c3aed':C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:0.3 }}>
                {t.label.toUpperCase()}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ px:1.5, pt:1.5 }}>

        {/* ══ ABA ELENCO ══ */}
        {tab === 'squad' && (<>

          {/* Banner prontos para promoção */}
          {readyCount > 0 && (
            <Box sx={{ bgcolor:`${C.green}10`, border:`1.5px solid ${C.green}50`, borderRadius:'12px', px:1.3, py:1, mb:1.2 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Box sx={{ width:36, height:36, borderRadius:'10px', bgcolor:`${C.green}20`, border:`1.5px solid ${C.green}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Typography sx={{ fontSize:'1.3rem', lineHeight:1 }}>🌟</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.8rem' }}>
                    {readyCount} jogador{readyCount>1?'es':''} pronto{readyCount>1?'s':''} para o profissional!
                  </Typography>
                  <Typography sx={{ color:C.txt3, fontSize:'0.56rem', fontWeight:700 }}>
                    Toque no garoto e promova ao elenco principal.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Filtros */}
          <Box sx={{ display:'flex', gap:0.5, mb:1.2, overflowX:'auto', pb:0.3 }}>
            {[
              { id:'all',    label:'Todos',    count: academy.length },
              { id:'ready',  label:'🌟 Prontos', count: readyCount },
              { id:'burst',  label:'🚀 Explosivo', count: academy.filter(p=>p.trajectory==='burst').length },
              { id:'steady', label:'📈 Constante', count: academy.filter(p=>p.trajectory==='steady').length },
              { id:'late',   label:'⏳ Revelação', count: academy.filter(p=>p.trajectory==='late').length },
            ].map(f => (
              <Box key={f.id} onClick={()=>setFilter(f.id)} sx={{
                flexShrink:0,
                bgcolor: filter===f.id?'#7c3aed':C.card,
                border:`1px solid ${filter===f.id?'#7c3aed':C.border}`,
                borderRadius:'20px', px:1, py:0.35, cursor:'pointer',
                display:'flex', alignItems:'center', gap:0.4,
                boxShadow: filter===f.id?`0 0 10px rgba(124,58,237,0.4)`:'none',
                transition:'all 0.15s',
              }}>
                <Typography sx={{ color:filter===f.id?'#fff':C.txt2, fontWeight:900, fontSize:'0.58rem' }}>{f.label}</Typography>
                <Box sx={{ bgcolor:filter===f.id?'rgba(255,255,255,0.2)':C.cardAlt, borderRadius:'10px', px:0.5, py:0.05 }}>
                  <Typography sx={{ color:filter===f.id?'#fff':C.txt3, fontWeight:900, fontSize:'0.5rem' }}>{f.count}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Lista de prospects */}
          {filteredAcademy.length === 0 ? (
            <Box sx={{ textAlign:'center', py:6 }}>
              <Typography sx={{ fontSize:'3rem', mb:1, opacity:0.3 }}>🏟️</Typography>
              <Typography sx={{ color:C.txt2, fontWeight:700, fontSize:'0.9rem' }}>
                {filter === 'all' ? 'Academia vazia.' : 'Nenhum garoto nesse filtro.'}
              </Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.7rem', mt:0.5 }}>Avance rodadas para recrutar garotos.</Typography>
            </Box>
          ) : filteredAcademy.map(p => <ProspectCard key={p.id} p={p}/>)}

          {/* Estatísticas da Academia */}
          {academy.length > 0 && (
            <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', p:1.3, mt:0.5 }}>
              <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.56rem', letterSpacing:0.8, mb:0.8 }}>📊 ESTATÍSTICAS DA BASE</Typography>
              <Box sx={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:0.7 }}>
                {[
                  { l:'Valor Total',    v:fmt(totalValue),    c:C.green },
                  { l:'Melhor OVR',     v:Math.max(...academy.map(p=>p.overall||0)), c:'#7c3aed' },
                  { l:'Maior Potencial',v:Math.max(...academy.map(p=>p.potential||0)), c:C.yellow },
                  { l:'Posição +comum', v:(() => {
                      const freq = {}; academy.forEach(p=>{freq[p.position]=(freq[p.position]||0)+1;});
                      return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
                    })(), c:C.blue },
                ].map((s,i)=>(
                  <Box key={i} sx={{ bgcolor:C.cardAlt, borderRadius:'8px', px:1, py:0.7, border:`1px solid ${C.border}` }}>
                    <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.85rem', lineHeight:1 }}>{s.v}</Typography>
                    <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.48rem', mt:0.15 }}>{s.l}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>)}

        {/* ══ ABA INVESTIR ══ */}
        {tab === 'invest' && (<>
          <Box sx={{ bgcolor:`${'#7c3aed'}10`, border:`1px solid ${'#7c3aed'}30`, borderRadius:'12px', p:1.2, mb:1.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:0.4 }}>
              <Typography sx={{ color:'#7c3aed', fontWeight:900, fontSize:'0.7rem' }}>💰 Verba disponível</Typography>
              <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.9rem' }}>{fmt(gameData.club?.money||0)}</Typography>
            </Box>
            <Typography sx={{ color:C.txt3, fontSize:'0.58rem', fontWeight:700 }}>
              Investir em um nível superior recruta garotos com maior potencial e aumenta a chance de evolução.
            </Typography>
          </Box>

          {AE && Object.entries(AE.LEVELS).map(([key, info]) => {
            const isCurrent = academyLevel === key;
            const canAfford = (gameData.club?.money||0) >= info.cost;
            const lColor    = LEVEL_COLORS[key] || C.txt2;
            const lIcon     = LEVEL_ICONS[key] || '🏫';
            const bonuses   = {
              basic:    { pot:'42–57', chance:'55–85%', talentos:'Comuns' },
              advanced: { pot:'50–70', chance:'65–90%', talentos:'Bons' },
              elite:    { pot:'62–85', chance:'75–95%', talentos:'Excepcionais' },
            }[key];

            return (
              <Box key={key} onClick={()=>!isCurrent&&canAfford&&handleInvest(key)} sx={{
                mb:1.2, borderRadius:'14px', overflow:'hidden',
                border:`2px solid ${isCurrent?lColor:canAfford?`${lColor}50`:C.border}`,
                bgcolor: isCurrent?`${lColor}12`:C.card,
                opacity: !isCurrent&&!canAfford?0.55:1,
                cursor: isCurrent||!canAfford?'default':'pointer',
                boxShadow: isCurrent?`0 0 20px ${lColor}30`:'none',
                transition:'all 0.15s',
              }}>
                {isCurrent && <Box sx={{ height:3, bgcolor:lColor }}/>}
                <Box sx={{ px:1.4, py:1.2 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:0.8 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
                      <Box sx={{ width:40, height:40, borderRadius:'10px', bgcolor:`${lColor}20`, border:`1.5px solid ${lColor}50`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Typography sx={{ fontSize:'1.4rem', lineHeight:1 }}>{lIcon}</Typography>
                      </Box>
                      <Box>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
                          <Typography sx={{ color:isCurrent?lColor:C.txt1, fontWeight:900, fontSize:'0.9rem' }}>{info.label}</Typography>
                          {isCurrent && (
                            <Box sx={{ bgcolor:lColor, borderRadius:'5px', px:0.6, py:0.05 }}>
                              <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.46rem' }}>ATUAL ✓</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700 }}>{info.desc}</Typography>
                      </Box>
                    </Box>
                    {!isCurrent && (
                      <Box sx={{ textAlign:'right' }}>
                        <Typography sx={{ color:canAfford?C.green:C.red, fontWeight:900, fontSize:'0.82rem' }}>{fmt(info.cost)}</Typography>
                        <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>investimento único</Typography>
                      </Box>
                    )}
                  </Box>
                  {/* Benefícios */}
                  <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0.5 }}>
                    {[
                      { l:'POTENCIAL', v:bonuses.pot },
                      { l:'EVOLUÇÃO',  v:bonuses.chance },
                      { l:'TALENTOS',  v:bonuses.talentos },
                    ].map((b,i)=>(
                      <Box key={i} sx={{ bgcolor:C.cardAlt, borderRadius:'7px', py:0.6, px:0.5, textAlign:'center', border:`1px solid ${C.border}` }}>
                        <Typography sx={{ color:isCurrent?lColor:C.txt2, fontWeight:900, fontSize:'0.6rem', lineHeight:1 }}>{b.v}</Typography>
                        <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700, mt:0.15 }}>{b.l}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })}

          {/* Informação sobre evolução */}
          <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', p:1.2 }}>
            <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.56rem', letterSpacing:0.8, mb:0.7 }}>ℹ️ COMO FUNCIONA</Typography>
            {[
              { icon:'📅', text:'Os garotos evoluem ao fim de cada temporada' },
              { icon:'🚀', text:'Tipos Explosivo crescem rápido antes dos 16' },
              { icon:'⏳', text:'Revelações florescem depois dos 17 anos' },
              { icon:'🌟', text:'Garotos com 18+ anos podem ser promovidos' },
              { icon:'💸', text:'Dispensar libera vaga para novos recrutas' },
            ].map((r,i)=>(
              <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.5 }}>
                <Typography sx={{ fontSize:'0.85rem', lineHeight:1, flexShrink:0 }}>{r.icon}</Typography>
                <Typography sx={{ color:C.txt2, fontSize:'0.65rem', fontWeight:700 }}>{r.text}</Typography>
              </Box>
            ))}
          </Box>
        </>)}
      </Box>

      {/* ── MODAL PROMOÇÃO ── */}
      <Dialog open={!!confirmPromote} onClose={()=>setConfirmPromote(null)} fullWidth maxWidth="xs"
        PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.green}`, m:2 } }}>
        {confirmPromote && (
          <Box sx={{ p:2 }}>
            <Box sx={{ textAlign:'center', mb:1.5 }}>
              <Typography sx={{ fontSize:'2.5rem', lineHeight:1, mb:0.5 }}>🌟</Typography>
              <Typography sx={{ color:C.green, fontWeight:900, fontSize:'1.1rem' }}>Promover ao Profissional</Typography>
            </Box>
            <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.5 }}>
              <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.9rem', mb:0.3 }}>{confirmPromote.name}</Typography>
              {[
                { l:'Posição',  v:confirmPromote.position },
                { l:'OVR',      v:confirmPromote.overall },
                { l:'Potencial',v:confirmPromote.potential },
                { l:'Contrato', v:'2 temporadas' },
                { l:'Salário',  v:`${fmt(Math.max(3000,Math.round((confirmPromote.value||50000)*0.012/1000)*1000))}/rodada` },
              ].map((r,i)=>(
                <Box key={i} sx={{ display:'flex', justifyContent:'space-between', py:0.35, borderBottom:i<4?`1px solid ${C.border}`:'none' }}>
                  <Typography sx={{ color:C.txt3, fontSize:'0.65rem', fontWeight:700 }}>{r.l}</Typography>
                  <Typography sx={{ color:C.txt1, fontSize:'0.65rem', fontWeight:900 }}>{r.v}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display:'flex', gap:0.8 }}>
              <Button fullWidth onClick={()=>setConfirmPromote(null)} sx={{ borderColor:C.border, color:C.txt2, fontWeight:900, borderRadius:'10px', border:`1.5px solid ${C.border}` }}>Cancelar</Button>
              <Button fullWidth onClick={()=>handlePromote(confirmPromote)} sx={{ bgcolor:C.green, color:'#000', fontWeight:900, borderRadius:'10px', boxShadow:`0 0 14px ${C.green}40` }}>🌟 Promover</Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* ── MODAL DISPENSA ── */}
      <Dialog open={!!confirmDispense} onClose={()=>setConfirmDispense(null)} fullWidth maxWidth="xs"
        PaperProps={{ sx:{ bgcolor:C.bg, borderRadius:'16px', border:`2px solid ${C.red}`, m:2 } }}>
        {confirmDispense && (
          <Box sx={{ p:2 }}>
            <Typography sx={{ color:C.red, fontWeight:900, fontSize:'1rem', mb:0.5 }}>Dispensar da Base</Typography>
            <Typography sx={{ color:C.txt2, fontSize:'0.82rem', mb:1.8 }}>
              Dispensar <strong>{confirmDispense.name}</strong> (OVR {confirmDispense.overall}, {confirmDispense.age} anos)?
              Essa ação não pode ser desfeita.
            </Typography>
            <Box sx={{ display:'flex', gap:0.8 }}>
              <Button fullWidth onClick={()=>setConfirmDispense(null)} sx={{ borderColor:C.border, color:C.txt2, fontWeight:900, borderRadius:'10px', border:`1.5px solid ${C.border}` }}>Cancelar</Button>
              <Button fullWidth onClick={()=>handleDispense(confirmDispense)} sx={{ bgcolor:C.red, color:'#fff', fontWeight:900, borderRadius:'10px' }}>Dispensar</Button>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default ScreenAcademy;

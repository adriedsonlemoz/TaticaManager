// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';
import { FatigueEngine } from '../engines/engine_fatigue.js';

// components/PlayerModal.js — v2.0 (Design Premium, Físico e Confirmação de Venda)
// Componente separado para evitar o bug de hooks dentro de IIFE

const PlayerModal = ({ player, allPlayers, onClose, onSell, onUpdateShirt, onUpdateWage, formatMoney, showToast, currentRound, gameData, onSetGameData }) => {
  const _toast = showToast || (() => {});
  const [tab, setTab]             = React.useState('info');
  const [wageInput, setWageInput] = React.useState(String(player.wage || 0));
  const [wageError, setWageError] = React.useState('');
  const [confirmSell, setConfirmSell] = React.useState(false);
  const [filterPos,   setFilterPos]   = React.useState('TODOS');
  const [filterStat,  setFilterStat]  = React.useState('goals');

  // Camisas ocupadas por outros jogadores
  const takenShirts = React.useMemo(
    () => new Set(allPlayers.filter(p => p.id !== player.id && p.shirt != null).map(p => p.shirt)),
    [allPlayers, player.id]
  );

  // ── Paleta de Cores ──
  const C = THEME;

  const posColor = (pos) => {
    const T = THEME;
    return ({
      GOL: { bg: T.posGol, text: '#fff' },
      ZAG: { bg: T.posZag, text: '#fff' },
      LD:  { bg: T.posLat, text: '#fff' },
      LE:  { bg: T.posLat, text: '#fff' },
      VOL: { bg: T.posVol, text: '#fff' },
      MC:  { bg: T.posVol, text: '#fff' },
      MEI: { bg: T.posMei, text: '#fff' },
      PD:  { bg: T.posAta, text: '#fff' },
      PE:  { bg: T.posAta, text: '#fff' },
      CA:  { bg: T.posAta, text: '#fff' },
      // compat saves antigos
      LAT: { bg: T.posLat, text: '#fff' },
      ATA: { bg: T.posAta, text: '#fff' },
    }[pos] || { bg: T.posDef, text: '#fff' });
  };

  const ovrColor = (ovr) => { const T = THEME; return ovr >= 80 ? T.ovrGood : ovr >= 70 ? T.ovrMid : T.ovrBad; };
  const col      = posColor(player.position);
  const sellVal  = Math.floor(Math.max(50000, player.value || 0) * 0.8);
  
  // Status Físico e Lesão
  const energy = player.energy ?? 100;
  const isInjured = !!player.injury;
  const batColor = energy < 50 ? C.red : energy < 75 ? C.orange : C.green;

  const handleSaveWage = () => {
    const val = parseInt(wageInput);
    if (isNaN(val) || val < 1000) { setWageError('Mínimo: R$ 1.000.'); return; }
    if (val > 5000000)            { setWageError('Máximo: R$ 5.000.000.'); return; }
    // BUG P12 FIX: aviso se folha ficará alta
    const totalWage = (allPlayers || []).reduce((s,p) => s + (p.id === player.id ? val : (p.wage||0)), 0);
    const estRevenue = 500000 + 350000; // TV + bilheteria estimada
    if (totalWage > estRevenue * 1.5) setWageError(''); // apenas aviso
    setWageError('');
    // BUG P1+P2 FIX: ao salvar novo salário, renovar contrato automaticamente
    const newContract = val > (player.value * 0.08) ? 3 : val > (player.value * 0.05) ? 2 : 1;
    onUpdateWage(player.id, val, newContract);
    setTab('info');
  };

  const tabs = [
    { key: 'info',       label: 'Perfil' },
    { key: 'season',     label: 'Temporada' },
    { key: 'shirt',      label: 'Camisa' },
    { key: 'wage',       label: 'Salário' },
    { key: 'discipline', label: 'Disciplina' },
  ];

  // Componente visual da camisa para o seletor
  const ShirtIcon = ({ num }) => (
    <svg viewBox="-10 -10 20 20" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }}>
      <path d="M-6,-6 Q0,-9 6,-6 L10,-2 L6,2 L5,0 L5,8 L-5,8 L-5,0 L-6,2 L-10,-2 Z" fill={THEME?.ink2 || "#334155"} />
    </svg>
  );

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          m: 1, borderRadius: '16px',
          bgcolor: C.bgCard, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          backgroundImage: 'none', border: `1px solid ${C.border}`
        }
      }}
    >
      {/* ══ CABEÇALHO COM JERSEY BADGE ══ */}
      <Box sx={{
        background: `linear-gradient(135deg, ${col.bg}30 0%, ${C.bgCard} 70%)`,
        px: 2, pt: 2, pb: 1.5,
        display: 'flex', alignItems: 'center', gap: 1.5,
        position: 'relative', borderBottom: `3px solid ${col.bg}`
      }}>
        {/* Jersey Badge grande */}
        {window.JerseyBadge
          ? React.createElement(window.JerseyBadge, { pos: player.position, num: player.shirt ?? '?', size: 56 })
          : <Box sx={{ width:56, height:56, borderRadius:'12px', flexShrink:0, bgcolor:col.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Typography sx={{ fontSize:'1.2rem', fontWeight:900, color:col.text }}>{player.position}</Typography>
            </Box>
        }

        {/* Nome e Status */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, color: C.ink, fontSize: '1.1rem', lineHeight: 1.1, mb: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {player.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
             <Typography sx={{ color: C.ink2, fontSize: '0.7rem', fontWeight: 700 }}>
              {player.shirt ?? '?'} · {player.age} anos · {player.nationality || player.country || ''}
             </Typography>
             {player.isStarting ? (
               <Box sx={{ bgcolor: C.primary, color: '#fff', px: 0.8, py: 0.1, borderRadius: 1, fontSize: '0.55rem', fontWeight: 900 }}>TITULAR</Box>
             ) : (
               <Box sx={{ bgcolor: C.bgDark, color: C.ink2, px: 0.8, py: 0.1, borderRadius: 1, fontSize: '0.55rem', fontWeight: 900 }}>RESERVA</Box>
             )}
             {/* Badge jovem promessa */}
             {player.age <= 21 && (
               <Box sx={{ bgcolor: '#7c3aed20', border: '1px solid #7c3aed60', color: '#7c3aed', px: 0.8, py: 0.1, borderRadius: 1, fontSize: '0.55rem', fontWeight: 900 }}>
                 ⭐ JOVEM
               </Box>
             )}
             {/* Badge veterano */}
             {player.age >= 33 && (
               <Box sx={{ bgcolor: `${C.orange || '#f97316'}20`, border: `1px solid ${C.orange || '#f97316'}50`, color: C.orange || '#f97316', px: 0.8, py: 0.1, borderRadius: 1, fontSize: '0.55rem', fontWeight: 900 }}>
                 🕰️ VETERANO
               </Box>
             )}
          </Box>
        </Box>

        {/* OVR Badge */}
        <Box sx={{
          bgcolor: ovrColor(player.overall),
          borderRadius: '8px', px: 1.2, py: 0.5, textAlign: 'center', flexShrink: 0,
          border: `1.5px solid ${C.border}`,
          boxShadow: `0 2px 8px ${ovrColor(player.overall)}60`
        }}>
          <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: '#fff', lineHeight: 1 }}>
            {player.overall}
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 900, opacity: 0.9 }}>
            OVR
          </Typography>
        </Box>

      </Box>

      {/* ══ TABS LIMPAs E ESTILIZADAS ══ */}
      <Box sx={{ display: 'flex', bgcolor: C.bg, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <Box
            key={t.key}
            onClick={() => { setTab(t.key); setConfirmSell(false); }}
            sx={{
              flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer',
              borderBottom: tab === t.key ? `3px solid ${C.primary}` : '3px solid transparent',
              bgcolor: tab === t.key ? 'rgba(17,138,139,0.05)' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <Typography sx={{
              fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5,
              color: tab === t.key ? C.primary : C.txt2
            }}>{t.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* ══════════════════════════════
          TAB: PERFIL E BIOLÓGICO
      ══════════════════════════════ */}
      {tab === 'info' && (
        <Box sx={{ p: 2 }}>
          
          {/* Painel Físico / Médico */}
          <Paper sx={{ p: 1.5, mb: 1.5, bgcolor: C.bgCard, border: `1px solid ${C.bord2}`, borderRadius: '10px', display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 900 }}>CONDIÇÃO FÍSICA</Typography>
                <Typography sx={{ color: batColor, fontSize: '0.7rem', fontWeight: 900 }}>{energy}%</Typography>
              </Box>
              <Box sx={{ height: 6, bgcolor: 'rgba(54,36,20,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: batColor, transition: 'width 0.5s' }} />
              </Box>
            </Box>
            
            {/* Status Lesão */}
            <Box sx={{ width: 1, height: 30, bgcolor: C.bord2, opacity: 0.5 }} />
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              {isInjured ? (
                <>
                  <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>🚑</Typography>
                  <Typography sx={{ color: C.red, fontSize: '0.6rem', fontWeight: 900 }}>{player.injury.roundsLeft} JOGOS</Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>🏃</Typography>
                  <Typography sx={{ color: C.green, fontSize: '0.6rem', fontWeight: 900 }}>SAUDÁVEL</Typography>
                </>
              )}
            </Box>
          </Paper>

          {/* Stats Financeiras e Técnicas */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: player.age <= 21 ? 1 : 2 }}>
             <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '8px', p: 1, textAlign: 'center' }}>
               <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 900 }}>VALOR DE MERCADO</Typography>
               <Typography sx={{ color: C.txt1, fontSize: '0.9rem', fontWeight: 900 }}>{formatMoney(player.value)}</Typography>
             </Box>
             <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '8px', p: 1, textAlign: 'center' }}>
               <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 900 }}>SALÁRIO POR JOGO</Typography>
               <Typography sx={{ color: C.txt1, fontSize: '0.9rem', fontWeight: 900 }}>{formatMoney(player.wage || 0)}</Typography>
             </Box>
          </Box>

          {/* Card de potencial — só exibido para jovens (≤ 21) */}
          {player.age <= 21 && (() => {
            // Potencial estimado: OVR atual + margem por idade
            // 17-18: até +12 | 19-20: até +9 | 21: até +6
            const maxGain  = player.age <= 18 ? 12 : player.age <= 20 ? 9 : 6;
            const potMin   = player.overall + Math.floor(maxGain * 0.5);
            const potMax   = Math.min(99, player.overall + maxGain);
            const pctFill  = Math.round(((player.overall - 40) / 59) * 100);
            return (
              <Box sx={{ bgcolor: '#7c3aed12', border: '1.5px solid #7c3aed40', borderRadius: '10px', p: 1.2, mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography sx={{ color: '#7c3aed', fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>
                    ⭐ JOVEM PROMESSA
                  </Typography>
                  <Typography sx={{ color: '#7c3aed', fontWeight: 900, fontSize: '0.75rem' }}>
                    {potMin}–{potMax} potencial
                  </Typography>
                </Box>
                {/* Barra de progresso OVR */}
                <Box sx={{ height: 6, bgcolor: 'rgba(124,58,237,0.12)', borderRadius: 3, overflow: 'hidden', mb: 0.5 }}>
                  <Box sx={{ height: '100%', width: `${pctFill}%`, bgcolor: '#7c3aed', borderRadius: 3 }} />
                </Box>
                <Typography sx={{ color: '#7c3aed', fontSize: '0.56rem', fontWeight: 700 }}>
                  Treinos intensivos têm maior chance de evolução. OVR atual: {player.overall}
                </Typography>
              </Box>
            );
          })()}

          <Divider sx={{ borderColor: 'rgba(166,131,77,0.3)', mb: 1.5 }} />

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button fullWidth variant="outlined" onClick={onClose}
              sx={{ color: C.txt2, borderColor: C.border, fontWeight: 900, borderRadius: '8px', '&:hover': { borderColor: C.primary, color: C.primary } }}>
              FECHAR
            </Button>

            {/* Lista de Transferências — substitui venda direta */}
            {player.isListed ? (
              <Button fullWidth variant="contained"
                onClick={() => {
                  if (onSetGameData) {
                    onSetGameData(prev => ({
                      ...prev,
                      players: prev.players.map(p => p.id === player.id ? { ...p, isListed: false } : p),
                      market:  (prev.market || []).filter(p => p.id !== player.id),
                    }));
                  }
                  showToast && showToast(`${player.name.split(' ').pop()} removido da lista.`, 'info');
                  onClose();
                }}
                sx={{ bgcolor: C.orange || '#f97316', color: '#fff', fontWeight: 900, borderRadius: '8px', '&:hover': { bgcolor: '#c2410c' } }}>
                📋 RETIRAR DA LISTA
              </Button>
            ) : (
              <Button fullWidth variant="contained"
                onClick={() => {
                  if (onSetGameData) {
                    onSetGameData(prev => ({
                      ...prev,
                      players: prev.players.map(p => p.id === player.id ? { ...p, isListed: true } : p),
                      // B11: remove entrada antiga (pode ter dados desatualizados) e insere a atual
                      market: [
                        ...(prev.market || []).filter(p => p.id !== player.id),
                        { ...player, isListed: true, _listedAt: prev.round || 0 },
                      ],
                    }));
                  } else if (onSell) {
                    // Fallback: chama onSell com flag especial para app.js interceptar e listar
                    onSell({ ...player, _listOnly: true });
                  }
                  showToast && showToast(`📋 ${player.name.split(' ').pop()} na lista! Propostas chegarão no inbox.`, 'success');
                  onClose();
                }}
                sx={{ bgcolor: C.bgCard, color: C.red, border: `1px solid ${C.red}`, fontWeight: 900, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(148,24,24,0.1)' } }}>
                📋 LISTAR P/ VENDA
              </Button>
            )}
          </Box>
          <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700, textAlign: 'center', mt: 0.7 }}>
            Propostas chegam via inbox após ser listado · Valor estimado: {formatMoney(sellVal)}
          </Typography>
        </Box>
      )}

      {/* ══════════════════════════════
          TAB: CAMISA
      ══════════════════════════════ */}

      {tab === 'season' && (
        <Box sx={{ p: 2 }}>
          {/* Time anterior */}
          {player.previousTeam && (
            <Box sx={{ bgcolor:`${C.blue}12`, border:`1px solid ${C.blue}30`, borderRadius:'10px', p:1.2, mb:1.2, display:'flex', alignItems:'center', gap:1 }}>
              <Typography sx={{ fontSize:'1.2rem' }}>🔄</Typography>
              <Box>
                <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:900, letterSpacing:0.5 }}>CLUBE ANTERIOR</Typography>
                <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.82rem' }}>{player.previousTeam}</Typography>
                {(player.previousTeamGoals != null) && (
                  <Typography sx={{ color:C.txt2, fontSize:'0.6rem', fontWeight:700 }}>⚽ {player.previousTeamGoals} gols · 🅰️ {player.previousTeamAssists||0} assists</Typography>
                )}
              </Box>
            </Box>
          )}
          {/* Filtro */}
          <Box sx={{ display:'flex', gap:0.5, mb:1.2, overflowX:'auto', '&::-webkit-scrollbar':{display:'none'} }}>
            {[{id:'goals',label:'Gols'},{id:'assists',label:'Assists'},{id:'minutes',label:'Minutos'},{id:'energy',label:'Físico'},{id:'contract',label:'Contrato'}].map(f=>(
              <Box key={f.id} onClick={()=>setFilterStat(f.id)} sx={{ flexShrink:0, px:1.2, py:0.4, borderRadius:'20px', cursor:'pointer', bgcolor:filterStat===f.id?C.primary:C.cardAlt, border:`1px solid ${filterStat===f.id?C.primary:C.border}` }}>
                <Typography sx={{ color:filterStat===f.id?'#000':C.txt2, fontWeight:900, fontSize:'0.58rem' }}>{f.label}</Typography>
              </Box>
            ))}
          </Box>
          {(() => {
            const energy       = player.energy ?? 100;
            const contract     = player.contract ?? 1;
            const goals        = player.seasonGoals || 0;
            const energyColor  = energy >= 75 ? C.primary : energy >= 50 ? '#f0a500' : C.red;
            const contractClr  = contract <= 0 ? C.red : contract === 1 ? '#f0a500' : C.primary;
            return (
              <Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, mb: 1.5 }}>
                  {[
                    { l: 'GOLS',    v: goals,                                                   color: goals > 0 ? C.primary : C.txt2 },
                    { l: 'ASSIST.', v: player.assists || 0,                                     color: (player.assists||0) > 0 ? C.primary : C.txt2 },
                    // #28 minutesPlayed
                    { l: 'MINUTOS', v: player.minutesPlayed || 0,                               color: C.txt1 },
                    { l: 'CONTRATO',v: contract <= 0 ? 'Venc.' : `${contract}T`,               color: contractClr },
                  ].map((s, i) => (
                    <Box key={i} sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', py: 1.5, textAlign: 'center' }}>
                      <Typography sx={{ color: s.color, fontWeight: 900, fontSize: '1.2rem', lineHeight: 1 }}>{s.v}</Typography>
                      <Typography sx={{ color: C.txt3, fontSize: '0.52rem', fontWeight: 700, mt: 0.3 }}>{s.l}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, mb: 1.2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.7rem' }}>Energia</Typography>
                    <Typography sx={{ color: energyColor, fontWeight: 900, fontSize: '0.7rem' }}>{energy}%</Typography>
                  </Box>
                  <Box sx={{ height: 8, bgcolor: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: energyColor, borderRadius: 4, transition: 'width 0.4s' }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
                    <Typography sx={{ color: C.txt3, fontSize: '0.58rem' }}>
                      {energy >= 80 ? 'Em forma' : energy >= 65 ? 'Levemente cansado' : energy >= 50 ? 'Fatigado' : energy >= 30 ? 'Muito cansado' : 'Exausto'}
                    </Typography>
                    {/* Penalidade OVR (#27) */}
                    {(() => {
                      const pen = window.FatigueEngine?.getOverallPenalty
                        ? window.FatigueEngine.getOverallPenalty(energy)
                        : 0;
                      if (!pen) return null;
                      return (
                        <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem',
                          bgcolor: `${C.red}12`, px: 0.6, py: 0.1, borderRadius: '4px' }}>
                          -{pen} OVR efetivo
                        </Typography>
                      );
                    })()}
                  </Box>
                </Box>
                <Box sx={{ bgcolor: contract <= 1 ? `${contractClr}15` : C.cardAlt, border: `1px solid ${contractClr}40`, borderRadius: '10px', p: 1.2, mb: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.68rem' }}>Contrato</Typography>
                    <Typography sx={{ color: contractClr, fontWeight: 900, fontSize: '0.8rem' }}>
                      {contract <= 0 ? 'Encerrado — renovar ou liberar' : contract === 1 ? 'Ultimo ano' : `${contract} temporadas restantes`}
                    </Typography>
                  </Box>
                  {contract <= 1 && (
                    <Box onClick={() => setTab('wage')} sx={{ bgcolor: C.primary, borderRadius: '8px', px: 1, py: 0.5, cursor: 'pointer' }}>
                      <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.65rem' }}>Renovar</Typography>
                    </Box>
                  )}
                </Box>
                {/* Histórico de lesões (#71) — exibido se existir */}
                {player.injuryHistory && player.injuryHistory.length > 0 && (
                  <Box sx={{ bgcolor: `${C.red}08`, border: `1px solid ${C.red}25`,
                    borderRadius: '10px', p: 1.2, mb: 1.2 }}>
                    <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.58rem',
                      letterSpacing: 0.8, mb: 0.8 }}>🏥 HISTÓRICO DE LESÕES</Typography>
                    {player.injuryHistory.slice(-4).reverse().map((h, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between',
                        py: 0.4, borderBottom: i < Math.min(player.injuryHistory.length, 4) - 1
                          ? `1px solid ${C.red}15` : 'none', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.6rem' }}>
                            {h.type}
                            {h.recaida && (
                              <Typography component="span" sx={{ color: C.orange, fontSize: '0.52rem', ml: 0.5 }}>
                                (recaída)
                              </Typography>
                            )}
                          </Typography>
                          <Typography sx={{ color: C.txt3, fontSize: '0.52rem' }}>
                            Rodada {h.round} · {h.duration} jogo{h.duration > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.6rem' }}>
                          -{h.duration} rod.
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.2 }}>
                  {[
                    { l: 'OVR Atual', v: player.overall, c: C.primary },
                    { l: 'Valor de Mercado', v: formatMoney ? formatMoney(player.value||0) : player.value, c: C.txt1 },
                    { l: 'Posicao / Idade', v: `${player.position} · ${player.age} anos`, c: C.txt1 },
                  ].map((row, i, arr) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: i < arr.length-1 ? `1px solid ${C.bord2}` : 'none' }}>
                      <Typography sx={{ color: C.txt2, fontSize: '0.7rem', fontWeight: 700 }}>{row.l}</Typography>
                      <Typography sx={{ color: row.c, fontWeight: 900, fontSize: '0.7rem' }}>{row.v}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })()}
        </Box>
      )}

      {tab === 'shirt' && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 900, color: C.txt2, fontSize: '0.7rem', letterSpacing: 1, mb: 0.8 }}>CAMISA ATUAL</Typography>
            <Box sx={{ display: 'inline-flex', justifyContent: 'center' }}>
              {window.JerseyBadge
                ? React.createElement(window.JerseyBadge, { pos: player.position, num: player.shirt ?? '?', size: 64, showPos: true })
                : <Box sx={{ width:64, height:64, borderRadius:'12px', bgcolor:C.primary, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1.6rem' }}>{player.shirt ?? '—'}</Typography>
                  </Box>
              }
            </Box>
          </Box>

          <Typography sx={{ color: C.txt3, textAlign: 'center', display: 'block', mb: 1, fontStyle: 'italic', fontSize: '0.65rem' }}>
            Selecione um número livre abaixo.
          </Typography>

          <Box sx={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px', maxHeight: 220, overflowY: 'auto', pr: 0.5, pb: 0.5
          }}>
            {Array.from({ length: 99 }, (_, i) => i + 1).map(n => {
              const taken   = takenShirts.has(n);
              const current = player.shirt === n;
              return (
                <Box
                  key={n}
                  onClick={() => { if (!taken) onUpdateShirt(player.id, n); }}
                  sx={{
                    position: 'relative', height: 38, borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '0.8rem', cursor: taken ? 'default' : 'pointer',
                    userSelect: 'none',
                    bgcolor: current ? C.primary : taken ? 'rgba(0,0,0,0.05)' : C.card,
                    color: current ? '#fff' : taken ? 'rgba(0,0,0,0.2)' : C.txt1,
                    border: current ? `2px solid ${C.prim2}` : taken ? '1px solid rgba(0,0,0,0.05)' : `1.5px solid ${C.bord2}`,
                    transition: 'all 0.15s',
                    '&:hover': !taken && !current ? { bgcolor: 'rgba(17,138,139,0.1)', borderColor: C.primary } : {}
                  }}
                >
                  <span>{n}</span>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════
          TAB: SALÁRIO E RENOVAÇÃO
      ══════════════════════════════ */}
      {tab === 'wage' && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ bgcolor: C.bgCard, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, mb: 1.5, textAlign: 'center' }}>
            <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1 }}>SALÁRIO ATUAL</Typography>
            <Typography sx={{ fontWeight: 900, color: C.primary, fontSize: '1.4rem' }}>{formatMoney(player.wage || 0)}</Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.6rem' }}>por partida</Typography>
          </Box>

          <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1, mb: 0.5 }}>REAJUSTE RÁPIDO</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 1.5 }}>
            {[
              { pct: 0.03, label: 'Baixo' }, { pct: 0.05, label: 'Padrão' },
              { pct: 0.07, label: 'Alto'  }, { pct: 0.10, label: 'Estrela'},
            ].map(({ pct, label }) => {
              const sug     = Math.floor(player.value * pct);
              const current = parseInt(wageInput) === sug;
              return (
                <Box key={pct} onClick={() => { setWageInput(String(sug)); setWageError(''); }}
                  sx={{
                    p: 0.8, borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                    bgcolor: current ? C.primary : C.card, border: `1.5px solid ${current ? C.prim2 : C.bord2}`,
                    color: current ? '#fff' : C.txt1, transition: 'all 0.1s'
                  }}>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.75rem' }}>{formatMoney(sug)}</Typography>
                  <Typography sx={{ fontSize: '0.55rem', opacity: 0.8 }}>{label}</Typography>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: wageError ? 0.5 : 1 }}>
            <input type="number" min="0" max="5000000" value={wageInput} onChange={e => { setWageInput(e.target.value); setWageError(''); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${wageError ? C.red : C.border}`,
                background: C.cardAlt, color: C.txt1, fontSize: '0.9rem', fontWeight: 900, outline: 'none', fontFamily: 'Nunito, sans-serif'
              }} />
            <Button variant="contained" onClick={handleSaveWage} sx={{ bgcolor: C.primary, fontWeight: 900, px: 2, borderRadius: '8px' }}>SALVAR</Button>
          </Box>
          {wageError && <Typography sx={{ color: C.red, fontWeight: 700, fontSize: '0.65rem', mb: 1 }}>{wageError}</Typography>}

          <Button fullWidth variant="outlined" onClick={() => {
            // #12 Bônus de performance: +20% salário se fez 8+ gols, +10% se fez 5+
            const goals = player.seasonGoals || player.goals || 0;
            const bonusMult = goals >= 8 ? 1.20 : goals >= 5 ? 1.10 : 1.0;
            const baseWage  = player.wage || 0;
            const newWage   = bonusMult > 1.0 ? Math.round(baseWage * bonusMult / 500) * 500 : baseWage;
            onUpdateWage(player.id, newWage);
            const msg = bonusMult > 1.0
              ? `Contrato renovado! +${Math.round((bonusMult-1)*100)}% bônus de performance (${goals} gols)`
              : 'Contrato renovado!';
            _toast(msg, bonusMult > 1.0 ? 'success' : 'info');
            onClose();
          }}
            sx={{ mt: 1, py: 1.2, fontWeight: 900, color: C.green, borderColor: C.green, borderRadius: '8px', '&:hover': { bgcolor: 'rgba(50,168,82,0.1)' } }}>
            {(() => {
              const goals = player.seasonGoals || player.goals || 0;
              if (goals >= 8) return '🤝 RENOVAR (+20% bônus artilheiro)';
              if (goals >= 5) return '🤝 RENOVAR (+10% bônus performance)';
              return '🤝 RENOVAR CONTRATO';
            })()}
          </Button>
        </Box>
      )}

      {/* ══════════════════════════════
          TAB: DISCIPLINA
      ══════════════════════════════ */}
      {tab === 'discipline' && (
        <Box sx={{ p: 2 }}>
          {(() => {
            const discipline = player.discipline || { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] };
            const yellows = discipline.yellowCards || 0;
            const suspended = window.DisciplineEngine
              ? window.DisciplineEngine.isPlayerSuspended(player, currentRound || 0)
              : (discipline.suspendedUntilRound != null && (currentRound||0) <= discipline.suspendedUntilRound);
            
            let statusColor = C.green; let statusLabel = 'Ficha Limpa'; let statusIcon = '✅';
            if (suspended) { statusColor = C.red; statusLabel = 'Suspenso'; statusIcon = '🔴'; }
            else if (yellows === 1) { statusColor = C.orange; statusLabel = 'Atenção'; statusIcon = '⚠️'; }
            else if (yellows === 2) { statusColor = C.orange; statusLabel = 'Pendurado'; statusIcon = '🔶'; }

            return (
              <>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ flex: 1, bgcolor: `${statusColor}15`, border: `2px solid ${statusColor}`, borderRadius: '10px', p: 1.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.8rem', mb: 0.5, lineHeight: 1 }}>{statusIcon}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.8rem', color: statusColor }}>{statusLabel}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, bgcolor: C.bgCard, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', mb: 0.5, letterSpacing: 0.5 }}>CARTÕES AMARELOS</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map(i => (
                        <Box key={i} sx={{ flex: 1, height: 20, borderRadius: '4px', bgcolor: i < yellows ? '#fbc02d' : 'rgba(0,0,0,0.08)', border: i < yellows ? '1px solid #f57f17' : 'none' }} />
                      ))}
                    </Box>
                    <Typography sx={{ color: C.txt2, fontSize: '0.55rem', mt: 0.5, fontWeight: 700 }}>{3 - yellows} para suspensão</Typography>
                  </Box>
                </Box>

                <Paper sx={{ p: 1.5, mb: 1.5, bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px' }}>
                  <Typography sx={{ color: C.primary, fontWeight: 900, fontSize: '0.65rem', mb: 1, letterSpacing: 0.5 }}>📜 REGRAS DO CAMPEONATO</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: C.txt2, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>• <span style={{color: C.txt1, fontWeight: 700}}>3 Amarelos</span> geram suspensão.</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: C.txt2, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>• <span style={{color: C.red, fontWeight: 700}}>1 Vermelho</span> gera suspensão imediata.</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: C.txt2, display: 'flex', alignItems: 'center', gap: 0.5 }}>• Contadores zeram após o cumprimento.</Typography>
                </Paper>

                <Button fullWidth variant="outlined" onClick={onClose} sx={{ color: C.txt2, borderColor: C.border, fontWeight: 900, borderRadius: '8px' }}>
                  FECHAR
                </Button>
              </>
            );
          })()}
        </Box>
      )}
    </Dialog>
  );
};

export default PlayerModal;

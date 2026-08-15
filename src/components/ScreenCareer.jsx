// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';

// components/ScreenCareer.js — v3.0 (Redesenho completo + Proposta de Clube)
const ScreenCareer = ({ gameData, setGameData, formatMoney, showToast, setScreen }) => {
  const C   = THEME;
  const mp  = gameData.club?.managerProfile || {};
  const mgr = gameData.club?.manager || 'Treinador';

  const myRow   = gameData.table?.find(t => t.id === 'user') || {};
  const myPos   = (gameData.table?.findIndex(t => t.id === 'user') ?? -1) + 1;
  const total   = (mp.wins||0) + (mp.draws||0) + (mp.losses||0);
  const winPct  = total > 0 ? ((mp.wins||0) / total * 100).toFixed(0) : '0';
  const winPctSz= myRow.p > 0 ? ((myRow.w||0) / myRow.p * 100).toFixed(0) : '0';
  const initials= mgr.split(' ').map(w=>w[0]||'').join('').substring(0,2).toUpperCase();
  const exp     = mp.experience || 0;
  const level   = exp >= 100 ? 'Lendário' : exp >= 50 ? 'Experiente' : exp >= 20 ? 'Veterano' : exp >= 5 ? 'Intermediário' : 'Novato';
  const levelColor = exp >= 100 ? '#f59e0b' : exp >= 50 ? '#22c55e' : exp >= 20 ? '#3b82f6' : exp >= 5 ? '#8b5cf6' : C.txt3;
  const STYLE_ICONS = { Defensivo:'🛡️', Equilibrado:'⚖️', Ofensivo:'⚔️', Direto:'🎯' };
  const serieColor  = { A:'#16a34a', B:'#2563eb', C:'#d97706', D:'#9333ea' };
  const TeamIcon    = window.TeamIcon;

  // Proposta pendente no inbox
  const trashIds = new Set(gameData.trashMsgIds || []);
  const pendingOffer = (gameData.inbox || []).find(m =>
    m.actionData?.type === 'managerOffer' && !trashIds.has(m.id)
  );
  const [offerOpen, setOfferOpen] = React.useState(false);

  const handleAcceptOffer = () => {
    if (!pendingOffer) return;
    const action = pendingOffer.actionData;
    setGameData(prev => ({
      ...prev,
      pendingManagerTransfer: {
        accepted: true,
        offeringClub: action.offeringClub,
        offeredSalary: action.offeredSalary,
        acceptedAtRound: prev.round,
      },
      trashMsgIds: [...(prev.trashMsgIds || []), pendingOffer.id],
    }));
    showToast?.(`✅ Proposta aceita! Você assumirá o ${action.offeringClub.name} na próxima temporada.`, 'success');
    setOfferOpen(false);
  };

  const handleDeclineOffer = () => {
    if (!pendingOffer) return;
    setGameData(prev => ({
      ...prev,
      trashMsgIds: [...(prev.trashMsgIds || []), pendingOffer.id],
    }));
    showToast?.('Proposta recusada.', 'info');
    setOfferOpen(false);
  };

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 12 }}>

      {/* ══ HEADER HERO ═══════════════════════════════════════ */}
      <Box sx={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 55%, #0f2040 100%)',
        px: 1.8, pt: 4.8, pb: 2.4,
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow decorativo */}
        <Box sx={{ position:'absolute', top:-60, right:-40, width:180, height:180,
          borderRadius:'50%', bgcolor:'rgba(34,197,94,0.07)', filter:'blur(40px)', pointerEvents:'none' }}/>

        <Box sx={{ display:'flex', alignItems:'flex-start', gap:1.6 }}>
          {/* Avatar */}
          <Box sx={{
            width:72, height:72, borderRadius:'18px', flexShrink:0,
            background:'linear-gradient(135deg,#1e3a5f,#0f2040)',
            border:`2.5px solid ${levelColor}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 24px ${levelColor}50`,
          }}>
            <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1.8rem', lineHeight:1 }}>
              {initials || '👔'}
            </Typography>
          </Box>

          {/* Info principal */}
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography sx={{ color:'#f0f6fc', fontWeight:900, fontSize:'1.15rem',
              fontFamily:'"Nunito",sans-serif', lineHeight:1, mb:0.3 }}>
              {mgr}
            </Typography>
            <Typography sx={{ color:'rgba(255,255,255,0.55)', fontSize:'0.62rem', fontWeight:700, mb:0.8 }}>
              Treinador do {gameData.club?.name} · Série {gameData.serie}
            </Typography>
            {/* Tags */}
            <Box sx={{ display:'flex', gap:0.5, flexWrap:'wrap' }}>
              <Box sx={{ bgcolor:`${levelColor}20`, border:`1px solid ${levelColor}50`,
                borderRadius:'6px', px:0.8, py:0.2 }}>
                <Typography sx={{ color:levelColor, fontWeight:900, fontSize:'0.58rem' }}>
                  ⭐ {level}
                </Typography>
              </Box>
              {mp.nationality && (
                <Box sx={{ bgcolor:'rgba(56,139,253,0.12)', border:'1px solid rgba(56,139,253,0.3)',
                  borderRadius:'6px', px:0.8, py:0.2 }}>
                  <Typography sx={{ color:'#60a5fa', fontWeight:900, fontSize:'0.58rem' }}>
                    🌍 {mp.nationality}
                  </Typography>
                </Box>
              )}
              {mp.style && (
                <Box sx={{ bgcolor:'rgba(240,165,0,0.12)', border:'1px solid rgba(240,165,0,0.3)',
                  borderRadius:'6px', px:0.8, py:0.2 }}>
                  <Typography sx={{ color:C.gold, fontWeight:900, fontSize:'0.58rem' }}>
                    {STYLE_ICONS[mp.style]||'⚽'} {mp.style}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* OVR do time / posição */}
          <Box sx={{ textAlign:'center', flexShrink:0 }}>
            <Box sx={{ bgcolor:'rgba(255,255,255,0.06)', borderRadius:'12px', px:1.2, py:0.8,
              border:'1px solid rgba(255,255,255,0.1)' }}>
              <Typography sx={{ color:myPos<=4?C.green:myPos>=17?C.red:'#f0f6fc',
                fontWeight:900, fontSize:'1.6rem', lineHeight:1 }}>
                {myPos > 0 ? `${myPos}º` : '—'}
              </Typography>
              <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:'0.42rem',
                fontWeight:900, letterSpacing:0.8 }}>POSIÇÃO</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Barra XP ── */}
        <Box sx={{ mt:1.6 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
            <Typography sx={{ color:'rgba(255,255,255,0.5)', fontSize:'0.5rem', fontWeight:900, letterSpacing:1 }}>
              EXPERIÊNCIA
            </Typography>
            <Typography sx={{ color:levelColor, fontSize:'0.5rem', fontWeight:900 }}>
              {exp} XP
            </Typography>
          </Box>
          <Box sx={{ height:5, bgcolor:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
            <Box sx={{
              height:'100%', borderRadius:3,
              width:`${Math.min(100, (exp % 50) / 50 * 100)}%`,
              background:`linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`,
              transition:'width 0.6s ease',
              boxShadow:`0 0 8px ${levelColor}60`,
            }}/>
          </Box>
        </Box>
      </Box>

      {/* ── Proposta de clube pendente ── */}
      {pendingOffer && (
        <Box onClick={() => setOfferOpen(true)} sx={{
          mx:1.5, mt:1.5,
          background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.06))',
          border:'1.5px solid rgba(124,58,237,0.5)', borderRadius:'14px',
          px:1.4, py:1.1, cursor:'pointer', display:'flex', alignItems:'center', gap:1,
          boxShadow:'0 0 20px rgba(124,58,237,0.2)',
          '&:active':{ filter:'brightness(0.92)' },
          animation:'pulseOffer 2s ease-in-out infinite',
          '@keyframes pulseOffer':{
            '0%,100%':{ boxShadow:'0 0 20px rgba(124,58,237,0.2)' },
            '50%':{ boxShadow:'0 0 32px rgba(124,58,237,0.45)' },
          },
        }}>
          <Typography sx={{ fontSize:'1.5rem', lineHeight:1, flexShrink:0 }}>💼</Typography>
          <Box sx={{ flex:1, minWidth:0 }}>
            <Typography sx={{ color:'#c4b5fd', fontWeight:900, fontSize:'0.78rem', lineHeight:1 }}>
              PROPOSTA DE CLUBE
            </Typography>
            <Typography sx={{ color:'rgba(196,181,253,0.7)', fontSize:'0.58rem', fontWeight:700, mt:0.2,
              overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
              {pendingOffer.actionData?.offeringClub?.name} quer te contratar • toque para ver
            </Typography>
          </Box>
          <Typography sx={{ color:'#c4b5fd', fontSize:'1rem' }}>›</Typography>
        </Box>
      )}

      <Box sx={{ px:1.5, pt:1.5 }}>

        {/* ══ STATS DA TEMPORADA ════════════════════════════════ */}
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem',
          letterSpacing:2, mb:1 }}>TEMPORADA {gameData.season || 2026}</Typography>

        {/* Grid 2×3 */}
        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0.7, mb:1 }}>
          {[
            { l:'VITÓRIAS', v:myRow.w??0, c:C.green },
            { l:'EMPATES',  v:myRow.d??0, c:C.gold  },
            { l:'DERROTAS', v:myRow.l??0, c:C.red   },
          ].map((s,i) => (
            <Box key={i} sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px',
              py:1.2, textAlign:'center' }}>
              <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1.3rem', lineHeight:1 }}>{s.v}</Typography>
              <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.44rem', letterSpacing:0.5, mt:0.3 }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:0.7, mb:1.5 }}>
          {[
            { l:'JOGOS', v:myRow.p??0, c:C.txt1 },
            { l:'APRV %', v:`${winPctSz}%`, c:parseInt(winPctSz)>=60?C.green:parseInt(winPctSz)>=40?C.gold:C.red },
            { l:'PONTOS', v:myRow.pts??0, c:C.txt1 },
            { l:'SALDO',  v:((myRow.gf??0)-(myRow.ga??0)>0?'+':'')+((myRow.gf??0)-(myRow.ga??0)),
              c:(myRow.gf??0)-(myRow.ga??0)>=0?C.green:C.red },
          ].map((s,i) => (
            <Box key={i} sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'10px',
              py:0.9, textAlign:'center' }}>
              <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{s.v}</Typography>
              <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.42rem', mt:0.2 }}>{s.l}</Typography>
            </Box>
          ))}
        </Box>

        {/* ══ CARREIRA ACUMULADA ════════════════════════════════ */}
        <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem',
          letterSpacing:2, mb:1 }}>CARREIRA ACUMULADA</Typography>

        <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px',
          overflow:'hidden', mb:1.5 }}>
          {/* Barra de aproveitamento */}
          <Box sx={{ px:1.4, pt:1.2, pb:0.8 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.6 }}>
              <Typography sx={{ color:C.txt2, fontWeight:700, fontSize:'0.68rem' }}>
                Aproveitamento de carreira
              </Typography>
              <Typography sx={{ color:parseInt(winPct)>=60?C.green:parseInt(winPct)>=40?C.gold:C.red,
                fontWeight:900, fontSize:'0.78rem' }}>
                {winPct}%
              </Typography>
            </Box>
            <Box sx={{ height:8, bgcolor:C.bgDark||'#f1f5f9', borderRadius:4, overflow:'hidden', mb:0.3 }}>
              <Box sx={{
                height:'100%', borderRadius:4,
                width:`${winPct}%`,
                bgcolor:parseInt(winPct)>=60?C.green:parseInt(winPct)>=40?C.gold:C.red,
                transition:'width 0.6s',
              }}/>
            </Box>
            <Box sx={{ display:'flex', justifyContent:'space-between' }}>
              <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>
                {total} jogo{total!==1?'s':''}
              </Typography>
              <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>
                {mp.seasonsTotal||0} temporada{(mp.seasonsTotal||0)!==1?'s':''}
              </Typography>
            </Box>
          </Box>

          {/* Grid V/E/D/XP */}
          <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
            borderTop:`1px solid ${C.border}` }}>
            {[
              { l:'V', v:mp.wins??0,       c:C.green, border:true  },
              { l:'E', v:mp.draws??0,      c:C.gold,  border:true  },
              { l:'D', v:mp.losses??0,     c:C.red,   border:true  },
              { l:'XP', v:mp.experience??0,c:levelColor,border:false },
            ].map((s,i) => (
              <Box key={i} sx={{ py:1.2, textAlign:'center',
                borderRight:s.border?`1px solid ${C.border}`:'none' }}>
                <Typography sx={{ color:s.c, fontWeight:900, fontSize:'1.1rem', lineHeight:1 }}>{s.v}</Typography>
                <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.44rem', mt:0.2 }}>{s.l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══ MORAL + TORCIDA ═══════════════════════════════════ */}
        {(gameData.morale !== undefined || gameData.club?.fanLoyalty != null) && (
          <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0.8, mb:1.5 }}>
            {gameData.morale !== undefined && (() => {
              const m = gameData.morale ?? 60;
              const mc = m>=75?C.green:m>=50?C.gold:C.red;
              const ml = m>=80?'Excelente':m>=65?'Bom':m>=50?'Regular':m>=35?'Baixo':'Crítico';
              return (
                <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', p:1.2 }}>
                  <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5, mb:0.8 }}>
                    MORAL
                  </Typography>
                  <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.6 }}>
                    <Typography sx={{ color:mc, fontWeight:900, fontSize:'1rem' }}>
                      {m>=80?'🔥':m>=65?'😊':m>=50?'😐':m>=35?'😟':'😡'}
                    </Typography>
                    <Typography sx={{ color:mc, fontWeight:900, fontSize:'0.8rem' }}>{ml}</Typography>
                  </Box>
                  <Box sx={{ height:5, bgcolor:C.bgDark||'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                    <Box sx={{ height:'100%', width:`${m}%`, bgcolor:mc, borderRadius:3 }}/>
                  </Box>
                  <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700, mt:0.4 }}>{m}/100</Typography>
                </Box>
              );
            })()}
            {gameData.club?.fanLoyalty != null && (() => {
              const fl = gameData.club.fanLoyalty;
              const fc = fl>=75?C.green:fl>=50?C.gold:C.red;
              const fl_ = fl>=80?'Fanática':fl>=65?'Fiel':fl>=45?'Dividida':fl>=25?'Insatisfeita':'Revoltada';
              return (
                <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'12px', p:1.2 }}>
                  <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.48rem', letterSpacing:1.5, mb:0.8 }}>
                    TORCIDA
                  </Typography>
                  <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.6 }}>
                    <Typography sx={{ color:fc, fontWeight:900, fontSize:'1rem' }}>👥</Typography>
                    <Typography sx={{ color:fc, fontWeight:900, fontSize:'0.8rem' }}>{fl_}</Typography>
                  </Box>
                  <Box sx={{ height:5, bgcolor:C.bgDark||'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                    <Box sx={{ height:'100%', width:`${fl}%`, bgcolor:fc, borderRadius:3 }}/>
                  </Box>
                  <Typography sx={{ color:C.txt3, fontSize:'0.44rem', fontWeight:700, mt:0.4 }}>{fl}/100</Typography>
                </Box>
              );
            })()}
          </Box>
        )}

        {/* ══ HISTÓRICO DE TEMPORADAS ═══════════════════════════ */}
        {(gameData.careerHistory || []).length > 0 && (() => {
          const hist = [...(gameData.careerHistory || [])].reverse();
          return (
            <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.5 }}>
              <Box sx={{ px:1.4, py:1, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:0.8 }}>
                <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>📅</Typography>
                <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.62rem', letterSpacing:0.8 }}>
                  HISTÓRICO DE TEMPORADAS
                </Typography>
              </Box>
              {hist.map((entry, i) => {
                const sc   = serieColor[entry.serie] || C.txt2;
                const icon = entry.position===1?'🏆':entry.position<=4?'🟢':entry.position>=17?'🔴':'⚪';
                const pct  = (entry.wins||0)+(entry.draws||0)+(entry.losses||0) > 0
                  ? (entry.wins / ((entry.wins||0)+(entry.draws||0)+(entry.losses||0)) * 100).toFixed(0) : 0;
                return (
                  <Box key={i} sx={{ display:'flex', alignItems:'center', gap:1,
                    px:1.4, py:0.85, borderBottom: i<hist.length-1?`1px solid ${C.border}`:'none' }}>
                    {/* Série + ano */}
                    <Box sx={{ minWidth:44, textAlign:'center' }}>
                      <Box sx={{ bgcolor:`${sc}18`, border:`1px solid ${sc}40`, borderRadius:'6px', px:0.5, py:0.2, mb:0.2 }}>
                        <Typography sx={{ color:sc, fontWeight:900, fontSize:'0.58rem', lineHeight:1 }}>S{entry.serie}</Typography>
                      </Box>
                      <Typography sx={{ color:C.txt3, fontSize:'0.48rem', fontWeight:700 }}>{entry.season}</Typography>
                    </Box>
                    {/* Posição */}
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.4, minWidth:38 }}>
                      <Typography sx={{ fontSize:'0.75rem' }}>{icon}</Typography>
                      <Typography sx={{ color:entry.position===1?C.gold:entry.position<=4?C.green:entry.position>=17?C.red:C.txt1,
                        fontWeight:900, fontSize:'0.82rem' }}>{entry.position}º</Typography>
                    </Box>
                    {/* Stats */}
                    <Box sx={{ flex:1 }}>
                      <Box sx={{ display:'flex', gap:0.6, mb:0.3 }}>
                        <Typography sx={{ color:C.green,  fontWeight:900, fontSize:'0.62rem' }}>{entry.wins}V</Typography>
                        <Typography sx={{ color:C.gold,   fontWeight:900, fontSize:'0.62rem' }}>{entry.draws}E</Typography>
                        <Typography sx={{ color:C.red,    fontWeight:900, fontSize:'0.62rem' }}>{entry.losses}D</Typography>
                        <Typography sx={{ color:C.txt3,   fontWeight:700, fontSize:'0.62rem' }}>{entry.pts}pts</Typography>
                      </Box>
                      {/* Barra de aproveitamento mini */}
                      <Box sx={{ height:3, bgcolor:C.border, borderRadius:2, overflow:'hidden', width:'80%' }}>
                        <Box sx={{ height:'100%', width:`${pct}%`,
                          bgcolor:parseInt(pct)>=60?C.green:parseInt(pct)>=40?C.gold:C.red, borderRadius:2 }}/>
                      </Box>
                    </Box>
                    {/* Copa */}
                    {entry.cupResult === 'champion' && (
                      <Typography sx={{ fontSize:'0.9rem', flexShrink:0 }}>🏆</Typography>
                    )}
                    {/* Dinheiro */}
                    {entry.money > 0 && formatMoney && (
                      <Typography sx={{ color:C.txt3, fontSize:'0.5rem', fontWeight:700, textAlign:'right', flexShrink:0 }}>
                        {formatMoney(entry.money)}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          );
        })()}

        {/* ══ H2H ══════════════════════════════════════════════ */}
        {gameData.h2hHistory && Object.keys(gameData.h2hHistory).length > 0 && (() => {
          const entries = Object.entries(gameData.h2hHistory)
            .map(([name,rec]) => ({ name,...rec, total:(rec.w||0)+(rec.d||0)+(rec.l||0) }))
            .filter(e=>e.total>0).sort((a,b)=>b.total-a.total).slice(0,6);
          if (!entries.length) return null;
          return (
            <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', mb:1.5 }}>
              <Box sx={{ px:1.4, py:1, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:0.8 }}>
                <Typography sx={{ fontSize:'1rem', lineHeight:1 }}>⚔️</Typography>
                <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.62rem', letterSpacing:0.8 }}>CONFRONTOS DIRETOS</Typography>
              </Box>
              {entries.map((e,i) => {
                const tot  = e.total;
                const wPct = tot ? Math.round(e.w/tot*100) : 0;
                const wc   = e.w>e.l?C.green:e.l>e.w?C.red:C.yellow;
                return (
                  <Box key={e.name} sx={{ px:1.4, py:0.85, borderBottom:i<entries.length-1?`1px solid ${C.border}`:'none' }}>
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:0.4 }}>
                      <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.72rem',
                        overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:140 }}>
                        {e.name}
                      </Typography>
                      <Box sx={{ display:'flex', gap:0.4, flexShrink:0 }}>
                        {[{v:e.w,c:C.green,l:'V'},{v:e.d,c:C.yellow,l:'E'},{v:e.l,c:C.red,l:'D'}].map((s,j)=>(
                          <Box key={j} sx={{ bgcolor:`${s.c}15`, borderRadius:'4px', px:0.5, py:0.1 }}>
                            <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.58rem' }}>{s.v}{s.l}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ height:4, bgcolor:C.border, borderRadius:2, overflow:'hidden' }}>
                      <Box sx={{ height:'100%', width:`${wPct}%`, bgcolor:wc, borderRadius:2 }}/>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          );
        })()}

        {/* ══ COPA DO BRASIL ════════════════════════════════════ */}
        {gameData.cups?.copaBrasil && (
          <Box sx={{ bgcolor:C.card, border:`1px solid ${C.border}`, borderRadius:'14px', p:1.4, mb:1.5 }}>
            <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.5rem', letterSpacing:2, mb:0.8 }}>
              🏆 COPA DO BRASIL
            </Typography>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Typography sx={{ color:C.txt2, fontSize:'0.75rem', fontWeight:700 }}>
                {gameData.cups.copaBrasil.phaseLabel || 'Em andamento'}
              </Typography>
              <Typography sx={{
                color: gameData.cups.copaBrasil.status==='champion'?C.gold:
                       gameData.cups.copaBrasil.status==='eliminated'?C.red:C.green,
                fontWeight:900, fontSize:'0.75rem',
              }}>
                {gameData.cups.copaBrasil.status==='champion'?'🏆 CAMPEÃO!':
                 gameData.cups.copaBrasil.status==='eliminated'?'❌ Eliminado':'✅ Ativo'}
              </Typography>
            </Box>
            {(gameData.cups.copaBrasil.totalPrize||0)>0 && formatMoney && (
              <Typography sx={{ color:C.green, fontSize:'0.62rem', fontWeight:700, mt:0.4 }}>
                💰 Premiação acumulada: {formatMoney(gameData.cups.copaBrasil.totalPrize)}
              </Typography>
            )}
          </Box>
        )}

      </Box>

      {/* ══ MODAL: PROPOSTA DE CLUBE ══════════════════════════ */}
      <Dialog open={offerOpen} onClose={() => setOfferOpen(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: {
          bgcolor: C.bg, borderRadius:'18px',
          border:'2px solid rgba(124,58,237,0.5)',
          boxShadow:'0 12px 48px rgba(124,58,237,0.3)',
          backgroundImage:'none', m:1.5,
        }}}
        BackdropProps={{ sx:{ backdropFilter:'blur(5px)', bgcolor:'rgba(0,0,0,0.55)' } }}
      >
        {pendingOffer && (() => {
          const offer = pendingOffer.actionData;
          const club  = offer.offeringClub || {};
          const sc    = serieColor[club.serie] || C.txt2;
          return (
            <Box>
              {/* Header */}
              <Box sx={{ background:'linear-gradient(135deg,#4c1d95,#5b21b6)',
                px:2, py:1.8, borderRadius:'16px 16px 0 0', textAlign:'center' }}>
                <Typography sx={{ fontSize:'2.5rem', lineHeight:1, mb:0.5 }}>💼</Typography>
                <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1rem', lineHeight:1 }}>
                  PROPOSTA DE CONTRATO
                </Typography>
                <Typography sx={{ color:'rgba(255,255,255,0.6)', fontSize:'0.6rem', fontWeight:700, mt:0.3 }}>
                  Próxima temporada
                </Typography>
              </Box>

              {/* Corpo */}
              <Box sx={{ px:2, py:2 }}>
                {/* Clube */}
                <Box sx={{ display:'flex', alignItems:'center', gap:1.2, mb:1.8,
                  bgcolor:`${sc}0d`, border:`1.5px solid ${sc}35`, borderRadius:'12px', px:1.4, py:1.1 }}>
                  {TeamIcon
                    ? React.createElement(TeamIcon, { name:club.name, size:42 })
                    : <Box sx={{ width:42, height:42, borderRadius:'50%', bgcolor:sc+'30',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Typography sx={{ color:sc, fontWeight:900, fontSize:'0.8rem' }}>
                          {(club.name||'?').substring(0,3).toUpperCase()}
                        </Typography>
                      </Box>
                  }
                  <Box>
                    <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'1rem', lineHeight:1 }}>
                      {club.name}
                    </Typography>
                    <Box sx={{ display:'flex', gap:0.5, mt:0.3 }}>
                      <Box sx={{ bgcolor:`${sc}20`, border:`1px solid ${sc}40`, borderRadius:'5px', px:0.7, py:0.1 }}>
                        <Typography sx={{ color:sc, fontWeight:900, fontSize:'0.55rem' }}>Série {club.serie}</Typography>
                      </Box>
                      {club.strength && (
                        <Box sx={{ bgcolor:`${C.blue}15`, border:`1px solid ${C.blue}35`, borderRadius:'5px', px:0.7, py:0.1 }}>
                          <Typography sx={{ color:C.blue, fontWeight:900, fontSize:'0.55rem' }}>
                            ⚡ Força {club.strength}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Detalhes */}
                <Box sx={{ bgcolor:C.cardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:1.2, mb:1.6 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', py:0.5,
                    borderBottom:`1px solid ${C.border}` }}>
                    <Typography sx={{ color:C.txt2, fontSize:'0.7rem', fontWeight:700 }}>Salário</Typography>
                    <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.78rem' }}>
                      {formatMoney ? formatMoney(offer.offeredSalary) : `R$ ${(offer.offeredSalary||0).toLocaleString('pt-BR')}`}/rodada
                    </Typography>
                  </Box>
                  <Box sx={{ display:'flex', justifyContent:'space-between', py:0.5 }}>
                    <Typography sx={{ color:C.txt2, fontSize:'0.7rem', fontWeight:700 }}>Início</Typography>
                    <Typography sx={{ color:C.txt1, fontWeight:900, fontSize:'0.7rem' }}>
                      Temporada {(gameData.season||2026) + 1}
                    </Typography>
                  </Box>
                </Box>

                <Typography sx={{ color:C.txt3, fontSize:'0.6rem', fontWeight:700,
                  textAlign:'center', mb:1.6, lineHeight:1.5 }}>
                  Ao aceitar, seu histórico e conquistas são preservados. A transferência ocorre na virada de temporada.
                </Typography>

                {/* Botões */}
                <Box sx={{ display:'flex', gap:0.8 }}>
                  <Box onClick={handleDeclineOffer} sx={{
                    flex:1, borderRadius:'10px', py:1.2, textAlign:'center', cursor:'pointer',
                    bgcolor:C.cardAlt, border:`1.5px solid ${C.border}`,
                    '&:active':{ filter:'brightness(0.9)' },
                  }}>
                    <Typography sx={{ color:C.txt2, fontWeight:900, fontSize:'0.75rem' }}>❌ Recusar</Typography>
                  </Box>
                  <Box onClick={handleAcceptOffer} sx={{
                    flex:2, borderRadius:'10px', py:1.2, textAlign:'center', cursor:'pointer',
                    background:'linear-gradient(135deg,#6d28d9,#5b21b6)',
                    boxShadow:'0 0 20px rgba(109,40,217,0.4)',
                    '&:active':{ filter:'brightness(0.88)' },
                  }}>
                    <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.82rem' }}>✅ Aceitar Proposta</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default ScreenCareer;

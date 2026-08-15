// MenuPrincipal — Versão 1: "Estádio em Dia de Jogo"
// Fundo branco gelo, header com grama estilizada, cards com textura de campo
// Tipografia: Cinzel para títulos, Nunito para corpo
// Paleta: Verde gramado (#2d6a2d), branco, detalhes dourados

import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import { CalendarEngine } from '../engines/CalendarEngine.js';
import { FinanceEngine } from '../engines/engine_finances.js';
import { resolveMatchInfo } from '../utils/matchDateUtils.js';
import { APP_NAME, APP_VERSION_LABEL } from '../config/appMeta.js';
import { TeamIcon } from '../data/database_branding.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';

const C_V1 = {
  bg:       '#f9fafb',
  card:     '#ffffff',
  cardAlt:  '#f0fdf4',
  border:   '#d1fae5',
  grass:    '#16a34a',
  grassDk:  '#15803d',
  gold:     '#d97706',
  ink:      '#052e16',
  ink2:     '#166534',
  ink3:     '#4b7a5c',
  red:      '#dc2626',
  blue:     '#1d4ed8',
  yellow:   '#fbbf24',
  shadow:   '0 2px 16px rgba(22,163,74,0.10)',
};

const MenuPrincipal = ({ gameData, setScreen, formatMoney, handleGoToNextMatch }) => {
  const C = THEME;

  const club      = gameData.club || {};
  const myRow     = gameData.table?.find(t => t.id === 'user') || {};
  const myPos     = (gameData.table?.findIndex(t => t.id === 'user') ?? -1) + 1;
  const seasonOver = gameData.round >= (gameData.fixtures?.length ?? 0);

  const calendarSlot  = !seasonOver ? (gameData.calendar || [])[gameData.round] : null;
  const isCalendarCup = calendarSlot?.type === 'cup';
  const nextCupInfo   = (isCalendarCup && CalendarEngine?.getCupMatchForCalendarSlot)
    ? CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calendarSlot)
    : { hasCupMatch: false };
  const hasCup      = nextCupInfo?.hasCupMatch;
  const cupOpponent = hasCup && nextCupInfo.tie
    ? (nextCupInfo.tie.home?.isPlayer ? nextCupInfo.tie.away : nextCupInfo.tie.home) : null;

  const _leagueIdx = isCalendarCup ? -1 : (calendarSlot?.leagueIdx ?? gameData.round);
  const nextMatch  = (!seasonOver && !isCalendarCup && _leagueIdx >= 0)
    ? gameData.fixtures?.[_leagueIdx]?.find(m => m.home?.isPlayer || m.away?.isPlayer) : null;
  const opponent  = nextMatch ? (nextMatch.home?.isPlayer ? nextMatch.away : nextMatch.home) : null;
  const isHome    = nextMatch?.home?.isPlayer;
  const oppPos    = opponent ? (gameData.table?.findIndex(t => t.name === opponent?.name) ?? -1) + 1 : 0;
  const oppRow    = gameData.table?.find(t => t.name === opponent?.name) || {};
  const matchDateInfo = !seasonOver ? resolveMatchInfo(gameData, gameData.round) : null;

  const money    = club.money || 0;
  const wage     = club.wage  || 0;
  const fmoney   = v => formatMoney ? formatMoney(v) : `R$${(v/1e6).toFixed(1)}M`;
  const finStatus = FinanceEngine?.getFinancialStatus ? FinanceEngine.getFinancialStatus(gameData) : null;
  const inbox    = gameData.inbox || [];
  const unread   = inbox.filter(m => !m.read);
  const academy  = gameData.academy || [];
  const readyAcademy = academy.filter(p => (p.age||0) >= 18).length;
  const players  = gameData.players || [];
  const injured  = players.filter(p => !!p.injury).length;
  const suspended = players.filter(p =>
    DisciplineEngine?.isPlayerSuspended
      ? DisciplineEngine.isPlayerSuspended(p, gameData.round) : false).length;
  const startersCount = players.filter(p => p.isStarting).length;
  const needsLineup   = gameData.round === 0 && startersCount < 11;
  const serieColor    = { A: C_V1.grass, B: '#d97706', C: '#2563eb', D: '#7c3aed' }[gameData.serie] || C_V1.grass;

  const recentForm = [];
  for (let r = gameData.round - 1; r >= 0 && recentForm.length < 5; r--) {
    const m = (gameData.fixtures?.[r] || []).find(mx => mx.home?.isPlayer || mx.away?.isPlayer);
    if (!m || !m.played || !m.result) continue;
    const [hg, ag] = (m.result || '0-0').split('-').map(n => parseInt(n) || 0);
    const myG = m.home?.isPlayer ? hg : ag;
    const opG = m.home?.isPlayer ? ag : hg;
    recentForm.push(myG > opG ? 'V' : myG < opG ? 'D' : 'E');
  }

  const pri = club.colorPrimary || C_V1.grass;

  const CARDS = [
    { id:'table',    emoji:'📊', label:'Classificação',    sub: myPos > 0 ? `${myPos}º lugar · ${myRow.pts||0} pts` : 'Ver tabela',                   color: C_V1.grass,   screen:'table',    badge: null },
    { id:'inbox',    emoji:'📬', label:'Mensagens',        sub: unread.length > 0 ? `${unread.length} nova(s)` : 'Tudo lido',                          color: '#0891b2',    screen:'inbox',    badge: unread.length || null },
    { id:'lineup',   emoji:'📋', label:'Escalação',        sub: needsLineup ? '⚠️ Escale o time!' : 'Táticas e formação',                              color: needsLineup ? C_V1.red : C_V1.grass, screen:'lineup', badge: needsLineup ? '!' : null, pulse: needsLineup },
    { id:'medical',  emoji:'🏥', label:'DM',               sub: (injured+suspended) > 0 ? `${injured} les. · ${suspended} susp.` : 'Elenco 100%',      color: injured+suspended > 0 ? C_V1.red : C_V1.ink3, screen:'medical', badge: injured+suspended > 0 ? injured+suspended : null },
    { id:'copas',    emoji:'🏆', label:'Copas',            sub: (() => { const c=gameData.cups?.copaBrasil; if(!c) return 'Sem copas'; if(c.status==='champion') return '🎉 Campeão!'; if(c.status==='eliminated') return 'Eliminado'; return c.phaseLabel||'Ativa'; })(), color: C_V1.gold, screen:'copas', badge: null },
    { id:'academy',  emoji:'⚽', label:'Base',             sub: readyAcademy > 0 ? `${readyAcademy} pronto(s) ⭐` : `${academy.length} em formação`,    color: '#7c3aed',    screen:'academy',  badge: readyAcademy || null },
    { id:'matches',  emoji:'📅', label:'Calendário',       sub: `Rod. ${gameData.round}/${gameData.fixtures?.length||38}`,                             color: '#0284c7',    screen:'matches',  badge: null },
    { id:'career',   emoji:'🏅', label:'Carreira',         sub: `${club.managerProfile?.wins||0}V ${club.managerProfile?.draws||0}E ${club.managerProfile?.losses||0}D`, color: C_V1.gold, screen:'career', badge: null },
    { id:'stadium',  emoji:'🏟️', label:'Estádio',          sub: club.stadium?.underConstruction > 0 ? `🏗️ Obras: ${club.stadium.underConstruction}rod` : `${(club.stadium?.capacity||0).toLocaleString('pt-BR')} lug.`, color: '#0891b2', screen:'stadium', badge: null },
    { id:'market',   emoji:'🛒', label:'Mercado',          sub: `${(gameData.market||[]).length} disponíveis`,                                         color: '#16a34a',    screen:'market',   badge: null },
    { id:'finances', emoji:'💰', label:'Finanças',         sub: finStatus ? finStatus.label : fmoney(money),                                           color: finStatus?.status==='critico' ? C_V1.red : C_V1.grass, screen:'finances', badge: null },
    { id:'about',    emoji:'ℹ️', label:'Sobre',            sub: `${APP_VERSION_LABEL} · ${APP_NAME}`,                                                          color: C_V1.ink3,    screen:'about',    badge: null },
  ];

  return (
    <Box sx={{ bgcolor: C_V1.bg, minHeight: '100vh', pb: 10, fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @keyframes v1-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)} 60%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes v1-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── HEADER: campo de futebol estilizado ── */}
      <Box sx={{
        background: `linear-gradient(180deg, ${C_V1.grassDk} 0%, ${C_V1.grass} 100%)`,
        pt: 5, pb: 0, position: 'relative', overflow: 'hidden',
      }}>
        {/* Linhas do campo decorativas */}
        <Box sx={{ position:'absolute', inset:0, opacity:0.12, pointerEvents:'none' }}>
          <Box sx={{ position:'absolute', left:'50%', top:0, bottom:0, width:'1px', bgcolor:'#fff' }} />
          <Box sx={{ position:'absolute', left:'50%', top:'20%', width:60, height:60, borderRadius:'50%', border:'1px solid #fff', transform:'translate(-50%,-50%)' }} />
          <Box sx={{ position:'absolute', left:0, top:0, bottom:0, width:'18%', borderRight:'1px solid #fff' }} />
          <Box sx={{ position:'absolute', right:0, top:0, bottom:0, width:'18%', borderLeft:'1px solid #fff' }} />
        </Box>

        <Box sx={{ px:2, pb:2, position:'relative', zIndex:1 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1.5 }}>
            {/* Escudo */}
            <Box sx={{
              width:58, height:58, borderRadius:'16px', flexShrink:0,
              bgcolor:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.4)',
              backdropFilter:'blur(4px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {TeamIcon && club.name
                ? React.createElement(TeamIcon, { name: club.name, size: 40 })
                : <Typography sx={{ fontSize:'1.8rem' }}>⚽</Typography>}
            </Box>

            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography sx={{
                color:'#fff', fontWeight:900, fontSize:'1.15rem',
                fontFamily:'"Cinzel", serif', lineHeight:1.1,
                textShadow:'0 2px 8px rgba(0,0,0,0.4)',
                overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
              }}>{club.name || 'Meu Clube'}</Typography>
              <Typography sx={{ color:'rgba(255,255,255,0.75)', fontSize:'0.6rem', fontWeight:700, mt:0.3 }}>
                👔 {club.manager} · {club.managerProfile?.style || 'Equilibrado'}
              </Typography>
            </Box>

            {/* Posição — grande destaque */}
            <Box sx={{
              bgcolor:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.35)',
              borderRadius:'14px', px:1.2, py:0.6, textAlign:'center', backdropFilter:'blur(4px)',
            }}>
              <Typography sx={{
                color: myPos <= 4 ? '#fbbf24' : myPos >= 17 ? '#fca5a5' : '#fff',
                fontWeight:900, fontSize:'1.8rem', lineHeight:1, fontFamily:'"Cinzel",serif',
              }}>{myPos > 0 ? myPos : '—'}</Typography>
              <Typography sx={{ color:'rgba(255,255,255,0.6)', fontSize:'0.38rem', fontWeight:800, letterSpacing:1 }}>POSIÇÃO</Typography>
            </Box>
          </Box>

          {/* Stats faixa */}
          <Box sx={{ display:'flex', gap:0.7, overflowX:'auto', pb:0.3 }}>
            {[
              { v: fmoney(money), l:'Caixa',    c: money>wage*8?'#bbf7d0':money>wage*3?'#fef08a':'#fecaca' },
              { v: fmoney(wage),  l:'Folha/R',  c:'#fecaca' },
              { v: `${myRow.gf||0}×${myRow.ga||0}`, l:'Gols', c:'#e0f2fe' },
              { v: `${myRow.pts||0}pts`, l:'Pontos', c:'#fef9c3' },
            ].map((s,i) => (
              <Box key={i} sx={{
                flexShrink:0, bgcolor:'rgba(255,255,255,0.18)', backdropFilter:'blur(4px)',
                border:'1px solid rgba(255,255,255,0.3)', borderRadius:'10px',
                px:1, py:0.5, textAlign:'center', minWidth:62,
              }}>
                <Typography sx={{ color:s.c, fontWeight:900, fontSize:'0.65rem', lineHeight:1.1 }}>{s.v}</Typography>
                <Typography sx={{ color:'rgba(255,255,255,0.55)', fontWeight:700, fontSize:'0.38rem', letterSpacing:.5 }}>{s.l}</Typography>
              </Box>
            ))}
            {/* Forma */}
            <Box sx={{
              flexShrink:0, bgcolor:'rgba(255,255,255,0.18)', backdropFilter:'blur(4px)',
              border:'1px solid rgba(255,255,255,0.3)', borderRadius:'10px',
              px:0.8, py:0.5, display:'flex', alignItems:'center', gap:0.3,
            }}>
              {recentForm.length === 0
                ? <Typography sx={{ color:'rgba(255,255,255,0.5)', fontSize:'0.56rem', px:0.5 }}>—</Typography>
                : recentForm.map((r,i) => (
                  <Box key={i} sx={{
                    width:15, height:15, borderRadius:'50%',
                    bgcolor: r==='V'?'#22c55e':r==='D'?'#ef4444':'#fbbf24',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border:'1px solid rgba(255,255,255,0.3)',
                  }}>
                    <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.38rem' }}>{r}</Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        </Box>

        {/* Gramado curvo na base do header */}
        <Box sx={{ height:18, bgcolor:C_V1.bg, borderRadius:'40px 40px 0 0', position:'relative', zIndex:2 }} />
      </Box>

      {/* ── ONBOARDING ── */}
      {needsLineup && (
        <Box onClick={() => setScreen('lineup')} sx={{
          mx:2, mb:1.2, bgcolor:'#fef2f2', border:'1.5px solid #fca5a5',
          borderRadius:'14px', px:1.5, py:1, display:'flex', alignItems:'center', gap:1,
          cursor:'pointer', animation:'v1-pulse 2s infinite',
        }}>
          <Typography sx={{ fontSize:'1.3rem' }}>📋</Typography>
          <Box sx={{ flex:1 }}>
            <Typography sx={{ color:C_V1.red, fontWeight:900, fontSize:'0.78rem' }}>Escale o time antes de jogar!</Typography>
            <Typography sx={{ color:'#9ca3af', fontSize:'0.58rem', fontWeight:700 }}>Toque para abrir a prancheta →</Typography>
          </Box>
        </Box>
      )}

      {/* ── PRÓXIMA PARTIDA ── */}
      <Box sx={{ px:2, mb:1.5 }}>
        <Typography sx={{
          color:C_V1.grass, fontWeight:900, fontSize:'0.5rem', letterSpacing:2,
          fontFamily:'"Cinzel",serif', mb:0.8, display:'flex', alignItems:'center', gap:0.5,
        }}>
          <Box component="span" sx={{ display:'inline-block', width:16, height:2, bgcolor:C_V1.grass, borderRadius:1 }} />
          PRÓXIMA PARTIDA
          <Box component="span" sx={{ display:'inline-block', flex:1, height:2, bgcolor:`${C_V1.grass}30`, borderRadius:1 }} />
        </Typography>

        {seasonOver ? (
          <Box onClick={() => setScreen('table')} sx={{
            bgcolor:C_V1.card, border:`1.5px solid ${C_V1.border}`, borderRadius:'14px',
            px:2, py:1.5, display:'flex', alignItems:'center', gap:1.2, cursor:'pointer',
            boxShadow: C_V1.shadow,
          }}>
            <Typography sx={{ fontSize:'2rem' }}>🏁</Typography>
            <Box>
              <Typography sx={{ color:C_V1.grass, fontWeight:900, fontSize:'0.9rem' }}>Temporada Encerrada!</Typography>
              <Typography sx={{ color:C_V1.ink3, fontSize:'0.6rem', fontWeight:700 }}>Ver tabela final →</Typography>
            </Box>
          </Box>
        ) : (nextMatch || (hasCup && cupOpponent)) ? (
          <Box onClick={() => setScreen('next_match')} sx={{
            bgcolor:C_V1.card, border:`2px solid ${serieColor}40`,
            borderRadius:'16px', overflow:'hidden', cursor:'pointer',
            boxShadow:`0 4px 24px ${serieColor}15`,
            '&:active': { transform:'scale(0.98)' }, transition:'transform .15s',
          }}>
            {/* Faixa competição */}
            <Box sx={{
              background:`linear-gradient(90deg, ${serieColor}, ${serieColor}cc)`,
              px:1.5, py:0.55, display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.6rem', letterSpacing:.5 }}>
                {hasCup ? `🏆 Copa · ${nextCupInfo.label||''}` : `🏟️ Série ${gameData.serie} · Rodada ${gameData.round+1}/${gameData.fixtures?.length||38}`}
              </Typography>
              <Typography sx={{ color:'rgba(255,255,255,0.7)', fontSize:'0.5rem', fontWeight:700 }}>
                {isHome ? '🏠 Mandante' : '✈️ Visitante'}
              </Typography>
            </Box>

            <Box sx={{ px:2, py:1.5, display:'flex', alignItems:'center', gap:1.5 }}>
              {/* Time casa */}
              <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.5 }}>
                <Box sx={{
                  width:50, height:50, borderRadius:'14px',
                  bgcolor:`${serieColor}12`, border:`1.5px solid ${serieColor}25`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {TeamIcon ? React.createElement(TeamIcon, { name: hasCup ? (nextCupInfo.tie?.home?.isPlayer ? club.name : cupOpponent?.name) : (isHome ? club.name : opponent?.name), size:36 })
                    : <Typography sx={{ fontSize:'1.5rem' }}>⚽</Typography>}
                </Box>
                <Typography sx={{ color:C_V1.ink, fontWeight:900, fontSize:'0.62rem', textAlign:'center', lineHeight:1.1 }}>
                  {hasCup ? (nextCupInfo.tie?.home?.isPlayer ? club.name : cupOpponent?.name) : (isHome ? club.name : opponent?.name)}
                </Typography>
                <Typography sx={{ color:C_V1.ink3, fontSize:'0.48rem', fontWeight:700 }}>
                  {isHome ? `${myPos}º · ${myRow.pts||0}pts` : (oppPos > 0 ? `${oppPos}º · ${oppRow.pts||0}pts` : '—')}
                </Typography>
              </Box>

              {/* VS */}
              <Box sx={{ textAlign:'center', flexShrink:0 }}>
                <Box sx={{
                  bgcolor:C_V1.cardAlt, border:`1.5px solid ${C_V1.border}`,
                  borderRadius:'12px', px:1.2, py:0.6,
                }}>
                  <Typography sx={{ color:C_V1.grass, fontWeight:900, fontSize:'1rem', letterSpacing:3, fontFamily:'"Cinzel",serif' }}>VS</Typography>
                </Box>
                {matchDateInfo?.fullStr && (
                  <Typography sx={{ color:C_V1.ink3, fontSize:'0.44rem', fontWeight:700, mt:0.5 }}>
                    {matchDateInfo.fullStr}
                  </Typography>
                )}
              </Box>

              {/* Time visitante */}
              <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.5 }}>
                <Box sx={{
                  width:50, height:50, borderRadius:'14px',
                  bgcolor:`${C_V1.ink3}10`, border:`1.5px solid ${C_V1.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {TeamIcon ? React.createElement(TeamIcon, { name: hasCup ? (nextCupInfo.tie?.home?.isPlayer ? cupOpponent?.name : club.name) : (isHome ? opponent?.name : club.name), size:36 })
                    : <Typography sx={{ fontSize:'1.5rem' }}>⚽</Typography>}
                </Box>
                <Typography sx={{ color:C_V1.ink, fontWeight:900, fontSize:'0.62rem', textAlign:'center', lineHeight:1.1 }}>
                  {hasCup ? (nextCupInfo.tie?.home?.isPlayer ? cupOpponent?.name : club.name) : (isHome ? opponent?.name : club.name)}
                </Typography>
                <Typography sx={{ color:C_V1.ink3, fontSize:'0.48rem', fontWeight:700 }}>
                  {!isHome ? `${myPos}º · ${myRow.pts||0}pts` : (oppPos > 0 ? `${oppPos}º · ${oppRow.pts||0}pts` : '—')}
                </Typography>
              </Box>
            </Box>

            <Box sx={{
              borderTop:`1px solid ${serieColor}20`,
              px:2, py:0.8,
              background:`linear-gradient(90deg, ${serieColor}08, transparent)`,
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <Typography sx={{ color:serieColor, fontWeight:900, fontSize:'0.72rem', fontFamily:'"Cinzel",serif' }}>
                ▶ {hasCup ? 'JOGAR COPA' : 'IR PARA A PARTIDA'}
              </Typography>
              <Box sx={{ display:'flex', gap:0.4 }}>
                {recentForm.slice(0,5).map((r,i) => (
                  <Box key={i} sx={{ width:12, height:12, borderRadius:'50%', bgcolor: r==='V'?C_V1.grass:r==='D'?C_V1.red:C_V1.yellow }} />
                ))}
              </Box>
            </Box>
          </Box>
        ) : null}
      </Box>

      {/* ── GRID DE NAVEGAÇÃO ── */}
      <Box sx={{ px:2 }}>
        <Typography sx={{
          color:C_V1.grass, fontWeight:900, fontSize:'0.5rem', letterSpacing:2,
          fontFamily:'"Cinzel",serif', mb:0.8, display:'flex', alignItems:'center', gap:0.5,
        }}>
          <Box component="span" sx={{ display:'inline-block', width:16, height:2, bgcolor:C_V1.grass, borderRadius:1 }} />
          NAVEGAÇÃO
          <Box component="span" sx={{ display:'inline-block', flex:1, height:2, bgcolor:`${C_V1.grass}30`, borderRadius:1 }} />
        </Typography>

        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1 }}>
          {CARDS.map((card, idx) => (
            <Box key={card.id} onClick={() => setScreen(card.screen)} sx={{
              position:'relative', borderRadius:'16px', overflow:'hidden',
              bgcolor:C_V1.card,
              border:`1.5px solid ${card.pulse ? '#fca5a5' : C_V1.border}`,
              boxShadow: C_V1.shadow,
              cursor:'pointer',
              animation: card.pulse ? 'v1-pulse 2s infinite' : `v1-in ${0.05 + idx*0.04}s ease both`,
              '&:active': { transform:'scale(0.96)' }, transition:'transform .15s',
            }}>
              {/* Borda top colorida */}
              <Box sx={{ height:3, background:`linear-gradient(90deg, ${card.color}, ${card.color}66)` }} />

              {/* Emoji decorativo fundo */}
              <Box sx={{
                position:'absolute', bottom:-6, right:-2,
                fontSize:'2.6rem', opacity:0.06, pointerEvents:'none', userSelect:'none',
                filter:'saturate(0.5)',
              }}>{card.emoji}</Box>

              <Box sx={{ px:1.1, pt:1, pb:1, position:'relative' }}>
                {card.badge && (
                  <Box sx={{
                    position:'absolute', top:6, right:6,
                    bgcolor: typeof card.badge==='number' ? C_V1.red : 'transparent',
                    borderRadius:'10px', minWidth:16, height:16, px:0.3,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border: typeof card.badge==='number' ? '1px solid #fff' : 'none',
                  }}>
                    <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'0.4rem' }}>{card.badge}</Typography>
                  </Box>
                )}
                <Typography sx={{ fontSize:'1.25rem', lineHeight:1, mb:0.4 }}>{card.emoji}</Typography>
                <Typography sx={{
                  color:C_V1.ink, fontWeight:900, fontSize:'0.67rem', lineHeight:1.1, mb:0.2,
                  fontFamily:'"Nunito",sans-serif',
                }}>{card.label}</Typography>
                <Typography sx={{
                  color:card.color !== C_V1.ink3 ? card.color : C_V1.ink3,
                  fontSize:'0.45rem', fontWeight:700, lineHeight:1.3,
                  overflow:'hidden', display:'-webkit-box',
                  WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                }}>{card.sub}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MenuPrincipal;

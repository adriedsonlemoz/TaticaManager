// @migrated to ES module
import ScreenAbout from './ScreenAbout.jsx';
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { teamBranding } from '../data/teamBranding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { APP_VERSION_LABEL } from '../config/appMeta.js';

// components/ScreenBoot.js — v8.1 (Fix botão Sobre inline)

const RoundBar = ({ round, total, primary, gold, border }) => {
  const pct = total > 0 ? Math.min(100, Math.round((round / total) * 100)) : 0;
  return (
    <Box sx={{ mt:0.5 }}>
      <Box sx={{ height:4, bgcolor:border||'#e2e8f0', borderRadius:3, overflow:'hidden' }}>
        <Box sx={{ height:'100%', borderRadius:3, width:`${pct}%`,
          bgcolor: pct >= 80 ? (gold||'#a07820') : (primary||'#16a34a'),
          transition:'width 0.6s ease' }} />
      </Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', mt:0.25 }}>
        <Typography sx={{ color:'#64748b', fontSize:'0.6rem', fontWeight:700 }}>
          Rod. {round}/{total}
        </Typography>
        <Typography sx={{ color:'#64748b', fontSize:'0.6rem', fontWeight:700 }}>{pct}%</Typography>
      </Box>
    </Box>
  );
};

const ScreenBoot = ({ savesList, loadSpecificGame, setScreen, setDeleteSaveModal }) => {
  const [loading,      setLoading]      = React.useState(null);
  const [expandedSave, setExpandedSave] = React.useState(null);
  const [showAbout,    setShowAbout]    = React.useState(false); // Fix: Sobre inline


  // Se "Sobre" foi clicado, renderiza ScreenAbout inline sem gameData
  if (showAbout && typeof ScreenAbout !== 'undefined') {
    return React.createElement(ScreenAbout, {
      handleCopyPix: () => { try { navigator.clipboard.writeText('brasfoot@pix.com'); } catch(e){} },
      onBack: () => setShowAbout(false),
    });
  }

  const handleLoad = async (meta) => {
    try {
      setLoading(meta.name);
      await loadSpecificGame(meta);
    } catch (err) {
      console.error('Erro ao carregar save:', err);
      setLoading(null);
    }
  };

  // ── Paleta Pergaminho ─────────────────────────────────────
  const C = THEME;

  const formatSavedAt = (ts) => {
    if (!ts) return 'Nunca salvo';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)     return 'Agora mesmo';
    if (diff < 3600)   return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    return new Date(ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
  };

  const getDiffStyle = (diff) => {
    if (diff === 'Fácil')    return { color:C.greenLight, icon:'🟢' };
    if (diff === 'Difícil')  return { color:'#b05a10',    icon:'🟠' };
    if (diff === 'Lendário') return { color:C.red,        icon:'🔴' };
    return { color:C.gold, icon:'🟡' };
  };

  const getObjLabel = (obj) => {
    const MAP = {
      champion:    { icon:'🏆', label:'Ser Campeão'    },
      promotion:   { icon:'⬆️', label:'Subir de Div.'  },
      libertadores:{ icon:'🌎', label:'Libertadores'   },
      sulamericana:{ icon:'🌐', label:'Sul-Americana'  },
      survive:     { icon:'🛡️', label:'Não Rebaixar'   },
      midtable:    { icon:'📊', label:'Meio da Tabela' },
    };
    return MAP[obj] || null;
  };

  const getAvatarEmoji = (style) => ({
    suit:'🤵', jacket:'🧥', glasses:'🕶️', cap:'🧢', beard:'🧔', headset:'🎧',
  }[style] || '🤵');

  const getWinRate = (w, d, l) => {
    const t = w + d + l;
    return t ? Math.round((w / t) * 100) : null;
  };

  return (
    <Box sx={{
      minHeight:'100vh',
      background:`
        radial-gradient(ellipse at 50% 0%, rgba(160,120,32,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 20% 100%, rgba(26,107,53,0.05) 0%, transparent 40%),
        ${C.bg}
      `,
      display:'flex', flexDirection:'column',
    }}>

      {/* Overlay de loading */}
      {loading && (
        <Box sx={{ position:'fixed', inset:0, zIndex:9999,
          bgcolor:'rgba(245,239,228,0.94)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:2 }}>
          <Typography sx={{ fontSize:'3.5rem', lineHeight:1,
            animation:'spin 1s linear infinite',
            '@keyframes spin':{ from:{ transform:'rotate(0deg)' }, to:{ transform:'rotate(360deg)' } } }}>
            ⚽
          </Typography>
          <Typography sx={{ color:C.green, fontWeight:900, fontSize:'1.2rem', letterSpacing:1 }}>
            CARREGANDO CARREIRA…
          </Typography>
          <Typography sx={{ color:C.ink3, fontSize:'0.9rem', fontWeight:700 }}>{loading}</Typography>
        </Box>
      )}

      {/* ── HEADER ── */}
      <Box sx={{
        background:`linear-gradient(180deg, #ede4d4 0%, ${C.bg} 100%)`,
        borderBottom:`1.5px solid ${C.border}`,
        px:2, pt:4, pb:2.5,
        display:'flex', flexDirection:'column', alignItems:'center', gap:0.8,
      }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
          <Box sx={{ width:52, height:52, borderRadius:'14px',
            background:`linear-gradient(135deg, ${C.green} 0%, #0f4a22 100%)`,
            border:`2px solid ${C.borderAcc}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 4px 16px ${C.shadow}` }}>
            <Typography sx={{ fontSize:'2.2rem', lineHeight:1 }}>⚽</Typography>
          </Box>
          <Box>
            <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'2.0rem', lineHeight:1,
              fontFamily:'"Nunito",sans-serif', letterSpacing:0.5 }}>
              CLUBE DE
            </Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
              <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.8rem', letterSpacing:2.5, lineHeight:1.2 }}>
                BOLSO
              </Typography>
              <Box sx={{ bgcolor:`${C.green}18`, border:`1px solid ${C.green}40`, borderRadius:'4px', px:0.5, py:0.05 }}>
                <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.44rem', letterSpacing:0.5 }}>{APP_VERSION_LABEL}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Stats globais */}
        {savesList.length > 0 && (() => {
          const totalSeasons  = savesList.reduce((s,m) => s + (m.managerProfile?.seasonsTotal || 0), 0);
          const totalWins     = savesList.reduce((s,m) => s + (m.managerProfile?.wins    || 0), 0);
          const totalTrophies = savesList.reduce((s,m) => s + (m.trophies || 0), 0);
          return (
            <Box sx={{ display:'flex', gap:3, mt:0.5 }}>
              {[
                { icon:'📁', label:'SAVES',     value:savesList.length },
                { icon:'📅', label:'TEMPORADAS', value:totalSeasons    },
                { icon:'✅', label:'VITÓRIAS',   value:totalWins       },
                { icon:'🏆', label:'TROFÉUS',    value:totalTrophies   },
              ].map((s,i)=>(
                <Box key={i} sx={{ textAlign:'center' }}>
                  <Typography sx={{ fontSize:'0.9rem', lineHeight:1 }}>{s.icon}</Typography>
                  <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'0.9rem', lineHeight:1.2 }}>{s.value}</Typography>
                  <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
          );
        })()}
      </Box>

      {/* ── LISTA DE SAVES ── */}
      <Box sx={{ flex:1, overflowY:'auto', px:1.5, pt:1.5, pb:1 }}>
        {savesList.length === 0 ? (
          <Box sx={{ textAlign:'center', py:7, px:2,
            bgcolor:C.bgCard, border:`1.5px dashed ${C.border}`,
            borderRadius:'14px', mt:1, boxShadow:`0 2px 12px ${C.shadow}` }}>
            <Typography sx={{ fontSize:'3.5rem', mb:1, opacity:0.3 }}>📂</Typography>
            <Typography sx={{ color:C.ink, fontWeight:700, fontSize:'1.2rem', mb:0.5 }}>
              Nenhuma carreira encontrada
            </Typography>
            <Typography sx={{ color:C.ink2, fontSize:'1.0rem', mb:3 }}>
              Inicie sua jornada agora mesmo!
            </Typography>
            <Button onClick={() => setScreen('setup')} sx={{
              bgcolor:C.green, color:'#fff', fontWeight:900, px:3.5, py:1.2,
              borderRadius:'10px', fontSize:'1.0rem', boxShadow:`0 4px 16px ${C.shadow}`,
              '&:hover':{ bgcolor:C.primaryDim },
            }}>
              ✍️ Nova Carreira
            </Button>
          </Box>
        ) : (
          <Box sx={{ display:'flex', flexDirection:'column', gap:1.2, mt:0.5 }}>
            <Typography sx={{ color:C.ink3, fontWeight:900, fontSize:'0.7rem', letterSpacing:2, textAlign:'center' }}>
              SUAS CARREIRAS
            </Typography>

            {savesList.map((meta, idx) => {
              const isFirst    = idx === 0;
              const isLoading  = loading === meta.name;
              const isExpanded = expandedSave === meta.name;
              const mp         = meta.managerProfile || {};
              const diffStyle  = getDiffStyle(meta.difficulty);
              const objInfo    = getObjLabel(meta.seasonObjective);
              const avatarEmoji= getAvatarEmoji(meta.avatarStyle);
              const branding   = teamBranding?.[meta.clubName];
              const serieColor = meta.serie==='A'?C.green:meta.serie==='B'?C.gold:meta.serie==='C'?C.blue:C.ink3;
              const posLabel   = meta.position ? `${meta.position}º` : '—';

              return (
                <Box key={meta.name} sx={{
                  bgcolor: isFirst ? '#fffdf7' : C.bgCard,
                  border:`1.5px solid ${isFirst ? C.borderAcc : C.border}`,
                  borderRadius:'14px', overflow:'hidden',
                  boxShadow: isFirst
                    ? `0 4px 20px ${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.7)`
                    : `0 2px 8px ${C.shadow}`,
                }}>
                  {/* Faixa de cor do clube */}
                  {branding && (
                    <Box sx={{ height:3, background:`linear-gradient(90deg,${branding.primary},${branding.secondary})` }}/>
                  )}

                  {/* ── Corpo ── */}
                  <Box sx={{ px:1.5, pt:1.3, pb:1, display:'flex', gap:1.3 }}>
                    {/* Escudo + Avatar */}
                    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.5, flexShrink:0 }}>
                      <Box sx={{ width:60, height:60, borderRadius:'10px', bgcolor:C.bgCardAlt,
                        border:`1.5px solid ${isFirst ? C.borderAcc : C.border}`,
                        display:'flex', flexDirection:'column', alignItems:'center',
                        justifyContent:'center', gap:0.2, overflow:'hidden' }}>
                        {TeamIcon
                          ? React.createElement(TeamIcon, { name:meta.clubName, size:40 })
                          : <Typography sx={{ fontSize:'1.9rem' }}>⚽</Typography>
                        }
                        <Typography sx={{ color:C.ink3, fontSize:'0.52rem', fontWeight:700, px:0.3, textAlign:'center', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:56 }}>
                          {meta.clubName?.toUpperCase().substring(0,11)}
                        </Typography>
                      </Box>
                      <Box sx={{ width:26, height:26, borderRadius:'50%', bgcolor:C.bgCardAlt, border:`1.5px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Typography sx={{ fontSize:'1.1rem', lineHeight:1 }}>{avatarEmoji}</Typography>
                      </Box>
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex:1, minWidth:0 }}>
                      {/* Nome do save — SEM engrenagem */}
                      <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'1.1rem',
                        fontFamily:'"Nunito",sans-serif', lineHeight:1.1, mb:0.3,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {meta.name.toUpperCase()}
                      </Typography>

                      {/* Série + Temp + Dificuldade */}
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.6, mb:0.45, flexWrap:'wrap' }}>
                        <Box sx={{ bgcolor:`${serieColor}18`, border:`1px solid ${serieColor}40`, borderRadius:'4px', px:0.6, py:0.1 }}>
                          <Typography sx={{ color:serieColor, fontWeight:900, fontSize:'0.6rem', letterSpacing:0.5 }}>
                            SÉRIE {meta.serie}
                          </Typography>
                        </Box>
                        <Typography sx={{ color:C.ink2, fontSize:'0.7rem', fontWeight:700 }}>Temp. {meta.season}</Typography>
                        {meta.difficulty && (
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.3 }}>
                            <Typography sx={{ fontSize:'0.6rem', lineHeight:1 }}>{diffStyle.icon}</Typography>
                            <Typography sx={{ color:diffStyle.color, fontWeight:900, fontSize:'0.6rem' }}>{meta.difficulty}</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Posição + Pontos + Manager */}
                      <Box sx={{ display:'flex', gap:1.2, mb:0.4 }}>
                        <Box>
                          <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>POSIÇÃO</Typography>
                          <Typography sx={{ color:meta.position<=4?C.green:meta.position>=17?C.red:C.ink, fontWeight:900, fontSize:'1.0rem', lineHeight:1 }}>{posLabel}</Typography>
                        </Box>
                        {meta.pts !== null && (
                          <Box>
                            <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>PONTOS</Typography>
                            <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'1.0rem', lineHeight:1 }}>{meta.pts}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>MANAGER</Typography>
                          <Typography sx={{ color:C.ink2, fontWeight:700, fontSize:'0.7rem', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:68 }}>
                            {meta.manager?.split(' ')[0] || '—'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Objetivo */}
                      {objInfo && (
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.4, mb:0.35 }}>
                          <Typography sx={{ fontSize:'0.7rem' }}>{objInfo.icon}</Typography>
                          <Typography sx={{ color:C.ink3, fontSize:'0.6rem', fontWeight:700 }}>Meta:</Typography>
                          <Typography sx={{ color:C.ink2, fontSize:'0.6rem', fontWeight:900 }}>{objInfo.label}</Typography>
                        </Box>
                      )}

                      {/* Obras em andamento */}
                      {meta.stadiumConstruction > 0 && (
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.4, mb:0.35,
                          bgcolor:`${C.gold}12`, border:`1px solid ${C.gold}40`, borderRadius:'5px', px:0.6, py:0.2 }}>
                          <Typography sx={{ fontSize:'0.65rem' }}>🏗️</Typography>
                          <Typography sx={{ color:C.gold, fontWeight:700, fontSize:'0.58rem' }}>
                            Obras: {meta.stadiumConstruction} rodada{meta.stadiumConstruction > 1 ? 's' : ''} restante{meta.stadiumConstruction > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}

                      <Typography sx={{ color:C.ink3, fontSize:'0.6rem', fontWeight:700, mb:0.3 }}>
                        🕐 {formatSavedAt(meta.savedAt)}
                      </Typography>

                      <RoundBar round={meta.round} total={meta.totalRounds} primary={C.green} gold={C.gold} border={C.border}/>
                    </Box>
                  </Box>

                  {/* ── Histórico expansível ── */}
                  <Box onClick={() => setExpandedSave(isExpanded ? null : meta.name)} sx={{
                    px:1.5, py:0.65, borderTop:`1px solid ${C.border}`,
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    cursor:'pointer', bgcolor:isExpanded?C.bgCardAlt:'transparent',
                    transition:'background 0.15s',
                    '&:hover':{ bgcolor:C.bgCardAlt },
                  }}>
                    <Typography sx={{ color:C.ink3, fontWeight:900, fontSize:'0.6rem', letterSpacing:1 }}>
                      📊 HISTÓRICO DE CARREIRA
                    </Typography>
                    <Typography sx={{ color:C.ink3, fontSize:'0.8rem',
                      transition:'transform 0.2s', transform:isExpanded?'rotate(180deg)':'rotate(0deg)' }}>▾</Typography>
                  </Box>

                  {isExpanded && (() => {
                    const wins   = mp.wins   || 0;
                    const draws  = mp.draws  || 0;
                    const losses = mp.losses || 0;
                    const total  = wins + draws + losses;
                    const wPct   = total ? Math.round((wins/total)*100) : 0;
                    const dPct   = total ? Math.round((draws/total)*100) : 0;
                    const lPct   = total ? Math.round((losses/total)*100) : 0;

                    return (
                      <Box sx={{ px:1.5, pb:1.2, bgcolor:C.bgCardAlt, borderTop:`1px solid ${C.border}55` }}>
                        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0.6, mt:1, mb:1 }}>
                          {[
                            { icon:'📅', label:'TEMP.',    value:mp.seasonsTotal||(meta.season-2025)||1, color:C.ink  },
                            { icon:'✅', label:'VITÓRIAS', value:wins,   color:C.green },
                            { icon:'🤝', label:'EMPATES',  value:draws,  color:C.gold  },
                            { icon:'❌', label:'DERROTAS', value:losses, color:C.red   },
                          ].map((s,i)=>(
                            <Box key={i} sx={{ bgcolor:C.bgCard, borderRadius:'8px', py:0.8, textAlign:'center', border:`1px solid ${C.border}`, boxShadow:`0 1px 4px ${C.shadow}` }}>
                              <Typography sx={{ fontSize:'0.9rem', lineHeight:1, mb:0.2 }}>{s.icon}</Typography>
                              <Typography sx={{ color:s.color, fontWeight:900, fontSize:'1.0rem', lineHeight:1 }}>{s.value}</Typography>
                              <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700, mt:0.15 }}>{s.label}</Typography>
                            </Box>
                          ))}
                        </Box>

                        {total > 0 && (
                          <Box sx={{ mb:1 }}>
                            <Box sx={{ display:'flex', height:7, borderRadius:4, overflow:'hidden', bgcolor:C.border }}>
                              <Box sx={{ width:`${wPct}%`, bgcolor:C.green, transition:'width 0.4s' }}/>
                              <Box sx={{ width:`${dPct}%`, bgcolor:C.gold,  transition:'width 0.4s' }}/>
                              <Box sx={{ width:`${lPct}%`, bgcolor:C.red,   transition:'width 0.4s' }}/>
                            </Box>
                            <Box sx={{ display:'flex', gap:1.2, mt:0.4 }}>
                              {[{ color:C.green, l:`${wPct}% V` }, { color:C.gold, l:`${dPct}% E` }, { color:C.red, l:`${lPct}% D` }].map((b,i)=>(
                                <Box key={i} sx={{ display:'flex', alignItems:'center', gap:0.3 }}>
                                  <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:b.color }}/>
                                  <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>{b.l}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0.6 }}>
                          <Box sx={{ bgcolor:C.bgCard, borderRadius:'8px', px:0.9, py:0.7, border:`1px solid ${C.border}` }}>
                            <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>CAIXA</Typography>
                            <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.9rem', mt:0.2, lineHeight:1 }}>
                              {meta.money>=1e6?`R$${(meta.money/1e6).toFixed(1).replace('.0','')}M`:meta.money>=1e3?`R$${(meta.money/1e3).toFixed(0)}K`:`R$${meta.money||0}`}
                            </Typography>
                          </Box>
                          <Box sx={{ bgcolor:C.bgCard, borderRadius:'8px', px:0.9, py:0.7, border:`1px solid ${C.border}` }}>
                            <Typography sx={{ color:C.ink3, fontSize:'0.5rem', fontWeight:700 }}>TROFÉUS</Typography>
                            <Box sx={{ display:'flex', alignItems:'center', gap:0.4, mt:0.2 }}>
                              <Typography sx={{ fontSize:'1.0rem', lineHeight:1 }}>🏆</Typography>
                              <Typography sx={{ color:C.gold, fontWeight:900, fontSize:'1.2rem', lineHeight:1 }}>{mp.trophies||meta.trophies||0}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })()}

                  {/* ── Ações ── */}
                  <Box sx={{ display:'flex', borderTop:`1px solid ${C.border}` }}>
                    <Button onClick={() => handleLoad(meta)} disabled={!!loading} sx={{
                      flex:2, py:1.2, borderRadius:0,
                      bgcolor: isLoading ? C.primaryDim : C.green,
                      color:'#fff', fontWeight:900, fontSize:'0.88rem',
                      borderRight:`1px solid rgba(0,0,0,0.1)`,
                      '&:hover':{ bgcolor:C.primaryDim },
                      '&:disabled':{ bgcolor:C.bgDark, color:C.ink3 },
                    }}>{isLoading ? '⏳ Carregando...' : '▶ JOGAR'}</Button>
                    <Button onClick={() => setDeleteSaveModal(meta)} disabled={!!loading} sx={{
                      flex:0.8, py:1.2, borderRadius:0,
                      bgcolor:'transparent', color:C.red, fontWeight:900, fontSize:'0.75rem',
                      '&:hover':{ bgcolor:`${C.red}10` },
                    }}>🗑 DELETAR</Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* ── RODAPÉ ── */}
      <Box sx={{ display:'flex', borderTop:`1.5px solid ${C.border}`, bgcolor:C.bgCard }}>
        <Button onClick={() => setScreen('setup')} sx={{
          flex:1.3, py:1.8, borderRadius:0,
          bgcolor:C.green, color:'#fff',
          fontWeight:900, fontSize:'0.8rem', letterSpacing:0.3,
          display:'flex', flexDirection:'column', gap:0.2,
          borderRight:`1px solid rgba(0,0,0,0.15)`,
          '&:hover':{ bgcolor:C.primaryDim },
        }}>
          <Typography sx={{ fontSize:'1.3rem', lineHeight:1 }}>＋</Typography>
          <Typography sx={{ fontWeight:900, fontSize:'0.7rem', letterSpacing:0.5 }}>NOVA CARREIRA</Typography>
        </Button>

        {/* Botão Sobre — abre inline sem precisar de gameData */}
        <Button onClick={() => setShowAbout(true)} sx={{
          flex:1, py:1.8, borderRadius:0,
          bgcolor:'transparent', color:C.ink2,
          fontWeight:900,
          display:'flex', flexDirection:'column', gap:0.2,
          borderLeft:`1.5px solid ${C.border}`,
          '&:hover':{ bgcolor:C.bgDark, color:C.ink },
        }}>
          <Typography sx={{ fontSize:'1.3rem', lineHeight:1 }}>ℹ️</Typography>
          <Typography sx={{ fontWeight:900, fontSize:'0.68rem', letterSpacing:0.5 }}>SOBRE</Typography>
        </Button>
      </Box>
    </Box>
  );
};

export default ScreenBoot;

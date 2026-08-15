// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';

// components/BottomNav.js — v6.0
// ─────────────────────────────────────────────────────────────────────────────
// MAPA COMPLETO DE TELAS (sem repetição entre BottomNav e MenuPrincipal)
//
// MenuPrincipal já acessa diretamente:
//   home(boot) · finances · next_match · table · lineup · squad · medical
//   inbox · career · matches
//
// BottomNav cobre o restante + atalhos rápidos:
//   Barra:   Central(home) · Elenco(squad) · Time(submenu) · Clube(submenu)
//            Calendário(matches) · Transf.(market) · Opções(submenu)
//
//   Time  →  Táticas(lineup) · Centro Médico(medical) · Copas(copas)
//   Clube →  Estádio(stadium) · Carreira(career) · Tabela(table)
//            Caixa de Entrada(inbox) · Finanças(finances) · Sobre(about)
//   Opções → Salvar · Backup JSON · Sobre(about)
// ─────────────────────────────────────────────────────────────────────────────

const BottomNav = ({ screen, setScreen, simulating, saveGame, gameData }) => {
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  const [clubOpen,    setClubOpen]    = React.useState(false);
  const [teamOpen,    setTeamOpen]    = React.useState(false);

  // ── Paleta ────────────────────────────────────────────────────
  const C = THEME;

  // ── Itens da barra ────────────────────────────────────────────
  // 8 itens: Central · Elenco · Time · Clube · Calendário · Transf. · Finanças · Opções
  // Estádio está acessível via submenu Clube
  const NAV_ITEMS = [
    { label: 'Central',   icon: 'home',            screen: 'home'      },
    { label: 'Elenco',    icon: 'groups',           screen: 'squad'     },
    { label: 'Time',      icon: 'sports_soccer',    screen: '__team__'  },
    { label: 'Clube',     icon: 'shield',           screen: '__club__'  },
    { label: 'Calendário',icon: 'calendar_month',   screen: 'matches'   },
    { label: 'Transf.',   icon: 'swap_horiz',       screen: 'market'    },
    { label: 'Finanças',  icon: 'account_balance',  screen: 'finances'  },
    { label: 'Opções',    icon: 'settings',         screen: '__opts__'  },
  ];

  const isActive = (item) => {
    if (item.screen === '__opts__') return optionsOpen;
    if (item.screen === '__club__') return clubOpen;
    if (item.screen === '__team__') return teamOpen;
    return screen === item.screen;
  };

  const closeAll = () => {
    setOptionsOpen(false);
    setClubOpen(false);
    setTeamOpen(false);
  };

  const go = (s) => { closeAll(); setScreen(s); };

  const handleItemClick = (item) => {
    if (simulating && screen !== 'match_result' && item.screen !== screen) return;
    if (item.screen === '__opts__') { closeAll(); setOptionsOpen(true); return; }
    if (item.screen === '__club__') { closeAll(); setClubOpen(true);    return; }
    if (item.screen === '__team__') { closeAll(); setTeamOpen(true);    return; }
    closeAll();
    setScreen(item.screen);
  };

  const handleBackup = () => {
    if (!gameData) return;
    try {
      const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `brasfoot_${(gameData.club?.name || 'save').replace(/\s/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Erro ao exportar backup.'); }
    closeAll();
  };

  // ── Dados contextuais ─────────────────────────────────────────
  const myRow    = (gameData?.table || []).find(t => t.id === 'user') || {};
  const myPos    = (gameData?.table || []).findIndex(t => t.id === 'user') + 1;
  const mp       = gameData?.club?.managerProfile || {};
  const readIds  = new Set(gameData?.readMsgIds  || []);
  const trashIds = new Set(gameData?.trashMsgIds || []);
  const unread   = (gameData?.inbox || []).filter(m => !readIds.has(m.id) && !trashIds.has(m.id));
  const injured  = (gameData?.players || []).filter(p => p.injury).length;
  const suspCount= (gameData?.players || []).filter(p =>
    window.DisciplineEngine?.isPlayerSuspended(p, gameData?.round || 0)
  ).length;

  // ── Estilo base dos modais ────────────────────────────────────
  const modalBase = {
    position: 'fixed', bottom: 66, left: '50%',
    transform: 'translateX(-50%)',
    m: 0, maxHeight: '78vh', overflowY: 'auto',
    bgcolor: C.bg, border: `1px solid ${C.border}`,
    borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.12), 0 0 0 1px #e2e8f0',
  };

  // ── Sub-componente: cabeçalho de modal ────────────────────────
  const ModalHead = ({ icon, title, color }) => (
    <Box sx={{
      px: 1.8, py: 1.2,
      borderBottom: `1px solid ${C.border}`,
      background: `linear-gradient(90deg,${color || C.act}12 0%,transparent 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <span className="material-icons" style={{ color: color || C.act, fontSize: '1.1rem' }}>{icon}</span>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.82rem', letterSpacing: 1 }}>
          {title}
        </Typography>
      </Box>
      <Box onClick={closeAll} sx={{ cursor: 'pointer', p: 0.3, '&:active': { opacity: 0.6 } }}>
        <Typography sx={{ color: C.txt3, fontSize: '1.05rem', lineHeight: 1 }}>✕</Typography>
      </Box>
    </Box>
  );

  // ── Sub-componente: linha de menu ─────────────────────────────
  const MenuItem = ({ icon, label, sub, color, action, last }) => (
    <Box onClick={action} sx={{
      display: 'flex', alignItems: 'center', gap: 1.3,
      px: 1.8, py: 1.05, cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${C.border}`,
      transition: 'background 0.12s',
      '&:active': { bgcolor: `${color}0d` },
    }}>
      <Box sx={{
        width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
        bgcolor: `${color}12`, border: `1.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-icons" style={{ color, fontSize: '1.1rem' }}>{icon}</span>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.8rem', lineHeight: 1.15 }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ color: C.txt3, fontSize: '0.55rem', fontWeight: 700, mt: 0.18 }}>
            {sub}
          </Typography>
        )}
      </Box>
      <span className="material-icons" style={{ color: C.txt4, fontSize: '0.9rem' }}>chevron_right</span>
    </Box>
  );

  const ModalClose = () => (
    <Box onClick={closeAll} sx={{
      py: 0.85, textAlign: 'center', cursor: 'pointer',
      borderTop: `1px solid ${C.border}`,
      '&:active': { bgcolor: '#f1f5f9' },
    }}>
      <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.62rem' }}>FECHAR</Typography>
    </Box>
  );

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════ BARRA INFERIOR ═══════════════ */}
      <Paper elevation={0} sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 60, zIndex: 1200,
        bgcolor: C.bg, borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'stretch',
      }}>
        {NAV_ITEMS.map(item => {
          const active   = isActive(item);
          const disabled = simulating && screen !== 'match_result'
                        && item.screen !== screen && item.screen !== '__opts__';
          // Badge de notificação
          const badge = item.screen === '__club__' && unread.length > 0 ? unread.length
                      : item.screen === '__team__' && (injured + suspCount) > 0 ? (injured + suspCount)
                      : 0;
          return (
            <Box
              key={item.label}
              onClick={() => !disabled && handleItemClick(item)}
              sx={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 0.25, position: 'relative',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.2 : 1,
                transition: 'opacity 0.15s',
                '&:active': !disabled ? { opacity: 0.7 } : {},
              }}
            >
              {/* Linha ativa */}
              {active && (
                <Box sx={{
                  position: 'absolute', top: 0, left: '14%', right: '14%',
                  height: 2.5, bgcolor: C.act,
                  borderRadius: '0 0 3px 3px',
                  boxShadow: `0 0 8px ${C.act}`,
                }} />
              )}

              {/* Badge */}
              {badge > 0 && (
                <Box sx={{
                  position: 'absolute', top: 5, right: '10%',
                  bgcolor: C.red, borderRadius: '8px',
                  minWidth: 14, height: 14, px: 0.3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${C.bg}`,
                }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.38rem' }}>{badge}</Typography>
                </Box>
              )}

              <span className="material-icons" style={{
                fontSize: '1.15rem',
                color: active ? C.act : C.inact,
                filter: active ? `drop-shadow(0 0 5px ${C.act}80)` : 'none',
                transition: 'color 0.15s',
              }}>
                {item.icon}
              </span>
              <Typography sx={{
                color: active ? C.act : C.inact,
                fontSize: '0.34rem', fontWeight: 900,
                letterSpacing: 0.1, textTransform: 'uppercase', lineHeight: 1,
              }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Paper>

      {/* ═══════════════ MODAL TIME ═══════════════
          Táticas · Centro Médico · Copas e Torneios
      ═══════════════════════════════════════════ */}
      <Dialog
        open={teamOpen}
        onClose={closeAll}
        PaperProps={{ sx: { ...modalBase, width: 290 } }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' } }}
      >
        <Box>
          <ModalHead icon="sports_soccer" title="TIME" color={C.green} />

          <MenuItem
            icon="dashboard_customize" label="Táticas & Escalação"
            sub="Formação, prancheta e titulares"
            color={C.green} action={() => go('lineup')}
          />
          <MenuItem
            icon="medical_services" label="Centro Médico"
            sub={injured > 0 || suspCount > 0
              ? `${injured} lesionado(s) · ${suspCount} suspenso(s)`
              : 'Elenco em plenas condições'}
            color={C.red} action={() => go('medical')}
          />
          <MenuItem
            icon="emoji_events" label="Copas e Torneios"
            sub="Copa do Brasil · Libertadores · Sul-Americana"
            color={C.gold} action={() => go('copas')}
          />
          <MenuItem
            icon="school" label="Categoria de Base"
            sub={(() => {
              const academy = gameData?.academy || [];
              const ready   = academy.filter(p => (p.age||0) >= 18).length;
              return ready > 0
                ? `${ready} garoto(s) pronto(s) para promoção ⭐`
                : `${academy.length} garoto(s) em formação`;
            })()}
            color={'#7c3aed'} action={() => go('academy')} last
          />

          <ModalClose />
        </Box>
      </Dialog>

      {/* ═══════════════ MODAL CLUBE ═══════════════
          Header clube · Stats · Técnico · Finanças ·
          Msgs · Grid: Estádio Carreira Tabela Inbox Finanças Sobre
      ═══════════════════════════════════════════ */}
      <Dialog
        open={clubOpen}
        onClose={closeAll}
        PaperProps={{ sx: { ...modalBase, width: 318 } }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' } }}
      >
        <Box>
          {/* Header com escudo */}
          <Box sx={{
            background: `linear-gradient(135deg,#f8fafc 0%,#f4f7f6 100%)`,
            borderBottom: `1px solid ${C.border}`,
            px: 1.8, py: 1.3,
            display: 'flex', alignItems: 'center', gap: 1.2,
          }}>
            <Box sx={{
              width: 46, height: 46, borderRadius: '11px', flexShrink: 0,
              background: '#f1f5f9',
              border: `2px solid ${C.act}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${C.act}20`,
            }}>
              {window.TeamIcon && gameData?.club?.name
                ? React.createElement(window.TeamIcon, { name: gameData.club.name, size: 32 })
                : <Typography sx={{ fontSize: '1.3rem' }}>⚽</Typography>
              }
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                color: C.txt1, fontWeight: 900, fontSize: '0.95rem', lineHeight: 1.1,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {gameData?.club?.name || 'Meu Clube'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.6, mt: 0.3, flexWrap: 'wrap' }}>
                <Box sx={{ bgcolor: `${C.act}18`, border: `1px solid ${C.act}40`, borderRadius: '5px', px: 0.7, py: 0.1 }}>
                  <Typography sx={{ color: C.act, fontWeight: 900, fontSize: '0.5rem' }}>
                    Série {gameData?.serie}
                  </Typography>
                </Box>
                <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700, alignSelf: 'center' }}>
                  Rod. {gameData?.round || 0}/{gameData?.fixtures?.length || 38}
                </Typography>
              </Box>
            </Box>
            <Box onClick={closeAll} sx={{ cursor: 'pointer', p: 0.3, '&:active': { opacity: 0.6 } }}>
              <Typography sx={{ color: C.txt3, fontSize: '1.05rem', lineHeight: 1 }}>✕</Typography>
            </Box>
          </Box>

          {/* Stats rápidos — 4 colunas */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.5, px: 1.2, py: 0.9 }}>
            {[
              { l: 'POSIÇÃO', v: `${myPos}º`,
                c: myPos <= 4 ? C.act : myPos >= 17 ? C.red : C.txt1 },
              { l: 'PONTOS',  v: myRow.pts ?? 0, c: C.txt1 },
              { l: 'V·E·D',   v: `${myRow.w||0}·${myRow.d||0}·${myRow.l||0}`, c: C.green },
              { l: 'SALDO',
                v: `${(myRow.gf||0)-(myRow.ga||0) >= 0 ? '+' : ''}${(myRow.gf||0)-(myRow.ga||0)}`,
                c: (myRow.gf||0)-(myRow.ga||0) >= 0 ? C.green : C.red },
            ].map((s, i) => (
              <Box key={i} sx={{ bgcolor: C.cardB, borderRadius: '8px', py: 0.75, textAlign: 'center' }}>
                <Typography sx={{ color: s.c, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>{s.v}</Typography>
                <Typography sx={{ color: C.txt4, fontSize: '0.4rem', fontWeight: 700, mt: 0.12 }}>{s.l}</Typography>
              </Box>
            ))}
          </Box>

          {/* Técnico */}
          <Box sx={{
            mx: 1.2, mb: 0.8, bgcolor: C.cardB, borderRadius: '10px',
            px: 1.2, py: 0.85, display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#f1f5f9',
              border: `2px solid ${C.act}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#0f172a', fontWeight: 900, fontSize: '0.7rem' }}>
                {(gameData?.club?.manager || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.78rem', lineHeight: 1 }}>
                {gameData?.club?.manager || 'Treinador'}
              </Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.55rem', fontWeight: 700, mt: 0.12 }}>
                {mp.style || 'Técnico'} · {mp.nationality || ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.65rem' }}>
                {mp.wins||0}V {mp.draws||0}E {mp.losses||0}D
              </Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.43rem', fontWeight: 700 }}>
                Exp. {mp.experience||0}
              </Typography>
            </Box>
          </Box>

          {/* Finanças resumo */}
          <Box sx={{ mx: 1.2, mb: 0.8, bgcolor: C.cardB, borderRadius: '10px', px: 1.2, py: 0.8 }}>
            <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.47rem', letterSpacing: 0.8, mb: 0.5 }}>
              SITUAÇÃO FINANCEIRA
            </Typography>
            {[
              { l: 'Caixa',             v: gameData?.club?.money,           c: C.act  },
              { l: 'Folha Salarial',    v: gameData?.club?.wage,            c: C.red  },
              { l: 'Orç. Transferências', v: gameData?.club?.transferBudget, c: C.blue },
            ].map((r, i) => (
              <Box key={i} sx={{
                display: 'flex', justifyContent: 'space-between',
                py: 0.3, borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
              }}>
                <Typography sx={{ color: C.txt2, fontSize: '0.62rem', fontWeight: 700 }}>{r.l}</Typography>
                <Typography sx={{ color: r.c, fontWeight: 900, fontSize: '0.62rem' }}>
                  R$ {((r.v || 0) / 1e6).toFixed(1)}M
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Mensagens não lidas (se houver) */}
          {unread.length > 0 && (
            <Box sx={{ mx: 1.2, mb: 0.8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.47rem', letterSpacing: 0.8 }}>
                  MENSAGENS NÃO LIDAS
                </Typography>
                <Box sx={{ bgcolor: C.red, borderRadius: '10px', px: 0.55, minWidth: 15, textAlign: 'center' }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.43rem' }}>{unread.length}</Typography>
                </Box>
              </Box>
              {unread.slice(0, 2).map(msg => (
                <Box key={msg.id} onClick={() => go('inbox')} sx={{
                  display: 'flex', alignItems: 'center', gap: 0.7,
                  bgcolor: C.cardB, borderRadius: '8px', px: 1, py: 0.6, mb: 0.35,
                  cursor: 'pointer', '&:active': { opacity: 0.7 },
                }}>
                  <Typography sx={{ fontSize: '0.85rem', flexShrink: 0 }}>{msg.icon || '📨'}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.58rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {msg.subject}
                    </Typography>
                    <Typography sx={{ color: C.txt3, fontSize: '0.47rem', fontWeight: 700 }}>{msg.date}</Typography>
                  </Box>
                  <Typography sx={{ color: C.act, fontSize: '0.75rem' }}>›</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Atalhos rápidos — apenas telas não presentes no MenuPrincipal */}
          <Box sx={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
            {[
              { l: '🏅 Carreira', s: 'career'   },
              { l: '📊 Tabela',   s: 'table'    },
              { l: 'ℹ️ Sobre',    s: 'about'    },
            ].map((btn, i) => (
              <Box
                key={i}
                onClick={() => go(btn.s)}
                sx={{
                  flex: 1, py: 1, textAlign: 'center', cursor: 'pointer',
                  borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                  '&:active': { bgcolor: `${C.act}0a` },
                }}
              >
                <Typography sx={{ color: C.act, fontWeight: 900, fontSize: '0.62rem' }}>
                  {btn.l}
                </Typography>
              </Box>
            ))}
          </Box>

          <ModalClose />
        </Box>
      </Dialog>

      {/* ═══════════════ MODAL OPÇÕES ═══════════════
          Salvar · Backup JSON · Sobre
      ═══════════════════════════════════════════ */}
      <Dialog
        open={optionsOpen}
        onClose={closeAll}
        PaperProps={{ sx: { ...modalBase, width: 268 } }}
        BackdropProps={{ sx: { bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' } }}
      >
        <Box>
          <ModalHead icon="tune" title="OPÇÕES" color={C.act} />

          <MenuItem
            icon="save" label="Salvar Jogo"
            sub="Gravar progresso atual"
            color={C.green}
            action={() => { saveGame?.(); closeAll(); }}
          />
          <MenuItem
            icon="file_download" label="Backup JSON"
            sub="Exportar save para arquivo"
            color={C.blue}
            action={handleBackup}
          />
          <MenuItem
            icon="info_outline" label="Sobre o Jogo"
            sub="Versão, créditos e doação"
            color={C.gold}
            action={() => go('about')}
            last
          />

          <ModalClose />
        </Box>
      </Dialog>
    </>
  );
};

export default BottomNav;

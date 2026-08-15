// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';
import FieldView from './FieldView.jsx';

// components/ScreenSquad.js — v7.0 (Estilo Tática Manager — fiel à imagem)
const ScreenSquad = ({ gameData, trainSquad, setPlayerModal, formatMoney, setScreen }) => {
  const [groupTab, setGroupTab] = React.useState('all');
  const [sortBy,   setSortBy]   = React.useState('position');

  // ── Paleta verde escura (tema atual) ─────────────────────
  const C = THEME;

  // posColor importada de helpers.js — suporta todas as posições modernas (LD, LE, CA, PD, PE, MC, etc.)

  const ovrColor  = (o) => o >= 80 ? C.green : o >= 70 ? C.yellow : C.red;
  const energyColor = (e) => e >= 75 ? C.green : e >= 50 ? C.yellow : C.red;
  const energyEmoji = (e) => e >= 85 ? '😊' : e >= 70 ? '🙂' : e >= 50 ? '😐' : '😞';

  const players  = gameData?.players || [];
  const starters = players.filter(p => p.isStarting);
  const bench    = players.filter(p => !p.isStarting);
  const injured  = players.filter(p => p.injury);
  // Suspensos: usa DisciplineEngine importado via ES module
  const suspended = players.filter(p =>
    DisciplineEngine
      ? DisciplineEngine.isPlayerSuspended(p, gameData?.round)
      : (p.discipline?.suspendedUntilRound != null && (gameData?.round || 0) <= p.discipline.suspendedUntilRound)
  );

  const teamOvr     = starters.length > 0
    ? Math.round(starters.reduce((a, p) => a + (p.overall || 0), 0) / starters.length)
    : 0;
  const totalValue  = players.reduce((a, p) => a + (p.value || 0), 0);

  const POS_ORDER = { GOL: 1, ZAG: 2, LAT: 3, VOL: 4, MEI: 5, ATA: 6 };
  const sortFn = (a, b) => {
    if (sortBy === 'position') return (POS_ORDER[a.position] || 9) - (POS_ORDER[b.position] || 9) || b.overall - a.overall;
    if (sortBy === 'overall')  return b.overall - a.overall;
    // BUG S2 FIX: energia ascendente (mais cansados PRIMEIRO — útil para gestão)
    if (sortBy === 'energy')   return (a.energy ?? 100) - (b.energy ?? 100);
    if (sortBy === 'age')      return a.age - b.age;
    return 0;
  };

  const TABS = [
    { id: 'all',      label: 'Todos',      count: players.length  },
    { id: 'starters', label: 'Titulares',  count: starters.length },
    { id: 'campo',    label: '⚽ Campo',   count: starters.length },
    { id: 'bench',    label: 'Reservas',   count: bench.length    },
    { id: 'gk',       label: 'Goleiros',   count: players.filter(p=>p.position==='GOL').length },
    { id: 'def',      label: 'Defensores', count: players.filter(p=>['ZAG','LD','LE','LAT'].includes(p.position)).length },
    { id: 'mid',      label: 'Meio-Campo', count: players.filter(p=>['VOL','MC','MEI'].includes(p.position)).length },
    { id: 'att',      label: 'Atacantes',  count: players.filter(p=>['CA','PD','PE','ATA'].includes(p.position)).length },
  ];

  const getList = () => {
    let list = players;
    if (groupTab === 'starters') list = starters;
    else if (groupTab === 'bench') list = bench;
    else if (groupTab === 'gk')  list = players.filter(p=>p.position==='GOL');
    else if (groupTab === 'def') list = players.filter(p=>['ZAG','LD','LE','LAT'].includes(p.position));
    else if (groupTab === 'mid') list = players.filter(p=>['VOL','MC','MEI'].includes(p.position));
    else if (groupTab === 'att') list = players.filter(p=>['CA','PD','PE','ATA'].includes(p.position));
    return [...list].sort(sortFn);
  };

  // TeamIcon já importado via ES module no topo do arquivo

  // ── Mini Campo Portrait — usa FieldView compartilhado ──────
  const _formation = gameData?.club?.formation || gameData?.club?.managerProfile?.formation || '4-4-2';


  const PlayerCard = ({ p }) => {
    // JerseyBadge importado via ES module no topo
    const isSuspended = DisciplineEngine?.isPlayerSuspended(p, gameData?.round);
    const yellows     = p.discipline?.yellowCards || 0;
    const energy      = p.energy ?? 100;
    const isInjured   = !!p.injury;
    const isStarter   = p.isStarting;

    return (
      <Box
        onClick={() => setPlayerModal(p)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.2,
          bgcolor: isStarter ? 'rgba(34,197,94,0.06)' : C.card,
          border: `1.5px solid ${isStarter ? C.borderG : C.border}`,
          borderRadius: '12px', px: 1.2, py: 1, mb: 0.8,
          cursor: 'pointer', transition: 'all 0.12s',
          '&:active': { transform: 'scale(0.98)', opacity: 0.9 },
        }}
      >
        {/* Jersey Badge */}
        {JerseyBadge
          ? React.createElement(JerseyBadge, { pos: p.position, num: p.shirt ?? '?', size: 44 })
          : <Box sx={{ width:44, height:44, flexShrink:0 }}/>
        }

        {/* Nome + info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
            <Typography sx={{
              color: isStarter ? C.txt1 : C.txt2,
              fontWeight: 900, fontSize: '0.88rem', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {p.name}
            </Typography>
            {isInjured   && <Typography sx={{ fontSize: '0.7rem', flexShrink: 0 }}>🚑</Typography>}
            {isSuspended && <Typography sx={{ fontSize: '0.7rem', flexShrink: 0 }}>🟥</Typography>}
          </Box>

          {/* Barra de energia */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.25 }}>
            <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700, flexShrink: 0 }}>⚡</Typography>
            <Box sx={{ flex: 1, height: 5, bgcolor: C.bgDark || '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: energyColor(energy), borderRadius: 3, transition: 'width 0.4s ease' }} />
            </Box>
            <Typography sx={{ color: energyColor(energy), fontWeight: 900, fontSize: '0.55rem', minWidth: 24, textAlign: 'right' }}>{energy}%</Typography>
          </Box>

          {/* Salário + Valor + Idade + Contrato + Cartões */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '4px', px: 0.5, py: 0.1 }}>
              <Typography sx={{ color: C.txt2, fontSize: '0.47rem', fontWeight: 700 }}>
                🎂 {p.age}a
              </Typography>
            </Box>
            {(p.contract ?? 2) <= 0 ? (
              // EXPIRADO — vermelho pulsante
              <Box sx={{
                bgcolor: `${C.red}22`, border: `1.5px solid ${C.red}`,
                borderRadius: '5px', px: 0.6, py: 0.15,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%,100%': { boxShadow: `0 0 0 0 ${C.red}50` },
                  '50%':     { boxShadow: `0 0 0 3px ${C.red}00` },
                },
              }}>
                <Typography sx={{ color: C.red, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.3 }}>
                  ⚠️ EXPIRADO
                </Typography>
              </Box>
            ) : (p.contract ?? 2) === 1 ? (
              // ÚLTIMO ANO — laranja com ícone de relógio
              <Box sx={{
                bgcolor: `${C.orange || '#f97316'}18`, border: `1.5px solid ${C.orange || '#f97316'}80`,
                borderRadius: '5px', px: 0.6, py: 0.15,
              }}>
                <Typography sx={{ color: C.orange || '#f97316', fontSize: '0.5rem', fontWeight: 900 }}>
                  ⏰ 1T RESTANTE
                </Typography>
              </Box>
            ) : (p.contract ?? 2) === 2 ? (
              // 2 anos — amarelo suave
              <Box sx={{ bgcolor: `${C.yellow}12`, border: `1px solid ${C.yellow}50`, borderRadius: '4px', px: 0.5, py: 0.1 }}>
                <Typography sx={{ color: C.yellow, fontSize: '0.47rem', fontWeight: 700 }}>
                  📋 {p.contract}T
                </Typography>
              </Box>
            ) : (
              // 3+ anos — neutro
              <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '4px', px: 0.5, py: 0.1 }}>
                <Typography sx={{ color: C.txt3, fontSize: '0.47rem', fontWeight: 700 }}>
                  📋 {p.contract}T
                </Typography>
              </Box>
            )}
            {(p.wage || 0) > 0 && (
              <Box sx={{ bgcolor: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: '4px', px: 0.5, py: 0.1 }}>
                <Typography sx={{ color: '#f85149', fontSize: '0.47rem', fontWeight: 700 }}>
                  💰 {formatMoney ? formatMoney(p.wage) : `R$${(p.wage/1000).toFixed(0)}K`}
                </Typography>
              </Box>
            )}
            {(p.releaseClause || 0) > 0 && (
              <Box sx={{ bgcolor: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: '4px', px: 0.5, py: 0.1 }}>
                <Typography sx={{ color: C.red, fontSize: '0.47rem', fontWeight: 700 }}>
                  🔒 {formatMoney ? formatMoney(p.releaseClause) : `R$${(p.releaseClause/1e6).toFixed(1)}M`}
                </Typography>
              </Box>
            )}
            {!isSuspended && yellows > 0 && (
              <Box sx={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: yellows }).map((_, i) => (
                  <Box key={i} sx={{ width: 5, height: 8, bgcolor: C.yellow, borderRadius: '1.5px' }} />
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* OVR + botão ver */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '8px',
            background: `linear-gradient(135deg, ${ovrColor(p.overall)}, ${ovrColor(p.overall)}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 6px ${ovrColor(p.overall)}50`,
          }}>
            <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>
              {p.overall}
            </Typography>
          </Box>
          <Box sx={{ width: 34, height: 22, borderRadius: '6px', bgcolor: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-icons" style={{ color: '#000', fontSize: '0.85rem' }}>person_search</span>
          </Box>
        </Box>
      </Box>
    );
  };

  const list = getList();

  return (
    <Box sx={{
      bgcolor: C.bg, minHeight: '100vh', pb: 10,
      background: `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 40%), ${C.bg}`,
    }}>

      {/* ── HEADER ──────────────────────────────────────── */}
      <Box sx={{
        background: `linear-gradient(160deg, ${C.green}18 0%, ${C.bg} 60%)`,
        borderBottom: `1px solid ${C.border}`,
        px: 1.5, pt: 3.8, pb: 0,
      }}>
        {/* Título + logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.4 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: C.cardAlt, border: `2px solid ${C.borderG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${C.green}30` }}>
            {TeamIcon ? React.createElement(TeamIcon, { name: gameData?.club?.name, size: 34 }) : <Typography sx={{ fontSize: '1.5rem' }}>⚽</Typography>}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1, mb: 0.2 }}>
              {gameData?.club?.name}
            </Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700 }}>
              Série {gameData?.serie} · Temporada {gameData?.season}
            </Typography>
          </Box>
        </Box>

        {/* Cards de stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.7, mb: 1.2 }}>
          {[
            { icon: '⚡', label: 'FORÇA', value: teamOvr, color: C.green,  bg: `${C.green}18`,  border: `${C.green}40` },
            { icon: '💰', label: 'VALOR', value: formatMoney ? formatMoney(totalValue) : `${players.length}j`, color: C.blue, bg: `${C.blue}15`, border: `${C.blue}35` },
            { icon: '👥', label: 'ELENCO', value: players.length, color: C.txt1, bg: C.cardAlt, border: C.border },
            injured.length > 0
              ? { icon: '🚑', label: 'LESION.', value: injured.length, color: C.red, bg: `${C.red}15`, border: `${C.red}40` }
              : suspended.length > 0
              ? { icon: '🟥', label: 'SUSP.', value: suspended.length, color: C.yellow, bg: `${C.yellow}15`, border: `${C.yellow}40` }
              : { icon: '✅', label: 'STATUS', value: 'OK', color: C.green, bg: `${C.green}12`, border: `${C.green}30` },
          ].map((s, i) => (
            <Box key={i} sx={{ bgcolor: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '10px', p: 0.7, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1rem', lineHeight: 1, mb: 0.2 }}>{s.icon}</Typography>
              <Typography sx={{ color: s.color, fontWeight: 900, fontSize: '0.88rem', lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 0.3, mt: 0.15 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Tabs de filtro — scrollável */}
        <Box sx={{ display: 'flex', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          {TABS.map(tab => {
            const active = groupTab === tab.id;
            return (
              <Box key={tab.id} onClick={() => setGroupTab(tab.id)} sx={{
                flexShrink: 0, px: 1.4, py: 1, cursor: 'pointer',
                borderBottom: `2.5px solid ${active ? C.green : 'transparent'}`,
                bgcolor: active ? 'rgba(34,197,94,0.05)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Typography sx={{ color: active ? C.green : C.txt3, fontWeight: 900, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  {tab.label}
                  {tab.count > 0 && <Typography component="span" sx={{ color: active ? C.green : C.txt3, fontSize: '0.58rem', ml: 0.3 }}>({tab.count})</Typography>}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── SORT + AÇÃO ─────────────────────────────────── */}
      <Box sx={{ px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', gap: 0.7, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, bgcolor: C.cardAlt, borderBottom: `1px solid ${C.border}` }}>
        <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>Ordenar:</Typography>
        {[
          { id: 'position', l: 'Posição' },
          { id: 'overall',  l: 'Overall' },
          { id: 'energy',   l: 'Energia' },
          { id: 'age',      l: 'Idade'   },
        ].map(s => {
          const active = sortBy === s.id;
          return (
            <Box key={s.id} onClick={() => setSortBy(s.id)} sx={{
              flexShrink: 0, px: 1.2, py: 0.4, borderRadius: '20px', cursor: 'pointer',
              bgcolor: active ? C.green : 'transparent',
              border: `1px solid ${active ? C.green : C.border}`,
              transition: 'all 0.12s',
            }}>
              <Typography sx={{ color: active ? '#000' : C.txt3, fontWeight: 900, fontSize: '0.62rem' }}>{s.l}</Typography>
            </Box>
          );
        })}
      </Box>

      {/* ── LISTA / CAMPO ────────────────────────────────── */}
      {groupTab === 'campo' ? (
        <FieldView
          starters={starters}
          formation={_formation}
          teamOvr={teamOvr}
          gameData={gameData}
          onPlayerClick={setPlayerModal}
          C={C}
          DisciplineEngine={DisciplineEngine}
          JerseyBadge={JerseyBadge}
        />
      ) : (
        <Box sx={{ px: 1.5, pt: 1.2, pb: 2 }}>
          {groupTab === 'all' ? (
            <>
              <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1.5, mb: 0.8 }}>
                TITULARES ({starters.length})
              </Typography>
              {[...starters].sort(sortFn).map(p => <PlayerCard key={p.id} p={p} />)}

              <Box sx={{ height: 1, bgcolor: C.border, my: 1.5 }} />

              <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1.5, mb: 0.8 }}>
                RESERVAS ({bench.length})
              </Typography>
              {[...bench].sort(sortFn).map(p => <PlayerCard key={p.id} p={p} />)}
            </>
          ) : (
            list.map(p => <PlayerCard key={p.id} p={p} />)
          )}

          {list.length === 0 && groupTab !== 'all' && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>👥</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.8rem', fontWeight: 700 }}>
                Nenhum jogador nesta categoria
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* ── RODAPÉ FIXO ──────────────────────────────────── */}
      <Box sx={{
        position: 'fixed', bottom: 62, left: 0, right: 0,
        display: 'flex', gap: 0, zIndex: 50,
        borderTop: `1px solid ${C.border}`,
      }}>
        <Button onClick={trainSquad} sx={{
          flex: 1, py: 1.4, borderRadius: 0,
          bgcolor: C.blue, color: '#fff', fontWeight: 900, fontSize: '0.72rem',
          '&:hover': { bgcolor: '#1d4ed8' },
          display: 'flex', gap: 0.5,
        }}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>fitness_center</span>
          Treinar Jogadores
        </Button>
        <Button onClick={() => setScreen?.('lineup')} sx={{
          flex: 1, py: 1.4, borderRadius: 0,
          bgcolor: C.green, color: '#fff', fontWeight: 900, fontSize: '0.72rem',
          borderLeft: `1px solid rgba(0,0,0,0.2)`,
          '&:hover': { bgcolor: '#16a34a' },
          display: 'flex', gap: 0.5,
        }}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>assignment</span>
          Escalação
        </Button>
        <Button onClick={() => setScreen?.('market')} sx={{
          flex: 1, py: 1.4, borderRadius: 0,
          bgcolor: C.red, color: '#fff', fontWeight: 900, fontSize: '0.72rem',
          borderLeft: `1px solid rgba(0,0,0,0.2)`,
          '&:hover': { bgcolor: '#dc2626' },
          display: 'flex', gap: 0.5,
        }}>
          <span className="material-icons" style={{ fontSize: '1rem' }}>swap_horiz</span>
          Transferências
        </Button>
      </Box>
    </Box>
  );
};

export default ScreenSquad;

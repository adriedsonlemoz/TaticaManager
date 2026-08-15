// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { getTableZoneColor } from '../engines/engine.js';
import { getTeamCoach } from '../data/database_coaches.js';

// components/ScreenTable.js — v6.0 (Estilo Tática Manager)
const ScreenTable = ({ gameData, buyPlayer, formatMoney, showToast }) => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const [selectedScorer, setSelectedScorer] = React.useState(null);

  const TeamIcon = window.TeamIcon || (({ name, size }) => (
    <Box sx={{
      width: size, height: size, borderRadius: '50%',
      bgcolor: '#1a6e2e', border: '2px solid rgba(255,255,255,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 24 ? '0.55rem' : '0.4rem', color: '#fff', fontWeight: 900, flexShrink: 0,
    }}>
      {(name || '?').substring(0, 3).toUpperCase()}
    </Box>
  ));

  // ── Paleta dark (tema padrão do jogo) ────────────────────
  const C = THEME;

  // ── Zonas por série ───────────────────────────────────────
  const getZone = (idx, serie) => {
    if (serie === 'A') {
      if (idx < 4)   return { color: C.zGreen,     label: 'Libertadores',     bg: 'rgba(34,197,94,0.10)'  };
      if (idx < 6)   return { color: C.zLightBlue, label: 'Pré-Libertadores', bg: 'rgba(0,212,200,0.08)'  };
      if (idx < 12)  return { color: C.zBlue,      label: 'Sul-Americana',    bg: 'rgba(59,130,246,0.08)' };
      if (idx >= 16) return { color: C.zRed,       label: 'Rebaixamento',     bg: 'rgba(239,68,68,0.10)'  };
      return { color: 'transparent', label: '', bg: null };
    }
    if (serie === 'B') {
      if (idx < 4)   return { color: C.zGreen, label: 'Acesso Série A', bg: 'rgba(34,197,94,0.10)'  };
      if (idx >= 16) return { color: C.zRed,   label: 'Rebaixamento C', bg: 'rgba(239,68,68,0.10)'  };
      return { color: 'transparent', label: '', bg: null };
    }
    if (serie === 'C') {
      if (idx < 4)   return { color: C.zGreen, label: 'Acesso Série B', bg: 'rgba(34,197,94,0.10)'  };
      if (idx >= 16) return { color: C.zRed,   label: 'Rebaixamento D', bg: 'rgba(239,68,68,0.10)'  };
      return { color: 'transparent', label: '', bg: null };
    }
    if (serie === 'D') {
      if (idx < 4)   return { color: C.zGreen, label: 'Acesso Série C', bg: 'rgba(34,197,94,0.10)'  };
      if (idx >= 16) return { color: C.zRed,   label: 'Zona de Corte',  bg: 'rgba(239,68,68,0.10)'  };
      return { color: 'transparent', label: '', bg: null };
    }
    // fallback
    if (idx < 4)   return { color: C.zGreen, label: 'Acesso', bg: 'rgba(34,197,94,0.10)' };
    if (idx >= 16) return { color: C.zRed,   label: 'Rebaixamento', bg: 'rgba(239,68,68,0.10)' };
    return { color: 'transparent', label: '', bg: null };
  };

  // ── Cores do badge de posição ─────────────────────────────
  const getBadgeColors = (idx, serie) => {
    const zone = getZone(idx, serie);
    if (zone.color === C.zGreen)     return { bg: C.zGreen,     text: '#fff' };
    if (zone.color === C.zLightBlue) return { bg: C.zLightBlue, text: '#fff' };
    if (zone.color === C.zBlue)      return { bg: C.zBlue,      text: '#fff' };
    if (zone.color === C.zRed)       return { bg: C.zRed,       text: '#fff' };
    // Posição neutra: fundo cinza médio visível no tema claro
    return { bg: '#94a3b8', text: '#fff' };
  };

  // ── Ícones de copa por zona ───────────────────────────────
  const getZoneCupIcon = (idx, serie) => {
    if (serie === 'A') {
      if (idx < 4)  return '🌟'; // Libertadores
      if (idx < 6)  return '🌟'; // Pré-Libertadores
      if (idx < 12) return '🌎'; // Sul-Americana
    }
    if (serie === 'B' || serie === 'C' || serie === 'D') {
      if (idx < 4) return '⬆️'; // Acesso
    }
    return null;
  };

  // ── Artilheiros ───────────────────────────────────────────
  const scorersArray = React.useMemo(() => {
    if (!gameData.scorers) return [];
    return Object.values(gameData.scorers)
      .map(v => (typeof v === 'number' ? null : v))
      .filter(Boolean)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
  }, [gameData.scorers]);

  const maxGoals = scorersArray.length > 0 ? scorersArray[0].goals : 1;

  const posColor = (pos) => ({
    GOL: { bg: '#f57f17', text: '#000' },
    ZAG: { bg: '#1565c0', text: '#fff' },
    LAT: { bg: '#0288d1', text: '#fff' },
    VOL: { bg: '#2e7d32', text: '#fff' },
    MEI: { bg: '#558b2f', text: '#fff' },
    ATA: { bg: '#c62828', text: '#fff' },
  }[pos] || { bg: '#555', text: '#fff' });

  const ovrColor = (o) => o >= 80 ? '#2e7d32' : o >= 70 ? '#f9a825' : '#c62828';

  const isAlreadyInSquad = (scorer) =>
    scorer.isUserTeam || gameData.players.some(p => p.id === scorer.id || p.name === scorer.name);

  const handleBuyScorer = (scorer) => {
    if (!buyPlayer) { showToast?.('Mercado não disponível.', 'error'); return; }
    buyPlayer({ ...scorer, isStarting: false, shirt: null, goals: 0, assists: 0, energy: 100, injury: null });
    setSelectedScorer(null);
  };

  const totalRounds  = gameData.fixtures?.length || 38;
  const currentRound = gameData.round || 0;
  const isSeasonEnd  = currentRound >= totalRounds;

  // Determina movimento de cada time (subiu ⬆️ / desceu ⬇️) no final da temporada
  const getMovement = (idx, serie) => {
    if (!isSeasonEnd) return null;
    if (serie === 'A') {
      if (idx >= 16) return { icon: '⬇️', color: '#ef4444', label: 'Rebaixado → Série B' };
      if (idx < 4)   return { icon: '🌟', color: '#22c55e', label: 'Libertadores' };
    }
    if (serie === 'B') {
      if (idx >= 16) return { icon: '⬇️', color: '#ef4444', label: 'Rebaixado → Série C' };
      if (idx < 4)   return { icon: '⬆️', color: '#22c55e', label: 'Acesso → Série A' };
    }
    if (serie === 'C') {
      if (idx >= 16) return { icon: '⬇️', color: '#ef4444', label: 'Rebaixado → Série D' };
      if (idx < 4)   return { icon: '⬆️', color: '#22c55e', label: 'Acesso → Série B' };
    }
    if (serie === 'D') {
      if (idx >= 16) return { icon: '❌', color: '#ef4444', label: 'Eliminado' };
      if (idx < 4)   return { icon: '⬆️', color: '#22c55e', label: 'Acesso → Série C' };
    }
    return null;
  };

  // ── ABAS ─────────────────────────────────────────────────
  const TABS = ['CLASSIFICAÇÃO', 'ARTILHEIROS'];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10, display: 'flex', flexDirection: 'column' }}>

      {/* ══ HEADER VERDE CAMPO ══════════════════════════════ */}
      <Box sx={{
        background: `linear-gradient(180deg, ${C.headerBg} 0%, ${C.fieldDark} 100%)`,
        px: 2, pt: 2.5, pb: 1.5,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Título */}
        <Typography sx={{
          textAlign: 'center', color: '#fff',
          fontWeight: 900, fontSize: '1.3rem',
          fontFamily: '"Nunito", sans-serif',
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
          letterSpacing: 1, lineHeight: 1,
        }}>
          CLASSIFICAÇÃO DA LIGA
        </Typography>
        <Typography sx={{
          textAlign: 'center', color: C.gold,
          fontWeight: 900, fontSize: '0.7rem', mt: 0.4,
          letterSpacing: 0.5,
        }}>
          Brasileirão Série {gameData.serie || 'A'} · Rodada {currentRound} / {totalRounds}
        </Typography>

        {/* Abas */}
        <Box sx={{ display: 'flex', mt: 1.5, bgcolor: C.bgCardAlt, borderRadius: '8px', p: 0.4, gap: 0.4 }}>
          {TABS.map((label, i) => (
            <Box
              key={i}
              onClick={() => setCurrentTab(i)}
              sx={{
                flex: 1, py: 0.8, textAlign: 'center', borderRadius: '6px', cursor: 'pointer',
                bgcolor: currentTab === i ? C.pts : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <Typography sx={{
                color: currentTab === i ? '#000' : C.txtMid,
                fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5,
              }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══ ABA 0: CLASSIFICAÇÃO ════════════════════════════ */}
      {currentTab === 0 && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>

          {/* Banner de fim de temporada */}
          {isSeasonEnd && (
            <Box sx={{ mx: 1, mb: 1, bgcolor: `${C.gold}18`, border: `1.5px solid ${C.gold}50`, borderRadius: '10px', px: 1.5, py: 0.9, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography sx={{ fontSize: '1.1rem' }}>🏁</Typography>
              <Box>
                <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>TEMPORADA ENCERRADA</Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>As setas indicam subidas e rebaixamentos</Typography>
              </Box>
            </Box>
          )}

          {/* Cabeçalho da tabela */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '38px 1fr 34px 28px 28px 28px 34px 34px',
            bgcolor: C.headerBg,
            px: 1, py: 0.9,
            borderBottom: `2px solid ${C.border}`,
          }}>
            {['#', 'TIME', 'J', 'V', 'E', 'D', 'SG', 'PTS'].map((h, i) => (
              <Typography key={i} sx={{
                color: 'rgba(255,255,255,0.85)', fontWeight: 900,
                fontSize: i === 1 ? '0.62rem' : '0.58rem',
                textAlign: i <= 1 ? 'left' : 'center',
                pl: i === 1 ? 0.5 : 0,
                letterSpacing: 0.3,
              }}>{h}</Typography>
            ))}
          </Box>

          {/* Linhas da tabela */}
          <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 210px)' }}>
            {gameData.table.map((t, idx) => {
              const zone     = getZone(idx, gameData.serie);
              const badge    = getBadgeColors(idx, gameData.serie);
              const isUser   = t.id === 'user';
              const sg       = t.gf - t.ga;
              const cupIcon  = getZoneCupIcon(idx, gameData.serie);
              const movement = getMovement(idx, gameData.serie);

              // Cor de fundo da linha
              let rowBg = idx % 2 === 0 ? C.rowEven : C.rowOdd;
              if (zone.bg) rowBg = zone.bg;
              if (isUser) rowBg = C.rowUser;

              return (
                <Box
                  key={t.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '38px 1fr 34px 28px 28px 28px 34px 34px',
                    bgcolor: rowBg,
                    px: 1, py: 0.55,
                    borderBottom: `1px solid ${C.border}`,
                    alignItems: 'center',
                    borderLeft: `4px solid ${zone.color !== 'transparent' ? zone.color : 'transparent'}`,
                    position: 'relative',
                    '&:active': { filter: 'brightness(0.95)' },
                  }}
                >
                  {/* # badge + seta de movimento */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '6px',
                      bgcolor: badge.bg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}>
                      <Typography sx={{ color: badge.text, fontWeight: 900, fontSize: '0.7rem', lineHeight: 1 }}>
                        {idx + 1}
                      </Typography>
                    </Box>
                    {movement && (
                      <Typography sx={{ fontSize: '0.6rem', lineHeight: 1 }} title={movement.label}>
                        {movement.icon}
                      </Typography>
                    )}
                  </Box>

                  {/* TIME (ícone + nome + manager) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, minWidth: 0, pl: 0.5 }}>
                    <TeamIcon name={t.name} size={26} />
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <Typography sx={{
                          fontWeight: 900,
                          fontSize: '0.80rem',
                          color: isUser ? C.pts : C.txtDark,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          lineHeight: 1.1,
                        }}>
                          {t.name}
                        </Typography>
                        {isUser && (
                          <Typography sx={{ fontSize: '0.6rem', lineHeight: 1 }}>⭐</Typography>
                        )}
                        {cupIcon && idx >= 0 && (
                          <Typography sx={{ fontSize: '0.55rem', lineHeight: 1, opacity: 0.8 }}>{cupIcon}</Typography>
                        )}
                      </Box>
                      <Typography sx={{
                        fontSize: '0.52rem', color: C.txtMid, fontWeight: 700, lineHeight: 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {isUser ? gameData.club?.manager || 'Você' : (window.getTeamCoach?.(t.name) || 'Técnico')}
                      </Typography>
                    </Box>
                  </Box>

                  {/* J */}
                  <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.ink3 }}>
                    {t.p}
                  </Typography>

                  {/* V */}
                  <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: C.green }}>
                    {t.w}
                  </Typography>

                  {/* E */}
                  <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.ink3 }}>
                    {t.d}
                  </Typography>

                  {/* D */}
                  <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: C.red }}>
                    {t.l}
                  </Typography>

                  {/* SG */}
                  <Typography sx={{
                    textAlign: 'center', fontSize: '0.7rem', fontWeight: 900,
                    color: sg > 0 ? C.green : sg < 0 ? C.red : '#607d8b',
                  }}>
                    {sg > 0 ? `+${sg}` : sg}
                  </Typography>

                  {/* PTS — badge azul */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{
                      minWidth: 28, px: 0.5, py: 0.25,
                      bgcolor: isUser ? C.gold : C.pts,
                      borderRadius: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    }}>
                      <Typography sx={{
                        color: '#fff', fontWeight: 900, fontSize: '0.75rem', lineHeight: 1,
                      }}>
                        {t.pts}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ── Legenda das zonas ── */}
          <Box sx={{
            mx: 1, mt: 1, mb: 0.5,
            bgcolor: C.headerBg, borderRadius: '10px',
            px: 1.5, py: 1,
          }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.55rem', fontWeight: 900, letterSpacing: 1, mb: 0.8, textAlign: 'center' }}>
              ZONAS DE CLASSIFICAÇÃO
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.6 }}>
              {(gameData.serie === 'A' ? [
                { color: C.zGreen,     label: '🌟 Libertadores (G4)' },
                { color: C.zLightBlue, label: '🌟 Pré-Libertadores (G6)' },
                { color: C.zBlue,      label: '🌎 Sul-Americana (G12)' },
                { color: C.zRed,       label: '⬇ Rebaixamento (Z4)' },
              ] : gameData.serie === 'B' ? [
                { color: C.zGreen, label: '⬆ Acesso Série A (G4)' },
                { color: C.zRed,   label: '⬇ Rebaixamento C (Z4)' },
              ] : gameData.serie === 'C' ? [
                { color: C.zGreen, label: '⬆ Acesso Série B (G4)' },
                { color: C.zRed,   label: '⬇ Rebaixamento D (Z4)' },
              ] : [
                { color: C.zGreen, label: '⬆ Acesso Série C (G4)' },
                { color: C.zRed,   label: '⬇ Zona de Corte (Z4)' },
              ]).map(({ color, label }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color, flexShrink: 0 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.58rem', fontWeight: 700 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ══ ABA 1: ARTILHEIROS ══════════════════════════════ */}
      {currentTab === 1 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <Box sx={{
            bgcolor: C.headerBg, px: 2, py: 1.2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `2px solid ${C.border}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography sx={{ fontSize: '1.3rem' }}>⚽</Typography>
              <Box>
                <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.85rem', lineHeight: 1 }}>ARTILHEIROS</Typography>
                <Typography sx={{ color: C.txt3, fontSize: '0.55rem', fontWeight: 700 }}>
                  {scorersArray.length} jogador{scorersArray.length !== 1 ? 'es' : ''} · Série {gameData.serie}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ bgcolor: `${C.gold}18`, border: `1px solid ${C.gold}40`, borderRadius: '8px', px: 1.2, py: 0.5, textAlign: 'center' }}>
              <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.7rem' }}>🥇 BOTA DE OURO</Typography>
            </Box>
          </Box>

          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {scorersArray.length > 0 ? scorersArray.map((player, idx) => {
              const isUser   = player.isUserTeam;
              const barPct   = Math.round((player.goals / maxGoals) * 100);
              const pc       = posColor(player.position);
              const medal    = idx === 0 ? { bg: 'linear-gradient(135deg,#ffd700,#f59e0b)', color: '#000', icon: '🥇' }
                             : idx === 1 ? { bg: 'linear-gradient(135deg,#94a3b8,#cbd5e1)', color: '#000', icon: '🥈' }
                             : idx === 2 ? { bg: 'linear-gradient(135deg,#cd7f32,#b45309)', color: '#fff', icon: '🥉' }
                             : null;
              const ovrC     = ovrColor(player.overall || 70);

              return (
                <Box
                  key={idx}
                  onClick={() => !isUser && setSelectedScorer(player)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.2, py: 0.85,
                    bgcolor: isUser
                      ? 'rgba(22,163,74,0.06)'
                      : idx % 2 === 0 ? C.bgCard : C.bgCardAlt,
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: `4px solid ${isUser ? C.green : medal ? '#ffd700' : 'transparent'}`,
                    cursor: isUser ? 'default' : 'pointer',
                    '&:active': !isUser ? { filter: 'brightness(0.92)' } : {},
                  }}
                >
                  {/* Posição/Medalha */}
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                    background: medal ? medal.bg : 'rgba(255,255,255,0.06)',
                    border: medal ? 'none' : `1px solid rgba(255,255,255,0.12)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {medal
                      ? <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{medal.icon}</Typography>
                      : <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem' }}>{idx + 1}</Typography>
                    }
                  </Box>

                  {/* Badge posição */}
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    bgcolor: pc.bg + '22',
                    border: `2px solid ${pc.bg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: pc.bg, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.3 }}>
                      {player.position}
                    </Typography>
                  </Box>

                  {/* Info + barra */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                      <Typography sx={{
                        fontWeight: 900, fontSize: '0.8rem',
                        color: isUser ? C.green : C.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1,
                      }}>
                        {player.name}
                      </Typography>
                      {isUser && <Typography sx={{ fontSize: '0.55rem', lineHeight: 1 }}>⭐</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: '0.56rem', color: C.txt3, fontWeight: 700, mb: 0.35, lineHeight: 1 }}>
                      {player.team}
                    </Typography>
                    {/* Barra de gols */}
                    <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <Box sx={{
                        height: '100%', borderRadius: 3,
                        width: `${barPct}%`,
                        background: isUser
                          ? `linear-gradient(90deg,${C.green},#16a34a)`
                          : `linear-gradient(90deg,${pc.bg},${pc.bg}cc)`,
                        transition: 'width 0.6s ease',
                      }} />
                    </Box>
                  </Box>

                  {/* OVR + Gols */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4, flexShrink: 0 }}>
                    {/* Gols badge */}
                    <Box sx={{
                      minWidth: 36, px: 0.6, py: 0.25,
                      background: isUser
                        ? `linear-gradient(135deg,${C.green},#15803d)`
                        : `linear-gradient(135deg,${pc.bg},${pc.bg}cc)`,
                      borderRadius: '8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      boxShadow: `0 2px 6px ${isUser ? '#f59e0b' : pc.bg}50`,
                    }}>
                      <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>
                        {player.goals}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.4rem', fontWeight: 900, letterSpacing: 0.8 }}>
                        GOLS
                      </Typography>
                    </Box>
                    {/* OVR pequeno */}
                    <Typography sx={{ color: ovrC, fontSize: '0.5rem', fontWeight: 900 }}>
                      {player.overall}
                    </Typography>
                  </Box>
                </Box>
              );
            }) : (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '3rem', mb: 1 }}>⚽</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontWeight: 700 }}>
                  Nenhum gol marcado ainda.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ══ MODAL: Detalhes do Artilheiro AI ════════════════ */}
      <Dialog open={!!selectedScorer} onClose={() => setSelectedScorer(null)} maxWidth="xs" fullWidth>
        {selectedScorer && (() => {
          const p = selectedScorer;
          const pc = posColor(p.position);
          const already = isAlreadyInSquad(p);
          const canBuy = gameData.club.money >= p.value;
          const fmt = formatMoney || (v => `R$ ${Number(v).toLocaleString('pt-BR')}`);
          return (
            <Box sx={{ bgcolor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              {/* Header */}
              <Box sx={{ background: `linear-gradient(135deg, ${C.bgDark}, ${C.bgCardAlt})`, px: 2, py: 2, textAlign: 'center' }}>
                <Box sx={{ bgcolor: pc.bg, color: pc.text, display: 'inline-block', borderRadius: '6px', px: 1, py: 0.2, fontSize: '0.65rem', fontWeight: 900, mb: 0.5 }}>
                  {p.position}
                </Box>
                <Typography sx={{ fontFamily: '"Nunito",sans-serif', fontWeight: 900, color: '#fff', fontSize: '1.2rem', lineHeight: 1.2 }}>
                  {p.name}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', mt: 0.3 }}>
                  {p.team}
                </Typography>
              </Box>
              {/* Stats */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 1.5 }}>
                  {[
                    { label: 'OVR',   val: p.overall || '?', color: ovrColor(p.overall || 70) },
                    { label: 'IDADE', val: `${p.age || '?'}a`, color: C.ink },
                    { label: 'GOLS',  val: p.goals, color: C.zGreen },
                  ].map(s => (
                    <Box key={s.label} sx={{ textAlign: 'center', bgcolor: C.bgCardAlt, borderRadius: '8px', py: 1, border: `1px solid ${C.border}` }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: s.color, lineHeight: 1 }}>{s.val}</Typography>
                      <Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color: C.ink3, letterSpacing: 0.5 }}>{s.label}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '8px', p: 1.2, mb: 1.5, border: `1px solid ${C.border}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#8b949e', fontWeight: 700 }}>Valor de mercado</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: '#22c55e' }}>{fmt(p.value || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#8b949e', fontWeight: 700 }}>Salário/rodada</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: '#f85149' }}>{fmt(p.wage || 0)}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#8b949e', fontWeight: 700 }}>Seu saldo:</Typography>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 900, color: canBuy ? C.zGreen : C.zRed }}>
                    {fmt(gameData.club.money)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => setSelectedScorer(null)}
                    sx={{ flex: 1, borderColor: '#1a3a22', color: '#8b949e', fontWeight: 900, borderRadius: '8px' }}>
                    Fechar
                  </Button>
                  {already ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(46,139,69,0.1)', borderRadius: '8px', border: `1px solid ${C.zGreen}` }}>
                      <Typography sx={{ color: C.zGreen, fontWeight: 900, fontSize: '0.72rem' }}>✅ No seu elenco</Typography>
                    </Box>
                  ) : (
                    <Button variant="contained" disabled={!canBuy || !buyPlayer} onClick={() => handleBuyScorer(p)}
                      sx={{ flex: 1, bgcolor: C.fieldDark, color: '#fff', fontWeight: 900, borderRadius: '8px', '&:hover': { bgcolor: C.headerBg }, '&:disabled': { bgcolor: 'rgba(0,0,0,0.12)' } }}>
                      {canBuy ? '🤝 Contratar' : '💸 Sem saldo'}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default ScreenTable;

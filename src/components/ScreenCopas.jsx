// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';

// components/ScreenCopas.js — v3.0 (Compatível com cups_engine v2.0 — ida/volta separados)
const ScreenCopas = ({ gameData, setScreen, formatMoney }) => {
  const [tab, setTab] = React.useState('copa');

  const C = THEME;

  const cups = gameData?.cups || {};
  const copa = cups.copaBrasil   || null;
  const lib  = cups.libertadores || null;
  const sul  = cups.sulAmericana || null;

  const StatusBadge = ({ status }) => {
    const cfg = {
      active:     { label: 'EM ANDAMENTO', bg: C.primary,  text: '#000' },
      eliminated: { label: 'ELIMINADO',    bg: C.red,      text: '#fff' },
      champion:   { label: '🏆 CAMPEÃO',   bg: C.gold,     text: '#000' },
    }[status] || { label: status, bg: C.border, text: C.txt2 };
    return (
      <Box sx={{ bgcolor: cfg.bg, borderRadius: '5px', px: 0.8, py: 0.2 }}>
        <Typography sx={{ color: cfg.text, fontWeight: 900, fontSize: '0.58rem', letterSpacing: 0.5 }}>
          {cfg.label}
        </Typography>
      </Box>
    );
  };

  // ── Card de um confronto (tie) ──────────────────────────
  const TieCard = ({ tie, cupColor, label }) => {
    if (!tie) return null;
    const leg1 = tie.leg1;
    const leg2 = tie.leg2;
    const isUserHome = tie.home?.isPlayer;

    return (
      <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1.2 }}>
        {/* Header confronto */}
        <Box sx={{ px: 1.5, py: 0.8, bgcolor: `${cupColor}18`, borderBottom: `1px solid ${cupColor}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: cupColor, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>
            {label} · {tie.phase}
          </Typography>
          {tie.decided && tie.winner && (
            <Box sx={{ bgcolor: tie.winner.isPlayer ? C.primary : C.red, borderRadius: '4px', px: 0.7, py: 0.1 }}>
              <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.55rem' }}>
                {tie.winner.isPlayer ? 'CLASSIFICADO ✓' : 'ELIMINADO'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Times */}
        <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          {window.TeamIcon ? React.createElement(window.TeamIcon, { name: tie.home?.name, size: 28 }) : null}
          <Typography sx={{ flex: 1, fontWeight: 900, fontSize: '0.78rem', color: tie.home?.isPlayer ? C.primary : C.txt1 }}>
            {tie.home?.name}
          </Typography>
          <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.7rem', mx: 0.5 }}>vs</Typography>
          <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 900, fontSize: '0.78rem', color: tie.away?.isPlayer ? C.primary : C.txt1 }}>
            {tie.away?.name}
          </Typography>
          {window.TeamIcon ? React.createElement(window.TeamIcon, { name: tie.away?.name, size: 28 }) : null}
        </Box>

        {/* Resultados dos jogos */}
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Jogo de Ida */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: C.cardAlt, borderRadius: '6px', px: 1, py: 0.5 }}>
            <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, minWidth: 60 }}>
              IDA (Rod {leg1?.round || '?'})
            </Typography>
            {leg1?.played ? (
              <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {leg1.home} – {leg1.away}
              </Typography>
            ) : (
              <Typography sx={{ color: C.txt3, fontSize: '0.65rem', fontStyle: 'italic' }}>
                Não jogado
              </Typography>
            )}
          </Box>

          {/* Jogo de Volta */}
          {leg2 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: C.cardAlt, borderRadius: '6px', px: 1, py: 0.5 }}>
              <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, minWidth: 60 }}>
                VOLTA (Rod {leg2?.round || '?'})
              </Typography>
              {leg2?.played ? (
                <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {leg2.home} – {leg2.away}
                </Typography>
              ) : (
                <Typography sx={{ color: C.txt3, fontSize: '0.65rem', fontStyle: 'italic' }}>
                  Não jogado
                </Typography>
              )}
            </Box>
          )}

          {/* Agregado após os dois jogos */}
          {tie.decided && tie.homeAggr !== null && (
            <Box sx={{ bgcolor: `${cupColor}12`, border: `1px solid ${cupColor}40`, borderRadius: '6px', px: 1, py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: C.txt2, fontSize: '0.6rem', fontWeight: 700 }}>AGREGADO</Typography>
              <Typography sx={{ color: cupColor, fontWeight: 900, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                {tie.homeAggr} – {tie.awayAggr}
                {tie.penalties && ` (Pen: ${tie.penalties.home}x${tie.penalties.away})`}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Premiação */}
        {(tie.prize || 0) > 0 && (
          <Box sx={{ px: 1.5, pb: 0.8 }}>
            <Typography sx={{ color: C.primary, fontSize: '0.62rem', fontWeight: 700 }}>
              💰 Premiação desta fase: {formatMoney ? formatMoney(tie.prize) : ''}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // ── Card de status geral de uma copa ───────────────────
  const CupCard = ({ cup, label, color }) => {
    if (!cup) return (
      <Box sx={{ bgcolor: C.card, border: `1px dashed ${C.border}`, borderRadius: '10px', p: 2, textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ color: C.txt3, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Não disponível esta temporada
        </Typography>
      </Box>
    );

    return (
      <Box sx={{ mb: 1.5 }}>
        {/* Header status */}
        <Box sx={{
          bgcolor: `${color}15`, border: `1.5px solid ${color}40`,
          borderRadius: '10px', px: 1.5, py: 1, mb: 1,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Box>
            <Typography sx={{ color, fontWeight: 900, fontSize: '0.82rem' }}>{label}</Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700, mt: 0.2 }}>
              {cup.phaseLabel || cup.phase || '—'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <StatusBadge status={cup.status} />
            {(cup.totalPrize || 0) > 0 && (
              <Typography sx={{ color: C.primary, fontSize: '0.58rem', fontWeight: 700, mt: 0.4 }}>
                {formatMoney ? formatMoney(cup.totalPrize) : ''} arrecadados
              </Typography>
            )}
          </Box>
        </Box>

        {/* Confronto atual */}
        {cup.currentTie && <TieCard tie={cup.currentTie} cupColor={color} label={label} />}

        {/* Mata-mata Lib/Sul */}
        {cup.knockoutTie && !cup.currentTie && <TieCard tie={cup.knockoutTie} cupColor={color} label={label} />}

        {/* Fase de grupos Lib/Sul */}
        {cup.phase === 'group' && cup.group && (
          <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1 }}>
            <Box sx={{ px: 1.5, py: 0.8, bgcolor: `${color}15`, borderBottom: `1px solid ${color}40` }}>
              <Typography sx={{ color, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>
                TABELA DO GRUPO
              </Typography>
            </Box>
            <Box sx={{ px: 0.8, py: 0.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 28px 28px 28px 28px', px: 0.5, mb: 0.3 }}>
                {['TIME','J','SG','G','PTS'].map((h, i) => (
                  <Typography key={i} sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 900, textAlign: i > 0 ? 'center' : 'left' }}>{h}</Typography>
                ))}
              </Box>
              {cup.group.map((t, i) => (
                <Box key={t.id || i} sx={{
                  display: 'grid', gridTemplateColumns: '1fr 28px 28px 28px 28px',
                  alignItems: 'center', px: 0.5, py: 0.35, borderRadius: '4px',
                  bgcolor: t.isPlayer ? 'rgba(34,197,94,0.08)' : i < 2 ? 'rgba(34,197,94,0.03)' : 'transparent',
                  borderLeft: `3px solid ${t.isPlayer ? C.primary : i < 2 ? C.borderG : 'transparent'}`,
                }}>
                  <Typography sx={{ color: t.isPlayer ? C.primary : C.txt1, fontWeight: t.isPlayer ? 900 : 600, fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </Typography>
                  {[t.p || 0, (t.gf||0)-(t.ga||0), t.gf || 0, t.pts || 0].map((v, j) => (
                    <Typography key={j} sx={{ textAlign: 'center', color: j === 3 ? (t.isPlayer ? C.primary : C.txt1) : C.txt2, fontWeight: j === 3 ? 900 : 600, fontSize: '0.65rem' }}>{v}</Typography>
                  ))}
                </Box>
              ))}
              <Typography sx={{ color: C.txt3, fontSize: '0.5rem', px: 0.5, py: 0.4 }}>🟢 Top 2 avançam</Typography>
            </Box>
          </Box>
        )}

        {/* Jogos do grupo — lista de confrontos agendados/disputados */}
        {cup.phase === 'group' && (cup.groupMatches || []).length > 0 && (
          <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1 }}>
            <Box sx={{ px: 1.5, py: 0.8, bgcolor: `${color}15`, borderBottom: `1px solid ${color}40` }}>
              <Typography sx={{ color, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>
                JOGOS DO GRUPO
              </Typography>
            </Box>
            {(cup.groupMatches || []).map((m, i) => {
              const leg1Played = m.leg1?.played;
              const leg1Score  = leg1Played ? `${m.leg1.home ?? '?'} – ${m.leg1.away ?? '?'}` : null;
              const isUserGame = m.home?.isPlayer || m.away?.isPlayer;
              return (
                <Box key={m.id || i} sx={{
                  display: 'flex', alignItems: 'center', px: 1.2, py: 0.7,
                  borderBottom: i < (cup.groupMatches.length - 1) ? `1px solid ${C.border}` : 'none',
                  bgcolor: isUserGame ? 'rgba(34,197,94,0.04)' : 'transparent',
                }}>
                  {/* Rodada */}
                  <Box sx={{ bgcolor: C.cardAlt, borderRadius: '4px', px: 0.6, py: 0.2, minWidth: 36, textAlign: 'center', mr: 1, flexShrink: 0 }}>
                    <Typography sx={{ color: C.txt3, fontSize: '0.52rem', fontWeight: 700 }}>
                      Rod {m.leg1?.round ?? '?'}
                    </Typography>
                  </Box>
                  {/* Casa */}
                  <Typography sx={{ flex: 1, textAlign: 'right', color: m.home?.isPlayer ? C.primary : C.txt2, fontWeight: m.home?.isPlayer ? 900 : 600, fontSize: '0.68rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {m.home?.name || '?'}
                  </Typography>
                  {/* Placar ou VS */}
                  <Box sx={{ mx: 0.8, minWidth: 44, textAlign: 'center', flexShrink: 0 }}>
                    {leg1Played ? (
                      <Typography sx={{ color: isUserGame ? C.txt1 : C.txt2, fontWeight: 900, fontSize: '0.72rem', fontFamily: 'monospace', bgcolor: C.cardAlt, borderRadius: '4px', px: 0.5, py: 0.15 }}>
                        {leg1Score}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: C.txt3, fontWeight: 700, fontSize: '0.65rem' }}>vs</Typography>
                    )}
                  </Box>
                  {/* Fora */}
                  <Typography sx={{ flex: 1, color: m.away?.isPlayer ? C.primary : C.txt2, fontWeight: m.away?.isPlayer ? 900 : 600, fontSize: '0.68rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {m.away?.name || '?'}
                  </Typography>
                  {/* Status */}
                  {leg1Played && (
                    <Box sx={{ ml: 0.8, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.65rem' }}>
                        {m.decided ? (m.winner?.isPlayer ? '✅' : '❌') : '🔄'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Histórico */}
        {(cup.history || []).length > 0 && (
          <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 0.7, borderBottom: `1px solid ${C.border}` }}>
              <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 0.5 }}>HISTÓRICO</Typography>
            </Box>
            {cup.history.map((h, i) => (
              <Box key={i} sx={{ px: 1.5, py: 0.6, display: 'flex', justifyContent: 'space-between', borderBottom: i < cup.history.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700 }}>
                  {h.phase || h.label}
                </Typography>
                {h.winner && (
                  <Typography sx={{ color: h.winner.isPlayer ? C.primary : C.red, fontSize: '0.65rem', fontWeight: 900 }}>
                    {h.winner.isPlayer ? '✓ Avançou' : '✗ Eliminado'}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // ── Tabs ────────────────────────────────────────────────
  const TABS = [
    { id: 'copa',    label: '🏆 Copa BR', color: C.copa    },
    { id: 'liberta', label: '🌟 Liberta', color: C.liberta },
    { id: 'sulam',   label: '🌎 Sul-Am',  color: C.sulam   },
  ];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10, background: `linear-gradient(180deg, ${C.bgCardAlt}, ${C.bg})` }}>

      {/* Header */}
      <Box sx={{ background: `linear-gradient(180deg, ${C.bgCard} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, px: 2, pt: 4, pb: 2 }}>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.1rem', fontFamily: '"Nunito", sans-serif', letterSpacing: 1 }}>
          COPAS & TORNEIOS
        </Typography>
        <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700, mt: 0.2 }}>
          Os jogos aparecem automaticamente no Calendário
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', bgcolor: C.card, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <Box key={t.id} onClick={() => setTab(t.id)} sx={{
            flex: 1, py: 1.1, textAlign: 'center', cursor: 'pointer',
            borderBottom: `3px solid ${tab === t.id ? t.color : 'transparent'}`,
            bgcolor: tab === t.id ? `${t.color}0d` : 'transparent',
            transition: 'all 0.2s',
          }}>
            <Typography sx={{ color: tab === t.id ? t.color : C.txt2, fontWeight: 900, fontSize: '0.65rem' }}>
              {t.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 1.5, pt: 1.5 }}>
        {tab === 'copa'    && <CupCard cup={copa} label="🏆 Copa do Brasil" color={C.copa}    />}
        {tab === 'liberta' && <CupCard cup={lib}  label="🌟 Libertadores"  color={C.liberta} />}
        {tab === 'sulam'   && <CupCard cup={sul}  label="🌎 Sul-Americana" color={C.sulam}   />}

        {/* Botão para ir ao calendário */}
        <Button fullWidth onClick={() => setScreen('matches')} sx={{
          bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
          color: C.txt2, fontWeight: 900, py: 1.2, mt: 0.5,
          '&:hover': { borderColor: C.primary, color: C.primary },
        }}>
          📅 Ver no Calendário de Partidas
        </Button>
      </Box>
    </Box>
  );
};

export default ScreenCopas;

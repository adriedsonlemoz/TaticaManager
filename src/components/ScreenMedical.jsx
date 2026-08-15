// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';
import { DisciplineEngine } from '../engines/engine_discipline.js';

// components/ScreenMedical.js — Centro Médico v1.0
const ScreenMedical = ({ gameData, setGameData, showToast, formatMoney }) => {
  const C = THEME;

  // ── Custos de tratamento ──────────────────────────────────
  const TREAT_COST    = 500000;  // acelera 1 rodada de lesão
  const ENERGY_COST   = 150000;  // recupera energia de um jogador cansado
  const PHYSIO_COST   = 300000;  // leve recuperação de múltiplos

  // ── Classificação dos jogadores ───────────────────────────
  const injured    = gameData.players.filter(p => p.injury);
  const suspended  = gameData.players.filter(p =>
    DisciplineEngine?.isPlayerSuspended(p, gameData.round)
  );
  const fatigued   = gameData.players.filter(p =>
    !p.injury && (p.energy ?? 100) < 60
  );
  const lowEnergy  = gameData.players.filter(p =>
    !p.injury && (p.energy ?? 100) >= 60 && (p.energy ?? 100) < 80
  );

  // ── Ações ─────────────────────────────────────────────────
  const handleTreat = (player) => {
    if (gameData.club.money < TREAT_COST)
      return showToast('Saldo insuficiente para tratamento!', 'error');
    setGameData(prev => ({
      ...prev,
      club: { ...prev.club, money: prev.club.money - TREAT_COST },
      players: prev.players.map(p => {
        if (p.id !== player.id || !p.injury) return p;
        const newLeft = p.injury.roundsLeft - 1;
        return newLeft <= 0
          ? { ...p, injury: null }
          : { ...p, injury: { ...p.injury, roundsLeft: newLeft } };
      }),
    }));
    showToast(`${player.name.split(' ')[0]} tratado! -1 rodada de lesão.`);
  };

  const handleRecoverEnergy = (player) => {
    if (gameData.club.money < ENERGY_COST)
      return showToast('Saldo insuficiente!', 'error');
    setGameData(prev => ({
      ...prev,
      club: { ...prev.club, money: prev.club.money - ENERGY_COST },
      players: prev.players.map(p =>
        p.id === player.id ? { ...p, energy: Math.min(100, (p.energy ?? 100) + 35) } : p
      ),
    }));
    showToast(`${player.name.split(' ')[0]} recuperou energia!`);
  };

  const handlePhysioSession = () => {
    if (gameData.club.money < PHYSIO_COST)
      return showToast('Saldo insuficiente para sessão de fisioterapia!', 'error');
    setGameData(prev => ({
      ...prev,
      club: { ...prev.club, money: prev.club.money - PHYSIO_COST },
      players: prev.players.map(p => ({
        ...p, energy: Math.min(100, (p.energy ?? 100) + 15)
      })),
    }));
    showToast('Sessão coletiva de fisioterapia realizada! +15% energia para todos.');
  };

  // ── Helpers visuais ───────────────────────────────────────
  const energyColor = (e) => e < 50 ? C.red : e < 75 ? C.yellow : C.green;
  

  const SectionHeader = ({ icon, title, count, color }) => (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      px: 1.5, py: 0.8, mb: 0.8,
      bgcolor: `${color}12`, borderRadius: '8px',
      border: `1px solid ${color}40`,
    }}>
      <Typography sx={{ fontSize: '1.1rem' }}>{icon}</Typography>
      <Typography sx={{ color, fontWeight: 900, fontSize: '0.8rem', flex: 1 }}>{title}</Typography>
      <Box sx={{
        bgcolor: color, color: '#fff', borderRadius: '10px',
        px: 0.8, py: 0.1, fontSize: '0.68rem', fontWeight: 900,
      }}>{count}</Box>
    </Box>
  );

  // ── Card de jogador lesionado ─────────────────────────────
  const InjuryCard = ({ p }) => {
    const Chip = JerseyBadge;
    return (
      <Paper sx={{
        mb: 1, bgcolor: C.card, border: `1.5px solid ${C.red}40`,
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.5, py: 1.1 }}>
          {/* PlayerChip */}
          {Chip
            ? React.createElement(Chip, { pos: p.position, num: p.shirt ?? '?', size: 44, showPos: true })
            : <Box sx={{ width:44, height:44, flexShrink:0 }} />
          }

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.88rem', color: C.txt1, lineHeight: 1.2 }}>
              {p.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.3, flexWrap: 'wrap' }}>
              <Typography sx={{
                fontSize: '0.6rem', fontWeight: 900, color: C.red,
                bgcolor: `${C.red}15`, px: 0.6, py: 0.15, borderRadius: '4px',
                border: `1px solid ${C.red}30`,
              }}>
                🚑 {p.injury.type}
              </Typography>
              {/* Badge de recaída (#85) */}
              {p.injury.recaida && (
                <Typography sx={{
                  fontSize: '0.56rem', fontWeight: 900, color: C.orange,
                  bgcolor: `${C.orange}18`, px: 0.6, py: 0.15, borderRadius: '4px',
                  border: `1px solid ${C.orange}40`,
                }}>⚠️ RECAÍDA</Typography>
              )}
              {/* Penalidade OVR (#70, #86) */}
              {(p.injury.ovrPenalty > 0) && (
                <Typography sx={{
                  fontSize: '0.56rem', fontWeight: 900, color: C.txt3,
                  bgcolor: C.bgDark, px: 0.6, py: 0.15, borderRadius: '4px',
                }}>-{p.injury.ovrPenalty} OVR no retorno</Typography>
              )}
              <Typography sx={{ fontSize: '0.6rem', color: C.txt2, fontWeight: 700 }}>
                {p.injury.roundsLeft} rod. restante{p.injury.roundsLeft > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>

          {/* Botão tratar */}
          <Button
            onClick={() => handleTreat(p)}
            size="small"
            sx={{
              flexShrink: 0, bgcolor: C.primary, color: '#fff',
              fontWeight: 900, fontSize: '0.62rem', px: 1.2, py: 0.5,
              borderRadius: '8px', border: `1.5px solid ${C.prim2}`,
              '&:hover': { bgcolor: C.prim2 },
            }}
          >
            Tratar<br />
            <span style={{ fontSize: '0.55rem', opacity: 0.85 }}>-R$ 500K</span>
          </Button>
        </Box>

        {/* Barra de progresso da recuperação */}
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: C.txt3 }}>RECUPERAÇÃO</Typography>
            <Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color: C.red }}>
              {p.injury.roundsLeft} rodada{p.injury.roundsLeft > 1 ? 's' : ''} até retorno
            </Typography>
          </Box>
          <Box sx={{ height: 5, bgcolor: 'rgba(148,24,24,0.12)', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', borderRadius: 3,
              bgcolor: p.injury.roundsLeft <= 1 ? C.green : p.injury.roundsLeft <= 3 ? C.yellow : C.red,
              width: `${Math.max(10, 100 - (p.injury.roundsLeft * 20))}%`,
              transition: 'width 0.3s',
            }} />
          </Box>
        </Box>
      </Paper>
    );
  };

  // ── Card de jogador suspenso ──────────────────────────────
  const SuspensionCard = ({ p }) => {
    const left = DisciplineEngine?.getPlayerSuspensionRoundsLeft(p, gameData.round) || 0;
    const Chip = JerseyBadge;
    return (
      <Paper sx={{
        mb: 1, bgcolor: C.card, border: `1.5px solid ${C.yellow}60`,
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.5, py: 1 }}>
          {Chip ? React.createElement(Chip, { pos: p.position, num: p.shirt ?? '?', size: 42, showPos: true }) : <Box sx={{ width:42, height:42, flexShrink:0 }}/>}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.88rem', color: C.txt1, lineHeight: 1.2 }}>
              {p.name}
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: C.yellow, fontWeight: 700 }}>
              🟥 Suspenso — {left} rodada{left > 1 ? 's' : ''} restante{left > 1 ? 's' : ''}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.4rem' }}>🚫</Typography>
        </Box>
      </Paper>
    );
  };

  // ── Card de jogador cansado ───────────────────────────────
  const FatigueCard = ({ p }) => {
    const energy = p.energy ?? 100;
    const Chip   = JerseyBadge;
    return (
      <Paper sx={{
        mb: 0.8, bgcolor: C.card,
        border: `1.5px solid ${energyColor(energy)}40`,
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, px: 1.5, py: 0.9 }}>
          {Chip ? React.createElement(Chip, { pos: p.position, num: p.shirt ?? '?', size: 42, showPos: true }) : <Box sx={{ width:42, height:42, flexShrink:0 }}/>}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.85rem', color: C.txt1, lineHeight: 1.2 }}>
              {p.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
              <Box sx={{ flex: 1, height: 5, bgcolor: 'rgba(54,36,20,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: energyColor(energy), borderRadius: 3 }} />
              </Box>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 900, color: energyColor(energy), minWidth: 28 }}>
                {energy}%
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={() => handleRecoverEnergy(p)}
            size="small"
            sx={{
              flexShrink: 0, bgcolor: C.yellow, color: '#fff',
              fontWeight: 900, fontSize: '0.6rem', px: 1, py: 0.5,
              borderRadius: '8px', border: `1.5px solid ${C.yellow}`,
              '&:hover': { bgcolor: '#9e6a00' },
            }}
          >
            Recuperar<br />
            <span style={{ fontSize: '0.52rem', opacity: 0.9 }}>-R$ 150K</span>
          </Button>
        </Box>
      </Paper>
    );
  };

  // ── Resumo geral ──────────────────────────────────────────
  const totalProblems = injured.length + suspended.length + fatigued.length;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10 }}>

      {/* HEADER — tema dark padrão do jogo */}
      <Box sx={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f4f7f6 100%)',
        borderBottom: `2px solid ${C.border}`,
        px: 1.5, pt: 3.8, pb: 1.4,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
            bgcolor: 'rgba(248,81,73,0.1)', border: '1.5px solid rgba(248,81,73,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>🏥</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1, letterSpacing: 0.5 }}>
              CENTRO MÉDICO
            </Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>
              {gameData.club.name} · Rodada {gameData.round}
            </Typography>
          </Box>
        </Box>

        {/* Resumo rápido */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.8 }}>
          {[
            { icon: '🚑', label: 'Lesionados',  val: injured.length,   color: C.red    },
            { icon: '🚫', label: 'Suspensos',   val: suspended.length, color: C.yellow },
            { icon: '😓', label: 'Cansados',    val: fatigued.length,  color: C.yellow },
          ].map(s => (
            <Box key={s.label} sx={{
              bgcolor: `${s.color}10`, borderRadius: '8px',
              border: `1px solid ${s.color}35`, p: 0.8, textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{s.icon}</Typography>
              <Typography sx={{ color: s.color, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.1 }}>
                {s.val}
              </Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.48rem', fontWeight: 700, letterSpacing: 0.5, mt: 0.1 }}>
                {s.label.toUpperCase()}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 1.5, pt: 1.5 }}>

        {/* Botão fisioterapia coletiva */}
        <Button
          fullWidth
          onClick={handlePhysioSession}
          variant="outlined"
          sx={{
            mb: 2, py: 1.2, borderColor: C.primary, color: C.primary,
            fontWeight: 900, fontSize: '0.82rem', borderRadius: '10px',
            '&:hover': { bgcolor: 'rgba(17,138,139,0.08)', borderColor: C.prim2 },
          }}
        >
          🧘 FISIOTERAPIA COLETIVA · {formatMoney(PHYSIO_COST)}<br />
          <Typography component="span" sx={{ fontSize: '0.6rem', color: C.txt3, fontWeight: 700 }}>
            +15% energia para todo o elenco
          </Typography>
        </Button>

        {/* Situação OK */}
        {totalProblems === 0 && (
          <Paper sx={{
            textAlign: 'center', py: 4, px: 2,
            bgcolor: C.card, border: `2px dashed ${C.green}60`,
            borderRadius: '14px',
          }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>💪</Typography>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem' }}>
              Elenco em plena forma!
            </Typography>
            <Typography sx={{ color: C.txt2, fontSize: '0.8rem', mt: 0.5 }}>
              Nenhum jogador lesionado, suspenso ou com cansaço crítico.
            </Typography>
          </Paper>
        )}

        {/* LESIONADOS */}
        {injured.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionHeader icon="🚑" title="DEPARTAMENTO MÉDICO" count={injured.length} color={C.red} />
            {injured.sort((a, b) => b.injury.roundsLeft - a.injury.roundsLeft).map(p => (
              <InjuryCard key={p.id} p={p} />
            ))}
          </Box>
        )}

        {/* SUSPENSOS */}
        {suspended.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <SectionHeader icon="🚫" title="SUSPENSOS" count={suspended.length} color={C.yellow} />
            {suspended.map(p => (
              <SuspensionCard key={p.id} p={p} />
            ))}
          </Box>
        )}

        {/* CANSAÇO CRÍTICO */}
        {fatigued.length > 0 && (
          <Box sx={{ mb: 2, mt: injured.length > 0 || suspended.length > 0 ? 2 : 0 }}>
            <SectionHeader icon="😓" title="CANSAÇO CRÍTICO (< 60%)" count={fatigued.length} color={C.red} />
            {fatigued.sort((a, b) => (a.energy ?? 100) - (b.energy ?? 100)).map(p => (
              <FatigueCard key={p.id} p={p} />
            ))}
          </Box>
        )}

        {/* ATENÇÃO (60–80%) */}
        {lowEnergy.length > 0 && (
          <Box sx={{ mb: 2, mt: 1.5, pt: 1.5, borderTop: `1px dashed ${C.border}` }}>
            <SectionHeader icon="⚡" title="ATENÇÃO — ENERGIA BAIXA (60–80%)" count={lowEnergy.length} color={C.yellow} />
            {lowEnergy.sort((a, b) => (a.energy ?? 100) - (b.energy ?? 100)).map(p => (
              <FatigueCard key={p.id} p={p} />
            ))}
          </Box>
        )}

        {/* Legenda de cansaço */}
        <Paper sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '10px', p: 1.5, mb: 2 }}>
          <Typography sx={{ color: C.txt2, fontWeight: 900, fontSize: '0.65rem', mb: 0.8, letterSpacing: 0.5 }}>
            ℹ️ COMO FUNCIONA O CANSAÇO
          </Typography>
          {[
            { icon: '🟢', range: '80–100%', effect: 'Forma ideal — sem penalidade de OVR' },
            { icon: '🟡', range: '65–79%',  effect: 'Ligeiro cansaço — -2 de OVR efetivo' },
            { icon: '🟠', range: '50–64%',  effect: 'Cansado — -5 de OVR + risco de lesão' },
            { icon: '🔴', range: '0–49%',   effect: 'Exausto — -8 de OVR + alto risco de lesão' },
          ].map(row => (
            <Box key={row.range} sx={{ display: 'flex', gap: 1, mb: 0.4, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.7rem' }}>{row.icon}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '0.65rem', color: C.txt1, minWidth: 60 }}>
                {row.range}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: C.txt2 }}>{row.effect}</Typography>
            </Box>
          ))}
        </Paper>

      </Box>
    </Box>
  );
};

export default ScreenMedical;

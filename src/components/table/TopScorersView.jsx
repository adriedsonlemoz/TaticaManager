import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { ovrColor, posColor } from '../../helpers.js';

const C = THEME;

const getMedal = (rank) => {
  if (rank === 1) return { bg: 'linear-gradient(135deg,#ffd700,#f59e0b)', icon: '🥇' };
  if (rank === 2) return { bg: 'linear-gradient(135deg,#94a3b8,#cbd5e1)', icon: '🥈' };
  if (rank === 3) return { bg: 'linear-gradient(135deg,#cd7f32,#b45309)', icon: '🥉' };
  return null;
};

const ScorerRow = ({ player, onSelect }) => {
  const pc = posColor(player.position);
  const medal = getMedal(player.rank);
  const barPct = Math.round((player.goals / player.maxGoals) * 100);
  const overallColor = ovrColor(player.overall || 70);
  const isUser = Boolean(player.isUserTeam);

  return (
    <Box
      component={isUser ? 'div' : 'button'}
      type={isUser ? undefined : 'button'}
      onClick={isUser ? undefined : () => onSelect(player)}
      sx={{
        width: '100%', border: 0, textAlign: 'left', font: 'inherit',
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.2, py: 0.85,
        bgcolor: isUser ? 'rgba(22,163,74,0.06)' : player.rank % 2 === 1 ? C.bgCard : C.bgCardAlt,
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `4px solid ${isUser ? C.green : medal ? '#ffd700' : 'transparent'}`,
        cursor: isUser ? 'default' : 'pointer',
        '&:active': !isUser ? { filter: 'brightness(0.92)' } : {},
      }}
      aria-label={isUser ? undefined : `Ver detalhes de ${player.name}`}
    >
      <Box sx={{
        width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
        background: medal ? medal.bg : 'rgba(255,255,255,0.06)',
        border: medal ? 'none' : '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {medal
          ? <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{medal.icon}</Typography>
          : <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.65rem' }}>{player.rank}</Typography>}
      </Box>

      <Box sx={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        bgcolor: `${pc.bg}22`, border: `2px solid ${pc.bg}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography sx={{ color: pc.bg, fontSize: '0.5rem', fontWeight: 900, letterSpacing: 0.3 }}>
          {player.position}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
          <Typography sx={{
            fontWeight: 900, fontSize: '0.8rem', color: isUser ? C.green : C.ink,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1,
          }}>
            {player.name}
          </Typography>
          {isUser && <Typography sx={{ fontSize: '0.55rem', lineHeight: 1 }}>⭐</Typography>}
        </Box>
        <Typography sx={{ fontSize: '0.56rem', color: C.txt3, fontWeight: 700, mb: 0.35, lineHeight: 1 }}>
          {player.team}
        </Typography>
        <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', borderRadius: 3, width: `${barPct}%`,
            background: isUser ? `linear-gradient(90deg,${C.green},#16a34a)` : `linear-gradient(90deg,${pc.bg},${pc.bg}cc)`,
            transition: 'width 0.6s ease',
          }} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.4, flexShrink: 0 }}>
        <Box sx={{
          minWidth: 36, px: 0.6, py: 0.25,
          background: isUser ? `linear-gradient(135deg,${C.green},#15803d)` : `linear-gradient(135deg,${pc.bg},${pc.bg}cc)`,
          borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: `0 2px 6px ${isUser ? '#f59e0b' : pc.bg}50`,
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>{player.goals}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.4rem', fontWeight: 900, letterSpacing: 0.8 }}>GOLS</Typography>
        </Box>
        <Typography sx={{ color: overallColor, fontSize: '0.5rem', fontWeight: 900 }}>{player.overall}</Typography>
      </Box>
    </Box>
  );
};

const TopScorersView = ({ scorers, serie, onSelect }) => (
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            {scorers.length} jogador{scorers.length !== 1 ? 'es' : ''} · Série {serie}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ bgcolor: `${C.gold}18`, border: `1px solid ${C.gold}40`, borderRadius: '8px', px: 1.2, py: 0.5, textAlign: 'center' }}>
        <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.7rem' }}>🥇 BOTA DE OURO</Typography>
      </Box>
    </Box>

    <Box sx={{ overflowY: 'auto', flex: 1 }}>
      {scorers.length > 0 ? scorers.map(player => (
        <ScorerRow key={player.scorerKey} player={player} onSelect={onSelect} />
      )) : (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 1 }}>⚽</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontWeight: 700 }}>
            Nenhum gol marcado ainda.
          </Typography>
        </Box>
      )}
    </Box>
  </Box>
);

export default TopScorersView;

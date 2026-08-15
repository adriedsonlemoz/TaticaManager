// @migrated to ES module
import React from 'react';
import { Box, Typography, Button, Paper, Dialog, DialogContent, CircularProgress, LinearProgress, Chip, Tabs, Tab, TextField, Slider, Switch, FormControlLabel, IconButton, Tooltip, Divider, Avatar, Badge } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { JerseyBadge, posColor, ovrColor } from '../helpers.js';

// components/ScreenGameOver.js — v2.0 (Falência + Demissão)
const ScreenGameOver = ({ gameData, setScreen, setGameData, persistence }) => {
  const C = THEME;

  const isFired   = gameData?.gameOverReason === 'fired';
  const fireMsg   = gameData?.gameOverMessage || '';
  const mp        = gameData?.club?.managerProfile || {};
  const total     = (mp.wins || 0) + (mp.draws || 0) + (mp.losses || 0);
  const pct       = total > 0 ? (((mp.wins || 0) / total) * 100).toFixed(1) : '0.0';
  const seasons   = (gameData?.careerHistory || []).length;
  const bestPos   = (gameData?.careerHistory || []).reduce((b, e) => Math.min(b, e.position || 99), 99);
  const trophies  = (gameData?.careerHistory || []).filter(e => e.cupResult === 'champion').length;

  const accentColor = isFired ? C.orange || '#f97316' : C.red;
  const icon        = isFired ? '🪑' : '💸';
  const title       = isFired ? 'DEMITIDO!' : 'FALÊNCIA!';
  const subtitle    = isFired
    ? `A diretoria encerrou seu contrato com ${gameData?.club?.name}.`
    : 'As contas zeradas encerraram sua jornada como treinador.';

  const stats = [
    { icon: '📅', label: 'Temporadas',      v: seasons || 1 },
    { icon: '✅', label: 'Vitórias',         v: mp.wins   || 0, color: C.green },
    { icon: '📉', label: 'Derrotas',         v: mp.losses || 0, color: C.red   },
    { icon: '🏆', label: 'Troféus',          v: trophies,       color: C.gold  },
    { icon: '🏅', label: 'Melhor posição',   v: bestPos < 99 ? `${bestPos}º` : '—' },
    { icon: '⭐', label: 'Experiência',      v: mp.experience || 0, color: C.blue },
  ];

  return (
    <Box sx={{
      bgcolor: C.bg, minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', p: 2,
      background: `radial-gradient(ellipse at 50% 20%, ${accentColor}18 0%, transparent 60%), ${C.bg}`,
    }}>

      {/* Ícone central */}
      <Box sx={{
        width: 96, height: 96, borderRadius: '50%',
        bgcolor: `${accentColor}15`, border: `3px solid ${accentColor}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        mb: 2, boxShadow: `0 0 32px ${accentColor}30`,
      }}>
        <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>{icon}</Typography>
      </Box>

      <Typography sx={{ color: accentColor, fontWeight: 900, fontSize: '1.5rem', letterSpacing: 1, mb: 0.5, textAlign: 'center' }}>
        {title}
      </Typography>
      <Typography sx={{ color: C.txt2, fontWeight: 700, fontSize: '0.82rem', mb: 0.3, textAlign: 'center' }}>
        {gameData?.club?.name}
      </Typography>
      <Typography sx={{ color: C.txt3, fontSize: '0.7rem', fontWeight: 700, mb: isFired ? 0.6 : 2.5, textAlign: 'center' }}>
        {subtitle}
      </Typography>

      {/* Motivo da demissão */}
      {isFired && fireMsg && (
        <Box sx={{
          bgcolor: `${accentColor}0d`, border: `1px solid ${accentColor}40`,
          borderRadius: '10px', px: 1.8, py: 1, mb: 2, width: '100%', maxWidth: 360, textAlign: 'center',
        }}>
          <Typography sx={{ color: accentColor, fontSize: '0.72rem', fontWeight: 700 }}>
            📋 {fireMsg}
          </Typography>
        </Box>
      )}

      {/* Legado */}
      <Box sx={{
        bgcolor: C.bgCard || C.card, border: `1.5px solid ${C.border}`,
        borderRadius: '16px', p: 2, mb: 2, width: '100%', maxWidth: 360,
      }}>
        <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1.5, mb: 1.2, textAlign: 'center' }}>
          SEU LEGADO
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
          {stats.map((s, i) => (
            <Box key={i} sx={{ textAlign: 'center', bgcolor: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '10px', py: 1.2 }}>
              <Typography sx={{ fontSize: '1.1rem', lineHeight: 1, mb: 0.3 }}>{s.icon}</Typography>
              <Typography sx={{ color: s.color || C.txt1, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1 }}>{s.v}</Typography>
              <Typography sx={{ color: C.txt3, fontSize: '0.46rem', fontWeight: 700, mt: 0.2, letterSpacing: 0.3 }}>{s.label.toUpperCase()}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Taxa de aproveitamento */}
      <Box sx={{
        bgcolor: `${accentColor}08`, border: `1px solid ${accentColor}25`,
        borderRadius: '12px', px: 2, py: 1.2, mb: 2.5, width: '100%', maxWidth: 360, textAlign: 'center',
      }}>
        <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 700, mb: 0.3 }}>APROVEITAMENTO DE CARREIRA</Typography>
        <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '1.6rem', lineHeight: 1 }}>{pct}%</Typography>
        <Typography sx={{ color: C.txt3, fontSize: '0.56rem', fontWeight: 700, mt: 0.2 }}>
          {total} jogos · {mp.wins || 0}V {mp.draws || 0}E {mp.losses || 0}D
        </Typography>
      </Box>

      {/* Ações */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 360 }}>
        <Button
          fullWidth
          onClick={() => setScreen('boot')}
          sx={{
            py: 1.4, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem',
            bgcolor: accentColor, color: '#fff',
            boxShadow: `0 4px 16px ${accentColor}40`,
            '&:hover': { filter: 'brightness(0.9)' },
          }}
        >
          🔄 Nova Carreira
        </Button>
        <Button
          fullWidth
          onClick={() => setScreen('career')}
          variant="outlined"
          sx={{
            py: 1.2, borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem',
            borderColor: C.border, color: C.txt2,
          }}
        >
          📊 Ver Legado Completo
        </Button>
      </Box>
    </Box>
  );
};

export default ScreenGameOver;

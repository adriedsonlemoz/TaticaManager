import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const NextMatchSeasonEnd = ({ gameData, season, setScreen, theme }) => (
  <Box sx={{ bgcolor: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
    <Box sx={{ bgcolor: theme.card, border: `2px solid ${theme.green}`, borderRadius: '16px', p: 3, textAlign: 'center', maxWidth: 340, width: '100%' }}>
      <Typography sx={{ fontSize: '3rem', mb: 1 }}>🏆</Typography>
      <Typography sx={{ color: theme.green, fontWeight: 900, fontSize: '1.2rem', mb: 0.8 }}>FIM DA TEMPORADA!</Typography>
      <Typography sx={{ color: theme.txt2, mb: 2.5, fontSize: '0.85rem' }}>
        {gameData.club.name} finalizou em <strong style={{ color: theme.txt1 }}>{season.position}º lugar</strong> com <strong style={{ color: theme.green }}>{season.row.pts || 0} pts</strong>
      </Typography>
      <Button fullWidth onClick={() => setScreen('table')} sx={{ bgcolor: theme.green, color: '#fff', fontWeight: 900, borderRadius: '10px', py: 1.2 }}>
        Ver Tabela Final
      </Button>
    </Box>
  </Box>
);

export default NextMatchSeasonEnd;

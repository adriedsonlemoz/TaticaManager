import React from 'react';
import { Box, Typography } from '@mui/material';
import JerseyBadge from '../player/JerseyBadge.jsx';
import { sortNextMatchPlayers } from '../../engines/nextmatch/nextMatchViewModel.js';

const PlayerRow = ({ player, align, theme }) => {
  const goals = player.seasonGoals || player.goals || 0;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, py: 0.35, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
      <JerseyBadge pos={player.position} num={player.shirt ?? '?'} size={32} showPos={false} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: theme.txt1, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: align }}>
          {player.name?.split(' ').slice(-1)[0] || player.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
          <Typography sx={{ color: theme.txt3, fontSize: '0.5rem', fontWeight: 700 }}>OVR {player.overall}</Typography>
          {goals > 0 && <Typography sx={{ color: theme.green, fontSize: '0.5rem', fontWeight: 900 }}>⚽{goals}</Typography>}
        </Box>
      </Box>
    </Box>
  );
};

const NextMatchLineups = ({ gameData, viewModel, theme }) => {
  const userPlayers = sortNextMatchPlayers(viewModel.starters);
  const opponentPlayers = sortNextMatchPlayers(viewModel.opponentStarters);

  return (
    <Box sx={{ bgcolor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2 }}>
      <Box sx={{ bgcolor: theme.cardAlt, px: 1.5, py: 0.8, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Typography sx={{ fontSize: '0.9rem' }}>📋</Typography>
        <Typography sx={{ color: theme.txt2, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.8 }}>ESCALAÇÕES</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
        <Box sx={{ px: 1.2, py: 0.8 }}>
          <Typography sx={{ color: theme.green, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 0.5, mb: 0.5 }}>
            {gameData.club.name?.split(' ').slice(0, 2).join(' ')} ({userPlayers.length}/11)
          </Typography>
          {userPlayers.map((player) => <PlayerRow key={player.id || player.name} player={player} align="left" theme={theme} />)}
          {userPlayers.length === 0 && <Typography sx={{ color: theme.red, fontSize: '0.6rem', fontWeight: 700, py: 1 }}>Nenhum titular</Typography>}
        </Box>

        <Box sx={{ bgcolor: theme.border }} />

        <Box sx={{ px: 1.2, py: 0.8 }}>
          <Typography sx={{ color: theme.blue, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 0.5, mb: 0.5, textAlign: 'right' }}>
            {viewModel.opponent?.name?.split(' ').slice(0, 2).join(' ') || 'Adversário'} ({opponentPlayers.length}/11)
          </Typography>
          {opponentPlayers.map((player) => <PlayerRow key={player.id || player.name} player={player} align="right" theme={theme} />)}
          {opponentPlayers.length === 0 && <Typography sx={{ color: theme.txt3, fontSize: '0.6rem', fontWeight: 700, py: 1, textAlign: 'right' }}>Elenco CPU</Typography>}
        </Box>
      </Box>
    </Box>
  );
};

export default NextMatchLineups;

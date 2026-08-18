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

const TeamColumn = ({ name, players, isUser, align, theme }) => (
  <Box sx={{ px: 1.2, py: 0.8 }}>
    <Typography sx={{ color: isUser ? theme.green : theme.blue, fontWeight: 900, fontSize: '0.55rem', letterSpacing: 0.5, mb: 0.5, textAlign: align }}>
      {name?.split(' ').slice(0, 2).join(' ') || 'Equipe'} ({players.length}/11)
    </Typography>
    {players.map((player) => <PlayerRow key={player.id || player.name} player={player} align={align} theme={theme} />)}
    {players.length === 0 && (
      <Typography sx={{ color: isUser ? theme.red : theme.txt3, fontSize: '0.6rem', fontWeight: 700, py: 1, textAlign: align }}>
        {isUser ? 'Nenhum titular' : 'Elenco CPU'}
      </Typography>
    )}
  </Box>
);

const NextMatchLineups = ({ gameData, viewModel, theme }) => {
  if (viewModel.userSide !== 'home' && viewModel.userSide !== 'away') {
    return (
      <Box sx={{ bgcolor: theme.card, border: `1px solid ${theme.red}55`, borderRadius: '14px', overflow: 'hidden', mb: 1.2, p: 1.4 }}>
        <Typography sx={{ color: theme.red, fontWeight: 900, fontSize: '0.66rem', textAlign: 'center' }}>
          Não foi possível associar as escalações aos lados CASA/FORA.
        </Typography>
        <Typography sx={{ color: theme.txt3, fontSize: '0.55rem', textAlign: 'center', mt: 0.4 }}>
          A partida permanece bloqueada para evitar exibir seu elenco sob o nome da equipe adversária.
        </Typography>
      </Box>
    );
  }

  const userPlayers = sortNextMatchPlayers(viewModel.starters);
  const opponentPlayers = sortNextMatchPlayers(viewModel.opponentStarters);
  const userIsHome = viewModel.userSide === 'home';
  const homePlayers = userIsHome ? userPlayers : opponentPlayers;
  const awayPlayers = userIsHome ? opponentPlayers : userPlayers;
  const homeIsUser = userIsHome;
  const awayIsUser = viewModel.userSide === 'away';

  return (
    <Box sx={{ bgcolor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2 }}>
      <Box sx={{ bgcolor: theme.cardAlt, px: 1.5, py: 0.8, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Typography sx={{ fontSize: '0.9rem' }}>📋</Typography>
        <Typography sx={{ color: theme.txt2, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.8 }}>ESCALAÇÕES · CASA × FORA</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
        <TeamColumn
          name={viewModel.displayHome?.name}
          players={homePlayers}
          isUser={homeIsUser}
          align="left"
          theme={theme}
        />
        <Box sx={{ bgcolor: theme.border }} />
        <TeamColumn
          name={viewModel.displayAway?.name}
          players={awayPlayers}
          isUser={awayIsUser}
          align="right"
          theme={theme}
        />
      </Box>
    </Box>
  );
};

export default NextMatchLineups;

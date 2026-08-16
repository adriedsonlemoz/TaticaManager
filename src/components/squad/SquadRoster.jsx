import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import FieldView from '../FieldView.jsx';
import SquadPlayerCard from './SquadPlayerCard.jsx';

export default function SquadRoster({ gameData, viewModel, groupTab, onOpenPlayer, formatMoney }) {
  const C = THEME;
  const renderRow = (row) => <SquadPlayerCard key={row.player.id} row={row} onOpenPlayer={onOpenPlayer} formatMoney={formatMoney}/>;

  if (groupTab === 'campo') {
    return (
      <FieldView
        starters={viewModel.starters}
        formation={viewModel.formation}
        teamOvr={viewModel.teamOvr}
        gameData={gameData}
        onPlayerClick={onOpenPlayer}
        C={C}
      />
    );
  }

  return (
    <Box sx={{ px:1.5, pt:1.2, pb:2 }}>
      {groupTab === 'all' ? (
        <>
          <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:1.5, mb:0.8 }}>TITULARES ({viewModel.starters.length})</Typography>
          {viewModel.starterRows.map(renderRow)}
          <Box sx={{ height:1, bgcolor:C.border, my:1.5 }}/>
          <Typography sx={{ color:C.txt3, fontWeight:900, fontSize:'0.6rem', letterSpacing:1.5, mb:0.8 }}>RESERVAS ({viewModel.bench.length})</Typography>
          {viewModel.benchRows.map(renderRow)}
        </>
      ) : viewModel.list.map(renderRow)}

      {viewModel.list.length === 0 && groupTab !== 'all' && (
        <Box sx={{ textAlign:'center', py:5 }}>
          <Typography sx={{ fontSize:'2.5rem', mb:1 }}>👥</Typography>
          <Typography sx={{ color:C.txt3, fontSize:'0.8rem', fontWeight:700 }}>Nenhum jogador nesta categoria</Typography>
        </Box>
      )}
    </Box>
  );
}

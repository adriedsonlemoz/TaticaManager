import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import SquadActions from './squad/SquadActions.jsx';
import SquadHeader from './squad/SquadHeader.jsx';
import SquadRoster from './squad/SquadRoster.jsx';
import SquadSortBar from './squad/SquadSortBar.jsx';
import { buildSquadViewModel } from '../engines/squad/squadViewModel.js';

const ScreenSquad = ({ gameData, trainSquad, setPlayerModal, formatMoney, setScreen }) => {
  const C = THEME;
  const [groupTab, setGroupTab] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('position');
  const viewModel = React.useMemo(() => buildSquadViewModel(gameData, groupTab, sortBy), [gameData, groupTab, sortBy]);
  const fmt = React.useCallback((value) => formatMoney ? formatMoney(value) : `R$${((Number(value) || 0) / 1e6).toFixed(1)}M`, [formatMoney]);

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:10, background:`radial-gradient(ellipse at 50% 0%,rgba(34,197,94,0.06) 0%,transparent 40%),${C.bg}` }}>
      <SquadHeader viewModel={viewModel} groupTab={groupTab} onGroupChange={setGroupTab} formatMoney={fmt}/>
      <SquadSortBar options={viewModel.sortOptions} sortBy={sortBy} onSortChange={setSortBy}/>
      <SquadRoster gameData={gameData} viewModel={viewModel} groupTab={groupTab} onOpenPlayer={setPlayerModal} formatMoney={fmt}/>
      <SquadActions onTrain={trainSquad} onLineup={() => setScreen?.('lineup')} onMarket={() => setScreen?.('market')}/>
    </Box>
  );
};

export default ScreenSquad;

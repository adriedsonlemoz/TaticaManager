import React from 'react';
import { Box } from '@mui/material';
import HomeHeader from './home/HomeHeader.jsx';
import HomeLineupAlert from './home/HomeLineupAlert.jsx';
import HomeNextMatchCard from './home/HomeNextMatchCard.jsx';
import HomeNavigationGrid from './home/HomeNavigationGrid.jsx';
import { HOME_THEME } from './home/homeTheme.js';
import { buildHomeViewModel } from '../engines/home/homeViewModel.js';

const MenuPrincipal = ({ gameData, setScreen, formatMoney }) => {
  const viewModel = React.useMemo(() => buildHomeViewModel(gameData), [gameData]);
  const navigate = React.useCallback((screen) => setScreen(screen), [setScreen]);

  return (
    <Box sx={{ bgcolor: HOME_THEME.bg, minHeight: '100vh', pb: 10, fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @keyframes v1-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)} 60%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes v1-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>

      <HomeHeader viewModel={viewModel} formatMoney={formatMoney} />
      <HomeLineupAlert lineup={viewModel.lineup} onOpenLineup={() => navigate('lineup')} />
      <HomeNextMatchCard viewModel={viewModel} onNavigate={navigate} />
      <HomeNavigationGrid cards={viewModel.cards} onNavigate={navigate} />
    </Box>
  );
};

export default MenuPrincipal;

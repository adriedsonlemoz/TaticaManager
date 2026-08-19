import React from 'react';
import { Box } from '@mui/material';
import HomeHeader from './home/HomeHeader.jsx';
import HomeLineupAlert from './home/HomeLineupAlert.jsx';
import HomeNextMatchCard from './home/HomeNextMatchCard.jsx';
import HomeNavigationGrid from './home/HomeNavigationGrid.jsx';
import { buildHomeTheme } from './home/homeTheme.js';
import { buildHomeViewModel } from '../engines/home/homeViewModel.js';

const MenuPrincipal = ({ gameData, setScreen, formatMoney }) => {
  const viewModel = React.useMemo(() => buildHomeViewModel(gameData), [gameData]);
  const homeTheme = React.useMemo(() => buildHomeTheme(gameData?.club?.name), [gameData?.club?.name]);
  const navigate = React.useCallback((screen) => setScreen(screen), [setScreen]);

  return (
    <Box sx={{ bgcolor: homeTheme.bg, minHeight: '100dvh', pb: 7.5, fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @keyframes v1-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)} 60%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        @keyframes v1-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>

      <HomeHeader viewModel={viewModel} formatMoney={formatMoney} theme={homeTheme} />
      <HomeLineupAlert lineup={viewModel.lineup} onOpenLineup={() => navigate('lineup')} theme={homeTheme} />
      <HomeNextMatchCard viewModel={viewModel} onNavigate={navigate} theme={homeTheme} />
      <HomeNavigationGrid cards={viewModel.cards} onNavigate={navigate} theme={homeTheme} />
    </Box>
  );
};

export default MenuPrincipal;

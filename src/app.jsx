import React from 'react';
import { Box } from '@mui/material';
import BottomNav from './components/BottomNav.jsx';
import GameScreenRouter from './components/app/GameScreenRouter.jsx';
import AppOverlays from './components/app/AppOverlays.jsx';
import useGameController from './hooks/useGameController.js';
import { buildHomeTheme } from './components/home/homeTheme.js';

const Game = () => {
  const controller = useGameController();
  const { gameData, screen, handleNav, simulation, saveGame } = controller;
  const showBottomNav = gameData && !['boot', 'setup'].includes(screen);
  const systemTheme = React.useMemo(() => buildHomeTheme(gameData?.club?.name), [gameData?.club?.name]);

  React.useEffect(() => {
    const root = document.documentElement;
    const nativeApp = Boolean(globalThis?.Capacitor?.isNativePlatform?.());
    root.classList.toggle('is-native-app', nativeApp);
    root.style.setProperty('--app-system-top', systemTheme.headerStart || '#04150b');
    root.style.setProperty('--app-system-bottom', systemTheme.headerStart || '#04150b');
    const themeColor = document.querySelector('meta[name=\"theme-color\"]');
    if (themeColor) themeColor.setAttribute('content', systemTheme.headerStart || '#04150b');
  }, [systemTheme.headerStart]);

  return (
    <>
      <Box aria-hidden="true" sx={{
        position:'fixed', top:0, left:0, right:0, height:'var(--app-safe-top)',
        bgcolor:'var(--app-system-top)', zIndex:1300, pointerEvents:'none',
      }} />
      <Box className="app-scroll-shell" sx={{
        height:'100dvh', overflowY:'auto', bgcolor:'background.default',
        pt:'var(--app-safe-top)', boxSizing:'border-box',
      }}>
        <GameScreenRouter controller={controller} />
      </Box>

      {showBottomNav && (
        <BottomNav
          screen={screen}
          setScreen={handleNav}
          simulating={simulation.simulating}
          saveGame={saveGame}
          gameData={gameData}
        />
      )}

      <AppOverlays controller={controller} />
    </>
  );
};

export default Game;

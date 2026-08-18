import React from 'react';
import { Box } from '@mui/material';
import BottomNav from './components/BottomNav.jsx';
import GameScreenRouter from './components/app/GameScreenRouter.jsx';
import AppOverlays from './components/app/AppOverlays.jsx';
import useGameController from './hooks/useGameController.js';

const Game = () => {
  const controller = useGameController();
  const { gameData, screen, handleNav, simulation, saveGame } = controller;
  const showBottomNav = gameData && !['boot', 'setup'].includes(screen);

  return (
    <>
      <Box sx={{ height: '100vh', overflowY: 'auto', bgcolor: 'background.default' }}>
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

import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import { buildNextMatchViewModel } from '../engines/nextmatch/nextMatchViewModel.js';
import NextMatchAggregate from './nextmatch/NextMatchAggregate.jsx';
import NextMatchHeader from './nextmatch/NextMatchHeader.jsx';
import NextMatchLineups from './nextmatch/NextMatchLineups.jsx';
import NextMatchLineupStatus from './nextmatch/NextMatchLineupStatus.jsx';
import NextMatchOverview from './nextmatch/NextMatchOverview.jsx';
import NextMatchSeasonEnd from './nextmatch/NextMatchSeasonEnd.jsx';

const ScreenNextMatch = ({ gameData, startMatchSimulation, simulating, setScreen }) => {
  const viewModel = buildNextMatchViewModel(gameData);
  const theme = THEME;

  if (viewModel.season.seasonOver) {
    return (
      <NextMatchSeasonEnd
        gameData={gameData}
        season={viewModel.season}
        setScreen={setScreen}
        theme={theme}
      />
    );
  }

  const canPlay = viewModel.isFullyReady && !simulating && !!viewModel.displayHome;
  const handleAutoSimulate = () => {
    if (!canPlay) return;
    startMatchSimulation({ autoSimulate: true });
  };

  return (
    <Box sx={{
      bgcolor: theme.bg,
      minHeight: '100vh',
      pb: 12,
      background: `radial-gradient(ellipse at 50% 0%, #dcfce7 0%, transparent 35%), ${theme.bg}`,
    }}>
      <NextMatchHeader
        viewModel={viewModel}
        canPlay={canPlay}
        simulating={simulating}
        startMatchSimulation={startMatchSimulation}
        onAutoSimulate={handleAutoSimulate}
        setScreen={setScreen}
        theme={theme}
      />

      <Box sx={{ px: 1.5, pt: 1.5 }}>
        <NextMatchOverview viewModel={viewModel} theme={theme} />
        <NextMatchLineups gameData={gameData} viewModel={viewModel} theme={theme} />
        <NextMatchLineupStatus viewModel={viewModel} theme={theme} />
        <NextMatchAggregate viewModel={viewModel} theme={theme} />
      </Box>
    </Box>
  );
};

export default ScreenNextMatch;

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

  const canAdvanceCalendar = (viewModel.skippedSlots || 0) > 0;
  const canAdvanceDay = (viewModel.restDaysBeforeMatch || 0) > 0;
  const canPlay = (canAdvanceDay || canAdvanceCalendar || viewModel.isFullyReady) && !simulating && (canAdvanceDay || canAdvanceCalendar || !!viewModel.displayHome);
  const handleAutoSimulate = () => {
    if (!canPlay || canAdvanceCalendar || canAdvanceDay) return;
    startMatchSimulation({ autoSimulate: true });
  };

  if (viewModel.idleOnly) {
    return (
      <Box sx={{
        bgcolor: theme.bg,
        minHeight: '100dvh',
        pb: 6.5,
        background: `radial-gradient(ellipse at 50% 0%, #fef3c7 0%, transparent 35%), ${theme.bg}`,
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
        <Box sx={{ px: 1.5, pt: 2 }}>
          <Box sx={{ bgcolor: theme.card, border: `1.5px solid ${theme.yellow}50`, borderRadius: '12px', p: 2, textAlign: 'center' }}>
            <Box sx={{ fontSize: '2rem', mb: 0.7 }}>🛌</Box>
            <Box sx={{ color: theme.txt1, fontWeight: 900, fontSize: '0.8rem' }}>Nenhuma partida restante nestas datas</Box>
            <Box sx={{ color: theme.txt3, fontWeight: 700, fontSize: '0.62rem', mt: 0.4 }}>
              Avance {viewModel.skippedSlots} data(s) para aplicar descanso, recuperação médica e concluir o calendário.
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: theme.bg,
      minHeight: '100dvh',
      pb: 6.5,
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

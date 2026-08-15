import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import LeagueTableHeader from './table/LeagueTableHeader.jsx';
import StandingsView from './table/StandingsView.jsx';
import TopScorersView from './table/TopScorersView.jsx';
import ScorerDialog from './table/ScorerDialog.jsx';
import { buildTableViewModel, normalizeScorerForTransfer } from '../engines/table/tableViewModel.js';

const ScreenTable = ({ gameData, buyPlayer, formatMoney, showToast }) => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const [selectedScorer, setSelectedScorer] = React.useState(null);
  const viewModel = React.useMemo(() => buildTableViewModel(gameData), [gameData]);

  const handleBuyScorer = React.useCallback((scorer) => {
    if (!buyPlayer) {
      showToast?.('Mercado não disponível.', 'error');
      return;
    }
    buyPlayer(normalizeScorerForTransfer(scorer));
    setSelectedScorer(null);
  }, [buyPlayer, showToast]);

  return (
    <Box sx={{ bgcolor: THEME.bg, minHeight: '100vh', pb: 10, display: 'flex', flexDirection: 'column' }}>
      <LeagueTableHeader
        serie={viewModel.serie}
        currentRound={viewModel.currentRound}
        totalRounds={viewModel.totalRounds}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {currentTab === 0 ? (
        <StandingsView
          standings={viewModel.standings}
          legend={viewModel.legend}
          isSeasonEnd={viewModel.isSeasonEnd}
        />
      ) : (
        <TopScorersView
          scorers={viewModel.scorers}
          serie={viewModel.serie}
          onSelect={setSelectedScorer}
        />
      )}

      <ScorerDialog
        player={selectedScorer}
        gameData={gameData}
        buyPlayer={buyPlayer}
        formatMoney={formatMoney}
        onBuy={handleBuyScorer}
        onClose={() => setSelectedScorer(null)}
      />
    </Box>
  );
};

export default ScreenTable;

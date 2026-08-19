// @migrated to ES module
import React from 'react';
import { Box } from '@mui/material';
import { THEME as C } from '../theme.js';
import {
  applySponsorContract,
  canSignSponsor,
  buildFinanceOverview,
  generateSponsorOffers,
  getFinancialSuggestions,
} from '../engines/finances/financeViewModel.js';
import { FinanceHeader } from './finances/FinanceHeader.jsx';
import { FinanceOverviewTab } from './finances/FinanceOverviewTab.jsx';
import { FinanceHistoryTab } from './finances/FinanceHistoryTab.jsx';
import { FinanceSponsorsTab } from './finances/FinanceSponsorsTab.jsx';
import { FinanceEvolutionTab } from './finances/FinanceEvolutionTab.jsx';

const ScreenFinances = ({ gameData, setGameData, formatMoney, showToast }) => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const offers = React.useMemo(
    () => generateSponsorOffers(gameData),
    [gameData?.season, gameData?.serie, gameData?.club?.strength],
  );

  const overview = React.useMemo(() => buildFinanceOverview(gameData), [gameData]);
  const suggestions = React.useMemo(
    () => getFinancialSuggestions(gameData, overview),
    [gameData, overview],
  );

  const handleSignSponsor = React.useCallback((type, offer) => {
    const validation = canSignSponsor(gameData, type, offer);
    if (!validation.ok) {
      showToast(validation.reason, 'warning');
      return false;
    }
    setGameData((prev) => applySponsorContract(prev, type, offer));
    showToast(`Contrato assinado com ${offer.name}! +${formatMoney(offer.val)} em caixa.`);
    return true;
  }, [gameData, setGameData, showToast, formatMoney]);

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', pb: 6.5 }}>
      <FinanceHeader
        gameData={gameData}
        overview={overview}
        formatMoney={formatMoney}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <Box sx={{ px: 1.5, mt: 2 }}>
        {currentTab === 0 && (
          <FinanceOverviewTab
            gameData={gameData}
            overview={overview}
            suggestions={suggestions}
            formatMoney={formatMoney}
          />
        )}
        {currentTab === 1 && (
          <FinanceHistoryTab history={overview.history} formatMoney={formatMoney} />
        )}
        {currentTab === 2 && (
          <FinanceSponsorsTab
            sponsors={overview.sponsors}
            offers={offers}
            formatMoney={formatMoney}
            onSign={handleSignSponsor}
          />
        )}
        {currentTab === 3 && (
          <FinanceEvolutionTab
            history={overview.history}
            summary={overview.summary}
            formatMoney={formatMoney}
          />
        )}
      </Box>
    </Box>
  );
};

export default ScreenFinances;

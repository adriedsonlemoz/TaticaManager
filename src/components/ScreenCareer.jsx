import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import CareerAccumulatedStats from './career/CareerAccumulatedStats.jsx';
import CareerCupStatus from './career/CareerCupStatus.jsx';
import CareerHeadToHead from './career/CareerHeadToHead.jsx';
import CareerHero from './career/CareerHero.jsx';
import CareerHistory from './career/CareerHistory.jsx';
import CareerOfferBanner from './career/CareerOfferBanner.jsx';
import CareerOfferDialog from './career/CareerOfferDialog.jsx';
import CareerSeasonStats from './career/CareerSeasonStats.jsx';
import CareerSentimentCards from './career/CareerSentimentCards.jsx';
import { buildCareerViewModel } from '../engines/career/careerViewModel.js';
import { acceptManagerOfferState, declineManagerOfferState } from '../engines/career/managerOfferService.js';

const ScreenCareer = ({ gameData, setGameData, formatMoney, showToast }) => {
  const [offerOpen, setOfferOpen] = React.useState(false);
  const viewModel = React.useMemo(
    () => buildCareerViewModel(gameData, THEME.txt3),
    [gameData],
  );
  const pendingOffer = viewModel.pendingOffer;

  const handleAcceptOffer = React.useCallback(() => {
    if (!pendingOffer) return;
    setGameData(prev => acceptManagerOfferState(prev, pendingOffer));
    showToast?.(`✅ Proposta aceita! Você assumirá o ${pendingOffer.actionData.offeringClub.name} na próxima temporada.`, 'success');
    setOfferOpen(false);
  }, [pendingOffer, setGameData, showToast]);

  const handleDeclineOffer = React.useCallback(() => {
    if (!pendingOffer) return;
    setGameData(prev => declineManagerOfferState(prev, pendingOffer.id));
    showToast?.('Proposta recusada.', 'info');
    setOfferOpen(false);
  }, [pendingOffer, setGameData, showToast]);

  return (
    <Box sx={{ bgcolor:THEME.bg, minHeight:'100vh', pb:12 }}>
      <CareerHero gameData={gameData} viewModel={viewModel} theme={THEME} />
      <CareerOfferBanner offer={pendingOffer} onOpen={() => setOfferOpen(true)} />
      <Box sx={{ px:1.5, pt:1.5 }}>
        <CareerSeasonStats season={gameData.season} viewModel={viewModel} theme={THEME} />
        <CareerAccumulatedStats viewModel={viewModel} theme={THEME} />
        <CareerSentimentCards morale={gameData.morale} fanLoyalty={gameData.club?.fanLoyalty} theme={THEME} />
        <CareerHistory entries={viewModel.seasonHistory} theme={THEME} formatMoney={formatMoney} />
        <CareerHeadToHead entries={viewModel.headToHead} theme={THEME} />
        <CareerCupStatus cup={gameData.cups?.copaBrasil} theme={THEME} formatMoney={formatMoney} />
      </Box>
      <CareerOfferDialog
        open={offerOpen}
        offerMessage={pendingOffer}
        season={gameData.season}
        formatMoney={formatMoney}
        theme={THEME}
        onClose={() => setOfferOpen(false)}
        onAccept={handleAcceptOffer}
        onDecline={handleDeclineOffer}
      />
    </Box>
  );
};

export default ScreenCareer;

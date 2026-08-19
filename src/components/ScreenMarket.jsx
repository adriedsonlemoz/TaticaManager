import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import useMarketController from '../hooks/useMarketController.js';
import { MarketPlayerCard, OwnedPlayerSaleCard } from './market/MarketPlayerCards.jsx';
import {
  ClubsMarketTab,
  FreeMarketTab,
  NegotiationPanel,
  SalesMarketTab,
  ScoutMarketTab,
  TransferMarketHeader,
  WatchlistMarketTab,
} from './market/MarketSections.jsx';

const ScreenMarket = ({ gameData, setGameData, buyPlayer, formatMoney, showToast }) => {
  const C = THEME;
  const market = useMarketController({ gameData, setGameData, buyPlayer, formatMoney, showToast });
  const { view } = market;

  const renderPlayerCard = (player) => (
    <MarketPlayerCard
      key={player.id}
      player={player}
      gameData={gameData}
      selected={market.selected}
      setSelected={market.setSelected}
      setNegotiating={market.setNegotiating}
      setOfferPct={market.setOfferPct}
      handleBuyDirect={market.handleBuyDirect}
      toggleWatchlist={market.toggleWatchlist}
      isWatched={market.isWatched}
      formatMoney={formatMoney}
      C={C}
    />
  );

  const renderMyPlayerCard = (player) => (
    <OwnedPlayerSaleCard
      key={player.id}
      player={player}
      gameData={gameData}
      setGameData={setGameData}
      selected={market.selected}
      setSelected={market.setSelected}
      handleAcceptSell={market.handleAcceptSell}
      handleToggleList={market.handleToggleList}
      formatMoney={formatMoney}
      C={C}
    />
  );

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100dvh', pb:5.5 }}>
      <TransferMarketHeader
        gameData={gameData}
        formatMoney={formatMoney}
        tab={market.tab}
        setTab={market.setTab}
        salesCount={view.salesData.withOffer.length}
        watchCount={view.watchlist.length}
        C={C}
      />

      <Box sx={{ px:1.5, pt:1.5 }}>
        <NegotiationPanel
          negotiating={market.negotiating}
          gameData={gameData}
          offerPct={market.offerPct}
          setOfferPct={market.setOfferPct}
          setNegotiating={market.setNegotiating}
          onSubmit={market.handleNegotiateSubmit}
          formatMoney={formatMoney}
          C={C}
        />

        {market.tab === 'market' && <FreeMarketTab filterPos={market.filterPos} setFilterPos={market.setFilterPos} filterOvr={market.filterOvr} setFilterOvr={market.setFilterOvr} marketPlayers={view.marketPlayers} onRefresh={market.handleRefreshMarket} renderPlayerCard={renderPlayerCard} formatMoney={formatMoney} C={C}/>} 
        {market.tab === 'clubs' && <ClubsMarketTab leagueFilter={market.leagueFilter} setLeagueFilter={market.setLeagueFilter} displayClubs={view.displayClubs} selectedClubId={market.selectedClubId} setSelectedClubId={market.setSelectedClubId} selectedClub={market.selectedClub} cpuRoster={market.cpuRoster} renderPlayerCard={renderPlayerCard} setSelected={market.setSelected} C={C}/>} 
        {market.tab === 'sales' && <SalesMarketTab salesData={view.salesData} playerCount={(gameData.players || []).length} renderMyPlayerCard={renderMyPlayerCard} C={C}/>} 
        {market.tab === 'scout' && <ScoutMarketTab scoutData={view.scoutData} gameData={gameData} selected={market.selected} setSelected={market.setSelected} onBuy={market.handleCPUTransfer} formatMoney={formatMoney} C={C}/>} 
        {market.tab === 'watch' && <WatchlistMarketTab watchlist={view.watchlist} gameData={gameData} setGameData={setGameData} onBuy={market.handleCPUTransfer} toggleWatchlist={market.toggleWatchlist} formatMoney={formatMoney} C={C}/>} 
      </Box>
    </Box>
  );
};

export default ScreenMarket;

// @migrated to ES module
import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import { TeamIcon } from '../data/database_branding.js';
import { generatePlayer } from '../engines/engine.js';
import {
  MARKET_REFRESH_COST,
  applyPlayerSale,
  buildScoutAnalysis,
  collectCpuTeams,
  createRefreshedMarket,
  enrichTransferPlayer,
  getMinimumAcceptedOffer,
  getTeamSerie,
  groupPlayersForSale,
  normalizeAndFilterMarket,
  resolveNegotiationPlayer,
} from '../engines/market/marketService.js';
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

const POSITIONS = ['TODOS','GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'];
const OVR_RANGES = [
  { label:'TODOS', min:0, max:99 },
  { label:'60-69', min:60, max:69 },
  { label:'70-79', min:70, max:79 },
  { label:'80+', min:80, max:99 },
];

const ScreenMarket = ({ gameData, setGameData, buyPlayer, formatMoney, showToast }) => {
  const C = THEME;
  const [tab, setTab] = React.useState('market');
  const [filterPos, setFilterPos] = React.useState('TODOS');
  const [filterOvr, setFilterOvr] = React.useState('TODOS');
  const [selected, setSelected] = React.useState(null);
  const [negotiating, setNegotiating] = React.useState(null);
  const [offerPct, setOfferPct] = React.useState(85);
  const [leagueFilter, setLeagueFilter] = React.useState('A');
  const [selectedClubId, setSelectedClubId] = React.useState(null);

  const watchlist = gameData.watchlist || [];
  const isWatched = id => watchlist.some(item => item.id === id);
  const toggleWatchlist = (player, event) => {
    event.stopPropagation();
    setGameData(prev => {
      const current = prev.watchlist || [];
      if (current.some(item => item.id === player.id)) {
        return { ...prev, watchlist:current.filter(item => item.id !== player.id) };
      }
      return {
        ...prev,
        watchlist:[{
          id:player.id, name:player.name, position:player.position, overall:player.overall,
          age:player.age, value:player.value, wage:player.wage, teamName:player.teamName || 'Livre', addedAt:Date.now(),
        }, ...current].slice(0, 30),
      };
    });
  };

  const posColor = position => {
    if (position === 'GOL') return { bg:C.posGol, text:'#fff' };
    if (['ZAG','LD','LE','LAT'].includes(position)) return { bg:C.posZag, text:'#fff' };
    if (['VOL','MC','MEI'].includes(position)) return { bg:C.posVol, text:'#fff' };
    return { bg:C.posAta, text:'#fff' };
  };
  const ovrColor = overall => overall >= 80 ? C.green : overall >= 70 ? C.gold : C.red;

  const activeRange = OVR_RANGES.find(range => range.label === filterOvr) || OVR_RANGES[0];
  const marketPlayers = React.useMemo(
    () => normalizeAndFilterMarket(gameData.market, { position:filterPos, range:activeRange }),
    [gameData.market, filterPos, activeRange.min, activeRange.max],
  );

  const allCpuTeams = React.useMemo(
    () => collectCpuTeams(gameData),
    [gameData.teams, gameData.leagues],
  );
  const displayClubs = React.useMemo(
    () => allCpuTeams.filter(team => getTeamSerie(gameData, team) === leagueFilter),
    [allCpuTeams, gameData.leagues, leagueFilter],
  );
  const selectedClub = allCpuTeams.find(team => String(team.id) === String(selectedClubId));
  const cpuRoster = selectedClub?.squad || [];
  const salesData = React.useMemo(
    () => groupPlayersForSale(gameData.players, gameData.inbox),
    [gameData.players, gameData.inbox],
  );
  const scoutData = React.useMemo(
    () => buildScoutAnalysis(gameData),
    [gameData.players, gameData.market, gameData.leagues, gameData.club.money],
  );

  const handleRefreshMarket = () => {
    if ((gameData.club?.money || 0) < MARKET_REFRESH_COST) {
      showToast?.('Verba insuficiente para atualizar o mercado!', 'error');
      return;
    }
    const newMarket = createRefreshedMarket(gameData, generatePlayer);
    setGameData(prev => ({
      ...prev,
      market:newMarket,
      club:{ ...prev.club, money:prev.club.money - MARKET_REFRESH_COST },
      financialHistory:[{
        round:prev.round, income:0, expense:MARKET_REFRESH_COST, total:-MARKET_REFRESH_COST,
        detail:{ description:'Taxa: Atualização do Mercado' },
      }, ...(prev.financialHistory || [])].slice(0, 50),
    }));
    showToast?.('Mercado atualizado com novos jogadores!', 'success');
  };

  const handleCPUTransfer = (player, finalPrice) => buyPlayer(enrichTransferPlayer(gameData, player, finalPrice));
  const handleBuyDirect = (player, event) => {
    event?.stopPropagation();
    handleCPUTransfer(player, player.value);
    setSelected(null);
    setNegotiating(null);
  };

  const handleNegotiateSubmit = () => {
    const stale = negotiating?.player;
    if (!stale) return;
    const freshPlayer = resolveNegotiationPlayer(gameData, stale);
    if (!freshPlayer) {
      showToast?.(`❌ ${stale.name} não está mais disponível.`, 'error');
      setNegotiating(null);
      return;
    }
    const player = { ...freshPlayer, teamName:stale.teamName };
    const offer = Math.round(player.value * offerPct / 100);
    const minimum = getMinimumAcceptedOffer(player);
    if (offer >= minimum) {
      handleCPUTransfer(player, offer);
      showToast?.(`✅ Negócio fechado! ${player.name} assinou contrato.`, 'success');
      setNegotiating(null);
      setSelectedClubId(null);
    } else {
      showToast?.(`❌ Proposta recusada. Mínimo: ${formatMoney(minimum)}`, 'error');
    }
  };

  const handleToggleList = (player, event) => {
    event?.stopPropagation();
    if (!player.isListed && player.isStarting) {
      showToast?.(`⚠️ ${player.name.split(' ')[0]} é titular. Remova da escalação antes de listar.`, 'warning');
      return;
    }
    setGameData(prev => ({
      ...prev,
      players:prev.players.map(item => item.id === player.id ? { ...item, isListed:!item.isListed } : item),
    }));
    showToast?.(player.isListed ? `${player.name} removido da lista.` : `${player.name} colocado à venda!`, 'info');
    setSelected(null);
  };

  const handleAcceptSell = (player, offerData) => {
    showToast?.(`${player.name} vendido por ${formatMoney(offerData.value)}!`, 'success');
    setGameData(prev => applyPlayerSale(prev, player, offerData));
    setSelected(null);
  };

  const renderPlayerCard = player => (
    <MarketPlayerCard
      key={player.id} player={player} gameData={gameData} selected={selected} setSelected={setSelected}
      setNegotiating={setNegotiating} setOfferPct={setOfferPct} handleBuyDirect={handleBuyDirect}
      toggleWatchlist={toggleWatchlist} isWatched={isWatched} formatMoney={formatMoney}
      posColor={posColor} ovrColor={ovrColor} C={C}
    />
  );

  const renderMyPlayerCard = player => (
    <OwnedPlayerSaleCard
      key={player.id} player={player} gameData={gameData} setGameData={setGameData} selected={selected}
      setSelected={setSelected} handleAcceptSell={handleAcceptSell} handleToggleList={handleToggleList}
      formatMoney={formatMoney} posColor={posColor} ovrColor={ovrColor} C={C}
    />
  );

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:10 }}>
      <TransferMarketHeader
        gameData={gameData} formatMoney={formatMoney} tab={tab}
        setTab={nextTab => { setTab(nextTab); setSelected(null); }}
        salesCount={salesData.withOffer.length} watchCount={watchlist.length} C={C}
      />

      <Box sx={{ px:1.5, pt:1.5 }}>
        <NegotiationPanel
          negotiating={negotiating} gameData={gameData} offerPct={offerPct} setOfferPct={setOfferPct}
          setNegotiating={setNegotiating} onSubmit={handleNegotiateSubmit} formatMoney={formatMoney}
          ovrColor={ovrColor} C={C}
        />

        {tab === 'market' && (
          <FreeMarketTab
            positions={POSITIONS} filterPos={filterPos} setFilterPos={setFilterPos}
            ovrRanges={OVR_RANGES} filterOvr={filterOvr} setFilterOvr={setFilterOvr}
            marketPlayers={marketPlayers} onRefresh={handleRefreshMarket} renderPlayerCard={renderPlayerCard} C={C}
          />
        )}
        {tab === 'clubs' && (
          <ClubsMarketTab
            leagueFilter={leagueFilter} setLeagueFilter={setLeagueFilter} displayClubs={displayClubs}
            selectedClubId={selectedClubId} setSelectedClubId={setSelectedClubId} selectedClub={selectedClub}
            cpuRoster={cpuRoster} TeamIcon={TeamIcon} renderPlayerCard={renderPlayerCard} setSelected={setSelected} C={C}
          />
        )}
        {tab === 'sales' && (
          <SalesMarketTab salesData={salesData} playerCount={gameData.players.length} renderMyPlayerCard={renderMyPlayerCard} C={C}/>
        )}
        {tab === 'scout' && (
          <ScoutMarketTab
            scoutData={scoutData} selected={selected} setSelected={setSelected} onBuy={handleCPUTransfer}
            formatMoney={formatMoney} posColor={posColor} ovrColor={ovrColor} C={C}
          />
        )}
        {tab === 'watch' && (
          <WatchlistMarketTab
            watchlist={watchlist} gameData={gameData} setGameData={setGameData} onBuy={handleCPUTransfer}
            toggleWatchlist={toggleWatchlist} formatMoney={formatMoney} posColor={posColor} ovrColor={ovrColor} C={C}
          />
        )}
      </Box>
    </Box>
  );
};

export default ScreenMarket;

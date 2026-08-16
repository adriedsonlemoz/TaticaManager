import React from 'react';
import { generatePlayer } from '../engines/engine.js';
import {
  MARKET_REFRESH_COST,
  applyPlayerSale,
  createRefreshedMarket,
  enrichTransferPlayer,
  getMinimumAcceptedOffer,
  resolveNegotiationPlayer,
} from '../engines/market/marketService.js';
import { buildMarketViewModel } from '../engines/market/marketViewModel.js';
import { evaluateTransferPurchase } from '../engines/market/transferRules.js';

export default function useMarketController({ gameData, setGameData, buyPlayer, formatMoney, showToast }) {
  const [tab, setTabState] = React.useState('market');
  const [filterPos, setFilterPos] = React.useState('TODOS');
  const [filterOvr, setFilterOvr] = React.useState('TODOS');
  const [selected, setSelected] = React.useState(null);
  const [negotiating, setNegotiating] = React.useState(null);
  const [offerPct, setOfferPct] = React.useState(85);
  const [leagueFilter, setLeagueFilter] = React.useState('A');
  const [selectedClubId, setSelectedClubId] = React.useState(null);

  const view = React.useMemo(
    () => buildMarketViewModel(gameData, { filterPos, filterOvr, leagueFilter }),
    [gameData, filterPos, filterOvr, leagueFilter],
  );

  const selectedClub = view.allCpuTeams.find((team) => String(team.id) === String(selectedClubId)) || null;
  const storedRoster = selectedClub?.id != null ? gameData.teamRosters?.[selectedClub.id] : null;
  const cpuRoster = Array.isArray(storedRoster) && storedRoster.length > 0 ? storedRoster : (selectedClub?.squad || []);
  const isWatched = React.useCallback((id) => view.watchlist.some((item) => item.id === id), [view.watchlist]);

  const setTab = React.useCallback((nextTab) => {
    setTabState(nextTab);
    setSelected(null);
    setNegotiating(null);
  }, []);

  const toggleWatchlist = React.useCallback((player, event) => {
    event?.stopPropagation?.();
    setGameData((prev) => {
      const current = prev.watchlist || [];
      if (current.some((item) => item.id === player.id)) {
        return { ...prev, watchlist:current.filter((item) => item.id !== player.id) };
      }
      return {
        ...prev,
        watchlist:[{
          id:player.id,
          name:player.name,
          position:player.position,
          overall:player.overall,
          age:player.age,
          value:player.value,
          wage:player.wage,
          teamName:player.teamName || 'Livre',
          teamId:player.teamId ?? null,
          addedAt:Date.now(),
        }, ...current].slice(0, 30),
      };
    });
  }, [setGameData]);

  const handleRefreshMarket = React.useCallback(() => {
    if ((gameData.club?.money || 0) < MARKET_REFRESH_COST) {
      showToast?.('Verba insuficiente para atualizar o mercado!', 'error');
      return false;
    }
    const newMarket = createRefreshedMarket(gameData, generatePlayer);
    setGameData((prev) => ({
      ...prev,
      market:newMarket,
      club:{ ...prev.club, money:prev.club.money - MARKET_REFRESH_COST },
      financialHistory:[{
        round:prev.round,
        income:0,
        expense:MARKET_REFRESH_COST,
        total:-MARKET_REFRESH_COST,
        detail:{ description:'Taxa: Atualização do Mercado' },
      }, ...(prev.financialHistory || [])].slice(0, 50),
    }));
    showToast?.('Mercado atualizado com novos jogadores!', 'success');
    return true;
  }, [gameData, setGameData, showToast]);

  const handleCPUTransfer = React.useCallback((player, finalPrice) => {
    const transferPlayer = enrichTransferPlayer(gameData, player, finalPrice);
    return buyPlayer?.(transferPlayer) === true;
  }, [buyPlayer, gameData]);

  const handleBuyDirect = React.useCallback((player, event) => {
    event?.stopPropagation?.();
    const eligibility = evaluateTransferPurchase(gameData, player, player.value);
    if (!eligibility.allowed) {
      showToast?.(eligibility.message, eligibility.severity, eligibility.detail || undefined);
      return false;
    }
    const completed = handleCPUTransfer(player, player.value);
    if (completed) {
      setSelected(null);
      setNegotiating(null);
    }
    return completed;
  }, [gameData, handleCPUTransfer, showToast]);

  const handleNegotiateSubmit = React.useCallback(() => {
    const stale = negotiating?.player;
    if (!stale) return false;
    const freshPlayer = resolveNegotiationPlayer(gameData, stale);
    if (!freshPlayer) {
      showToast?.(`❌ ${stale.name} não está mais disponível.`, 'error');
      setNegotiating(null);
      return false;
    }
    const player = { ...freshPlayer, teamName:stale.teamName, teamId:stale.teamId ?? freshPlayer.teamId };
    const offer = Math.round(player.value * offerPct / 100);
    const minimum = getMinimumAcceptedOffer(player);
    if (offer < minimum) {
      showToast?.(`❌ Proposta recusada. Mínimo: ${formatMoney(minimum)}`, 'error');
      return false;
    }
    const eligibility = evaluateTransferPurchase(gameData, player, offer);
    if (!eligibility.allowed) {
      showToast?.(eligibility.message, eligibility.severity, eligibility.detail || undefined);
      return false;
    }
    const completed = handleCPUTransfer(player, offer);
    if (completed) {
      setNegotiating(null);
      setSelectedClubId(null);
      setSelected(null);
    }
    return completed;
  }, [negotiating, gameData, offerPct, formatMoney, handleCPUTransfer, showToast]);

  const handleToggleList = React.useCallback((player, event) => {
    event?.stopPropagation?.();
    if (!player.isListed && player.isStarting) {
      showToast?.(`⚠️ ${player.name.split(' ')[0]} é titular. Remova da escalação antes de listar.`, 'warning');
      return false;
    }
    setGameData((prev) => ({
      ...prev,
      players:(prev.players || []).map((item) => item.id === player.id ? { ...item, isListed:!item.isListed } : item),
    }));
    showToast?.(player.isListed ? `${player.name} removido da lista.` : `${player.name} colocado à venda!`, 'info');
    setSelected(null);
    return true;
  }, [setGameData, showToast]);

  const handleAcceptSell = React.useCallback((player, offerData) => {
    setGameData((prev) => applyPlayerSale(prev, player, offerData));
    showToast?.(`${player.name} vendido por ${formatMoney(offerData.value)}!`, 'success');
    setSelected(null);
  }, [setGameData, showToast, formatMoney]);

  return {
    tab,
    setTab,
    filterPos,
    setFilterPos,
    filterOvr,
    setFilterOvr,
    selected,
    setSelected,
    negotiating,
    setNegotiating,
    offerPct,
    setOfferPct,
    leagueFilter,
    setLeagueFilter,
    selectedClubId,
    setSelectedClubId,
    selectedClub,
    cpuRoster,
    view,
    isWatched,
    toggleWatchlist,
    handleRefreshMarket,
    handleCPUTransfer,
    handleBuyDirect,
    handleNegotiateSubmit,
    handleToggleList,
    handleAcceptSell,
  };
}

import {
  buildScoutAnalysis,
  collectCpuTeams,
  getTeamSerie,
  groupPlayersForSale,
  normalizeAndFilterMarket,
} from './marketService.js';
import { getTransferFunds, getTransferWindowState } from './transferRules.js';

export const MARKET_POSITIONS = Object.freeze(['TODOS','GOL','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA']);
export const MARKET_OVR_RANGES = Object.freeze([
  { label:'TODOS', min:0, max:99 },
  { label:'60-69', min:60, max:69 },
  { label:'70-79', min:70, max:79 },
  { label:'80+', min:80, max:99 },
]);
export const MARKET_TABS = Object.freeze([
  { id:'market', label:'LIVRES' },
  { id:'clubs', label:'CLUBES' },
  { id:'scout', label:'SCOUT' },
  { id:'sales', label:'VENDAS' },
  { id:'watch', label:'⭐' },
]);

export function getMarketHeaderSummary(gameData = {}) {
  const players = gameData.players || [];
  const wage = players.reduce((sum, player) => sum + (Number(player?.wage) || 0), 0);
  return {
    clubName: gameData.club?.name || 'Clube',
    playerCount: players.length,
    wage,
    funds: getTransferFunds(gameData),
    windowInfo: getTransferWindowState(gameData),
  };
}

export function buildMarketViewModel(gameData = {}, { filterPos = 'TODOS', filterOvr = 'TODOS', leagueFilter = 'A' } = {}) {
  const activeRange = MARKET_OVR_RANGES.find((range) => range.label === filterOvr) || MARKET_OVR_RANGES[0];
  const allCpuTeams = collectCpuTeams(gameData);
  const selectedLeagueClubs = allCpuTeams.filter((team) => getTeamSerie(gameData, team) === leagueFilter);
  return {
    watchlist: gameData.watchlist || [],
    activeRange,
    marketPlayers: normalizeAndFilterMarket(gameData.market, { position:filterPos, range:activeRange }),
    allCpuTeams,
    displayClubs: selectedLeagueClubs,
    salesData: groupPlayersForSale(gameData.players, gameData.inbox),
    scoutData: buildScoutAnalysis(gameData),
    header: getMarketHeaderSummary(gameData),
  };
}

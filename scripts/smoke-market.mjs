import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  applyPlayerSale,
  buildScoutAnalysis,
  collectCpuTeams,
  enrichTransferPlayer,
  getTeamSerie,
  getWatchlistPlayerState,
  matchesMarketPosition,
  normalizeAndFilterMarket,
  resolveNegotiationPlayer,
} from '../src/engines/market/marketService.js';
import { buildMarketViewModel, getMarketHeaderSummary } from '../src/engines/market/marketViewModel.js';
import {
  evaluateTransferPurchase,
  getMinimumSerieForPlayer,
  getPurchaseActionLabel,
  getTransferFunds,
  getTransferRound,
  getTransferWindowState,
} from '../src/engines/market/transferRules.js';

let checks = 0;
const check = (fn) => { fn(); checks += 1; };
const player = (overrides = {}) => ({ id:'p1', name:'Jogador Teste', position:'CA', overall:68, age:24, value:500_000, wage:10_000, teamName:'Livre', teamId:null, ...overrides });
const baseGame = (overrides = {}) => ({
  round:12,
  leagueRound:0,
  serie:'A',
  club:{ name:'Meu Clube', money:10_000_000, transferBudget:5_000_000, wage:0, stadium:{ level:1 } },
  players:[],
  market:[],
  teams:[],
  leagues:{ A:[], B:[], C:[], D:[] },
  teamRosters:{},
  inbox:[],
  watchlist:[],
  ...overrides,
});

check(() => assert.equal(getTransferRound(baseGame()), 1));
check(() => assert.equal(getTransferRound({ round:7 }), 8));
check(() => assert.equal(getTransferRound({ round:30, leagueRound:4 }), 5));
check(() => assert.equal(getTransferWindowState(baseGame()).open, true));
check(() => assert.equal(getTransferWindowState(baseGame({ leagueRound:5 })).open, false));
check(() => assert.equal(getTransferWindowState(baseGame({ leagueRound:20 })).transferRound, 21));

check(() => assert.deepEqual(getTransferFunds(baseGame()).available, 5_000_000));
check(() => assert.equal(getTransferFunds(baseGame({ club:{ money:2_000_000, transferBudget:0 } })).available, 2_000_000));
check(() => assert.equal(getTransferFunds(baseGame({ club:{ money:900_000, transferBudget:2_000_000 } })).available, 900_000));

check(() => assert.equal(getMinimumSerieForPlayer(86), 'A'));
check(() => assert.equal(getMinimumSerieForPlayer(78), 'B'));
check(() => assert.equal(getMinimumSerieForPlayer(70), 'C'));
check(() => assert.equal(getMinimumSerieForPlayer(69), null));

check(() => assert.equal(evaluateTransferPurchase(baseGame(), player()).allowed, true));
check(() => assert.equal(evaluateTransferPurchase(baseGame({ leagueRound:5 }), player()).code, 'window_closed'));
check(() => assert.equal(evaluateTransferPurchase(baseGame({ players:Array.from({ length:30 }, (_, i) => player({ id:`u${i}` })) }), player()).code, 'squad_full'));

check(() => {
  const seller = { id:'c1', name:'Clube C', squad:[] };
  const roster = Array.from({ length:20 }, (_, i) => player({ id:`c${i}`, teamId:'c1', teamName:'Clube C', overall:60 }));
  const game = baseGame({ leagues:{ A:[], B:[], C:[seller], D:[] }, teamRosters:{ c1:roster } });
  assert.equal(evaluateTransferPurchase(game, roster[0]).code, 'seller_min_squad');
});

check(() => {
  const seller = { id:'c1', name:'Clube C', squad:[] };
  const roster = Array.from({ length:21 }, (_, i) => player({ id:`c${i}`, teamId:'c1', teamName:'Clube C', overall:60 }));
  const game = baseGame({ leagues:{ A:[], B:[], C:[seller], D:[] }, teamRosters:{ c1:roster } });
  assert.equal(evaluateTransferPurchase(game, roster[0]).allowed, true);
});

check(() => {
  const crisisGame = baseGame({ club:{ name:'Meu Clube', money:100_000, transferBudget:1_000_000, wage:0, stadium:{ level:1 } }, players:[player({ id:'u', wage:500_000 })] });
  assert.equal(evaluateTransferPurchase(crisisGame, player({ value:0 })).code, 'financial_crisis');
});

check(() => {
  const roster = Array.from({ length:21 }, (_, i) => player({ id:`a${i}`, teamId:'a1', teamName:'Clube A', overall:86 }));
  const game = baseGame({ serie:'D', leagues:{ A:[{ id:'a1', name:'Clube A', squad:roster }], B:[], C:[], D:[] }, teamRosters:{ a1:roster } });
  assert.equal(evaluateTransferPurchase(game, roster[0]).code, 'reputation');
});

check(() => assert.equal(evaluateTransferPurchase(baseGame({ serie:'D', club:{ name:'Meu Clube', money:100_000, transferBudget:1_000_000, stadium:{ level:1 } } }), player({ value:200_000 })).code, 'cash'));
check(() => assert.equal(evaluateTransferPurchase(baseGame({ club:{ name:'Meu Clube', money:1_000_000, transferBudget:100_000, stadium:{ level:1 } } }), player({ value:200_000 })).code, 'transfer_budget'));
check(() => assert.equal(evaluateTransferPurchase(baseGame({ club:{ name:'Meu Clube', money:1_000_000, transferBudget:0, stadium:{ level:1 } } }), player({ value:200_000 })).allowed, true));

check(() => assert.equal(getPurchaseActionLabel({ allowed:false, code:'cash' }), 'SEM SALDO'));
check(() => assert.equal(getPurchaseActionLabel({ allowed:false, code:'transfer_budget' }), 'FORA DO ORÇAMENTO'));
check(() => assert.equal(getPurchaseActionLabel({ allowed:false, code:'window_closed' }), 'JANELA FECHADA'));

check(() => assert.equal(matchesMarketPosition('LAT', 'LD'), true));
check(() => assert.equal(matchesMarketPosition('LAT', 'LE'), true));
check(() => assert.equal(matchesMarketPosition('ATA', 'CA'), true));
check(() => assert.equal(matchesMarketPosition('ZAG', 'CA'), false));
check(() => assert.deepEqual(normalizeAndFilterMarket([player({ position:'LAT', overall:72 }), player({ id:'p2', position:'CA', overall:65 })], { position:'LD', range:{ min:70, max:79 } }).map((p) => p.id), ['p1']));

check(() => {
  const game = baseGame({ teams:[{ id:'a', name:'A' }], leagues:{ A:[{ id:'a', name:'A' }], B:[{ id:'b', name:'B' }], C:[{ id:'c', name:'C' }], D:[{ id:'d', name:'D' }] } });
  assert.deepEqual(collectCpuTeams(game).map((team) => team.id).sort(), ['a','b','c','d']);
  assert.equal(getTeamSerie(game, { id:'c' }), 'C');
  assert.equal(getTeamSerie(game, { id:'d' }), 'D');
});

check(() => {
  const game = baseGame({ leagues:{ A:[], B:[], C:[{ id:'c1', name:'Origem', squad:[] }], D:[] } });
  const enriched = enrichTransferPlayer(game, player({ teamId:'c1', teamName:'Origem' }), 420_000);
  assert.equal(enriched.originTeamId, 'c1');
  assert.equal(enriched.originTeamName, 'Origem');
  assert.equal(enriched.teamName, 'Meu Clube');
  assert.equal(enriched.value, 420_000);
});

check(() => {
  const stale = player({ id:'x1', teamId:'c1', teamName:'Clube C', overall:60 });
  const live = { ...stale, overall:72 };
  const game = baseGame({ leagues:{ A:[], B:[], C:[{ id:'c1', name:'Clube C', squad:[stale] }], D:[] }, teamRosters:{ c1:[live] } });
  assert.equal(resolveNegotiationPlayer(game, stale).overall, 72);
});

check(() => {
  const sold = player({ id:'sale1', name:'Vendido', teamId:'user', teamName:'Meu Clube', wage:20_000 });
  const buyer = { id:'d1', name:'Clube D', squad:[] };
  const state = baseGame({ players:[sold], club:{ name:'Meu Clube', money:1_000_000, transferBudget:200_000, wage:20_000 }, leagues:{ A:[], B:[], C:[], D:[buyer] }, teamRosters:{ user:[sold], d1:[] }, inbox:[{ id:'offer1' }] });
  const next = applyPlayerSale(state, sold, { team:'Clube D', value:300_000, msgId:'offer1' });
  assert.equal(next.players.length, 0);
  assert.equal(next.club.money, 1_300_000);
  assert.equal(next.club.transferBudget, 500_000);
  assert.equal(next.club.wage, 0);
  assert.equal(next.leagues.D[0].squad[0].teamId, 'd1');
  assert.equal(next.teamRosters.d1[0].teamName, 'Clube D');
  assert.equal(next.teamRosters.user.length, 0);
  assert.equal(next.inbox.length, 0);
});

check(() => {
  const dPlayer = player({ id:'dstar', teamId:'d1', teamName:'D Time', position:'GOL', overall:80, age:20, value:100_000 });
  const game = baseGame({ club:{ name:'Meu Clube', money:2_000_000, transferBudget:300_000, stadium:{ level:1 } }, leagues:{ A:[], B:[], C:[], D:[{ id:'d1', name:'D Time', squad:[dPlayer] }] } });
  const scout = buildScoutAnalysis(game);
  assert.equal(scout.budget, 300_000);
  assert.equal(scout.recommendations.some((p) => p.id === 'dstar'), true);
});

check(() => {
  const snapshot = player({ id:'fav', value:100_000, teamId:'c1', teamName:'Clube C' });
  const live = { ...snapshot, value:400_000 };
  const game = baseGame({ club:{ name:'Meu Clube', money:300_000, transferBudget:1_000_000, stadium:{ level:1 } }, teamRosters:{ c1:[live] } });
  const state = getWatchlistPlayerState(game, snapshot);
  assert.equal(state.price, 400_000);
  assert.equal(state.afford, false);
  assert.equal(state.live.value, 400_000);
});

check(() => {
  const legacy = player({ id:'lat', position:'LAT', overall:75 });
  const game = baseGame({ market:[legacy], watchlist:[legacy] });
  const view = buildMarketViewModel(game, { filterPos:'LD', filterOvr:'70-79', leagueFilter:'A' });
  assert.equal(view.marketPlayers.length, 1);
  assert.equal(view.watchlist.length, 1);
  assert.equal(view.header.windowInfo.transferRound, 1);
});

check(() => {
  const header = getMarketHeaderSummary(baseGame({ players:[player({ wage:12_000 }), player({ id:'p2', wage:8_000 })] }));
  assert.equal(header.wage, 20_000);
  assert.equal(header.funds.available, 5_000_000);
  assert.equal(header.windowInfo.open, true);
});

const sectionsSource = await readFile(new URL('../src/components/market/MarketSections.jsx', import.meta.url), 'utf8');
const screenSource = await readFile(new URL('../src/components/ScreenMarket.jsx', import.meta.url), 'utf8');
const squadHookSource = await readFile(new URL('../src/hooks/hooks_squad.js', import.meta.url), 'utf8');
const transferPostSource = await readFile(new URL('../src/engines/match/matchTransferPostProcessor.js', import.meta.url), 'utf8');
check(() => assert.ok(sectionsSource.trim().split('\n').length <= 10));
check(() => assert.ok(screenSource.split('\n').length < 110));
check(() => assert.ok(!screenSource.includes('const posColor')));
check(() => assert.ok(squadHookSource.includes('C: removeFromPool')));
check(() => assert.ok(squadHookSource.includes('D: removeFromPool')));
check(() => assert.ok(transferPostSource.includes('isTransferWindowOpen(leagueRoundPlayed)')));

console.log(`Market smoke: ${checks}/${checks} verificações aprovadas.`);

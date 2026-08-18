import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  applyPlayerSale,
  buildScoutAnalysis,
  collectCpuTeams,
  createRefreshedMarket,
  enrichTransferPlayer,
  getPlayerSaleOffers,
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
import { applyUserPurchase, applyUserSale } from '../src/engines/market/transferTransactions.js';
import { reconcileTransferState } from '../src/engines/market/marketIntegrity.js';
import { setTransferListing } from '../src/engines/player/playerProfileService.js';

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
check(() => assert.equal(getTransferFunds(baseGame({ club:{ money:2_000_000, transferBudget:0 } })).available, 0));
check(() => assert.equal(getTransferFunds(baseGame({ club:{ money:2_000_000 } })).available, 2_000_000));
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
check(() => assert.equal(evaluateTransferPurchase(baseGame({ club:{ name:'Meu Clube', money:1_000_000, transferBudget:0, stadium:{ level:1 } } }), player({ value:200_000 })).code, 'transfer_budget'));
check(() => assert.equal(evaluateTransferPurchase(baseGame({ club:{ name:'Meu Clube', money:1_000_000, stadium:{ level:1 } } }), player({ value:200_000 })).allowed, true));


check(() => {
  const mine = player({ id:'mine', teamId:'user', teamName:'Meu Clube' });
  const game = baseGame({ players:[mine], teamRosters:{ user:[mine] } });
  assert.equal(evaluateTransferPurchase(game, mine).code, 'already_owned');
});

check(() => {
  const mine = player({ id:'listed-own', teamId:'user', teamName:'Meu Clube', isStarting:false });
  const game = baseGame({ players:[mine], market:[] });
  const listed = setTransferListing(game, mine, true);
  assert.equal(listed.players[0].isListed, true);
  assert.equal(listed.teamRosters.user[0].isListed, true);
  assert.equal(listed.market.some((candidate) => candidate.id === mine.id), false);
});

check(() => {
  const cpu = player({ id:'neg1', teamId:'c1', teamName:'Clube C', value:500_000 });
  const game = baseGame({ leagues:{ A:[], B:[], C:[{ id:'c1', name:'Clube C', squad:[cpu] }], D:[] }, teamRosters:{ c1:[cpu] } });
  const enriched = enrichTransferPlayer(game, cpu, 460_000);
  assert.equal(enriched.value, 500_000);
  assert.equal(enriched.agreedTransferFee, 460_000);
});

check(() => {
  const roster = Array.from({ length:21 }, (_, index) => player({ id:`seller-${index}`, teamId:'c1', teamName:'Clube C', value:500_000, wage:10_000, contract:1 }));
  const target = roster[0];
  const seller = { id:'c1', name:'Clube C', money:1_000_000, budget:300_000, squad:roster };
  const game = baseGame({
    club:{ name:'Meu Clube', money:2_000_000, transferBudget:1_000_000, wage:0, stadium:{ level:1 } },
    leagues:{ A:[], B:[], C:[seller], D:[] },
    teamRosters:{ c1:roster, user:[] },
    market:[target],
  });
  const first = applyUserPurchase(game, { ...target, originTeamId:'c1', originTeamName:'Clube C', agreedTransferFee:460_000 }, 460_000);
  assert.equal(first.ok, true);
  assert.equal(first.state.club.money, 1_540_000);
  assert.equal(first.state.club.transferBudget, 540_000);
  assert.equal(first.state.players[0].value, 500_000);
  assert.equal(first.state.players[0].lastTransferFee, 460_000);
  assert.equal(first.state.players[0].contract, 2);
  assert.equal(first.state.teamRosters.c1.some((candidate) => candidate.id === target.id), false);
  assert.equal(first.state.leagues.C[0].squad.some((candidate) => candidate.id === target.id), false);
  assert.equal(first.state.leagues.C[0].money, 1_460_000);
  assert.equal(first.state.leagues.C[0].budget, 760_000);
  assert.equal(first.state.teamRosters.user.filter((candidate) => candidate.id === target.id).length, 1);
  const second = applyUserPurchase(first.state, target, 460_000);
  assert.equal(second.ok, false);
  assert.equal(second.code, 'already_owned');
  assert.equal(second.state.club.money, 1_540_000);
});

check(() => {
  const roster = Array.from({ length:21 }, (_, index) => player({ id:`resale-${index}`, teamId:'c1', teamName:'Clube C', value:300_000 }));
  const target = roster[0];
  const seller = { id:'c1', name:'Clube C', money:1_000_000, budget:1_000_000, squad:roster };
  const game = baseGame({
    club:{ name:'Meu Clube', money:2_000_000, transferBudget:1_000_000, wage:0, stadium:{ level:1 } },
    leagues:{ A:[], B:[], C:[seller], D:[] },
    teamRosters:{ user:[], c1:roster },
  });
  const bought = applyUserPurchase(game, { ...target, originTeamId:'c1', originTeamName:'Clube C' }, 300_000);
  assert.equal(bought.ok, true);
  assert.equal(bought.state.players[0].previousTeamId, 'c1');
  assert.equal(bought.state.transfersFromTeam.c1, 1);
  const sold = applyUserSale(bought.state, target.id, 250_000);
  assert.equal(sold.ok, true);
  assert.equal(sold.state.transfersFromTeam.c1, undefined);
});

check(() => {
  const duplicate = player({ id:'dup', teamId:'user', teamName:'Meu Clube', wage:12_000 });
  const cpuCopy = { ...duplicate, teamId:'c1', teamName:'Clube C' };
  const legacy = baseGame({
    players:[duplicate, duplicate],
    market:[duplicate, player({ id:'free-ok' })],
    leagues:{ A:[], B:[], C:[{ id:'c1', name:'Clube C', squad:[cpuCopy] }], D:[] },
    teamRosters:{ user:[duplicate, duplicate], c1:[cpuCopy] },
    club:{ name:'Meu Clube', money:1_000_000, transferBudget:500_000, wage:999_999, stadium:{ level:1 } },
  });
  const fixed = reconcileTransferState(legacy);
  assert.equal(fixed.players.length, 1);
  assert.equal(fixed.teamRosters.user.length, 1);
  assert.equal(fixed.teamRosters.c1.some((candidate) => candidate.id === 'dup'), false);
  assert.equal(fixed.market.some((candidate) => candidate.id === 'dup'), false);
  assert.equal(fixed.club.wage, 12_000);
});

check(() => {
  const offers = [
    { id:'low', from:'Clube A', actionData:{ type:'sell', player:{ id:'p1' }, value:300_000 } },
    { id:'high', from:'Clube B', actionData:{ type:'sell', player:{ id:'p1' }, value:450_000 } },
  ];
  assert.equal(getPlayerSaleOffers(offers, 'p1')[0].msgId, 'high');
});

check(() => {
  const sold = player({ id:'sim-sale', teamId:'user', teamName:'Meu Clube' });
  const offers = [
    { id:'offer-a', actionData:{ type:'sell', player:{ id:'sim-sale' }, value:300_000 } },
    { id:'offer-b', actionData:{ type:'sell', player:{ id:'sim-sale' }, value:350_000 } },
    { id:'unrelated', actionData:{ type:'sell', player:{ id:'other' }, value:100_000 } },
  ];
  const next = applyPlayerSale(baseGame({ players:[sold], teamRosters:{ user:[sold] }, inbox:offers }), sold, { value:350_000, msgId:'offer-b' });
  assert.deepEqual(next.inbox.map((message) => message.id), ['unrelated']);
});

check(() => {
  const sold = player({ id:'legacy-sale', teamId:'user', teamName:'Meu Clube' });
  const state = baseGame({ players:[sold], teamRosters:{ user:[sold] }, club:{ name:'Meu Clube', money:1_000_000, wage:10_000 } });
  const next = applyPlayerSale(state, sold, { value:200_000 });
  assert.equal(Object.hasOwn(next.club, 'transferBudget'), false);
  assert.equal(next.club.money, 1_200_000);
});

check(() => {
  const duplicate = player({ id:'ghost', teamId:'user', teamName:'Meu Clube' });
  const fixed = reconcileTransferState(baseGame({
    players:[duplicate],
    teamRosters:{ user:[duplicate], old_deleted_club:[{ ...duplicate, teamId:'old_deleted_club' }] },
  }));
  assert.equal(Object.hasOwn(fixed.teamRosters, 'old_deleted_club'), false);
});

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
  assert.equal(enriched.value, 500_000);
  assert.equal(enriched.agreedTransferFee, 420_000);
});

check(() => {
  const stale = player({ id:'x1', teamId:'c1', teamName:'Clube C', overall:60 });
  const live = { ...stale, overall:72 };
  const game = baseGame({ leagues:{ A:[], B:[], C:[{ id:'c1', name:'Clube C', squad:[stale] }], D:[] }, teamRosters:{ c1:[live] } });
  assert.equal(resolveNegotiationPlayer(game, stale).overall, 72);
});

check(() => {
  const sold = player({ id:'sale1', name:'Vendido', teamId:'user', teamName:'Meu Clube', wage:20_000 });
  const buyer = { id:'d1', name:'Clube D', money:1_000_000, budget:600_000, squad:[] };
  const state = baseGame({ players:[sold], club:{ name:'Meu Clube', money:1_000_000, transferBudget:200_000, wage:20_000 }, leagues:{ A:[], B:[], C:[], D:[buyer] }, teamRosters:{ user:[sold], d1:[] }, inbox:[{ id:'offer1' }] });
  const next = applyPlayerSale(state, sold, { team:'Clube D', value:300_000, msgId:'offer1' });
  assert.equal(next.players.length, 0);
  assert.equal(next.club.money, 1_300_000);
  assert.equal(next.club.transferBudget, 500_000);
  assert.equal(next.club.wage, 0);
  assert.equal(next.leagues.D[0].squad[0].teamId, 'd1');
  assert.equal(next.leagues.D[0].money, 700_000);
  assert.equal(next.leagues.D[0].budget, 300_000);
  assert.equal(next.teamRosters.d1[0].teamName, 'Clube D');
  assert.equal(next.teamRosters.user.length, 0);
  assert.equal(next.inbox.length, 0);
});


check(() => {
  const sold = player({ id:'stale-buyer', name:'Proposta Antiga', teamId:'user', teamName:'Meu Clube', wage:20_000 });
  const state = baseGame({ players:[sold], teamRosters:{ user:[sold] }, club:{ name:'Meu Clube', money:1_000_000, transferBudget:200_000, wage:20_000 } });
  const result = applyUserSale(state, sold, 300_000, { buyerTeamId:'cpu-removido', buyerTeamName:'Clube Removido' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'buyer_unavailable');
  assert.equal(result.state.club.money, 1_000_000);
  assert.equal(result.state.players.length, 1);
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
  const released = player({ id:'released-real', previousTeam:'Clube Antigo', teamId:null, teamName:'Livre' });
  let seq = 0;
  const factory = (_pos, _team, overall) => player({ id:`generated-${seq++}`, overall, previousTeam:null });
  const refreshed = createRefreshedMarket(baseGame({ market:[released, player({ id:'old-generated' })] }), factory, () => 0.5);
  assert.equal(refreshed.some((candidate) => candidate.id === 'released-real'), true);
  assert.equal(refreshed.some((candidate) => candidate.id === 'old-generated'), false);
  assert.equal(refreshed.length, 16);
  assert.equal(refreshed.filter((candidate) => candidate.id.startsWith('generated-')).every((candidate) => candidate.teamId === null), true);
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
const transferTxSource = await readFile(new URL('../src/engines/market/transferTransactions.js', import.meta.url), 'utf8');
check(() => assert.ok(sectionsSource.trim().split('\n').length <= 10));
check(() => assert.ok(screenSource.split('\n').length < 110));
check(() => assert.ok(!screenSource.includes('const posColor')));
check(() => assert.ok(squadHookSource.includes('applyUserPurchase')));
check(() => assert.ok(transferTxSource.includes('removePlayerFromAllCpuRosters')));
check(() => assert.ok(transferPostSource.includes('isTransferWindowOpen(leagueRoundPlayed)')));

console.log(`Market smoke: ${checks}/${checks} verificações aprovadas.`);

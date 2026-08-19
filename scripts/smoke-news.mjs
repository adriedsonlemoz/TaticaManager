import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { prepareSaveState } from '../src/engines/persistence/saveSchema.js';
import { applyUserPurchase, applyUserSale } from '../src/engines/market/transferTransactions.js';
import {
  NEWS_LIMIT,
  appendNewsItems,
  buildCpuTransferNews,
  buildCupEventNews,
  buildMatchResultNews,
  buildSeasonOutcomeNews,
  buildSquadStatusNews,
  makeNewsItem,
  reconcileNewsFeed,
} from '../src/engines/news/newsEngine.js';
import { buildNewsViewModel } from '../src/engines/news/newsViewModel.js';
import { buildHomeNavigationCards } from '../src/engines/home/homeViewModel.js';

let checks = 0;
const check = (label, fn) => { fn(); checks += 1; console.log(`✅ ${label}`); };

const createState = () => prepareSaveState(getInitialGameState('br-flamengo', 'Manager', { formation:'4-4-2' }));

check('schema atual cria feed inicial para uma carreira nova', () => {
  const state = createState();
  assert.equal(state.saveSchemaVersion, 16);
  assert.ok(Array.isArray(state.newsFeed));
  assert.ok(state.newsFeed.length >= 1);
  assert.match(state.newsFeed[0].title, /Flamengo/i);
});

check('append de notícia é idempotente pelo ID', () => {
  const item = makeNewsItem({ category:'club', title:'Teste', dateISO:'2026-01-01', ref:'same' });
  const once = appendNewsItems([], [item]);
  const twice = appendNewsItems(once, [item]);
  assert.equal(twice.length, 1);
  assert.equal(twice[0].id, item.id);
});

check('feed respeita limite máximo e mantém notícias mais novas primeiro', () => {
  const items = Array.from({ length:NEWS_LIMIT + 20 }, (_, index) => makeNewsItem({
    id:`n${index}`, title:`Notícia ${index}`, category:'club', dateISO:'2026-01-01', ref:`r${index}`,
  }));
  const feed = appendNewsItems([], items);
  assert.equal(feed.length, NEWS_LIMIT);
  assert.equal(feed[0].id, 'n0');
});

check('compra do usuário gera notícia de mercado persistente', () => {
  const state = createState();
  const candidate = state.market[0];
  const result = applyUserPurchase(state, candidate, 0);
  assert.equal(result.ok, true);
  assert.equal(result.state.newsFeed[0].category, 'market');
  assert.match(result.state.newsFeed[0].title, new RegExp(candidate.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(result.state.newsFeed[0].meta.direction, 'in');
});

check('venda do usuário gera notícia com destino e valor', () => {
  const state = createState();
  const player = state.players[0];
  const buyer = state.leagues.A.find((team) => team && !team.isPlayer && team.id !== 'user');
  const result = applyUserSale(state, player, 1_000, { buyerTeamId:buyer.id, buyerTeamName:buyer.name });
  assert.equal(result.ok, true);
  assert.equal(result.state.newsFeed[0].category, 'market');
  assert.match(result.state.newsFeed[0].summary, new RegExp(buyer.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(result.state.newsFeed[0].meta.direction, 'out');
});

check('resultado gera manchete com placar e competição', () => {
  const state = createState();
  const item = buildMatchResultNews(state, {
    userIsHome:true, homeName:'Flamengo', awayName:'Palmeiras', homeGoals:2, awayGoals:1,
  }, 'Série A', 0);
  assert.equal(item.category, 'results');
  assert.equal(item.title, 'Flamengo 2 × 1 Palmeiras');
  assert.equal(item.competition, 'Série A');
  assert.match(item.summary, /Vitória/);
});

check('eventos de copa viram notícias de classificação e título', () => {
  const state = createState();
  const items = buildCupEventNews(state, [
    { cup:'Copa do Brasil', msg:'Classificados para as Oitavas de Final.' },
    { cup:'Copa do Brasil', msg:'🏆 CAMPEÕES DA COPA DO BRASIL!' },
  ], 0);
  assert.equal(items.length, 2);
  assert.equal(items[0].category, 'competitions');
  assert.equal(items[1].importance, 5);
});

check('nova lesão gera notícia de elenco sem duplicar atleta saudável', () => {
  const state = createState();
  const before = state.players.slice(0, 2).map((player) => ({ ...player, injury:null }));
  const after = before.map((player, index) => index === 0 ? { ...player, injury:{ type:'Muscular', roundsLeft:3 } } : player);
  const items = buildSquadStatusNews(before, after, state);
  assert.equal(items.length, 1);
  assert.equal(items[0].category, 'squad');
  assert.equal(items[0].playerId, before[0].id);
});

check('transferências CPU relevantes podem alimentar a central', () => {
  const state = createState();
  const items = buildCpuTransferNews(state, [{
    type:'cpu-transfer', serie:'A', fromTeamId:'a', fromTeamName:'Clube A', toTeamId:'b', toTeamName:'Clube B',
    playerId:'p99', playerName:'Atleta Teste', overall:80, price:5_000_000,
  }]);
  assert.equal(items.length, 1);
  assert.match(items[0].summary, /R\$ 5\.000\.000/);
  assert.equal(items[0].importance, 3);
});

check('encerramento de temporada noticia título/acesso/rebaixamento', () => {
  const state = createState();
  const item = buildSeasonOutcomeNews(state, { season:2026, prevSerie:'A', userPos:1, champion:true, promoted:false, relegated:false });
  assert.equal(item.importance, 5);
  assert.match(item.title, /campeão/i);
});

check('view model filtra por categoria e texto', () => {
  const state = createState();
  state.newsFeed = appendNewsItems(state.newsFeed, [
    makeNewsItem({ id:'m1', category:'market', title:'Mercado: João', summary:'João foi contratado', dateISO:'2026-01-20' }),
    makeNewsItem({ id:'r1', category:'results', title:'Flamengo 2 × 0 Rival', summary:'Vitória', dateISO:'2026-01-21' }),
  ]);
  const market = buildNewsViewModel(state, { filter:'market', query:'João' });
  assert.equal(market.filtered.length, 1);
  assert.equal(market.filtered[0].id, 'm1');
  assert.ok(market.filters.find((item) => item.id === 'results').count >= 1);
});

check('Home possui acesso à Central e Sobre continua fora do grid redundante', () => {
  const state = createState();
  const cards = buildHomeNavigationCards(state);
  assert.equal(cards.some((card) => card.screen === 'news'), true);
  assert.equal(cards.some((card) => card.screen === 'about'), false);
});

check('roteador e menu do clube expõem a Central de Notícias', () => {
  const router = fs.readFileSync(new URL('../src/components/app/GameScreenRouter.jsx', import.meta.url), 'utf8');
  const clubMenu = fs.readFileSync(new URL('../src/components/navigation/ClubNavigationDialog.jsx', import.meta.url), 'utf8');
  assert.match(router, /case 'news'/);
  assert.match(clubMenu, /Notícias/);
  assert.match(clubMenu, /screen: 'news'/);
});

check('tela de notícias possui busca e filtros canônicos', () => {
  const source = fs.readFileSync(new URL('../src/components/ScreenNews.jsx', import.meta.url), 'utf8');
  assert.match(source, /Buscar notícia/);
  assert.match(source, /CENTRAL DE NOTÍCIAS/);
  assert.match(source, /vm\.filters/);
});

check('migração faz backfill de resultado antigo comprovado', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', { formation:'4-4-2' });
  const userMatch = state.fixtures[0].find((match) => match.home?.isPlayer || match.away?.isPlayer);
  userMatch.played = true;
  userMatch.result = '2 - 1';
  state.calendar = [{ type:'league', leagueIdx:0, dateISO:'2026-01-28' }];
  state.round = 1;
  state.leagueRound = 1;
  const feed = reconcileNewsFeed(state);
  assert.equal(feed.some((item) => item.category === 'results' && /2 × 1/.test(item.title)), true);
});

check('migração faz backfill de transferência financeira antiga', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', { formation:'4-4-2' });
  state.financialHistory = [{ season:2026, round:1, expense:500_000, detail:{ description:'Compra: Jogador Antigo' } }];
  const feed = reconcileNewsFeed(state);
  assert.equal(feed.some((item) => item.category === 'market' && /Jogador Antigo/.test(item.title)), true);
});

console.log(`\nCentral de Notícias: ${checks}/${checks} verificações aprovadas.`);

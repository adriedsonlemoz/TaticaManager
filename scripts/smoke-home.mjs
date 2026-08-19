import assert from 'node:assert/strict';
import {
  buildHomeNavigationCards,
  buildHomeViewModel,
  getHomeCupSummary,
  getHomeLineupSummary,
  getHomeSeasonSummary,
  resolveHomeNextMatch,
} from '../src/engines/home/homeViewModel.js';

const makePlayer = (id, position, extra = {}) => ({ id, name:id, position, overall:70, energy:100, ...extra });
const starters = [
  makePlayer('gk','GOL'), makePlayer('z1','ZAG'), makePlayer('z2','ZAG'), makePlayer('ld','LD'), makePlayer('le','LE'),
  makePlayer('v1','VOL'), makePlayer('v2','VOL'), makePlayer('pd','PD'), makePlayer('pe','PE'), makePlayer('a1','CA'), makePlayer('a2','CA'),
].map(player => ({ ...player, isStarting:true }));

const baseState = {
  round:0,
  serie:'B',
  club:{
    name:'Teste FC', manager:'Ana', money:12_000_000, wage:500_000, formation:'4-4-2',
    managerProfile:{ wins:3, draws:2, losses:1, style:'Equilibrado' },
    stadium:{ capacity:20000, underConstruction:0 },
  },
  players:starters,
  table:[
    { id:'user', name:'Teste FC', pts:7, gf:5, ga:2 },
    { id:'opp', name:'Rival', pts:4, gf:3, ga:4 },
  ],
  fixtures:[[
    { home:{ id:'user', name:'Teste FC', isPlayer:true }, away:{ id:'opp', name:'Rival' }, played:false },
  ]],
  calendar:[{ type:'league', leagueIdx:0 }],
  inbox:[], readMsgIds:[], trashMsgIds:[], erasedMsgIds:[],
  academy:[], academyReady:[], market:[],
};

const season = getHomeSeasonSummary({ ...baseState, round:1, calendar:[{type:'cup'}, {type:'league',leagueIdx:0}] });
assert.equal(season.total, 2);
assert.equal(season.seasonOver, false, 'fim de temporada deve usar calendário completo, não só fixtures');
assert.equal(getHomeSeasonSummary({ ...baseState, round:2, calendar:[{},{}] }).seasonOver, true);

const league = resolveHomeNextMatch(baseState);
assert.equal(league.type, 'league');
assert.equal(league.isUserHome, true);
assert.equal(league.opponent.name, 'Rival');
assert.equal(league.userSummary.position, 1);
assert.equal(league.opponentSummary.position, 2);

const cupState = {
  ...baseState,
  calendar:[
    { type:'cup', cupKey:'copaBrasil', leg:'leg1', phase:'Quartas de final' },
    { type:'league', leagueIdx:0 },
  ],
  cups:{
    copaBrasil:{
      status:'active', phaseLabel:'Quartas de final',
      currentTie:{
        home:{ id:'user', name:'Teste FC', isPlayer:true },
        away:{ id:'opp', name:'Rival' },
        phase:'Quartas de final',
        leg1:{ played:false }, leg2:{ played:false },
      },
    },
  },
};
const cup = resolveHomeNextMatch(cupState);
assert.equal(cup.type, 'cup');
assert.equal(cup.isUserHome, true, 'mandante da Copa deve vir do confronto de Copa');
assert.equal(cup.displayHome.name, 'Teste FC');
assert.equal(cup.displayAway.name, 'Rival');
assert.match(cup.competitionLabel, /Copa do Brasil/);

const inactiveCup = {
  ...cupState,
  cups:{ copaBrasil:{ status:'eliminated', currentTie:cupState.cups.copaBrasil.currentTie } },
};
const afterSkip = resolveHomeNextMatch(inactiveCup);
assert.equal(afterSkip.type, 'league');
assert.equal(afterSkip.skippedSlots, 1, 'slot de Copa inativo deve ser pulado ao localizar a próxima partida');

assert.equal(getHomeCupSummary({}), 'Sem copas');
assert.equal(getHomeCupSummary({ cups:{ copaBrasil:{ status:'champion' } } }), '🎉 Campeão!');
assert.equal(getHomeCupSummary({ cups:{ copaBrasil:{ status:'eliminated' } } }), 'Eliminado');
assert.match(getHomeCupSummary({ cups:{ estadual:{ status:'active', label:'🏟️ Campeonato Paulista', phaseLabel:'Fase Classificatória' } } }), /Paulista.*Fase Classificatória/);
assert.equal(getHomeCupSummary({ cups:{ estadual:{ status:'active' }, regional:{ status:'active' } } }), '2 competições ativas');

const shortLineup = getHomeLineupSummary({ ...baseState, round:5, players:starters.slice(0,10) });
assert.equal(shortLineup.needsAttention, true, 'escalação incompleta deve alertar em qualquer rodada');
assert.equal(shortLineup.startersCount, 10);
const injuredLineup = getHomeLineupSummary({ ...baseState, players:starters.map((p,i) => i === 0 ? { ...p, injury:{ type:'leve' } } : p) });
assert.equal(injuredLineup.needsAttention, true);
assert.equal(injuredLineup.invalidStarters.length, 1);
const cleanLineup = getHomeLineupSummary(baseState);
assert.equal(cleanLineup.needsAttention, false);

const dashboardState = {
  ...baseState,
  round:1,
  calendar:[{ type:'cup' }, { type:'league', leagueIdx:0 }, { type:'league', leagueIdx:0 }],
  academy:[{ id:'young', age:16, overall:50, potential:70 }],
  academyReady:[{ id:'ready', age:18, overall:60, potential:75 }],
  inbox:[
    { id:'new' }, { id:'read-id' }, { id:'trash' }, { id:'legacy', read:true },
  ],
  readMsgIds:['read-id'], trashMsgIds:['trash'],
};
const cards = buildHomeNavigationCards(dashboardState);
const byId = Object.fromEntries(cards.map(card => [card.id, card]));
assert.equal(cards.length, 12);
assert.equal(byId.academy.badge, 1, 'Base deve incluir academyReady');
assert.match(byId.academy.sub, /1 pronto/);
assert.equal(byId.inbox.badge, 1, 'Inbox deve respeitar IDs de leitura/lixeira');
assert.equal(byId.matches.sub, 'Rod. 0/1', 'Calendário deve mostrar a rodada real da Liga, sem contar slots de Copa');

const formState = {
  ...baseState,
  round:3,
  calendar:[{type:'league',leagueIdx:0},{type:'cup'},{type:'league',leagueIdx:1}],
  fixtures:[
    [{ home:{id:'user',name:'Teste FC',isPlayer:true}, away:{id:'opp',name:'Rival'}, played:true, result:'2-0' }],
    [{ home:{id:'opp2',name:'Outro'}, away:{id:'user',name:'Teste FC',isPlayer:true}, played:true, result:'1-1' }],
  ],
};
const vm = buildHomeViewModel(formState);
assert.deepEqual(vm.recentForm, ['E','V'], 'forma deve ser derivada das partidas de Liga jogadas, ignorando índice de Copa');
assert.equal(vm.clubSummary.round, 2);
assert.equal(vm.clubSummary.roundTotal, 2);
assert.equal(vm.headerStats.points, 7);

console.log('home smoke tests: 29/29 OK');

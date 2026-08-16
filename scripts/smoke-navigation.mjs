import assert from 'node:assert/strict';
import {
  NAV_MENU,
  BOTTOM_NAV_ITEMS,
  buildBottomNavItems,
  buildBottomNavViewModel,
  getAcademyNavigationSummary,
  getBackupFilename,
  getClubNavigationSummary,
  getManagerInitials,
  getSquadAvailability,
  getUnreadNavigationMessages,
  isBottomNavItemDisabled,
} from '../src/engines/navigation/bottomNavViewModel.js';

const ready = { id:'academy-ready', age:18, overall:60, potential:75, position:'CA' };
const developing = { id:'academy-young', age:16, overall:52, potential:72, position:'VOL' };
const state = {
  round:5,
  serie:'B',
  calendar:Array.from({length:44}, (_, i) => ({ type:i % 5 === 0 ? 'cup' : 'league' })),
  fixtures:Array.from({length:38}, () => []),
  club:{
    name:'São Teste FC', manager:'João da Silva', money:12_000_000, wage:900_000,
    transferBudget:4_000_000,
    managerProfile:{ style:'Ofensivo', nationality:'Brasil', wins:7, draws:2, losses:1, experience:10 },
  },
  table:[
    { id:'cpu', pts:15,w:5,d:0,l:0,gf:12,ga:3 },
    { id:'user', pts:10,w:3,d:1,l:1,gf:9,ga:5 },
  ],
  players:[
    { id:'inj', injury:{ type:'Leve' } },
    { id:'susp', discipline:{ suspendedUntilRound:6 } },
    { id:'ok', discipline:{ suspendedUntilRound:null } },
  ],
  academy:[developing],
  academyReady:[ready],
  inbox:[
    { id:'a', subject:'Nova', round:5 },
    { id:'b', subject:'Lida' },
    { id:'c', subject:'Lixeira' },
    { id:'d', subject:'Legado lido', read:true },
  ],
  readMsgIds:['b'],
  trashMsgIds:['c'],
};

assert.equal(BOTTOM_NAV_ITEMS.length, 8);
assert.equal(getManagerInitials('João da Silva'), 'JDS'.slice(0,2));
assert.equal(getManagerInitials(''), '?');

const unread = getUnreadNavigationMessages(state);
assert.deepEqual(unread.map(m => m.id), ['a']);
assert.equal(unread[0].displayDate, 'Rodada 5');

const squad = getSquadAvailability(state);
assert.deepEqual(squad, { injured:1, suspended:1, unavailable:2 });
assert.equal(getSquadAvailability({ round:5, players:[{ id:'both', injury:{}, discipline:{ suspendedUntilRound:6 } }] }).unavailable, 1, 'lesão+suspensão não deve duplicar desfalque');

const academy = getAcademyNavigationSummary(state);
assert.equal(academy.total, 2);
assert.equal(academy.ready, 1);
assert.match(academy.label, /1 garoto\(s\) pronto/);

const club = getClubNavigationSummary(state);
assert.equal(club.position, 2);
assert.equal(club.positionLabel, '2º');
assert.equal(club.goalDifference, 4);
assert.equal(club.goalDifferenceLabel, '+4');
assert.equal(club.roundTotal, 44, 'progresso deve usar o calendário completo quando disponível');
assert.equal(club.managerInitials, 'JD');

const vm = buildBottomNavViewModel(state);
assert.equal(vm.badges.club, 1);
assert.equal(vm.badges.team, 2);
assert.equal(vm.academy.ready, 1);

const optionsItem = BOTTOM_NAV_ITEMS.find(item => item.menu === NAV_MENU.OPTIONS);
const squadItem = BOTTOM_NAV_ITEMS.find(item => item.target === 'squad');
assert.equal(isBottomNavItemDisabled(optionsItem, { simulating:true, screen:'squad' }), true);
assert.equal(isBottomNavItemDisabled(squadItem, { simulating:true, screen:'squad' }), false);
assert.equal(isBottomNavItemDisabled(optionsItem, { simulating:true, screen:'match_result' }), false);

const navItems = buildBottomNavItems({ screen:'home', openMenu:NAV_MENU.CLUB, simulating:false, badges:vm.badges });
assert.equal(navItems.find(item => item.menu === NAV_MENU.CLUB).active, true);
assert.equal(navItems.find(item => item.target === 'home').active, false, 'submenu aberto deve ser o único estado ativo');
assert.equal(navItems.find(item => item.menu === NAV_MENU.CLUB).badge, 1);
assert.equal(navItems.find(item => item.menu === NAV_MENU.TEAM).badge, 2);

assert.equal(getBackupFilename(state), 'tatica_manager_Sao_Teste_FC.json');
assert.equal(getBackupFilename({}), 'tatica_manager_save.json');

console.log('navigation smoke tests: 24/24 OK');

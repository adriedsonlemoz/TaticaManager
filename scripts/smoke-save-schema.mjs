import assert from 'node:assert/strict';
import { APP_VERSION } from '../src/config/appMeta.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { getPyramidSeriesTeams2026 } from '../src/data/clubCatalog.js';
import { toggleStarterState } from '../src/engines/lineup/lineupService.js';
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  getSaveSchemaVersion,
  isSaveSchemaSupported,
  migrateSaveState,
  prepareSaveState,
} from '../src/engines/persistence/saveSchema.js';

let checks = 0;
const check = (fn) => { fn(); checks += 1; };
const p = (overrides = {}) => ({ id:'p1', name:'Teste', wage:10_000, contract:2, teamId:'user', teamName:'Meu Clube', ...overrides });
const legacy = (overrides = {}) => ({
  season:2026,
  serie:'A',
  round:2,
  club:{ name:'Meu Clube', money:2_000_000, wage:999_999 },
  players:[p()],
  teams:[{ id:'cpu1', name:'CPU 1', squad:[p({ id:'cpu-p', teamId:'cpu1', teamName:'CPU 1' })] }],
  teamRosters:{
    user:[p(), p()],
    cpu1:[p({ id:'cpu-p', teamId:'cpu1', teamName:'CPU 1' })],
    ghost:[p({ id:'ghost-p', teamId:'ghost', teamName:'Fantasma' })],
  },
  leagues:{ A:[{ id:'cpu1', name:'CPU 1', squad:[] }], B:[], C:[], D:[] },
  table:[], fixtures:[], market:[p(), p({ id:'free', teamId:null, teamName:'Livre', contract:0 })],
  inbox:[{ id:123, subject:'Numérico' }],
  readMsgIds:[123, '123', 'other'],
  trashMsgIds:[123, 123],
  erasedMsgIds:[],
  transfersFromTeam:{ cpu1:'2', stale:0, bad:'x' },
  ...overrides,
});

check(() => assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 6));
check(() => assert.equal(getSaveSchemaVersion(legacy()), 0));
check(() => assert.equal(isSaveSchemaSupported({ saveSchemaVersion:5 }), true));
check(() => assert.equal(isSaveSchemaSupported({ saveSchemaVersion:7 }), false));

check(() => {
  const result = migrateSaveState(legacy());
  assert.deepEqual(result.appliedMigrations, ['0->1','1->2','2->3','3->4','4->5','5->6']);
  assert.equal(result.fromVersion, 0);
  assert.equal(result.toVersion, 6);
  assert.equal(result.state.saveSchemaVersion, 6);
  assert.equal(result.state.saveAppVersion, APP_VERSION);
});

check(() => {
  const state = prepareSaveState(legacy());
  assert.equal(state.players.length, 1);
  assert.equal(state.teamRosters.user.length, 1);
  assert.equal(state.teamRosters.user[0].id, 'p1');
  assert.equal(state.club.wage, 10_000);
  assert.equal(Object.hasOwn(state.teamRosters, 'ghost'), false);
  assert.equal(state.market.some((player) => String(player.id) === 'p1'), false);
  assert.equal(state.market.some((player) => String(player.id) === 'free'), true);
});

check(() => {
  const state = prepareSaveState(legacy());
  assert.equal(state.teamRosters.cpu1[0].id, 'cpu-p');
  assert.equal(state.teams[0].squad[0].id, 'cpu-p');
  assert.equal(state.leagues.A[0].squad[0].id, 'cpu-p');
});

check(() => {
  const state = prepareSaveState(legacy());
  assert.deepEqual(state.readMsgIds, ['123','other']);
  assert.deepEqual(state.trashMsgIds, ['123']);
  assert.equal(state.inbox[0].id, '123');
  assert.deepEqual(state.transfersFromTeam, { cpu1:2 });
});

check(() => {
  const state = prepareSaveState(legacy({
    leagueRound:undefined,
    round:4,
    calendar:[{ type:'league' }, { type:'copaBrasil' }, { type:'league' }, { type:'idle' }],
  }));
  assert.equal(state.leagueRound, 2);
});

check(() => {
  const state = prepareSaveState(legacy({ club:{ name:'Meu Clube', money:500_000, wage:0 } }));
  assert.equal(Object.hasOwn(state.club, 'transferBudget'), false);
});

check(() => {
  const first = prepareSaveState(legacy());
  const second = prepareSaveState(first);
  assert.deepEqual(second, first);
});

check(() => {
  const currentButDivergent = {
    ...prepareSaveState(legacy()),
    saveSchemaVersion:CURRENT_SAVE_SCHEMA_VERSION,
    club:{ name:'Meu Clube', money:1_000_000, wage:123 },
    players:[p({ wage:22_000 })],
    teamRosters:{ user:[p({ id:'other', wage:1 })], cpu1:[p({ id:'cpu-p', teamId:'cpu1', teamName:'CPU 1' })] },
  };
  const fixed = prepareSaveState(currentButDivergent);
  assert.deepEqual(fixed.teamRosters.user.map((player) => player.id), ['p1']);
  assert.equal(fixed.club.wage, 22_000);
});

check(() => {
  assert.throws(
    () => prepareSaveState({ saveSchemaVersion:CURRENT_SAVE_SCHEMA_VERSION + 1 }),
    (error) => error?.code === 'SAVE_SCHEMA_TOO_NEW',
  );
});

check(() => {
  const migrated = prepareSaveState({
    saveSchemaVersion:3, season:2026, serie:'A', round:0,
    club:{ name:'Vasco', existingTeamId:'a13', money:1_000_000, wage:0 },
    players:[p({ teamId:'user', teamName:'Vasco' })],
    teams:[{ id:'user', name:'Vasco', isPlayer:true }, { id:'a4', name:'Atlético MG', squad:[] }],
    teamRosters:{ user:[p({ teamId:'user', teamName:'Vasco' })], a4:[] },
    leagues:{ A:[{ id:'a4', name:'Atlético MG', squad:[] }], B:[], C:[], D:[] },
    table:[{ id:'a4', name:'Atlético MG' }],
    fixtures:[[{ home:{ id:'user', name:'Vasco' }, away:{ id:'a4', name:'Atlético MG' } }]],
    market:[], inbox:[], financialHistory:[], careerHistory:[], academy:[], academyReady:[], watchlist:[], scorers:{}, h2hHistory:{},
    transfersFromTeam:{ a4:2 },
  });
  assert.equal(migrated.club.existingTeamId, 'br-vasco-da-gama');
  assert.equal(migrated.club.name, 'Vasco da Gama');
  assert.equal(migrated.club.teamId, 'br-vasco-da-gama');
  assert.equal(migrated.teams[0].id, 'user');
  assert.equal(migrated.teams[0].name, 'Vasco da Gama');
  assert.equal(migrated.teams[1].id, 'br-atletico-mg');
  assert.equal(migrated.teams[1].name, 'Atlético-MG');
  assert.ok(Array.isArray(migrated.teamRosters['br-atletico-mg']));
  assert.equal(Object.hasOwn(migrated.teamRosters, 'a4'), false);
  assert.deepEqual(migrated.transfersFromTeam, { 'br-atletico-mg':2 });
  assert.equal(migrated.fixtures[0][0].away.id, 'br-atletico-mg');
});


check(() => {
  const base = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const beta50 = {
    ...base,
    saveSchemaVersion:4,
    club:{ ...base.club, name:'Clube Personalizado Legado', existingTeamId:null, teamId:null },
    teams:base.teams.map((team) => team.id === 'user' ? { ...team, name:'Clube Personalizado Legado' } : team),
    leagues:{ ...base.leagues, A:getPyramidSeriesTeams2026('A') },
    pyramidReserve:[],
    leaguePyramidVersion:undefined,
  };
  assert.equal(beta50.leagues.A.length, 20);
  const migrated = prepareSaveState(beta50);
  assert.equal(migrated.saveSchemaVersion, 6);
  assert.equal(migrated.club.teamId, null, 'clube personalizado legado permanece sem teamId canônico');
  assert.equal(migrated.leagues.A.length, 19);
  assert.equal(migrated.pyramidReserve.length, 1);
  const ids = ['A','B','C','D'].flatMap((serie) => migrated.leagues[serie].map((team) => String(team.id)));
  assert.equal(ids.length, 79);
  assert.equal(new Set(ids).size, 79);
});

check(() => {
  const malformed = prepareSaveState({ season:'oops', serie:'x', round:-9, players:null, leagues:null, teamRosters:null, club:null });
  assert.equal(malformed.season, 2026);
  assert.equal(malformed.serie, 'A');
  assert.equal(malformed.round, 0);
  assert.deepEqual(malformed.players, []);
  assert.deepEqual(Object.keys(malformed.leagues), ['A','B','C','D']);
});

check(() => {
  const athlete = p({ id:'lineup', position:'CA', isStarting:false, discipline:{ suspendedUntilRound:null } });
  const result = toggleStarterState({
    round:0,
    club:{ name:'Meu Clube', formation:'4-4-2' },
    players:[athlete],
    teamRosters:{ user:[{ ...athlete }] },
  }, 'lineup');
  assert.equal(result.error, undefined);
  assert.equal(result.gameData.players[0].isStarting, true);
  assert.equal(result.gameData.teamRosters.user[0].isStarting, true);
});

console.log(`Save schema smoke: ${checks}/${checks} verificações aprovadas.`);

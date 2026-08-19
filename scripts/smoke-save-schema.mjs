import assert from 'node:assert/strict';
import { APP_VERSION } from '../src/config/appMeta.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { generateFixtures, generateInitialTable } from '../src/engines/core/leagueEngine.js';
import { getPyramidSeriesTeams2026 } from '../src/data/clubCatalog.js';
import { toggleStarterState } from '../src/engines/lineup/lineupService.js';
import { CalendarEngine } from '../src/engines/CalendarEngine.js';
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

check(() => assert.equal(CURRENT_SAVE_SCHEMA_VERSION, 12));
check(() => assert.equal(getSaveSchemaVersion(legacy()), 0));
check(() => assert.equal(isSaveSchemaSupported({ saveSchemaVersion:8 }), true));
check(() => assert.equal(isSaveSchemaSupported({ saveSchemaVersion:10 }), true));
check(() => {
  assert.equal(isSaveSchemaSupported({ saveSchemaVersion:11 }), true);
  assert.equal(isSaveSchemaSupported({ saveSchemaVersion:12 }), true);
});
check(() => assert.equal(isSaveSchemaSupported({ saveSchemaVersion:13 }), false));

check(() => {
  const result = migrateSaveState(legacy());
  assert.deepEqual(result.appliedMigrations, ['0->1','1->2','2->3','3->4','4->5','5->6','6->7','7->8','8->9','9->10','10->11','11->12']);
  assert.equal(result.fromVersion, 0);
  assert.equal(result.toVersion, 12);
  assert.equal(result.state.saveSchemaVersion, 12);
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
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.club.teamId, null, 'clube personalizado legado permanece sem teamId canônico');
  assert.equal(migrated.leagues.A.length, 19);
  assert.equal(migrated.leagues.D.length, 96);
  assert.equal(migrated.pyramidReserve.length >= 1, true);
  const ids = ['A','B','C','D'].flatMap((serie) => migrated.leagues[serie].map((team) => String(team.id)));
  assert.equal(ids.length, 155);
  assert.equal(new Set(ids).size, 155);
});


check(() => {
  const base = getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' });
  const dPool = getPyramidSeriesTeams2026('D').filter((team) => team.id !== 'br-brasiliense').slice(0, 19);
  const user = { id:'user', name:base.club.name, strength:base.club.strength, isPlayer:true, teamId:'br-brasiliense' };
  const legacyTeams = [user, ...dPool];
  const beta52 = {
    ...base,
    saveSchemaVersion:6,
    serieDCompetition:null,
    serieDLegacyFormat:undefined,
    teams:legacyTeams,
    table:generateInitialTable(legacyTeams),
    fixtures:generateFixtures(legacyTeams),
    round:0,
    leagueRound:0,
    calendar:null,
  };
  const migrated = prepareSaveState(beta52);
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.serieDLegacyFormat, false);
  assert.equal(migrated.serieDCompetition?.format, '2026-96x16');
  assert.equal(Object.keys(migrated.serieDCompetition?.groups || {}).length, 16);
  assert.equal(migrated.teams.length, 6);
  assert.equal(migrated.fixtures.length, 22);
  assert.equal(migrated.leagues.D.length, 95);
});

check(() => {
  const base = getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' });
  const dPool = getPyramidSeriesTeams2026('D').filter((team) => team.id !== 'br-brasiliense').slice(0, 19);
  const user = { id:'user', name:base.club.name, strength:base.club.strength, isPlayer:true, teamId:'br-brasiliense' };
  const legacyTeams = [user, ...dPool];
  const fixtures = generateFixtures(legacyTeams);
  fixtures[0] = fixtures[0].map((match) => ({ ...match, played:true, result:'1 - 0' }));
  const migrated = prepareSaveState({
    ...base,
    saveSchemaVersion:6,
    serieDCompetition:null,
    teams:legacyTeams,
    table:generateInitialTable(legacyTeams),
    fixtures,
    round:1,
    leagueRound:1,
    calendar:null,
  });
  assert.equal(migrated.serieDLegacyFormat, true);
  assert.equal(migrated.serieDCompetition, null);
  assert.equal(migrated.teams.length, 20);
  assert.equal(migrated.fixtures.length, 38);
  assert.equal(migrated.leagues.D.length, 95, 'a pirâmide já expande sem alterar o calendário legado em andamento');
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
  const base = getInitialGameState('br-palmeiras', 'Manager', 'A', { formation:'4-4-2' });
  const migrated = prepareSaveState({
    ...base,
    saveSchemaVersion:7,
    calendar:[{ type:'league', leagueIdx:0 }, { type:'cup', cupKey:'copaBrasil' }],
    currentDateISO:null,
    currentDate:null,
    round:0,
    leagueRound:0,
  });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.match(migrated.calendar[0].dateISO, /^2026-\d{2}-\d{2}$/);
  assert.match(migrated.calendar[1].dateISO, /^2026-\d{2}-\d{2}$/);
  assert.ok(migrated.currentDateISO);
});

check(() => {
  const base = getInitialGameState('br-amazonas', 'Manager', 'C', { formation:'4-4-2' });
  const migrated = prepareSaveState({
    ...base,
    season:2027,
    saveSchemaVersion:7,
    serieCCompetition:null,
    serieCLegacyFormat:undefined,
    calendar:null,
    round:0,
    leagueRound:0,
  });
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.serieCLegacyFormat, false);
  assert.equal(migrated.serieCCompetition?.format, '2027-24-single-quadrangular');
  assert.equal(migrated.teams.length, 24);
  assert.equal(migrated.fixtures.length, 31);
});

check(() => {
  const base = getInitialGameState('br-amazonas', 'Manager', 'C', { formation:'4-4-2' });
  const fixtures = base.fixtures.map((round) => round.map((match) => ({ ...match })));
  fixtures[0][0] = { ...fixtures[0][0], played:true, result:'1 - 0' };
  const migrated = prepareSaveState({
    ...base,
    season:2027,
    saveSchemaVersion:7,
    serieCCompetition:null,
    serieCLegacyFormat:undefined,
    fixtures,
    calendar:[{ type:'league', leagueIdx:0 }, { type:'cup', cupKey:'copaBrasil' }],
    round:1,
    leagueRound:1,
  });
  assert.equal(migrated.serieCLegacyFormat, true);
  assert.equal(migrated.serieCCompetition, null);
  assert.equal(migrated.fixtures.length, 38);
  assert.equal(migrated.calendar[0].dateISO, migrated.currentDateISO);
});

check(() => {
  const base = getInitialGameState('br-palmeiras', 'Manager', 'A', { formation:'4-4-2' });
  const beta54 = {
    ...base,
    saveSchemaVersion:8,
    calendar:CalendarEngine.buildCalendar(base.fixtures.length, {}, 'A', { season:2026 }).map(({ targetDateISO, targetSource, ...entry }) => entry),
    round:0,
    leagueRound:0,
  };
  const migrated = prepareSaveState(beta54);
  assert.equal(migrated.saveSchemaVersion, 12);
  assert.equal(migrated.calendarModel, 'annual-v1');
  assert.equal(migrated.calendar.some((entry) => entry?.targetSource), true);
  assert.ok(migrated.currentDateISO);
});

check(() => {
  const base = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const calendar = CalendarEngine.buildCalendar(base.fixtures.length, {}, 'A', { season:2026 }).map(({ targetDateISO, targetSource, ...entry }) => entry);
  const firstDate = calendar[0]?.dateISO || calendar[0]?.calendarDate;
  const migrated = prepareSaveState({
    ...base,
    saveSchemaVersion:8,
    calendar,
    round:1,
    leagueRound:1,
    currentDateISO:firstDate,
    currentDate:firstDate,
  });
  assert.equal(migrated.calendarModel, 'legacy-dated-v1');
  assert.equal(migrated.round, 1);
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


check(() => {
  const raw = getInitialGameState('br-vitoria', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:9,
    round:0,
    leagueRound:0,
    calendar:[{ type:'league', leagueIdx:0, dateISO:'2026-01-28' }],
    cups:{ copaBrasil:{ status:'active' } },
  }).state;
  assert.equal(migrated.cups.regional?.competitionKey, 'copaNordeste');
  assert.equal(migrated.regionalCalendarModel, 'cbf-regional-v1');
  assert.equal(migrated.cups.copaBrasil?.phaseLabel, '5ª Fase');
  assert.equal(Boolean(migrated.cups.copaBrasil?.currentTie?.leg2), true);
  assert.equal(migrated.copaBrasilCalendarModel, 'cbf-2026-v2');
  assert.ok(Array.isArray(migrated.calendar) && migrated.calendar.length > 0);
  assert.ok(migrated.currentDateISO);
  assert.ok(migrated.calendar.some((entry) => entry.cupKey === 'copaNordeste'));
});

check(() => {
  const raw = getInitialGameState('br-vitoria', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:9,
    round:1,
    leagueRound:1,
    cups:{ copaBrasil:{ status:'active' } },
  }).state;
  assert.equal(migrated.cups.regional, undefined);
  assert.equal(migrated.regionalCalendarModel, 'deferred-until-next-season');
  assert.equal(migrated.copaBrasilCalendarModel, 'legacy-format-until-next-season');
});

check(() => {
  const raw = getInitialGameState('br-flamengo', 'Treinador');
  const migrated = migrateSaveState({ ...raw, saveSchemaVersion:9, cups:{ copaBrasil:{ status:'active' } } }).state;
  assert.equal(migrated.cups.regional, undefined);
  assert.equal(migrated.regionalCalendarModel, 'not-eligible');
  assert.equal(migrated.cups.copaBrasil?.phaseLabel, '5ª Fase');
  assert.equal(migrated.copaBrasilCalendarModel, 'cbf-2026-v2');
});

check(() => {
  const raw = getInitialGameState('br-vitoria', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:9,
    cups:{ copaBrasil:{ status:'active' }, libertadores:{ status:'active' } },
  }).state;
  assert.equal(migrated.cups.regional, undefined);
  assert.equal(migrated.regionalCalendarModel, 'not-eligible');
});


check(() => {
  const raw = getInitialGameState('br-flamengo', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:10,
    round:0,
    leagueRound:0,
    cups:{ copaBrasil:{ status:'active' } },
  }).state;
  assert.equal(migrated.cups.estadual?.competitionKey, 'carioca');
  assert.equal(migrated.stateChampionshipModel, 'state-v2-8-championships');
  assert.ok(Array.isArray(migrated.calendar) && migrated.calendar.length > 0);
  assert.ok(migrated.currentDateISO);
  assert.ok(migrated.calendar.some((entry) => entry.cupKey === 'carioca'));
});

check(() => {
  const raw = getInitialGameState('br-flamengo', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:10,
    round:1,
    leagueRound:0,
    cups:{ copaBrasil:{ status:'active' } },
  }).state;
  assert.equal(migrated.cups.estadual, undefined);
  assert.equal(migrated.stateChampionshipModel, 'deferred-until-next-season');
});



check(() => {
  const raw = getInitialGameState('br-palmeiras', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:11,
    cups:{ copaBrasil:raw.cups?.copaBrasil },
    round:0,
    leagueRound:0,
  }).state;
  assert.equal(migrated.cups.estadual?.competitionKey, 'paulista');
  assert.equal(migrated.stateChampionshipModel, 'state-v2-8-championships');
  assert.ok(Array.isArray(migrated.calendar) && migrated.calendar.some((entry) => entry.cupKey === 'paulista'));
  assert.ok(migrated.currentDateISO);
});

check(() => {
  const raw = getInitialGameState('br-palmeiras', 'Treinador');
  const migrated = migrateSaveState({
    ...raw,
    saveSchemaVersion:11,
    cups:{},
    round:1,
    leagueRound:0,
  }).state;
  assert.equal(migrated.cups.estadual, undefined);
  assert.equal(migrated.stateChampionshipModel, 'deferred-until-next-season');
});

console.log(`Save schema smoke: ${checks}/${checks} verificações aprovadas.`);

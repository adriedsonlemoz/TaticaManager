import assert from 'node:assert/strict';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { generateNextSeason } from '../src/engines/core/seasonEngine.js';
import {
  buildLeagueIntegrityReport,
  buildLeagueScheduleReport,
  generateFixtures,
  generateInitialTable,
  parseLeagueResult,
  rebuildLeagueTable,
  reconcileLeagueState,
  sortLeagueTable,
} from '../src/engines/core/leagueEngine.js';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const teams = Array.from({ length:20 }, (_, index) => ({
  id:index === 0 ? 'user' : `cpu${index}`,
  name:index === 0 ? 'Meu Clube' : `Clube ${String(index).padStart(2, '0')}`,
}));

const rngFactory = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const playFullSeason = (seed) => {
  const rng = rngFactory(seed);
  const fixtures = generateFixtures(teams).map((round) => round.map((match) => ({
    ...match,
    played:true,
    result:`${Math.floor(rng() * 5)} - ${Math.floor(rng() * 5)}`,
  })));
  const table = rebuildLeagueTable(generateInitialTable(teams), fixtures);
  return { fixtures, table };
};

test('calendário de 20 clubes gera 38 rodadas e 380 jogos sem duplicar confrontos', () => {
  const fixtures = generateFixtures(teams);
  const report = buildLeagueScheduleReport(generateInitialTable(teams), fixtures);
  assert.equal(report.ok, true, report.errors.join(', '));
  assert.equal(report.rounds, 38);
  assert.equal(report.expectedMatches, 380);
  assert.equal(fixtures.every((round) => round.length === 10), true);
});

test('cada par se enfrenta exatamente duas vezes com mando invertido', () => {
  const fixtures = generateFixtures(teams);
  const oriented = new Set();
  const pairs = new Map();
  fixtures.flat().forEach((match) => {
    const key = `${match.home.id}>${match.away.id}`;
    assert.equal(oriented.has(key), false, `mando repetido: ${key}`);
    oriented.add(key);
    const pair = [String(match.home.id), String(match.away.id)].sort().join('|');
    pairs.set(pair, (pairs.get(pair) || 0) + 1);
  });
  assert.equal(pairs.size, 190);
  assert.equal([...pairs.values()].every((count) => count === 2), true);
});

test('parser aceita separadores usuais e rejeita placar malformado', () => {
  assert.deepEqual(parseLeagueResult('2 - 1'), { homeGoals:2, awayGoals:1 });
  assert.deepEqual(parseLeagueResult('3x0'), { homeGoals:3, awayGoals:0 });
  assert.deepEqual(parseLeagueResult('1×1'), { homeGoals:1, awayGoals:1 });
  assert.equal(parseLeagueResult('1-'), null);
  assert.equal(parseLeagueResult(null), null);
});

test('reconstrução é idempotente mesmo se tabela persistida estiver inflada', () => {
  const fixtures = generateFixtures(teams);
  fixtures[0] = fixtures[0].map((match, index) => ({ ...match, played:true, result:index % 2 ? '1-1' : '2-0' }));
  const clean = rebuildLeagueTable(generateInitialTable(teams), fixtures);
  const corrupted = clean.map((row) => ({ ...row, p:row.p + 30, pts:row.pts + 90, gf:row.gf + 100 }));
  const recovered = rebuildLeagueTable(corrupted, fixtures);
  assert.deepEqual(
    recovered.map(({ id,p,w,d,l,gf,ga,pts }) => ({ id,p,w,d,l,gf,ga,pts })),
    clean.map(({ id,p,w,d,l,gf,ga,pts }) => ({ id,p,w,d,l,gf,ga,pts })),
  );
});

test('alterar o placar de um fixture substitui o resultado em vez de somar uma segunda partida', () => {
  const fixtures = generateFixtures(teams);
  fixtures[0][0] = { ...fixtures[0][0], played:true, result:'1-0' };
  const first = rebuildLeagueTable(generateInitialTable(teams), fixtures);
  const homeId = fixtures[0][0].home.id;
  assert.equal(first.find((row) => row.id === homeId).p, 1);
  fixtures[0][0] = { ...fixtures[0][0], result:'0-2' };
  const second = rebuildLeagueTable(first, fixtures);
  const home = second.find((row) => row.id === homeId);
  assert.equal(home.p, 1);
  assert.equal(home.w, 0);
  assert.equal(home.l, 1);
  assert.equal(home.gf, 0);
  assert.equal(home.ga, 2);
});

test('desempate usa saldo e gols pró antes do confronto direto', () => {
  const fixtures = [[{ home:{id:'b'}, away:{id:'a'}, played:true, result:'4-0' }]];
  const bySaldo = sortLeagueTable([
    {id:'a',name:'A',pts:20,w:6,gf:12,ga:5},
    {id:'b',name:'B',pts:20,w:6,gf:10,ga:7},
  ], fixtures);
  assert.equal(bySaldo[0].id, 'a');
  const byGoals = sortLeagueTable([
    {id:'a',name:'A',pts:20,w:6,gf:13,ga:8},
    {id:'b',name:'B',pts:20,w:6,gf:12,ga:7},
  ], fixtures);
  assert.equal(byGoals[0].id, 'a');
});

test('confronto direto desempata apenas após PTS/V/SG/GF iguais', () => {
  const fixtures = [[
    { home:{id:'a'}, away:{id:'b'}, played:true, result:'2-0' },
    { home:{id:'x'}, away:{id:'y'}, played:false, result:null },
  ]];
  const sorted = sortLeagueTable([
    {id:'b',name:'B',pts:20,w:6,gf:10,ga:5},
    {id:'a',name:'A',pts:20,w:6,gf:10,ga:5},
  ], fixtures);
  assert.equal(sorted[0].id, 'a');
});

test('100 temporadas completas preservam todos os invariantes da classificação', () => {
  for (let season = 1; season <= 100; season += 1) {
    const { fixtures, table } = playFullSeason(0xC0FFEE + season * 97);
    const report = buildLeagueIntegrityReport(table, fixtures);
    assert.equal(report.ok, true, `temporada ${season}: ${report.errors.join(', ')}`);
    assert.equal(table.length, 20);
    assert.equal(table.every((row) => row.p === 38), true, `temporada ${season}: PJ`);
    assert.equal(report.totals.wins, report.totals.losses, `temporada ${season}: V/D`);
    assert.equal(report.totals.goalsFor, report.totals.goalsAgainst, `temporada ${season}: GP/GC`);
    assert.equal(report.totals.tableMatches, 760, `temporada ${season}: soma PJ`);
    assert.equal(new Set(table.map((row) => String(row.id))).size, 20);
    assert.ok(table[0].pts >= table.at(-1).pts);
  }
});

test('relatório detecta corrupção estrutural do calendário', () => {
  const fixtures = generateFixtures(teams);
  fixtures[0][1] = { ...fixtures[0][0] };
  const report = buildLeagueScheduleReport(generateInitialTable(teams), fixtures);
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((error) => error.includes('duplicate-team') || error.includes('oriented-') || error.includes('pair-')));
});


test('cinco viradas consecutivas preservam 20 clubes únicos e calendário íntegro', () => {
  let state = getInitialGameState('br-flamengo', 'Treinador Stress', 'A', { formation:'4-4-2' });
  for (let year = 0; year < 5; year += 1) {
    const rng = rngFactory(0xA11CE + year * 123);
    const fixtures = state.fixtures.map((round) => round.map((match) => ({
      ...match,
      played:true,
      result:`${Math.floor(rng() * 4)} - ${Math.floor(rng() * 4)}`,
    })));
    const table = rebuildLeagueTable(state.table, fixtures);
    state = generateNextSeason({ ...state, fixtures, table, round:38, leagueRound:38, calendar:null });
    assert.equal(state.teams.length, 20, `virada ${year + 1}: clubes`);
    assert.equal(new Set(state.teams.map((team) => String(team.id))).size, 20, `virada ${year + 1}: ids`);
    assert.equal(state.teams.filter((team) => team.id === 'user').length, 1, `virada ${year + 1}: user`);
    assert.equal(state.table.length, 20, `virada ${year + 1}: tabela`);
    assert.equal(state.table.every((row) => row.p === 0 && row.pts === 0), true, `virada ${year + 1}: reset`);
    const schedule = buildLeagueScheduleReport(state.table, state.fixtures);
    assert.equal(schedule.ok, true, `virada ${year + 1}: ${schedule.errors.join(', ')}`);
    assert.equal(state.fixtures.length, 38);
  }
});


test('save moderno com tabela stale é reconciliado automaticamente pelos fixtures', () => {
  const fixtures = generateFixtures(teams);
  fixtures[0] = fixtures[0].map((match) => ({ ...match, played:true, result:'1 - 0' }));
  const staleTable = generateInitialTable(teams).map((row) => ({ ...row, p:99, pts:297, gf:999 }));
  const state = { table:staleTable, fixtures, round:1, leagueRound:1 };
  const reconciled = reconcileLeagueState(state);
  assert.notEqual(reconciled, state);
  assert.equal(reconciled.table.every((row) => row.p === 1), true);
  assert.equal(reconciled.table.reduce((sum, row) => sum + row.p, 0), 20);
  assert.equal(reconcileLeagueState(reconciled), reconciled, 'segunda reconciliação deve ser no-op referencial');
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

console.log(`\nLeague season stress: ${passed}/${tests.length} verificações aprovadas · 100 temporadas completas.`);

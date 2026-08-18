import assert from 'node:assert/strict';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { generateNextSeason } from '../src/engines/core/seasonEngine.js';
import { getPyramidSeriesTeams2026 } from '../src/data/clubCatalog.js';
import {
  advanceLeaguePyramid,
  applyManagerTakeoverToPyramid,
  reconcileLeaguePyramid,
  rankCpuDivision,
} from '../src/engines/season/seasonPyramid.js';

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
};

const counts = (state) => Object.fromEntries(['A','B','C','D'].map((serie) => [serie, state.leagues?.[serie]?.length || 0]));
const cpuIds = (pools) => ['A','B','C','D'].flatMap((serie) => (pools?.[serie] || []).map((team) => String(team.id)));
const standings = (state, userPosition = 10) => {
  const cpus = state.teams.filter((team) => team.id !== 'user');
  const ordered = [...cpus];
  ordered.splice(Math.max(0, Math.min(ordered.length, userPosition - 1)), 0, state.teams.find((team) => team.id === 'user'));
  return ordered.map((team, index) => ({
    id:team.id,
    name:team.name,
    pts:90 - index * 3,
    p:38,
    w:28 - Math.min(index, 20),
    d:4,
    l:6 + index,
    gf:70 - index,
    ga:20 + index,
  }));
};

test('clube oficial da Série D fora do recorte antigo pode iniciar carreira sem duplicação', () => {
  const state = getInitialGameState('br-brasiliense', 'Manager', 'A', { formation:'4-4-2' });
  assert.equal(state.serie, 'D', 'Série enviada pela chamada deve ser ignorada');
  assert.deepEqual(counts(state), { A:20, B:20, C:20, D:19 });
  assert.equal(cpuIds(state.leagues).length, 79);
  assert.equal(new Set(cpuIds(state.leagues)).size, 79);
  assert.equal(cpuIds(state.leagues).includes('br-brasiliense'), false);
  assert.equal(state.pyramidReserve.some((team) => team.id === 'br-brasiliense'), false);
  assert.equal(state.pyramidReserve.length >= 76, true);
});

test('carreira em clube real não duplica o clube controlado na pirâmide CPU', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  assert.deepEqual(counts(state), { A:19, B:20, C:20, D:20 });
  assert.equal(cpuIds(state.leagues).includes('br-flamengo'), false);
  assert.equal(state.pyramidReserve.length, 76);
});

test('reconciliação beta 50 remove o 20º CPU oculto da série atual sem apagar o clube', () => {
  const base = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const legacyLike = {
    ...base,
    leagues:{ ...base.leagues, A:getPyramidSeriesTeams2026('A') },
    pyramidReserve:[],
    leaguePyramidVersion:undefined,
  };
  const fixed = reconcileLeaguePyramid(legacyLike);
  assert.equal(fixed.leagues.A.length, 19);
  assert.equal(fixed.pyramidReserve.some((team) => team.id === 'br-flamengo'), false);
  assert.equal(new Set(cpuIds(fixed.leagues)).size, 79);
});

test('G4 da Série B sobe de verdade e Z4 da Série A cai para B', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const finalTable = standings(state, 10);
  const expectedDown = finalTable.slice(-4).map((row) => String(row.id));
  const expectedUp = rankCpuDivision(state.leagues.B, state.season, 'B').slice(0, 4).map((team) => String(team.id));
  const next = advanceLeaguePyramid(state, finalTable);
  assert.ok(next);
  const aIds = new Set(next.pools.A.map((team) => String(team.id)));
  const bIds = new Set(next.pools.B.map((team) => String(team.id)));
  expectedUp.forEach((id) => assert.equal(aIds.has(id), true, `${id} deveria subir B→A`));
  expectedDown.forEach((id) => assert.equal(bIds.has(id), true, `${id} deveria cair A→B`));
  expectedDown.forEach((id) => assert.equal(aIds.has(id), false));
});

test('usuário no G4 da Série B ocupa uma vaga real da Série A', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'B', { formation:'4-4-2' });
  const next = advanceLeaguePyramid(state, standings(state, 1));
  assert.equal(next.userSerie, 'A');
  assert.equal(next.pools.A.length, 19);
  assert.equal(next.pools.B.length, 20);
  assert.ok(next.movement.promoted.some((entry) => entry.isUser && entry.from === 'B' && entry.to === 'A'));
});

test('usuário no Z4 da Série A ocupa uma vaga real da Série B', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const next = advanceLeaguePyramid(state, standings(state, 20));
  assert.equal(next.userSerie, 'B');
  assert.equal(next.pools.A.length, 20);
  assert.equal(next.pools.B.length, 19);
  assert.ok(next.movement.relegated.some((entry) => entry.isUser && entry.from === 'A' && entry.to === 'B'));
});

test('Série D troca quatro clubes com a C sem expulsar clubes para uma divisão inexistente', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const dTop = rankCpuDivision(state.leagues.D, state.season, 'D').slice(0, 4).map((team) => String(team.id));
  const cBottom = rankCpuDivision(state.leagues.C, state.season, 'C').slice(-4).map((team) => String(team.id));
  const next = advanceLeaguePyramid(state, standings(state, 10));
  const cIds = new Set(next.pools.C.map((team) => String(team.id)));
  const dIds = new Set(next.pools.D.map((team) => String(team.id)));
  dTop.forEach((id) => assert.equal(cIds.has(id), true));
  cBottom.forEach((id) => assert.equal(dIds.has(id), true));
  assert.equal(next.movement.relegated.some((entry) => entry.from === 'D'), false);
  assert.equal(next.pools.D.length, 20);
});

test('virada mantém exatamente 79 clubes CPU únicos na pirâmide', () => {
  const state = getInitialGameState('br-paysandu', 'Manager', 'C', { formation:'4-4-2' });
  const next = advanceLeaguePyramid(state, standings(state, 8));
  const ids = cpuIds(next.pools);
  assert.equal(ids.length, 79);
  assert.equal(new Set(ids).size, 79);
});

test('troca de clube pelo manager mantém o clube anterior na pirâmide e remove apenas o novo controlado', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const advanced = advanceLeaguePyramid(state, standings(state, 10));
  const offering = advanced.pools.A.find((team) => team.id === 'br-palmeiras')
    || Object.values(advanced.pools).flat().find((team) => team.id === 'br-palmeiras');
  assert.ok(offering);
  const swapped = applyManagerTakeoverToPyramid({
    pools:advanced.pools,
    pyramidReserve:advanced.pyramidReserve,
    previousClubId:'br-flamengo',
    previousClub:{ id:'br-flamengo', name:'Flamengo', strength:88 },
    previousUserSerie:advanced.userSerie,
    nextClub:offering,
  });
  const ids = cpuIds(swapped.pools);
  assert.equal(swapped.userSerie, 'A');
  assert.equal(ids.includes('br-palmeiras'), false);
  assert.equal(ids.includes('br-flamengo'), true);
  assert.equal(ids.length, 79);
  assert.equal(new Set(ids).size, 79);
});

test('proposta de manager segue a divisão pós-virada do clube contratado e troca os elencos corretamente', () => {
  const state = getInitialGameState('br-abc', 'Manager', 'D', { formation:'4-4-2' });
  const offering = rankCpuDivision(state.leagues.A, state.season, 'A').slice(-1)[0];
  assert.ok(offering);
  const incomingRoster = state.teamRosters[offering.id].map((player, index) => index === 0
    ? { ...player, age:20, contract:3, isStarting:true }
    : player);
  const oldRoster = state.players.map((player, index) => index === 0
    ? { ...player, age:20, contract:3, isStarting:true }
    : player);
  const incomingId = String(incomingRoster[0].id);
  const oldId = String(oldRoster[0].id);
  const table = standings({ ...state, players:oldRoster }, 10);
  const next = generateNextSeason({
    ...state,
    players:oldRoster,
    teamRosters:{ ...state.teamRosters, user:oldRoster, [offering.id]:incomingRoster },
    table,
    fixtures:[], round:38, leagueRound:38, calendar:null,
    pendingManagerTransfer:{ accepted:true, offeringClub:{ id:offering.id, name:offering.name } },
  }, () => 0.42);

  // O último colocado determinístico da A cai para B; o manager acompanha o clube,
  // em vez de permanecer na D por causa do resultado do antigo clube.
  assert.equal(next.serie, 'B');
  assert.equal(next.club.existingTeamId, offering.id);
  assert.equal(next.players.some((player) => String(player.id) === incomingId), true);
  assert.equal(next.players.some((player) => String(player.id) === oldId), false);
  assert.equal(next.teamRosters['br-abc']?.some((player) => String(player.id) === oldId), true);
  assert.equal(next.leagues.D.some((team) => team.id === 'br-abc'), true);
  assert.equal(cpuIds(next.leagues).includes(String(offering.id)), false);
  assert.equal(cpuIds(next.leagues).length, 79);
  assert.equal(new Set(cpuIds(next.leagues)).size, 79);
});

test('generateNextSeason persiste movimentos CPU em leagues e registra auditoria da virada', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'B', { formation:'4-4-2' });
  const table = standings(state, 1);
  // Como o usuário está em 1º, os três primeiros CPU do restante do G4 também sobem.
  const expectedCpuPromoted = table.slice(1, 4).map((row) => String(row.id));
  const next = generateNextSeason({ ...state, table, fixtures:[], round:38, leagueRound:38, calendar:null }, () => 0.42);
  assert.equal(next.serie, 'A');
  assert.equal(next.leagues.A.length, 19);
  expectedCpuPromoted.forEach((id) => assert.equal(next.leagues.A.some((team) => String(team.id) === id), true));
  assert.equal(next.lastDivisionMovement?.userFrom, 'B');
  assert.equal(next.lastDivisionMovement?.userTo, 'A');
  assert.equal(next.lastDivisionMovement?.promoted.some((entry) => entry.isUser), true);
  assert.equal(next.leagues.B.length, 20);
});

console.log(`\nLeague pyramid smoke: ${passed}/${passed} verificações aprovadas.`);

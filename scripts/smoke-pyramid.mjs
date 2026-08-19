import assert from 'node:assert/strict';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { generateNextSeason } from '../src/engines/core/seasonEngine.js';
import { getPyramidSeriesTeams2026 } from '../src/data/clubCatalog.js';
import { simulateCpuSerieDOutcome } from '../src/engines/serieD/serieDCompetition.js';
import {
  advanceLeaguePyramid,
  applyManagerTakeoverToPyramid,
  reconcileLeaguePyramid,
  rankCpuDivision,
} from '../src/engines/season/seasonPyramid.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; console.log(`✅ ${name}`); }
  catch (error) { console.error(`❌ ${name}`); throw error; }
};

const counts = (state) => Object.fromEntries(['A','B','C','D'].map((serie) => [serie, state.leagues?.[serie]?.length || 0]));
const cpuIds = (pools) => ['A','B','C','D'].flatMap((serie) => (pools?.[serie] || []).map((team) => String(team.id)));
const standings = (state, userPosition = 10) => {
  const cpus = state.teams.filter((team) => team.id !== 'user');
  const ordered = [...cpus];
  ordered.splice(Math.max(0, Math.min(ordered.length, userPosition - 1)), 0, state.teams.find((team) => team.id === 'user'));
  return ordered.map((team, index) => ({
    id:team.id, name:team.name, pts:90-index*3, p:Math.max(1, ordered.length*2-2),
    w:28-Math.min(index,20), d:4, l:6+index, gf:70-index, ga:20+index,
  }));
};

test('clube da Série D entra no universo de 96 sem duplicação', () => {
  const state = getInitialGameState('br-brasiliense', 'Manager', 'A', { formation:'4-4-2' });
  assert.equal(state.serie, 'D');
  assert.deepEqual(counts(state), { A:20, B:20, C:20, D:95 });
  assert.equal(cpuIds(state.leagues).length, 155);
  assert.equal(new Set(cpuIds(state.leagues)).size, 155);
  assert.equal(cpuIds(state.leagues).includes('br-brasiliense'), false);
  assert.equal(state.teams.length, 6);
  assert.equal(state.serieDCompetition != null, true);
});

test('carreira na Série A mantém 155 CPUs únicos distribuídos pela pirâmide completa', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  assert.deepEqual(counts(state), { A:19, B:20, C:20, D:96 });
  const ids = cpuIds(state.leagues);
  assert.equal(ids.length, 155);
  assert.equal(new Set(ids).size, 155);
  assert.equal(ids.includes('br-flamengo'), false);
  assert.equal(state.pyramidReserve.length, 0);
});

test('reconciliação expande save antigo para a pirâmide completa sem duplicar o usuário', () => {
  const base = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const legacyLike = {
    ...base,
    leagues:{ ...base.leagues, A:getPyramidSeriesTeams2026('A'), D:getPyramidSeriesTeams2026('D').slice(0, 20) },
    pyramidReserve:[], leaguePyramidVersion:1,
  };
  const fixed = reconcileLeaguePyramid(legacyLike);
  assert.deepEqual(counts(fixed), { A:19, B:20, C:20, D:96 });
  const ids = cpuIds(fixed.leagues);
  assert.equal(ids.length, 155);
  assert.equal(new Set(ids).size, 155);
  assert.equal(ids.includes('br-flamengo'), false);
});

test('G4 da Série B sobe e Z4 da Série A cai preservando identidade dos clubes', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const finalTable = standings(state, 10);
  const expectedDown = finalTable.slice(-4).map((row) => String(row.id));
  const expectedUp = rankCpuDivision(state.leagues.B, state.season, 'B').slice(0,4).map((team) => String(team.id));
  const next = advanceLeaguePyramid(state, finalTable);
  const aIds = new Set(next.pools.A.map((team) => String(team.id)));
  const bIds = new Set(next.pools.B.map((team) => String(team.id)));
  expectedUp.forEach((teamId) => assert.equal(aIds.has(teamId), true));
  expectedDown.forEach((teamId) => assert.equal(bIds.has(teamId), true));
  assert.deepEqual(Object.fromEntries(['A','B','C','D'].map((serie) => [serie,next.pools[serie].length])), { A:19, B:20, C:24, D:96 });
});

test('usuário no G4 da Série B ocupa uma vaga real da Série A', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'B', { formation:'4-4-2' });
  const next = advanceLeaguePyramid(state, standings(state, 1));
  assert.equal(next.userSerie, 'A');
  assert.equal(next.pools.A.length, 19);
  assert.equal(next.pools.B.length, 20);
  assert.equal(next.pools.C.length, 24);
  assert.equal(next.pools.D.length, 96);
  assert.ok(next.movement.promoted.some((entry) => entry.isUser && entry.from === 'B' && entry.to === 'A'));
});

test('usuário no Z4 da Série A ocupa uma vaga real da Série B', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const next = advanceLeaguePyramid(state, standings(state, 20));
  assert.equal(next.userSerie, 'B');
  assert.equal(next.pools.A.length, 20);
  assert.equal(next.pools.B.length, 19);
  assert.equal(next.pools.C.length, 24);
  assert.equal(next.pools.D.length, 96);
  assert.ok(next.movement.relegated.some((entry) => entry.isUser && entry.from === 'A' && entry.to === 'B'));
});

test('virada 2026 promove seis clubes da D, rebaixa dois da C e expande a C para 24', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const expectedDUp = simulateCpuSerieDOutcome(state.leagues.D, 2026).promotedCanonicalIds;
  const expectedCDown = rankCpuDivision(state.leagues.C, 2026, 'C').slice(-2).map((team) => String(team.id));
  const next = advanceLeaguePyramid(state, standings(state, 10));
  const cIds = new Set(next.pools.C.map((team) => String(team.id)));
  const dIds = new Set(next.pools.D.map((team) => String(team.id)));
  expectedDUp.forEach((teamId) => assert.equal(cIds.has(teamId), true, `${teamId} deveria subir D→C`));
  expectedCDown.forEach((teamId) => assert.equal(dIds.has(teamId), true, `${teamId} deveria cair C→D`));
  assert.equal(next.movement.promoted.filter((entry) => entry.from === 'D').length, 6);
  assert.equal(next.movement.relegated.filter((entry) => entry.from === 'C').length, 2);
  assert.equal(next.pools.C.length, 24);
  assert.equal(next.pools.D.length, 96);
});

test('virada 2027 promove seis da D, rebaixa dois da C e expande a Série C para 28 clubes', () => {
  const state = getInitialGameState('br-paysandu', 'Manager', 'C', { formation:'4-4-2' });
  const first = advanceLeaguePyramid(state, standings(state, 8));
  const state2027 = {
    ...state, season:2027, serie:first.userSerie, leagues:first.pools, pyramidReserve:first.pyramidReserve,
    leaguePyramidVersion:2, serieCLegacyFormat:true, serieCCompetition:null,
    teams:[{ ...state.teams.find((team) => team.id === 'user'), id:'user', isPlayer:true }, ...first.pools[first.userSerie]],
  };
  const table2027 = standings(state2027, 8);
  const second = advanceLeaguePyramid(state2027, table2027);
  const ids = cpuIds(second.pools);
  assert.equal(ids.length, 163);
  assert.equal(new Set(ids).size, 163);
  assert.equal(second.movement.promoted.filter((entry) => entry.from === 'D').length, 6);
  assert.equal(second.movement.relegated.filter((entry) => entry.from === 'C').length, 2);
  assert.equal(second.pools.C.length, 27, 'usuário permanece na Série C dentro da divisão de 28 clubes');
  assert.equal(second.pools.D.length, 96);
});

test('troca de clube pelo manager mantém clube anterior na pirâmide e remove o novo controlado', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', 'A', { formation:'4-4-2' });
  const advanced = advanceLeaguePyramid(state, standings(state, 10));
  const offering = Object.values(advanced.pools).flat().find((team) => team.id === 'br-palmeiras');
  assert.ok(offering);
  const swapped = applyManagerTakeoverToPyramid({
    pools:advanced.pools, pyramidReserve:advanced.pyramidReserve,
    previousClubId:'br-flamengo', previousClub:{ id:'br-flamengo', name:'Flamengo', strength:88 },
    previousUserSerie:advanced.userSerie, nextClub:offering,
  });
  const ids = cpuIds(swapped.pools);
  assert.equal(ids.includes('br-palmeiras'), false);
  assert.equal(ids.includes('br-flamengo'), true);
  assert.equal(ids.length, 159);
  assert.equal(new Set(ids).size, 159);
});

test('proposta de manager segue a divisão pós-virada do clube contratado e troca elencos', () => {
  const state = getInitialGameState('br-abc', 'Manager', 'D', { formation:'4-4-2' });
  const offering = rankCpuDivision(state.leagues.A, state.season, 'A').slice(-1)[0];
  assert.ok(offering);
  const incomingRoster = state.teamRosters[offering.id].map((player, index) => index === 0 ? { ...player, age:20, contract:3, isStarting:true } : player);
  const oldRoster = state.players.map((player, index) => index === 0 ? { ...player, age:20, contract:3, isStarting:true } : player);
  const incomingId = String(incomingRoster[0].id); const oldId = String(oldRoster[0].id);
  const next = generateNextSeason({
    ...state, players:oldRoster,
    teamRosters:{ ...state.teamRosters, user:oldRoster, [offering.id]:incomingRoster },
    table:state.table, fixtures:[], round:22, leagueRound:22, calendar:null,
    pendingManagerTransfer:{ accepted:true, offeringClub:{ id:offering.id, name:offering.name } },
  }, () => 0.42);
  assert.equal(next.serie, 'B');
  assert.equal(next.club.existingTeamId, offering.id);
  assert.equal(next.players.some((player) => String(player.id) === incomingId), true);
  assert.equal(next.players.some((player) => String(player.id) === oldId), false);
  assert.equal(next.teamRosters['br-abc']?.some((player) => String(player.id) === oldId), true);
  assert.equal(next.leagues.D.some((team) => team.id === 'br-abc'), true);
  assert.equal(cpuIds(next.leagues).includes(String(offering.id)), false);
  assert.equal(cpuIds(next.leagues).length, 159);
  assert.equal(new Set(cpuIds(next.leagues)).size, 159);
});

test('generateNextSeason persiste movimentos CPU e registra auditoria da virada', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'B', { formation:'4-4-2' });
  const table = standings(state, 1);
  const expectedCpuPromoted = table.slice(1,4).map((row) => String(row.id));
  const next = generateNextSeason({ ...state, table, fixtures:[], round:38, leagueRound:38, calendar:null }, () => 0.42);
  assert.equal(next.serie, 'A');
  assert.equal(next.leagues.A.length, 19);
  expectedCpuPromoted.forEach((teamId) => assert.equal(next.leagues.A.some((team) => String(team.id) === teamId), true));
  assert.equal(next.lastDivisionMovement?.userFrom, 'B');
  assert.equal(next.lastDivisionMovement?.userTo, 'A');
  assert.equal(next.lastDivisionMovement?.promoted.some((entry) => entry.isUser), true);
  assert.equal(next.leagues.B.length, 20);
  assert.equal(next.leagues.C.length, 24);
  assert.equal(next.leagues.D.length, 96);
});

console.log(`\nLeague pyramid smoke: ${passed}/${passed} verificações aprovadas.`);

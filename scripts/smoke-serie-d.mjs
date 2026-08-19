import assert from 'node:assert/strict';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { getPyramidSeriesTeams2026 } from '../src/data/clubCatalog.js';
import {
  advanceSerieDCompetitionAfterRound,
  getSerieDPhaseLabel,
  getSerieDUserOutcome,
  initializeSerieDCompetition,
  isSerieDLeagueSlotInactive,
  simulateCpuSerieDOutcome,
} from '../src/engines/serieD/serieDCompetition.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; console.log(`✅ ${name}`); }
  catch (error) { console.error(`❌ ${name}`); throw error; }
};

const id = (team) => String(team?.id || '');
const hasUser = (match) => id(match?.home) === 'user' || id(match?.away) === 'user';

function completeRound(state, index, userResult = 'win') {
  const fixtures = (state.fixtures || []).map((round) => [...(round || [])]);
  fixtures[index] = (fixtures[index] || []).map((match, matchIndex) => {
    let result = `${1 + (matchIndex % 2)} - ${matchIndex % 2}`;
    if (hasUser(match)) {
      const userHome = id(match.home) === 'user';
      if (userResult === 'loss') result = userHome ? '0 - 3' : '3 - 0';
      else if (userResult === 'draw') result = '1 - 1';
      else result = userHome ? '3 - 0' : '0 - 3';
    }
    return { ...match, played:true, result, events:[] };
  });
  return advanceSerieDCompetitionAfterRound({ ...state, fixtures }, index);
}

function playGroup(state, userResult = 'win') {
  let current = state;
  for (let round = 0; round < 10; round += 1) current = completeRound(current, round, userResult);
  return current;
}

function playTwoLegStage(state, start, userResult = 'win') {
  let current = completeRound(state, start, userResult);
  current = completeRound(current, start + 1, userResult);
  return current;
}

test('Série D 2026 inicia com 96 clubes em 16 grupos de seis', () => {
  const state = getInitialGameState('br-brasiliense', 'Manager', 'A', { formation:'4-4-2' });
  assert.equal(state.serie, 'D');
  const groups = state.serieDCompetition?.groups || {};
  assert.equal(Object.keys(groups).length, 16);
  Object.values(groups).forEach((teams) => assert.equal(teams.length, 6));
  const canonicalIds = Object.values(groups).flat().map((team) => team.id === 'user' ? state.club.teamId : team.id);
  assert.equal(canonicalIds.length, 96);
  assert.equal(new Set(canonicalIds).size, 96);
  assert.equal(canonicalIds.filter((teamId) => teamId === 'br-brasiliense').length, 1);
  assert.equal(state.teams.length, 6);
  assert.equal(state.table.length, 6);
  assert.equal(state.fixtures.length, 22);
});

test('primeira fase possui dez rodadas, 48 jogos por rodada e dez partidas por clube', () => {
  const state = getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' });
  const firstStage = state.fixtures.slice(0, 10);
  firstStage.forEach((round) => assert.equal(round.length, 48));
  assert.equal(firstStage.flat().length, 480);
  const appearances = new Map();
  firstStage.flat().forEach((match) => {
    [match.home, match.away].forEach((team) => {
      const key = team.id === 'user' ? state.club.teamId : team.id;
      appearances.set(key, (appearances.get(key) || 0) + 1);
    });
  });
  assert.equal(appearances.size, 96);
  appearances.forEach((count) => assert.equal(count, 10));
  assert.equal(firstStage.flat().filter(hasUser).length, 10);
});

test('G4 de cada grupo produz 64 classificados e 32 confrontos na segunda fase', () => {
  let state = getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' });
  state = playGroup(state, 'win');
  assert.equal(state.serieDCompetition.phase, 'r64');
  assert.equal(Object.values(state.serieDCompetition.qualifiers).flat().length, 64);
  assert.equal(state.serieDCompetition.ties.r64.length, 32);
  assert.equal(state.fixtures[10].length, 32);
  assert.equal(state.fixtures[11].length, 32);
  assert.match(getSerieDPhaseLabel(state, 10), /2ª Fase/);
});

test('campanha vencedora percorre 64→32→16→quartas→semi→final e dá acesso/título', () => {
  let state = playGroup(getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' }), 'win');
  state = playTwoLegStage(state, 10, 'win');
  assert.equal(state.serieDCompetition.phase, 'r32');
  assert.equal(state.fixtures[12].length, 16);
  state = playTwoLegStage(state, 12, 'win');
  assert.equal(state.serieDCompetition.phase, 'r16');
  assert.equal(state.fixtures[14].length, 8);
  state = playTwoLegStage(state, 14, 'win');
  assert.equal(state.serieDCompetition.phase, 'qf');
  assert.equal(state.fixtures[16].length, 4);
  state = playTwoLegStage(state, 16, 'win');
  assert.equal(state.serieDCompetition.userPromoted, true);
  assert.equal(state.serieDCompetition.promotedCanonicalIds.length, 4);
  assert.equal(state.fixtures[18].length, 4, '2026 possui 2 semifinais + 2 playoffs de acesso');
  state = playTwoLegStage(state, 18, 'win');
  assert.equal(state.serieDCompetition.promotedCanonicalIds.length, 6);
  assert.equal(state.fixtures[20].length, 1);
  state = playTwoLegStage(state, 20, 'win');
  const outcome = getSerieDUserOutcome(state);
  assert.equal(outcome.promoted, true);
  assert.equal(outcome.champion, true);
  assert.equal(outcome.promotedCanonicalIds.length, 6);
  assert.equal(state.serieDCompetition.phase, 'finished');
});

test('perdedor das quartas em 2026 pode conquistar uma das duas vagas pelo playoff', () => {
  let state = playGroup(getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' }), 'win');
  state = playTwoLegStage(state, 10, 'win');
  state = playTwoLegStage(state, 12, 'win');
  state = playTwoLegStage(state, 14, 'win');
  state = playTwoLegStage(state, 16, 'loss');
  assert.equal(state.serieDCompetition.userPromoted, false);
  assert.equal(state.serieDCompetition.ties.access.some((tie) => tie.id.startsWith('po-') && (id(tie.home) === 'user' || id(tie.away) === 'user')), true);
  state = playTwoLegStage(state, 18, 'win');
  const outcome = getSerieDUserOutcome(state);
  assert.equal(outcome.promoted, true);
  assert.equal(outcome.champion, false);
  assert.equal(outcome.promotedCanonicalIds.length, 6);
  assert.equal(state.serieDCompetition.phase, 'finished');
});

test('eliminação na fase de grupos fecha CPU automaticamente e deixa slots futuros inativos', () => {
  let state = playGroup(getInitialGameState('br-brasiliense', 'Manager', 'D', { formation:'4-4-2' }), 'loss');
  const outcome = getSerieDUserOutcome(state);
  assert.equal(outcome.status, 'eliminated-groups');
  assert.equal(state.serieDCompetition.phase, 'finished');
  assert.equal(outcome.promotedCanonicalIds.length, 6);
  assert.ok(outcome.championCanonicalId);
  for (let idx = 10; idx < 22; idx += 1) assert.equal(isSerieDLeagueSlotInactive(state, idx), true);
});

test('simulação CPU de 2026 entrega seis acessos únicos', () => {
  const result = simulateCpuSerieDOutcome(getPyramidSeriesTeams2026('D'), 2026);
  assert.equal(result.promotedCanonicalIds.length, 6);
  assert.equal(new Set(result.promotedCanonicalIds).size, 6);
  assert.ok(result.championCanonicalId);
  assert.equal(result.promotedCanonicalIds.includes(result.championCanonicalId), true);
});

test('em 2027 a Série D ainda entrega seis acessos para expandir a Série C', () => {
  const pool = getPyramidSeriesTeams2026('D');
  const userBase = pool[0];
  let state = initializeSerieDCompetition({
    userTeam:{ ...userBase, id:'user', teamId:userBase.id, canonicalTeamId:userBase.id, isPlayer:true },
    userCanonicalId:userBase.id,
    cpuTeams:pool.slice(1),
    season:2027,
  });
  state = {
    season:2027, serie:'D', club:{ teamId:userBase.id, existingTeamId:userBase.id },
    teams:state.teams, table:state.table, fixtures:state.fixtures, serieDCompetition:state.competition,
  };
  state = playGroup(state, 'win');
  state = playTwoLegStage(state, 10, 'win');
  state = playTwoLegStage(state, 12, 'win');
  state = playTwoLegStage(state, 14, 'win');
  state = playTwoLegStage(state, 16, 'win');
  assert.equal(state.serieDCompetition.promotedCanonicalIds.length, 4);
  assert.equal(state.fixtures[18].length, 4, '2027 ainda possui semifinais e playoffs extras de acesso');
  assert.equal(state.serieDCompetition.ties.access.some((tie) => tie.id.startsWith('po-')), true);
  state = playTwoLegStage(state, 18, 'win');
  state = playTwoLegStage(state, 20, 'win');
  assert.equal(getSerieDUserOutcome(state).promotedCanonicalIds.length, 6);
});

test('em 2027 perder as quartas leva o clube ao playoff das duas vagas extras', () => {
  const pool = getPyramidSeriesTeams2026('D');
  const userBase = pool[0];
  const initial = initializeSerieDCompetition({ userTeam:{ ...userBase, id:'user', teamId:userBase.id, isPlayer:true }, userCanonicalId:userBase.id, cpuTeams:pool.slice(1), season:2027 });
  let state = { season:2027, serie:'D', club:{ teamId:userBase.id, existingTeamId:userBase.id }, ...initial, serieDCompetition:initial.competition };
  state = playGroup(state, 'win');
  state = playTwoLegStage(state, 10, 'win');
  state = playTwoLegStage(state, 12, 'win');
  state = playTwoLegStage(state, 14, 'win');
  state = playTwoLegStage(state, 16, 'loss');
  let outcome = getSerieDUserOutcome(state);
  assert.equal(outcome.promoted, false);
  assert.equal(outcome.status, 'active');
  assert.equal(state.serieDCompetition.phase, 'access');
  state = playTwoLegStage(state, 18, 'loss');
  outcome = getSerieDUserOutcome(state);
  assert.equal(outcome.promoted, false);
  assert.equal(outcome.status, 'eliminated-access');
  assert.equal(outcome.promotedCanonicalIds.length, 6);
});

test('a partir de 2028 perder as quartas elimina sem playoff extra e mantém quatro acessos', () => {
  const pool = getPyramidSeriesTeams2026('D');
  const userBase = pool[0];
  const initial = initializeSerieDCompetition({ userTeam:{ ...userBase, id:'user', teamId:userBase.id, isPlayer:true }, userCanonicalId:userBase.id, cpuTeams:pool.slice(1), season:2028 });
  let state = { season:2028, serie:'D', club:{ teamId:userBase.id, existingTeamId:userBase.id }, ...initial, serieDCompetition:initial.competition };
  state = playGroup(state, 'win');
  state = playTwoLegStage(state, 10, 'win');
  state = playTwoLegStage(state, 12, 'win');
  state = playTwoLegStage(state, 14, 'win');
  state = playTwoLegStage(state, 16, 'loss');
  const outcome = getSerieDUserOutcome(state);
  assert.equal(outcome.promoted, false);
  assert.equal(outcome.status, 'eliminated-qf');
  assert.equal(outcome.promotedCanonicalIds.length, 4);
  assert.equal(state.serieDCompetition.phase, 'finished');
});

console.log(`\nSérie D 2026 smoke: ${passed}/${passed} verificações aprovadas.`);

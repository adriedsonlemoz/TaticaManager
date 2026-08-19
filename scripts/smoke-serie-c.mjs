import assert from 'node:assert/strict';
import {
  SERIE_C_2027_FIRST_PHASE_ROUNDS,
  SERIE_C_2027_TOTAL_ROUNDS,
  advanceSerieCCompetitionAfterRound,
  getSerieCUserOutcome,
  initializeSerieCCompetition,
  isSerieCLeagueSlotInactive,
  simulateCpuSerieCOutcome,
} from '../src/engines/serieC/serieCCompetition.js';

let passed = 0;
const test = (name, fn) => { try { fn(); passed += 1; console.log(`✅ ${name}`); } catch (e) { console.error(`❌ ${name}`); throw e; } };
const cpu = Array.from({ length:23 }, (_, i) => ({ id:`c${i+1}`, name:`Clube ${i+1}`, strength:55 + (i % 12), isPlayer:false }));
const user = { id:'user', teamId:'br-user', name:'Clube Usuário', strength:70, isPlayer:true };

function initialized() {
  const init = initializeSerieCCompetition({ userTeam:user, userCanonicalId:'br-user', cpuTeams:cpu, season:2027 });
  return { season:2027, serie:'C', club:{ teamId:'br-user', existingTeamId:'br-user' }, ...init, serieCCompetition:init.competition };
}

function playRoundForUser(state, index, userWins = true) {
  const fixtures = state.fixtures.map((round) => [...(round || [])]);
  fixtures[index] = (fixtures[index] || []).map((match, m) => {
    const hasUser = match.home?.id === 'user' || match.away?.id === 'user';
    if (!hasUser) return { ...match, played:true, result:m % 3 === 0 ? '1 - 0' : '0 - 0' };
    const userHome = match.home?.id === 'user';
    const result = userWins ? (userHome ? '4 - 0' : '0 - 4') : (userHome ? '0 - 4' : '4 - 0');
    return { ...match, played:true, result };
  });
  return advanceSerieCCompetitionAfterRound({ ...state, fixtures }, index);
}

test('Série C 2027 inicia com 24 clubes e 23 rodadas de grupo único', () => {
  const state = initialized();
  assert.equal(state.teams.length, 24);
  assert.equal(state.fixtures.length, SERIE_C_2027_TOTAL_ROUNDS);
  assert.equal(state.fixtures.slice(0, SERIE_C_2027_FIRST_PHASE_ROUNDS).every((r) => r.length === 12), true);
  assert.equal(state.serieCCompetition.phase, 'first');
});

test('primeira fase é turno único: cada par se enfrenta no máximo uma vez', () => {
  const state = initialized();
  const pairs = new Set();
  state.fixtures.slice(0,23).flat().forEach((match) => {
    const pair = [String(match.home.id), String(match.away.id)].sort().join('|');
    assert.equal(pairs.has(pair), false, pair);
    pairs.add(pair);
  });
  assert.equal(pairs.size, 276);
});

test('G8 avança para dois quadrangulares de quatro clubes', () => {
  let state = initialized();
  for (let i = 0; i < 23; i += 1) state = playRoundForUser(state, i, true);
  assert.equal(state.serieCCompetition.qualifiers.length, 8);
  assert.equal(state.serieCCompetition.groups.B.length, 4);
  assert.equal(state.serieCCompetition.groups.C.length, 4);
  assert.ok(['B','C'].includes(state.serieCCompetition.userGroup));
  assert.equal(state.table.length, 4);
  assert.equal(state.fixtures.slice(23,29).every((r) => r.length === 4), true);
});

test('G2 de cada quadrangular produz exatamente quatro acessos', () => {
  let state = initialized();
  for (let i = 0; i < 23; i += 1) state = playRoundForUser(state, i, true);
  for (let i = 23; i <= 28; i += 1) state = playRoundForUser(state, i, true);
  assert.equal(state.serieCCompetition.promotedCanonicalIds.length, 4);
  assert.equal(new Set(state.serieCCompetition.promotedCanonicalIds).size, 4);
  assert.equal(getSerieCUserOutcome(state).promoted, true);
});

test('líderes dos quadrangulares disputam final em ida e volta', () => {
  let state = initialized();
  for (let i = 0; i < 23; i += 1) state = playRoundForUser(state, i, true);
  for (let i = 23; i <= 28; i += 1) state = playRoundForUser(state, i, true);
  assert.equal(state.serieCCompetition.phase, 'final');
  assert.equal(state.fixtures[29].length, 1);
  assert.equal(state.fixtures[30].length, 1);
});

test('usuário campeão encerra competição sem perder o acesso', () => {
  let state = initialized();
  for (let i = 0; i < 23; i += 1) state = playRoundForUser(state, i, true);
  for (let i = 23; i <= 30; i += 1) state = playRoundForUser(state, i, true);
  const outcome = getSerieCUserOutcome(state);
  assert.equal(outcome.promoted, true);
  assert.equal(outcome.champion, true);
  assert.equal(state.serieCCompetition.phase, 'finished');
});

test('dois últimos da primeira fase são rebaixados', () => {
  let state = initialized();
  for (let i = 0; i < 23; i += 1) state = playRoundForUser(state, i, false);
  const outcome = getSerieCUserOutcome(state);
  assert.equal(state.serieCCompetition.relegatedCanonicalIds.length, 2);
  assert.equal(outcome.relegated, true);
  assert.equal(outcome.promoted, false);
});

test('eliminado não recebe partidas fantasma nas fases seguintes', () => {
  let state = initialized();
  for (let i = 0; i < 23; i += 1) state = playRoundForUser(state, i, false);
  assert.equal(isSerieCLeagueSlotInactive(state, 23), true);
  assert.equal(state.serieCCompetition.promotedCanonicalIds.length, 4);
  assert.ok(state.serieCCompetition.championCanonicalId);
});

test('simulação CPU da Série C 2027 consolida quatro acessos e dois rebaixamentos', () => {
  const teams = [{ ...user, id:'cpu-user', teamId:null, canonicalTeamId:null, isPlayer:false }, ...cpu];
  const out = simulateCpuSerieCOutcome(teams, 2027);
  assert.equal(out.promotedCanonicalIds.length, 4);
  assert.equal(out.relegatedCanonicalIds.length, 2);
  assert.equal(new Set(out.promotedCanonicalIds).size, 4);
  assert.ok(out.championCanonicalId);
});

test('motor dedicado não é ativado fora de 2027', () => {
  assert.equal(initializeSerieCCompetition({ userTeam:user, userCanonicalId:'br-user', cpuTeams:cpu, season:2028 }), null);
});

console.log(`\nSérie C 2027: ${passed}/${passed} verificações aprovadas.`);

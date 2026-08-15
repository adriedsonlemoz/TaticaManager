import assert from 'node:assert/strict';
import {
  buildScorers,
  buildStandingsRows,
  buildTableViewModel,
  getLeagueLegend,
  getLeagueZone,
  getScorerPurchaseStatus,
  getSeasonMovement,
  getSeasonProgress,
  normalizeScorerForTransfer,
} from '../src/engines/table/tableViewModel.js';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('Série A mantém G4, pré-G6, Sul-Americana e Z4', () => {
  assert.equal(getLeagueZone(0, 'A').type, 'libertadores');
  assert.equal(getLeagueZone(4, 'A').type, 'pre-libertadores');
  assert.equal(getLeagueZone(6, 'A').type, 'sul-americana');
  assert.equal(getLeagueZone(15, 'A').type, 'neutral');
  assert.equal(getLeagueZone(16, 'A').type, 'relegation');
});

test('Séries B/C/D preservam acesso e queda/corte', () => {
  assert.equal(getLeagueZone(0, 'B').label, 'Acesso Série A');
  assert.equal(getLeagueZone(16, 'B').label, 'Rebaixamento C');
  assert.equal(getLeagueZone(0, 'C').label, 'Acesso Série B');
  assert.equal(getLeagueZone(16, 'C').label, 'Rebaixamento D');
  assert.equal(getLeagueZone(16, 'D').label, 'Zona de Corte');
});

test('Movimento só aparece quando a temporada termina', () => {
  assert.equal(getSeasonMovement(0, 'B', false), null);
  assert.equal(getSeasonMovement(0, 'B', true).label, 'Acesso → Série A');
  assert.equal(getSeasonMovement(16, 'D', true).label, 'Eliminado');
});

test('Progresso usa o tamanho real do calendário e fallback de 38 rodadas', () => {
  assert.deepEqual(getSeasonProgress({ round: 2, fixtures: [1, 2, 3] }), { currentRound: 2, totalRounds: 3, isSeasonEnd: false });
  assert.deepEqual(getSeasonProgress({ round: 38, fixtures: [] }), { currentRound: 38, totalRounds: 38, isSeasonEnd: true });
});

test('Linhas calculam saldo de gols e técnico sem depender de window', () => {
  const rows = buildStandingsRows({
    serie: 'A',
    club: { manager: 'Mister Teste' },
    table: [
      { id: 'user', name: 'Meu Clube', gf: 10, ga: 4, p: 3, w: 3, d: 0, l: 0, pts: 9 },
      { id: 'cpu', name: 'Flamengo', gf: 3, ga: 5, p: 3, w: 1, d: 0, l: 2, pts: 3 },
    ],
  });
  assert.equal(rows[0].goalDifference, 6);
  assert.equal(rows[0].coach, 'Mister Teste');
  assert.equal(rows[1].goalDifference, -2);
  assert.ok(rows[1].coach);
});

test('Artilheiros descartam formato numérico legado, ordenam e limitam', () => {
  const scorers = buildScorers({
    legacy: 8,
    a: { id: 'a', name: 'A', team: 'X', goals: 2 },
    b: { id: 'b', name: 'B', team: 'Y', goals: 5 },
  });
  assert.equal(scorers.length, 2);
  assert.equal(scorers[0].name, 'B');
  assert.equal(scorers[0].rank, 1);
  assert.equal(scorers[1].maxGoals, 5);
});

test('Status de compra respeita caixa e orçamento de transferências', () => {
  const scorer = { id: '9', name: 'Centroavante', value: 1_000_000 };
  assert.equal(getScorerPurchaseStatus({ club: { money: 500_000, transferBudget: 2_000_000 }, players: [] }, scorer).reason, 'cash');
  assert.equal(getScorerPurchaseStatus({ club: { money: 2_000_000, transferBudget: 500_000 }, players: [] }, scorer).reason, 'budget');
  assert.equal(getScorerPurchaseStatus({ club: { money: 2_000_000, transferBudget: 2_000_000 }, players: [] }, scorer).canBuy, true);
});

test('Jogador já pertencente ao clube não pode ser recomprado', () => {
  const scorer = { id: '9', name: 'Centroavante', value: 1_000_000 };
  const status = getScorerPurchaseStatus({ club: { money: 9_000_000 }, players: [{ id: '9', name: 'Centroavante' }] }, scorer);
  assert.equal(status.reason, 'already');
});

test('Normalização de artilheiro preserva clube vendedor em teamName', () => {
  const normalized = normalizeScorerForTransfer({ id: 'x', name: 'Atacante', team: 'Clube CPU', teamId: 'cpu-x', goals: 12 });
  assert.equal(normalized.teamName, 'Clube CPU');
  assert.equal(normalized.teamId, 'cpu-x');
  assert.equal(normalized.goals, 0);
  assert.equal(normalized.energy, 100);
});

test('View-model reúne classificação, legenda e artilharia', () => {
  const vm = buildTableViewModel({
    serie: 'A', round: 1, fixtures: [[], []], club: { manager: 'Você' },
    table: [{ id: 'user', name: 'Meu Clube', gf: 1, ga: 0, pts: 3 }],
    scorers: { x: { id: 'x', name: 'Atacante', team: 'Meu Clube', goals: 1, isUserTeam: true } },
  });
  assert.equal(vm.serie, 'A');
  assert.equal(vm.standings.length, 1);
  assert.equal(vm.legend.length, getLeagueLegend('A').length);
  assert.equal(vm.scorers[0].name, 'Atacante');
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
console.log(`\n${passed}/${tests.length} smoke tests de classificação aprovados.`);

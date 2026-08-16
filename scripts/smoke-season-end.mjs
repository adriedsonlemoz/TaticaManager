import assert from 'node:assert/strict';
import { evaluateSeasonObjective } from '../src/engines/season/seasonObjective.js';
import {
  buildCareerSeasonEntry,
  buildSeasonSnapshot,
  getFinalTable,
  getNextSerie,
  getSeasonMovement,
  isSeasonScheduleComplete,
} from '../src/engines/season/seasonOutcome.js';
import { buildSeasonEndViewModel } from '../src/engines/season/seasonEndViewModel.js';
import { advanceUserRoster } from '../src/engines/season/seasonRoster.js';
import { buildDifficultyProgression, buildNextSeasonClub, nextSeasonMoney } from '../src/engines/season/seasonClub.js';
import { generateNextSeason } from '../src/engines/core/seasonEngine.js';
import { prepareSeasonTransition } from '../src/engines/season/seasonTransitionService.js';

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

const tableRow = (id, name, pos = {}) => ({
  id, name, pts: 60, p: 38, w: 18, d: 6, l: 14, gf: 50, ga: 40, ...pos,
});

const players = Array.from({ length: 18 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Jogador ${index + 1}`,
  position: index === 0 ? 'CA' : index === 1 ? 'MEI' : 'ZAG',
  age: 24,
  overall: 70 + (index % 5),
  value: 1_000_000 + index * 10_000,
  wage: 10_000 + index * 500,
  seasonGoals: index === 0 ? 12 : index === 2 ? 4 : 0,
  goals: index === 0 ? 99 : index === 2 ? 200 : 0,
  assists: index === 1 ? 9 : 0,
  contract: 2,
  isStarting: index < 11,
  energy: 80,
  discipline: { yellowCards: 2, suspendedUntilRound: 39, disciplineHistory: [{ type: 'yellow' }] },
}));

const baseState = ({ serie = 'A', objective = 'survive', user = {}, round = 38, leagueRound = 38, calendar = null } = {}) => ({
  season: 2026,
  serie,
  round,
  leagueRound,
  seasonObjective: objective,
  table: [
    tableRow('user', 'Meu Clube', user),
    tableRow('cpu1', 'Rival', { pts: 55, w: 16, d: 7, l: 15, gf: 45, ga: 42 }),
  ],
  fixtures: Array.from({ length: 38 }, () => []),
  calendar,
  players: players.map((player) => ({ ...player, discipline: { ...player.discipline, disciplineHistory: [...player.discipline.disciplineHistory] } })),
  scorers: {},
  financialHistory: [
    { round: 38, income: 1_000_000, expense: 200_000, total: 800_000, detail: { description: 'Rodada final' } },
    { round: 37, income: 100_000, expense: 300_000, total: -200_000, detail: { description: 'Rodada 37' } },
  ],
  club: {
    name: 'Meu Clube', money: 10_000_000, transferBudget: 1_000_000, wage: 0,
    fanLoyalty: 50, strength: 75, existingTeamId: null, managerProfile: {},
  },
  academy: [], academyReady: [], academies: {},
  cups: null,
});

// Objetivos oferecidos no Setup.
test('objetivo campeão passa apenas em 1º', () => assert.equal(evaluateSeasonObjective({ objective: 'champion', serie: 'A', position: 1 }).success, true));
test('objetivo campeão falha em 2º', () => assert.equal(evaluateSeasonObjective({ objective: 'champion', serie: 'A', position: 2 }).success, false));
test('objetivo acesso passa no G4', () => assert.equal(evaluateSeasonObjective({ objective: 'promotion', serie: 'B', position: 4 }).success, true));
test('objetivo acesso falha fora do G4', () => assert.equal(evaluateSeasonObjective({ objective: 'promotion', serie: 'C', position: 5 }).success, false));
test('objetivo Libertadores passa no G6', () => assert.equal(evaluateSeasonObjective({ objective: 'libertadores', serie: 'A', position: 6 }).success, true));
test('objetivo Libertadores falha em 7º', () => assert.equal(evaluateSeasonObjective({ objective: 'libertadores', serie: 'A', position: 7 }).success, false));
test('objetivo Sul-Americana aceita resultado superior no Top 12', () => assert.equal(evaluateSeasonObjective({ objective: 'sulamericana', serie: 'A', position: 5 }).success, true));
test('objetivo Sul-Americana falha em 13º', () => assert.equal(evaluateSeasonObjective({ objective: 'sulamericana', serie: 'A', position: 13 }).success, false));
test('objetivo meio de tabela aceita posição melhor que a meta', () => assert.equal(evaluateSeasonObjective({ objective: 'midtable', serie: 'B', position: 4 }).success, true));
test('objetivo meio de tabela falha abaixo de 14º', () => assert.equal(evaluateSeasonObjective({ objective: 'midtable', serie: 'B', position: 15 }).success, false));
test('objetivo sobreviver passa em 16º', () => assert.equal(evaluateSeasonObjective({ objective: 'survive', serie: 'A', position: 16 }).success, true));
test('objetivo sobreviver falha no Z4', () => assert.equal(evaluateSeasonObjective({ objective: 'survive', serie: 'A', position: 17 }).success, false));
test('objetivo incompatível de acesso na Série A não demite', () => assert.equal(evaluateSeasonObjective({ objective: 'promotion', serie: 'A', position: 20 }).applicable, false));

// Calendário completo precisa terminar, não apenas a Liga.
test('fim da Liga não encerra temporada se ainda há Copa no calendário', () => assert.equal(isSeasonScheduleComplete(baseState({ calendar: Array.from({ length: 40 }, () => ({})), round: 38 })), false));
test('fim do calendário completo encerra a temporada', () => assert.equal(isSeasonScheduleComplete(baseState({ calendar: Array.from({ length: 40 }, () => ({})), round: 40 })), true));
test('save legado sem calendário usa leagueRound', () => assert.equal(isSeasonScheduleComplete(baseState({ calendar: null, round: 38, leagueRound: 38 })), true));
test('save legado sem calendário não encerra antes da última rodada', () => assert.equal(isSeasonScheduleComplete(baseState({ calendar: null, round: 37, leagueRound: 37 })), false));

// Promoção e rebaixamento.
test('Série B G4 promove para A', () => assert.equal(getNextSerie('B', 4), 'A'));
test('Série A Z4 rebaixa para B', () => assert.equal(getNextSerie('A', 17), 'B'));
test('Série D G4 promove para C', () => assert.equal(getNextSerie('D', 1), 'C'));
test('Série D Z4 permanece na D', () => assert.equal(getNextSerie('D', 20), 'D'));
test('movimento detecta promoção e rebaixamento', () => {
  assert.deepEqual(getSeasonMovement('B', 'A'), { promoted: true, relegated: false });
  assert.deepEqual(getSeasonMovement('A', 'B'), { promoted: false, relegated: true });
});

// Desempate final usa fixtures.
test('tabela final usa confronto direto quando pontos e vitórias empatam', () => {
  const state = baseState();
  state.table = [
    tableRow('cpu1', 'Rival', { pts: 70, w: 20, d: 10, l: 8, gf: 50, ga: 30 }),
    tableRow('user', 'Meu Clube', { pts: 70, w: 20, d: 10, l: 8, gf: 50, ga: 30 }),
  ];
  state.fixtures = [[{ home: { id: 'user' }, away: { id: 'cpu1' }, played: true, result: '1-0' }]];
  assert.equal(getFinalTable(state)[0].id, 'user');
});

// Snapshot pré-reset.
test('snapshot usa seasonGoals e não gols acumulados legados', () => assert.equal(buildSeasonSnapshot(baseState()).squad.topScorer.name, 'Jogador 1'));
test('snapshot preserva garçom antes de zerar assistências', () => assert.equal(buildSeasonSnapshot(baseState()).squad.topAssist.assists, 9));
test('snapshot preserva top 8 jogadores', () => assert.equal(buildSeasonSnapshot(baseState()).squad.topPlayers.length, 8));
test('snapshot preserva classificação final', () => assert.equal(buildSeasonSnapshot(baseState()).finalTable.length, 2));
test('snapshot soma receitas registradas', () => assert.equal(buildSeasonSnapshot(baseState()).finances.income, 1_100_000));
test('snapshot soma despesas registradas', () => assert.equal(buildSeasonSnapshot(baseState()).finances.expense, 500_000));
test('snapshot guarda avaliação do objetivo', () => assert.equal(buildSeasonSnapshot(baseState({ objective: 'libertadores', user: { pts: 40 } })).objective.objective, 'libertadores'));
test('histórico de carreira usa snapshot encerrado', () => {
  const snapshot = buildSeasonSnapshot(baseState());
  const entry = buildCareerSeasonEntry(baseState(), snapshot);
  assert.equal(entry.topScorer, 'Jogador 1');
  assert.equal(entry.wins, 18);
});

// Virada anual de elenco e clube.
test('elenco envelhece e reduz contrato', () => {
  const nextPlayers = advanceUserRoster(baseState(), 'A', 'Meu Clube', () => 1);
  assert.equal(nextPlayers[0].age, 25);
  assert.equal(nextPlayers[0].contract, 1);
});
test('elenco zera gols sazonais e assistências', () => {
  const nextPlayers = advanceUserRoster(baseState(), 'A', 'Meu Clube', () => 1);
  assert.equal(nextPlayers[0].seasonGoals, 0);
  assert.equal(nextPlayers[1].assists, 0);
});
test('virada preserva histórico disciplinar e zera suspensão/cartões', () => {
  const nextPlayers = advanceUserRoster(baseState(), 'A', 'Meu Clube', () => 1);
  assert.equal(nextPlayers[0].discipline.disciplineHistory.length, 1);
  assert.equal(nextPlayers[0].discipline.yellowCards, 0);
  assert.equal(nextPlayers[0].discipline.suspendedUntilRound, null);
});
test('rebaixamento aplica perda financeira', () => assert.equal(nextSeasonMoney({ currentMoney: 10_000_000, relegated: true }), 5_000_000));
test('promoção aplica bônus financeiro', () => assert.equal(nextSeasonMoney({ currentMoney: 10_000_000, promoted: true }), 13_500_000));
test('dificuldade sobe dois níveis no acesso', () => assert.equal(buildDifficultyProgression({ club: { difficultyLevel: 2 } }, { promoted: true }).level, 4));
test('novo clube recalcula folha salarial', () => {
  const state = baseState();
  const club = buildNextSeasonClub({ prevState: state, existingTeamId: null, players: state.players, difficultyLevel: 2, newSerie: 'A' });
  assert.equal(club.wage, state.players.reduce((sum, player) => sum + player.wage, 0));
});
test('novo orçamento anual usa 80% do caixa', () => {
  const state = baseState();
  const club = buildNextSeasonClub({ prevState: state, existingTeamId: null, players: state.players, difficultyLevel: 2, newSerie: 'A' });
  assert.equal(club.transferBudget, 8_000_000);
});

// Integração do motor de temporada.
test('generateNextSeason incrementa temporada e reinicia rodadas', () => {
  const next = generateNextSeason(baseState({ serie: 'B', user: { pts: 80, w: 24, d: 8, l: 6, gf: 60, ga: 30 } }));
  assert.equal(next.season, 2027);
  assert.equal(next.round, 0);
  assert.equal(next.leagueRound, 0);
});
test('generateNextSeason preserva snapshot do garçom', () => {
  const next = generateNextSeason(baseState({ serie: 'B', user: { pts: 80, w: 24 } }));
  assert.equal(next.seasonResult.squad.topAssist.assists, 9);
  assert.equal(next.players.find((player) => player.id === 'p2')?.assists, 0);
});
test('generateNextSeason sincroniza club.wage com jogadores', () => {
  const next = generateNextSeason(baseState());
  assert.equal(next.club.wage, next.players.reduce((sum, player) => sum + (player.wage || 0), 0));
});
test('generateNextSeason renova orçamento de transferências', () => {
  const next = generateNextSeason(baseState());
  assert.equal(next.club.transferBudget, Math.round(next.club.money * 0.8 / 1000) * 1000);
});
test('view-model usa snapshot antigo mesmo após reset dos jogadores', () => {
  const next = generateNextSeason(baseState());
  const vm = buildSeasonEndViewModel(next);
  assert.equal(vm.squad.topAssist.assists, 9);
  assert.equal(vm.result.finalTable.length, 2);
});


test('título da Liga incrementa troféus do treinador', () => {
  const state = baseState({ user: { pts: 90, w: 28, d: 6, l: 4, gf: 80, ga: 25 } });
  state.club.managerProfile.trophies = 2;
  state.table = [tableRow('user', 'Meu Clube', { pts: 90, w: 28, d: 6, l: 4, gf: 80, ga: 25 }), tableRow('cpu1', 'Rival', { pts: 60 })];
  const next = generateNextSeason(state);
  assert.equal(next.club.managerProfile.trophies, 3);
});
test('taça de Copa também incrementa troféus do treinador', () => {
  const state = baseState();
  state.club.managerProfile.trophies = 1;
  state.cups = { copaBrasil: { status: 'champion' } };
  const next = generateNextSeason(state);
  assert.equal(next.club.managerProfile.trophies, 3);
});

// Serviço de transição centraliza demissão e histórico.
test('transição reprova objetivo Libertadores fora do G6', () => {
  const state = baseState({ objective: 'libertadores', user: { pts: 40, w: 10, d: 10, l: 18, gf: 30, ga: 50 } });
  state.table = [
    ...Array.from({ length: 6 }, (_, index) => tableRow(`cpu${index + 1}`, `Rival ${index + 1}`, { pts: 80 - index, w: 25 - index })),
    tableRow('user', 'Meu Clube', { pts: 40, w: 10, d: 10, l: 18, gf: 30, ga: 50 }),
  ];
  const result = prepareSeasonTransition(state);
  assert.equal(result.status, 'fired');
  assert.match(result.reason, /LIBERTADORES/);
});
test('transição aprovada adiciona uma entrada ao histórico', () => {
  const state = baseState({ objective: 'survive', user: { pts: 70, w: 20 } });
  state.careerHistory = [{ season: 2025 }];
  const result = prepareSeasonTransition(state);
  assert.equal(result.status, 'advanced');
  assert.equal(result.nextState.careerHistory.length, 2);
});

console.log(`\nSeason end smoke: ${passed}/${passed} verificações aprovadas.`);

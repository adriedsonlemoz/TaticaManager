import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FinanceEngine } from '../src/engines/engine_finances.js';
import {
  applySponsorContract,
  buildEvolutionEntries,
  buildFinanceOverview,
  canSignSponsor,
  generateSponsorOffers,
  getSeasonFinancialHistory,
  summarizeFinancialHistory,
  tagLegacyFinancialHistory,
} from '../src/engines/finances/financeViewModel.js';
import { appendFinancialEntry } from '../src/engines/finances/financeLedger.js';
import { calculateMatchFinances, getTVRights, resolveHomeStadium } from '../src/engines/finances/financeMatch.js';
import { getCurrentWage, getFinancialStatus, getOperationalCosts } from '../src/engines/finances/financeRisk.js';
import { calculateLeagueRoundFinances } from '../src/engines/match/matchRoundState.js';
import { buildSeasonSnapshot } from '../src/engines/season/seasonOutcome.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';

let checks = 0;
const test = (name, fn) => {
  fn();
  checks += 1;
  console.log(`✅ ${name}`);
};

const player = (id, wage = 10_000) => ({ id, name:id, wage, overall:70, position:'MC', isStarting:true });
const fixtures = Array.from({ length:38 }, () => []);
const baseGame = (overrides = {}) => ({
  season:2026,
  serie:'A',
  round:12,
  leagueRound:3,
  morale:60,
  club:{
    name:'Teste FC', money:5_000_000, transferBudget:4_000_000, wage:999_999, strength:76, fanLoyalty:60,
    stadium:{ name:'Arena Teste', capacity:5_000, ticketPrice:50, level:1 },
    sponsors:{ master:null, stadium:null },
  },
  players:[player('p1', 100_000), player('p2', 50_000)],
  fixtures,
  table:[{ id:'user', name:'Teste FC', pts:10 }],
  financialHistory:[],
  ...overrides,
});

// TV / custos / folha
test('TV limita rodada abaixo de 1', () => assert.equal(getTVRights('A', 0, 38), getTVRights('A', 1, 38)));
test('TV limita rodada acima do calendário', () => assert.equal(getTVRights('A', 99, 38), getTVRights('A', 38, 38)));
test('folha usa jogadores como fonte de verdade', () => assert.equal(getCurrentWage(baseGame()), 150_000));
test('folha usa club.wage apenas sem jogadores', () => assert.equal(getCurrentWage(baseGame({ players:[], club:{ ...baseGame().club, wage:123_000 } })), 123_000));
test('custo operacional cresce com nível do estádio', () => assert.equal(getOperationalCosts(baseGame({ club:{ ...baseGame().club, stadium:{ level:3 } } })), 860_000));

test('risco considera receitas fixas antes de calcular runway', () => {
  const status = getFinancialStatus(baseGame({ club:{ ...baseGame().club, money:10_000 } }));
  assert.equal(status.runway, 999);
  assert.equal(status.status, 'saudavel');
});
test('caixa negativo continua crítico mesmo com receita recorrente', () => assert.equal(getFinancialStatus(baseGame({ club:{ ...baseGame().club, money:-1 } })).status, 'critico'));
test('déficit recorrente usa burn rate líquido', () => {
  const game = baseGame({ club:{ ...baseGame().club, money:2_000_000 }, players:[player('caro', 1_000_000)] });
  const status = getFinancialStatus(game);
  assert.ok(status.burnRate > 0);
  assert.ok(status.runway < 4);
});

// Estádios e bilheteria
test('mandante usuário usa estádio do próprio save', () => assert.equal(resolveHomeStadium({ id:'user', name:'Teste FC' }, baseGame()).capacity, 5_000));
test('mandante CPU usa capacidade real do banco puro de estádios', () => assert.equal(resolveHomeStadium({ id:'a1', name:'Flamengo' }, baseGame()).capacity, 78_838));
test('bilheteria em casa nunca excede capacidade do usuário', () => {
  const result = calculateMatchFinances({ id:'user', isPlayer:true, name:'Teste FC' }, { id:'a1', name:'Flamengo', strength:87 }, baseGame({ leagueRound:4 }), { includeWeather:false });
  assert.ok(result.attendance <= 5_000);
  assert.equal(result.stadiumCapacity, 5_000);
  assert.equal(result.userIsHome, true);
});
test('jogo fora não usa a capacidade pequena do estádio do usuário', () => {
  const result = calculateMatchFinances({ id:'a1', name:'Flamengo', strength:87, fanBase:1 }, { id:'user', isPlayer:true, name:'Teste FC' }, baseGame({ leagueRound:4 }), { includeWeather:false });
  assert.ok(result.attendance > 5_000);
  assert.equal(result.stadiumCapacity, 78_838);
  assert.equal(result.userIsAway, true);
});
test('visitante recebe exatamente 10% da renda bruta', () => {
  const result = calculateMatchFinances({ id:'a1', name:'Flamengo', strength:87, fanBase:1 }, { id:'user', isPlayer:true, name:'Teste FC' }, baseGame({ leagueRound:4 }), { includeWeather:false });
  assert.equal(result.ticketRevenue, Math.round(result.grossTicketRevenue * 0.10));
});
test('chuva reduz público de forma determinística', () => {
  const dry = calculateMatchFinances({ id:'user', isPlayer:true }, { id:'cpu', strength:75 }, baseGame(), { includeWeather:false });
  const rain = calculateMatchFinances({ id:'user', isPlayer:true }, { id:'cpu', strength:75 }, baseGame(), { includeWeather:true, rng:() => 0 });
  assert.ok(rain.attendance < dry.attendance);
});

// Projeção
test('projeção usa leagueRound e não índice geral do calendário', () => {
  const game = baseGame({ round:20, leagueRound:3 });
  game.fixtures[3] = [{ home:{ id:'user', isPlayer:true, name:'Teste FC' }, away:{ id:'a1', name:'Flamengo', strength:87 } }];
  const overview = buildFinanceOverview(game);
  assert.equal(overview.nextLeagueRound, 4);
  assert.equal(overview.tvIncome, getTVRights('A', 4, 38));
  assert.equal(overview.operationalChargeNext, true);
});
test('projeção de jogo fora identifica cota de visitante', () => {
  const game = baseGame();
  game.fixtures[3] = [{ home:{ id:'a1', name:'Flamengo', strength:87, fanBase:1 }, away:{ id:'user', isPlayer:true, name:'Teste FC' } }];
  const overview = buildFinanceOverview(game);
  assert.equal(overview.projectedMatch.userIsAway, true);
  assert.equal(overview.ticketIncome, overview.projectedMatch.ticketRevenue);
});
test('projeção usa folha real mesmo quando club.wage está stale', () => assert.equal(buildFinanceOverview(baseGame()).totalWage, 150_000));

// Ledger por temporada
test('append carimba season, rodada da Liga e competição', () => {
  const [entry] = appendFinancialEntry([], { income:100, expense:0, total:100 }, { season:2026, round:8, leagueRound:5, competition:'league' });
  assert.deepEqual({ season:entry.season, round:entry.round, leagueRound:entry.leagueRound, competition:entry.competition }, { season:2026, round:8, leagueRound:5, competition:'league' });
});
test('histórico misto mantém legado como temporada corrente durante migração', () => {
  const history = [{ income:1 }, { season:2026, income:2 }, { season:2025, income:3 }];
  assert.equal(getSeasonFinancialHistory(history, 2026).length, 2);
});
test('tag de legado fecha lançamentos sem season na temporada anterior', () => {
  const tagged = tagLegacyFinancialHistory([{ income:1 }, { season:2025, income:2 }], 2026);
  assert.equal(tagged[0].season, 2026);
  assert.equal(tagged[1].season, 2025);
});
test('painel ignora lançamentos explicitamente de outra temporada', () => {
  const game = baseGame({ financialHistory:[
    { season:2025, income:9_000_000, expense:0, total:9_000_000 },
    { season:2026, income:100_000, expense:0, total:100_000 },
  ] });
  const overview = buildFinanceOverview(game);
  assert.equal(overview.history.length, 1);
  assert.equal(overview.summary.income, 100_000);
});
test('snapshot anual soma somente a temporada encerrada', () => {
  const game = baseGame({
    table:[{ id:'user', name:'Teste FC', pts:60, w:18, d:6, l:14, gf:50, ga:40 }],
    financialHistory:[
      { season:2025, income:5_000_000, expense:0, total:5_000_000 },
      { season:2026, income:700_000, expense:200_000, total:500_000 },
    ],
  });
  const snapshot = buildSeasonSnapshot(game, game.table, 'A');
  assert.equal(snapshot.finances.income, 700_000);
  assert.equal(snapshot.finances.expense, 200_000);
});

// Categorias do extrato
test('luvas comerciais não são confundidas com patrocínio por rodada', () => {
  const summary = summarizeFinancialHistory([{ income:1_000_000, expense:0, total:1_000_000, detail:{ description:'Luvas: Patrocínio Máster (X)', sponsorSigning:1_000_000 } }]);
  assert.equal(summary.sponsorSigning, 1_000_000);
  assert.equal(summary.sponsorRecurring, 0);
  assert.equal(summary.otherIncome, 0);
});
test('formato legado de luvas também é separado', () => {
  const summary = summarizeFinancialHistory([{ income:500_000, expense:0, detail:{ description:'Luvas: Patrocínio Máster (X)', sponsor:500_000 } }]);
  assert.equal(summary.sponsorSigning, 500_000);
  assert.equal(summary.sponsorRecurring, 0);
  assert.equal(summary.otherIncome, 0);
});
test('patrocínio recorrente continua na categoria recorrente', () => {
  const summary = summarizeFinancialHistory([{ income:100_000, expense:0, detail:{ sponsor:100_000 } }]);
  assert.equal(summary.sponsorRecurring, 100_000);
  assert.equal(summary.sponsorSigning, 0);
});
test('despesas de Academy, DM e contrato são visíveis no resumo', () => {
  const summary = summarizeFinancialHistory([
    { income:0, expense:300, detail:{ description:'Investimento: Academia (Elite)' } },
    { income:0, expense:200, detail:{ description:'Tratamento médico: A' } },
    { income:0, expense:100, detail:{ description:'Renovação: B' } },
  ]);
  assert.equal(summary.academy, 300);
  assert.equal(summary.medical, 200);
  assert.equal(summary.contracts, 100);
  assert.equal(summary.expense, 600);
});
test('evolução usa leagueRound quando disponível', () => {
  const { chart } = buildEvolutionEntries([{ round:20, leagueRound:4, income:1, expense:0 }]);
  assert.equal(chart[0].round, 4);
});

// Patrocínio
test('ofertas de patrocinador são reproduzíveis com RNG injetado', () => {
  const a = generateSponsorOffers(baseGame(), () => 0.4);
  const b = generateSponsorOffers(baseGame(), () => 0.4);
  assert.deepEqual(a, b);
  assert.equal(a.master.length, 3);
  assert.equal(a.stadium.length, 3);
});
test('não permite assinar por cima de patrocinador ativo', () => {
  const game = baseGame({ club:{ ...baseGame().club, sponsors:{ master:{ name:'Atual' }, stadium:null } } });
  const offer = { name:'Novo', val:100, roundVal:10 };
  assert.equal(canSignSponsor(game, 'master', offer).ok, false);
  assert.equal(applySponsorContract(game, 'master', offer), game);
});
test('contrato rejeita valores negativos', () => assert.equal(canSignSponsor(baseGame(), 'master', { name:'X', val:-1, roundVal:10 }).ok, false));
test('contrato válido credita luvas e carimba temporada', () => {
  const game = baseGame();
  const next = applySponsorContract(game, 'master', { name:'X', val:1_000, roundVal:100, color:'#000' });
  assert.equal(next.club.money, game.club.money + 1_000);
  assert.equal(next.club.sponsors.master.signedSeason, 2026);
  assert.equal(next.financialHistory[0].season, 2026);
  assert.equal(next.financialHistory[0].detail.sponsorSigning, 1_000);
});

// Integração com rodada e estado inicial
test('fechamento financeiro da Liga usa salário real dos jogadores', () => {
  const game = baseGame({ club:{ ...baseGame().club, wage:999_999 } });
  const rounds = { leagueRoundPlayed:4, totalLeagueRounds:38 };
  const finance = calculateLeagueRoundFinances(game, { ticketIncome:0 }, game.players, rounds);
  assert.equal(finance.wage, 150_000);
});
test('estado inicial já nasce com club.wage sincronizado', () => {
  const state = getInitialGameState('br-abc', 'Manager', 'D');
  const actual = state.players.reduce((sum, p) => sum + (Number(p.wage) || 0), 0);
  assert.equal(state.club.wage, actual);
  assert.ok(actual > 0);
});
test('FinanceEngine mantém API pública compatível', () => {
  assert.equal(FinanceEngine.getTVRights, getTVRights);
  assert.equal(typeof FinanceEngine.calculateMatchFinances, 'function');
  assert.equal(typeof FinanceEngine.getFinancialStatus, 'function');
});
test('engine_finances virou fachada curta', async () => {
  const source = await readFile(new URL('../src/engines/engine_finances.js', import.meta.url), 'utf8');
  assert.ok(source.split('\n').length < 25);
});
test('financeViewModel virou fachada curta', async () => {
  const source = await readFile(new URL('../src/engines/finances/financeViewModel.js', import.meta.url), 'utf8');
  assert.ok(source.split('\n').length < 25);
});
test('Copa não cobra novamente custo operacional periódico', async () => {
  const source = await readFile(new URL('../src/engines/match/matchCupRound.js', import.meta.url), 'utf8');
  assert.match(source, /const operationalCost = 0/);
});

console.log(`\nFinance smoke: ${checks}/${checks} verificações aprovadas.`);

import assert from 'node:assert/strict';
import { CpuAI } from '../src/engines/engine_cpu_ai.js';
import { generateSquad } from '../src/engines/core/playerFactory.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { calcCPUAvailableStrength } from '../src/engines/core/teamMetrics.js';
import { advanceUserRoster } from '../src/engines/season/seasonRoster.js';
import { renewCpuRosters } from '../src/engines/season/seasonTeams.js';
import { evaluateTransferPurchase } from '../src/engines/market/transferRules.js';
import { processCpuTransfers, refreshTransferMarket } from '../src/engines/match/matchTransferPostProcessor.js';
import { recruitCpuTeam } from '../src/engines/cpu/cpuRecruitment.js';
import { processCpuToCpuTransfers, releaseExpiredCpuPlayers } from '../src/engines/cpu/cpuTransfers.js';
import { getCpuPositionNeed } from '../src/engines/cpu/cpuRoster.js';
import { applyContractRenewalState } from '../src/engines/market/contractTransactions.js';

let checks = 0;
const test = (name, fn) => {
  fn();
  checks += 1;
  console.log(`✅ ${name}`);
};

const sequence = (values, fallback = 0.99) => {
  let index = 0;
  return () => index < values.length ? values[index++] : fallback;
};

const makePlayer = (id, overrides = {}) => ({
  id,
  name: `Jogador ${id}`,
  position: 'CA',
  overall: 70,
  age: 24,
  value: 500_000,
  wage: 8_000,
  contract: 2,
  teamId: null,
  teamName: 'Livre',
  isStarting: false,
  isListed: false,
  energy: 100,
  injury: null,
  discipline: { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
  ...overrides,
});

const makeRoster = (teamId, size = 22, overrides = {}) => Array.from({ length: size }, (_, index) => makePlayer(
  `${teamId}-${index}`,
  {
    teamId,
    teamName: teamId,
    position: index === 0 ? 'GOL' : index < 5 ? 'ZAG' : index < 8 ? 'VOL' : index < 11 ? 'MC' : 'CA',
    overall: 65 + (index % 8),
    isStarting: index < 11,
    ...overrides,
  },
));

const makeTeam = (id, overrides = {}) => ({
  id,
  name: id,
  strength: 70,
  money: 5_000_000,
  budget: 3_000_000,
  style: 'equilibrado',
  ...overrides,
});

const emptyLeagues = () => ({ A: [], B: [], C: [], D: [] });

test('janela abre nas rodadas 1-5 e 20-24', () => {
  assert.equal(CpuAI.isTransferWindowOpen(1), true);
  assert.equal(CpuAI.isTransferWindowOpen(5), true);
  assert.equal(CpuAI.isTransferWindowOpen(20), true);
  assert.equal(CpuAI.isTransferWindowOpen(24), true);
});

test('janela fecha fora dos intervalos', () => {
  assert.equal(CpuAI.isTransferWindowOpen(6), false);
  assert.equal(CpuAI.isTransferWindowOpen(19), false);
  assert.equal(CpuAI.isTransferWindowOpen(25), false);
});

test('informação da janela usa rótulo e contagem corretos', () => {
  assert.deepEqual(CpuAI.getTransferWindowInfo(5), { open: true, mode:'round', closesIn: 0, label: 'Janela de Inverno' });
  assert.deepEqual(CpuAI.getTransferWindowInfo(19), { open: false, mode:'round', opensIn: 1, label: 'Janela de Verão' });
  assert.equal(CpuAI.isTransferWindowOpen({ season:2026, currentDateISO:'2026-03-03' }), true);
  assert.equal(CpuAI.isTransferWindowOpen({ season:2026, currentDateISO:'2026-03-04' }), false);
  assert.equal(CpuAI.getTransferWindowInfo({ season:2026, currentDateISO:'2026-07-20' }).mode, 'date');
});

test('generateSquad grava teamId em jogadores CPU', () => {
  const squad = generateSquad('B', 'CPU', 68, 'b1', () => 0.4);
  assert.equal(squad.length, 22);
  assert.ok(squad.every((player) => player.teamId === 'b1'));
});

test('estado inicial grava teamId user e sincroniza teamRosters.user', () => {
  const state = getInitialGameState('br-abc', 'Manager', 'D');
  assert.ok(state.players.every((player) => player.teamId === 'user'));
  assert.equal(state.teamRosters.user.length, state.players.length);
  assert.equal(state.teamRosters.user[0].id, state.players[0].id);
});

test('renovação CPU da virada não reduz contrato recém-gerado', () => {
  const rosters = { a1: [makePlayer('p1', { contract: 1 }), makePlayer('p2', { contract: 3 })] };
  const next = renewCpuRosters(rosters);
  assert.equal(next.a1[0].contract, 1);
  assert.equal(next.a1[1].contract, 3);
});

test('contrato CPU expirado é normalizado para 2 anos na virada', () => {
  const next = renewCpuRosters({ a1: [makePlayer('p1', { contract: 0, wage: 10_000 })] });
  assert.equal(next.a1[0].contract, 2);
  assert.equal(next.a1[0].wage, 10_500);
});

test('moral mantém faixas previstas', () => {
  assert.equal(CpuAI.getMoraleMultiplier(90), 1.08);
  assert.equal(CpuAI.getMoraleMultiplier(60), 1);
  assert.equal(CpuAI.getMoraleMultiplier(10), 0.87);
});

test('renovação procura jogador antes de validar saldo', () => {
  const result = CpuAI.applyContractRenewal([], { money: 0 }, 'missing', 999_999);
  assert.equal(result.error, 'Jogador não encontrado.');
});

test('contrato expirado recebe exatamente mais 2 anos', () => {
  const result = CpuAI.applyContractRenewal(
    [makePlayer('p1', { contract: 0, wage: 10_000 })],
    { money: 1_000_000, wage: 10_000 },
    'p1', 20_000, () => 0,
  );
  assert.equal(result.error, null);
  assert.equal(result.players[0].contract, 2);
});

test('renovação gera lançamento financeiro pelo custo contratual atual', () => {
  const result = CpuAI.applyContractRenewal(
    [makePlayer('p1', { contract: 1, wage: 10_000 })],
    { money: 300_000, wage: 10_000 },
    'p1', 20_000, () => 0,
  );
  assert.equal(result.club.money, 60_000);
  assert.equal(result.transaction.expense, 240_000);
  assert.equal(result.transaction.total, -240_000);
  assert.equal(result.players[0].wage, 11_000);
});

test('cotação antiga nunca reduz custo após reajuste salarial', () => {
  const validation = CpuAI.validateContractRenewal(
    [makePlayer('p1', { contract: 1, wage: 20_000 })],
    { money: 1_000_000 },
    'p1', 100_000,
  );
  assert.equal(validation.error, null);
  assert.equal(validation.cost, 480_000);
});

test('snapshot contratual obsoleto invalida proposta simultânea', () => {
  const validation = CpuAI.validateContractRenewal(
    [makePlayer('p1', { contract: 1, wage: 12_000 })],
    { money: 1_000_000 },
    'p1', 288_000,
    { expectedContract: 1, expectedWage: 10_000 },
  );
  assert.match(validation.error, /salário mudou/i);
});

test('renovação atômica sincroniza roster e invalida todas as propostas do atleta', () => {
  const player = makePlayer('renew', { teamId: 'user', teamName: 'User', contract: 1, wage: 10_000 });
  const action = { type: 'renew_contract', playerId: 'renew', cost: 240_000, expectedContract: 1, expectedWage: 10_000 };
  const state = {
    season: 2026, round: 2, leagueRound: 2, players: [player],
    teamRosters: { user: [player] },
    club: { name: 'User', money: 1_000_000, wage: 10_000 },
    financialHistory: [], trashMsgIds: [],
    inbox: [
      { id: 'renew-a', actionData: { ...action } },
      { id: 'renew-b', actionData: { ...action } },
    ],
  };
  const result = applyContractRenewalState(state, action, () => 0);
  assert.equal(result.ok, true);
  assert.equal(result.state.players[0].contract, 3);
  assert.equal(result.state.teamRosters.user[0].contract, 3);
  assert.deepEqual(result.state.trashMsgIds.sort(), ['renew-a', 'renew-b']);
  const repeated = applyContractRenewalState(result.state, action, () => 0);
  assert.equal(repeated.ok, false);
  assert.match(repeated.error, /já possui contrato longo/i);
});

test('proposta de renovação de temporada anterior não pode ser aceita', () => {
  const player = makePlayer('old-season', { teamId:'user', teamName:'User', contract:1, wage:10_000 });
  const state = {
    season:2027, round:2, leagueRound:2, players:[player], teamRosters:{ user:[player] },
    club:{ name:'User', money:1_000_000, wage:10_000 }, financialHistory:[], inbox:[], trashMsgIds:[],
  };
  const action = { type:'renew_contract', playerId:'old-season', cost:240_000, expectedContract:1, expectedWage:10_000, season:2026 };
  const result = applyContractRenewalState(state, action, () => 0);
  assert.equal(result.ok, false);
  assert.match(result.error, /outra temporada/i);
  assert.equal(result.state.club.money, 1_000_000);
  assert.equal(result.state.players[0].contract, 1);
});

test('custo negativo de renovação não cria dinheiro', () => {
  const result = CpuAI.applyContractRenewal(
    [makePlayer('p1', { contract: 1, wage: 10_000 })],
    { money: 1_000_000, wage: 10_000 },
    'p1', -50_000, () => 0,
  );
  assert.equal(result.club.money, 760_000);
  assert.equal(result.transaction.expense, 240_000);
});

test('relatório de saídas inclui titular com contrato expirado', () => {
  const departures = CpuAI.getSeasonEndDepartures([
    makePlayer('starter', { contract: 0, isStarting: true }),
    makePlayer('bench', { contract: 0, isStarting: false }),
  ]);
  assert.deepEqual(departures.map((player) => player.id), ['starter', 'bench']);
});

test('jogador do usuário com contrato 0 realmente deixa o elenco na virada', () => {
  const players = Array.from({ length: 18 }, (_, index) => makePlayer(`u${index}`, {
    teamId: 'user', teamName: 'User', isStarting: index < 11, contract: index === 0 ? 0 : 2,
  }));
  const next = advanceUserRoster({ players, scorers: {}, club: { name: 'User' } }, 'A', 'User', () => 0.9);
  assert.ok(!next.some((player) => player.id === 'u0'));
  assert.equal(next.length, 18);
});

test('avisos de contrato só aparecem nas rodadas configuradas', () => {
  const player = makePlayer('warn', { contract: 1, wage: 10_000 });
  assert.equal(CpuAI.getContractWarnings([player], 3, []).length, 0);
  assert.equal(CpuAI.getContractWarnings([player], 2, []).length, 1);
});

test('aviso de contrato não duplica mensagem existente', () => {
  const player = makePlayer('warn', { contract: 1 });
  const id = 'contract_warn_warn_r2';
  assert.equal(CpuAI.getContractWarnings([player], 2, [{ id }]).length, 0);
});

test('aviso de contrato da temporada anterior não bloqueia a nova temporada', () => {
  const player = makePlayer('warn', { contract: 1 });
  const previous = CpuAI.getContractWarnings([player], 2, [], 2026)[0];
  const current = CpuAI.getContractWarnings([player], 2, [previous], 2027);
  assert.equal(previous.id, 'contract_warn_warn_s2026_r2');
  assert.equal(current.length, 1);
  assert.equal(current[0].id, 'contract_warn_warn_s2027_r2');
});

test('necessidade posicional prioriza goleiro quando não existe nenhum', () => {
  const roster = Array.from({ length: 19 }, (_, index) => makePlayer(`x${index}`, { position: 'CA' }));
  assert.equal(getCpuPositionNeed(roster), 'GOL');
});

test('recrutamento CPU fica bloqueado fora da janela', () => {
  const team = makeTeam('a1');
  const roster = makeRoster('a1', 18);
  const result = recruitCpuTeam(team, { a1: roster }, 6, 'A', () => 0);
  assert.equal(result.roster.length, 18);
  assert.equal(result.changed, false);
});

test('recrutamento repõe até dois atletas quando elenco está curto', () => {
  const team = makeTeam('a1');
  const roster = makeRoster('a1', 18);
  const result = recruitCpuTeam(team, { a1: roster }, 3, 'A', () => 0.1);
  assert.equal(result.roster.length, 20);
  assert.equal(result.recruits.length, 2);
});

test('recruta CPU com vínculo correto ao clube', () => {
  const team = makeTeam('a1');
  const result = recruitCpuTeam(team, { a1: makeRoster('a1', 19) }, 3, 'A', () => 0.1);
  assert.equal(result.recruits[0].teamId, 'a1');
  assert.equal(result.recruits[0].teamName, 'a1');
});

test('recrutamento consome dinheiro e orçamento CPU', () => {
  const team = makeTeam('a1', { money: 5_000_000, budget: 3_000_000 });
  const result = recruitCpuTeam(team, { a1: makeRoster('a1', 19) }, 3, 'A', () => 0.1);
  assert.ok(result.team.money < team.money);
  assert.ok(result.team.budget < team.budget);
});

test('CPU sem recursos não cria contratação gratuita', () => {
  const team = makeTeam('a1', { money: 0, budget: 0 });
  const result = recruitCpuTeam(team, { a1: makeRoster('a1', 19) }, 3, 'A', () => 0.1);
  assert.equal(result.recruits.length, 0);
  assert.equal(result.roster.length, 19);
});

test('processTransferActivity também respeita janela', () => {
  const team = makeTeam('a1', { squad: makeRoster('a1', 18) });
  const leagues = { ...emptyLeagues(), A: [team] };
  const result = CpuAI.processTransferActivity(leagues, { a1: team.squad }, 10, () => 0);
  assert.equal(result.teamRosters.a1.length, 18);
});

test('processTransferActivity não muta roster original', () => {
  const roster = makeRoster('a1', 18);
  const team = makeTeam('a1', { squad: roster });
  const beforeIds = roster.map((player) => player.id);
  CpuAI.processTransferActivity({ ...emptyLeagues(), A: [team] }, { a1: roster }, 3, () => 0.1);
  assert.deepEqual(roster.map((player) => player.id), beforeIds);
  assert.equal(roster.length, 18);
});

test('expirado CPU é removido do clube e vira agente livre real', () => {
  const roster = [makePlayer('expired', { teamId: 'a1', teamName: 'A', contract: 0 }), ...makeRoster('a1', 20)];
  const team = makeTeam('a1', { name: 'A', squad: roster });
  const result = releaseExpiredCpuPlayers({ ...emptyLeagues(), A: [team] }, { a1: roster });
  assert.equal(result.teamRosters.a1.some((player) => player.id === 'expired'), false);
  assert.equal(result.freeAgents[0].teamId, null);
  assert.equal(result.freeAgents[0].originTeamId, null);
  assert.equal(result.freeAgents[0].previousTeam, 'A');
});

test('agente livre expirado não é bloqueado pelo elenco mínimo do ex-clube', () => {
  const free = makePlayer('free', { teamId: null, teamName: 'Livre', originTeamId: null, originTeamName: null, previousTeam: 'A' });
  const game = {
    round: 0, leagueRound: 0, serie: 'A', players: [],
    club: { money: 5_000_000, transferBudget: 5_000_000, wage: 0, stadium: { level: 1 } },
    teams: [], leagues: emptyLeagues(), teamRosters: {},
  };
  assert.equal(evaluateTransferPurchase(game, free).allowed, true);
});

test('transferência CPU×CPU não ocorre fora da janela', () => {
  const buyer = makeTeam('a1', { squad: makeRoster('a1', 20) });
  const sellerRoster = makeRoster('a2', 21).map((player, index) => ({ ...player, isStarting: index < 11, isListed: index === 20 }));
  const seller = makeTeam('a2', { squad: sellerRoster });
  const result = processCpuToCpuTransfers({ ...emptyLeagues(), A: [buyer, seller] }, { a1: buyer.squad, a2: sellerRoster }, 6, () => 0);
  assert.equal(result.teamRosters.a1.length, 20);
  assert.equal(result.teamRosters.a2.length, 21);
});

test('transferência CPU×CPU respeita intervalo de três rodadas', () => {
  const buyer = makeTeam('a1', { squad: makeRoster('a1', 20) });
  const sellerRoster = makeRoster('a2', 21).map((player, index) => ({ ...player, isStarting: index < 11, isListed: index === 20 }));
  const seller = makeTeam('a2', { squad: sellerRoster });
  const result = processCpuToCpuTransfers({ ...emptyLeagues(), A: [buyer, seller] }, { a1: buyer.squad, a2: sellerRoster }, 2, () => 0);
  assert.equal(result.teamRosters.a1.length, 20);
});

test('transferência CPU×CPU move atleta, dinheiro e orçamento', () => {
  const buyerRoster = makeRoster('a1', 20);
  const sellerRoster = makeRoster('a2', 21).map((player, index) => ({
    ...player,
    isStarting: index < 11,
    isListed: index === 20,
    overall: index === 20 ? 72 : player.overall,
    value: index === 20 ? 500_000 : player.value,
  }));
  const buyer = makeTeam('a1', { strength: 70, money: 2_000_000, budget: 1_500_000, squad: buyerRoster });
  const seller = makeTeam('a2', { strength: 70, money: 1_000_000, budget: 500_000, squad: sellerRoster });
  const result = processCpuToCpuTransfers(
    { ...emptyLeagues(), A: [buyer, seller] },
    { a1: buyerRoster, a2: sellerRoster },
    3,
    sequence([0.01, 0, 0, 0.99]),
  );
  assert.equal(result.teamRosters.a1.length, 21);
  assert.equal(result.teamRosters.a2.length, 20);
  const moved = result.teamRosters.a1.find((player) => player.id === 'a2-20');
  assert.equal(moved.teamId, 'a1');
  assert.equal(moved.isListed, false);
  const nextBuyer = result.leagues.A.find((team) => team.id === 'a1');
  const nextSeller = result.leagues.A.find((team) => team.id === 'a2');
  assert.equal(nextBuyer.money, 1_500_000);
  assert.equal(nextBuyer.budget, 1_000_000);
  assert.equal(nextSeller.money, 1_500_000);
  assert.equal(nextSeller.budget, 1_000_000);
});

test('CPU vendedor nunca fica abaixo de 20 jogadores', () => {
  const buyer = makeTeam('a1', { squad: makeRoster('a1', 20) });
  const sellerRoster = makeRoster('a2', 20).map((player, index) => ({ ...player, isListed: index === 19 }));
  const seller = makeTeam('a2', { squad: sellerRoster });
  const result = processCpuToCpuTransfers({ ...emptyLeagues(), A: [buyer, seller] }, { a1: buyer.squad, a2: sellerRoster }, 3, sequence([0.01, 0, 0, 0.99]));
  assert.equal(result.teamRosters.a2.length, 20);
  assert.equal(result.teamRosters.a1.length, 20);
});

test('CPU comprador respeita orçamento real', () => {
  const buyerRoster = makeRoster('a1', 20);
  const sellerRoster = makeRoster('a2', 21).map((player, index) => ({ ...player, isListed: index === 20, value: index === 20 ? 500_000 : player.value }));
  const buyer = makeTeam('a1', { money: 2_000_000, budget: 100_000, squad: buyerRoster });
  const seller = makeTeam('a2', { squad: sellerRoster });
  const result = processCpuToCpuTransfers({ ...emptyLeagues(), A: [buyer, seller] }, { a1: buyerRoster, a2: sellerRoster }, 3, sequence([0.01, 0, 0, 0.99]));
  assert.equal(result.teamRosters.a1.length, 20);
});

test('força CPU reage à qualidade atual do roster', () => {
  const team = makeTeam('a1', { strength: 70 });
  const weak = makeRoster('a1', 22).map((player) => ({ ...player, overall: 55 }));
  const strong = makeRoster('a1', 22).map((player) => ({ ...player, overall: 85 }));
  assert.ok(calcCPUAvailableStrength(team, { a1: strong }, 1) > calcCPUAvailableStrength(team, { a1: weak }, 1));
});

test('processCpuTransfers remove expirados antes de negociar', () => {
  const roster = [makePlayer('expired', { teamId: 'a1', teamName: 'A', contract: 0 }), ...makeRoster('a1', 20)];
  const team = makeTeam('a1', { name: 'A', squad: roster });
  const game = { round: 5, leagueRound: 5, leagues: { ...emptyLeagues(), A: [team] }, teamRosters: { a1: roster } };
  const result = processCpuTransfers(game, { leagueIdx: 5, rng: () => 0.99 });
  assert.equal(result.teamRosters.a1.some((player) => player.id === 'expired'), false);
  assert.equal(result.freeAgents.some((player) => player.id === 'expired'), true);
});

test('mercado injeta agente liberado sem duplicar id', () => {
  const existing = Array.from({ length: 3 }, (_, index) => makePlayer(`m${index}`, { overall: 50 + index }));
  const free = makePlayer('free-x', { overall: 90, teamId: null, teamName: 'Livre', isListed: true });
  const game = { round: 0, leagueRound: 0, serie: 'A', market: existing, leagues: emptyLeagues(), teamRosters: {}, fixtures: [] };
  const market = refreshTransferMarket(game, { leagueIdx: 0, rng: () => 0.99, extraFreeAgents: [free, free] });
  assert.equal(market.filter((player) => player.id === 'free-x').length, 1);
  assert.equal(market.find((player) => player.id === 'free-x').teamName, 'Livre');
});

test('refresh automático preserva agente livre real mesmo com rolagem de substituição', () => {
  const released = makePlayer('released-real', { overall: 55, teamId:null, teamName:'Livre', previousTeam:'Clube Antigo', isListed:true });
  const generated = makePlayer('generated-old', { overall:75, teamId:null, teamName:'Livre' });
  const game = { round: 4, leagueRound: 4, serie:'A', market:[released, generated], leagues:emptyLeagues(), teamRosters:{}, fixtures:[] };
  const market = refreshTransferMarket(game, { leagueIdx:4, rng:() => 0 });
  assert.equal(market.some((player) => player.id === 'released-real'), true);
});

test('agente liberado entra no mercado mesmo com OVR abaixo da vitrine', () => {
  const existing = [makePlayer('elite', { overall:90, teamId:null, teamName:'Livre' })];
  const free = makePlayer('low-free', { overall:40, teamId:null, teamName:'Livre', previousTeam:'CPU Fraco', isListed:true });
  const game = { round: 1, leagueRound: 1, serie:'A', market:existing, leagues:emptyLeagues(), teamRosters:{}, fixtures:[] };
  const market = refreshTransferMarket(game, { leagueIdx:1, rng:() => 0.99, extraFreeAgents:[free] });
  assert.equal(market.some((player) => player.id === 'low-free'), true);
});

test('recrutamento nunca ultrapassa o limite de 30 jogadores', () => {
  const roster = makeRoster('a1', 30);
  const team = makeTeam('a1', { squad: roster });
  const result = recruitCpuTeam(team, { a1: roster }, 3, 'A', () => 0);
  assert.equal(result.roster.length, 30);
  assert.equal(result.recruits.length, 0);
});

test('clube sem movimentação não sofre deriva artificial de strength', () => {
  const roster = makeRoster('a1', 22).map((player) => ({ ...player, overall: 90 }));
  const team = makeTeam('a1', { strength: 70, squad: roster });
  const result = CpuAI.processTransferActivity({ ...emptyLeagues(), A: [team] }, { a1: roster }, 3, () => 0.99);
  assert.equal(result.leagues.A[0].strength, 70);
});

test('fachada CpuAI permanece imutável', () => {
  assert.equal(Object.isFrozen(CpuAI), true);
  assert.equal(CpuAI.MAX_SQUAD_SIZE, 30);
});

console.log(`\nCPU AI smoke: ${checks}/${checks} verificações aprovadas.`);

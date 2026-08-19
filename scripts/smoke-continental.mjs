import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  initLibertadores,
  initSulAmericana,
  registerGroupLegResult,
  registerKnockoutLegResult,
} from '../src/engines/cups/continentalEngine.js';
import {
  isEligibleForLibertadores,
  isEligibleForSulAmericana,
} from '../src/engines/cups/continentalConfig.js';
import { collectUsedContinentalTeamIds } from '../src/engines/cups/continentalKnockout.js';
import { getCupPrizeDelta, appendCupPrizeToEvents } from '../src/engines/cups/cupPrizeAccounting.js';
import { COPA_PRIZES, LIBERTA_PRIZES, LIBERTA_SCHEDULE, getCopaConfigForSerie, getCopaPhasePrize } from '../src/engines/cups/cupConfig.js';
import { initCopaBrasil, registerCopaLegResult } from '../src/engines/cups/copaBrasilEngine.js';

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

const table = (position = 1) => {
  const teams = Array.from({ length: 20 }, (_, index) => ({ id:`cpu${index + 1}`, name:`CPU ${index + 1}` }));
  teams.splice(position - 1, 0, { id:'user', name:'Meu Clube' });
  return teams.slice(0, 20);
};

const game = ({ serie = 'A', position = 1 } = {}) => ({
  serie,
  table: table(position),
  club: { name:'Meu Clube', strength:82, existingTeamId:'a1' },
});

const rngHigh = () => 0.99;

test('Libertadores aceita Série A no G6', () => assert.equal(isEligibleForLibertadores(game({ position:6 })), true));
test('Libertadores rejeita 7º da Série A', () => assert.equal(isEligibleForLibertadores(game({ position:7 })), false));
test('Sul-Americana aceita Série A entre 7º e 12º', () => assert.equal(isEligibleForSulAmericana(game({ position:12 })), true));
test('Sul-Americana rejeita 13º da Série A', () => assert.equal(isEligibleForSulAmericana(game({ position:13 })), false));
test('Sul-Americana aceita campeão da Série B', () => assert.equal(isEligibleForSulAmericana(game({ serie:'B', position:1 })), true));
test('Sul-Americana rejeita vice da Série B', () => assert.equal(isEligibleForSulAmericana(game({ serie:'B', position:2 })), false));

test('initLibertadores cria grupo de quatro clubes e seis jogos do usuário', () => {
  const cup = initLibertadores(game(), rngHigh);
  assert.equal(cup.group.length, 4);
  assert.equal(cup.groupMatches.length, 3);
  assert.equal(cup.groupMatches.filter((match) => match.leg2).length, 3);
});

test('grupo continental guarda confronto CPU paralelo em cada rodada', () => {
  const cup = initLibertadores(game(), rngHigh);
  for (const match of cup.groupMatches) {
    assert.ok(match.leg1.cpuMatch?.homeTeam);
    assert.ok(match.leg2.cpuMatch?.awayTeam);
  }
});

test('registro de resultado não muta a Copa original', () => {
  const cup = initLibertadores(game(), rngHigh);
  const id = cup.groupMatches[0].id;
  const next = registerGroupLegResult(cup, id, 2, 0, LIBERTA_PRIZES, LIBERTA_SCHEDULE, false, rngHigh);
  assert.equal(cup.groupMatches[0].leg1.played, false);
  assert.equal(next.groupMatches[0].leg1.played, true);
});

test('resultado duplicado não soma pontos novamente', () => {
  const cup = initLibertadores(game(), rngHigh);
  const id = cup.groupMatches[0].id;
  const once = registerGroupLegResult(cup, id, 2, 0, LIBERTA_PRIZES, LIBERTA_SCHEDULE, false, rngHigh);
  const twice = registerGroupLegResult(once, id, 2, 0, LIBERTA_PRIZES, LIBERTA_SCHEDULE, false, rngHigh);
  assert.deepEqual(twice.group, once.group);
});

const finishWinningGroup = () => {
  let cup = initLibertadores(game(), rngHigh);
  for (const original of [...cup.groupMatches]) {
    cup = registerGroupLegResult(cup, original.id, original.home?.isPlayer ? 2 : 0, original.home?.isPlayer ? 0 : 2, LIBERTA_PRIZES, LIBERTA_SCHEDULE, false, rngHigh);
    const current = cup.groupMatches.find((match) => match.id === original.id);
    const userHomeLeg2 = Boolean(current.leg2?.homeTeam?.isPlayer);
    cup = registerGroupLegResult(cup, original.id, userHomeLeg2 ? 2 : 0, userHomeLeg2 ? 0 : 2, LIBERTA_PRIZES, LIBERTA_SCHEDULE, true, rngHigh);
  }
  return cup;
};

test('fase de grupos completa deixa todos os quatro clubes com 6 partidas', () => {
  const cup = finishWinningGroup();
  assert.deepEqual(cup.group.map((team) => team.p).sort((a,b) => a-b), [6,6,6,6]);
});

test('grupo paga valor exato configurado sem perder centavos por divisão', () => {
  const cup = finishWinningGroup();
  assert.equal(cup.totalPrize, LIBERTA_PRIZES.group);
});

test('classificação do grupo abre as Oitavas', () => {
  const cup = finishWinningGroup();
  assert.equal(cup.phase, 'knockout');
  assert.equal(cup.knockoutTie.phase, 'Oitavas');
  assert.equal(cup.status, 'active');
});

test('adversário das Oitavas não repete clube da fase de grupos nem o clube original', () => {
  const cup = finishWinningGroup();
  const groupIds = new Set(cup.group.filter((team) => !team.isPlayer).map((team) => team.id));
  assert.equal(groupIds.has(cup.knockoutTie.away.id), false);
  assert.notEqual(cup.knockoutTie.away.id, 'a1');
});

test('coletor de usados inclui mandante e visitante do histórico, não só vencedor', () => {
  const used = collectUsedContinentalTeamIds({
    userSourceTeamId:'a1',
    group:[{ id:'user', isPlayer:true }, { id:'arg1' }],
    history:[{ home:{ id:'arg2' }, away:{ id:'user' }, winner:{ id:'user' } }],
  });
  assert.equal(used.has('arg1'), true);
  assert.equal(used.has('arg2'), true);
  assert.equal(used.has('a1'), true);
});

test('vitória nas Oitavas avança sem repetir adversário anterior', () => {
  let cup = finishWinningGroup();
  const firstOpponent = cup.knockoutTie.away.id;
  cup = registerKnockoutLegResult(cup, 'leg1', 2, 0, LIBERTA_PRIZES, LIBERTA_SCHEDULE, rngHigh);
  cup = registerKnockoutLegResult(cup, 'leg2', 0, 1, LIBERTA_PRIZES, LIBERTA_SCHEDULE, rngHigh);
  assert.equal(cup.knockoutTie.phase, 'Quartas');
  assert.notEqual(cup.knockoutTie.away.id, firstOpponent);
  assert.equal(cup.totalPrize, LIBERTA_PRIZES.group + LIBERTA_PRIZES.Oitavas);
});



test('Copa do Brasil 2026 faz Série A entrar na 5ª fase', () => {
  const cup = initCopaBrasil({ ...game(), fixtures:Array.from({ length:38 }, () => []) });
  assert.equal(cup.phaseLabel, '5ª Fase');
  assert.ok(cup.currentTie.leg2, '5ª Fase deve ser ida e volta');
});

test('Copa do Brasil 2026 modela jogos únicos e ida/volta por fase', () => {
  const a = getCopaConfigForSerie('A');
  const c = getCopaConfigForSerie('C');
  assert.deepEqual(a.schedule['5ª Fase'], [1, 2]);
  assert.deepEqual(a.schedule.Final, [9]);
  assert.deepEqual(c.schedule['1ª Fase'], [1]);
  assert.deepEqual(c.schedule['2ª Fase'], [2, 3]);
  assert.deepEqual(c.schedule['3ª Fase'], [4]);
  assert.deepEqual(c.schedule['4ª Fase'], [5]);
});

test('cotas da Copa do Brasil diferenciam Série B de C/D nas fases iniciais', () => {
  assert.equal(getCopaPhasePrize('B', '2ª Fase'), 1_380_000);
  assert.equal(getCopaPhasePrize('B', '4ª Fase'), 1_680_000);
  assert.equal(getCopaPhasePrize('C', '2ª Fase'), 830_000);
  assert.equal(getCopaPhasePrize('D', '4ª Fase'), 1_070_000);
  assert.equal(getCopaPhasePrize('A', '5ª Fase'), 2_000_000);
  assert.equal(COPA_PRIZES.Campeão, 78_000_000);
});

test('Copa do Brasil usa composição dinâmica das divisões da carreira', () => {
  const dynamic = {
    ...game(),
    fixtures:Array.from({ length:38 }, () => []),
    leagues:{
      A:[{ id:'promovido-a', name:'Promovido A', strength:77 }],
      B:[{ id:'cpu-b-dinamico', name:'CPU B Dinâmico', strength:70 }],
      C:[], D:[],
    },
  };
  const cup = initCopaBrasil(dynamic);
  assert.equal(cup.pool.some((team) => team.id === 'promovido-a'), true);
  assert.equal(cup.pool.some((team) => team.id === 'cpu-b-dinamico'), true);
});

test('continental preserva Série A dinâmica para adversários brasileiros do mata-mata', () => {
  const dynamic = {
    ...game(),
    leagues:{ A:[{ id:'promovido-lib', name:'Promovido Libertadores', strength:79 }], B:[], C:[], D:[] },
  };
  const cup = initLibertadores(dynamic, rngHigh);
  assert.equal(cup.domesticOpponentPool.some((team) => team.id === 'promovido-lib'), true);
});

test('avanço na Copa do Brasil também produz delta financeiro de fase', () => {
  const copaGame = { ...game(), fixtures:Array.from({ length:38 }, () => []) };
  let cup = initCopaBrasil(copaGame);
  const before = cup;
  cup = registerCopaLegResult(cup, 'leg1', 2, 0);
  cup = registerCopaLegResult(cup, 'leg2', 0, 1);
  assert.equal(getCupPrizeDelta(before, cup), getCopaPhasePrize('A', '5ª Fase'));
});

test('delta de prêmio retorna somente o valor novo da partida', () => {
  assert.equal(getCupPrizeDelta({ totalPrize:2_000_000 }, { totalPrize:5_000_000 }), 3_000_000);
});
test('delta de prêmio nunca fica negativo em save inconsistente', () => {
  assert.equal(getCupPrizeDelta({ totalPrize:5_000_000 }, { totalPrize:2_000_000 }), 0);
});
test('evento existente recebe o prêmio sem duplicar a mensagem', () => {
  const events = appendCupPrizeToEvents([{ cup:'Libertadores', msg:'Classificados!', earned:0 }], { cup:'Libertadores', earned:3_000_000 });
  assert.equal(events.length, 1);
  assert.equal(events[0].earned, 3_000_000);
});

test('initSulAmericana mantém chave correta da competição', () => {
  const cup = initSulAmericana(game({ position:8 }), rngHigh);
  assert.equal(cup.competitionKey, 'sulAmericana');
});

const source = await readFile(new URL('../src/engines/cups/continentalEngine.js', import.meta.url), 'utf8');
const matchCupSource = await readFile(new URL('../src/engines/match/matchCupRound.js', import.meta.url), 'utf8');
test('continentalEngine virou fachada curta', () => assert.ok(source.trim().split('\n').length < 160));
test('fluxo financeiro de Copa usa delta de totalPrize', () => assert.ok(matchCupSource.includes('getCupPrizeDelta(beforeCup, cups[storageKey])')));

console.log(`Continental smoke: ${passed}/${passed} verificações aprovadas.`);

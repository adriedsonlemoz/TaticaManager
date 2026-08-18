import assert from 'node:assert/strict';
import { simulateMatch } from '../src/engines/match/matchSimulator.js';
import { applyCpuTactics, runMatchTimeline, registerMatchYellow } from '../src/engines/match/matchSimulationEvents.js';
import {
  applyCpuSubstitutions,
  buildActiveLineup,
  pickScorer,
  removeActivePlayer,
} from '../src/engines/match/matchSimulationRoster.js';
import {
  calculateHomeAdvantage,
  getManagerStyleMultipliers,
  resolveMatchStrengths,
} from '../src/engines/match/matchSimulationStrength.js';
import { buildMatchStatistics } from '../src/engines/match/matchSimulationStats.js';
import { buildLiveMatchIntegrityReport } from '../src/engines/match/matchLiveState.js';

let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const deepEqual = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };

const player = (id, position = 'MC', overall = 70, extra = {}) => ({
  id,
  name: `Jogador ${id}`,
  position,
  overall,
  energy: 100,
  isStarting: true,
  moralIndividual: 60,
  discipline: { yellowCards: 0, suspendedUntilRound: null },
  ...extra,
});

const starters = [
  player('gk', 'GOL'), player('z1', 'ZAG'), player('z2', 'ZAG'),
  player('ld', 'LD'), player('le', 'LE'), player('v1', 'VOL'),
  player('v2', 'VOL'), player('m1', 'MC'), player('mei', 'MEI'),
  player('pd', 'PD'), player('ca', 'CA'),
];
const cpuRoster = starters.map((p, i) => ({ ...p, id: `cpu${i}`, name: `CPU ${i}`, isStarting: true, teamId: 'cpu', teamName: 'CPU FC' }))
  .concat([player('bench', 'CA', 82, { name: 'Reserva Forte', isStarting: false, teamId: 'cpu', teamName: 'CPU FC' })]);
const homeUser = { id: 'user', name: 'Usuário FC', isPlayer: true, strength: 72 };
const cpu = { id: 'cpu', name: 'CPU FC', isPlayer: false, strength: 70, fanBase: 0.8 };
const tactics = { isValid: true };
const baseGame = {
  round: 0,
  serie: 'A',
  morale: 60,
  club: { fanLoyalty: 50, managerProfile: { style: 'Equilibrado' } },
  teamRosters: { cpu: cpuRoster },
  difficultyMultipliers: {},
  players: starters,
};

// Estilo: Defensivo deve reduzir ataque rival; Ofensivo deve expor mais a defesa.
deepEqual(getManagerStyleMultipliers('Equilibrado'), { userAttack: 1, opponentAttack: 1 });
deepEqual(getManagerStyleMultipliers('Defensivo'), { userAttack: 0.97, opponentAttack: 0.96 });
deepEqual(getManagerStyleMultipliers('Ofensivo'), { userAttack: 1.04, opponentAttack: 1.03 });
const balanced = resolveMatchStrengths({ gameData: baseGame, home: homeUser, away: cpu, tactics, starters });
const defensive = resolveMatchStrengths({ gameData: { ...baseGame, club: { ...baseGame.club, managerProfile: { style: 'Defensivo' } } }, home: homeUser, away: cpu, tactics, starters });
const offensive = resolveMatchStrengths({ gameData: { ...baseGame, club: { ...baseGame.club, managerProfile: { style: 'Ofensivo' } } }, home: homeUser, away: cpu, tactics, starters });
check(defensive.awayStrength < balanced.awayStrength, 'Estilo defensivo deve reduzir a força ofensiva rival');
check(offensive.awayStrength > balanced.awayStrength, 'Estilo ofensivo deve aumentar a exposição defensiva');

// CPU desfalcada também perde força quando enfrenta o usuário, não só em CPU×CPU.
const healthyCpuStrength = resolveMatchStrengths({ gameData: baseGame, home: homeUser, away: cpu, tactics, starters }).awayStrength;
const injuredCpuRoster = cpuRoster.map((p, index) => index < 4 ? { ...p, injury: { type: 'Leve' } } : p);
const weakenedCpuStrength = resolveMatchStrengths({ gameData: { ...baseGame, teamRosters: { cpu: injuredCpuRoster } }, home: homeUser, away: cpu, tactics, starters }).awayStrength;
check(weakenedCpuStrength < healthyCpuStrength, 'Desfalques da CPU devem reduzir sua força contra o usuário');

// Em CPU×CPU, quem perde abre e quem ganha fecha; a regra antiga fortalecia o lado errado.
const cpuRuntime = { liveHomeGoals: 0, liveAwayGoals: 2, homeGoalProbability: 0.01, awayGoalProbability: 0.01 };
applyCpuTactics({ runtime: cpuRuntime, home: { ...cpu, id: 'h' }, away: { ...cpu, id: 'a' } });
equal(Number(cpuRuntime.homeGoalProbability.toFixed(4)), 0.0125);
equal(Number(cpuRuntime.awayGoalProbability.toFixed(4)), 0.0085);

// Mando deve usar a torcida de quem realmente joga em casa, inclusive quando o usuário é visitante.
const awayUser = { ...homeUser, fanBase: 0.1 };
const awayGame = { ...baseGame, club: { ...baseGame.club, fanLoyalty: 20 } };
const homeAdv = calculateHomeAdvantage(cpu, awayUser, awayGame);
equal(Number(homeAdv.toFixed(3)), 1.152, 'Mando CPU deve usar fanBase da CPU e torcida visitante do usuário');

// Elenco ativo: banco do usuário não pode aparecer entre os 11 em campo.
const bench = player('user-bench', 'CA', 99, { isStarting: false });
const activeUser = buildActiveLineup({ team: homeUser, roster: [...starters, bench], starters, round: 1 });
equal(activeUser.length, 11);
check(!activeUser.some((p) => p.id === 'user-bench'), 'Reserva não pode entrar no elenco ativo sem substituição');
const scorerIds = new Set(Array.from({ length: 20 }, (_, i) => pickScorer(activeUser, homeUser, () => ((i % 10) / 10)).id));
check(!scorerIds.has('user-bench'), 'Reserva não pode marcar sem estar em campo');

// CPU: lesionado/suspenso fica fora; melhor reserva preenche a vaga.
const cpuWithAbsences = [
  ...cpuRoster.slice(0, 9),
  player('hurt', 'CA', 90, { teamId: 'cpu', isStarting: true, injury: { type: 'Leve' } }),
  player('susp', 'CA', 89, { teamId: 'cpu', isStarting: true, discipline: { yellowCards: 0, suspendedUntilRound: 2 } }),
  player('fill1', 'CA', 78, { teamId: 'cpu', isStarting: false }),
  player('fill2', 'MEI', 77, { teamId: 'cpu', isStarting: false }),
];
const activeCpu = buildActiveLineup({ team: cpu, roster: cpuWithAbsences, starters: [], round: 1 });
equal(activeCpu.length, 11);
check(!activeCpu.some((p) => p.id === 'hurt'), 'Lesionado CPU não pode ser escalado');
check(!activeCpu.some((p) => p.id === 'susp'), 'Suspenso CPU não pode ser escalado');
check(activeCpu.some((p) => p.id === 'fill1') && activeCpu.some((p) => p.id === 'fill2'), 'CPU deve preencher vagas com reservas disponíveis');
const goalieRoster = [
  player('gk-hurt', 'GOL', 75, { teamId: 'cpu', isStarting: true, injury: { type: 'Leve' } }),
  ...cpuRoster.slice(1, 11),
  player('gk-bench', 'GOL', 62, { teamId: 'cpu', isStarting: false }),
  player('star-bench', 'CA', 99, { teamId: 'cpu', isStarting: false }),
];
const goalieActive = buildActiveLineup({ team: cpu, roster: goalieRoster, starters: [], round: 1 });
check(goalieActive.some((p) => p.id === 'gk-bench'), 'CPU deve colocar goleiro reserva quando o titular está indisponível');
equal(goalieActive.filter((p) => p.position === 'GOL').length, 1);

// Substituição da CPU troca jogadores reais do lineup, em vez de só dar boost abstrato.
const subResult = applyCpuSubstitutions({ activeLineup: cpuRoster.slice(0, 11), fullRoster: cpuRoster, count: 1, round: 1 });
equal(subResult.changes.length, 1);
check(subResult.lineup.some((p) => p.id === 'bench'), 'Reserva forte deve realmente entrar após substituição');
equal(subResult.lineup.length, 11);

// Segundo amarelo é por partida, não pelo acumulado de jogos anteriores.
const yellowMap = new Map();
equal(registerMatchYellow(yellowMap, starters[0]).isSecondYellow, false);
equal(registerMatchYellow(yellowMap, starters[0]).isSecondYellow, true);

const makeSequenceRng = (values, fallback = 0.5) => {
  let index = 0;
  return () => (index < values.length ? values[index++] : fallback);
};
const quietTail = Array.from({ length: 89 }, () => [0.5, 0.9]).flat();
const oneYellowRng = makeSequenceRng([0.04, 0.0, 0.1, ...quietTail]);
const tinyRosters = {
  full: { home: [player('y', 'CA', 70, { discipline: { yellowCards: 2, suspendedUntilRound: null } })], away: [player('a', 'CA')] },
  active: { home: [player('y', 'CA', 70, { discipline: { yellowCards: 2, suspendedUntilRound: null } })], away: [player('a', 'CA')] },
};
const fixedStrengths = {
  homeStrength: 70, awayStrength: 70,
  adjustedHomeStrength: 70, adjustedAwayStrength: 70,
  homeGoalProbability: 0.0145, awayGoalProbability: 0.0145,
};
const oneYellow = runMatchTimeline({ gameData: { round: 0 }, home: { ...homeUser, isPlayer: true }, away: { ...cpu, isPlayer: true }, strengths: fixedStrengths, rosters: tinyRosters, rng: oneYellowRng });
equal(oneYellow.rawEvents[0].type, 'yellow', 'Dois amarelos acumulados não transformam o primeiro amarelo do jogo em vermelho');

const twoYellowRng = makeSequenceRng([0.04, 0.0, 0.1, 0.04, 0.0, ...Array.from({ length: 88 }, () => [0.5, 0.9]).flat()]);
const twoYellow = runMatchTimeline({ gameData: { round: 0 }, home: { ...homeUser, isPlayer: true }, away: { ...cpu, isPlayer: true }, strengths: fixedStrengths, rosters: tinyRosters, rng: twoYellowRng });
deepEqual(twoYellow.rawEvents.slice(0, 2).map((event) => event.type), ['yellow', 'red_second_yellow']);

// Expulso sai do campo e não pode marcar depois.
const redHome = [player('red', 'CA'), player('stays', 'CA')];
const redRosters = { full: { home: redHome, away: [player('opp', 'CA')] }, active: { home: redHome, away: [player('opp', 'CA')] } };
const redThenGoalValues = [
  0.9999, 0.1, 0.0, // min1: vermelho casa, escolhe 'red'
  0.001, 0.0, 0.9, 0.0, // min2: gol casa, escolhe único ativo, não é contra, frase
  ...Array.from({ length: 88 }, () => [0.5, 0.9]).flat(),
];
const redThenGoal = runMatchTimeline({ gameData: { round: 0 }, home: { ...homeUser, isPlayer: true }, away: { ...cpu, isPlayer: true }, strengths: fixedStrengths, rosters: redRosters, rng: makeSequenceRng(redThenGoalValues) });
const goalAfterRed = redThenGoal.rawEvents.find((event) => event.type === 'goal');
equal(goalAfterRed?.scorerObj?.id, 'stays', 'Jogador expulso não pode marcar depois do vermelho');

// Estatísticas devem ser internamente válidas.
const stats = buildMatchStatistics({ homeGoals: 7, awayGoals: 0, adjustedHomeStrength: 80, adjustedAwayStrength: 60, rng: () => 0.99 });
check(stats.homeOnTarget <= stats.homeShots, 'Finalizações no alvo não podem superar finalizações totais');
check(stats.awayOnTarget <= stats.awayShots, 'Finalizações no alvo não podem superar finalizações totais');
equal(stats.homePoss + stats.awayPoss, 100);

// RNG injetável: mesma seed precisa produzir partida idêntica.
const seeded = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};
const simArgs = [baseGame, { home: homeUser, away: cpu }, tactics, starters, starters];
const simA = simulateMatch(...simArgs, { rng: seeded(12345) });
const simB = simulateMatch(...simArgs, { rng: seeded(12345) });
deepEqual(simA, simB, 'Mesmo RNG deve reproduzir exatamente a mesma partida');
check(simA.homeOnTarget <= simA.homeShots && simA.awayOnTarget <= simA.awayShots);
check(buildLiveMatchIntegrityReport({ ...simA, homeName:homeUser.name, awayName:cpu.name, homeId:homeUser.id, awayId:cpu.id, userIsHome:true }).valid, 'Partida simulada deve nascer íntegra entre placar, eventos e estatísticas');

// Sanidade estatística em lote: mantém gols perto do alvo e corrige amarelos para ~3,5/jogo.
let totalGoals = 0;
let totalYellows = 0;
let allSamplesIntegral = true;
const samples = 500;
for (let i = 1; i <= samples; i += 1) {
  const result = simulateMatch(...simArgs, { rng: seeded(i * 7919) });
  totalGoals += result.homeGoals + result.awayGoals;
  totalYellows += result.rawEvents.filter((event) => event.type === 'yellow' || event.type === 'red_second_yellow').length;
  allSamplesIntegral = allSamplesIntegral && buildLiveMatchIntegrityReport({ ...result, homeName:homeUser.name, awayName:cpu.name, homeId:homeUser.id, awayId:cpu.id, userIsHome:true }).valid;
}
const avgGoals = totalGoals / samples;
const avgYellows = totalYellows / samples;
check(avgGoals > 2.0 && avgGoals < 3.3, `Média de gols fora do intervalo esperado: ${avgGoals.toFixed(2)}`);
check(avgYellows > 2.6 && avgYellows < 4.3, `Média de amarelos fora do intervalo esperado: ${avgYellows.toFixed(2)}`);
check(allSamplesIntegral, 'Lote de 500 partidas deve manter integridade entre placar, rawEvents, narração e estatísticas');

const zeroIdStarters = starters.map((player, index) => index === 0 ? { ...player, id:0 } : player);
const zeroIdGame = { ...baseGame, players:zeroIdStarters };
const zeroIdResult = simulateMatch(zeroIdGame, { home:homeUser, away:cpu }, tactics, zeroIdStarters, zeroIdStarters, { rng:seeded(777) });
equal(zeroIdResult.activeLineups.home.includes(0), true, 'ID numérico 0 deve sobreviver ao snapshot da escalação ativa');
equal(zeroIdResult.activeLineups.home.length, 11, 'snapshot ativo do usuário deve preservar os 11 titulares');
const zeroIdAfterRed = removeActivePlayer([{ id:0, name:'Zero' }, { id:1, name:'Um' }], { id:0, name:'Zero' });
equal(zeroIdAfterRed.length, 1, 'expulsão deve remover corretamente jogador com ID numérico 0');
equal(zeroIdAfterRed[0].id, 1, 'expulsão de ID 0 não pode remover o atleta errado');

console.log(`match simulator smoke tests: ${checks}/${checks} OK · gols ${avgGoals.toFixed(2)} · amarelos ${avgYellows.toFixed(2)}`);

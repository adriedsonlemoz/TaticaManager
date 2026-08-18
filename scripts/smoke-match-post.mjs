import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DisciplineEngine } from '../src/engines/engine_discipline.js';
import { FinanceEngine } from '../src/engines/engine_finances.js';
import { PostMatchAgent } from '../src/engines/PostMatchAgent.js';
import { progressAcademy } from '../src/engines/match/matchAcademyPostProcessor.js';
import {
  buildBoardObjectiveNotification,
  buildContractWarnings,
  buildFanPressureNotification,
  buildJournalNotification,
  buildSuspensionNotifications,
  buildTrainingInjury,
  countConsecutiveLeagueDefeats,
} from '../src/engines/match/matchNotificationBuilders.js';
import { preparePostMatchPlayers } from '../src/engines/match/matchPlayerPostProcessor.js';
import { buildMatchRoundContext } from '../src/engines/match/matchRoundContext.js';
import { calculateLeagueRoundFinances } from '../src/engines/match/matchRoundState.js';
import {
  buildPostMatchEventGroups,
  buildPostMatchStats,
  getLeaguePositionChange,
  getPostMatchFinalScore,
  getPostMatchFinanceEntry,
  getPostMatchFinanceFallback,
  getPostMatchResultMeta,
  getPostMatchRoundContext,
  isPostMatchUserTeam,
  parsePostMatchCard,
  parsePostMatchGoal,
} from '../src/components/postmatch/postMatchViewModel.js';

let checks = 0;
const check = (fn) => { fn(); checks += 1; };
const player = (overrides = {}) => ({
  id:'p1', name:'Jogador Teste', position:'MC', overall:70, wage:1000,
  isStarting:true, moralIndividual:60,
  discipline:{ yellowCards:0, suspendedUntilRound:null, disciplineHistory:[] },
  ...overrides,
});
const baseGame = (overrides = {}) => ({
  season:2026,
  round:5,
  leagueRound:3,
  serie:'A',
  club:{ name:'Teste FC', money:1_000_000, academyLevel:'basic', stadium:{ level:1 } },
  players:[player()],
  fixtures:Array.from({ length:38 }, () => []),
  inbox:[],
  table:[{ id:'user', name:'Teste FC', pts:10 }],
  academy:[], academyReady:[], leagues:{ A:[], B:[], C:[], D:[] }, teamRosters:{},
  ...overrides,
});

check(() => assert.deepEqual(buildMatchRoundContext(baseGame(), 3), {
  calendarIndexBefore:5,
  calendarIndexAfter:6,
  calendarRoundPlayed:6,
  nextCalendarRound:7,
  playedLeagueBefore:3,
  leagueRoundPlayed:4,
  playedLeagueAfter:4,
  nextLeagueRound:5,
  totalLeagueRounds:38,
}));

check(() => {
  const academyPlayer = player({ id:'a1', overall:50, potential:70, trajectory:'steady' });
  const progressed = progressAcademy(baseGame({ round:12, leagueRound:7, academy:[academyPlayer] }), { leagueIdx:7, rng:() => 0 });
  assert.equal(progressed[0].overall, 51, 'base deve progredir na 8ª rodada da Liga, independentemente do calendário');
});
check(() => {
  const academyPlayer = player({ id:'a1', overall:50, potential:70, trajectory:'steady' });
  const unchanged = progressAcademy(baseGame({ round:7, leagueRound:5, academy:[academyPlayer] }), { leagueIdx:5, rng:() => 0 });
  assert.equal(unchanged[0].overall, 50, 'slot 8 do calendário não deve fingir ser rodada 8 da Liga');
});

const defeatMatch = (round) => ({
  home:{ id:'user', isPlayer:true }, away:{ id:`cpu${round}`, isPlayer:false }, played:true, result:'0 - 1',
});
const threeDefeats = [[defeatMatch(1)], [defeatMatch(2)], [defeatMatch(3)]];
check(() => assert.equal(countConsecutiveLeagueDefeats(threeDefeats, 3), 3));
check(() => assert.equal(buildFanPressureNotification({ gameData:baseGame(), fixtures:threeDefeats, leagueRoundPlayed:3 }).length, 1));
check(() => {
  const withDraw = [[defeatMatch(1)], [defeatMatch(2)], [{ ...defeatMatch(3), result:'1 - 1' }]];
  assert.equal(buildFanPressureNotification({ gameData:baseGame(), fixtures:withDraw, leagueRoundPlayed:3 }).length, 0);
});

check(() => {
  const table = [
    { id:'cpu', name:'Líder', pts:25 },
    { id:'user', name:'Teste FC', pts:20 },
  ];
  const [msg] = buildJournalNotification({
    gameData:baseGame({ round:15, leagueRound:9 }),
    userMatchData:{ homeName:'Teste FC', awayName:'CPU', homeGoals:2, awayGoals:0 },
    updatedTable:table,
    leagueRoundPlayed:10,
  });
  assert.equal(msg.id, 'jornal_s2026_r10');
  assert.match(msg.body, /Rodada 10/);
  assert.doesNotMatch(msg.body, /Rodada 16/);
});

check(() => {
  const [msg] = buildBoardObjectiveNotification({
    gameData:baseGame({ seasonObjective:'promotion', round:16, leagueRound:9 }),
    updatedTable:Array.from({ length:8 }, (_, index) => ({ id:index === 7 ? 'user' : `t${index}`, pts:20-index })),
    leagueRoundPlayed:10,
    totalLeagueRounds:38,
  });
  assert.equal(msg.id, 'dir_promo_s2026_r10');
  assert.equal(msg.actionData.targetRound, 15);
});

check(() => {
  const contractPlayer = player({ contract:1 });
  const msgs = buildContractWarnings({ gameData:baseGame({ players:[contractPlayer], round:4, leagueRound:1 }), leagueRoundPlayed:2 });
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].round, 2);
});

check(() => {
  const starter = player({ id:'s1', isStarting:true });
  const benchHealthy = player({ id:'b1', isStarting:false });
  const benchInjured = player({ id:'b2', isStarting:false, injury:{ type:'Leve', roundsLeft:1 } });
  const injury = buildTrainingInjury({ gameData:baseGame(), updatedPlayers:[starter, benchInjured, benchHealthy], leagueRoundPlayed:8, rng:() => 0 });
  assert.equal(injury.playerId, 'b1');
  assert.match(injury.msg.id, /r8_b1/);
});

check(() => {
  const base = player({ id:'r1', name:'Expulso' });
  const [updated] = DisciplineEngine.processMatchDisciplineEvents([base], [], 5, [{
    min:70, type:'red_second_yellow', isPlayer:true, playerId:'r1', playerName:'Expulso',
  }]);
  assert.equal(updated.discipline.suspendedUntilRound, 6, 'segundo amarelo deve suspender por 1 jogo');
});

check(() => {
  const base = player({ id:'r2', name:'Vermelho' });
  const [updated] = DisciplineEngine.processMatchDisciplineEvents([base], [], 5, [{
    min:50, type:'red_direct', isPlayer:true, playerId:'r2', playerName:'Vermelho',
  }]);
  assert.equal(updated.discipline.suspendedUntilRound, 7);
  const msgs = buildSuspensionNotifications({
    gameData:baseGame({ players:[base] }), updatedPlayers:[updated],
    allRawEvents:[{ type:'red_direct', isPlayer:true, playerId:'r2' }],
    leagueRoundPlayed:4, nextCalendarRound:6,
  });
  assert.equal(msgs[0].subject.includes('2 rodada(s)'), true, 'vermelho direto deve mostrar 2 jogos, não 3');
});

check(() => {
  const expiredForNext = player({ discipline:{ yellowCards:0, suspendedUntilRound:6, disciplineHistory:[] } });
  const ready = preparePostMatchPlayers(baseGame({ round:5 }), [expiredForNext], {}, () => 0);
  assert.equal(ready[0].isStarting, true, 'suspensão que termina no jogo atual não pode barrar o próximo slot');
});
check(() => {
  const suspendedNext = player({ discipline:{ yellowCards:0, suspendedUntilRound:7, disciplineHistory:[] } });
  const ready = preparePostMatchPlayers(baseGame({ round:5 }), [suspendedNext], {}, () => 0);
  assert.equal(ready[0].isStarting, false);
});

check(() => {
  const game = baseGame({ round:11, leagueRound:3 });
  const rounds = buildMatchRoundContext(game, 3);
  const finance = calculateLeagueRoundFinances(game, { ticketIncome:1000 }, [player({ wage:2000 })], rounds);
  assert.equal(finance.tvIncome, FinanceEngine.getTVRights('A', 4, 38));
  assert.equal(finance.operationalCost, FinanceEngine.getOperationalCosts(game), 'custo mensal deve seguir a 4ª rodada da Liga');
});

check(() => {
  const groups = buildPostMatchEventGroups([
    `12' ⚽ GOOOL DO Teste FC! (Atacante)`,
    null,
    { type:'goal' },
    `40' 🟨 Amarelo para Volante (CPU)`,
    `55' 🟨🟥 SEGUNDO AMARELO! Volante está EXPULSO! (CPU)`,
  ]);
  assert.equal(groups.goals.length, 1);
  assert.equal(groups.yellows.length, 1);
  assert.equal(groups.reds.length, 1);
});
check(() => {
  assert.deepEqual(buildPostMatchEventGroups(null), { goals:[], yellows:[], reds:[] });
});
check(() => {
  const stats = buildPostMatchStats({
    matchResultData:{ homeShots:1, homeOnTarget:99, homePoss:60, awayPoss:60 },
    liveScore:{ home:3, away:0 },
  });
  assert.equal(stats.homeShots, 3);
  assert.equal(stats.homeOnTarget, 3);
  assert.deepEqual(stats.possession, { home:50, away:50 });
});
check(() => {
  const meta = getPostMatchResultMeta({ gameData:baseGame(), matchResultData:{ homeName:'Teste FC', awayName:'CPU' } });
  assert.equal(meta.resultKind, 'draw');
  assert.equal(meta.resultLabel, 'EMPATE');
});
check(() => {
  assert.deepEqual(getPostMatchFinalScore({ homeGoals:3, awayGoals:1 }, { home:0, away:0 }), { home:3, away:1 });
  const meta = getPostMatchResultMeta({
    gameData:baseGame(),
    matchResultData:{ homeName:'Teste FC', awayName:'CPU', homeGoals:3, awayGoals:1 },
    liveScore:{ home:0, away:0 },
  });
  assert.equal(meta.resultKind, 'win');
  assert.deepEqual(meta.score, { home:3, away:1 });
});
check(() => {
  const goal = parsePostMatchGoal(`45+2' ⚽ GOOOL DO Teste FC! (Atacante)`, 'Teste FC', 'CPU');
  const card = parsePostMatchCard(`90+3' 🟨 Amarelo para Volante (CPU)`, 'Teste FC', 'CPU');
  assert.equal(goal.min, '45+2');
  assert.equal(card.min, '90+3');
});
check(() => {
  const stats = buildPostMatchStats({
    matchResultData:{
      homeName:'Inter', awayName:'Inter Miami', homeGoals:0, awayGoals:0,
      events:[`20' 🟨 Amarelo para A (Inter Miami)`, `30' 🟨 Amarelo para B (Inter)`],
    },
  });
  assert.equal(stats.homeYellows, 1);
  assert.equal(stats.awayYellows, 1);
});
check(() => {
  assert.deepEqual(getPostMatchRoundContext({ matchResultData:{ calendarRound:'6' } }), {
    playedCalendarRound:6,
    matchCalendarIndex:5,
    nextCalendarRound:7,
  });
});
check(() => {
  const stale = { round:2, competition:'league', income:999999 };
  const current = { round:'6', competition:'league', income:123456 };
  assert.equal(getPostMatchFinanceEntry({ financialHistory:[stale, current], playedRound:6 })?.income, 123456);
  assert.equal(getPostMatchFinanceEntry({ financialHistory:[stale], playedRound:6 }), null);
});
check(() => {
  const transfer = { round:6, competition:'transfer', income:777777 };
  assert.equal(getPostMatchFinanceEntry({ financialHistory:[transfer], playedRound:6, isCupMatch:false }), null);
  assert.equal(getPostMatchFinanceEntry({ financialHistory:[transfer], playedRound:6, isCupMatch:true }), null);
});
check(() => {
  const game = baseGame({
    serie:'B', leagueRound:4,
    club:{ ...baseGame().club, sponsors:{ master:{ roundValue:1000 }, stadium:{ roundValue:500 } } },
  });
  const fallback = getPostMatchFinanceFallback({
    gameData:game,
    matchResultData:{ leagueRound:4, income:2500, isCupMatch:false },
  });
  assert.equal(fallback.ticket, 2500);
  assert.equal(fallback.tv, FinanceEngine.getTVRights('B', 4, 38));
  assert.equal(fallback.sponsor, 1500);
  assert.equal(fallback.income, fallback.ticket + fallback.tv + fallback.sponsor);
});
check(() => {
  const customUser = { id:'club-77', name:'Teste FC', isPlayer:false };
  assert.equal(isPostMatchUserTeam(customUser, baseGame()), true);
});
check(() => {
  const before = [
    player({ id:1, name:'Titular Grave', isStarting:true }),
    player({ id:2, name:'Reserva Médio', isStarting:false }),
  ];
  const after = [
    player({ id:'1', name:'Titular Grave', isStarting:true, discipline:{ yellowCards:0, suspendedUntilRound:8, disciplineHistory:[] } }),
    player({ id:'2', name:'Reserva Médio', isStarting:false, discipline:{ yellowCards:0, suspendedUntilRound:7, disciplineHistory:[] } }),
  ];
  const analyzed = PostMatchAgent.analyzeDesfalques(before, after, [
    { type:'red_direct', isPlayer:true, playerId:'1', playerName:'Titular Grave' },
    { type:'red_second_yellow', isPlayer:true, playerId:2, playerName:'Reserva Médio' },
  ], 7);
  assert.equal(analyzed.suspensions.length, 2);
  assert.equal(analyzed.suspensions[0].player.name, 'Titular Grave');
  assert.equal(analyzed.suspensions[0].reason, 'Cartão vermelho direto');
  assert.equal(analyzed.hasBlockers, true);
});
check(() => {
  const change = getLeaguePositionChange({
    gameData:baseGame({ club:{ ...baseGame().club, name:'Teste FC' } }),
    sortedTable:[{ id:'cpu', name:'CPU' }, { id:'custom-user-id', name:'Teste FC', posVariation:1 }],
    isCupMatch:false,
  });
  assert.deepEqual(change, { posBefore:2, posAfter:2, delta:0 });
});

const barrel = await readFile(new URL('../src/engines/match/matchPostProcessor.js', import.meta.url), 'utf8');
const screen = await readFile(new URL('../src/components/ScreenPostMatch.jsx', import.meta.url), 'utf8');
const discipline = await readFile(new URL('../src/engines/engine_discipline.js', import.meta.url), 'utf8');
check(() => assert.ok(barrel.trim().split('\n').length <= 10));
check(() => assert.ok(screen.includes('getPostMatchRoundContext')));
check(() => assert.ok(screen.includes('liveScore={score}')));
check(() => {
  assert.ok(screen.includes('Array.isArray(matchResultData.events)'));
  assert.ok(screen.includes('Array.isArray(rawEvents)'));
});
check(() => assert.ok(discipline.includes("'red_second_yellow'")));

console.log(`Match post-processing smoke: ${checks}/${checks} verificações aprovadas.`);

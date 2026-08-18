import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildLiveEventMeta,
  getGoalScoreFromEvents,
  getGoalScorerName,
  getGoalScoringSide,
  getMatchEventBaseMinute,
  getMatchEventMinute,
  getMatchEventMinuteLabel,
  parseMatchCardEvent,
  parseMatchGoalEvent,
} from '../src/engines/match/matchEventViewModel.js';
import {
  buildMatchFieldViewModel,
  getOpponentRoster,
  selectDisplayStarters,
} from '../src/engines/match/matchFieldViewModel.js';
import {
  applyLiveSubstitution,
  buildInitialLiveUserPlayers,
  getFinalPossession,
  getMatchCompetitionLabel,
  getMatchFinalScore,
  getMatchResultMeta,
  getUserMatchSide,
  updateLivePossession,
} from '../src/engines/match/matchPresentationViewModel.js';
import { startMatchPlayback } from '../src/engines/match/matchPlayback.js';
import { createLiveMatchTimeline } from '../src/engines/match/matchLiveTimeline.js';
import { buildLiveMatchIntegrityReport } from '../src/engines/match/matchLiveState.js';
import {
  buildHalftimeEventSummary,
  buildHalftimeSubstitutionSuggestions,
} from '../src/engines/match/matchHalftimeViewModel.js';
import {
  MAX_LIVE_SUBSTITUTIONS,
  buildLiveSubstitutionChange,
  getLiveSubstitutionMinute,
  getLiveSubstitutionSelection,
  livePlayerIdsEqual,
} from '../src/engines/match/matchSubstitutionViewModel.js';

let passed = 0;
const test = async (name, fn) => {
  await fn();
  passed += 1;
  console.log(`✓ ${name}`);
};
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const home = 'Time Casa';
const away = 'Time Fora';
const normalGoal = `12' ⚽ GOOOL DO ${home}! (João Silva)`;
const ownGoal = `24' 😬 GOL CONTRA! Carlos Souza manda para dentro do próprio gol! (${home})`;
const penaltyGoal = `41' 🚨 PÊNALTI! VAR confirmou a infração — ⚽ CONVERTIDO por Pedro Lima! (${away})`;

await test('minuto do evento é extraído', () => assert.equal(getMatchEventMinute("90'+ FIM DE JOGO"), 90));
await test('gol normal identifica lado da casa', () => assert.equal(getGoalScoringSide(normalGoal, home, away), 'home'));
await test('gol normal identifica artilheiro', () => assert.equal(getGoalScorerName(normalGoal), 'João Silva'));
await test('gol contra credita o lado oposto', () => assert.equal(getGoalScoringSide(ownGoal, home, away), 'away'));
await test('gol contra preserva autor real', () => assert.equal(getGoalScorerName(ownGoal), 'Carlos Souza'));
await test('pênalti convertido identifica lado visitante', () => assert.equal(getGoalScoringSide(penaltyGoal, home, away), 'away'));
await test('pênalti convertido preserva cobrador', () => assert.equal(getGoalScorerName(penaltyGoal), 'Pedro Lima'));
await test('parser de gol informa pênalti', () => assert.equal(parseMatchGoalEvent(penaltyGoal, home, away).isPenalty, true));
await test('placar de intervalo trata gol contra corretamente', () => assert.deepEqual(getGoalScoreFromEvents([normalGoal, ownGoal, penaltyGoal], home, away, 45), { home:1, away:2 }));
await test('segundo amarelo extrai jogador', () => {
  const parsed = parseMatchCardEvent(`55' 🟨🟥 SEGUNDO AMARELO! Bruno Reis está EXPULSO! (${away})`, home, away);
  assert.equal(parsed.player, 'Bruno Reis');
  assert.equal(parsed.kind, 'second-yellow');
  assert.equal(parsed.side, 'away');
});
await test('evento ao vivo de gol contra aponta equipe beneficiada', () => {
  const meta = buildLiveEventMeta(ownGoal, { homeName:home, awayName:away, userTeamName:away });
  assert.equal(meta.side, 'away');
  assert.equal(meta.isUserEvent, true);
});

const cpuRoster = [
  { id:'g', name:'Goleiro CPU', position:'GOL', overall:65, isStarting:true },
  ...Array.from({ length:10 }, (_, i) => ({ id:`c${i}`, name:`CPU ${i}`, position:i<4?'ZAG':i<8?'VOL':'CA', overall:60+i, isStarting:true })),
  { id:'b', name:'Reserva Forte', position:'CA', overall:99, isStarting:false },
];
const gameData = {
  club:{ name:'Meu Clube', formation:'4-4-2', managerProfile:{ style:'Equilibrado' } },
  round:5,
  leagueRound:4,
  players:[
    { id:'u1', name:'Meu Goleiro', position:'GOL', overall:70, isStarting:true },
    { id:'u2', name:'Lateral', position:'LD', adaptedPosition:'ZAG', overall:72, isStarting:true },
    ...Array.from({ length:9 }, (_, i) => ({ id:`u${i+3}`, name:`Meu ${i}`, position:i<3?'ZAG':i<7?'VOL':'CA', overall:70+i, isStarting:true })),
    { id:'ub', name:'Meu Reserva', position:'CA', overall:75, isStarting:false },
  ],
  leagues:{ A:[{ id:'cpu', name:home, squad:cpuRoster }] },
  teamRosters:{ cpu:cpuRoster },
};

await test('obter roster adversário não devolve referência mutável do save', () => {
  const before = cpuRoster.map(p => p.id);
  const copy = getOpponentRoster(gameData, gameData.leagues.A[0]);
  copy.sort((a,b)=>b.overall-a.overall);
  assert.deepEqual(cpuRoster.map(p => p.id), before);
});
await test('seleção de titulares não inclui reserva forte só por OVR quando já há 11 titulares', () => {
  assert.equal(selectDisplayStarters(cpuRoster, 5).some(p => p.id === 'b'), false);
});
await test('campo do usuário visitante fica do lado direito', () => {
  const result = {
    homeName:home,
    awayName:'Meu Clube',
    calendarRound:5,
    rosters:{ home:cpuRoster, away:gameData.players },
    activeLineups:{ home:cpuRoster.filter(p=>p.isStarting).map(p=>p.id), away:gameData.players.filter(p=>p.isStarting).map(p=>p.id) },
  };
  const model = buildMatchFieldViewModel({ gameData, matchResultData:result });
  assert.ok(model.awayDots.every(dot => dot.x > 80));
  assert.ok(model.homeDots.every(dot => dot.x < 80));
});
await test('marcador userIsHome é a fonte de verdade mesmo se o nome do clube divergir no snapshot', () => {
  const result = {
    userIsHome:true,
    homeName:'Nome legado do meu clube',
    awayName:home,
    calendarRound:5,
    rosters:{ home:gameData.players, away:cpuRoster },
    activeLineups:{ home:gameData.players.filter(p=>p.isStarting).map(p=>p.id), away:cpuRoster.filter(p=>p.isStarting).map(p=>p.id) },
  };
  assert.equal(getUserMatchSide(gameData, result), 'home');
  const model = buildMatchFieldViewModel({ gameData, matchResultData:result });
  assert.equal(model.userSide, 'home');
  assert.ok(model.homeDots.some(dot => dot.id === 'u1'));
  assert.ok(model.homeDots.every(dot => dot.x < 80));
  assert.ok(model.awayDots.every(dot => dot.x > 80));
});
await test('posição adaptada é usada no campo da partida', () => {
  const result = {
    homeName:'Meu Clube', awayName:home, calendarRound:5,
    rosters:{ home:gameData.players, away:cpuRoster },
    activeLineups:{ home:gameData.players.filter(p=>p.isStarting).map(p=>p.id), away:cpuRoster.filter(p=>p.isStarting).map(p=>p.id) },
  };
  const model = buildMatchFieldViewModel({ gameData, matchResultData:result });
  const adapted = model.homeDots.find(dot => dot.id === 'u2');
  assert.equal(adapted?.pos, 'ZAG');
});
await test('modelo do campo não altera ordem do teamRosters original', () => {
  const before = gameData.teamRosters.cpu.map(p => p.id);
  buildMatchFieldViewModel({ gameData, matchResultData:{ homeName:'Meu Clube', awayName:home, calendarRound:5 } });
  assert.deepEqual(gameData.teamRosters.cpu.map(p => p.id), before);
});

await test('rótulo da Liga usa a rodada da partida, não a rodada já avançada do estado', () => {
  assert.equal(getMatchCompetitionLabel({ serie:'B', leagueRound:8 }, { leagueRound:7 }), 'Série B · Rod 7');
});
await test('rótulo de Copa diferencia jogo de volta', () => {
  assert.equal(getMatchCompetitionLabel({}, { isCupMatch:true, cupLabel:'Copa do Brasil', cupLeg:'leg2' }), 'Copa do Brasil · Jogo de Volta');
});
await test('posse final prefere estatística oficial da simulação', () => {
  assert.deepEqual(getFinalPossession({ homePoss:57, awayPoss:43 }, { home:30, away:70 }), { home:57, away:43 });
});
await test('substituição de narração não altera posse', () => {
  const prev = { home:51, away:49 };
  assert.deepEqual(updateLivePossession(prev, `HT 🔄 SUBSTITUIÇÃO: ↓ A → ↑ B (${home})`, { homeName:home, awayName:away }, () => 0.5), prev);
});
await test('roster local inicial respeita snapshot da simulação', () => {
  const result = { homeName:'Meu Clube', awayName:home, rosters:{ home:gameData.players }, activeLineups:{ home:['u1','u2'] } };
  const local = buildInitialLiveUserPlayers(gameData, result);
  assert.equal(local.find(p=>p.id==='u1').isStarting, true);
  assert.equal(local.find(p=>p.id==='u3').isStarting, false);
});
await test('substituição local não muta roster original', () => {
  const original = gameData.players.map(p => ({ ...p }));
  const next = applyLiveSubstitution(original, 'u1', 'ub');
  assert.equal(next.find(p=>p.id==='u1').isStarting, false);
  assert.equal(next.find(p=>p.id==='ub').isStarting, true);
  assert.equal(original.find(p=>p.id==='u1').isStarting, true);
});

const makePlayback = (events) => {
  const intervalRef = { current:null };
  const matchControlsRef = { current:{ commitMatchState:null, cancelMatchState:null } };
  const state = { simulating:null, events:[], score:null, commits:0, cancels:0 };
  matchControlsRef.current.commitMatchState = () => { state.commits += 1; };
  matchControlsRef.current.cancelMatchState = () => { state.cancels += 1; };
  startMatchPlayback({
    matchData:{ homeName:home, awayName:away, events },
    intervalRef,
    matchControlsRef,
    setSimulating:value => { state.simulating = value; },
    setVisibleEvents:updater => { state.events = typeof updater === 'function' ? updater(state.events) : updater; },
    setLiveScore:value => { state.score = value; },
    intervalMs:5,
  });
  return { intervalRef, matchControlsRef, state };
};

await test('playback preparado não começa antes do botão Iniciar', async () => {
  const pb = makePlayback([normalGoal, `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`]);
  await wait(15);
  assert.equal(pb.state.simulating, false);
  assert.deepEqual(pb.state.events, []);
  assert.equal(pb.state.commits, 0);
  pb.matchControlsRef.current.forceEnd();
});
await test('sair no pré-jogo não confirma a rodada nem mantém commit pendente', () => {
  const pb = makePlayback([normalGoal]);
  pb.matchControlsRef.current.forceEnd();
  assert.equal(pb.state.commits, 0);
  assert.equal(pb.state.cancels, 1);
  assert.equal(pb.matchControlsRef.current.commitMatchState, null);
});
await test('encerrar partida já iniciada confirma estado uma única vez', async () => {
  const pb = makePlayback([normalGoal]);
  pb.matchControlsRef.current.startMatch();
  pb.matchControlsRef.current.forceEnd();
  pb.matchControlsRef.current.forceEnd();
  assert.equal(pb.state.commits, 1);
});
await test('playback sempre para no intervalo mesmo sem eventos no segundo tempo', async () => {
  const pb = makePlayback([normalGoal, `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`]);
  pb.matchControlsRef.current.startMatch();
  await wait(16);
  assert.equal(pb.state.commits, 0);
  assert.equal(typeof pb.matchControlsRef.current.resumeSecondHalf, 'function');
  pb.matchControlsRef.current.resumeSecondHalf();
  await wait(16);
  assert.equal(pb.state.commits, 1);
});
await test('placar do playback contabiliza gol contra no lado correto', async () => {
  const pb = makePlayback([ownGoal, `90'+ FIM DE JOGO: ${home} 0 x 1 ${away}`]);
  pb.matchControlsRef.current.startMatch();
  await wait(8);
  assert.deepEqual(pb.state.score, { home:0, away:1 });
  pb.matchControlsRef.current.forceEnd();
});
await test('pause e retomada funcionam no segundo tempo', async () => {
  const pb = makePlayback([normalGoal, `60' Boa troca de passes no meio-campo (${away})`, `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`]);
  pb.matchControlsRef.current.startMatch();
  await wait(16);
  pb.matchControlsRef.current.resumeSecondHalf();
  await wait(3);
  pb.matchControlsRef.current.pauseMatch();
  const count = pb.state.events.length;
  await wait(10);
  assert.equal(pb.state.events.length, count);
  pb.matchControlsRef.current.resumeMatch();
  await wait(20);
  assert.equal(pb.state.commits, 1);
});

await test('acréscimos são somados ao minuto do evento', () => assert.equal(getMatchEventMinute("45+2' ⚽ GOL!"), 47));
await test('minuto-base preserva 45 em evento 45+2', () => assert.equal(getMatchEventBaseMinute("45+2' ⚽ GOL!"), 45));
await test('evento de substituição tem tipo próprio no view model', () => assert.equal(buildLiveEventMeta(`65' 🔄 ${home}: A por B.`, { homeName:home, awayName:away }).kind, 'sub'));
await test('lista inválida de eventos usa placar vazio com segurança', () => assert.deepEqual(getGoalScoreFromEvents(null, home, away), { home:0, away:0 }));
await test('45+2 é reproduzido antes da pausa de intervalo', async () => {
  const stoppageGoal = `45+2' ⚽ GOOOL DO ${home}! (João Silva)`;
  const pb = makePlayback([stoppageGoal, `46' Reinício de jogo (${away})`, `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`]);
  pb.matchControlsRef.current.startMatch();
  await wait(13);
  assert.deepEqual(pb.state.score, { home:1, away:0 });
  assert.deepEqual(pb.state.events, [stoppageGoal]);
  assert.equal(typeof pb.matchControlsRef.current.resumeSecondHalf, 'function');
  pb.matchControlsRef.current.forceEnd();
});
await test('lista de eventos não-array é rejeitada sem iniciar a partida', () => {
  const pb = makePlayback('evento inválido');
  assert.deepEqual(pb.state.events, []);
  assert.deepEqual(pb.state.score, { home:0, away:0 });
  assert.equal(pb.matchControlsRef.current.startMatch instanceof Function, true);
  pb.matchControlsRef.current.startMatch();
  assert.equal(pb.state.commits, 0);
  assert.equal(pb.state.cancels, 1);
});
await test('playback ignora entradas malformadas dentro da lista de eventos', async () => {
  const end = `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`;
  const pb = makePlayback([null, { type:'goal' }, '', '   ', normalGoal, end]);
  assert.equal(pb.matchControlsRef.current.startMatch(), true);
  await wait(8);
  assert.deepEqual(pb.state.events, [normalGoal]);
  assert.deepEqual(pb.state.score, { home:1, away:0 });
  pb.matchControlsRef.current.forceEnd();
});
await test('controles do playback confirmam transições válidas com booleano', async () => {
  const pb = makePlayback([normalGoal, `60' Segundo tempo (${away})`, `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`]);
  assert.equal(pb.matchControlsRef.current.startMatch(), true);
  assert.equal(pb.matchControlsRef.current.startMatch(), false);
  await wait(16);
  assert.equal(pb.matchControlsRef.current.resumeSecondHalf(), true);
  assert.equal(pb.matchControlsRef.current.resumeSecondHalf, null);
  pb.matchControlsRef.current.forceEnd();
});
await test('lado do usuário não é inventado quando clube não participa da partida', () => {
  const result = { homeName:home, awayName:away };
  assert.equal(getUserMatchSide(gameData, result), null);
  assert.deepEqual(getMatchResultMeta({ gameData, matchResultData:result, liveScore:{ home:3, away:0 } }), {
    userSide:null, isUserHome:false, userScore:0, opponentScore:0, result:'draw',
  });
  const field = buildMatchFieldViewModel({ gameData, matchResultData:result });
  assert.equal(field.identityValid, false);
  assert.deepEqual(field.homeDots, []);
  assert.deepEqual(field.awayDots, []);
});
await test('posse final normaliza valores inconsistentes para 100%', () => {
  assert.deepEqual(getFinalPossession({ homePoss:60, awayPoss:60 }), { home:50, away:50 });
  assert.deepEqual(getFinalPossession({ homePoss:57 }, { home:10, away:90 }), { home:57, away:43 });
});
await test('placar genérico usa resultado oficial apenas quando o placar ao vivo está ausente', () => {
  assert.deepEqual(getMatchFinalScore({ homeGoals:3, awayGoals:1 }, {}), { home:3, away:1 });
  assert.deepEqual(getMatchFinalScore({ homeGoals:3, awayGoals:1 }, { home:0, away:0 }), { home:0, away:0 });
});
await test('resumo de intervalo preserva 45+2 e conta cartões por lado sem substring', () => {
  const shortName = 'Inter';
  const longName = 'Inter Miami';
  const summary = buildHalftimeEventSummary({
    goalEvents:[`45+2' ⚽ GOOOL DO ${longName}! (Atacante)`, `46' ⚽ GOOOL DO ${shortName}! (Outro)`],
    yellowEvents:[`44' 🟨 Amarelo para Volante (${longName})`, `47' 🟨 Amarelo para Meia (${shortName})`],
    homeName:shortName,
    awayName:longName,
  });
  assert.equal(summary.goals.length, 1);
  assert.deepEqual(summary.score, { home:0, away:1 });
  assert.deepEqual(summary.yellowCards, { home:0, away:1 });
});
await test('recomendação do intervalo não sugere lesionado, suspenso nem jogador já substituído para fora', () => {
  const suggestions = buildHalftimeSubstitutionSuggestions({
    players:[
      { id:'t', name:'Titular Cansado', position:'CA', energy:20, overall:70, isStarting:true },
      { id:'out', name:'Saiu Antes', position:'CA', overall:99, isStarting:false },
      { id:'inj', name:'Lesionado', position:'CA', overall:98, injury:{ roundsLeft:1 }, isStarting:false },
      { id:'sus', name:'Suspenso', position:'CA', overall:97, discipline:{ suspendedUntilRound:5 }, isStarting:false },
      { id:'ok', name:'Reserva Válido', position:'CA', overall:76, isStarting:false },
    ],
    subsDone:[{ outId:'out', inId:'x' }],
    matchRound:5,
  });
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].incoming?.id, 'ok');
});
await test('substituição com mesmo jogador é no-op', () => {
  const original = gameData.players.map(p => ({ ...p }));
  const next = applyLiveSubstitution(original, 'u1', 'u1');
  assert.equal(next, original);
  assert.equal(next.find(p=>p.id==='u1').isStarting, true);
});
await test('substituição aceita IDs equivalentes string/número sem criar titular extra', () => {
  const original = [{ id:1, isStarting:true }, { id:2, isStarting:false }];
  const next = applyLiveSubstitution(original, '1', '2');
  assert.deepEqual(next.map(p=>p.isStarting), [false, true]);
});

await test('nome de equipe contido no adversário não rouba o lado do gol', () => {
  const shortName = 'Inter';
  const longName = 'Inter Miami';
  const event = `18' ⚽ GOOOL DO ${longName}! (Luis Suárez)`;
  assert.equal(getGoalScoringSide(event, shortName, longName), 'away');
});
await test('botão de substituição não permanece habilitado após o playback parar', async () => {
  const liveView = await readFile(new URL('../src/components/match/MatchLiveView.jsx', import.meta.url), 'utf8');
  assert.ok(liveView.includes('substitutions.length < MAX_LIVE_SUBSTITUTIONS && (simulating || isPaused)'));
  assert.ok(liveView.includes('canSubstitute={Boolean(userSide) && (simulating || isPaused)}'));
  assert.equal(liveView.includes('(isSecondHalf || simulating || isPaused)'), false);
});

await test('rótulo de acréscimo preserva 45+2 em vez de exibir 47', () => {
  assert.equal(getMatchEventMinuteLabel("45+2' ⚽ GOL!"), '45+2');
  assert.equal(parseMatchGoalEvent("45+2' ⚽ GOOOL DO Time Casa! (João Silva)", home, away).minuteLabel, '45+2');
});
await test('minuto de substituição usa HT no intervalo e saneia minuto inválido', () => {
  assert.deepEqual(getLiveSubstitutionMinute({ step:1, minute:999 }), { number:45, label:'HT', record:'HT' });
  assert.deepEqual(getLiveSubstitutionMinute({ step:2, minute:NaN }), { number:45, label:"45'", record:'45' });
});
await test('IDs equivalentes também funcionam na seleção do diálogo', () => {
  assert.equal(livePlayerIdsEqual(1, '1'), true);
  const selection = getLiveSubstitutionSelection({
    players:[
      { id:1, name:'Titular', position:'CA', overall:70, isStarting:true },
      { id:2, name:'Reserva', position:'CA', overall:72, isStarting:false },
    ],
    selectedStarter:'1',
    matchRound:5,
  });
  assert.equal(selection.selectedPlayer?.id, 1);
  assert.deepEqual(selection.reserves.map(player => player.id), [2]);
});
await test('reserva já substituída para fora não pode reentrar', () => {
  const selection = getLiveSubstitutionSelection({
    players:[
      { id:'a', name:'Titular', position:'CA', overall:70, isStarting:true },
      { id:'b', name:'Saiu Antes', position:'CA', overall:90, isStarting:false },
      { id:'c', name:'Reserva Válido', position:'CA', overall:72, isStarting:false },
    ],
    subsDone:[{ outId:'b', inId:'a' }],
    selectedStarter:'a',
    matchRound:5,
  });
  assert.deepEqual(selection.reserves.map(player => player.id), ['c']);
});
await test('reserva lesionado ou suspenso não aparece como opção', () => {
  const selection = getLiveSubstitutionSelection({
    players:[
      { id:'a', name:'Titular', position:'CA', overall:70, isStarting:true },
      { id:'b', name:'Lesionado', position:'CA', overall:99, injury:{ games:1 }, isStarting:false },
      { id:'c', name:'Suspenso', position:'CA', overall:98, discipline:{ suspendedUntilRound:5 }, isStarting:false },
      { id:'d', name:'Disponível', position:'CA', overall:72, isStarting:false },
    ],
    selectedStarter:'a',
    matchRound:5,
  });
  assert.deepEqual(selection.reserves.map(player => player.id), ['d']);
});
await test('mudança de substituição é atômica e preserva posição adaptada', () => {
  const change = buildLiveSubstitutionChange({
    players:[
      { id:1, name:'Lateral Titular', position:'LD', adaptedPosition:'ZAG', overall:70, isStarting:true },
      { id:2, name:'Zagueiro Reserva', position:'ZAG', overall:72, isStarting:false },
    ],
    outgoingId:'1',
    incomingId:'2',
    subsDone:[],
    step:2,
    minute:67.8,
    matchRound:5,
  });
  assert.ok(change);
  assert.deepEqual(change.players.map(player => player.isStarting), [false, true]);
  assert.equal(change.players[1].adaptedPosition, null);
  assert.equal(change.record.min, '67');
  assert.match(change.narration, /Lateral Titular/);
});
await test('mudança rejeita quarta substituição e jogador já fora', () => {
  const players = [
    { id:'a', name:'Titular', position:'CA', overall:70, isStarting:true },
    { id:'b', name:'Reserva', position:'CA', overall:72, isStarting:false },
  ];
  const fullHistory = Array.from({ length:MAX_LIVE_SUBSTITUTIONS }, (_, index) => ({ outId:`x${index}`, inId:`y${index}` }));
  assert.equal(buildLiveSubstitutionChange({ players, outgoingId:'a', incomingId:'b', subsDone:fullHistory }), null);
  assert.equal(buildLiveSubstitutionChange({ players, outgoingId:'a', incomingId:'b', subsDone:[{ outId:'a', inId:'x' }] }), null);
});
await test('hook limpa overlays temporários quando chega evento seguinte', async () => {
  const source = await readFile(new URL('../src/hooks/useMatchPresentation.js', import.meta.url), 'utf8');
  assert.ok(source.includes('clearTimeout(celebrationTimerRef.current)'));
  assert.ok(source.includes('setGoalCelebration(null);'));
  assert.ok(source.includes('setShowSubs(false);'));
});
await test('som usa ref sincronizado para não reativar estado antigo no primeiro clique', async () => {
  const source = await readFile(new URL('../src/hooks/useMatchPresentation.js', import.meta.url), 'utf8');
  assert.ok(source.includes('soundEnabledRef.current = next'));
  assert.ok(source.includes('SoundEngine?.setEnabled(soundEnabledRef.current)'));
  assert.ok(source.includes("}, []);"));
});
await test('diálogo usa transação de domínio e protege matchControlsRef ausente', async () => {
  const source = await readFile(new URL('../src/components/match/SubstitutionDialog.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('buildLiveSubstitutionChange'));
  assert.ok(source.includes('registerLiveSubstitution'));
  assert.ok(source.includes('controls.addEvent?.(narration)'));
  assert.ok(source.includes('submittingRef.current'));
});
await test('intervalo delega regras ao view model e não mantém parser legado local', async () => {
  const source = await readFile(new URL('../src/components/SMR_Halftime.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('buildHalftimeEventSummary'));
  assert.ok(source.includes('buildHalftimeSubstitutionSuggestions'));
  assert.equal(source.includes("e.match(/^(\d+)'/)"), false);
});
await test('hook só muda para o segundo tempo depois de o playback confirmar retomada', async () => {
  const source = await readFile(new URL('../src/hooks/useMatchPresentation.js', import.meta.url), 'utf8');
  const resumeCheck = source.indexOf("if (controls.resumeSecondHalf() !== true) return false;");
  const stepChange = source.indexOf('setStep(2);', resumeCheck);
  assert.ok(resumeCheck >= 0 && stepChange > resumeCheck);
});


await test('evento futuro troca jogador que já saiu por atleta realmente ativo', () => {
  const roster = [
    { id:'g', name:'Goleiro', position:'GOL', isStarting:true },
    ...Array.from({ length:8 }, (_, i) => ({ id:`z${i}`, name:`Z${i}`, position:'ZAG', isStarting:true })),
    { id:'out', name:'Atacante Sai', position:'CA', isStarting:true, teamId:'user', teamName:'Meu Clube' },
    { id:'mate', name:'Atacante Fica', position:'CA', isStarting:true, teamId:'user', teamName:'Meu Clube' },
    { id:'in', name:'Atacante Entra', position:'CA', isStarting:false, teamId:'user', teamName:'Meu Clube' },
  ];
  const timeline = createLiveMatchTimeline({
    userIsHome:true,
    homeName:'Meu Clube', awayName:home,
    homeId:'user', awayId:'cpu', homeIsPlayer:true,
    rosters:{ home:roster, away:cpuRoster },
    activeLineups:{ home:roster.filter(player => player.isStarting).map(player => player.id), away:cpuRoster.filter(player => player.isStarting).map(player => player.id) },
  });
  assert.equal(timeline.registerManualSubstitution({
    record:{ outId:'out', inId:'in', min:'60' },
    outgoing:roster.find(player => player.id === 'out'),
    incoming:roster.find(player => player.id === 'in'),
    narration:"60' 🔄 SUBSTITUIÇÃO: ↓ Atacante Sai → ↑ Atacante Entra (Meu Clube)",
  }).applied, true);
  const resolved = timeline.resolveScheduledEvent({
    narration:"80' ⚽ GOOOL DO Meu Clube! (Atacante Sai)",
    rawEvent:{ min:80, type:'goal', teamId:'user', teamName:'Meu Clube', isPlayer:true, scorer:'Atacante Sai', scorerObj:roster.find(player => player.id === 'out') },
    sourceIndex:4,
  });
  assert.equal(resolved.narration.includes('Atacante Sai)'), false);
  assert.equal(resolved.rawEvent.scorerObj.id === 'out', false);
  assert.equal(resolved.activeLineups.home.includes('out'), false);
  assert.equal(resolved.activeLineups.home.includes('in'), true);
});

await test('segundo amarelo impossível vira vermelho direto e mantém equipe com dez', () => {
  const roster = [
    { id:'g', name:'Goleiro', position:'GOL', isStarting:true },
    ...Array.from({ length:9 }, (_, i) => ({ id:`p${i}`, name:`P${i}`, position:i < 7 ? 'ZAG' : 'CA', isStarting:true })),
    { id:'out', name:'Saiu Amarelado', position:'CA', isStarting:true },
    { id:'in', name:'Entrou Limpo', position:'CA', isStarting:false },
  ];
  const timeline = createLiveMatchTimeline({
    userIsHome:true, homeName:'Meu Clube', awayName:home, homeId:'user', awayId:'cpu', homeIsPlayer:true,
    rosters:{ home:roster, away:cpuRoster },
    activeLineups:{ home:roster.filter(player => player.isStarting).slice(0,11).map(player => player.id), away:cpuRoster.filter(player => player.isStarting).map(player => player.id) },
  });
  timeline.resolveScheduledEvent({
    narration:"20' 🟨 Amarelo para Saiu Amarelado (Meu Clube)",
    rawEvent:{ min:20, type:'yellow', teamId:'user', teamName:'Meu Clube', isPlayer:true, playerId:'out', playerName:'Saiu Amarelado' },
    sourceIndex:0,
  });
  timeline.registerManualSubstitution({
    record:{ outId:'out', inId:'in', min:'60' },
    outgoing:roster.find(player => player.id === 'out'), incoming:roster.find(player => player.id === 'in'), narration:"60' 🔄 troca",
  });
  const resolved = timeline.resolveScheduledEvent({
    narration:"75' 🟨🟥 SEGUNDO AMARELO! Saiu Amarelado está EXPULSO! (Meu Clube)",
    rawEvent:{ min:75, type:'red_second_yellow', teamId:'user', teamName:'Meu Clube', isPlayer:true, playerId:'out', playerName:'Saiu Amarelado' },
    sourceIndex:2,
  });
  assert.equal(resolved.rawEvent.type, 'red_direct');
  assert.match(resolved.narration, /Vermelho direto/);
  assert.equal(resolved.activeLineups.home.length, 10);
});

await test('amarelo futuro de jogador substituído vai para atleta ativo ainda sem cartão', () => {
  const roster = [
    { id:'g', name:'Goleiro', position:'GOL', isStarting:true },
    ...Array.from({ length:9 }, (_, i) => ({ id:`p${i}`, name:`P${i}`, position:i < 7 ? 'ZAG' : 'CA', isStarting:true })),
    { id:'out', name:'Saiu', position:'CA', isStarting:true },
    { id:'in', name:'Entrou', position:'CA', isStarting:false },
  ];
  const timeline = createLiveMatchTimeline({
    userIsHome:true, homeName:'Meu Clube', awayName:home, homeId:'user', awayId:'cpu', homeIsPlayer:true,
    rosters:{ home:roster, away:cpuRoster },
    activeLineups:{ home:roster.filter(player => player.isStarting).slice(0,11).map(player => player.id), away:cpuRoster.filter(player => player.isStarting).map(player => player.id) },
  });
  timeline.resolveScheduledEvent({
    narration:"15' 🟨 Amarelo para P0 (Meu Clube)",
    rawEvent:{ min:15, type:'yellow', teamId:'user', teamName:'Meu Clube', isPlayer:true, playerId:'p0', playerName:'P0' },
    sourceIndex:0,
  });
  timeline.registerManualSubstitution({
    record:{ outId:'out', inId:'in', min:'60' }, outgoing:roster.find(player => player.id === 'out'), incoming:roster.find(player => player.id === 'in'), narration:"60' 🔄 troca",
  });
  const resolved = timeline.resolveScheduledEvent({
    narration:"75' 🟨 Amarelo para Saiu (Meu Clube)",
    rawEvent:{ min:75, type:'yellow', teamId:'user', teamName:'Meu Clube', isPlayer:true, playerId:'out', playerName:'Saiu' },
    sourceIndex:2,
  });
  assert.equal(resolved.rawEvent.type, 'yellow');
  assert.notEqual(String(resolved.rawEvent.playerId), 'out');
  assert.notEqual(String(resolved.rawEvent.playerId), 'p0');
  assert.equal(resolved.activeLineups.home.length, 11);
});

await test('campo ao vivo obedece activeLineups e remove expulso dos dois lados', () => {
  const result = {
    userIsHome:true, homeName:'Meu Clube', awayName:home, calendarRound:5,
    rosters:{ home:gameData.players, away:cpuRoster },
    activeLineups:{ home:gameData.players.filter(p=>p.isStarting).map(p=>p.id), away:cpuRoster.filter(p=>p.isStarting).map(p=>p.id) },
  };
  const live = {
    home:result.activeLineups.home.filter(id => id !== 'u2'),
    away:result.activeLineups.away.filter(id => id !== 'c0'),
  };
  const model = buildMatchFieldViewModel({ gameData, matchResultData:result, liveUserPlayers:gameData.players, liveActiveLineups:live });
  assert.equal(model.homeDots.some(dot => dot.id === 'u2'), false);
  assert.equal(model.awayDots.some(dot => dot.id === 'c0'), false);
  assert.equal(model.homeDots.length, 10);
  assert.equal(model.awayDots.length, 10);
});

await test('expulso marcado como indisponível não pode reentrar', () => {
  const selection = getLiveSubstitutionSelection({
    players:[
      { id:'a', name:'Titular', position:'CA', overall:70, isStarting:true },
      { id:'red', name:'Expulso', position:'CA', overall:99, isStarting:false, liveUnavailable:true },
      { id:'ok', name:'Reserva', position:'CA', overall:75, isStarting:false },
    ],
    selectedStarter:'a', matchRound:5,
  });
  assert.deepEqual(selection.reserves.map(player => player.id), ['ok']);
});


await test('timeline canônica mantém placar, eventos e contadores no mesmo snapshot', () => {
  const timeline = createLiveMatchTimeline({
    userIsHome:true,
    homeName:home,
    awayName:away,
    homeId:'user',
    awayId:'cpu',
    homeIsPlayer:true,
    awayIsPlayer:false,
    rosters:{ home:gameData.players, away:cpuRoster },
    activeLineups:{
      home:gameData.players.filter(player => player.isStarting).map(player => player.id),
      away:cpuRoster.filter(player => player.isStarting).map(player => player.id),
    },
    homeShots:0,
    awayShots:0,
    homeOnTarget:0,
    awayOnTarget:0,
    homePoss:60,
    awayPoss:60,
  });
  const goal = timeline.resolveScheduledEvent({
    narration:normalGoal,
    rawEvent:{ min:12, type:'goal', teamId:'user', teamName:home, isPlayer:true, scorer:'João Silva', scorerObj:{ id:'u9', name:'João Silva', position:'CA' } },
    sourceIndex:1,
  });
  assert.deepEqual(goal.liveState.score, { home:1, away:0 });
  assert.deepEqual(goal.liveState.counts.goals, { home:1, away:0 });
  assert.equal(goal.liveState.events.length, 1);
  assert.equal(goal.liveState.rawEvents.length, 1);
  assert.equal(goal.liveState.statistics.homeShots >= 1, true);
  assert.equal(goal.liveState.statistics.homeOnTarget >= 1, true);
  assert.deepEqual({ home:goal.liveState.statistics.homePoss, away:goal.liveState.statistics.awayPoss }, { home:50, away:50 });
});

await test('mesmo sourceIndex não contabiliza o mesmo gol duas vezes', () => {
  const timeline = createLiveMatchTimeline({ homeName:home, awayName:away, homeId:'h', awayId:'a' });
  const raw = { min:12, type:'goal', teamId:'h', teamName:home, scorer:'João Silva' };
  timeline.resolveScheduledEvent({ narration:normalGoal, rawEvent:raw, sourceIndex:7 });
  const duplicate = timeline.resolveScheduledEvent({ narration:normalGoal, rawEvent:raw, sourceIndex:7 });
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.liveState.score, { home:1, away:0 });
  assert.equal(duplicate.liveState.events.length, 1);
  assert.equal(duplicate.liveState.rawEvents.length, 1);
});

await test('apito final usa o placar canônico e não um resultado antigo do snapshot', () => {
  const timeline = createLiveMatchTimeline({
    homeName:home,
    awayName:away,
    homeId:'h',
    awayId:'a',
    homeGoals:9,
    awayGoals:9,
    homeShots:9,
    awayShots:9,
    homeOnTarget:9,
    awayOnTarget:9,
  });
  timeline.resolveScheduledEvent({
    narration:normalGoal,
    rawEvent:{ min:12, type:'goal', teamId:'h', teamName:home, scorer:'João Silva' },
    sourceIndex:0,
  });
  const end = timeline.resolveScheduledEvent({
    narration:`90'+ FIM DE JOGO: ${home} 9 x 9 ${away}`,
    rawEvent:{ min:90, type:'end', homeGoals:9, awayGoals:9 },
    sourceIndex:1,
  });
  assert.match(end.narration, new RegExp(`${home} 1 x 0 ${away}$`));
  assert.deepEqual(end.liveState.score, { home:1, away:0 });
  assert.equal(end.rawEvent.homeGoals, 1);
  assert.equal(end.rawEvent.awayGoals, 0);
  const resolved = timeline.getResolvedMatchData();
  assert.deepEqual({ home:resolved.homeGoals, away:resolved.awayGoals }, { home:1, away:0 });
});

await test('relatório de integridade exige placar igual em rawEvents, narração e resultado', () => {
  const coherent = {
    homeName:home, awayName:away, homeId:'h', awayId:'a',
    homeGoals:1, awayGoals:0, homeShots:4, awayShots:3, homeOnTarget:2, awayOnTarget:1,
    events:[normalGoal, `90'+ FIM DE JOGO: ${home} 1 x 0 ${away}`],
    rawEvents:[
      { min:12, type:'goal', teamId:'h', teamName:home, scorer:'João Silva' },
      { min:90, type:'end', homeGoals:1, awayGoals:0 },
    ],
  };
  assert.equal(buildLiveMatchIntegrityReport(coherent).valid, true);
  assert.equal(buildLiveMatchIntegrityReport({ ...coherent, homeGoals:2 }).valid, false);
  assert.equal(buildLiveMatchIntegrityReport({ ...coherent, homeOnTarget:0 }).valid, false);
});

await test('nova sessão de playback invalida a identidade da sessão anterior', () => {
  const intervalRef = { current:null };
  const matchControlsRef = { current:{} };
  let events = [];
  let score = null;
  const common = {
    intervalRef,
    matchControlsRef,
    setSimulating:() => {},
    setVisibleEvents:value => { events = typeof value === 'function' ? value(events) : value; },
    setLiveScore:value => { score = value; },
  };
  startMatchPlayback({ ...common, matchData:{ homeName:home, awayName:away, events:[normalGoal] } });
  const firstSession = matchControlsRef.current.playbackSessionId;
  startMatchPlayback({ ...common, matchData:{ homeName:home, awayName:away, events:[penaltyGoal] } });
  const secondSession = matchControlsRef.current.playbackSessionId;
  assert.equal(secondSession, firstSession + 1);
  assert.deepEqual(events, []);
  assert.deepEqual(score, { home:0, away:0 });
  matchControlsRef.current.forceEnd();
});

await test('playback publica apenas snapshots da timeline em vez de manter contador paralelo', async () => {
  const source = await readFile(new URL('../src/engines/match/matchPlayback.js', import.meta.url), 'utf8');
  const presentation = await readFile(new URL('../src/hooks/useMatchPresentation.js', import.meta.url), 'utf8');
  assert.ok(source.includes('publishLiveState'));
  assert.ok(source.includes('getLiveMatchState'));
  assert.equal(source.includes('let homeGoals = 0'), false);
  assert.equal(source.includes('let awayGoals = 0'), false);
  assert.equal(presentation.includes('matchControlsRef.current.setLiveScore?.'), false);
  assert.equal(presentation.includes('matchControlsRef.current.setVisibleEvents?.'), false);
  assert.ok(presentation.includes('matchControlsRef.current.syncLiveState?.()'));
});

console.log(`\nMatch live: ${passed}/${passed} verificações aprovadas.`);

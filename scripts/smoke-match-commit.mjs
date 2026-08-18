import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DisciplineEngine } from '../src/engines/engine_discipline.js';
import { FatigueEngine } from '../src/engines/engine_fatigue.js';
import { InjuryEngine } from '../src/engines/engine_injuries.js';
import { buildCupPostMatchState } from '../src/engines/match/matchCupRound.js';
import { applyResolvedLeagueMatchData } from '../src/engines/match/matchLeagueRound.js';
import {
  buildMatchCommitId,
  createMatchCommitTransaction,
  inspectMatchCommit,
  stampMatchCommit,
} from '../src/engines/match/matchCommitService.js';
import {
  buildUserGoalCount,
  preparePostMatchPlayers,
  processMatchPlayers,
} from '../src/engines/match/matchPlayerPostProcessor.js';
import {
  accumulateScorers,
  accumulateUserGoals,
  buildMatchMinutes,
} from '../src/engines/match/matchPlayerStats.js';
import { processFatigueAndInjuries } from '../src/engines/match/playerConditionProcessor.js';
import { syncPlayerSeasonGoals } from '../src/engines/match/matchStateUtils.js';
import { buildJournalNotification } from '../src/engines/match/matchNotificationBuilders.js';

let checks = 0;
const check = (label, fn) => {
  fn();
  checks += 1;
  console.log(`✓ ${label}`);
};

const player = (overrides = {}) => ({
  id: 'p1',
  name: 'Jogador Teste',
  position: 'CA',
  overall: 70,
  energy: 100,
  wage: 1000,
  isStarting: true,
  moralIndividual: 60,
  goals: 0,
  assists: 0,
  minutesPlayed: 0,
  discipline: { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
  ...overrides,
});

const penaltyEvent = {
  min: 30,
  type: 'penalty_goal',
  teamId: 'user',
  teamName: 'Teste FC',
  isPlayer: true,
  scorerObj: { id: 'p1', name: 'Jogador Teste', teamId: 'user', teamName: 'Teste FC', position: 'CA' },
};

check('pênalti convertido entra na artilharia estruturada', () => {
  const scorers = accumulateScorers({}, [penaltyEvent]);
  assert.equal(Object.values(scorers)[0]?.goals, 1);
});

check('pênalti convertido entra nos gols individuais sem assistência artificial', () => {
  const players = accumulateUserGoals([player(), player({ id: 'p2', name: 'Companheiro', position: 'MEI' })], [penaltyEvent], () => 0);
  assert.equal(players[0].goals, 1);
  assert.equal(players[1].assists, 0);
});

check('contagem de gols aceita pênalti e id numérico/string equivalente', () => {
  const counts = buildUserGoalCount([{ ...penaltyEvent, scorerObj: { ...penaltyEvent.scorerObj, id: 7 } }]);
  assert.equal(counts['7'], 1);
});

check('pós-processamento da Copa aplica minutos, gols e flag física de Copa', () => {
  const originalEnergy = FatigueEngine.calculateNewEnergy;
  const originalInjury = InjuryEngine.rollForInjury;
  let receivedCupFlag = false;
  try {
    FatigueEngine.calculateNewEnergy = (candidate, opts) => {
      receivedCupFlag = opts?.isCupMatch === true;
      return candidate.energy - 10;
    };
    InjuryEngine.rollForInjury = () => null;
    const gameData = {
      round: 2,
      leagueRound: 1,
      club: { name: 'Teste FC' },
      players: [player()],
      difficultyMultipliers: { fatigueLoss: 1.2, injuryChance: 1.7 },
    };
    const updated = processMatchPlayers({
      gameData,
      userMatchData: { userIsHome: true, homeGoals: 1, awayGoals: 0, isCupMatch: true, events: [] },
      allRawEvents: [penaltyEvent],
      rng: () => 0,
    });
    assert.equal(updated[0].minutesPlayed, 90);
    assert.equal(updated[0].goals, 1);
    assert.equal(updated[0].seasonGoals, 1);
    assert.equal(updated[0].energy, 90);
    assert.equal(receivedCupFlag, true);
  } finally {
    FatigueEngine.calculateNewEnergy = originalEnergy;
    InjuryEngine.rollForInjury = originalInjury;
  }
});

check('moral pós-jogo considera lesão sofrida na própria partida', () => {
  const originalEnergy = FatigueEngine.calculateNewEnergy;
  const originalInjury = InjuryEngine.rollForInjury;
  try {
    FatigueEngine.calculateNewEnergy = () => 70;
    InjuryEngine.rollForInjury = () => ({ type: 'Leve', roundsLeft: 2, recoveryMod: 0.9 });
    const [updated] = processMatchPlayers({
      gameData: {
        round: 2,
        club: { name: 'Teste FC' },
        players: [player()],
        difficultyMultipliers: { fatigueLoss: 1, injuryChance: 1 },
      },
      userMatchData: { userIsHome: true, homeGoals: 1, awayGoals: 0, isCupMatch: false, events: [] },
      allRawEvents: [],
      rng: () => 0,
    });
    assert.equal(updated.moralIndividual, 56);
    assert.equal(updated.injury?.roundsLeft, 2);
  } finally {
    FatigueEngine.calculateNewEnergy = originalEnergy;
    InjuryEngine.rollForInjury = originalInjury;
  }
});

check('multiplicador específico de lesão chega ao InjuryEngine', () => {
  const originalEnergy = FatigueEngine.calculateNewEnergy;
  const originalInjury = InjuryEngine.rollForInjury;
  let receivedMult = null;
  try {
    FatigueEngine.calculateNewEnergy = () => 80;
    InjuryEngine.rollForInjury = (_energy, mult) => { receivedMult = mult; return null; };
    processFatigueAndInjuries([player()], [], {
      difficultyMult: 1.1,
      injuryChanceMult: 2.25,
      currentRound: 9,
    });
    assert.equal(receivedMult, 2.25);
  } finally {
    FatigueEngine.calculateNewEnergy = originalEnergy;
    InjuryEngine.rollForInjury = originalInjury;
  }
});

check('lesão de partida grava histórico com a rodada real', () => {
  const originalEnergy = FatigueEngine.calculateNewEnergy;
  const originalInjury = InjuryEngine.rollForInjury;
  try {
    FatigueEngine.calculateNewEnergy = () => 70;
    InjuryEngine.rollForInjury = () => ({ type: 'Media (Muscular)', roundsLeft: 3, recoveryMod: 0.85 });
    const [updated] = processFatigueAndInjuries([player()], [], { currentRound: 11 });
    assert.equal(updated.injuryHistory.at(-1).round, 11);
    assert.equal(updated.injuryHistory.at(-1).duration, 3);
  } finally {
    FatigueEngine.calculateNewEnergy = originalEnergy;
    InjuryEngine.rollForInjury = originalInjury;
  }
});

check('lesão de treino encontra id equivalente e registra histórico', () => {
  const [updated] = preparePostMatchPlayers(
    { round: 4 },
    [player({ id: 7, isStarting: false })],
    { playerId: '7' },
    () => 0,
  );
  assert.equal(updated.injury?.roundsLeft, 1);
  assert.equal(updated.injuryHistory.at(-1).round, 6);
});

check('disciplina estruturada aceita id string/número equivalente', () => {
  const [updated] = DisciplineEngine.processMatchDisciplineEvents(
    [player({ id: 7 })],
    [],
    5,
    [{ type: 'yellow', isPlayer: true, playerId: '7', min: 20 }],
  );
  assert.equal(updated.discipline.yellowCards, 1);
});

check('rodada string não concatena ao calcular suspensão', () => {
  const [updated] = DisciplineEngine.processMatchDisciplineEvents(
    [player()],
    [],
    '5',
    [{ type: 'red_direct', isPlayer: true, playerId: 'p1', min: 50 }],
  );
  assert.equal(updated.discipline.suspendedUntilRound, 7);
});

check('nova punição nunca encurta suspensão já mais longa', () => {
  const [updated] = DisciplineEngine.processMatchDisciplineEvents(
    [player({ discipline: { yellowCards: 0, suspendedUntilRound: 10, disciplineHistory: [] } })],
    [],
    5,
    [{ type: 'yellow', isPlayer: true, playerId: 'p1', min: 10 }],
  );
  assert.equal(updated.discipline.suspendedUntilRound, 10);
});

check('fallback textual distingue segundo amarelo de vermelho direto', () => {
  const [updated] = DisciplineEngine.processMatchDisciplineEvents(
    [player()],
    [`70' 🟨🟥 SEGUNDO AMARELO! Jogador Teste está EXPULSO! (Teste FC)`],
    5,
    [],
  );
  assert.equal(updated.discipline.suspendedUntilRound, 6);
});

check('sincronização de gols da Liga aceita ids equivalentes', () => {
  const [updated] = syncPlayerSeasonGoals([player({ id: 7, seasonGoals: 0 })], {
    scorer: { id: '7', goals: 4 },
  });
  assert.equal(updated.seasonGoals, 4);
});

check('sincronização da Liga não apaga gols já marcados em Copas', () => {
  const [updated] = syncPlayerSeasonGoals([player({ id: 7, seasonGoals: 5 })], {
    scorer: { id: '7', goals: 4 },
  });
  assert.equal(updated.seasonGoals, 5);
});

const cupBaseState = () => ({
  round: 4,
  leagueRound: 2,
  season: 1,
  club: {
    name: 'Teste FC',
    money: 100000,
    wage: 1000,
    fanLoyalty: 50,
    managerProfile: { wins: 2, draws: 1, losses: 1, experience: 4 },
  },
  players: [player()],
  h2hHistory: {},
  inbox: [],
  financialHistory: [],
  cups: {},
});

const cupBaseStateWith = (overrides = {}) => ({ ...cupBaseState(), ...overrides });

const cupRound = (overrides = {}) => ({
  userIsHome: true,
  userMatchData: {
    userIsHome: true,
    homeName: 'Teste FC',
    awayName: 'Rival FC',
    homeGoals: 2,
    awayGoals: 1,
    isCupMatch: true,
  },
  cups: { copaBrasil: { status: 'active' } },
  players: [player()],
  finance: { income: 5000, expense: 1000, ticketIncome: 5000, cupEarned: 0, wage: 1000, operationalCost: 0 },
  ...overrides,
});

check('commit de Copa conta no histórico do treinador', () => {
  const state = buildCupPostMatchState(cupBaseState(), cupRound());
  assert.deepEqual(state.club.managerProfile, { wins: 3, draws: 1, losses: 1, experience: 5 });
});

check('commit de Copa mantém players e teamRosters.user no mesmo snapshot', () => {
  const state = buildCupPostMatchState(cupBaseState(), cupRound());
  assert.deepEqual(state.teamRosters.user, state.players);
});

check('ids de notificações pós-jogo distinguem temporadas diferentes', () => {
  const common = {
    userMatchData:{ userIsHome:true, homeGoals:1, awayGoals:0, awayName:'Rival' },
    updatedTable:[{ id:'user', name:'Teste FC', pts:3 }],
    leagueRoundPlayed:1,
  };
  const first = buildJournalNotification({ ...common, gameData:{ season:2026, serie:'A', club:{ name:'Teste FC' } } })[0];
  const second = buildJournalNotification({ ...common, gameData:{ season:2027, serie:'A', club:{ name:'Teste FC' } } })[0];
  assert.equal(first.id, 'jornal_s2026_r1');
  assert.equal(second.id, 'jornal_s2027_r1');
  assert.notEqual(first.id, second.id);
});

check('commit de Copa atualiza confronto direto e mantém rodada da Liga', () => {
  const state = buildCupPostMatchState(cupBaseState(), cupRound());
  assert.deepEqual(state.h2hHistory['Rival FC'], { w: 1, d: 0, l: 0 });
  assert.equal(state.leagueRound, 2);
  assert.equal(state.round, 5);
});

check('commit de Copa remove suspenso da próxima escalação', () => {
  const suspended = player({ discipline: { yellowCards: 0, suspendedUntilRound: 6, disciplineHistory: [] } });
  const state = buildCupPostMatchState(cupBaseStateWith({ players:[suspended] }), cupRound());
  assert.equal(state.players[0].isStarting, false);
});

check('lançamento financeiro da Copa usa rodada e competição corretas', () => {
  const state = buildCupPostMatchState(cupBaseState(), cupRound());
  assert.equal(state.financialHistory[0].round, 5);
  assert.equal(state.financialHistory[0].leagueRound, 2);
  assert.equal(state.financialHistory[0].competition, 'cup');
});


check('minutos da partida respeitam substituição aos 60 minutos', () => {
  const roster = [player({ id:'a', isStarting:true }), player({ id:'b', isStarting:false })];
  const minutes = buildMatchMinutes(roster, [{ outId:'a', inId:'b', min:'60' }]);
  assert.equal(minutes.a, 60);
  assert.equal(minutes.b, 30);
});

check('minutos suportam troca no intervalo e segunda troca do reserva', () => {
  const roster = [
    player({ id:'a', isStarting:true }),
    player({ id:'b', isStarting:false }),
    player({ id:'c', isStarting:false }),
  ];
  const minutes = buildMatchMinutes(roster, [
    { outId:'a', inId:'b', min:'HT' },
    { outId:'b', inId:'c', min:'70' },
  ]);
  assert.deepEqual({ a:minutes.a, b:minutes.b, c:minutes.c }, { a:45, b:25, c:20 });
});

check('pós-processamento usa minutos reais das substituições para fadiga', () => {
  const originalEnergy = FatigueEngine.calculateNewEnergy;
  const originalInjury = InjuryEngine.rollForInjury;
  const received = {};
  try {
    FatigueEngine.calculateNewEnergy = (candidate, opts) => {
      received[String(candidate.id)] = opts.minutes;
      return candidate.energy;
    };
    InjuryEngine.rollForInjury = () => null;
    processMatchPlayers({
      gameData:{
        round:2,
        club:{ name:'Teste FC' },
        players:[player({ id:'a', isStarting:true }), player({ id:'b', isStarting:false })],
      },
      userMatchData:{ userIsHome:true, homeGoals:0, awayGoals:0, events:[] },
      liveSubstitutions:[{ outId:'a', inId:'b', min:'60' }],
      rng:() => 0,
    });
    assert.deepEqual(received, { a:60, b:30 });
  } finally {
    FatigueEngine.calculateNewEnergy = originalEnergy;
    InjuryEngine.rollForInjury = originalInjury;
  }
});

check('commit de Copa incorpora minutos das trocas manuais', () => {
  const base = cupBaseStateWith({
    players:[player({ id:'a', isStarting:true }), player({ id:'b', isStarting:false })],
  });
  const state = buildCupPostMatchState(base, cupRound(), {
    liveSubstitutions:[{ outId:'a', inId:'b', min:'60' }],
    rng:() => 0.99,
  });
  assert.equal(state.players.find(p => p.id === 'a').minutesPlayed, 60);
  assert.equal(state.players.find(p => p.id === 'b').minutesPlayed, 30);
});

check('identidade do commit é determinística para a mesma partida', () => {
  const game = { season:2, round:7, leagueRound:5 };
  const match = { calendarRound:8, leagueRound:6, homeName:'Teste FC', awayName:'Rival FC', isCupMatch:false };
  assert.equal(buildMatchCommitId(game, match), buildMatchCommitId({ ...game }, { ...match }));
});

check('transação de commit detecta duplicidade e conflito de calendário', () => {
  const game = { season:2, round:7, leagueRound:5 };
  const match = { calendarRound:8, leagueRound:6, homeName:'Teste FC', awayName:'Rival FC', isCupMatch:false };
  const transaction = createMatchCommitTransaction(game, match);
  assert.equal(inspectMatchCommit(game, transaction).status, 'ready');
  const committed = stampMatchCommit({ ...game, round:8, leagueRound:6 }, transaction);
  assert.equal(inspectMatchCommit(committed, transaction).status, 'duplicate');
  assert.equal(inspectMatchCommit({ ...game, round:8 }, transaction).status, 'conflict');
});


check('commit valida integridade canônica antes de persistir a partida', () => {
  const source = readFileSync(new URL('../src/hooks/useMatchEngine.js', import.meta.url), 'utf8');
  assert.ok(source.includes('buildLiveMatchIntegrityReport'));
  assert.ok(source.includes('if (!integrity.valid)'));
  const integrityIndex = source.indexOf('buildLiveMatchIntegrityReport(liveMatchData)');
  const buildIndex = source.indexOf('const built = buildState?.', integrityIndex);
  assert.ok(integrityIndex >= 0 && buildIndex > integrityIndex);
});

check('orquestrador possui lock síncrono e commit tardio idempotente', () => {
  const source = readFileSync(new URL('../src/hooks/useMatchEngine.js', import.meta.url), 'utf8');
  assert.ok(source.includes('matchStartLockRef.current'));
  assert.ok(source.includes('createMatchCommitTransaction'));
  assert.ok(source.includes('liveSubstitutions'));
  assert.ok(source.includes('persistGameState(committedState)'));
});

check('persistência serializa gravações para o commit mais novo vencer', () => {
  const source = readFileSync(new URL('../src/hooks/hooks_persistence.js', import.meta.url), 'utf8');
  assert.ok(source.includes('saveQueueRef.current'));
  assert.ok(source.includes('const saveName = currentSave'));
  assert.ok(source.includes("saveQueueRef.current = task.then"));
});

check('diálogo publica substituições reais para a transação de commit', () => {
  const source = readFileSync(new URL('../src/components/match/SubstitutionDialog.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('controls.liveSubstitutions = nextSubstitutions'));
  assert.ok(source.includes('registerLiveSubstitution'));
});


check('manutenção pós-partida entra no mesmo commit antes da persistência', () => {
  const source = readFileSync(new URL('../src/hooks/useMatchEngine.js', import.meta.url), 'utf8');
  const maintenanceIndex = source.indexOf('buildRoundMaintenance(stampedState');
  const persistIndex = source.indexOf('persistGameState(committedState)', maintenanceIndex);
  assert.ok(maintenanceIndex >= 0);
  assert.ok(persistIndex > maintenanceIndex);
});

check('manutenção de avanço sem partida persiste sem criar oferta formal', () => {
  const source = readFileSync(new URL('../src/hooks/useRoundMaintenance.js', import.meta.url), 'utf8');
  assert.ok(source.includes('allowTransferOffers: false'));
  assert.ok(source.includes("typeof persistGameState === 'function'"));
  assert.ok(source.includes('persistGameState(result.state)'));
});


check('expulsão encerra minutos exatamente no momento do cartão', () => {
  const roster = [player({ id:'a', isStarting:true }), player({ id:'b', isStarting:false })];
  const minutes = buildMatchMinutes(roster, [], [
    { min:55, type:'red_direct', isPlayer:true, playerId:'a', playerName:'Jogador Teste' },
  ]);
  assert.equal(minutes.a, 55);
  assert.equal(minutes.b, 0);
});

check('reserva que entra e depois é expulso recebe apenas minutos realmente jogados', () => {
  const roster = [player({ id:'a', isStarting:true }), player({ id:'b', isStarting:false })];
  const minutes = buildMatchMinutes(roster, [{ outId:'a', inId:'b', min:'60' }], [
    { min:70, type:'red_direct', isPlayer:true, playerId:'b', playerName:'Reserva' },
  ]);
  assert.equal(minutes.a, 60);
  assert.equal(minutes.b, 10);
});

check('assistência posterior não é atribuída a jogador que já saiu', () => {
  const roster = [
    player({ id:'out', name:'Saiu', position:'MEI', isStarting:true }),
    player({ id:'mate', name:'Ficou', position:'MEI', isStarting:true }),
    player({ id:'in', name:'Entrou', position:'CA', isStarting:false }),
  ];
  const raw = [
    { min:60, type:'sub', isPlayer:true, changes:[{ outgoingId:'out', incomingId:'in' }] },
    { min:80, type:'goal', teamId:'user', teamName:'Teste FC', isPlayer:true, scorerObj:{ id:'in', name:'Entrou', teamId:'user', teamName:'Teste FC', position:'CA' } },
  ];
  const updated = accumulateUserGoals(roster, raw, () => 0);
  assert.equal(updated.find(candidate => candidate.id === 'out').assists, 0);
  assert.equal(updated.find(candidate => candidate.id === 'mate').assists, 1);
  assert.equal(updated.find(candidate => candidate.id === 'in').goals, 1);
});

check('placar reconciliado atualiza fixture e reconstrói a tabela antes do commit', () => {
  const preMatchTable = [
    { id:'user', name:'Teste FC', p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 },
    { id:'cpu', name:'Rival FC', p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 },
  ];
  const match = {
    home:{ id:'user', name:'Teste FC' },
    away:{ id:'cpu', name:'Rival FC' },
    played:true,
    result:'1 - 0',
    events:['antigo'],
  };
  const leagueRound = {
    leagueIdx:0,
    userMatchIndex:0,
    userRawEventRange:{ start:0, count:0 },
    allRawEvents:[],
    currentMatches:[match],
    fixtures:[[match]],
    table:[
      { ...preMatchTable[0], p:1,w:1,gf:1,pts:3 },
      { ...preMatchTable[1], p:1,l:1,ga:1 },
    ],
    userMatchData:{ preMatchTable, homeGoals:1, awayGoals:0, events:['antigo'], rawEvents:[] },
  };
  const patched = applyResolvedLeagueMatchData(leagueRound, {
    homeGoals:0,
    awayGoals:2,
    events:['90\' Fim de jogo'],
    rawEvents:[],
  });
  assert.equal(patched.fixtures[0][0].result, '0 - 2');
  assert.equal(patched.currentMatches[0].result, '0 - 2');
  assert.equal(patched.table[0].id, 'cpu');
  assert.equal(patched.table[0].pts, 3);
  assert.equal(patched.table.find((row) => row.id === 'user').p, 1);
  assert.equal(patched.table.find((row) => row.id === 'user').l, 1);
});

check('commit da Liga troca somente os rawEvents da partida do usuário', () => {
  const cpuBefore = { min:10, type:'goal', isPlayer:false, scorerObj:{ id:'cpu1', name:'CPU 1' } };
  const userBefore = { min:20, type:'goal', isPlayer:true, scorerObj:{ id:'old', name:'Saiu' } };
  const cpuAfter = { min:30, type:'yellow', isPlayer:false, playerId:'cpu2' };
  const resolvedUser = { min:20, type:'goal', isPlayer:true, scorerObj:{ id:'new', name:'Entrou' } };
  const leagueRound = {
    leagueIdx:0,
    userMatchIndex:1,
    userRawEventRange:{ start:1, count:1 },
    allRawEvents:[cpuBefore, userBefore, cpuAfter],
    currentMatches:[{ events:['cpu'] }, { events:['antigo'] }],
    fixtures:[[{ events:['cpu'] }, { events:['antigo'] }]],
    userMatchData:{ events:['antigo'], rawEvents:[userBefore] },
  };
  const patched = applyResolvedLeagueMatchData(leagueRound, { events:['novo'], rawEvents:[resolvedUser] });
  assert.equal(patched.allRawEvents[0], cpuBefore);
  assert.equal(patched.allRawEvents[2], cpuAfter);
  assert.equal(patched.allRawEvents[1].scorerObj.id, 'new');
  assert.deepEqual(patched.currentMatches[1].events, ['novo']);
  assert.deepEqual(patched.fixtures[0][1].events, ['novo']);
});

console.log(`Match commit smoke: ${checks}/${checks} verificações aprovadas.`);

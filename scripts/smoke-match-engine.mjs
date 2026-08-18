import assert from 'node:assert/strict';
import { inspectMatchStart, findIllegalStarter } from '../src/engines/match/matchPreflight.js';
import { advanceInactiveCalendarSlots, getInactiveCupSkipCount, findNextPlayableCalendarSlot } from '../src/engines/calendar/idleCalendarAdvance.js';
import { DisciplineEngine } from '../src/engines/engine_discipline.js';
import { simulateLeagueRound } from '../src/engines/match/matchLeagueRound.js';
import {
  advanceStadium,
  buildManagerProfile,
  syncPlayerSeasonGoals,
  updateHeadToHead,
} from '../src/engines/match/matchStateUtils.js';

const makePlayer = (id, position = 'MC') => ({
  id, name:`Jogador ${id}`, position, overall:70, energy:100, wage:1000,
  isStarting:true, moralIndividual:60, discipline:{ suspendedUntilRound:null },
});
const starters = [
  makePlayer('gk','GOL'), makePlayer('z1','ZAG'), makePlayer('z2','ZAG'),
  makePlayer('ld','LD'), makePlayer('le','LE'), makePlayer('v1','VOL'),
  makePlayer('v2','VOL'), makePlayer('m1','MEI'), makePlayer('pd','PD'),
  makePlayer('pe','PE'), makePlayer('ca','CA'),
];
const baseTable = [
  { id:'user', name:'Teste FC', p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 },
  { id:'cpu', name:'CPU FC', p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 },
];
const sourceMatch = {
  home:{ id:'user', name:'Teste FC', isPlayer:true, strength:70 },
  away:{ id:'cpu', name:'CPU FC', isPlayer:false, strength:68 },
};
const gameData = {
  round:0, leagueRound:0, serie:'A', morale:60,
  club:{ name:'Teste FC', formation:'4-3-3', fanLoyalty:50, stadium:{capacity:15000,ticketPrice:40}, managerProfile:{} },
  players:starters,
  fixtures:[[sourceMatch]],
  calendar:[{ type:'league', leagueIdx:0 }],
  cups:{},
  table:baseTable,
  teamRosters:{ cpu:[makePlayer('cpu-ca','CA')] },
  difficultyMultipliers:{},
};

const incompletePreflight = inspectMatchStart({ ...gameData, players:starters.slice(0,10) });
assert.equal(incompletePreflight.status, 'lineup-count');
assert.equal(incompletePreflight.validation.missingStarters, 1, '10 titulares devem reportar exatamente 1 vaga, nunca valor negativo');

const duplicatedStarters = starters.map((player, index) => index === 10 ? { ...player, id:'pe' } : player);
const duplicatedPreflight = inspectMatchStart({ ...gameData, players:duplicatedStarters });
assert.equal(duplicatedPreflight.status, 'lineup-count', '11 registros com ID repetido não equivalem a 11 jogadores');
assert.equal(duplicatedPreflight.validation.uniqueStarterCount, 10);

const noGoalkeeper = starters.map((player, index) => index === 0 ? { ...player, position:'MC' } : player);
assert.equal(inspectMatchStart({ ...gameData, players:noGoalkeeper }).status, 'lineup-invalid', 'partida sem goleiro deve ser bloqueada');
assert.equal(inspectMatchStart({ ...gameData, club:{ ...gameData.club, formation:'9-9-9' } }).status, 'lineup-invalid', 'formação inexistente deve ser bloqueada');

const ambiguousFixture = {
  ...gameData,
  fixtures:[[{ home:{ id:'a', name:'A' }, away:{ id:'b', name:'B' } }]],
};
assert.equal(inspectMatchStart(ambiguousFixture).status, 'identity-invalid', 'partida não pode adivinhar o lado do usuário');

const normalizedIdentityFixture = {
  ...gameData,
  fixtures:[[{ home:{ id:'legacy-user', name:'  TESTE   fc  ' }, away:{ id:'cpu', name:'CPU FC' } }]],
};
assert.equal(inspectMatchStart(normalizedIdentityFixture).status, 'ready', 'nome legado deve ser comparado de forma normalizada');

const injured = { ...starters[0], injury:{ type:'Leve' } };
assert.equal(findIllegalStarter({ ...gameData, players:[injured, ...starters.slice(1)] }, [injured, ...starters.slice(1)]).id, 'gk');
assert.equal(inspectMatchStart(gameData).status, 'ready');


// Beta 46 — passagem de tempo em slots de Copa sem partida.
const idleCalendarBase = {
  ...gameData,
  round:0,
  leagueRound:0,
  calendar:[
    { type:'cup', cupKey:'copaBrasil', phase:'3ª Fase', leg:'leg1' },
    { type:'league', leagueIdx:0 },
  ],
  cups:{},
};
assert.equal(getInactiveCupSkipCount(idleCalendarBase), 1, 'slot de Copa sem confronto deve ser detectado como data ociosa');
assert.equal(findNextPlayableCalendarSlot(idleCalendarBase).slotIndex, 1, 'próxima partida real deve pular a Copa inativa');
const idleBeforeLineup = inspectMatchStart({ ...idleCalendarBase, players:starters.slice(0, 9) });
assert.equal(idleBeforeLineup.status, 'skip-inactive-cups', 'data sem jogo deve avançar antes de exigir 11 titulares');

const rested = advanceInactiveCalendarSlots({
  ...idleCalendarBase,
  players:[{ ...makePlayer('rest','CA'), age:25, energy:50, isStarting:false }],
});
assert.equal(rested.state.round, 1);
assert.equal(rested.state.leagueRound, 0, 'descanso não pode consumir rodada de Liga');
assert.equal(rested.state.players[0].energy, 65, 'jogador saudável deve recuperar energia na data sem jogo');
assert.equal(rested.state.teamRosters.user[0].energy, 65, 'descanso deve atualizar o espelho canônico do elenco');

const healed = advanceInactiveCalendarSlots({
  ...idleCalendarBase,
  players:[{ ...makePlayer('inj','CA'), energy:40, injury:{ type:'Leve', roundsLeft:1, recoveryMod:1 }, isStarting:false }],
}, { rng:()=>0 });
assert.equal(healed.state.players[0].injury, null, 'lesão deve poder terminar durante uma data de descanso');
assert.equal(healed.state.players[0].energy, 60, 'lesionado deve receber recuperação física da data');
assert.equal(healed.recoveredPlayers[0].id, 'inj');

const oneGameBan = advanceInactiveCalendarSlots({
  ...idleCalendarBase,
  players:[{ ...makePlayer('ban','CA'), isStarting:false, discipline:{ yellowCards:0, suspendedUntilRound:1, disciplineHistory:[] } }],
});
assert.equal(oneGameBan.state.players[0].discipline.suspendedUntilRound, 2, 'slot sem jogo não pode consumir suspensão');
assert.equal(DisciplineEngine.isPlayerSuspended(oneGameBan.state.players[0], 2), true, 'suspensão deve valer para a próxima partida real');

const twoIdleSlots = advanceInactiveCalendarSlots({
  ...idleCalendarBase,
  calendar:[
    { type:'cup', cupKey:'copaBrasil', leg:'leg1' },
    { type:'cup', cupKey:'libertadores', leg:'leg1' },
    { type:'league', leagueIdx:0 },
  ],
  players:[{ ...makePlayer('ban2','CA'), isStarting:false, discipline:{ yellowCards:0, suspendedUntilRound:1, disciplineHistory:[] } }],
});
assert.equal(twoIdleSlots.skippedSlots, 2);
assert.equal(twoIdleSlots.state.round, 2);
assert.equal(twoIdleSlots.state.players[0].discipline.suspendedUntilRound, 3, 'duas datas vazias devem preservar a suspensão até a partida seguinte');
assert.equal(DisciplineEngine.isPlayerSuspended(twoIdleSlots.state.players[0], 3), true);

const before = JSON.stringify(gameData.fixtures);
const simulated = simulateLeagueRound({
  gameData,
  leagueIdx:0,
  tactics:{ isValid:true, avgStrength:70, counts:{}, req:{}, improvised:[], adapted:[] },
  starters,
});
assert.equal(simulated.empty, false);
assert.equal(JSON.stringify(gameData.fixtures), before, 'simulateLeagueRound não pode mutar fixtures originais');
assert.equal(gameData.table[0].p, 0, 'simulateLeagueRound não pode mutar a tabela original');
assert.equal(simulated.fixtures[0][0].played, true);
assert.match(simulated.fixtures[0][0].result, /^\d+ - \d+$/);
assert.equal(simulated.table.reduce((sum,row)=>sum+row.p,0), 2);

const repeatedRound = simulateLeagueRound({
  gameData:{ ...gameData, fixtures:simulated.fixtures, table:simulated.table },
  leagueIdx:0,
  tactics:{ isValid:true, avgStrength:70, counts:{}, req:{}, improvised:[], adapted:[] },
  starters,
});
assert.equal(repeatedRound.alreadyPlayed, true, 'rodada já registrada deve ser reconhecida sem nova simulação');
assert.equal(repeatedRound.table.reduce((sum,row)=>sum+row.p,0), 2, 'rodada repetida não pode duplicar PJ');

assert.throws(() => simulateLeagueRound({
  gameData:{
    ...gameData,
    table:[...baseTable, { id:'cpu2', name:'CPU 2', p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }, { id:'cpu3', name:'CPU 3', p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }],
    fixtures:[[
      { ...sourceMatch, played:true, result:'1 - 0' },
      { home:{id:'cpu2',name:'CPU 2'}, away:{id:'cpu3',name:'CPU 3'}, played:false, result:null },
    ]],
  },
  leagueIdx:0,
  tactics:{ isValid:true, avgStrength:70, counts:{}, req:{}, improvised:[], adapted:[] },
  starters,
}), /parcialmente processada/, 'rodada parcialmente gravada deve bloquear ressimulação');


const legacyGameData = {
  ...gameData,
  fixtures: [[{
    home: { id:'user', name:'Teste FC', strength:70 },
    away: { id:'cpu', name:'CPU FC', strength:68 },
  }]],
};
const legacySimulated = simulateLeagueRound({
  gameData: legacyGameData,
  leagueIdx: 0,
  tactics: { isValid:true, avgStrength:70, counts:{}, req:{}, improvised:[], adapted:[] },
  starters,
});
assert.ok(legacySimulated.userMatchData, 'fixture legado com id=user deve continuar sendo reconhecido');
assert.equal(legacySimulated.userMatchData.userIsHome, true);

const playersWithGoals = syncPlayerSeasonGoals(
  [{id:'a',seasonGoals:0},{id:'b',seasonGoals:2}],
  { one:{id:'a',goals:5} },
);
assert.equal(playersWithGoals[0].seasonGoals, 5);
assert.equal(playersWithGoals[1].seasonGoals, 2);

assert.deepEqual(updateHeadToHead({}, 'Teste FC', { homeName:'Teste FC', awayName:'CPU FC', homeGoals:2, awayGoals:1 }), {
  'CPU FC':{ w:1,d:0,l:0 },
});
assert.deepEqual(buildManagerProfile({}, 'Teste FC', { homeName:'Teste FC', awayName:'CPU FC', homeGoals:1, awayGoals:1 }), {
  wins:0, draws:1, losses:0, experience:1,
});

const stadium = advanceStadium({ capacity:15000, level:1, underConstruction:1, pendingCapacity:5000, pendingLevel:2 });
assert.equal(stadium.completed, true);
assert.equal(stadium.stadium.capacity, 20000);
assert.equal(stadium.stadium.underConstruction, null);

console.log('match engine smoke tests: 41/41 OK');

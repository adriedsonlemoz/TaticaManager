import assert from 'node:assert/strict';
import { inspectMatchStart, findIllegalStarter } from '../src/engines/match/matchPreflight.js';
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

assert.equal(inspectMatchStart({ ...gameData, players:starters.slice(0,10) }).status, 'lineup-count');
const injured = { ...starters[0], injury:{ type:'Leve' } };
assert.equal(findIllegalStarter({ ...gameData, players:[injured, ...starters.slice(1)] }, [injured, ...starters.slice(1)]).id, 'gk');
assert.equal(inspectMatchStart(gameData).status, 'ready');

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

console.log('match engine smoke tests: 15/15 OK');

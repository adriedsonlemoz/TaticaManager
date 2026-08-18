import assert from 'node:assert/strict';
import {
  buildOpponentStarters,
  getAggregateInfo,
  getRecentLeagueForm,
  getSeasonEndSummary,
  resolveNextMatchContext,
  sortNextMatchPlayers,
} from '../src/engines/nextmatch/nextMatchViewModel.js';

const makeLeagueResult = (opponent, userGoals, opponentGoals, userAtHome = true) => ({
  played: true,
  result: userAtHome ? `${userGoals}-${opponentGoals}` : `${opponentGoals}-${userGoals}`,
  home: userAtHome ? { isPlayer: true, name: 'User' } : { name: opponent },
  away: userAtHome ? { name: opponent } : { isPlayer: true, name: 'User' },
});

const form = getRecentLeagueForm({
  // Deliberadamente maior que fixtures para representar calendário com slots de Copa.
  round: 12,
  fixtures: [
    [makeLeagueResult('A', 2, 0)],
    [makeLeagueResult('B', 1, 1)],
    [makeLeagueResult('C', 0, 1)],
    [],
    [makeLeagueResult('D', 3, 1)],
  ],
});
assert.deepEqual(form, ['V', 'D', 'E', 'V']);

const aggregateAhead = getAggregateInfo(true, {
  leg: 'leg2',
  tie: {
    home: { name: 'User', isPlayer: true },
    away: { name: 'CPU' },
    leg1: { played: true, home: 2, away: 0 },
  },
});
assert.equal(aggregateAhead.requirementTone, 'ahead');
assert.match(aggregateAhead.requirementText, /2 gols/);

const aggregateBehind = getAggregateInfo(true, {
  leg: 'leg2',
  tie: {
    home: { name: 'CPU' },
    away: { name: 'User', isPlayer: true },
    leg1: { played: true, home: 3, away: 1 },
  },
});
assert.equal(aggregateBehind.requirementTone, 'behind');
assert.match(aggregateBehind.requirementText, /3\+/);

const roster = Array.from({ length: 15 }, (_, index) => ({
  id: index,
  name: `P${index}`,
  position: index === 0 ? 'GOL' : index < 4 ? 'ZAG' : index < 7 ? 'VOL' : index < 10 ? 'MC' : 'CA',
  overall: 90 - index,
}));
const opponentStarters = buildOpponentStarters({ teamRosters: { cpu: roster } }, { id: 'cpu' });
assert.equal(opponentStarters.length, 11);
assert.equal(opponentStarters[0].position, 'GOL');

const ordered = sortNextMatchPlayers([
  { id: 1, position: 'CA', overall: 90 },
  { id: 2, position: 'GOL', overall: 70 },
  { id: 3, position: 'ZAG', overall: 80 },
]);
assert.deepEqual(ordered.map((player) => player.position), ['GOL', 'ZAG', 'CA']);


const skippedContext = resolveNextMatchContext({
  round:0,
  club:{ name:'User' },
  cups:{},
  calendar:[
    { type:'cup', cupKey:'copaBrasil', leg:'leg1' },
    { type:'league', leagueIdx:0 },
  ],
  fixtures:[[{ home:{ id:'user', name:'User', isPlayer:true }, away:{ id:'cpu', name:'CPU' } }]],
});
assert.equal(skippedContext.slotIndex, 1, 'pré-jogo deve apontar para a próxima partida real');
assert.equal(skippedContext.skippedSlots, 1, 'pré-jogo deve informar quantas datas inativas serão puladas');
assert.equal(skippedContext.calendarEntry.type, 'league');
assert.equal(skippedContext.userSide, 'home');


const idleOnlyContext = resolveNextMatchContext({
  round:0,
  club:{ name:'User' },
  cups:{},
  calendar:[
    { type:'cup', cupKey:'copaBrasil', leg:'leg1' },
    { type:'cup', cupKey:'libertadores', leg:'leg1' },
  ],
  fixtures:[],
});
assert.equal(idleOnlyContext.idleOnly, true, 'calendário com apenas datas inativas deve expor etapa de descanso');
assert.equal(idleOnlyContext.skippedSlots, 2, 'etapa final deve avançar todas as datas inativas restantes');

const season = getSeasonEndSummary({
  round: 2,
  calendar: [{}, {}],
  fixtures: [],
  table: [{ id: 'user', pts: 70 }, { id: 'cpu', pts: 60 }],
});
assert.equal(season.seasonOver, true);
assert.equal(season.position, 1);

console.log('nextMatch smoke tests: 16/16 OK');

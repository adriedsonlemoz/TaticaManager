import assert from 'node:assert/strict';
import { AcademyEngine } from '../src/engines/engine_academy.js';
import {
  buildAcademyViewModel,
  dispenseProspectState,
  getAcademyProspects,
  getProspectDevelopmentProgress,
  getProspectWage,
  getTrajectoryInfo,
  investAcademyState,
  promoteProspectState,
} from '../src/engines/academy/academyViewModel.js';

const ready = { id:'ready', name:'Pronto', age:18, overall:60, potential:75, value:100000, wage:2000, position:'CA', trajectory:'late' };
const young = { id:'young', name:'Jovem', age:16, overall:50, potential:70, value:50000, wage:2000, position:'VOL', trajectory:'burst' };
const duplicated = { ...ready, overall:61 };
const state = {
  round: 10,
  club: { name:'Teste FC', academyLevel:'advanced', money:5_000_000, wage:20_000 },
  players: [{ id:'pro', wage:20_000 }],
  academy: [young, ready],
  academyReady: [duplicated],
  financialHistory: [],
};

assert.deepEqual(AcademyEngine.mergeProspectPools([ready], [duplicated]).map(p => p.id), ['ready']);
assert.deepEqual(getAcademyProspects(state).map(p => p.id), ['young', 'ready']);
assert.equal(buildAcademyViewModel(state, 'ready').filteredProspects.length, 1);
assert.equal(buildAcademyViewModel(state, 'all').stats.readyCount, 1);
assert.equal(buildAcademyViewModel(state, 'all').stats.mostCommonPosition, 'CA');
assert.equal(getTrajectoryInfo('desconhecida').key, 'steady');
assert.equal(getProspectDevelopmentProgress({ overall: 10, potential: 70 }), 0);
assert.equal(getProspectDevelopmentProgress({ overall: 90, potential: 80 }), 100);
assert.equal(getProspectWage({ value:100000 }), 3000);

const promoted = promoteProspectState(state, ready);
assert.ok(promoted.players.some(p => p.id === 'ready'));
assert.equal(promoted.academy.some(p => p.id === 'ready'), false);
assert.equal(promoted.academyReady.some(p => p.id === 'ready'), false);
assert.equal(promoted.club.wage, promoted.players.reduce((sum,p)=>sum+(p.wage||0),0));

const dispensed = dispenseProspectState(state, 'ready');
assert.equal(dispensed.academy.some(p => p.id === 'ready'), false);
assert.equal(dispensed.academyReady.some(p => p.id === 'ready'), false);

assert.equal(AcademyEngine.investAcademy(state, 'basic').error, 'A academia só pode ser evoluída para um nível superior.');
assert.equal(AcademyEngine.investAcademy(state, 'advanced').error, 'A academia só pode ser evoluída para um nível superior.');
assert.equal(AcademyEngine.investAcademy({ ...state, club:{...state.club, money:1000} }, 'elite').error, 'Saldo insuficiente.');

const investment = investAcademyState(state, 'elite');
assert.equal(investment.error, undefined);
assert.equal(investment.state.club.academyLevel, 'elite');
assert.equal(investment.state.club.money, 1_000_000);
assert.equal(investment.state.financialHistory[0].expense, 4_000_000);

const proDuplicateState = { ...state, players:[...state.players, { id:'ready', wage:3000 }] };
assert.deepEqual(getAcademyProspects(proDuplicateState).map(p => p.id), ['young']);

console.log('academy smoke tests: 23/23 OK');

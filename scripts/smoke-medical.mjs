import assert from 'node:assert/strict';
import {
  MEDICAL_COSTS,
  buildMedicalViewModel,
  recoverPlayerEnergyState,
  runPhysioSessionState,
  treatInjuryState,
} from '../src/engines/medical/medicalViewModel.js';

let checks = 0;
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const state = {
  round: 5,
  club: { name:'Teste FC', money:2_000_000 },
  financialHistory: [],
  players: [
    { id:'inj', name:'João Lesão', energy:20, injury:{ type:'Muscular', roundsLeft:2 }, discipline:{ suspendedUntilRound:6 } },
    { id:'susp', name:'Carlos Suspenso', energy:100, discipline:{ suspendedUntilRound:6 } },
    { id:'crit', name:'Rui Cansado', energy:40 },
    { id:'low', name:'Beto Baixo', energy:60 },
    { id:'ok', name:'Nando Inteiro', energy:90 },
  ],
};

const vm = buildMedicalViewModel(state);
eq(MEDICAL_COSTS.TREAT_INJURY, 500_000);
eq(vm.currentRound, 6, 'status médico deve olhar a próxima rodada');
eq(vm.counts.injured, 1);
eq(vm.counts.suspended, 2);
eq(vm.counts.criticalFatigue, 1);
eq(vm.counts.lowEnergy, 1);
eq(vm.counts.uniqueProblems, 4, 'lesionado+suspenso deve contar uma vez no total único');
eq(vm.allHealthy, false);
eq(buildMedicalViewModel({ club:{}, players:[{ id:'ok', energy:100 }] }).allHealthy, true);

const noInjury = treatInjuryState(state, 'ok');
eq(noInjury.error, 'Jogador não possui lesão ativa.');
const poorTreat = treatInjuryState({ ...state, club:{ ...state.club, money:100 } }, 'inj');
ok(Boolean(poorTreat.error));
const treated = treatInjuryState(state, 'inj');
eq(treated.state.club.money, 1_500_000);
eq(treated.state.players.find(p => p.id === 'inj').injury.roundsLeft, 1);
eq(treated.state.financialHistory[0].expense, 500_000);
ok(treated.state.financialHistory[0].detail.description.includes('João Lesão'));
const healed = treatInjuryState({ ...state, players:state.players.map(p => p.id === 'inj' ? { ...p, injury:{ ...p.injury, roundsLeft:1 } } : p) }, 'inj');
eq(healed.state.players.find(p => p.id === 'inj').injury, null);

const recoverInjured = recoverPlayerEnergyState(state, 'inj');
ok(Boolean(recoverInjured.error));
const recoverPoor = recoverPlayerEnergyState({ ...state, club:{ ...state.club, money:100 } }, 'crit');
ok(Boolean(recoverPoor.error));
const recovered = recoverPlayerEnergyState(state, 'crit');
eq(recovered.state.players.find(p => p.id === 'crit').energy, 75);
eq(recovered.state.club.money, 1_850_000);
eq(recovered.state.financialHistory[0].expense, 150_000);
const recoverFull = recoverPlayerEnergyState(state, 'susp');
eq(recoverFull.error, 'Jogador já está com energia máxima.');

const emptyPhysio = runPhysioSessionState({ club:{ money:1_000_000 }, players:[] });
ok(Boolean(emptyPhysio.error));
const fullPhysio = runPhysioSessionState({ club:{ money:1_000_000 }, players:[{ id:'x', energy:100 }] });
ok(Boolean(fullPhysio.error));
const poorPhysio = runPhysioSessionState({ ...state, club:{ ...state.club, money:100 } });
ok(Boolean(poorPhysio.error));
const physio = runPhysioSessionState(state);
eq(physio.state.players.find(p => p.id === 'crit').energy, 55);
eq(physio.state.players.find(p => p.id === 'susp').energy, 100, 'energia não pode passar de 100');
eq(physio.state.club.money, 1_700_000);
eq(physio.state.financialHistory[0].expense, 300_000);

console.log(`medical smoke tests: ${checks}/${checks} OK`);

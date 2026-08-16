import assert from 'node:assert/strict';
import {
  POSITION_ORDER,
  buildSquadViewModel,
  decorateSquadPlayer,
  getSquadGroup,
  sortSquadPlayers,
} from '../src/engines/squad/squadViewModel.js';

let checks = 0;
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const deep = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const players = [
  { id:'gk', name:'Goleiro', position:'GOL', overall:75, age:29, energy:90, value:1_000_000, isStarting:true },
  { id:'ld', name:'Lateral D', position:'LD', overall:71, age:22, energy:80, value:700_000, isStarting:true },
  { id:'zag', name:'Zagueiro', position:'ZAG', overall:78, age:28, energy:70, value:1_200_000, isStarting:true },
  { id:'le', name:'Lateral E', position:'LE', overall:72, age:23, energy:65, value:750_000, isStarting:true },
  { id:'vol', name:'Volante', position:'VOL', overall:76, age:27, energy:60, value:900_000, isStarting:true },
  { id:'mc', name:'Meia C', position:'MC', overall:80, age:24, energy:55, value:1_500_000, isStarting:true },
  { id:'mei', name:'Meia O', position:'MEI', overall:82, age:26, energy:50, value:2_000_000, isStarting:true },
  { id:'pd', name:'Ponta D', position:'PD', overall:79, age:21, energy:45, value:1_400_000, isStarting:true },
  { id:'pe', name:'Ponta E', position:'PE', overall:77, age:20, energy:40, value:1_300_000, isStarting:true, injury:{ type:'Leve' }, discipline:{ suspendedUntilRound:6 } },
  { id:'ca', name:'Centro', position:'CA', overall:84, age:25, energy:35, value:3_000_000, isStarting:true },
  { id:'ata', name:'Atacante Antigo', position:'ATA', overall:70, age:30, energy:30, value:600_000, isStarting:true },
  { id:'bench', name:'Reserva', position:'MC', overall:68, age:19, energy:20, value:400_000, isStarting:false, contract:1 },
];

ok(POSITION_ORDER.LD < POSITION_ORDER.ZAG);
ok(POSITION_ORDER.MC < POSITION_ORDER.PD);
eq(getSquadGroup(players, 'all').length, 12);
eq(getSquadGroup(players, 'starters').length, 11);
eq(getSquadGroup(players, 'bench').length, 1);
eq(getSquadGroup(players, 'gk').length, 1);
eq(getSquadGroup(players, 'def').length, 3);
eq(getSquadGroup(players, 'mid').length, 4);
eq(getSquadGroup(players, 'att').length, 4);

deep(sortSquadPlayers(players, 'position').slice(0, 4).map(p => p.id), ['gk','ld','zag','le']);
eq(sortSquadPlayers(players, 'overall')[0].id, 'ca');
eq(sortSquadPlayers(players, 'energy')[0].id, 'bench');
eq(sortSquadPlayers(players, 'age')[0].id, 'bench');

const decorated = decorateSquadPlayer(players.find(p => p.id === 'pe'), 5);
eq(decorated.status.injured, true);
eq(decorated.status.suspended, true);
eq(decorated.status.unavailable, true);
eq(decorated.status.energyBand.ovrPenalty, 5);
const contract = decorateSquadPlayer(players.find(p => p.id === 'bench'), 5);
eq(contract.contract.key, 'last_year');
const legacyDefaults = decorateSquadPlayer({ id:'legacy', name:'Legado', energy:null, contract:null }, 5);
eq(legacyDefaults.status.energy, 100, 'energia ausente deve manter fallback legado de 100%');
eq(legacyDefaults.contract.key, 'short', 'contrato ausente deve manter fallback legado de 2 temporadas');

const state = {
  round:5, serie:'A', season:2,
  club:{ name:'Teste FC', formation:'4-3-3' },
  players,
};
const vm = buildSquadViewModel(state, 'att', 'position');
eq(vm.currentRound, 6, 'status do elenco deve olhar a próxima rodada');
eq(vm.starters.length, 11);
eq(vm.bench.length, 1);
eq(vm.formation, '4-3-3');
eq(vm.injuredCount, 1);
eq(vm.suspendedCount, 1);
eq(vm.unavailableCount, 1, 'um jogador lesionado+suspenso deve ser um único desfalque');
eq(vm.list.length, 4);
deep(vm.list.map(row => row.player.id), ['pd','pe','ca','ata'], 'posições ofensivas modernas devem seguir ordem conhecida');
eq(vm.teamOvr, Math.round(players.filter(p => p.isStarting).reduce((sum,p)=>sum+p.overall,0)/11));
eq(vm.totalValue, players.reduce((sum,p)=>sum+p.value,0));
eq(vm.tabs.find(tab => tab.id === 'mid').count, 4);

console.log(`squad smoke tests: ${checks}/${checks} OK`);

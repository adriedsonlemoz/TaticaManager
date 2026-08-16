import assert from 'node:assert/strict';
import {
  FIELD_LAYOUTS,
  assignStartersToField,
  buildFieldViewModel,
  getFieldLayout,
  getFieldPlayerName,
} from '../src/engines/field/fieldViewModel.js';
import { calculateMorale, getRecentMoraleResults } from '../src/engines/core/moraleEngine.js';
import { parseMatchEvent } from '../src/engines/match/matchEventParser.js';
import { getAgeColor, getPositionColor, ovrColor, posColor } from '../src/utils/playerVisuals.js';
import { calculateMorale as legacyCalculateMorale, SMR_parseEvent } from '../src/helpers.js';

let checks = 0;
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); checks += 1; };
const deep = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

for (const formation of ['4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3','5-3-2','4-1-4-1','4-5-1']) {
  eq(FIELD_LAYOUTS[formation].length, 11, `${formation} deve ter 11 slots`);
}
eq(getFieldLayout('desconhecida'), FIELD_LAYOUTS['4-4-2'], 'formação desconhecida deve usar fallback seguro');
eq(FIELD_LAYOUTS['4-1-4-1'].filter(slot => slot.role === 'MC').length, 2);
eq(FIELD_LAYOUTS['4-5-1'].filter(slot => slot.role === 'CA').length, 1);

const starters = FIELD_LAYOUTS['4-4-2'].map((slot, index) => ({
  id:`p${index}`,
  name:`Jogador Sobrenome${index}`,
  position:slot.role,
  overall:70 + (index % 5),
  energy:100 - index,
  isStarting:true,
}));
const assigned = assignStartersToField(starters, '4-4-2');
eq(assigned.length, 11);
eq(new Set(assigned.map(marker => marker.player.id)).size, 11, 'um titular não pode ocupar dois slots');
eq(assigned[0].player.position, 'GOL');

const adapted = starters.map(player => ({ ...player }));
adapted[5] = { ...adapted[5], position:'MC', adaptedPosition:'PD' };
const adaptedField = assignStartersToField(adapted, '4-4-2');
eq(adaptedField.find(marker => marker.role === 'PD').player.id, adapted[5].id, 'posição adaptada deve orientar o desenho do campo');

const suspended = starters.map((player, index) => index === 0
  ? { ...player, discipline:{ suspendedUntilRound:6 } }
  : player);
const vm = buildFieldViewModel({ starters:suspended, formation:'4-4-2', teamOvr:73, gameData:{ round:5 } });
eq(vm.currentRound, 6, 'campo deve avaliar a próxima partida');
eq(vm.teamOvr, 73);
eq(vm.startersCount, 11);
eq(vm.markers[0].status.suspended, true, 'suspensão da próxima rodada deve aparecer no campo');
eq(getFieldPlayerName({ name:'João Nome MuitoLongo' }), 'MuitoLon');

const fixtures = [
  [{ home:{ isPlayer:true }, away:{}, played:true, result:'2-0' }],
  [{ home:{}, away:{ isPlayer:true }, played:true, result:'1-1' }],
  [{ home:{ isPlayer:true }, away:{}, played:true, result:'0-3' }],
];
deep(getRecentMoraleResults(fixtures), [0,1,3], 'forma moral deve usar partidas jogadas mais recentes');
const moraleState = { fixtures, round:99, morale:60 };
ok(calculateMorale(moraleState) >= 10 && calculateMorale(moraleState) <= 100);
eq(legacyCalculateMorale(moraleState), calculateMorale(moraleState), 'barril legado deve apontar para o novo motor de moral');
eq(calculateMorale({ fixtures:[], morale:60 }), 59);

const goal = parseMatchEvent("12' ⚽ GOL! (João Silva)");
eq(goal.type, 'goal');
eq(goal.minute, 12);
eq(goal.player, 'João Silva');
eq(parseMatchEvent("90' FIM DE JOGO").type, 'end');
eq(SMR_parseEvent("44' 🟨 para Carlos (falta)").type, 'yellow', 'alias legado do parser deve continuar disponível');

eq(getPositionColor('LAT'), '#0369a1');
eq(getPositionColor('ATA'), '#b91c1c');
deep(posColor('GOL'), { bg:'#c8920f', text:'#000' });
eq(ovrColor(80), '#32a852');
eq(ovrColor(70), '#b87a00');
eq(ovrColor(69), '#941818');
eq(getAgeColor(20), 'success');
eq(getAgeColor(30), 'warning');

console.log(`field/helpers smoke tests: ${checks}/${checks} OK`);

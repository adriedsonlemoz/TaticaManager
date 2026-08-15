import assert from 'node:assert/strict';
import {
  acceptManagerOfferState,
  buildGeneratedMessages,
  combineAndSortMessages,
  countUnreadByType,
  emptyTrashState,
  filterMessages,
  getMessageDate,
  getMessagePreview,
  getMessageTypeLabel,
  markMessageReadState,
  partitionMessages,
  permanentlyDeleteMessageState,
} from '../src/engines/inbox/inboxService.js';
import { CpuAI } from '../src/engines/engine_cpu_ai.js';

const money = value => `R$ ${Number(value).toLocaleString('pt-BR')}`;
const gameData = {
  round: 0,
  serie: 'A',
  club: { name: 'Teste FC', manager: 'Ada', money: 2_000_000, wage: 2_000_000 },
  players: Array.from({ length: 10 }, (_, i) => ({ id: i, wage: 200_000, isStarting: true })),
  table: [{ id: 'user', name: 'Teste FC' }],
};

const generated = buildGeneratedMessages(gameData, money);
assert.ok(generated.some(m => m.id === 'welcome'));
assert.ok(generated.some(m => m.id === 'squad_analysis'));
assert.ok(generated.some(m => m.id.startsWith('wage_warning_')));

assert.equal(getMessageTypeLabel('contract'), 'CONTRATO');
assert.equal(getMessageTypeLabel('imprensa'), 'IMPRENSA');
assert.equal(getMessageDate({ round: 7 }), 'Rodada 7');
assert.equal(getMessagePreview({ body: 'Primeira linha\nSegunda linha' }), 'Primeira linha Segunda linha');

const readIds = new Set(['read']);
const sorted = combineAndSortMessages([
  { id: 'read', type: 'IMPRENSA' },
  { id: 'msg_1700000000000', type: 'RUMOR' },
], [], readIds);
assert.equal(sorted[0].id, 'msg_1700000000000');

const partitioned = partitionMessages(
  [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  new Set(['b']),
  new Set(['c']),
);
assert.deepEqual(partitioned.inboxMessages.map(m => m.id), ['a']);
assert.deepEqual(partitioned.trashMessages.map(m => m.id), ['b']);

const filtered = filterMessages([
  { id: 1, subject: 'Proposta de compra', from: 'Flamengo', type: 'TRANSFERÊNCIA' },
  { id: 2, subject: 'Relatório médico', from: 'Médico', type: 'COMISSÃO' },
], 'flamengo');
assert.equal(filtered.length, 1);
assert.equal(filtered[0].id, 1);

const counts = countUnreadByType([
  { id: 1, type: 'contract' },
  { id: 2, type: 'CONTRATO' },
  { id: 3, type: 'IMPRENSA' },
], new Set([3]));
assert.deepEqual(counts, { CONTRATO: 2 });

const marked = markMessageReadState({ readMsgIds: ['x'] }, 'x');
assert.deepEqual(marked.readMsgIds, ['x']);

const deletedDynamic = permanentlyDeleteMessageState({
  inbox: [{ id: 'd' }, { id: 'e' }],
  trashMsgIds: ['d'],
  readMsgIds: ['d'],
}, { id: 'd', isDynamic: true });
assert.deepEqual(deletedDynamic.inbox.map(m => m.id), ['e']);
assert.deepEqual(deletedDynamic.readMsgIds, []);

const emptied = emptyTrashState({
  inbox: [{ id: 'dyn' }, { id: 'stay' }],
  erasedMsgIds: [],
  readMsgIds: ['dyn'],
  trashMsgIds: ['dyn', 'static'],
}, [
  { id: 'dyn', isDynamic: true },
  { id: 'static', isDynamic: false },
]);
assert.deepEqual(emptied.inbox.map(m => m.id), ['stay']);
assert.deepEqual(emptied.erasedMsgIds, ['static']);
assert.deepEqual(emptied.trashMsgIds, []);

const offerMessage = {
  id: 'offer',
  actionData: { type: 'managerOffer', offeringClub: { id: 'cpu', name: 'Clube CPU' }, offeredSalary: 90000 },
};
const accepted = acceptManagerOfferState({ round: 12, trashMsgIds: [] }, offerMessage);
assert.equal(accepted.pendingManagerTransfer.acceptedAtRound, 12);
assert.deepEqual(accepted.trashMsgIds, ['offer']);

const renewal = CpuAI.applyContractRenewal(
  [{ id: 'p1', name: 'Jogador', wage: 10000, contract: 1 }],
  { money: 100000, wage: 10000 },
  'p1', 20000, () => 0,
);
assert.equal(renewal.error, null);
assert.equal(renewal.players[0].contract, 3);
assert.equal(renewal.players[0].wage, 11000);
assert.equal(renewal.club.money, 80000);
assert.equal(renewal.club.wage, 11000);

console.log('inbox smoke tests: 12/12 OK');

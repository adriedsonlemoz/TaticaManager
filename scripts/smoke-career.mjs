import assert from 'node:assert/strict';
import {
  buildCareerViewModel,
  buildHeadToHead,
  buildSeasonHistory,
  getFanLoyaltySummary,
  getManagerInitials,
  getManagerLevel,
  getMoraleSummary,
} from '../src/engines/career/careerViewModel.js';
import {
  acceptManagerOfferState,
  declineManagerOfferState,
  findPendingManagerOffer,
} from '../src/engines/career/managerOfferService.js';

assert.deepEqual(getManagerLevel(0, '#999'), { label:'Novato', color:'#999', min:0, next:5, experience:0, progressPct:0 });
assert.equal(getManagerLevel(100).label, 'Lendário');
assert.equal(getManagerLevel(100).progressPct, 100);
assert.equal(getManagerLevel(35).progressPct, 50);
assert.equal(getManagerInitials('Ada Lovelace'), 'AL');
assert.equal(getManagerInitials('  Pelé  '), 'P');

const offer = { id:'offer-1', actionData:{ type:'managerOffer', offeringClub:{ id:'cpu', name:'CPU FC' }, offeredSalary:90000 } };
assert.equal(findPendingManagerOffer({ inbox:[offer], trashMsgIds:[] })?.id, 'offer-1');
assert.equal(findPendingManagerOffer({ inbox:[offer], trashMsgIds:['offer-1'] }), null);

const accepted = acceptManagerOfferState({ round:8, trashMsgIds:['x','offer-1'] }, offer);
assert.equal(accepted.pendingManagerTransfer.offeringClub.name, 'CPU FC');
assert.equal(accepted.pendingManagerTransfer.acceptedAtRound, 8);
assert.deepEqual(accepted.trashMsgIds, ['x','offer-1']);

const declined = declineManagerOfferState({ trashMsgIds:['x'] }, 'offer-1');
assert.deepEqual(declined.trashMsgIds, ['x','offer-1']);

const history = buildSeasonHistory([
  { season:2025, serie:'B', position:2, wins:10, draws:5, losses:5 },
  { season:2026, serie:'A', position:1, wins:20, draws:10, losses:8 },
]);
assert.equal(history[0].season, 2026);
assert.equal(history[0].winPct, 53);
assert.equal(history[0].positionIcon, '🏆');

const h2h = buildHeadToHead({
  A:{ w:3,d:0,l:1 }, B:{ w:1,d:1,l:0 }, C:{ w:0,d:1,l:0 },
});
assert.equal(h2h[0].name, 'A');
assert.equal(h2h[0].winPct, 75);

assert.equal(getMoraleSummary(81).label, 'Excelente');
assert.equal(getFanLoyaltySummary(10).label, 'Revoltada');

const vm = buildCareerViewModel({
  club:{ manager:'Ada Lovelace', managerProfile:{ wins:2, draws:1, losses:1, experience:22, style:'Ofensivo' } },
  table:[{ id:'cpu' }, { id:'user', p:4, w:3, d:0, l:1, gf:8, ga:3, pts:9 }],
  inbox:[offer], trashMsgIds:[], careerHistory:[], h2hHistory:{},
});
assert.equal(vm.myPos, 2);
assert.equal(vm.seasonWinPct, 75);
assert.equal(vm.goalDifference, 5);
assert.equal(vm.initials, 'AL');
assert.equal(vm.managerLevel.label, 'Veterano');

console.log('career smoke tests: 18/18 OK');

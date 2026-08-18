import assert from 'node:assert/strict';
import {
  MONTH_NAMES, WEEK_DAYS, WEEK_DAYS_SHORT, getCupColor, getMatchResult,
  getCupInfoForSlot, getCupTeams, buildRoundDates, buildDayRoundsMap,
  getMatchesForDay, getCalendarWindow, getCalendarMonthOffsetForRound,
  buildUpcomingEvents, buildRecentResults,
} from '../src/engines/matches/matchesViewModel.js';
import {
  formatMoneyBR, resolveSaveName, getLeagueRoundForMaintenance,
  didJustCompleteLeagueMatch, buildRoundMaintenance, buildRoundMaintenanceKey,
  hasAppliedRoundMaintenance, applyQuickPlayerSale,
  updatePlayerShirtState, updatePlayerWageState,
} from '../src/engines/app/gameControllerService.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; console.log(`✅ ${name}`); }
  catch (error) { console.error(`❌ ${name}`); throw error; }
};
const team = (id, name, isPlayer = false) => ({ id, name, isPlayer });
const user = team('user', 'Meu Clube', true);
const rival = team('r1', 'Rival');
const other = team('r2', 'Outro');
const leagueMatch = { home: user, away: rival, played: true, result: '2-1' };
const roundDates = buildRoundDates(6);

// Calendário / partidas (25)
test('nomes dos meses continuam completos', () => assert.equal(MONTH_NAMES.length, 12));
test('dias curtos e grade semanal preservados', () => { assert.equal(WEEK_DAYS_SHORT.length, 7); assert.equal(WEEK_DAYS.length, 7); });
test('cor da Copa do Brasil é resolvida', () => assert.equal(getCupColor('🏆 Copa do Brasil'), '#00695c'));
test('resultado identifica vitória como mandante', () => assert.equal(getMatchResult(leagueMatch).outcome, 'win'));
test('resultado identifica vitória como visitante', () => assert.equal(getMatchResult({ home:rival, away:user, result:'0-3' }).outcome, 'win'));
test('resultado identifica empate', () => assert.equal(getMatchResult({ home:user, away:rival, result:'1-1' }).outcome, 'draw'));
test('resultado inválido retorna null', () => assert.equal(getMatchResult({ home:user, away:rival, result:'x-y' }), null));
test('janela mensal limita offset negativo', () => assert.equal(getCalendarWindow(roundDates, -4).displayMonthIdx, 0));
test('offset mensal da rodada é calculado pela data real', () => assert.equal(getCalendarMonthOffsetForRound(roundDates, 0), 0));
test('mapa diário inclui rodada de Liga do usuário', () => {
  const gd = { calendar:[{ type:'league', leagueIdx:0 }], fixtures:[[leagueMatch]] };
  const map = buildDayRoundsMap({ gameData:gd, currentRound:1, roundDates });
  assert.equal(Object.values(map)[0][0].isUser, true);
});
test('mapa diário marca Liga passada como jogada', () => {
  const gd = { calendar:[{ type:'league', leagueIdx:0 }], fixtures:[[leagueMatch]] };
  const event = Object.values(buildDayRoundsMap({ gameData:gd, currentRound:1, roundDates }))[0][0];
  assert.equal(event.played, true);
});
test('filtro CAMP remove eventos de Copa', () => {
  const map = { '2026-3-4': [{ isCup:false }, { isCup:true }] };
  assert.equal(getMatchesForDay(map, 2026, 3, 4, 'CAMP').length, 1);
});
test('filtro COPA remove eventos de Liga', () => {
  const map = { '2026-3-4': [{ isCup:false }, { isCup:true }] };
  assert.equal(getMatchesForDay(map, 2026, 3, 4, 'COPA').length, 1);
});

const playedTie = {
  phase:'3ª Fase', home:user, away:rival,
  leg1:{ played:true, home:1, away:0, round:2, events:[] },
  leg2:{ played:true, home:2, away:2, round:4, events:[] },
  penalties:{ home:4, away:3 },
};
const playedCups = { copaBrasil:{ status:'active', history:[playedTie], currentTie:null } };
const playedEntry = { type:'cup', cupKey:'copaBrasil', phase:'3ª Fase', leg:'leg1', afterLeague:2 };
test('slot de Copa já jogado é recuperado do histórico', () => assert.equal(getCupInfoForSlot(playedCups, playedEntry).played, true));
test('times da volta são invertidos', () => {
  const teams = getCupTeams({ tie:playedTie, leg:'leg2' });
  assert.equal(teams.home.id, rival.id); assert.equal(teams.away.id, user.id);
});
test('mapa diário reconstrói placar de Copa jogada', () => {
  const gd = { calendar:[playedEntry], fixtures:Array.from({length:6},()=>[]), cups:playedCups };
  const event = Object.values(buildDayRoundsMap({ gameData:gd, currentRound:1, roundDates }))[0][0];
  assert.equal(event.match.result, '1-0');
});
test('próximos jogos encontra Liga futura', () => {
  const gd = { calendar:[{type:'league',leagueIdx:0}], fixtures:[[{...leagueMatch, played:false, result:null}]] };
  assert.equal(buildUpcomingEvents({ gameData:gd, currentRound:0, roundDates }).length, 1);
});
const pendingTie = { phase:'3ª Fase', home:user, away:rival, leg1:{played:false, round:2}, leg2:{played:false, round:4} };
const pendingCups = { copaBrasil:{ status:'active', phase:'3ª Fase', currentTie:pendingTie, history:[] } };
test('próximos jogos encontra Copa ainda não jogada', () => {
  const gd = { calendar:[{ type:'cup', cupKey:'copaBrasil', phase:'3ª Fase', leg:'leg1', afterLeague:2 }], fixtures:Array.from({length:6},()=>[]), cups:pendingCups };
  const events = buildUpcomingEvents({ gameData:gd, currentRound:0, roundDates });
  assert.equal(events[0].isCup, true);
});
test('limite de próximos jogos é respeitado', () => {
  const calendar = Array.from({length:6}, (_,i)=>({type:'league',leagueIdx:i}));
  const fixtures = Array.from({length:6},()=>[[{home:user,away:rival}]][0]);
  assert.equal(buildUpcomingEvents({ gameData:{calendar,fixtures}, currentRound:0, roundDates, limit:3 }).length, 3);
});
test('recentes usa apenas Ligas já jogadas no calendário', () => {
  const gd = { calendar:[{type:'league',leagueIdx:0},{type:'league',leagueIdx:1}], fixtures:[[leagueMatch],[{...leagueMatch,result:'0-1'}]] };
  assert.equal(buildRecentResults({ gameData:gd, currentRound:1, roundDates }).length, 1);
});
test('recentes mantém fallback para save sem calendário', () => {
  const gd = { calendar:[], leagueRound:1, fixtures:[[leagueMatch]] };
  assert.equal(buildRecentResults({ gameData:gd, currentRound:1, roundDates }).length, 1);
});
test('recentes inclui ida de Copa', () => {
  const gd = { calendar:[], leagueRound:0, fixtures:[], cups:playedCups };
  assert.ok(buildRecentResults({ gameData:gd, currentRound:0, roundDates, limit:10 }).some(item => item.legLabel === 'Jogo de Ida'));
});
test('recentes inclui pênaltis da volta no objeto de partida', () => {
  const gd = { calendar:[], leagueRound:0, fixtures:[], cups:playedCups };
  const item = buildRecentResults({ gameData:gd, currentRound:0, roundDates, limit:10 }).find(x => x.legLabel === 'Jogo de Volta');
  assert.equal(item.match.penalties.home, 4);
});
test('recentes remove duplicata entre histórico e currentTie', () => {
  const cups = { copaBrasil:{ status:'active', history:[playedTie], currentTie:playedTie } };
  const gd = { calendar:[], fixtures:[], cups };
  assert.equal(buildRecentResults({ gameData:gd, currentRound:0, roundDates, limit:10 }).length, 2);
});
test('recentes são ordenados da data mais nova para a antiga', () => {
  const gd = { calendar:[{type:'league',leagueIdx:0},{type:'league',leagueIdx:1}], fixtures:[[leagueMatch],[{...leagueMatch,result:'1-0'}]] };
  const recent = buildRecentResults({ gameData:gd, currentRound:2, roundDates });
  assert.ok(recent[0].date >= recent[1].date);
});
test('slot de Copa ausente retorna hasCupMatch false', () => assert.equal(getCupInfoForSlot({}, playedEntry).hasCupMatch, false));

// Controlador principal puro (20)
test('formatador monetário usa padrão brasileiro', () => assert.ok(formatMoneyBR(123456).includes('123.456')));
test('nome do save é extraído de metadata', () => assert.equal(resolveSaveName({name:'Carreira 1'}), 'Carreira 1'));
test('nome do save string é preservado', () => assert.equal(resolveSaveName('Carreira 2'), 'Carreira 2'));
test('rodada de Liga explícita tem prioridade', () => assert.equal(getLeagueRoundForMaintenance({round:9,leagueRound:7}), 7));
test('rodada de Liga é derivada do calendário em save intermediário', () => assert.equal(getLeagueRoundForMaintenance({round:3,calendar:[{type:'league'},{type:'cup'},{type:'league'}]}), 2));
test('detecta que último jogo concluído foi Liga', () => assert.equal(didJustCompleteLeagueMatch({round:2,calendar:[{type:'cup'},{type:'league'}]}), true));
test('detecta que último jogo concluído foi Copa', () => assert.equal(didJustCompleteLeagueMatch({round:2,calendar:[{type:'league'},{type:'cup'}]}), false));
const basePlayer = { id:'p1', name:'Atleta Um', position:'CA', overall:70, value:1_000_000, wage:10_000, isStarting:true, contract:2, discipline:{yellowCards:0,suspendedUntilRound:null,disciplineHistory:[]} };
test('manutenção retira lesionado dos titulares', () => {
  const gd = {round:1,leagueRound:1,calendar:[{type:'league'}],players:[{...basePlayer,injury:{rounds:2}}],inbox:[]};
  assert.equal(buildRoundMaintenance(gd,{rng:()=>0}).state.players[0].isStarting,false);
});
test('manutenção retira suspenso da próxima partida', () => {
  const gd = {round:1,leagueRound:1,calendar:[{type:'league'}],players:[{...basePlayer,discipline:{yellowCards:0,suspendedUntilRound:2,disciplineHistory:[]}}],inbox:[]};
  assert.equal(buildRoundMaintenance(gd,{rng:()=>0}).state.players[0].isStarting,false);
});
test('auto-bench limpa posição adaptada', () => {
  const gd = {round:1,leagueRound:1,calendar:[{type:'league'}],players:[{...basePlayer,adaptedPosition:'PD',injury:{rounds:1}}],inbox:[]};
  assert.equal(buildRoundMaintenance(gd,{rng:()=>0}).state.players[0].adaptedPosition,null);
});
test('proposta de transferência usa id determinístico por temporada e rodada', () => {
  const values=[0.9,0,0.5,0]; let i=0;
  const gd={season:2026,round:1,leagueRound:1,calendar:[{type:'league'}],players:[{...basePlayer,isStarting:false,isListed:true}],inbox:[]};
  const result=buildRoundMaintenance(gd,{rng:()=>values[i++] ?? 0});
  assert.equal(result.state.inbox[0].actionData.type,'sell');
  assert.equal(result.state.inbox[0].id,'msg_transfer_s2026_r1_p1');
});
test('chance baixa não gera proposta, mas carimba manutenção', () => {
  const gd={season:2026,round:1,leagueRound:1,calendar:[{type:'league'}],players:[{...basePlayer,isStarting:false,isListed:true}],inbox:[]};
  const result=buildRoundMaintenance(gd,{rng:()=>0.1});
  assert.equal(result.state.inbox.length,0);
  assert.equal(result.state.lastRoundMaintenance.key,'s2026|r1');
});
test('manutenção é idempotente na mesma temporada/rodada', () => {
  const gd={season:2026,round:2,leagueRound:1,players:[{...basePlayer,isStarting:false,isListed:true}],inbox:[]};
  const first=buildRoundMaintenance(gd,{rng:()=>0.9});
  const second=buildRoundMaintenance(first.state,{rng:()=>0.9});
  assert.equal(buildRoundMaintenanceKey(first.state),'s2026|r2');
  assert.equal(hasAppliedRoundMaintenance(first.state),true);
  assert.equal(second.changed,false);
  assert.equal(second.state,first.state);
});
test('avanço de calendário sem partida pode desabilitar proposta formal', () => {
  const gd={season:2026,round:2,leagueRound:1,calendar:[{type:'league'},{type:'cup'}],players:[{...basePlayer,isStarting:false,isListed:true}],inbox:[]};
  const result=buildRoundMaintenance(gd,{rng:()=>0.9,allowTransferOffers:false});
  assert.equal(result.state.inbox.length,0);
});
test('manutenção não cria segundo sistema concorrente de aviso contratual', () => {
  const gd={season:2026,round:5,leagueRound:5,players:[{...basePlayer,isStarting:false,contract:0}],inbox:[]};
  const result=buildRoundMaintenance(gd,{rng:()=>0});
  assert.equal(result.state.inbox.some(m=>String(m.id).startsWith('contract_')),false);
});
test('venda rápida atualiza caixa, orçamento e folha', () => {
  const state={round:3,players:[basePlayer],club:{money:100,transferBudget:50,wage:10_000},financialHistory:[],teamRosters:{user:[basePlayer]}};
  const next=applyQuickPlayerSale(state,basePlayer,800);
  assert.equal(next.club.money,900); assert.equal(next.club.transferBudget,850); assert.equal(next.club.wage,0);
});
test('venda rápida remove jogador de teamRosters.user', () => {
  const state={players:[basePlayer],club:{},teamRosters:{user:[basePlayer]}};
  assert.equal(applyQuickPlayerSale(state,basePlayer,0).teamRosters.user.length,0);
});
test('venda rápida decrementa contador do clube de origem', () => {
  const p={...basePlayer,previousTeam:'rival'};
  const state={players:[p],club:{},transfersFromTeam:{rival:2}};
  assert.equal(applyQuickPlayerSale(state,p,0).transfersFromTeam.rival,1);
});
test('camisa válida é convertida para inteiro', () => {
  const next=updatePlayerShirtState({players:[basePlayer]},'p1','9'); assert.equal(next.players[0].shirt,9);
});
test('camisa inválida preserva o estado', () => {
  const state={players:[basePlayer]}; assert.equal(updatePlayerShirtState(state,'p1','abc'),state);
});
test('ajuste salarial não altera duração do contrato e recalcula folha', () => {
  const p2={...basePlayer,id:'p2',wage:5_000};
  const next=updatePlayerWageState({players:[basePlayer,p2],club:{wage:15_000}},'p1',20_000,3);
  assert.equal(next.players[0].contract,2); assert.equal(next.club.wage,25_000);
});
test('salário vigente não pode ser reduzido por atalho', () => {
  const next=updatePlayerWageState({players:[basePlayer],club:{wage:10_000},teamRosters:{user:[basePlayer]}},'p1',1_000);
  assert.equal(next.players[0].wage,10_000);
  assert.equal(next.teamRosters.user[0].wage,10_000);
});
test('proposta local identifica clube CPU comprador real', () => {
  const roster=Array.from({length:20},(_,i)=>({...basePlayer,id:`cpu-${i}`,teamId:'a1',teamName:'CPU FC',isStarting:i<11}));
  const buyer={id:'a1',name:'CPU FC',money:5_000_000,budget:3_000_000,squad:roster};
  const values=[0.9,0,0.5,0]; let i=0;
  const gd={season:2026,round:3,leagueRound:3,players:[{...basePlayer,isStarting:false,isListed:true}],inbox:[],teams:[buyer],leagues:{A:[buyer],B:[],C:[],D:[]},teamRosters:{a1:roster}};
  const result=buildRoundMaintenance(gd,{rng:()=>values[i++] ?? 0});
  assert.equal(result.state.inbox[0].from,'CPU FC');
  assert.equal(result.state.inbox[0].actionData.teamId,'a1');
});

console.log(`\nMatches/App smoke: ${passed}/49 verificações aprovadas.`);
assert.equal(passed,49);

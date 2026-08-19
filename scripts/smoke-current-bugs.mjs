import assert from 'node:assert/strict';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { simulateLeagueRound } from '../src/engines/match/matchLeagueRound.js';
import { simulateCupRound } from '../src/engines/match/matchCupRound.js';
import { processFatigueAndInjuries } from '../src/engines/match/playerConditionProcessor.js';
import { buildBottomNavViewModel } from '../src/engines/navigation/bottomNavViewModel.js';
import { CupsEngine } from '../src/engines/cups_engine.js';
import { CalendarEngine } from '../src/engines/CalendarEngine.js';

let checks = 0;
const check = (label, fn) => { fn(); checks += 1; console.log(`✅ ${label}`); };
const constantRng = (value = 0.42) => () => value;
const startersOf = (state) => state.players.slice(0, 11).map((player) => ({ ...player, isStarting:true }));

check('simulação de Liga respeita RNG injetado também em placar e público', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', { formation:'4-4-2' });
  const starters = startersOf(state);
  const a = simulateLeagueRound({ gameData:state, leagueIdx:0, tactics:{}, starters, rng:constantRng(.31) });
  const b = simulateLeagueRound({ gameData:state, leagueIdx:0, tactics:{}, starters, rng:constantRng(.31) });
  assert.deepEqual(
    [a.userMatchData.homeGoals, a.userMatchData.awayGoals, a.userMatchData.attendance],
    [b.userMatchData.homeGoals, b.userMatchData.awayGoals, b.userMatchData.attendance],
  );
});

check('simulação de Copa respeita a mesma fonte aleatória até a renda de público', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', { formation:'4-4-2' });
  state.cups = CupsEngine.autoInitCupsForSeason(state, true);
  state.calendar = CalendarEngine.buildCalendar(state.fixtures.length, state.cups, state.serie, { season:state.season });
  const entry = state.calendar.find((item) => item?.type === 'cup' && CalendarEngine.getCupMatchForCalendarSlot(state.cups, item)?.hasCupMatch);
  assert.ok(entry, 'deve existir partida de Copa ativa');
  const starters = startersOf(state);
  const a = simulateCupRound({ gameData:state, calendarEntry:entry, tactics:{}, starters, rng:constantRng(.37) });
  const b = simulateCupRound({ gameData:state, calendarEntry:entry, tactics:{}, starters, rng:constantRng(.37) });
  assert.deepEqual(
    [a.userMatchData.homeGoals, a.userMatchData.awayGoals, a.userMatchData.attendance, a.finance.ticketIncome],
    [b.userMatchData.homeGoals, b.userMatchData.awayGoals, b.userMatchData.attendance, b.finance.ticketIncome],
  );
});

check('fadiga e lesões deixam de escapar para Math.random durante teste/replay', () => {
  const players = [{ id:'p1', name:'Atleta Teste', age:25, position:'ATA', energy:20, isStarting:true, injury:null, injuryHistory:[] }];
  const opts = { currentRound:4, matchMinutes:{ p1:90 }, injuryChanceMult:1, difficultyMult:1, rng:constantRng(.01) };
  const a = processFatigueAndInjuries(players, [], opts);
  const b = processFatigueAndInjuries(players, [], opts);
  assert.deepEqual(a, b);
  assert.ok(a[0].energy <= 20);
  assert.ok(a[0].injury, 'rng baixo deve produzir lesão em atleta exausto');
});

check('menu do clube mostra rodada da Liga e não índice geral com Copas', () => {
  const state = getInitialGameState('br-flamengo', 'Manager', { formation:'4-4-2' });
  state.leagueRound = 3;
  state.round = 9;
  state.calendar = Array.from({ length:20 }, (_, index) => ({ type:index % 2 ? 'cup' : 'league' }));
  const vm = buildBottomNavViewModel(state);
  assert.equal(vm.club.round, 3);
  assert.equal(vm.club.roundTotal, state.fixtures.length);
});

console.log(`\nBugs atuais: ${checks}/${checks} verificações aprovadas.`);

import assert from 'node:assert/strict';
import { CalendarEngine } from '../src/engines/CalendarEngine.js';
import {
  initRegionalCompetition,
  registerRegionalResult,
  getRegionalMatchForCalendarSlot,
} from '../src/engines/cups/regionalEngine.js';
import { REGIONAL_2026_CONFIGS } from '../src/engines/cups/regionalConfig.js';
import { validateCalendarSpacing } from '../src/engines/calendar/calendarDateEngine.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { CupsEngine } from '../src/engines/cups_engine.js';
import { simulateCupRound } from '../src/engines/match/matchCupRound.js';

let checks = 0;
const check = (name, fn) => {
  fn(); checks += 1; console.log(`✅ ${name}`);
};
const game = (teamId, name, serie = 'A') => ({
  season:2026, serie,
  club:{ existingTeamId:teamId, teamId, name, strength:72 },
});

check('Copa do Nordeste usa 20 clubes em quatro grupos de cinco', () => {
  const config = REGIONAL_2026_CONFIGS.copaNordeste;
  assert.equal(Object.keys(config.groups).length, 4);
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [5,5,5,5]);
  assert.equal(new Set(Object.values(config.groups).flat()).size, 20);
});

check('Copa Sul-Sudeste usa 12 clubes em dois grupos de seis', () => {
  const config = REGIONAL_2026_CONFIGS.copaSulSudeste;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6]);
  assert.equal(new Set(Object.values(config.groups).flat()).size, 12);
});

check('Copa Verde usa 24 clubes em quatro grupos de seis', () => {
  const config = REGIONAL_2026_CONFIGS.copaVerde;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6,6,6]);
  assert.equal(new Set(Object.values(config.groups).flat()).size, 24);
});

check('clube elegível recebe automaticamente sua regional', () => {
  const cup = initRegionalCompetition(game('br-vitoria', 'Vitória'), { rng:() => 0.4 });
  assert.equal(cup.competitionKey, 'copaNordeste');
  assert.equal(cup.userGroupKey, 'A');
  assert.equal(cup.groupMatches.length, 5);
  assert.equal(cup.calendarEvents.length, 10);
});

check('clube da Sul-Sudeste joga seis partidas na primeira fase', () => {
  const cup = initRegionalCompetition(game('br-chapecoense', 'Chapecoense', 'B'), { rng:() => 0.4 });
  assert.equal(cup.competitionKey, 'copaSulSudeste');
  assert.equal(cup.groupMatches.length, 6);
  assert.equal(cup.calendarEvents.length, 10);
});

check('clube da Copa Verde joga cinco partidas na primeira fase', () => {
  const cup = initRegionalCompetition(game('br-paysandu', 'Paysandu', 'B'), { rng:() => 0.4 });
  assert.equal(cup.competitionKey, 'copaVerde');
  assert.equal(cup.groupMatches.length, 5);
  assert.equal(cup.calendarEvents.length, 10);
});

check('clube não elegível não recebe regional inventada', () => {
  assert.equal(initRegionalCompetition(game('br-flamengo', 'Flamengo')), null);
});

check('participação continental bloqueia regional', () => {
  assert.equal(initRegionalCompetition(game('br-vitoria', 'Vitória'), { hasContinental:true }), null);
});

check('rodada regional resolve exatamente um jogo do usuário', () => {
  const cup = initRegionalCompetition(game('br-vitoria', 'Vitória'), { rng:() => 0.4 });
  const info = getRegionalMatchForCalendarSlot(cup, { isGroup:true, regionalRound:0, leg:'leg1' });
  assert.equal(info.hasCupMatch, true);
  assert.equal(Boolean(info.tie.home.isPlayer) !== Boolean(info.tie.away.isPlayer), true);
});

check('vitórias na fase de grupos classificam para o mata-mata', () => {
  let cup = initRegionalCompetition(game('br-vitoria', 'Vitória'), { rng:() => 0.4 });
  for (let round = 0; round < cup.groupMatches.length; round += 1) {
    const match = cup.groupMatches[round];
    const userHome = match.home.isPlayer;
    cup = registerRegionalResult(cup, { isGroup:true, regionalRound:round }, userHome ? 2 : 0, userHome ? 0 : 2, () => 0.4);
  }
  assert.equal(cup.status, 'active');
  assert.equal(cup.phase, 'knockout');
  assert.equal(cup.phaseLabel, 'Quartas de Final');
  assert.ok(cup.currentTie);
});

check('resultado regional não pode ser aplicado duas vezes no mesmo slot', () => {
  let cup = initRegionalCompetition(game('br-paysandu', 'Paysandu'), { rng:() => 0.4 });
  cup = registerRegionalResult(cup, { isGroup:true, regionalRound:0 }, 2, 0, () => 0.4);
  const played = cup.group.find((team) => team.isPlayer)?.p;
  cup = registerRegionalResult(cup, { isGroup:true, regionalRound:0 }, 9, 0, () => 0.4);
  assert.equal(cup.group.find((team) => team.isPlayer)?.p, played);
});

check('calendário regional usa janela anual e mantém espaçamento seguro', () => {
  const regional = initRegionalCompetition(game('br-vitoria', 'Vitória'), { rng:() => 0.4 });
  const calendar = CalendarEngine.buildCalendar(38, { regional }, 'A', { season:2026 });
  const entries = calendar.filter((entry) => entry.cupKey === 'copaNordeste');
  assert.equal(entries.length, 10);
  assert.equal(validateCalendarSpacing(calendar).ok, true);
  assert.ok(entries[0].targetDateISO >= '2026-03-24');
  assert.ok(entries.at(-1).targetDateISO <= '2026-06-07');
});

check('primeiro jogo regional percorre CalendarEngine e matchCupRound sem erro de runtime', () => {
  const state = getInitialGameState('br-vitoria', 'Treinador');
  state.cups = CupsEngine.autoInitCupsForSeason(state, true);
  state.calendar = CalendarEngine.buildCalendar(state.fixtures.length, state.cups, state.serie, { season:state.season });
  const calendarEntry = state.calendar.find((entry) => entry.cupKey === 'copaNordeste');
  assert.ok(calendarEntry);
  const output = simulateCupRound({
    gameData:{ ...state, round:state.calendar.indexOf(calendarEntry) },
    calendarEntry,
    tactics:{ formation:'4-4-2', mentality:'balanced' },
    starters:state.players.slice(0, 11),
    rng:() => 0.4,
  });
  assert.equal(output.inactive, false);
  assert.equal(output.cups.regional.group.find((team) => team.isPlayer)?.p, 1);
  assert.ok(output.cupEvents.some((event) => /fase de grupos/i.test(event.msg)));
});

check('slots futuros ficam inativos após eliminação sem inventar adversário', () => {
  let cup = initRegionalCompetition(game('br-vitoria', 'Vitória'), { rng:() => 0.4 });
  for (let round = 0; round < cup.groupMatches.length; round += 1) {
    const match = cup.groupMatches[round];
    const userHome = match.home.isPlayer;
    cup = registerRegionalResult(cup, { isGroup:true, regionalRound:round }, userHome ? 0 : 2, userHome ? 2 : 0, () => 0.4);
  }
  assert.equal(cup.status, 'eliminated');
  assert.equal(getRegionalMatchForCalendarSlot(cup, { isGroup:false, phase:'Quartas', leg:'leg1' }).hasCupMatch, false);
});

console.log(`\n✅ Regionais: ${checks}/${checks} verificações aprovadas.`);

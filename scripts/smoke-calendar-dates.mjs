import assert from 'node:assert/strict';
import { CalendarEngine } from '../src/engines/CalendarEngine.js';
import {
  MIN_MATCH_GAP_DAYS,
  advanceCareerDay,
  attachCanonicalDates,
  fromDateISO,
  getCareerDayActivity,
  getDaysUntilCalendarSlot,
  getInitialCareerDate,
  validateCalendarSpacing,
  validateCalendarWindows,
} from '../src/engines/calendar/calendarDateEngine.js';
import {
  buildAnnualCalendarTargets,
  getAnnualCalendarContext,
  getSeasonLeagueWindow,
  getSeasonCompetitionWindow,
} from '../src/engines/calendar/seasonCalendar.js';
import { getInactiveCupSkipCount } from '../src/engines/calendar/idleCalendarAdvance.js';
import { inspectMatchStart } from '../src/engines/match/matchPreflight.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; console.log(`✅ ${name}`); }
  catch (error) { console.error(`❌ ${name}`); throw error; }
};
const dayDiff = (a, b) => Math.round((fromDateISO(b) - fromDateISO(a)) / 86400000);

const allCups = {
  copaBrasil:{ status:'active' },
  libertadores:{ status:'active' },
  sulAmericana:{ status:'active' },
};

test('calendário completo atribui uma data civil a cada compromisso', () => {
  const calendar = CalendarEngine.buildCalendar(38, allCups, 'A', { season:2026 });
  assert.ok(calendar.length > 38);
  assert.equal(calendar.every((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.dateISO)), true);
});

test('Liga e copas nunca ficam em dias consecutivos', () => {
  const calendar = CalendarEngine.buildCalendar(38, allCups, 'A', { season:2026 });
  const report = validateCalendarSpacing(calendar);
  assert.equal(report.ok, true, report.errors.join('; '));
  for (let index = 1; index < calendar.length; index += 1) {
    assert.ok(dayDiff(calendar[index - 1].dateISO, calendar[index].dateISO) >= MIN_MATCH_GAP_DAYS);
  }
});

test('datas do calendário são estritamente crescentes', () => {
  const calendar = CalendarEngine.buildCalendar(38, allCups, 'B', { season:2026 });
  for (let index = 1; index < calendar.length; index += 1) {
    assert.ok(fromDateISO(calendar[index].dateISO) > fromDateISO(calendar[index - 1].dateISO));
  }
});

test('slot regional futuro herda o mesmo espaçamento seguro sem inventar a competição', () => {
  const calendar = attachCanonicalDates([
    { type:'league', leagueIdx:0 },
    { type:'regional', competitionKey:'future-regional' },
    { type:'league', leagueIdx:1 },
  ], { season:2026, serie:'C' });
  assert.equal(validateCalendarSpacing(calendar).ok, true);
  const regionalDay = fromDateISO(calendar[1].dateISO).getDay();
  assert.ok([3,4].includes(regionalDay));
});

test('carreira começa três dias antes do primeiro compromisso', () => {
  const calendar = CalendarEngine.buildCalendar(4, null, 'A', { season:2026 });
  assert.equal(dayDiff(getInitialCareerDate(calendar), calendar[0].dateISO), 3);
});

test('pré-jogo bloqueia a partida enquanto a data ainda não chegou', () => {
  const calendar = CalendarEngine.buildCalendar(2, {}, 'A', { season:2026 });
  const state = {
    round:0, leagueRound:0, season:2026, serie:'A', calendar, cups:{}, fixtures:[[],[]],
    currentDateISO:getInitialCareerDate(calendar), currentDate:getInitialCareerDate(calendar), players:[],
  };
  const preflight = inspectMatchStart(state);
  assert.equal(preflight.status, 'rest-day');
  assert.equal(preflight.daysUntilMatch, 3);
});

test('avanço civil move exatamente um dia e recupera energia sem curar lesão por atalho', () => {
  const calendar = CalendarEngine.buildCalendar(2, {}, 'A', { season:2026 });
  const initial = getInitialCareerDate(calendar);
  const state = {
    round:0, leagueRound:0, calendar, currentDateISO:initial, currentDate:initial,
    players:[{ id:'p1', name:'Atleta', energy:60, injury:{ roundsLeft:2 } }], teamRosters:{ user:[] },
  };
  const advanced = advanceCareerDay(state);
  assert.equal(advanced.advanced, true);
  assert.equal(dayDiff(initial, advanced.date), 1);
  assert.equal(advanced.daysUntilMatch, 2);
  assert.equal(advanced.state.players[0].energy, 64);
  assert.equal(advanced.state.players[0].injury.roundsLeft, 2);
});

test('atividade diária distingue recuperação, véspera e dia de jogo', () => {
  assert.equal(getCareerDayActivity(5).key, 'recovery');
  assert.equal(getCareerDayActivity(3).key, 'training');
  assert.equal(getCareerDayActivity(2).key, 'tactical');
  assert.equal(getCareerDayActivity(1).key, 'eve');
  assert.equal(getCareerDayActivity(0).key, 'matchday');
});

test('slot inativo futuro não é pulado antes de sua data', () => {
  const calendar = attachCanonicalDates([
    { type:'cup', cupKey:'copaBrasil', phase:'x', leg:'leg1' },
    { type:'cup', cupKey:'copaBrasil', phase:'y', leg:'leg1' },
  ], { season:2026, serie:'A' });
  const state = {
    round:0, calendar, cups:{ copaBrasil:{ status:'inactive' } }, currentDateISO:calendar[0].dateISO, currentDate:calendar[0].dateISO,
  };
  assert.equal(getInactiveCupSkipCount(state), 1);
  assert.equal(getDaysUntilCalendarSlot(state, 1) >= MIN_MATCH_GAP_DAYS, true);
});


test('janelas oficiais de 2026 refletem as datas-base nacionais', () => {
  assert.deepEqual(getSeasonLeagueWindow(2026, 'A'), { start:'2026-01-28', end:'2026-12-02', label:'Brasileirão Série A', official:true });
  assert.equal(getSeasonLeagueWindow(2026, 'B').start, '2026-03-21');
  assert.equal(getSeasonCompetitionWindow(2026, 'copaBrasil').start, '2026-02-18');
  assert.equal(getSeasonCompetitionWindow(2026, 'estaduais').start, '2026-01-07');
  assert.equal(getSeasonCompetitionWindow(2026, 'estaduais').end, '2026-03-21');
  assert.deepEqual(
    [getSeasonCompetitionWindow(2026, 'paulista').start, getSeasonCompetitionWindow(2026, 'paulista').end],
    ['2026-01-11','2026-03-08'],
  );
  assert.deepEqual(
    [getSeasonCompetitionWindow(2026, 'paraense').start, getSeasonCompetitionWindow(2026, 'paraense').end],
    ['2026-01-24','2026-03-08'],
  );
  assert.equal(getSeasonCompetitionWindow(2026, 'regionals').start, '2026-03-24');
});

test('calendário anual com Copa não empurra Série B/C para o ano seguinte', () => {
  const b = CalendarEngine.buildCalendar(38, { copaBrasil:{status:'active'}, sulAmericana:{status:'active'} }, 'B', { season:2026 });
  const c = CalendarEngine.buildCalendar(27, { copaBrasil:{status:'active'} }, 'C', { season:2026 });
  assert.equal(b.at(-1).dateISO.slice(0,4), '2026');
  assert.equal(c.at(-1).dateISO.slice(0,4), '2026');
  assert.ok(fromDateISO(b.at(-1).dateISO) <= fromDateISO('2026-12-06'));
  assert.ok(fromDateISO(c.at(-1).dateISO) <= fromDateISO('2026-12-06'));
});

test('Série A entra na Copa do Brasil perto da data-base oficial da 5ª fase', () => {
  const calendar = CalendarEngine.buildCalendar(38, { copaBrasil:{status:'active'} }, 'A', { season:2026 });
  const copa = calendar.filter((entry) => entry.cupKey === 'copaBrasil');
  assert.equal(copa[0].phase, '5ª Fase');
  assert.ok(copa[0].dateISO >= '2026-04-20' && copa[0].dateISO <= '2026-04-24');
  assert.equal(copa.at(-1).phase, 'Final');
  assert.equal(copa.at(-1).leg, 'leg1');
  assert.equal(copa.at(-1).dateISO, '2026-12-06');
});

test('Séries C e D podem disputar Copa do Brasil antes da abertura da liga', () => {
  const c = CalendarEngine.buildCalendar(27, { copaBrasil:{status:'active'} }, 'C', { season:2026 });
  const d = CalendarEngine.buildCalendar(24, { copaBrasil:{status:'active'} }, 'D', { season:2026 });
  assert.equal(c[0].type, 'cup');
  assert.equal(d[0].type, 'cup');
  assert.ok(fromDateISO(c[0].dateISO) < fromDateISO(getSeasonLeagueWindow(2026, 'C').start));
});

test('contexto anual informa janela estadual e regional sem criar jogo fantasma', () => {
  const stateContext = getAnnualCalendarContext('2026-02-10', { season:2026, serie:'A' });
  const regionalContext = getAnnualCalendarContext('2026-04-10', { season:2026, serie:'B' });
  assert.equal(stateContext.badges.some((badge) => badge.key === 'state'), true);
  assert.equal(regionalContext.badges.some((badge) => badge.key === 'regional'), true);
  const calendar = CalendarEngine.buildCalendar(38, {}, 'B', { season:2026 });
  assert.equal(calendar.some((entry) => entry.type === 'regional'), false);
});

test('temporadas futuras reutilizam a estrutura anual como projeção, não como dado oficial', () => {
  const projected = getSeasonLeagueWindow(2027, 'A');
  assert.equal(projected.start, '2027-01-28');
  assert.equal(projected.official, false);
});


test('agenda densa preserva janelas de estadual, regional, copa e Série C quando há espaço', () => {
  const cupEvents = [];
  const addEvents = (cupKey, count) => {
    for (let index = 0; index < count; index += 1) {
      cupEvents.push({ cupKey, phase:`Fase ${index + 1}`, leg:'leg1' });
    }
  };
  addEvents('paraibano', 12);
  addEvents('copaBrasil', 8);
  addEvents('copaNordeste', 10);
  const targets = buildAnnualCalendarTargets({ leagueRounds:27, cupEvents, season:2026, serie:'C' });
  const calendar = attachCanonicalDates(targets, { season:2026, serie:'C' });
  assert.equal(validateCalendarSpacing(calendar).ok, true);
  const windows = validateCalendarWindows(calendar);
  assert.equal(windows.ok, true, windows.errors.join('; '));
  assert.equal(calendar.some((entry) => entry.windowOverflow), false);
});

test('cada compromisso anual carrega a janela da própria competição para auditoria', () => {
  const targets = buildAnnualCalendarTargets({
    leagueRounds:27,
    cupEvents:[{ cupKey:'paulista', phase:'Classificatória 1', leg:'leg1' }, { cupKey:'copaBrasil', phase:'1ª Fase', leg:'leg1' }],
    season:2026,
    serie:'C',
  });
  assert.equal(targets.every((entry) => Boolean(entry.windowStartISO && entry.windowEndISO && entry.windowLabel)), true);
  const paulista = targets.find((entry) => entry.cupKey === 'paulista');
  assert.equal(paulista.windowStartISO, '2026-01-11');
  assert.equal(paulista.windowEndISO, '2026-03-08');
});

console.log(`\nCalendário civil: ${passed}/${passed} verificações aprovadas.`);

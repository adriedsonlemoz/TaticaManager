import assert from 'node:assert/strict';
import { CalendarEngine } from '../src/engines/CalendarEngine.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { CupsEngine } from '../src/engines/cups_engine.js';
import { STATE_2026_CONFIGS, STATE_CUP_KEYS } from '../src/engines/cups/stateConfig.js';
import { initStateCompetition, getStateMatchForCalendarSlot, registerStateResult } from '../src/engines/cups/stateEngine.js';
import { validateCalendarSpacing } from '../src/engines/calendar/calendarDateEngine.js';
import { simulateCupRound } from '../src/engines/match/matchCupRound.js';
import { CUP_META, getCupColor, getCupLabel } from '../src/engines/matches/matchesConstants.js';

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; console.log(`✅ ${name}`); };
const game = (teamId, name, serie = 'A') => ({ season:2026, serie, club:{ existingTeamId:teamId, teamId, name, strength:78 } });
const winAllFirstStage = (initial) => {
  let cup = initial;
  for (let round = 0; round < initial.groupMatches.length; round += 1) {
    const match = cup.groupMatches[round];
    const userHome = match.home.isPlayer;
    cup = registerStateResult(cup, { isGroup:true, stateRound:round }, userHome ? 4 : 0, userHome ? 0 : 4, () => 0.41);
  }
  return cup;
};

check('beta 60 expõe quatorze estaduais implementados', () => {
  assert.deepEqual([...STATE_CUP_KEYS].sort(), [
    'alagoano','baiano','carioca','catarinense','gauchao','goiano','mineiro','paraense','paraibano',
    'paranaense','paulista','pernambucano','potiguar','sergipano',
  ].sort());
});

check('Carioca 2026 mantém duas chaves de seis clubes', () => {
  const config = STATE_2026_CONFIGS.carioca;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6]);
  assert.equal(new Set(Object.values(config.groups).flat()).size, 12);
});

check('Gauchão 2026 mantém dois grupos de seis clubes', () => {
  const config = STATE_2026_CONFIGS.gauchao;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6]);
  assert.equal(config.knockout.at(-1).legs, 2);
});

check('Paulistão 2026 usa 16 clubes, oito jogos e G8 geral', () => {
  const config = STATE_2026_CONFIGS.paulista;
  assert.equal(config.participants.length, 16);
  assert.equal(config.firstStage.rounds, 8);
  assert.equal(config.firstStage.qualify.count, 8);
  assert.deepEqual(config.knockout.map((p) => p.legs), [1,1,2]);
});

check('Mineiro 2026 usa três grupos de quatro e semifinal direta', () => {
  const config = STATE_2026_CONFIGS.mineiro;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [4,4,4]);
  assert.equal(config.firstStage.qualify.type, 'group-winners-plus-best-runner-up');
  assert.equal(config.knockout[0].phase, 'Semifinal');
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,1]);
});

check('Paranaense 2026 usa duas chaves, seis jogos e mata-mata ida/volta', () => {
  const config = STATE_2026_CONFIGS.paranaense;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6]);
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2,2]);
});

check('Catarinense 2026 usa duas chaves, seis jogos e quartas dentro da chave', () => {
  const config = STATE_2026_CONFIGS.catarinense;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6]);
  assert.equal(config.firstStage.firstPairing, 'same-group');
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2,2]);
});

check('Baianão 2026 usa dez clubes, nove rodadas e semifinal/final únicas', () => {
  const config = STATE_2026_CONFIGS.baiano;
  assert.equal(config.participants.length, 10);
  assert.equal(config.firstStage.mode, 'round-robin');
  assert.equal(config.firstStage.qualify.count, 4);
  assert.deepEqual(config.knockout.map((p) => p.legs), [1,1]);
});

check('Pernambucano 2026 usa oito clubes e playoff entre 3º e 6º', () => {
  const config = STATE_2026_CONFIGS.pernambucano;
  assert.equal(config.participants.length, 8);
  assert.equal(config.firstStage.qualify.directSemi, 2);
  assert.equal(config.firstStage.qualify.playoffFrom, 3);
  assert.equal(config.firstStage.qualify.playoffTo, 6);
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2,2]);
});

check('Goiano 2026 usa três grupos de quatro, oito jogos e G8 geral', () => {
  const config = STATE_2026_CONFIGS.goiano;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [4,4,4]);
  assert.equal(config.firstStage.mode, 'outside-groups');
  assert.equal(config.firstStage.qualify.count, 8);
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2,2]);
});

check('Paraense 2026 usa duas chaves de seis, tabela geral e quartas/semis únicas', () => {
  const config = STATE_2026_CONFIGS.paraense;
  assert.deepEqual(Object.values(config.groups).map((group) => group.length), [6,6]);
  assert.equal(config.firstStage.tableMode, 'global');
  assert.equal(config.firstStage.qualify.count, 8);
  assert.deepEqual(config.knockout.map((p) => p.legs), [1,1,2]);
});

check('Paraibano 2026 usa dez clubes e semifinal/final em ida e volta', () => {
  const config = STATE_2026_CONFIGS.paraibano;
  assert.equal(config.participants.length, 10);
  assert.equal(config.firstStage.qualify.count, 4);
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2]);
});

check('Alagoano 2026 usa oito clubes e mata-mata em ida e volta', () => {
  const config = STATE_2026_CONFIGS.alagoano;
  assert.equal(config.participants.length, 8);
  assert.equal(config.firstStage.qualify.count, 4);
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2]);
});

check('Potiguar 2026 dá semifinal direta ao G2 e playoff ao 3º–6º', () => {
  const config = STATE_2026_CONFIGS.potiguar;
  assert.equal(config.participants.length, 8);
  assert.equal(config.firstStage.qualify.directSemi, 2);
  assert.equal(config.firstStage.qualify.playoffFrom, 3);
  assert.equal(config.firstStage.qualify.playoffTo, 6);
  assert.deepEqual(config.knockout.map((p) => p.legs), [2,2,2]);
});

check('Sergipano 2026 dá semifinal direta ao líder e playoff ao 2º–7º', () => {
  const config = STATE_2026_CONFIGS.sergipano;
  assert.equal(config.participants.length, 10);
  assert.equal(config.firstStage.qualify.directSemi, 1);
  assert.equal(config.firstStage.qualify.playoffFrom, 2);
  assert.equal(config.firstStage.qualify.playoffTo, 7);
  assert.deepEqual(config.knockout.map((p) => p.legs), [1,2,2]);
});

check('metadados de calendário/partidas cobrem os quatorze estaduais sem fallback genérico', () => {
  for (const key of STATE_CUP_KEYS) {
    const config = STATE_2026_CONFIGS[key];
    assert.equal(getCupLabel(key), config.label);
    assert.equal(getCupColor(key), config.color);
    assert.equal(getCupColor(config.label), config.color);
    assert.equal(CUP_META[key]?.color, config.color);
  }
});

check('tabela estadual descreve corretamente classificação global e regras especiais', () => {
  const paulista = initStateCompetition(game('br-palmeiras', 'Palmeiras'));
  assert.equal(paulista.tableLabel, 'CLASSIFICAÇÃO GERAL');
  assert.match(paulista.qualificationNote, /Top 8/);
  const mineiro = initStateCompetition(game('br-cruzeiro', 'Cruzeiro'));
  assert.match(mineiro.qualificationNote, /melhor 2º/);
  const pernambucano = initStateCompetition(game('br-sport', 'Sport'));
  assert.match(pernambucano.qualificationNote, /semifinais/);
  assert.match(pernambucano.qualificationNote, /playoffs/);
  const sergipano = initStateCompetition(game('br-confianca', 'Confiança', 'C'));
  assert.match(sergipano.qualificationNote, /1º direto/);
  assert.match(sergipano.qualificationNote, /2º–7º/);
  const goiano = initStateCompetition(game('br-goias', 'Goiás', 'B'));
  assert.equal(goiano.tableLabel, 'CLASSIFICAÇÃO GERAL');
  assert.match(goiano.qualificationNote, /Top 8/);
});

const autoCases = [
  ['br-flamengo','Flamengo','carioca',6],
  ['br-internacional','Internacional','gauchao',6],
  ['br-palmeiras','Palmeiras','paulista',8],
  ['br-cruzeiro','Cruzeiro','mineiro',8],
  ['br-athletico-pr','Athletico-PR','paranaense',6],
  ['br-avai','Avaí','catarinense',6],
  ['br-bahia','Bahia','baiano',9],
  ['br-sport','Sport','pernambucano',7],
  ['br-goias','Goiás','goiano',8],
  ['br-remo','Remo','paraense',6],
  ['br-botafogo-pb','Botafogo-PB','paraibano',9],
  ['br-crb','CRB','alagoano',7],
  ['br-abc','ABC','potiguar',7],
  ['br-confianca','Confiança','sergipano',9],
];

for (const [teamId, name, key, rounds] of autoCases) {
  check(`${name} recebe ${key} automaticamente com ${rounds} jogos na fase inicial`, () => {
    const cup = initStateCompetition(game(teamId, name));
    assert.equal(cup?.competitionKey, key);
    assert.equal(cup?.groupMatches.length, rounds);
    assert.equal(cup?.groupRounds.length, rounds);
  });
}

check('clube sem estadual implementado não recebe torneio inventado', () => {
  assert.equal(initStateCompetition(game('br-fortaleza', 'Fortaleza')), null);
});

check('Mineiro gera oito rodadas sem confrontos dentro do próprio grupo', () => {
  const cup = initStateCompetition(game('br-cruzeiro', 'Cruzeiro'));
  const groupOf = new Map(Object.entries(STATE_2026_CONFIGS.mineiro.groups).flatMap(([key, ids]) => ids.map((id) => [id,key])));
  assert.equal(cup.groupRounds.length, 8);
  for (const round of cup.groupRounds) {
    assert.equal(round.length, 6);
    for (const match of round) {
      assert.notEqual(groupOf.get(match.home.sourceTeamId), groupOf.get(match.away.sourceTeamId));
    }
  }
  const allPairs = cup.groupRounds.flat().map((match) => [match.home.sourceTeamId, match.away.sourceTeamId].sort().join('|'));
  assert.equal(new Set(allPairs).size, 48);
});

check('Paulista dá oito adversários diferentes ao clube do usuário', () => {
  const cup = initStateCompetition(game('br-palmeiras', 'Palmeiras'));
  const opponents = cup.groupMatches.map((match) => (match.home.isPlayer ? match.away : match.home).sourceTeamId);
  assert.equal(new Set(opponents).size, 8);
});

check('nove vitórias levam Bahia à semifinal', () => {
  const cup = winAllFirstStage(initStateCompetition(game('br-bahia','Bahia')));
  assert.equal(cup.status, 'active');
  assert.equal(cup.phase, 'knockout');
  assert.equal(cup.phaseLabel, 'Semifinal');
  assert.ok(cup.currentTie);
});

check('oito vitórias levam Cruzeiro diretamente à semifinal mineira', () => {
  const cup = winAllFirstStage(initStateCompetition(game('br-cruzeiro','Cruzeiro')));
  assert.equal(cup.status, 'active');
  assert.equal(cup.phaseLabel, 'Semifinal');
  assert.equal(cup.qualifiedTeams.length, 4);
});

check('sete vitórias colocam Sport direto na semifinal e pulam slot de playoff', () => {
  const cup = winAllFirstStage(initStateCompetition(game('br-sport','Sport')));
  assert.equal(cup.phaseLabel, 'Semifinal');
  assert.equal(cup.knockoutPhaseIndex, 1);
  const playoff = getStateMatchForCalendarSlot(cup, { phase:'Playoff', leg:'leg1', isGroup:false });
  const semifinal = getStateMatchForCalendarSlot(cup, { phase:'Semifinal', leg:'leg1', isGroup:false });
  assert.equal(playoff.hasCupMatch, false);
  assert.equal(semifinal.hasCupMatch, true);
});

check('Goiano gera oito rodadas sem confronto dentro do próprio grupo e tabela global de 12', () => {
  const cup = initStateCompetition(game('br-goias', 'Goiás', 'B'));
  const groupOf = new Map(Object.entries(STATE_2026_CONFIGS.goiano.groups).flatMap(([key, ids]) => ids.map((id) => [id,key])));
  assert.equal(cup.groupRounds.length, 8);
  assert.equal(cup.group.length, 12);
  for (const round of cup.groupRounds) {
    for (const match of round) assert.notEqual(groupOf.get(match.home.sourceTeamId), groupOf.get(match.away.sourceTeamId));
  }
});

check('Paraense gera seis jogos cruzados e classificação global de 12 clubes', () => {
  const cup = initStateCompetition(game('br-remo', 'Remo'));
  assert.equal(cup.groupMatches.length, 6);
  assert.equal(cup.group.length, 12);
  const opponents = cup.groupMatches.map((match) => (match.home.isPlayer ? match.away : match.home).sourceTeamId);
  assert.equal(new Set(opponents).size, 6);
});

check('sete vitórias colocam ABC direto na semifinal potiguar e pulam playoff', () => {
  const cup = winAllFirstStage(initStateCompetition(game('br-abc','ABC','D')));
  assert.equal(cup.phaseLabel, 'Semifinal');
  assert.equal(cup.knockoutPhaseIndex, 1);
  assert.equal(getStateMatchForCalendarSlot(cup, { phase:'Playoff', leg:'leg1' }).hasCupMatch, false);
  assert.equal(getStateMatchForCalendarSlot(cup, { phase:'Semifinal', leg:'leg1' }).hasCupMatch, true);
});

check('nove vitórias colocam Confiança direto na semifinal sergipana', () => {
  const cup = winAllFirstStage(initStateCompetition(game('br-confianca','Confiança','C')));
  assert.equal(cup.phaseLabel, 'Semifinal');
  assert.equal(cup.knockoutPhaseIndex, 1);
  assert.equal(getStateMatchForCalendarSlot(cup, { phase:'Playoff', leg:'leg1' }).hasCupMatch, false);
});

check('resultado estadual não é aplicado duas vezes', () => {
  let cup = initStateCompetition(game('br-internacional', 'Internacional'));
  const match = cup.groupMatches[0];
  const userHome = match.home.isPlayer;
  cup = registerStateResult(cup, { isGroup:true, stateRound:0 }, userHome ? 2 : 0, userHome ? 0 : 2, () => 0.4);
  const played = cup.group.find((team) => team.isPlayer)?.p;
  cup = registerStateResult(cup, { isGroup:true, stateRound:0 }, 9, 0, () => 0.4);
  assert.equal(cup.group.find((team) => team.isPlayer)?.p, played);
});

check('slot de mata-mata de fase errada não antecipa confronto', () => {
  const cup = winAllFirstStage(initStateCompetition(game('br-palmeiras','Palmeiras')));
  assert.equal(cup.phaseLabel, 'Quartas de Final');
  assert.equal(getStateMatchForCalendarSlot(cup, { phase:'Semifinal', leg:'leg1' }).hasCupMatch, false);
  assert.equal(getStateMatchForCalendarSlot(cup, { phase:'Quartas', leg:'leg1' }).hasCupMatch, true);
});

check('calendário estadual ocupa janeiro-março e mantém espaçamento seguro', () => {
  const estadual = initStateCompetition(game('br-palmeiras', 'Palmeiras'));
  const calendar = CalendarEngine.buildCalendar(38, { estadual }, 'A', { season:2026 });
  const entries = calendar.filter((entry) => entry.cupKey === 'paulista');
  assert.equal(entries.length, estadual.calendarEvents.length);
  assert.equal(validateCalendarSpacing(calendar).ok, true);
  assert.ok(entries[0].targetDateISO >= '2026-01-11');
  assert.ok(entries.at(-1).targetDateISO <= '2026-03-08');
});

check('primeiro jogo paulista percorre criação, calendário e simulação sem erro', () => {
  const state = getInitialGameState('br-palmeiras', 'Treinador');
  state.cups = CupsEngine.autoInitCupsForSeason(state, true);
  assert.equal(state.cups.estadual?.competitionKey, 'paulista');
  state.calendar = CalendarEngine.buildCalendar(state.fixtures.length, state.cups, state.serie, { season:state.season });
  const entry = state.calendar.find((item) => item.cupKey === 'paulista');
  assert.ok(entry);
  const output = simulateCupRound({
    gameData:{ ...state, round:state.calendar.indexOf(entry) },
    calendarEntry:entry,
    tactics:{ formation:'4-4-2', mentality:'balanced' },
    starters:state.players.slice(0, 11),
    rng:() => 0.4,
  });
  assert.equal(output.inactive, false);
  assert.equal(output.cups.estadual.group.find((team) => team.isPlayer)?.p, 1);
  assert.ok(output.cupEvents.some((event) => /fase de grupos|classificat/i.test(event.msg)));
});

console.log(`\n✅ Estaduais: ${checks}/${checks} verificações aprovadas.`);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  getCareerSelectableClubs2026,
  getPyramidSeriesTeams2026,
  resolveClub,
} from '../src/data/clubCatalog.js';
import { SERIE_D_2026_GROUPS, SERIE_D_2026_IDS, getSerieD2026GroupForClub } from '../src/data/serieD2026.js';
import {
  assertCareerSaveNameAvailable,
  buildCareerCreationConfig,
  DIFFICULTY_PROFILES,
  getCareerSelectableTeams,
  getCareerTeamSelectionPatch,
  isCareerTeamIdValid,
  resolveCareerClubSelection,
} from '../src/engines/core/careerCreation.js';
import { getInitialGameState } from '../src/engines/core/gameStateFactory.js';
import { buildLeagueScheduleReport } from '../src/engines/core/leagueEngine.js';

let passed = 0;
const test = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const cpuIds = (state) => ['A','B','C','D'].flatMap((serie) => (state.leagues?.[serie] || []).map((team) => String(team.id)));

await test('catálogo da Nova Carreira expõe 156 clubes reais únicos: 20 A, 20 B, 20 C e 96 D', () => {
  const teams = getCareerSelectableTeams();
  assert.equal(teams.length, 156);
  assert.equal(new Set(teams.map((team) => team.id)).size, 156);
  for (const [serie, expected] of Object.entries({ A:20, B:20, C:20, D:96 })) {
    assert.equal(teams.filter((team) => team.serie2026 === serie).length, expected);
  }
  assert.equal(getCareerSelectableClubs2026().length, 156);
});

await test('estrutura oficial cadastrada da Série D tem 16 grupos de seis e 96 IDs únicos', () => {
  assert.equal(Object.keys(SERIE_D_2026_GROUPS).length, 16);
  Object.values(SERIE_D_2026_GROUPS).forEach((group) => assert.equal(group.length, 6));
  assert.equal(SERIE_D_2026_IDS.length, 96);
  assert.equal(new Set(SERIE_D_2026_IDS).size, 96);
  assert.equal(getSerieD2026GroupForClub('br-brasiliense'), 'A3');
});

await test('seleção na UI deriva nome, Série, saldo e ID do clube canônico', () => {
  const patch = getCareerTeamSelectionPatch('br-fortaleza');
  const canonical = resolveClub('br-fortaleza');
  assert.equal(patch.teamId, 'br-fortaleza');
  assert.equal(patch.existingTeamId, 'br-fortaleza');
  assert.equal(patch.teamName, 'Fortaleza');
  assert.equal(patch.serie, 'B');
  assert.equal(patch.initialMoney, canonical.money);
  assert.equal(isCareerTeamIdValid('br-fortaleza'), true);
  assert.equal(isCareerTeamIdValid('clube-inventado'), false);
});

await test('backend ignora Série, nome, multiplicadores e estádio forjados enviados pela interface', () => {
  const config = buildCareerCreationConfig({
    saveName:'Teste Canônico', managerName:'Manager', teamId:'br-fortaleza',
    teamName:'Clube Forjado', serie:'A', initialMoney:999_999_999_999,
    stadiumName:'Estádio Inventado', difficulty:'Difícil',
    difficultyMultipliers:{ injuryChance:0, rivalStrength:0, moneyBonus:99, fatigueLoss:0 },
    seasonObjective:'libertadores', managerFormation:'4-4-2', managerStyle:'Equilibrado',
  });
  assert.equal(config.teamId, 'br-fortaleza');
  assert.equal(config.teamName, 'Fortaleza');
  assert.equal(config.serie, 'B');
  assert.deepEqual(config.difficultyMultipliers, DIFFICULTY_PROFILES['Difícil']);
  assert.equal(config.seasonObjective, 'promotion', 'objetivo inválido para a Série B deve voltar ao padrão da Série');
  assert.notEqual(config.managerProfile.stadiumName, 'Estádio Inventado');
});

await test('teamId inexistente e criação personalizada são rejeitados na fronteira canônica', () => {
  assert.throws(
    () => buildCareerCreationConfig({ saveName:'X', managerName:'Y', teamId:'inventado' }),
    (error) => error?.code === 'INVALID_CAREER_CLUB',
  );
  assert.throws(
    () => buildCareerCreationConfig({ saveName:'X', managerName:'Y', teamId:'Fortaleza' }),
    (error) => error?.code === 'INVALID_CAREER_CLUB',
    'nome/alias não deve substituir um teamId canônico na criação',
  );
  assert.throws(
    () => resolveCareerClubSelection({ type:'custom', teamId:null, name:'Meu Time' }),
    (error) => error?.code === 'CUSTOM_CLUB_DISABLED',
  );
  assert.throws(
    () => getInitialGameState('Fortaleza', 'Manager', 'B'),
    (error) => error?.code === 'INVALID_CAREER_CLUB',
    'factory também deve exigir o ID canônico, não nome/alias',
  );
});

await test('nome de save duplicado é recusado antes de qualquer sobrescrita', async () => {
  await assert.rejects(
    () => assertCareerSaveNameAvailable('Minha Carreira', async () => ({ name:'Minha Carreira' })),
    (error) => error?.code === 'DUPLICATE_SAVE_NAME',
  );
  assert.equal(await assertCareerSaveNameAvailable('Livre', async () => null), true);
});

await test('factory deriva a Série pelo teamId mesmo quando recebe Série legada forjada', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'A', { formation:'4-4-2', stadiumName:'Forjado' });
  const club = resolveClub('br-fortaleza');
  assert.equal(state.serie, 'B');
  assert.equal(state.club.teamId, club.id);
  assert.equal(state.club.existingTeamId, club.id);
  assert.equal(state.club.name, club.name);
  assert.equal(state.club.money, club.money);
  assert.equal(state.club.transferBudget, club.budget);
  assert.notEqual(state.club.stadium.name, 'Forjado');
});

await test('clube selecionado não é duplicado nas ligas CPU e a pirâmide mantém todos os 156 clubes oficiais', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'A', { formation:'4-4-2' });
  const ids = cpuIds(state);
  assert.equal(ids.length, 155);
  assert.equal(new Set(ids).size, 155);
  assert.equal(ids.includes('br-fortaleza'), false);
  assert.equal(state.teams.length, 20);
  assert.equal(state.teams.filter((team) => team.id === 'user').length, 1);
  assert.deepEqual(
    Object.fromEntries(['A','B','C','D'].map((serie) => [serie, state.leagues[serie].length])),
    { A:20, B:19, C:20, D:96 },
  );
});

await test('tabela e fixtures da Série inicial permanecem íntegros', () => {
  const state = getInitialGameState('br-fortaleza', 'Manager', 'D', { formation:'4-4-2' });
  // A Série enviada é irrelevante: Fortaleza continua na B.
  assert.equal(state.serie, 'B');
  assert.equal(state.table.length, 20);
  assert.equal(new Set(state.table.map((row) => String(row.id))).size, 20);
  assert.equal(state.table.filter((row) => row.id === 'user').length, 1);
  assert.deepEqual(
    Object.fromEntries(['pts','p','w','d','l','gf','ga'].map((key) => [key, state.table.find((row) => row.id === 'user')?.[key]])),
    { pts:0, p:0, w:0, d:0, l:0, gf:0, ga:0 },
  );
  assert.equal(state.fixtures.length, 38);
  const report = buildLeagueScheduleReport(state.table, state.fixtures);
  assert.equal(report.ok, true, report.errors.join(', '));
  assert.equal(report.teamCount, 20);
  assert.equal(report.expectedMatches, 380);
});

await test('qualquer um dos 96 clubes oficiais da D inicia no grupo correto sem duplicação', () => {
  const state = getInitialGameState('br-brasiliense', 'Manager', 'A', { formation:'4-4-2' });
  assert.equal(state.serie, 'D');
  assert.equal(state.club.teamId, 'br-brasiliense');
  assert.equal(state.table.length, 6);
  assert.equal(state.teams.length, 6);
  assert.equal(state.leagues.D.length, 95);
  assert.equal(cpuIds(state).length, 155);
  assert.equal(cpuIds(state).includes('br-brasiliense'), false);
  assert.equal(state.pyramidReserve.some((team) => team.id === 'br-brasiliense'), false);
  assert.equal(state.serieDCompetition.userGroup, getSerieD2026GroupForClub('br-brasiliense'));
  assert.equal(Object.keys(state.serieDCompetition.groups).length, 16);
  assert.equal(Object.values(state.serieDCompetition.groups).flat().length, 96);
  assert.equal(state.fixtures.slice(0, 10).every((round) => round.length === 48), true);
});

await test('pool canônico usa 20 clubes em A/B/C e os 96 participantes oficiais na D', () => {
  for (const serie of ['A','B','C']) assert.equal(getPyramidSeriesTeams2026(serie).length, 20);
  assert.equal(getPyramidSeriesTeams2026('D').length, 96);
  assert.equal(getCareerSelectableClubs2026().filter((team) => team.serie2026 === 'D').length, 96);
});

await test('UI nova tem cinco etapas, busca/filtro e não possui etapa de divisão nem criação manual de clube', () => {
  const screen = source('src/components/ScreenSetup.jsx');
  const steps = source('src/components/setup/SetupSteps.jsx');
  const clubStep = source('src/components/setup/steps/SetupClubStep.jsx');
  const theme = source('src/components/setup/setupTheme.js');
  const service = source('src/components/setup/setupService.js');
  const persistence = source('src/hooks/hooks_persistence.js');
  assert.match(screen, /NOVA CARREIRA · CLUBE REAL/);
  assert.match(service, /getCareerSelectableTeams/);
  assert.match(service, /getCareerTeamSelectionPatch/);
  assert.match(persistence, /saves\.add\(\{ name:config\.saveName/);
  assert.doesNotMatch(persistence, /saves\.put\(\{ name:config\.saveName/);
  assert.match(clubStep, /Buscar clube pelo nome/);
  assert.match(clubStep, /Série \$\{serie\}/);
  assert.match(clubStep, /info\?\.city/);
  assert.doesNotMatch(clubStep, /Criar clube|initialMoney.*input|stadiumName.*input|useExistingTeam/);
  assert.doesNotMatch(steps, /SetupDivisionStep/);
  assert.match(steps, /5: SetupContractStep/);
  assert.match(theme, /SETUP_TOTAL_STEPS\s*=\s*5/);
  assert.equal(fs.existsSync(path.join(root, 'src/components/setup/steps/SetupDivisionStep.jsx')), false);
});

await test('arquitetura mantém ponto explícito para futuro clube personalizado sem habilitá-lo agora', () => {
  const creation = source('src/engines/core/careerCreation.js');
  assert.match(creation, /selection\.type === 'custom'/);
  assert.match(creation, /exclusivamente para a Série D/);
  assert.match(creation, /CUSTOM_CLUB_DISABLED/);
});

console.log(`\nNew career smoke: ${passed}/${passed} verificações aprovadas.`);

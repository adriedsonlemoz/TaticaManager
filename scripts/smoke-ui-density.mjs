import assert from 'node:assert/strict';
import fs from 'node:fs';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; console.log(`✅ ${name}`); }
  catch (error) { console.error(`❌ ${name}`); throw error; }
};
const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const style = read('src/style.css');
const app = read('src/app.jsx');
const boot = read('src/components/ScreenBoot.jsx');
const setup = read('src/components/ScreenSetup.jsx');
const clubStep = read('src/components/setup/steps/SetupClubStep.jsx');
const bootFooter = read('src/components/boot/BootFooter.jsx');
const bottomNav = read('src/components/navigation/BottomNavigationBar.jsx');
const home = read('src/components/MenuPrincipal.jsx');
const homeGrid = read('src/components/home/HomeNavigationGrid.jsx');
const careerStep = read('src/components/setup/steps/SetupCareerStep.jsx');
const inboxReader = read('src/components/inbox/InboxMessageReader.jsx');
const competitionScreen = read('src/components/ScreenCopas.jsx');

const srcFiles = [];
const walk = (dir) => {
  for (const item of fs.readdirSync(new URL(`../${dir}/`, import.meta.url), { withFileTypes:true })) {
    const relative = `${dir}/${item.name}`;
    if (item.isDirectory()) walk(relative);
    else if (/\.(?:js|jsx|css)$/.test(item.name)) srcFiles.push(read(relative));
  }
};
walk('src');

test('viewport mobile usa dvh em vez de vh fixo em toda a interface', () => {
  assert.equal(srcFiles.some((source) => /100vh/.test(source)), false);
  assert.match(app, /height:\s*'100dvh'/);
});

test('escala tipográfica é responsiva e não força 17,5px em celular', () => {
  assert.match(style, /html\s*\{\s*font-size:\s*16px;/);
  assert.match(style, /@media \(max-width: 600px\)/);
  assert.match(style, /font-size:\s*15\.5px/);
});

test('seleção de carreira ocupa a altura útil e deixa apenas a lista rolar', () => {
  assert.match(boot, /height:\s*'100dvh',\s*minHeight:\s*0/);
  assert.match(boot, /overflowY:\s*'auto'/);
});

test('Nova Carreira fica presa ao viewport e preserva área interna flexível', () => {
  assert.match(setup, /height:\s*'100dvh',\s*minHeight:\s*0/);
  assert.match(setup, /overflow:\s*'hidden'/);
  assert.match(setup, /flex:\s*1,\s*minHeight:\s*0/);
});

test('lista de clubes continua rolável dentro da Nova Carreira compacta', () => {
  assert.match(clubStep, /flex:\s*1,\s*overflowY:\s*'auto'/);
  assert.match(clubStep, /display:'flex', flexDirection:'column'/);
  assert.doesNotMatch(clubStep, /gridTemplateColumns:\s*'1fr 1fr'/);
});

test('rodapé da seleção de carreira mantém ações grandes e lado a lado', () => {
  assert.match(bootFooter, /gridTemplateColumns:'1fr auto'/);
  assert.match(bootFooter, /minHeight:48/);
});

test('menu principal reserva menos espaço para a navegação inferior', () => {
  assert.match(home, /pb:\s*7\.5/);
  assert.match(bottomNav, /54px/);
  assert.match(bottomNav, /--app-safe-bottom/);
  assert.match(style, /safe-area-inset-bottom/);
});

test('telas principais não reservam dez ou doze rem de espaço vazio sob o conteúdo', () => {
  const merged = srcFiles.join('\n');
  assert.doesNotMatch(merged, /minHeight:\s*'100dvh'[^\n]{0,120}pb:\s*(?:10|12)/);
});

test('navegação inferior preserva ícone e rótulo mesmo em densidade compacta', () => {
  assert.match(bottomNav, /fontSize:\s*'1\.12rem'/);
  assert.match(bottomNav, /item\.label/);
});


test('home mobile usa dois cards por linha com conteúdo ampliado', () => {
  assert.match(homeGrid, /gridTemplateColumns:\s*'repeat\(2,minmax\(0,1fr\)\)'/);
  assert.doesNotMatch(homeGrid, /repeat\(3/);
  assert.match(homeGrid, /minHeight:\s*84/);
  assert.match(homeGrid, /fontSize:\s*'0\.88rem'/);
});

test('dificuldade vem antes do nome e das metas na criação da carreira', () => {
  const difficultyIndex = careerStep.indexOf('DIFICULDADE');
  const nameIndex = careerStep.indexOf('NOME DA CARREIRA');
  const objectiveIndex = careerStep.indexOf('META DA TEMPORADA');
  assert.ok(difficultyIndex >= 0 && nameIndex > difficultyIndex && objectiveIndex > nameIndex);
  assert.match(careerStep, /minHeight:58/);
  assert.match(careerStep, /overflowY:'auto'/);
});

test('leitor de mensagens navega entre anterior e próxima sem altura vazia artificial', () => {
  assert.match(inboxReader, /← ANTERIOR/);
  assert.match(inboxReader, /PRÓXIMA →/);
  assert.match(inboxReader, /positionLabel/);
  assert.doesNotMatch(inboxReader, /minHeight:\s*180/);
});

test('área de competições abre em visão geral com atalhos para classificação e calendário', () => {
  assert.match(competitionScreen, /useState\('overview'\)/);
  assert.match(competitionScreen, /<CompetitionOverview/);
  assert.match(competitionScreen, /onOpenLeague=\{\(\) => setScreen\('table'\)\}/);
  assert.match(competitionScreen, /onOpenCalendar=\{\(\) => setScreen\('matches'\)\}/);
});

console.log(`\nDensidade responsiva: ${passed}/${passed} verificações aprovadas.`);

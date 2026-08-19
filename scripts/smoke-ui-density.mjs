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
  assert.match(clubStep, /gridTemplateColumns:\s*'1fr 1fr'/);
});

test('rodapé da seleção de carreira usa ações horizontais compactas', () => {
  assert.match(bootFooter, /flexDirection:\s*'row'/);
  assert.match(bootFooter, /py:\s*0\.8/);
});

test('menu principal reserva menos espaço para a navegação inferior', () => {
  assert.match(home, /pb:\s*7\.5/);
  assert.match(bottomNav, /54px/);
  assert.match(bottomNav, /safe-area-inset-bottom/);
});

test('telas principais não reservam dez ou doze rem de espaço vazio sob o conteúdo', () => {
  const merged = srcFiles.join('\n');
  assert.doesNotMatch(merged, /minHeight:\s*'100dvh'[^\n]{0,120}pb:\s*(?:10|12)/);
});

test('navegação inferior preserva ícone e rótulo mesmo em densidade compacta', () => {
  assert.match(bottomNav, /fontSize:\s*'1\.05rem'/);
  assert.match(bottomNav, /item\.label/);
});

console.log(`\nDensidade responsiva: ${passed}/${passed} verificações aprovadas.`);

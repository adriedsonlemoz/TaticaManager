import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_VERSION_LABEL } from '../src/config/appMeta.js';
import { PIX_KEY } from '../src/config/support.js';
import { buildAboutChangelog } from '../src/data/aboutChangelog.js';
import {
  buildSaveViewModel,
  formatCompactMoney,
  formatSavedAt,
  getAvatarEmoji,
  getBootStats,
  getCareerPerformance,
  getDifficultyStyle,
  getObjectiveInfo,
  getRoundProgress,
  sortSavesByRecent,
} from '../src/engines/boot/bootViewModel.js';

let checks = 0;
const check = (fn) => { fn(); checks += 1; };

check(() => {
  const saves = sortSavesByRecent([
    { name: 'Antigo', savedAt: 100 },
    { name: 'Novo', savedAt: 300 },
    { name: 'Meio', savedAt: 200 },
  ]);
  assert.deepEqual(saves.map((save) => save.name), ['Novo', 'Meio', 'Antigo']);
});

check(() => {
  const original = [{ name: 'B', savedAt: 1 }, { name: 'A', savedAt: 1 }];
  const sorted = sortSavesByRecent(original);
  assert.deepEqual(sorted.map((save) => save.name), ['A', 'B']);
  assert.deepEqual(original.map((save) => save.name), ['B', 'A']);
});

check(() => {
  assert.deepEqual(getBootStats([
    { managerProfile: { seasonsTotal: 2, wins: 8, trophies: 0 }, trophies: 5 },
    { managerProfile: { seasonsTotal: 1, wins: 3 }, trophies: 2 },
  ]), { saves: 2, seasons: 3, wins: 11, trophies: 2 });
});

check(() => assert.equal(formatSavedAt(null, 10_000), 'Nunca salvo'));
check(() => assert.equal(formatSavedAt(9_990, 10_000), 'Agora mesmo'));
check(() => assert.equal(formatSavedAt(10_000, 70_000), '1 min atrás'));
check(() => assert.equal(formatSavedAt(10_000, 3_610_000), '1h atrás'));
check(() => assert.equal(formatSavedAt(10_000, 86_410_000), '1d atrás'));
check(() => assert.equal(formatSavedAt('inválido', 10_000), 'Data desconhecida'));

check(() => assert.deepEqual(getDifficultyStyle('Lendário'), { tone: 'red', icon: '🔴' }));
check(() => assert.equal(getDifficultyStyle('Normal').tone, 'gold'));
check(() => assert.deepEqual(getObjectiveInfo('champion'), { icon: '🏆', label: 'Ser Campeão' }));
check(() => assert.equal(getObjectiveInfo('unknown'), null));
check(() => assert.equal(getAvatarEmoji('headset'), '🎧'));
check(() => assert.equal(getAvatarEmoji('unknown'), '🤵'));

check(() => assert.deepEqual(getRoundProgress(12, 60), { round: 12, total: 60, percentage: 20 }));
check(() => assert.deepEqual(getRoundProgress(80, 60), { round: 60, total: 60, percentage: 100 }));
check(() => assert.deepEqual(getRoundProgress(null, null), { round: 0, total: 0, percentage: 0 }));

check(() => {
  const career = getCareerPerformance({ season: 2028, managerProfile: { wins: 6, draws: 3, losses: 1, seasonsTotal: 0, trophies: 0 }, trophies: 4 });
  assert.equal(career.total, 10);
  assert.equal(career.winPct, 60);
  assert.equal(career.drawPct, 30);
  assert.equal(career.lossPct, 10);
  assert.equal(career.seasons, 3);
  assert.equal(career.trophies, 0);
});

check(() => assert.equal(formatCompactMoney(1_500_000), 'R$1.5M'));
check(() => assert.equal(formatCompactMoney(42_400), 'R$42K'));
check(() => assert.equal(formatCompactMoney(900), 'R$900'));

check(() => {
  const view = buildSaveViewModel({ name: 'Teste', round: 9, totalRounds: 45, money: 2_000_000, seasonObjective: 'promotion', avatarStyle: 'cap' }, 1_000);
  assert.equal(view.name, 'Teste');
  assert.equal(view.progress.percentage, 20);
  assert.equal(view.moneyLabel, 'R$2M');
  assert.equal(view.objectiveInfo.label, 'Subir de Div.');
  assert.equal(view.avatarEmoji, '🧢');
});

check(() => {
  const theme = { green: '#0a0', teal: '#088' };
  const changelog = buildAboutChangelog(theme);
  assert.equal(changelog[0].v, APP_VERSION_LABEL);
  assert.equal(changelog[0].tag, 'ATUAL');
  assert.equal(changelog[1].v, 'v1.0 beta.59');
  assert.ok(changelog[0].title.includes('14/27'));
  assert.ok(changelog[0].title.includes('schema 14'));
  assert.ok(changelog[0].items.some((item) => item.includes('Schema 14')));
  assert.ok(changelog[0].items.some((item) => item.includes('Goiano')));
});

check(() => assert.equal(PIX_KEY, 'suporte@brasfootweb.com'));

const bootSource = await readFile(new URL('../src/components/boot/BootHeader.jsx', import.meta.url), 'utf8');
const persistenceSource = await readFile(new URL('../src/hooks/hooks_persistence.js', import.meta.url), 'utf8');
const aboutSource = await readFile(new URL('../src/components/about/AboutSupportCard.jsx', import.meta.url), 'utf8');
const saveCardSource = await readFile(new URL('../src/components/boot/BootSaveCard.jsx', import.meta.url), 'utf8');
check(() => assert.ok(!bootSource.includes('CLUBE DE')));
check(() => assert.ok(!bootSource.includes('BOLSO')));
check(() => assert.ok(persistenceSource.includes('const calendar = Array.isArray(d.calendar)')));
check(() => assert.ok(aboutSource.includes('PIX_KEY')));
check(() => assert.ok(saveCardSource.includes('save.incompatible === true')));
check(() => assert.ok(saveCardSource.includes('ATUALIZE O JOGO')));
check(() => assert.ok(persistenceSource.includes("error?.code === 'SAVE_SCHEMA_TOO_NEW'")));

console.log(`Boot/About smoke: ${checks}/${checks} verificações aprovadas.`);

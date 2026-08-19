import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
const branding = path.join(root, 'android-branding');
if (!fs.existsSync(androidRes)) throw new Error('Projeto Android ainda não foi gerado. Execute cap sync antes do branding.');
if (!fs.existsSync(branding)) throw new Error('android-branding ausente.');

const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
};

// O `cap sync` pode gerar várias versões de `splash` em drawable, drawable-port
// e pastas por densidade. Uma cópia concorrente pode vencer o drawable-nodpi e
// fazer o Android exibir a arte padrão. Limpamos somente recursos splash
// gerados antes de instalar a imagem aprovada.
const approvedSplashTarget = path.join(androidRes, 'drawable-nodpi', 'splash.png');
for (const entry of fs.readdirSync(androidRes, { withFileTypes:true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('drawable')) continue;
  const folder = path.join(androidRes, entry.name);
  for (const file of fs.readdirSync(folder, { withFileTypes:true })) {
    if (!file.isFile() || !/^splash\.(png|webp|jpe?g|xml)$/i.test(file.name)) continue;
    const candidate = path.join(folder, file.name);
    if (path.resolve(candidate) !== path.resolve(approvedSplashTarget)) fs.rmSync(candidate);
  }
}
copy(path.join(branding, 'drawable-nodpi', 'splash.png'), approvedSplashTarget);
for (const density of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']) {
  for (const name of ['ic_launcher.png','ic_launcher_round.png']) {
    copy(path.join(branding, `mipmap-${density}`, name), path.join(androidRes, `mipmap-${density}`, name));
  }
}

// O projeto gerado pelo Capacitor pode criar adaptive icons apontando para os
// assets padrão. Removemos somente esses XMLs para que Android 12+ também use
// a arte aprovada (o raster por densidade acima) no launcher/splash nativo.
for (const folder of ['mipmap-anydpi-v26','mipmap-anydpi']) {
  for (const name of ['ic_launcher.xml','ic_launcher_round.xml']) {
    const target = path.join(androidRes, folder, name);
    if (fs.existsSync(target)) fs.rmSync(target);
  }
}

const colorsPath = path.join(androidRes, 'values', 'tatica_brand.xml');
fs.mkdirSync(path.dirname(colorsPath), { recursive:true });
fs.writeFileSync(colorsPath, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="tatica_system_bar">#04150B</color>\n  <color name="tatica_splash_background">#04150B</color>\n</resources>\n`);

const stylesPath = path.join(androidRes, 'values', 'styles.xml');
if (fs.existsSync(stylesPath)) {
  let styles = fs.readFileSync(stylesPath, 'utf8');
  const items = `\n        <item name="android:statusBarColor">@android:color/transparent</item>\n        <item name="android:navigationBarColor">@android:color/transparent</item>\n        <item name="android:windowLightStatusBar">false</item>\n        <item name="android:windowLightNavigationBar">false</item>`;
  if (!styles.includes('android:windowLightNavigationBar')) {
    styles = styles.replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, `$1${items}`);
  }
  fs.writeFileSync(stylesPath, styles);
}

console.log('Branding Android aplicado: splash, launcher icon e barras do sistema.');

import fs from 'node:fs';

const checks = [];
const ok = (name, condition, detail = '') => {
  checks.push({ name, condition:Boolean(condition), detail });
  if (!condition) console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
};

const workflow = fs.readFileSync('.github/workflows/android-apk.yml', 'utf8');
const cap = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const boundary = fs.readFileSync('src/components/ErrorBoundary.jsx', 'utf8');

ok('workflow Android existe', workflow.includes('name: Android APK'));
ok('workflow usa Node 22', /node-version:\s*22/.test(workflow));
ok('workflow usa Java 21', /java-version:\s*['\"]21['\"]/.test(workflow));
ok('workflow instala Capacitor 8', workflow.includes('@capacitor/android@8') && workflow.includes('@capacitor/core@8') && workflow.includes('@capacitor/cli@8'));
ok('workflow instala plugin de splash configurado', workflow.includes('@capacitor/splash-screen@8') && cap?.plugins?.SplashScreen?.launchShowDuration === 0);
ok('workflow gera/sincroniza Android', workflow.includes('npx cap add android') && workflow.includes('npx cap sync android'));
ok('workflow monta APK debug', workflow.includes('assembleDebug'));
ok('workflow publica APK', workflow.includes('android/app/build/outputs/apk/debug/app-debug.apk') && workflow.includes('actions/upload-artifact@v6'));
ok('Capacitor aponta para dist', cap.webDir === 'dist');
ok('Capacitor mantém appId', cap.appId === 'com.minisoccer.manager');
ok('viewport suporta safe area', html.includes('viewport-fit=cover'));
ok('splash usa marca Tática Manager', html.includes('id="msm-title">TÁTICA<') && html.includes('id="msm-subtitle">MANAGER<'));
ok('ErrorBoundary não depende de MUI', !boundary.includes('@mui/material') && !boundary.includes('../theme.js'));

const failed = checks.filter((item) => !item.condition);
console.log(`Android/CI: ${checks.length - failed.length}/${checks.length} verificações aprovadas.`);
if (failed.length) process.exit(1);

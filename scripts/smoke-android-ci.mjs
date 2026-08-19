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
ok('workflow instala plugins de splash e status bar', workflow.includes('@capacitor/splash-screen@8') && workflow.includes('@capacitor/status-bar@8'));
ok('splash nativo usa recurso aprovado e fundo da marca', cap?.plugins?.SplashScreen?.androidSplashResourceName === 'splash' && cap?.plugins?.SplashScreen?.backgroundColor === '#04150B' && cap?.plugins?.SplashScreen?.launchShowDuration > 0);
ok('status bar está preparada para edge-to-edge escuro', cap?.plugins?.StatusBar?.style === 'DARK' && cap?.plugins?.StatusBar?.overlaysWebView === true);
ok('workflow gera/sincroniza Android', workflow.includes('npx cap add android') && workflow.includes('npx cap sync android'));
ok('workflow aplica branding Android depois do cap sync', workflow.includes('node scripts/apply-android-branding.mjs'));
ok('branding Android contém splash e ícones por densidade', fs.existsSync('android-branding/drawable-nodpi/splash.png') && fs.existsSync('android-branding/mipmap-xxxhdpi/ic_launcher.png') && fs.existsSync('android-branding/mipmap-mdpi/ic_launcher_round.png'));
ok('workflow monta APK debug', workflow.includes('assembleDebug'));
ok('workflow publica APK', workflow.includes('android/app/build/outputs/apk/debug/app-debug.apk') && workflow.includes('actions/upload-artifact@v6'));
ok('Capacitor aponta para dist', cap.webDir === 'dist');
ok('Capacitor mantém appId', cap.appId === 'com.minisoccer.manager');
ok('viewport suporta safe area', html.includes('viewport-fit=cover'));
ok('splash web usa a imagem aprovada', html.includes('/brand/tatica-manager-splash.png') && fs.existsSync('public/brand/tatica-manager-splash.png'));
ok('ícone web/PWA deriva da marca aprovada', html.includes('href="/icon.png"') && fs.existsSync('public/icon.png'));
ok('viewport e tema suportam integração com barras do sistema', html.includes('viewport-fit=cover') && html.includes('name="theme-color" content="#04150b"'));
ok('ErrorBoundary não depende de MUI', !boundary.includes('@mui/material') && !boundary.includes('../theme.js'));

const failed = checks.filter((item) => !item.condition);
console.log(`Android/CI: ${checks.length - failed.length}/${checks.length} verificações aprovadas.`);
if (failed.length) process.exit(1);

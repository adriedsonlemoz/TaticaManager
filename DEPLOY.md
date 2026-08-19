# Deploy — Tática Manager

## Web / Vercel

A aplicação é Vite estática e pode ser hospedada diretamente na Vercel. O `vercel.json` define framework Vite, build `npm run build` e saída `dist`; o `package.json` fixa Node.js 22.x.

### Publicação pelo GitHub
1. Envie o projeto para um repositório GitHub.
2. Na Vercel, importe o repositório.
3. Confirme `npm run build` e a saída `dist`, caso solicitado.
4. Faça o deploy.

Não há variáveis de ambiente obrigatórias na versão atual.

## Android / APK pelo GitHub Actions

O workflow `.github/workflows/android-apk.yml` produz um **APK debug instalável** sem manter a pasta Android gerada dentro do repositório. Ele pode ser disparado manualmente em **Actions → Android APK → Run workflow** e também em pushes relevantes para `main`/`master`.

Fluxo do job:
1. checkout do código;
2. Node.js 22 + Java 21;
3. `npm ci`;
4. instalação temporária no runner de Capacitor 8 (`core`, `cli`, `android` e `splash-screen`);
5. `npm run test:smoke`;
6. `npm run build`;
7. `npx cap add android` (quando necessário) + `npx cap sync android`;
8. `./gradlew --no-daemon assembleDebug`;
9. upload de `android/app/build/outputs/apk/debug/app-debug.apk` como artefato `tatica-manager-debug-apk`.

O artefato fica retido por 14 dias no workflow. Este é um APK de **debug/teste**, não um pacote de produção para Play Store. A publicação futura deverá usar assinatura armazenada em GitHub Secrets e preferencialmente gerar AAB/release.

`capacitor.config.json` preserva `appId = com.minisoccer.manager`, `appName = Tática Manager` e `webDir = dist`. `android/`, `node_modules`, Gradle outputs e keystores não devem ser commitados nem incluídos no ZIP de entrega.

## Render

Render não é necessário para a versão atual. Ele passa a ser útil caso o projeto receba backend/API, por exemplo login online, saves em nuvem, ranking global, painel administrativo, multiplayer ou banco centralizado.

```text
Vercel (React/Vite)
       │
       ▼
Render (API)
       │
       ▼
Banco de dados
```

## Verificação antes de publicar

```bash
npm ci
npm run test:smoke
npm run build
```

O deploy só deve ser considerado pronto se o build terminar sem erros no ambiente que possui as dependências instaladas.

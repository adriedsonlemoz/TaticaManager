# Tática Manager

**Tática Manager** é um manager de futebol feito em React e Vite. Assuma um clube, monte o elenco, escolha escalação e táticas, dispute ligas e copas e administre mercado, contratos, finanças, estádio e categoria de base.

> **Status:** `1.0.0-beta.9` — beta com motor, mercado, setup, partida, pós-jogo e calendário modularizados, pronta para evolução contínua no GitHub.

## Principais recursos
- Séries A, B, C e D, copas e temporadas completas.
- Simulação com eventos, estatísticas, cartões, pênaltis e influência tática.
- Escalação, formações, fadiga, lesões, suspensões e moral.
- Mercado, contratos, salários e clubes controlados pela CPU.
- Finanças, estádio, categoria de base e histórico de carreira.
- Múltiplos saves locais via IndexedDB/Dexie.
- Interface responsiva com Material UI.

## Stack
React 18 · Vite 5 · Material UI 5 · Emotion · Dexie/IndexedDB · Capacitor.

## Desenvolvimento
```bash
npm install
npm run dev
```

## Build
```bash
npm ci
npm run build
```
A saída é gerada em `dist/`.

## Deploy
O frontend pode ser publicado diretamente na Vercel. O repositório contém `vercel.json`, Node 22.x e GitHub Actions para validar o build. Veja [DEPLOY.md](./DEPLOY.md).

## Arquitetura
O motor de partidas está em `src/engines/match/`; o núcleo do jogo foi dividido em `src/engines/core/`; o mercado é dividido entre `src/engines/market/` e `src/components/market/`; a criação de carreira fica em `src/components/setup/`; e a apresentação da partida ao vivo fica em `src/components/match/`; o pós-jogo em `src/components/postmatch/`; e calendário/histórico em `src/components/matches/` + `src/engines/matches/`. Veja [ARCHITECTURE.md](./ARCHITECTURE.md).

## Compatibilidade de saves
A mudança de identidade para **Tática Manager** não altera o banco IndexedDB legado (`BrasfootDB`) nem o `appId` do Capacitor nesta beta. Isso é intencional para preservar carreiras existentes.

## Versionamento
- `1.0.0-beta.1` — modularização inicial e preparação de deploy.
- `1.0.0-beta.2` — identidade Tática Manager, refatoração do mercado e preparação para publicação.
- `1.0.0-beta.3` — cards do mercado extraídos e regras de vendas movidas para o serviço de domínio.
- `1.0.0-beta.4` — ScreenMarket dividida em seções, Scout e favoritos desacoplados da tela principal.
- `1.0.0-beta.5` — nova carreira dividida em seis etapas, UI compartilhada e regras de setup desacopladas.
- `1.0.0-beta.6` — `engine.js` convertido em barrel compatível e regras centrais divididas por domínio.
- `1.0.0-beta.7` — tela de partida ao vivo dividida em campo, narração, banco, overlays, substituições e controles.
- `1.0.0-beta.8` — pós-jogo dividido por abas, estatísticas persistentes e finanças/classificação alinhadas ao estado real.
- `1.0.0-beta.9` — calendário de partidas modularizado, slots Liga/Copa normalizados e histórico de copas restaurado no calendário.
- `1.0.0` — futura primeira versão estável.

## Documentação
- [CHANGELOG.md](./CHANGELOG.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEPLOY.md](./DEPLOY.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## Licença
Nenhuma licença pública foi definida ainda. Até que uma licença seja adicionada, o código permanece sob os direitos do autor do repositório.

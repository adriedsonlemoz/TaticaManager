# Tática Manager

**Tática Manager** é um manager de futebol feito em React e Vite. Assuma um clube, monte o elenco, escolha escalação e táticas, dispute ligas e copas e administre mercado, contratos, finanças, estádio e categoria de base.

> **Status:** `1.0.0-beta.28` — fim de temporada modularizado, objetivos completos, snapshot final preservado e calendário encerrado com segurança.

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

## Validação rápida
```bash
npm run test:smoke
```
Executa os smoke tests de pré-jogo, classificação, caixa de entrada, carreira, categoria de base, motor de partidas, pós-jogo, navegação, Central, Centro Médico, Elenco, Campo/Helpers, Boot/Sobre, Mercado e fim de temporada. Também é possível rodar cada domínio isoladamente com `npm run test:nextmatch`, `test:table`, `test:inbox`, `test:career`, `test:academy`, `test:match-engine`, `test:match-post`, `test:navigation`, `test:home`, `test:medical`, `test:squad`, `test:field`, `test:boot-about`, `test:market` ou `test:season-end`.

## Deploy
O frontend pode ser publicado diretamente na Vercel. O repositório contém `vercel.json`, Node 22.x e GitHub Actions para validar o build. Veja [DEPLOY.md](./DEPLOY.md).

## Arquitetura
O motor de partidas está em `src/engines/match/`; o núcleo do jogo foi dividido em `src/engines/core/`; o mercado é dividido entre `src/engines/market/` e `src/components/market/`; a criação de carreira fica em `src/components/setup/`; e a apresentação da partida ao vivo fica em `src/components/match/`; o pós-jogo em `src/components/postmatch/`; calendário/histórico em `src/components/matches/` + `src/engines/matches/`; finanças em `src/components/finances/` + `src/engines/finances/`; e escalação em `src/components/lineup/` + `src/engines/lineup/`; as regras de torneios ficam em `src/engines/cups/` com `cups_engine.js` preservado como fachada compatível; o perfil de atleta é dividido entre `src/components/player/` e `src/engines/player/playerProfileService.js`; o pré-jogo entre `src/components/nextmatch/` e `src/engines/nextmatch/nextMatchViewModel.js`; a caixa de entrada entre `src/components/inbox/` e `src/engines/inbox/inboxService.js`; a carreira entre `src/components/career/` e `src/engines/career/`; a categoria de base entre `src/components/academy/` e `src/engines/academy/`; a navegação inferior entre `src/components/navigation/` e `src/engines/navigation/`; a Central entre `src/components/home/` e `src/engines/home/`; o Centro Médico entre `src/components/medical/` e `src/engines/medical/`; o Elenco entre `src/components/squad/` e `src/engines/squad/`; o campo tático entre `src/components/field/` e `src/engines/field/`; a inicialização entre `src/components/boot/` e `src/engines/boot/`; a tela Sobre entre `src/components/about/` e `src/data/aboutChangelog.js`; e a virada de temporada entre `src/components/seasonEnd/` e `src/engines/season/`. Veja [ARCHITECTURE.md](./ARCHITECTURE.md).

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
- `1.0.0-beta.10` — finanças modularizadas, projeções centralizadas e resumo/histórico financeiro corrigidos.
- `1.0.0-beta.11` — escalação modularizada, 4-4-2 unificado e fluxo de titulares/adaptados corrigido.
- `1.0.0-beta.12` — motor de copas modularizado, calendários unificados e fases continentais corrigidas.
- `1.0.0-beta.13` — interface de copas modularizada e apresentação de ida/volta corrigida.
- `1.0.0-beta.14` — modal de jogador modularizado, listagem para venda e renovação contratual corrigidas.
- `1.0.0-beta.15` — pré-jogo modularizado, forma recente corrigida com calendário de Copas e agregado mais preciso.
- `1.0.0-beta.16` — classificação e artilharia modularizadas, dependências globais removidas e contratação de artilheiros reintegrada ao fluxo real do mercado.
- `1.0.0-beta.17` — caixa de entrada modularizada, ações de proposta/contrato corrigidas e mensagens normalizadas.
- `1.0.0-beta.18` — carreira modularizada, progresso de XP corrigido e shim `window.*` interno removido em favor de imports ES.
- `1.0.0-beta.19` — categoria de base modularizada, `academyReady` reintegrado à UI, investimentos corrigidos e folha salarial sincronizada na promoção.
- `1.0.0-beta.20` — `useMatchEngine` reduzido a orquestração, fluxos de Liga/Copa separados, fixtures imutáveis, `seasonGoals` corrigido e regras puras de escalação extraídas de `helpers.js`.
- `1.0.0-beta.21` — `BottomNav` reduzido a orquestração, diálogos separados, badges Base/Inbox corrigidos e navegação bloqueada de forma coerente durante simulações.
- `1.0.0-beta.22` — Central reduzida a composição, painel e navegação passam a compartilhar resumos, próxima partida/forma corrigidas para calendários com Copa e alertas de escalação generalizados.
- `1.0.0-beta.23` — Centro Médico e Elenco modularizados, custos médicos passam ao extrato, fadiga é exibida conforme o motor real e posições modernas ganham ordenação consistente.
- `1.0.0-beta.24` — campo tático modularizado, 4-1-4-1/4-5-1 corrigidos, helpers separados por responsabilidade e status de suspensão alinhado à próxima partida.
- `1.0.0-beta.25` — Boot e Sobre modularizados, identidade inicial sincronizada, saves ordenados por recência, PIX centralizado e progresso de saves alinhado ao calendário completo.
- `1.0.0-beta.26` — Mercado reorganizado em seções, validação de compras compartilhada com o elenco, janela baseada em rodada de Liga e transferências C/D sincronizadas.
- `1.0.0-beta.27` — pós-jogo dividido por responsabilidade, contexto de Liga/Calendário separado, pressão/avisos corrigidos e segundo amarelo volta a gerar suspensão.
- `1.0.0-beta.28` — fim de temporada modularizado, objetivos completos, calendário integral respeitado, snapshot final preservado e troféus do treinador sincronizados.
- `1.0.0` — futura primeira versão estável.

## Documentação
- [CHANGELOG.md](./CHANGELOG.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEPLOY.md](./DEPLOY.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## Licença
Nenhuma licença pública foi definida ainda. Até que uma licença seja adicionada, o código permanece sob os direitos do autor do repositório.

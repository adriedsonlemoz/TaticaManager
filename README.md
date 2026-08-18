# Tática Manager

**Tática Manager** é um manager de futebol feito em React e Vite. Assuma um clube, monte o elenco, escolha escalação e táticas, dispute ligas e copas e administre mercado, contratos, finanças, estádio e categoria de base.

> **Status:** `1.0.0-beta.52` — Nova Carreira exige seleção de clube real por `teamId`, deriva a Série pelo catálogo canônico, bloqueia criação manual de clube e passa a oferecer busca/filtros com os clubes de 2026, incluindo o catálogo de 96 participantes da Série D.

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
Executa os smoke tests de pré-jogo, classificação, temporadas completas, caixa de entrada, carreira, categoria de base, motor de partidas, IA dos clubes CPU, simulador de campo, pós-jogo, navegação, Central, Centro Médico, Elenco, Campo/Helpers, Boot/Sobre, Mercado, fim de temporada, Partidas/App, Finanças, partida ao vivo, competições continentais e schema/migrações de save. Na beta 52, a suíte completa fecha em **843/843 verificações aprovadas**, incluindo regressões específicas da Nova Carreira por `teamId`, catálogo de clubes, bloqueio de Série forjada, integridade de fixtures, duplicidade de save, schema 6 e compatibilidade dos saves legados, além de toda a cobertura da pirâmide persistente da beta 51. Também é possível rodar cada domínio isoladamente com `npm run test:nextmatch`, `test:table`, `test:league-season`, `test:inbox`, `test:career`, `test:academy`, `test:match-engine`, `test:cpu-ai`, `test:match-simulator`, `test:match-post`, `test:navigation`, `test:home`, `test:medical`, `test:squad`, `test:field`, `test:boot-about`, `test:market`, `test:continental`, `test:season-end`, `test:matches-app`, `test:finances`, `test:match-live`, `test:match-commit`, `test:save-schema`, `test:club-identity`, `test:pyramid` ou `test:new-career`.

## Deploy
O frontend pode ser publicado diretamente na Vercel. O repositório contém `vercel.json`, Node 22.x e GitHub Actions para validar o build. Veja [DEPLOY.md](./DEPLOY.md).

## Arquitetura
O motor de partidas está em `src/engines/match/`; o núcleo do jogo foi dividido em `src/engines/core/`; o mercado é dividido entre `src/engines/market/` e `src/components/market/`; a criação de carreira usa `src/components/setup/` na apresentação e `src/engines/core/careerCreation.js` como fronteira canônica de validação; e a apresentação da partida ao vivo fica em `src/components/match/`; o pós-jogo em `src/components/postmatch/`; calendário/histórico em `src/components/matches/` + `src/engines/matches/`; finanças em `src/components/finances/` + `src/engines/finances/`; e escalação em `src/components/lineup/` + `src/engines/lineup/`; as regras de torneios ficam em `src/engines/cups/` com `cups_engine.js` preservado como fachada compatível; o perfil de atleta é dividido entre `src/components/player/` e `src/engines/player/playerProfileService.js`; o pré-jogo entre `src/components/nextmatch/` e `src/engines/nextmatch/nextMatchViewModel.js`; a caixa de entrada entre `src/components/inbox/` e `src/engines/inbox/inboxService.js`; a carreira entre `src/components/career/` e `src/engines/career/`; a categoria de base entre `src/components/academy/` e `src/engines/academy/`; a navegação inferior entre `src/components/navigation/` e `src/engines/navigation/`; a Central entre `src/components/home/` e `src/engines/home/`; o Centro Médico entre `src/components/medical/` e `src/engines/medical/`; o Elenco entre `src/components/squad/` e `src/engines/squad/`; o campo tático entre `src/components/field/` e `src/engines/field/`; a inicialização entre `src/components/boot/` e `src/engines/boot/`; a tela Sobre entre `src/components/about/` e `src/data/aboutChangelog.js`; a virada de temporada entre `src/components/seasonEnd/` e `src/engines/season/`, com a pirâmide persistente centralizada em `src/engines/season/seasonPyramid.js`; a IA de clubes CPU entre `src/engines/cpu/` e a fachada `src/engines/engine_cpu_ai.js`; a persistência versionada em `src/engines/persistence/saveSchema.js` com invariantes em `src/engines/core/gameStateIntegrity.js`; a identidade permanente dos clubes em `src/data/clubCatalog.js` com migração em `src/engines/persistence/clubIdentity.js`; e o controlador principal entre `src/components/app/`, `src/hooks/useGameController.js`, `src/hooks/useRoundMaintenance.js` e `src/engines/app/`. Veja [ARCHITECTURE.md](./ARCHITECTURE.md).

## Compatibilidade de saves
O banco IndexedDB legado (`BrasfootDB`) e o `appId` do Capacitor continuam preservados. A partir da beta 49, o conteúdo de cada carreira possui `saveSchemaVersion`: saves antigos sem o campo são tratados como schema 0, migrados sequencialmente até o schema atual e regravados saneados; saves de schema mais novo que o suportado são recusados sem sobrescrita. Na beta 50, o schema 4 converte IDs antigos dependentes da divisão (`a1`, `b7`, etc.) em IDs permanentes por clube (`br-*`) e normaliza aliases sem mover a carreira de divisão. Na beta 51, o schema 5 transforma `leagues.A/B/C/D` na composição persistente da pirâmide: a série atual mantém 19 clubes CPU + usuário, as demais 20 CPU, e carreiras com clube personalizado preservam o clube deslocado em `pyramidReserve`. Na beta 52, o schema 6 fixa `club.teamId` como identidade canônica de clubes reais; saves personalizados antigos continuam compatíveis, mas novas carreiras só podem ser criadas a partir de um `teamId` válido do catálogo.

## Versionamento
- `1.0.0-beta.52` — Nova Carreira por clube real, Série derivada exclusivamente de `teamId`, tela de seleção com busca/filtros, catálogo de 156 clubes 2026, schema 6 e proteção atômica contra sobrescrita de save.
- `1.0.0-beta.51` — pirâmide A/B/C/D persistente, acesso/rebaixamento real dos clubes CPU, troca de clube do manager preservando divisão/elencos, schema 5 e Copas integradas às divisões dinâmicas.
- `1.0.0-beta.50` — identidade canônica de clubes, base brasileira 2026 atualizada, IDs permanentes entre divisões e migração segura dos saves beta 49/legados.
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
- `1.0.0-beta.29` — calendário/histórico dividido por responsabilidade, `app.jsx` reduzido a composição e manutenção de rodada/venda rápida centralizadas e testáveis.
- `1.0.0-beta.30` — Libertadores/Sul-Americana divididas por domínio, grupos completos com CPU×CPU, adversários sem repetição e premiações de Copas pagas pelo delta real acumulado.
- `1.0.0-beta.31` — simulador de campo dividido por responsabilidade, segundo amarelo corrigido, reservas/expulsos respeitam o elenco ativo e mando/estilos/IA tática foram alinhados às regras reais do motor.
- `1.0.0-beta.33` — IA dos clubes CPU dividida por domínio, janela/orçamento/elenco mínimo passam a ser respeitados, contratos e agentes livres corrigidos e movimentações passam a alterar a força efetiva do adversário.
- `1.0.0-beta.34` — auditoria financeira: bilheteria de visitante, projeções por rodada da Liga, folha real, ledger por temporada e custos recorrentes corrigidos.
- `1.0.0-beta.35` — interface ao vivo modularizada, pré-jogo passa a aguardar o início real, rodada só é confirmada após a partida e eventos/rosters do playback são consistentes.
- `1.0.0-beta.36` — parser de eventos auditado: gols, pênaltis, gol contra, cartões, substituições, eventos neutros e acréscimos passam a ter leitura consistente.
- `1.0.0-beta.37` — playback/apresentação/pós-jogo endurecidos, acréscimos de 45+N permanecem no primeiro tempo, posse/placar são normalizados e timers/IDs/eventos inválidos deixam de contaminar a partida.
- `1.0.0-beta.38` — hook de apresentação, tela ao vivo e substituições refatorados; comemorações/timers não ficam presos, pausa/som não divergem e 45+N permanece correto também no intervalo.
- `1.0.0-beta.39` — intervalo, retomada do segundo tempo e pós-jogo refatorados; súmula, desfalques, rodada e finanças passam a usar dados normalizados sem fallback para partidas antigas.
- `1.0.0-beta.40` — commit Liga/Copa unificado; gols de pênalti, fadiga, lesões, disciplina, moral, histórico do treinador, confronto direto e finanças passam a persistir pelo mesmo fluxo validado.
- `1.0.0-beta.41` — commit tardio/idempotente, lock contra toque duplo, autosave do estado confirmado, gravações Dexie serializadas e minutos/fadiga das substituições manuais persistidos.
- `1.0.0-beta.42` — identidade casa/fora centralizada, pré-jogo e escalações alinhados ao lado real do usuário, escalação estruturalmente validada e ID numérico `0` preservado no snapshot da partida.
- `1.0.0-beta.43` — eventos futuros reconciliados com a escalação ativa; substituições/expulsões atualizam campo, narração, rawEvents, minutos, fadiga, disciplina e assistências no commit.
- `1.0.0-beta.44` — estado canônico unifica placar/eventos/estatísticas/escalações; playback e auto-simulação compartilham snapshots, eventos são idempotentes e o commit é bloqueado se houver divergência de integridade.
- `1.0.0-beta.45` — manutenção pós-partida é atômica com o commit, IDs de inbox incluem temporada, duplicatas legadas são saneadas e H2H é preservado na carreira.
- `1.0.0-beta.46` — slots de Copa sem jogo passam a representar descanso real: energia/lesões avançam, suspensões preservam jogos a cumprir e a próxima partida usa a data jogável correta.
- `1.0.0-beta.47` — classificação passa a ser derivada dos fixtures; rodadas já processadas são idempotentes, saves divergentes são reconciliados e a temporada ganha barreiras de integridade com testes de estresse completos.
- `1.0.0-beta.48` — mercado e contratos passam por transações canônicas: compras, vendas e renovações revalidam o estado atual, sincronizam rosters/finanças, preservam agentes livres e impedem propriedade duplicada inclusive em saves antigos.
- `1.0.0-beta.49` — persistência ganha schema versionado e migrações idempotentes; saves futuros são bloqueados e `players`/`teamRosters.user` permanecem sincronizados também durante a sessão.
- `1.0.0` — futura primeira versão estável.

## Documentação
- [CHANGELOG.md](./CHANGELOG.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEPLOY.md](./DEPLOY.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

## Licença
Nenhuma licença pública foi definida ainda. Até que uma licença seja adicionada, o código permanece sob os direitos do autor do repositório.

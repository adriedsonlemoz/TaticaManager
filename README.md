# Tática Manager

**Tática Manager** é um manager de futebol feito em React e Vite. Assuma um clube, monte o elenco, escolha escalação e táticas, dispute ligas e copas e administre mercado, contratos, finanças, estádio e categoria de base.

> **Status:** `1.0.0-beta.60` — seis novos estaduais, 14/27 campeonatos estaduais suportados e schema 14.

## Principais recursos
- Séries A, B, C e D, Copa do Brasil, continentais, regionais e primeiros estaduais 2026.
- Simulação com eventos, estatísticas, cartões, pênaltis e influência tática.
- Escalação, formações, fadiga, lesões, suspensões e moral.
- Mercado, contratos, salários e clubes controlados pela CPU.
- Finanças, estádio, categoria de base, histórico de carreira e Central de Notícias com eventos reais do save.
- Múltiplos saves locais via IndexedDB/Dexie.
- Interface responsiva com Material UI, Web e empacotamento Android via Capacitor.

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
Executa os smoke tests de pré-jogo, classificação, temporadas completas, caixa de entrada, carreira, categoria de base, motor de partidas, IA dos clubes CPU, simulador de campo, pós-jogo, navegação, Central, Centro Médico, Elenco, Campo/Helpers, Boot/Sobre, Mercado, fim de temporada, Partidas/App, Finanças, partida ao vivo, continentais, regionais, estaduais, schema/migrações de save, calendário anual/civil, Série C, Série D, densidade responsiva e workflow Android. Na beta 60, a suíte completa fecha em **1.032/1.032 verificações aprovadas** em 37 grupos. Os domínios novos podem ser executados isoladamente com `npm run test:news`, `npm run test:current-bugs`, `npm run test:state`, `npm run test:android-ci`, `npm run test:runtime-errors`, `npm run test:regionals`, `npm run test:calendar-dates` e `npm run test:save-schema`, além das suítes já existentes.

## Deploy
O frontend pode ser publicado diretamente na Vercel. Para Android, o workflow `.github/workflows/android-apk.yml` gera um APK debug no GitHub Actions usando o `capacitor.config.json` existente, sem versionar a pasta `android/` gerada. Veja [DEPLOY.md](./DEPLOY.md).

### APK Android no GitHub
1. Envie o projeto para `main` ou `master`, ou abra **Actions → Android APK → Run workflow**.
2. O job executa `npm ci`, a suíte completa, o build Vite, instala Capacitor 8 no runner, cria/sincroniza o projeto Android e roda `assembleDebug`.
3. Ao final, baixe o artefato **`tatica-manager-debug-apk`** da execução.

O APK gerado é de **debug/teste**. Publicação em loja deve usar uma etapa futura de assinatura e AAB/release; chaves de assinatura não ficam no repositório.

## Arquitetura
O motor de partidas está em `src/engines/match/`; o núcleo do jogo foi dividido em `src/engines/core/`; o mercado é dividido entre `src/engines/market/` e `src/components/market/`; a criação de carreira usa `src/components/setup/` na apresentação e `src/engines/core/careerCreation.js` como fronteira canônica de validação; e a apresentação da partida ao vivo fica em `src/components/match/`; o pós-jogo em `src/components/postmatch/`; calendário/histórico em `src/components/matches/` + `src/engines/matches/`; finanças em `src/components/finances/` + `src/engines/finances/`; e escalação em `src/components/lineup/` + `src/engines/lineup/`; as regras de torneios ficam em `src/engines/cups/` com `cups_engine.js` preservado como fachada compatível; o perfil de atleta é dividido entre `src/components/player/` e `src/engines/player/playerProfileService.js`; o pré-jogo entre `src/components/nextmatch/` e `src/engines/nextmatch/nextMatchViewModel.js`; a caixa de entrada entre `src/components/inbox/` e `src/engines/inbox/inboxService.js`; a carreira entre `src/components/career/` e `src/engines/career/`; a categoria de base entre `src/components/academy/` e `src/engines/academy/`; a navegação inferior entre `src/components/navigation/` e `src/engines/navigation/`; a Central entre `src/components/home/` e `src/engines/home/`; o Centro Médico entre `src/components/medical/` e `src/engines/medical/`; o Elenco entre `src/components/squad/` e `src/engines/squad/`; o campo tático entre `src/components/field/` e `src/engines/field/`; a inicialização entre `src/components/boot/` e `src/engines/boot/`; a tela Sobre entre `src/components/about/` e `src/data/aboutChangelog.js`; a virada de temporada entre `src/components/seasonEnd/` e `src/engines/season/`, com a pirâmide persistente centralizada em `src/engines/season/seasonPyramid.js`; a IA de clubes CPU entre `src/engines/cpu/` e a fachada `src/engines/engine_cpu_ai.js`; a persistência versionada em `src/engines/persistence/saveSchema.js` com invariantes em `src/engines/core/gameStateIntegrity.js`; a identidade permanente dos clubes em `src/data/clubCatalog.js` com migração em `src/engines/persistence/clubIdentity.js`; e o controlador principal entre `src/components/app/`, `src/hooks/useGameController.js`, `src/hooks/useRoundMaintenance.js` e `src/engines/app/`; o calendário anual entre `src/engines/calendar/seasonCalendar.js`, `src/engines/calendar/calendarDateEngine.js` e `src/engines/CalendarEngine.js`; os estaduais entre `src/engines/cups/stateConfig.js` e `src/engines/cups/stateEngine.js`; e a Central de Notícias entre `src/engines/news/` e `src/components/news/`/`ScreenNews.jsx`. Veja [ARCHITECTURE.md](./ARCHITECTURE.md).

## Compatibilidade de saves
O banco IndexedDB legado (`BrasfootDB`) e o `appId` do Capacitor continuam preservados. A partir da beta 49, o conteúdo de cada carreira possui `saveSchemaVersion`: saves antigos sem o campo são tratados como schema 0, migrados sequencialmente até o schema atual e regravados saneados; saves de schema mais novo que o suportado são recusados sem sobrescrita. Na beta 50, o schema 4 converte IDs antigos dependentes da divisão (`a1`, `b7`, etc.) em IDs permanentes por clube (`br-*`) e normaliza aliases sem mover a carreira de divisão. Na beta 51, o schema 5 transforma `leagues.A/B/C/D` na composição persistente da pirâmide: a série atual mantém 19 clubes CPU + usuário, as demais 20 CPU, e carreiras com clube personalizado preservam o clube deslocado em `pyramidReserve`. Na beta 52, o schema 6 fixa `club.teamId` como identidade canônica de clubes reais; saves personalizados antigos continuam compatíveis, mas novas carreiras só podem ser criadas a partir de um `teamId` válido do catálogo. Na beta 53, o schema 7 ativa a Série D completa: saves ainda não iniciados migram para grupos e saves da D já em andamento preservam o calendário legado até a próxima virada. Na beta 54, o schema 8 adiciona datas civis canônicas ao calendário e prepara a Série C 2027 dedicada; uma Série C 2027 já iniciada no modelo legado é preservada até a virada, sem apagar resultados. Na beta 55, o schema 9 adiciona o modelo de calendário anual: saves ainda zerados podem ser redistribuídos imediatamente pelas novas datas-alvo; carreiras já iniciadas preservam sua agenda e resultados atuais e adotam o novo modelo na temporada seguinte. Na beta 56, o schema 10 adiciona copas regionais e corrige o formato 2026 da Copa do Brasil em saves ainda zerados; temporadas já iniciadas preservam a competição/calendário legado até a próxima virada. Na beta 57, o schema 11 adiciona o estadual elegível (Carioca/Gaúcho) apenas a saves ainda zerados; carreiras em andamento permanecem intactas e recebem a nova competição na temporada seguinte. Na beta 58, o schema 12 amplia o catálogo para oito estaduais e corrige a reconstrução da agenda de saves zerados: novas competições só entram imediatamente antes da primeira partida; temporadas iniciadas continuam preservadas até a virada. Na beta 59, o schema 13 adiciona `newsFeed`/`career-news-v1`, reconcilia entradas por ID determinístico e faz backfill conservador apenas de resultados e transferências já comprovados no save. Na beta 60, o schema 14 amplia a camada estadual para 14 campeonatos; saves zerados de clubes recém-atendidos recebem o estadual e calendário imediatamente, enquanto temporadas iniciadas adiam a inclusão para a próxima virada.

## Versionamento
- `1.0.0-beta.60` — Goiano, Paraense, Paraibano, Alagoano, Potiguar e Sergipano 2026; 14/27 estaduais e schema 14.
- `1.0.0-beta.59` — Central de Notícias persistente, RNG canônico em partida/público/fadiga/lesões, indicador de rodada da Liga corrigido e schema 13.
- `1.0.0-beta.58` — Paulista, Mineiro, Paranaense, Catarinense, Baiano e Pernambucano 2026; oito estaduais no total, auditoria de bugs e schema 12.
- `1.0.0-beta.57` — Carioca/Gaúcho 2026, workflow Android/Capacitor para APK debug, correções de runtime/estádio/safe area e schema 11.
- `1.0.0-beta.56` — copas regionais 2026, Copa do Brasil 2026, mercado por data civil, correções de calendário/histórico e schema 10.
- `1.0.0-beta.55` — calendário anual com datas-alvo por competição, atividades diárias, migração schema 9 e interface compacta/responsiva com `100dvh`.
- `1.0.0-beta.54` — calendário diário com recuperação/véspera/jogo, intervalo mínimo entre compromissos, relógio ao vivo sincronizado aos lances, Série C 2027 dedicada, expansão para 28 clubes em 2028 e schema 8.
- `1.0.0-beta.53` — Série D 96×16, primeira fase em turno e returno, mata-mata completo, seis acessos em 2026, Série C com 24 clubes em 2027 e schema 7.
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

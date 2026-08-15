# Arquitetura — Tática Manager

Tática Manager é uma aplicação frontend React/Vite; a carreira e as regras rodam no cliente e não exigem backend.

```text
React UI
 ├─ hooks
 │   ├─ useMatchEngine
 │   └─ useRoundAdvance
 ├─ engines
 │   ├─ core/
 │   ├─ match/
 │   ├─ market/
 │   ├─ cups_engine (fachada)
 │   ├─ cups/
 │   ├─ engine_finances
 │   ├─ engine_discipline
 │   ├─ engine_fatigue
 │   ├─ engine_injuries
 │   ├─ engine_academy
 │   └─ engine_cpu_ai
 └─ persistence / IndexedDB
```


## Núcleo do jogo
`src/engines/engine.js` funciona como barrel de compatibilidade. As regras centrais ficam separadas em `src/engines/core/`:
- `playerFactory.js`: geração de jogadores e elencos.
- `playerDevelopment.js`: evolução/regressão de fim de temporada.
- `leagueEngine.js`: calendário, tabela, desempate e zonas da classificação.
- `gameStateFactory.js`: criação do estado inicial de uma carreira.
- `seasonEngine.js`: promoção/rebaixamento, renovação anual e transição de temporada.
- `teamMetrics.js`: forma recente e força disponível de clubes CPU.

A API pública de `engine.js` foi preservada para evitar mudanças em massa nos consumidores existentes.

## Motor de partidas
- `matchSimulator.js`: simulação de campo.
- `matchPlayback.js`: reprodução e narração.
- `matchPlayerStats.js`: estatísticas individuais.
- `matchPostProcessor.js`: pós-jogo.

## Interface da partida
- `src/components/ScreenMatchResult.jsx`: estado e transição entre pré-jogo, partida, intervalo e pós-jogo.
- `src/components/match/MatchHeader.jsx`: placar e status da partida.
- `src/components/match/MatchField.jsx`: campo, formações e jogadores.
- `src/components/match/MatchNarration.jsx`: feed de eventos.
- `src/components/match/MatchBench.jsx`: banco e substituições realizadas.
- `src/components/match/SubstitutionDialog.jsx`: fluxo de substituição.
- `src/components/match/MatchLiveView.jsx`: composição da tela ao vivo e controles.
- `src/components/match/MatchOverlays.jsx`: gol, pausa e som.


## Pós-jogo
- `src/components/ScreenPostMatch.jsx`: coordena abas, bloqueio por desfalques e retorno ao painel.
- `src/components/postmatch/PostMatchHeader.jsx`: resultado, placar e contexto da competição.
- `PostMatchSummaryTab.jsx`: gols, cartões, substituições e estatísticas.
- `PostMatchFinanceTab.jsx`: receitas e resultados da rodada usando o histórico financeiro aplicado ao save.
- `PostMatchTableTab.jsx`: classificação, zonas e variação real de posição.
- `PostMatchAbsencesTab.jsx`: suspensões, lesões e bloqueio de escalação.
- `postMatchViewModel.js`: parsing e view-models puros do pós-jogo.

As estatísticas secundárias exibidas no pós-jogo são produzidas/persistidas pelo motor da partida, evitando aleatoriedade dentro da camada React.


## Calendário e partidas
- `src/components/ScreenMatches.jsx`: orquestra estado visual, filtros, dia selecionado e súmula.
- `src/components/matches/`: calendário, próximos jogos, resultados recentes, detalhe do dia e diálogo de súmula.
- `src/engines/matches/matchesViewModel.js`: monta eventos de Liga/Copa, histórico, próximos jogos e normaliza `calendarSlot` versus rodada da Liga.
- `src/utils/matchDateUtils.js`: fonte única das datas de rodadas e jogos de Copa.

Jogos de Copa já disputados também são resolvidos pelo view-model para permanecerem visíveis no calendário mensal.


## Finanças
- `src/components/ScreenFinances.jsx`: coordena a aba ativa e ações comerciais.
- `src/components/finances/FinanceHeader.jsx`: saldo, indicadores, risco financeiro e navegação.
- `FinanceOverviewTab.jsx`: projeção de receitas/despesas e recomendações do diretor financeiro.
- `FinanceHistoryTab.jsx`: extrato compatível com registros modernos e legados.
- `FinanceSponsorsTab.jsx`: contratos máster e naming rights.
- `FinanceEvolutionTab.jsx`: gráfico e resumo acumulado da temporada.
- `src/engines/finances/financeViewModel.js`: projeções, ofertas, assinatura de contratos, normalização do histórico e agregações.
- `src/engines/engine_finances.js`: regras de TV, bilheteria, custos operacionais e risco financeiro.

A UI financeira não depende mais de `window.FinanceEngine` ou do antigo stub `window.getFinancialSuggestions`.


## Escalação
- `src/components/ScreenLineup.jsx`: orquestra estado, seleção, autoescala, edição de camisa e persistência.
- `src/components/lineup/LineupHeader.jsx`: formação, OVR, ações de autoescala e salvar.
- `LineupField.jsx`: distribuição visual de titulares no gramado, inclusive improvisados.
- `LineupPlayerCard.jsx` e `LineupRoster.jsx`: banco, indisponíveis, energia, cartões e jogadores adaptados.
- `LineupDialogs.jsx`: picker por posição e edição do número da camisa.
- `src/engines/lineup/lineupService.js`: view-model, disponibilidade, troca de formação, autoescala e mutações puras da escalação.

`FORMATION_SLOTS` continua como regra global de limites por posição; na beta.11 o 4-4-2 foi alinhado ao campo visual (`PD + 2 VOL + PE`) para eliminar divergência entre validação e seleção manual.


## Copas e torneios
- `src/engines/cups_engine.js`: fachada pública de compatibilidade; consumidores antigos continuam importando `CupsEngine` pelo mesmo caminho.
- `src/engines/cups/cupConfig.js`: fonte única de fases, premiações e posições de calendário da Copa do Brasil, Libertadores e Sul-Americana.
- `copaBrasilEngine.js`: inicialização, progressão e resultados da Copa do Brasil.
- `continentalEngine.js`: grupos e mata-mata da Libertadores/Sul-Americana.
- `cupQueries.js`: consultas de jogos atuais e próximos confrontos.
- `cupSeason.js`: classificação e inicialização dos torneios a cada temporada.
- `cupUtils.js`: confrontos, pênaltis, agregados e utilitários compartilhados.

`CalendarEngine.js` consome a mesma configuração de `cupConfig.js`, evitando divergência entre a rodada exibida e o slot realmente criado. A fase de grupos continental só encerra após os seis jogos (ida e volta contra três adversários), e as finais de Libertadores/Sul-Americana são tratadas como jogo único.

## Mercado
`src/engines/market/marketService.js` concentra filtros, OVR por divisão, renovação do mercado, clubes CPU, série, negociação, proposta mínima, transferências e venda ao estado do jogo. `ScreenMarket.jsx` continua responsável pelos estados React e pela apresentação.


## Criação de carreira
- `src/components/ScreenSetup.jsx`: estado do fluxo e transição entre etapas.
- `src/components/setup/SetupSteps.jsx`: roteamento da etapa ativa.
- `src/components/setup/steps/`: componentes de divisão, clube, carreira, técnico, uniforme e contrato.
- `src/components/setup/SetupUi.jsx`: elementos visuais compartilhados.
- `src/components/setup/setupTheme.js`: paleta, estilos e utilitários de apresentação.
- `src/components/setup/setupService.js`: validação e resolução de dados sem globals em `window`.


## Perfil de jogador
- `src/components/PlayerModal.jsx`: orquestra o modal e a aba ativa.
- `src/components/player/PlayerModalHeader.jsx`: identificação, camisa, posição e OVR.
- `PlayerProfileTab.jsx`: físico, valor, potencial e lista de transferências.
- `PlayerSeasonTab.jsx`: produção na temporada, energia, contrato e lesões.
- `PlayerShirtTab.jsx`: seleção de numeração disponível.
- `PlayerWageTab.jsx`: reajuste salarial e renovação.
- `PlayerDisciplineTab.jsx`: cartões e suspensão.
- `src/engines/player/playerProfileService.js`: regras puras de potencial, salário, camisas, listagem e disciplina.

## Compatibilidade
O banco Dexie legado e o `appId` do Capacitor foram preservados no rename para evitar que saves existentes desapareçam para o usuário.

## Próximos alvos
1. Refatorar `ScreenNextMatch.jsx`, hoje um dos maiores componentes visuais restantes.
2. Separar `ScreenTable.jsx`, `ScreenInbox.jsx` e `ScreenCareer.jsx` por responsabilidade.
3. Fazer uma rodada final em `useMatchEngine.js`, `BottomNav.jsx` e globals legados ainda presentes fora dos fluxos já modularizados.
4. Centralizar a aleatoriedade remanescente e ampliar testes automatizados antes da versão estável.


## Mercado
A tela de transferências segue a divisão entre orquestração, apresentação e domínio:
- `src/components/ScreenMarket.jsx`: estado visual e coordenação das ações.
- `src/components/market/MarketPlayerCards.jsx`: cards reutilizáveis de compra e venda.
- `src/components/market/MarketSections.jsx`: cabeçalho, negociação e conteúdo das cinco abas.
- `src/engines/market/marketService.js`: filtros, Scout, negociação, vendas, favoritos e regras puras do mercado.

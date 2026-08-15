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
 │   ├─ cups_engine
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

## Mercado
`src/engines/market/marketService.js` concentra filtros, OVR por divisão, renovação do mercado, clubes CPU, série, negociação, proposta mínima, transferências e venda ao estado do jogo. `ScreenMarket.jsx` continua responsável pelos estados React e pela apresentação.


## Criação de carreira
- `src/components/ScreenSetup.jsx`: estado do fluxo e transição entre etapas.
- `src/components/setup/SetupSteps.jsx`: roteamento da etapa ativa.
- `src/components/setup/steps/`: componentes de divisão, clube, carreira, técnico, uniforme e contrato.
- `src/components/setup/SetupUi.jsx`: elementos visuais compartilhados.
- `src/components/setup/setupTheme.js`: paleta, estilos e utilitários de apresentação.
- `src/components/setup/setupService.js`: validação e resolução de dados sem globals em `window`.

## Compatibilidade
O banco Dexie legado e o `appId` do Capacitor foram preservados no rename para evitar que saves existentes desapareçam para o usuário.

## Próximos alvos
1. Modularizar `ScreenFinances.jsx` e revisar `ScreenLineup.jsx`.
2. Continuar centralizando aleatoriedade e criar testes unitários.
3. Revisar `MatchField.jsx` e outros componentes restantes acima de 200 linhas.
4. Reduzir acoplamento de `ScreenLineup.jsx` e `cups_engine.js`.


## Mercado
A tela de transferências segue a divisão entre orquestração, apresentação e domínio:
- `src/components/ScreenMarket.jsx`: estado visual e coordenação das ações.
- `src/components/market/MarketPlayerCards.jsx`: cards reutilizáveis de compra e venda.
- `src/components/market/MarketSections.jsx`: cabeçalho, negociação e conteúdo das cinco abas.
- `src/engines/market/marketService.js`: filtros, Scout, negociação, vendas, favoritos e regras puras do mercado.

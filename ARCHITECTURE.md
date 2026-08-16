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
 │   ├─ nextmatch/
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
- `seasonEngine.js`: orquestrador da nova temporada; regras anuais ficam em `src/engines/season/`.
- `teamMetrics.js`: forma recente e força disponível de clubes CPU.

A API pública de `engine.js` foi preservada para evitar mudanças em massa nos consumidores existentes.

## Virada de temporada
- `src/hooks/useRoundAdvance.js`: detecta o fim real do calendário e solicita a transição, sem montar regras anuais no hook.
- `src/engines/season/seasonTransitionService.js`: coordena objetivo, histórico, geração da nova temporada e reinicialização das copas.
- `seasonObjective.js`: avalia todos os objetivos oferecidos no setup.
- `seasonOutcome.js`: tabela final, movimento de divisão, snapshot e histórico da temporada encerrada.
- `seasonRoster.js`: idade, contratos, reajustes, evolução e limpeza anual do elenco.
- `seasonTeams.js`: pools CPU, troca de clube e renovação dos rosters adversários.
- `seasonClub.js`: caixa, orçamento anual, folha, torcida, dificuldade e troféus do treinador.
- `seasonAcademy.js`: evolução anual e normalização da base/`academyReady`.
- `seasonEndViewModel.js`: adapta o snapshot final para a tela de resumo.
- `src/components/seasonEnd/`: apresentação do resumo, elenco, finanças e classificação final.

A temporada só é encerrada quando o calendário completo termina. O snapshot de `seasonResult` é criado antes dos resets anuais, evitando que assistências, artilharia, classificação e indicadores do ano encerrado sejam perdidos quando a nova temporada é gerada.

## Motor de partidas
- `src/hooks/useMatchEngine.js`: orquestra o fluxo React, estados visuais e playback; não calcula mais a rodada inteira.
- `matchPreflight.js`: inicialização/reconstrução do calendário, validação de titulares e salto de slots de Copa inativos.
- `matchLeagueRound.js`: simulação imutável da rodada de Liga, atualização de tabela, fixtures e forma recente.
- `matchCupRound.js`: simulação e fechamento financeiro/disciplinar de um slot de Copa.
- `matchRoundState.js`: consolida o próximo estado da Liga, delegando regras de domínio aos processadores pós-jogo.
- `matchRoundContext.js`: separa rodada do calendário completo, rodada da Liga e próxima partida para impedir mistura entre Liga e Copa.
- `matchPlayerPostProcessor.js`: moral individual, minutos, disciplina, fadiga/lesões e preparação final dos jogadores.
- `matchNotifications.js` + `matchNotificationBuilders.js`: avisos de imprensa, contratos, diretoria, torcida, DM, Base e suspensões.
- `matchAcademyPostProcessor.js`: progressão periódica da categoria de base pela rodada da Liga.
- `matchTransferPostProcessor.js`: atividade CPU e renovação do mercado pela rodada da Liga.
- `matchStateUtils.js`: utilitários puros para artilharia por jogador, H2H, perfil do técnico e obras.
- `matchSimulator.js`: simulação de campo.
- `matchPlayback.js`: reprodução e narração.
- `matchPlayerStats.js`: estatísticas individuais.
- `matchPostProcessor.js`: barril legado que reexporta os processadores especializados para compatibilidade.

A rodada de Liga não muta mais `gameData.fixtures`: o motor cria uma nova rodada, salva o novo array explicitamente e só então produz o próximo estado. A sincronização de `seasonGoals` também ocorre antes da preparação final dos jogadores. Desde a beta.27, `gameData.round` (calendário Liga + Copas) e `gameData.leagueRound` (Liga) são tratados por um contexto explícito no pós-jogo.

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
- `src/engines/lineup/lineupRules.js`: formações, compatibilidade de posições e validação/força da escalação sem dependência de React.

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
- `src/components/ScreenMarket.jsx`: compositor/orquestrador da tela de transferências.
- `src/hooks/useMarketController.js`: estado das abas/filtros, favoritos e ações de compra, negociação, listagem, venda e renovação do catálogo.
- `src/components/market/sections/`: cabeçalho, negociação e as cinco abas do mercado em componentes independentes.
- `src/components/market/MarketPlayerCards.jsx`: cards reutilizáveis de compra e venda.
- `src/engines/market/marketViewModel.js`: constantes, filtros ativos, clubes, Scout e resumo do cabeçalho.
- `src/engines/market/marketService.js`: transformação de dados, Scout, favoritos, resolução de jogador e mutações de venda.
- `src/engines/market/transferRules.js`: fonte única de janela, caixa/orçamento, limite do elenco, situação financeira, reputação e mínimo do vendedor.

A UI e `useSquad` usam a mesma validação de contratação. A janela é calculada pela próxima rodada de Liga (`leagueRound + 1`), sem tratar slots de Copa como rodadas do mercado. Compras e vendas mantêm `teamRosters`, `teams` e ligas A/B/C/D sincronizados.


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


## Pré-jogo / próxima partida
- `src/components/ScreenNextMatch.jsx`: orquestra a composição da tela, início da partida e simulação rápida.
- `src/components/nextmatch/NextMatchHeader.jsx`: contexto da competição, data e ações Jogar/Simular/Menu.
- `NextMatchOverview.jsx`: mandante/visitante, classificação, força, H2H e forma recente.
- `NextMatchLineups.jsx`: titulares do usuário e escalação estimada do adversário.
- `NextMatchLineupStatus.jsx`: validação, inaptos e requisitos de posições.
- `NextMatchAggregate.jsx`: placar da ida e necessidade real de gols no jogo de volta.
- `NextMatchSeasonEnd.jsx`: fallback de fim de temporada.
- `src/engines/nextmatch/nextMatchViewModel.js`: resolve slots de Liga/Copa, adversário, titulares CPU, forma recente e agregado sem espalhar regras pela UI.

A forma recente usa somente partidas de Liga efetivamente jogadas, sem tratar `gameData.round` (slot do calendário completo) como índice direto de `fixtures`. A tela também deixou de consumir diretamente os globals de TeamIcon, JerseyBadge, DisciplineEngine e validação da escalação. A simulação rápida é enviada a `startMatchSimulation({ autoSimulate: true })`, sem a antiga flag global `_smrAutoSimulate`.

## Classificação e artilharia
- `src/components/ScreenTable.jsx`: mantém somente estado das abas, seleção do artilheiro e coordenação da contratação.
- `src/components/table/LeagueTableHeader.jsx`: título, progresso da temporada e navegação acessível entre abas.
- `src/components/table/StandingsView.jsx`: tabela, linhas, zonas, movimentos de fim de temporada e legenda.
- `src/components/table/TopScorersView.jsx`: ranking de artilheiros e estados vazios.
- `src/components/table/ScorerDialog.jsx`: detalhes financeiros e ação de contratação.
- `src/engines/table/tableViewModel.js`: zonas por série, movimentos, progresso, saldo de gols, técnicos, artilharia e regras básicas de disponibilidade da compra.

A tela deixou de redefinir `posColor`/`ovrColor` e não depende mais de `window.TeamIcon` ou `window.getTeamCoach`. A contratação a partir do ranking volta a receber `buyPlayer`, `formatMoney` e `showToast` por `sharedProps`, mantendo a validação final no fluxo central de transferências.


## Caixa de entrada
- `src/components/ScreenInbox.jsx`: mantém estado visual, seleção e coordenação das ações da mensagem.
- `src/components/inbox/InboxMailbox.jsx`: cabeçalho, filtros, abas, lista, lixeira e confirmação de exclusão.
- `src/components/inbox/InboxMessageReader.jsx`: leitura, cartões de proposta e botões de resposta.
- `src/engines/inbox/inboxService.js`: geração, ordenação, busca, contadores, normalização e mutações puras das mensagens.

A Inbox passa a tratar explicitamente `link`, `sell`, `managerOffer` e `renew_contract`. Alertas `warning` permanecem informativos e não exibem mais uma resposta inexistente. Mensagens antigas sem `date` ou `preview` ganham fallbacks por `round` e `body`. A renovação contratual reutiliza `CpuAI.applyContractRenewal`, que agora recalcula `club.wage` a partir do elenco atualizado.


## Carreira do treinador
- `src/components/ScreenCareer.jsx`: mantém apenas composição da tela, abertura da proposta e coordenação das ações.
- `src/components/career/`: hero do treinador, proposta pendente, estatísticas da temporada, carreira acumulada, moral/torcida, histórico, H2H, Copa do Brasil e modal de proposta.
- `src/engines/career/careerViewModel.js`: nível/XP, iniciais, aproveitamento, saldo, histórico e confrontos diretos.
- `src/engines/career/managerOfferService.js`: fonte única para localizar, aceitar e recusar propostas de clube, compartilhada também pela Inbox.

A barra de experiência passa a seguir os marcos reais de nível (5, 20, 50 e 100 XP), evitando a barra vazia no nível Lendário. A tela não depende mais de `window.TeamIcon`.

## Categoria de base
- `src/components/ScreenAcademy.jsx`: mantém estado visual, seleção do prospecto e coordenação das ações.
- `src/components/academy/AcademyHeader.jsx`: nível, prestígio, indicadores e navegação.
- `AcademySquadTab.jsx` e `AcademyProspectCard.jsx`: filtros, lista, projeção e ações dos garotos.
- `AcademyInvestTab.jsx`: níveis, custos e benefícios alinhados às regras reais do motor.
- `AcademyDialogs.jsx`: confirmações de promoção e dispensa.
- `src/engines/academy/academyViewModel.js`: pools ativos/prontos, filtros, estatísticas, salário, progresso e mutações puras.
- `src/engines/engine_academy.js`: geração, evolução, promoção, academias CPU e validação dos upgrades.

Garotos movidos para `academyReady` no fim da temporada permanecem visíveis e promovíveis; saves antigos que já contenham esse pool são normalizados sem duplicação. Promoção/dispensa remove o prospecto de ambos os pools, e a promoção recalcula `club.wage`. Investimentos só permitem níveis superiores e a interface deixa de afirmar que o nível aumenta OVR/potencial inicial: o benefício real é maior chance de evolução.

## Navegação inferior
- `src/components/BottomNav.jsx`: mantém apenas o estado do menu aberto, navegação, salvar e exportar backup.
- `src/components/navigation/BottomNavigationBar.jsx`: barra fixa e badges acessíveis.
- `TeamNavigationDialog.jsx`, `ClubNavigationDialog.jsx` e `OptionsNavigationDialog.jsx`: apresentação dos três submenus.
- `NavDialogPrimitives.jsx`: cabeçalho, linha de menu, fechamento e estilo compartilhado dos diálogos.
- `src/engines/navigation/bottomNavViewModel.js`: itens da barra, bloqueio durante simulação, badges, disponibilidade do elenco, resumo da Base/Clube/Inbox e nome de backup.

O resumo da Base usa os pools `academy` + `academyReady`, evitando esconder garotos prontos para promoção. O progresso do clube usa o tamanho do calendário completo quando disponível, inclusive slots de Copa. Durante uma simulação, itens indisponíveis agora aparecem realmente desabilitados em vez de parecerem clicáveis sem executar ação. O backup JSON passa a usar o prefixo `tatica_manager_`.

## Central / painel principal
- `src/components/MenuPrincipal.jsx`: mantém apenas composição da Central e navegação entre telas.
- `src/components/home/HomeHeader.jsx`: identidade do clube, posição, caixa, folha, gols, pontos e forma recente.
- `HomeLineupAlert.jsx`: aviso de escalação incompleta ou titular inapto em qualquer rodada.
- `HomeNextMatchCard.jsx`: próxima partida de Liga/Copa, mando, data, posições e slots de Copa inativos.
- `HomeNavigationGrid.jsx`: grid acessível das áreas do jogo.
- `src/engines/home/homeViewModel.js`: temporada, próximo compromisso, cards, escalação e agregações da Central.

A Central reutiliza os resumos puros da navegação inferior para Inbox, Base, disponibilidade e clube, evitando números divergentes entre as duas interfaces. O fim da temporada usa o calendário completo; a forma recente percorre apenas fixtures de Liga realmente jogadas; `academyReady` entra no badge da Base; e slots de Copa já inativos são ignorados ao localizar o próximo compromisso.

## Centro Médico
- `src/components/ScreenMedical.jsx`: mantém apenas composição, formatação e disparo das ações médicas.
- `src/components/medical/`: cabeçalho, seções, cards de lesão/suspensão/fadiga e legenda.
- `src/engines/medical/medicalViewModel.js`: classificação do elenco, custos e mutações puras de tratamento, recuperação e fisioterapia.
- `src/engines/core/playerStatus.js`: normalização compartilhada de energia, disponibilidade, suspensão e situação contratual.

As faixas de fadiga exibidas agora seguem `FatigueEngine.getOverallPenalty`: -2 OVR abaixo de 70, -5 abaixo de 50 e -8 abaixo de 30. Gastos médicos são registrados em `financialHistory`, evitando redução de caixa sem lançamento correspondente no extrato.

## Elenco
- `src/components/ScreenSquad.jsx`: coordena apenas filtro, ordenação, navegação e composição.
- `src/components/squad/`: cabeçalho, filtros, cards, campo/lista e ações fixas.
- `src/engines/squad/squadViewModel.js`: grupos de posição, ordenação, métricas e decoração de jogadores.

A ordenação por posição conhece o conjunto moderno (`LD`, `LE`, `MC`, `PD`, `PE`, `CA`) e mantém compatibilidade com `LAT`/`ATA`. Disponibilidade usa jogadores únicos: um atleta simultaneamente lesionado e suspenso continua aparecendo nas duas categorias, mas conta apenas uma vez no total de desfalques/badge.

## Campo tático e helpers compartilhados
- `src/components/FieldView.jsx`: compositor mínimo do campo vertical usado pelo Elenco.
- `src/components/field/FieldPitch.jsx`: gramados vertical e horizontal compartilhados com a Escalação.
- `FieldHeader.jsx`, `FieldPlayerMarker.jsx` e `FieldLegend.jsx`: apresentação isolada do campo.
- `src/engines/field/fieldViewModel.js`: layouts, distribuição por posição/adaptação, nomes curtos e status dos marcadores.
- `src/components/player/JerseyBadge.jsx`: camisa SVG compartilhada, sem viver em um arquivo genérico de helpers.
- `src/utils/playerVisuals.js`: cores de posição/OVR/idade.
- `src/engines/core/moraleEngine.js`: forma recente e cálculo de moral.
- `src/engines/match/playerConditionProcessor.js`: fadiga, recuperação e lesões pós-jogo.
- `src/engines/match/matchEventParser.js`: parser de eventos textuais.

`helpers.js` permanece apenas como barril de compatibilidade para regras puras antigas. O app não o importa internamente. O campo conhece as oito formações usadas pela Escalação, incluindo `4-1-4-1` e `4-5-1`, e a disponibilidade usa a próxima rodada por meio de `getUpcomingRound` em `playerStatus.js`.

## Inicialização e lista de carreiras
- `src/components/ScreenBoot.jsx`: mantém apenas estado local de loading/expansão/Sobre e composição da tela inicial.
- `src/components/boot/`: cabeçalho, loading, estado vazio, card de save, progresso e rodapé.
- `src/engines/boot/bootViewModel.js`: ordenação por recência, estatísticas globais, datas relativas, progresso, objetivo, dificuldade, histórico e formatação financeira.

A carreira destacada passa a ser a realmente mais recente por `savedAt`, sem depender da ordem devolvida pelo IndexedDB. O progresso usa `calendar.length` quando disponível, pois `gameData.round` representa o índice do calendário completo, incluindo slots de Copa.

## Sobre e histórico de versões
- `src/components/ScreenAbout.jsx`: compositor mínimo da tela institucional.
- `src/components/about/`: hero/logo, apoio via PIX e histórico expansível.
- `src/data/aboutChangelog.js`: dados do histórico de versões fora do JSX.
- `src/config/support.js`: fonte única da chave PIX exibida e copiada.

A identidade visual da inicialização e do Sobre usa `APP_NAME`/`APP_VERSION_LABEL`; referências visuais antigas a Clube de Bolso/CDB foram removidas dessas telas.

## Dependências globais
O antigo shim de `src/main.jsx` foi removido. Motores, componentes, regras e bancos são consumidos por imports ES explícitos; `helpers.js` não carrega React nem componentes visuais.

Os únicos usos de `window` mantidos no código são APIs do navegador: `location`, listeners de eventos e `AudioContext`/`webkitAudioContext`.

## Compatibilidade
O banco Dexie legado e o `appId` do Capacitor foram preservados no rename para evitar que saves existentes desapareçam para o usuário.

## Próximos alvos
1. Refatorar os componentes médios restantes antes da versão estável.
2. Centralizar a aleatoriedade remanescente para tornar simulações determinísticas em testes quando necessário.
3. Revisar regras ainda duplicadas de apresentação/estado entre partida ao vivo, resultado e calendário.
4. Fazer uma revisão final de acessibilidade, estados vazios e responsividade antes da primeira versão estável.


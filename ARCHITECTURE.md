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
 │   ├─ news/
 │   ├─ nextmatch/
 │   ├─ cups_engine (fachada)
 │   ├─ cups/
 │   ├─ engine_finances
 │   ├─ engine_discipline
 │   ├─ engine_fatigue
 │   ├─ engine_injuries
 │   ├─ engine_academy
 │   ├─ cpu/
 │   └─ engine_cpu_ai (fachada)
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

## Central de Notícias
- `src/engines/news/newsEngine.js`: cria/reconcilia notícias a partir de eventos canônicos da carreira, gera IDs estáveis, deduplica e limita o histórico persistido.
- `src/engines/news/newsViewModel.js`: filtros, busca, categorias, datas e apresentação do feed.
- `src/components/ScreenNews.jsx` + `src/components/news/NewsCard.jsx`: interface compacta da Central.

A Central não mantém um simulador paralelo de acontecimentos. Transferências, resultados, Copas, lesões/suspensões e desfechos anuais produzem notícias no mesmo commit que altera o estado correspondente. O schema 13 permite reconstrução conservadora de saves antigos somente a partir de evidências já persistidas.


## IA dos clubes CPU
- `src/engines/engine_cpu_ai.js`: fachada pública compatível; consumidores antigos continuam importando `CpuAI` pelo mesmo caminho.
- `src/engines/cpu/cpuConfig.js`: limites de elenco, chances, intervalos e janelas de transferências.
- `cpuRoster.js`: resolução/sincronização de rosters, necessidades posicionais, força do elenco e finanças de compra/venda.
- `cpuRecruitment.js`: reposição e contratação de atletas gerados durante a janela.
- `cpuTransfers.js`: liberação de expirados e transferências CPU×CPU com dinheiro, orçamento e mínimos de elenco.
- `cpuContracts.js`: avisos, renovação, custos e agentes livres.
- `cpuMorale.js`: multiplicador de moral compartilhado com o simulador.

Transferências e reposições só acontecem em janelas abertas. O roster real participa da força efetiva usada em campo; mudanças de elenco atualizam essa força, mas clubes sem movimentação não sofrem deriva artificial. Jogadores expirados são removidos antes de virarem agentes livres e `teamId` é mantido consistente desde a geração do elenco.


## Controlador principal
- `src/app.jsx`: shell visual da aplicação; compõe o roteador, barra inferior e overlays.
- `src/hooks/useGameController.js`: concentra estado React da carreira aberta, persistência, simulação, ações de elenco e props compartilhadas entre telas.
- `src/hooks/useRoundMaintenance.js`: reage à mudança de rodada e aplica auto-bench, propostas e avisos contratuais sem misturar essas regras ao JSX.
- `src/engines/app/gameControllerService.js`: mutações puras de venda rápida, salário, camisa e manutenção pós-rodada.
- `src/components/app/GameScreenRouter.jsx`: resolve a tela ativa e injeta somente os props necessários.
- `src/components/app/AppOverlays.jsx`: PlayerModal, toast e diálogos globais.

O controlador reutiliza `lineupService.js` para alternar titulares, em vez de manter uma segunda regra de formação/suspensão dentro de `app.jsx`. Avisos periódicos usam `leagueRound`, enquanto indisponibilidade usa a próxima partida do calendário completo.

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
- `matchSimulator.js`: orquestrador puro da simulação de campo.
- `matchSimulationRoster.js`: roster cacheado, onze ativo, autores de eventos e substituições reais da CPU.
- `matchSimulationStrength.js`: forma, fadiga, moral, estilo do técnico, desfalques CPU, torcida e probabilidades-base.
- `matchSimulationEvents.js`: linha do tempo de 90 minutos, gols, pênaltis, cartões, expulsões e ajustes táticos da CPU.
- `matchSimulationStats.js`: posse, finalizações, chutes no alvo, escanteios e faltas com invariantes consistentes.
- `matchSimulationConfig.js`: taxas e frases do simulador.
- `matchPlayback.js`: reprodução e narração com um único playhead canônico compartilhado pelo relógio e pela liberação dos eventos.
- `matchPlayerStats.js`: estatísticas individuais.
- `matchPostProcessor.js`: barril legado que reexporta os processadores especializados para compatibilidade.

A simulação usa apenas atletas ativos: reservas só entram no pool de eventos após substituição e expulsos são removidos imediatamente. Segundo amarelo é rastreado dentro da própria partida, separado do acúmulo sazonal de três amarelos. O RNG opcional permite reproduzir partidas em testes sem alterar os consumidores existentes.

A rodada de Liga não muta mais `gameData.fixtures`: o motor cria uma nova rodada, salva o novo array explicitamente e só então produz o próximo estado. A sincronização de `seasonGoals` também ocorre antes da preparação final dos jogadores. Desde a beta.27, `gameData.round` (calendário Liga + Copas) e `gameData.leagueRound` (Liga) são tratados por um contexto explícito no pós-jogo.

## Interface da partida
- `src/components/ScreenMatchResult.jsx`: compositor das fases pré-jogo, ao vivo, intervalo e pós-jogo.
- `src/hooks/useMatchPresentation.js`: estado efêmero da reprodução, timers, posse visual, pausa, som e roster local da partida.
- `src/engines/match/matchPlayback.js`: agenda os eventos e só confirma o estado oficial depois que a partida realmente começa/termina.
- `matchEventViewModel.js`: parser único de minuto, lado, autor, gol normal, pênalti, gol contra e cartões.
- `matchFieldViewModel.js`: resolve lados, formação, posições adaptadas e snapshots do roster sem mutar o save.
- `matchPresentationViewModel.js`: labels de competição, posse final e substituições locais puras.
- `src/components/match/MatchHeader.jsx`: placar e status da partida.
- `MatchField.jsx` + `MatchPitchSvg.jsx` + `MatchPlayerMarkers.jsx` + `MatchFieldFooter.jsx`: composição visual do campo.
- `MatchNarration.jsx`, `MatchBench.jsx`, `MatchLiveView.jsx` e `MatchOverlays.jsx`: narração, banco, controles e overlays.
- `SubstitutionDialog.jsx`: substituição local durante o playback, sem alterar `isStarting`/minutos permanentes do save.

O resultado da rodada pode ser pré-calculado para alimentar a narração, mas `gameData` só recebe esse estado quando a reprodução termina ou quando uma partida já iniciada é encerrada/auto-simulada. Sair no pré-jogo descarta o commit pendente. O simulador fornece snapshots dos rosters/11 ativos usados no jogo para impedir que a interface desenhe um elenco diferente daquele que produziu o resultado.


## Pós-jogo
- `src/components/ScreenPostMatch.jsx`: coordena abas, bloqueio por desfalques e retorno ao painel.
- `src/components/postmatch/PostMatchHeader.jsx`: resultado, placar e contexto da competição.
- `PostMatchSummaryTab.jsx`: gols, cartões, substituições e estatísticas.
- `PostMatchFinanceTab.jsx`: receitas e resultados da rodada usando o histórico financeiro aplicado ao save.
- `PostMatchTableTab.jsx`: classificação, zonas e variação real de posição.
- `PostMatchAbsencesTab.jsx`: suspensões, lesões e bloqueio de escalação.
- `postMatchViewModel.js`: parsing e view-models puros do pós-jogo.

As estatísticas secundárias exibidas no pós-jogo são produzidas/persistidas pelo motor da partida, evitando aleatoriedade dentro da camada React.



### Série C 2027
`src/engines/serieC/serieCCompetition.js` isola a estrutura especial de 2027 da liga genérica. A primeira fase usa 24 clubes em turno único; o estado dedicado mantém classificados, fases seguintes, promovidos, rebaixados e campeão sem forçar `leagueEngine.js` a representar formatos incompatíveis. A pirâmide expande C para 24 clubes em 2027 e 28 em 2028, enquanto saves 2027 já iniciados no formato anterior usam `serieCLegacyFormat` até a virada.

## Calendário e partidas
- `src/components/ScreenMatches.jsx`: orquestra apenas estado visual, filtros, dia selecionado e súmula.
- `src/components/matches/`: calendário, próximos jogos, resultados recentes, detalhe do dia e diálogo de súmula.
- `src/engines/matches/matchesViewModel.js`: fachada pública compatível que reexporta os serviços especializados.
- `matchesConstants.js`: meses, dias, labels e cores das competições.
- `matchResultService.js`: parsing seguro de placar, resultado do usuário e pênaltis.
- `cupMatchResolver.js`: resolve confrontos ativos ou já disputados a partir dos slots de Copa.
- `matchesCalendarService.js`: mapa diário, filtros, janela mensal e relação calendário ↔ rodada da Liga.
- `matchesTimelineService.js`: próximos compromissos e resultados recentes de Liga/Copas.
- `src/utils/matchDateUtils.js`: fonte única das datas de rodadas e jogos de Copa.

Jogos de Copa já disputados permanecem recuperáveis no calendário mensal e no histórico, enquanto saves legados sem `calendar` continuam usando `leagueRound` como fallback. Desde a beta 54, `src/engines/calendar/calendarDateEngine.js` atribui uma data civil canônica a cada slot, impõe intervalo mínimo entre compromissos e controla `currentDateISO`. Na beta 55, `src/engines/calendar/seasonCalendar.js` adiciona a camada anual de datas-alvo por competição; Liga e Copas são mescladas no ano antes da canonicalização, e dias sem partida são avançados individualmente como recuperação, treino de campo, preparação tática, véspera ou dia de jogo. Os regionais possuem janelas próprias e, desde a beta 63, os 14 estaduais implementados usam `src/engines/cups/stateCalendar2026.js` como fonte canônica das datas-base de 2026 por rodada/fase. `seasonCalendar.js` consulta a janela específica do estadual e o agendador preserva `targetDateISO`, podendo deslocar somente o compromisso do usuário quando necessário para manter o intervalo mínimo entre jogos.


## Finanças
- `src/components/ScreenFinances.jsx`: coordena a aba ativa e ações comerciais.
- `src/components/finances/FinanceHeader.jsx`: saldo, indicadores, risco financeiro e navegação.
- `FinanceOverviewTab.jsx`: projeção de receitas/despesas e recomendações do diretor financeiro.
- `FinanceHistoryTab.jsx`: extrato compatível com registros modernos e legados.
- `FinanceSponsorsTab.jsx`: contratos máster e naming rights.
- `FinanceEvolutionTab.jsx`: gráfico e resumo acumulado da temporada.
- `src/engines/finances/financeViewModel.js`: fachada de compatibilidade da camada financeira.
- `financeMatch.js`: TV, estádio mandante, ocupação e bilheteria de casa/fora.
- `financeRisk.js`: folha real, custos operacionais, baseline recorrente e risco financeiro.
- `financeLedger.js`: carimbo de temporada/rodada, migração de legado, agregações e limite do extrato.
- `financeProjection.js`: projeção da próxima rodada real da Liga e recomendações.
- `financeSponsors.js`: ofertas, validação e assinatura de contratos comerciais.
- `financeHistoryView.js`: parsing visual e série de evolução do extrato.
- `src/engines/engine_finances.js`: fachada pública que preserva a API `FinanceEngine`.
- `src/data/teamStadiumData.js`: metadados puros de capacidade/estádio consumíveis por engines sem React.

A UI financeira não depende de globals. O ledger separa temporadas explicitamente e as regras periódicas usam `leagueRound`, enquanto o índice geral do calendário permanece reservado ao fluxo de partidas/Copas.


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
- `continentalEngine.js`: fachada/orquestrador da Libertadores e Sul-Americana.
- `continentalConfig.js`: elegibilidade e resolução da configuração de cada torneio continental.
- `continentalGroup.js`: criação da fase de grupos, classificação, confrontos CPU×CPU e registro dos seis jogos do usuário.
- `continentalKnockout.js`: escolha de adversários já não enfrentados, ida/volta, pênaltis e progressão do mata-mata.
- `cupPrizeAccounting.js`: calcula o delta de `totalPrize` gerado por uma partida e o associa ao pós-jogo/caixa.
- `cupQueries.js`: consultas de jogos atuais e próximos confrontos.
- `cupSeason.js`: classificação e inicialização dos torneios a cada temporada.
- `cupUtils.js`: confrontos, pênaltis, agregados e utilitários compartilhados; aleatoriedade aceita RNG opcional para testes determinísticos.

`CalendarEngine.js` consome a mesma configuração de `cupConfig.js`, evitando divergência entre a rodada exibida e o slot realmente criado. A fase continental agora representa um grupo completo de quatro clubes: enquanto o usuário disputa seus seis jogos, os outros dois clubes jogam entre si em cada rodada, deixando todos com seis partidas na tabela. Clubes já enfrentados não podem ser sorteados novamente no mata-mata enquanto houver alternativas, e o clube original do usuário é excluído do pool. Premiações de qualquer Copa entram no caixa pelo delta real de `totalPrize`, eliminando fases registradas no torneio sem pagamento financeiro. As finais de Libertadores/Sul-Americana continuam como jogo único.

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

## Densidade responsiva da interface
A beta 55 trata a altura útil do aparelho como restrição real de layout: containers principais usam `100dvh`, regiões com listas longas recebem `minHeight: 0` + scroll interno e a tipografia-base responde ao viewport. Boot, Nova Carreira, Home e a navegação inferior usam densidade móvel menor, enquanto telas maiores preservam escala confortável. A regra arquitetural é evitar `100vh` e grandes `padding-bottom` fixos para compensar a barra inferior; cada tela deve reservar apenas a área efetivamente ocupada pela navegação.


## Campeonatos estaduais
- `src/engines/cups/stateConfig.js`: cadastro explícito das competições estaduais suportadas, participantes, chaves e número de jogos do mata-mata.
- `src/engines/cups/stateEngine.js`: fase classificatória cruzada, tabela, avanço do usuário e mata-mata; expõe a mesma interface de calendário/resultado usada pelas demais Copas.

A beta 58 amplia a camada para oito estaduais 2026 e a beta 60 chega a **14 de 27 estaduais planejados**: Carioca, Gauchão, Paulista, Mineiro, Paranaense, Catarinense, Baiano, Pernambucano, Goiano, Paraense, Paraibano, Alagoano, Potiguar e Sergipano. A engine declara o formato por competição (classificação geral, grupos cruzados, grupos externos, melhor segundo, vaga direta à semifinal, playoff intermediário e número de pernas do mata-mata) em vez de duplicar motores. Clubes fora dos estaduais implementados não recebem torneio inventado. Ramos paralelos oficiais de permanência/taças secundárias continuam separados do caminho principal de título até receberem modelagem própria.

## Android / Capacitor
- `capacitor.config.json`: identidade nativa e `webDir` canônico (`dist`).
- `.github/workflows/android-apk.yml`: fronteira de entrega Android; instala Capacitor 8 no runner, valida o projeto, cria/sincroniza `android/`, compila com Gradle e publica o APK debug como artefato.
- `scripts/smoke-android-ci.mjs`: regressões estruturais do workflow/configuração Android.

A pasta `android/` é deliberadamente efêmera nesta fase: não existe lógica nativa customizada que precise ser versionada. Se surgirem plugins com alterações manuais no Manifest/Gradle/Java/Kotlin, essa decisão deverá ser revista. O APK atual é de debug; assinatura/AAB pertencem a uma etapa de release separada.

## Persistência, schema de save e estado canônico
- `src/engines/persistence/saveSchema.js`: fronteira única para carregar, migrar, normalizar e preparar uma carreira antes da gravação.
- `src/engines/core/gameStateIntegrity.js`: invariantes de sessão do elenco do usuário e folha salarial.
- `src/hooks/hooks_persistence.js`: mantém o IndexedDB/Dexie como transporte e delega a evolução do conteúdo ao schema da carreira.

O banco físico continua em `BrasfootDB`/Dexie v1 para não perder carreiras existentes. A evolução lógica é separada: saves sem `saveSchemaVersion` são schema 0 e migram sequencialmente até o schema 3. Cada etapa é pequena e determinística; depois da cadeia, os invariantes atuais são reaplicados, tornando a operação idempotente. Um schema futuro é recusado antes de `onLoaded` ou de qualquer sobrescrita.

No domínio do elenco, `players` é a fonte canônica do usuário. `teamRosters.user` é apenas um espelho compartilhado com engines que também operam clubes CPU e deve ser atualizado na mesma mutação de estado; `syncUserRosterState()` centraliza essa regra e recalcula `club.wage`. Para clubes CPU, `teamRosters[teamId]` é o roster canônico e `teams[].squad`/`leagues[serie][].squad` permanecem espelhos de compatibilidade reconciliados na fronteira de persistência.

O schema 3 também normaliza Inbox/IDs, contadores de transferências, propriedade dos atletas e classificação. Isso substitui o modelo anterior em que cada tela tentava reparar apenas o pedaço de save que consumia. A cadeia evoluiu até o schema 14. O schema 9 introduz `calendarModel` e anualiza apenas carreiras ainda sem partidas; o schema 10 introduz regionais/Copa do Brasil 2026 sem reescrever temporadas iniciadas; o schema 11 injeta a primeira camada estadual somente em saves zerados; o schema 12 amplia para oito estaduais e garante reconstrução imediata da agenda quando uma competição é adicionada a um save ainda não iniciado, evitando estado intermediário com `calendar=null`; o schema 13 introduz `newsFeed`/`career-news-v1`, com reconciliação idempotente e backfill conservador de acontecimentos comprovados; e o schema 14 amplia o catálogo estadual de 8 para 14 competições sem injetar torneio novo em uma temporada já iniciada.

## Compatibilidade
O banco Dexie legado e o `appId` do Capacitor foram preservados no rename. Saves antigos são migrados pelo conteúdo, enquanto saves de schema mais novo são bloqueados explicitamente para evitar downgrade destrutivo.

## Próximos alvos
1. Expandir os estaduais com regulamentos próprios e modelar os ramos paralelos de permanência/Taça Rio/Taça Farroupilha, em vez de tratar todos os estados como um formato genérico.
2. Tornar a classificação para Copa do Brasil e regionais derivada da temporada anterior, reduzindo listas fixas de elegibilidade.
3. Criar workflow Android de **release/AAB assinado** usando GitHub Secrets, mantendo o APK debug como caminho de teste.
4. Continuar a auditoria de runtime, acessibilidade, estados vazios e responsividade antes da primeira versão estável.

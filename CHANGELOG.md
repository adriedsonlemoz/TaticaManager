# Changelog

## [1.0.0-beta.52] - 2026-08-17

### Nova Carreira canônica por clube real
- Removida a etapa de escolha manual da Série e removido o fluxo de criação de clube personalizado para novas carreiras.
- A criação passa a exigir `teamId` pertencente ao catálogo atual; nome, Série, saldo, orçamento e demais dados de identidade são derivados novamente no domínio, sem confiar em `teamName`/`serie` recebidos da interface.
- `careerCreation.js` centraliza seleção, validação de clube, dificuldade, objetivo, perfil do treinador e disponibilidade do nome do save.
- `gameStateFactory` rejeita clubes desconhecidos e ignora a Série legada enviada pelo chamador, impedindo iniciar um clube real em divisão diferente da sua divisão-base.
- A criação de save usa `Dexie.add` depois da pré-validação, protegendo também contra corrida entre duas tentativas com o mesmo nome.

### Tela de seleção e catálogo 2026
- Nova tela de clube com busca por nome/alias/cidade disponível, filtros por Série, escudo, nome, divisão, OVR e dados já existentes no projeto.
- A UI deixa de expor orçamento inicial, nome de estádio, nome do clube ou Série como campos capazes de alterar a identidade do clube.
- O catálogo selecionável passa a ter 156 clubes: 20 da Série A, 20 da B, 20 da C e 96 cadastrados na Série D 2026.
- A estrutura dos 96 clubes da Série D foi separada em 16 grupos de seis como metadado de competição; a pirâmide ativa permanece em 20 vagas por Série nesta beta para preservar os invariantes/saves já auditados. O motor completo de grupos e mata-mata fica preparado como próxima evolução estrutural.
- Clubes adicionais da Série D usam parâmetros de balanceamento do jogo quando não existiam atributos internos, sem inventar cidade, estádio ou títulos.

### Persistência, migração e compatibilidade
- Schema de save incrementado para **6**, adicionando `club.teamId` como identidade canônica do clube real controlado.
- Saves antigos continuam migrando de forma idempotente; carreiras históricas com clube personalizado permanecem carregáveis, mas o fluxo novo não cria outras.
- Selecionar um clube real o remove corretamente do pool CPU da sua Série, preservando 80 participantes ativos, tabela com 20 clubes e calendário de 38 rodadas/380 partidas.
- Clubes oficiais da Série D fora do antigo recorte de 20 podem iniciar carreira sem duplicação; os participantes não ativos ficam no `pyramidReserve` para evolução futura da competição.

### Testes e auditoria
- Adicionado `scripts/smoke-new-career.mjs` com 13 regressões de catálogo, Série derivada, dados forjados, clube inválido/custom, save duplicado, identidade, pirâmide, fixtures e UI.
- `smoke-club-identity` ampliado para diferenciar catálogo oficial da Série D (96) do pool ativo da pirâmide (20).
- `smoke-save-schema` atualizado para schema 6 e compatibilidade de clube personalizado legado.
- Suíte completa final: **843/843 verificações aprovadas** em 27 grupos, incluindo stress de 100 temporadas.
- Parser TypeScript: **340 arquivos JS/JSX/MJS**, 0 erros.
- Imports locais: **913 verificados**, 0 quebrados.
- `npm run build` foi tentado; o ambiente de auditoria não possui `node_modules`/Vite instalado e encerrou em `vite: not found`.

## [1.0.0-beta.51] - 2026-08-17

### Pirâmide nacional persistente
- Criado `src/engines/season/seasonPyramid.js`: as Séries A/B/C/D deixam de ser reconstruídas pela base 2026 a cada virada e passam a usar a composição persistida da carreira.
- G4 e Z4 movimentam clubes CPU de forma estrutural entre A↔B↔C↔D; a Série D simplificada mantém apenas G4 de acesso, sem falsa eliminação/rebaixamento para uma divisão inexistente.
- As divisões CPU que não são jogadas pelo usuário recebem classificação virtual determinística baseada em força + variação por temporada, sem consumir o RNG global de partidas/mercado.
- A virada registra `lastDivisionMovement` para auditoria e preserva elencos, caixa/orçamento e identidade permanente dos clubes promovidos/rebaixados.
- Carreiras com clube personalizado mantêm 79 clubes CPU ativos + usuário; o clube real deslocado é preservado em `pyramidReserve` sem manter elenco fantasma invisível.

### Migração e integrações
- `saveSchemaVersion` avança para 5 com migração `4→5`, saneando o 20º clube CPU oculto da série atual existente na beta 50 e garantindo 79 IDs CPU únicos na pirâmide.
- Trocas de clube do treinador passam a trocar apenas o controle: o clube anterior permanece na divisão conquistada como CPU, o manager assume o elenco do clube contratado e acompanha a divisão pós-virada desse clube; clubes personalizados recebem identidade persistente em vez de desaparecer.
- Copa do Brasil, pool brasileiro do mata-mata continental e rumores de mercado passam a consultar primeiro `gameData.leagues`, respeitando promoções e rebaixamentos da carreira.
- A seleção de clube do manager na virada resolve primeiro o estado persistido, preservando força/finanças atuais antes do fallback para a base 2026.
- Objetivo “Não Rebaixar” deixa de ser oferecido na Série D; saves legados com essa meta são tratados como não aplicáveis, sem demissão indevida.

### Regressões e validação
- Adicionado `scripts/smoke-pyramid.mjs` com cobertura para criação da pirâmide, migração beta 50, G4/Z4 CPU, promoção/rebaixamento do usuário, Série D, troca de clube com preservação de elenco/divisão e persistência na virada.
- Suíte completa `npm run test:smoke`: **828/828 verificações aprovadas**.

## [1.0.0-beta.50] - 2026-08-17

### Identidade canônica dos clubes brasileiros
- Criado `src/data/clubCatalog.js` como cadastro único: IDs `br-*` permanecem ligados ao clube e deixam de depender da divisão (`a1`, `b7`, `c3`, etc.).
- As bases jogáveis de 2026 das Séries A, B e C foram atualizadas para 20 clubes cada; a Série D mantém o formato simplificado atual de 20 clubes, todos selecionados entre participantes reais de 2026.
- Nomes e aliases passam por resolução canônica (`Atlético MG` → `Atlético-MG`, `Vasco` → `Vasco da Gama`, `Bragantino` → `Red Bull Bragantino`, entre outros).
- Branding, estádios, técnicos, dados de clube, geração de jogadores reais, rumores e extras da Copa passam a resolver a identidade canônica em vez de depender de grafias antigas.

### Migração e integridade de saves
- `saveSchemaVersion` avança para 4 com migração `3→4`, reescrevendo IDs e nomes legados em tabelas, fixtures, rosters, ligas, mercado, propostas e contadores de transferências.
- A migração preserva a divisão conquistada em carreiras existentes: ela altera identidade, não reposiciona clubes de um save em andamento para a composição-base de 2026.
- Clubes personalizados não são convertidos apenas por coincidência de nome; o vínculo com clube real exige identidade persistida.
- A virada de temporada normaliza IDs antes de reconstruir os pools, evitando perder roster CPU quando o estado ainda contém chaves `a*`/`b*`/`c*`/`d*`.

### Regressões
- Adicionado `scripts/smoke-club-identity.mjs` para validar as quatro bases jogáveis, unicidade dos 80 IDs atuais, aliases, migração de referências aninhadas e preservação de jogadores/clube personalizado.
- `smoke-save-schema` passa a cobrir a migração até schema 4 e a conversão transversal dos IDs antigos.

### Validação
- Suíte completa `npm run test:smoke`: **813/813 verificações aprovadas**.
- Identidade de clubes: 34/34; schema/migrações: 16/16; fim de temporada: 56/56.
- Parser TypeScript: **336 arquivos JS/JSX/MJS**, 0 erros; **893 imports locais**, 0 quebrados.
- `npm run build` foi tentado; o ambiente de auditoria não contém `node_modules`/Vite e encerrou com `vite: not found`.

## [1.0.0-beta.49] - 2026-08-17

### Schema de save e migrações versionadas
- Criado `src/engines/persistence/saveSchema.js` com `CURRENT_SAVE_SCHEMA_VERSION = 3`; o schema do conteúdo da carreira passa a ser explícito e independente da versão física do banco Dexie.
- Saves anteriores à beta 49 são reconhecidos como schema 0 e percorrem migrações sequenciais `0→1→2→3`, preservando a carreira e registrando `saveSchemaVersion`/`saveAppVersion` no próximo carregamento ou salvamento.
- As migrações são idempotentes: um save já atual continua passando pelos invariantes derivados sem acumular alterações, duplicações ou efeitos financeiros.
- Saves com schema maior que o suportado geram `SAVE_SCHEMA_TOO_NEW` e não podem ser carregados nem sobrescritos por uma versão antiga do jogo.
- A tela inicial identifica carreiras de schema futuro, mostra aviso explícito e desabilita o botão de jogar sem impedir a exclusão do arquivo local.
- Formatos raiz malformados em saves antigos são normalizados antes dos reconciliadores; a listagem de carreiras também trata `table`, `calendar`, `fixtures`, perfil e H2H defensivamente para que um registro ruim não esconda os demais.

### Estado canônico durante a sessão
- Criado `src/engines/core/gameStateIntegrity.js`; `players` passa a ser formalmente a fonte canônica do elenco do usuário e `teamRosters.user` um espelho derivado que não pode permanecer defasado até o próximo autosave.
- Escalação, troca de formação, titulares, papéis, escalação automática, DM, recuperação, perfil/listagem de atleta, Categoria de Base, treino, avanço ocioso, manutenção de rodada e commits de Liga/Copa usam o mesmo sincronizador do roster do usuário.
- A folha (`club.wage`) passa pelo mesmo sincronizador e é recalculada a partir do elenco efetivo sempre que esse roster muda.
- A fronteira de persistência reaplica a propriedade canônica da beta 48, sincroniza rosters CPU em `teams`/`leagues`, reconcilia classificação e normaliza IDs da Inbox e contadores de transferências.

### Compatibilidade e regressões
- O banco permanece `BrasfootDB`/Dexie v1 para manter os saves existentes acessíveis; a evolução de formato ocorre dentro do conteúdo persistido e não por uma migração destrutiva do IndexedDB.
- Adicionado `scripts/smoke-save-schema.mjs`, cobrindo cadeia de migração, idempotência, propriedade única, rosters CPU, folha, Inbox, rodada de Liga derivada, compatibilidade de orçamento legado, save futuro e reparo de shape antigo.
- Regressões de integração verificam sincronização imediata de `teamRosters.user` em Escalação, DM, Base, descanso, Copa, Mercado e treino.

### Validação
- Suíte completa `npm run test:smoke`: **778/778 verificações aprovadas**.
- Schema/migrações: 15/15; Boot/Sobre: 32/32; demais totais finais registrados após a suíte completa.
- Parser TypeScript: **333 arquivos JS/JSX/MJS**, 0 erros.
- Imports locais: **880 verificados**, 0 quebrados.
- `npm run build` foi tentado; o ambiente de auditoria não possui `node_modules`/Vite instalado e encerrou com `vite: not found`.

## [1.0.0-beta.48] - 2026-08-17

### Mercado, transferências e propriedade canônica
- Criados `marketIntegrity.js` e `transferTransactions.js` para centralizar identidade, posse e movimentação dos jogadores entre usuário, clubes CPU e agentes livres.
- Compras do usuário passam a revalidar a propriedade no estado mais recente antes do commit, bloqueando compras duplicadas, propostas obsoletas e atleta presente simultaneamente em dois clubes.
- O preço negociado deixa de sobrescrever o valor de mercado do atleta: `value` continua representando avaliação esportiva e `lastTransferFee`/`agreedTransferFee` registram a operação.
- `transferBudget = 0` passa a significar orçamento realmente zerado; apenas saves antigos sem o campo mantêm a compatibilidade de orçamento legado sem limite.
- Clubes CPU vendedores recebem dinheiro e orçamento na venda ao usuário; compradores CPU reais passam a pagar a venda do usuário e respeitam caixa, orçamento e limite de elenco.
- A origem da transferência guarda também o ID do clube anterior, evitando contadores históricos presos quando o atleta é comprado e posteriormente revendido.
- Jogador listado pelo usuário deixa de ser misturado ao pool de agentes livres e não pode mais aparecer como opção de recompra do próprio clube.
- A pré-validação de contratação pela tela de artilheiros foi alinhada às mesmas regras canônicas do mercado, inclusive orçamento zero, janela e disponibilidade do vendedor.

### Contratos, salários e propostas simultâneas
- Criado `contractTransactions.js`; renovações agora atualizam `players`, `teamRosters.user`, folha, caixa e ledger em uma única transação lógica.
- Propostas de renovação carregam snapshot de contrato/salário e são recusadas quando ficam obsoletas; uma cotação antiga nunca reduz o custo após reajuste salarial.
- Ao renovar, todas as propostas simultâneas daquele atleta são invalidadas e uma segunda tentativa não cobra novamente.
- A aba Salário deixa de alterar silenciosamente a duração do contrato. Reajuste salarial e renovação passam a ser operações distintas, e salário vigente não pode ser reduzido por esse atalho.
- Custos de renovação são recalculados pelo estado atual e a folha salarial permanece derivada do elenco efetivamente persistido.

### Vencimentos, agentes livres, IA e virada de temporada
- Todos os jogadores do usuário que chegam ao fim do vínculo entram como agentes livres na virada, sem limite arbitrário de 15 atletas.
- Clubes CPU preservam seus rosters reais entre temporadas; contratos avançam sobre os elencos persistidos, renovações seletivas mantêm peças importantes e os demais vencidos são liberados de forma rastreável.
- O mercado passa a preservar agentes livres reais durante atualização manual e refresh automático pós-partida; apenas jogadores gerados para a vitrine podem ser substituídos aleatoriamente.
- Agentes liberados entram no mercado independentemente do OVR, eliminando o desaparecimento silencioso de atletas abaixo do nível da vitrine.
- Propostas de compra pelo jogador passam a preferir clubes CPU reais elegíveis, carregando `teamId` e permitindo validar e debitar o comprador no fechamento.
- A IA CPU continua respeitando janela, recursos, mínimo/máximo de elenco e agora mantém as transferências efetivamente realizadas através da virada anual.

### Persistência e compatibilidade
- Saves são reconciliados ao salvar e carregar: IDs string/número equivalentes são deduplicados, `teamRosters.user` é ressincronizado, cópias fantasmas em rosters CPU são removidas e o mercado é purgado de jogadores já pertencentes a algum clube.
- Rosters órfãos de saves antigos deixam de manter uma segunda posse invisível de atletas já transferidos.
- A reconciliação recalcula a folha do usuário e sincroniza as visões `teams`/`leagues` com os rosters canônicos sem recomeçar a carreira.

### Validação
- Suíte completa `npm run test:smoke`: **755/755 verificações aprovadas**.
- Mercado: 59/59; CPU/contratos: 44/44; virada de temporada: 56/56; Matches/App: 49/49; Inbox: 12/12; classificação/artilheiros: 12/12.
- Foram adicionadas regressões para orçamento zero, propriedade duplicada, recompra própria, negociação sem corromper `value`, compra/venda CPU com impacto financeiro, propostas simultâneas e de temporada antiga, comprador CPU obsoleto, renovação obsoleta, vencimentos em massa, persistência de rosters CPU e preservação de agentes livres.
- Parser TypeScript: **330 arquivos JS/JSX/MJS**, 0 erros.
- Imports locais: **862 verificados**, 0 quebrados.
- `npm run build` foi tentado; o ambiente não possui `node_modules`/Vite instalado (`vite: not found`). A tentativa de instalar dependências offline também não pôde concluir porque o pacote `yaml@1.10.3` não estava no cache.

## [1.0.0-beta.47] - 2026-08-17

### Classificação, rodadas e temporadas determinísticas
- A classificação da Liga deixa de ser acumulada incrementalmente e passa a ser reconstruída a partir dos fixtures efetivamente marcados como disputados, tornando PJ/V/E/D/GP/GC/SG/pontos idempotentes.
- Rodadas totalmente persistidas são reconhecidas e recuperadas sem nova simulação; uma rodada parcialmente processada é bloqueada antes de contaminar a tabela.
- O placar canônico reconciliado da partida do usuário agora atualiza também o `result` do fixture e força a reconstrução da classificação antes do commit.
- Desempates passam a usar pontos, vitórias, saldo e gols pró antes do confronto direto; o confronto direto só decide empate primário entre exatamente dois clubes.
- Novos relatórios validam 38 rodadas/380 jogos, dez partidas por rodada, mandos invertidos, confrontos duplicados, clubes repetidos e resultados inválidos.
- Cada commit de Liga valida os invariantes da classificação quando a carreira usa o calendário canônico; a virada anual também é bloqueada até todos os jogos da Liga estarem processados.
- `getSeasonProgress` passa a seguir `leagueRound`, evitando que slots de Copa antecipem visualmente o fim da Liga.
- Saves modernos com tabela divergente são reconciliados automaticamente pelos fixtures no carregamento e gravados já saneados.
- O stress test `test:league-season` simula 100 temporadas completas e valida cinco viradas consecutivas, garantindo 20 clubes únicos, 38 jogos por equipe e conservação de vitórias/derrotas, GP/GC e pontos.
- Suíte completa `npm run test:smoke`: 730/730 verificações aprovadas.

## [1.0.0-beta.46] - 2026-08-17

### Passagem de tempo em datas sem partida
- Criado `src/engines/calendar/idleCalendarAdvance.js` para tratar slots de Copa inativos como passagem real de tempo, em vez de apenas incrementar `gameData.round`.
- Cada data sem jogo recupera energia do elenco e processa uma etapa de recuperação das lesões. O avanço não altera `leagueRound`, não gera renda/despesa de partida e não cria proposta formal de transferência.
- Suspensões deixam de ser consumidas por datas em que o clube não entra em campo. O prazo em `suspendedUntilRound` é deslocado pelos slots inativos, preservando a quantidade de partidas que o atleta ainda precisa cumprir.
- Suspensões já expiradas são saneadas após o descanso, sem mexer no histórico disciplinar ou nos amarelos acumulados.

### Pré-jogo e calendário jogável
- `inspectMatchStart()` verifica primeiro se o slot de Copa está inativo e só depois valida formação, quantidade de titulares, lesões e suspensões. O jogo não exige mais uma escalação válida para uma data sem partida.
- `resolveNextMatchContext()` usa a próxima data realmente jogável. Nome do adversário, rodada, data e validação de suspensão deixam de apontar para um slot vazio anterior.
- A tela de próxima partida exibe `AVANÇAR N DATA(S)` quando existe descanso pendente; a auto-simulação permanece desabilitada até o calendário ocioso ser processado e a escalação ser reavaliada.
- Se restarem apenas slots de Copa inativos no fim do calendário, a Central oferece `Avançar calendário` em vez de ficar sem próxima ação, permitindo aplicar o último descanso e concluir a temporada.

### Persistência e manutenção
- Avanços de calendário ocioso são persistidos imediatamente e passam pela manutenção idempotente com `allowTransferOffers:false`. Fechar o jogo após o descanso não restaura energia/lesões antigas nem fabrica proposta como se uma partida tivesse ocorrido.
- `useRoundAdvance` persiste também a transição de temporada quando ela ocorre logo após o consumo dos últimos slots inativos.
- `InjuryEngine.processRecovery()` aceita RNG injetável opcional, permitindo validar recuperação de lesões de forma determinística sem quebrar chamadas antigas.

### Validação
- Suíte completa `npm run test:smoke`: 712/712 verificações aprovadas.
- Match engine: 38/38 verificações, incluindo descanso, lesão, energia, suspensão e preflight de slot inativo.
- Próxima partida: 16/16 verificações, incluindo data jogável e calendário final apenas com descanso.
- Partida ao vivo: 69/69 verificações aprovadas.
- Match commit: 35/35 verificações aprovadas.
- Simulador: 39/39 verificações aprovadas.
- Parser TypeScript: 326 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 826 verificados, 0 quebrados.
- `npm run build` foi tentado; o ambiente continua sem `node_modules`/Vite disponível (`vite: not found`).


## [1.0.0-beta.45] - 2026-08-17

### Commit pós-partida e manutenção atômica
- `buildRoundMaintenance()` passa a ter carimbo idempotente por temporada/rodada (`lastRoundMaintenance`). Remontagens ou chamadas repetidas na mesma rodada não sorteiam novamente propostas nem repetem efeitos.
- A manutenção pós-partida é aplicada dentro do mesmo commit que grava resultado, tabela, finanças e jogadores. O save confirmado já contém auto-bench, proposta formal e o carimbo da manutenção, eliminando a janela entre o commit e um `useEffect` posterior.
- Avanços de calendário sem partida, como slots de Copa inativos, continuam podendo corrigir disponibilidade/escalação, mas não criam proposta formal como se um jogo tivesse sido disputado.
- Propostas de transferência pós-rodada ganham ID determinístico por temporada, rodada e atleta, removendo dependência de `Date.now()` e facilitando idempotência.

### Inbox e contratos sem colisão entre temporadas
- Removido o segundo sistema de alertas contratuais que existia em `gameControllerService`; avisos de contrato ficam centralizados no pipeline de notificações do pós-jogo.
- IDs de jornal, rumores, diretoria, pressão da torcida, lesões, suspensões, base e contratos passam a incluir a temporada. Uma mensagem da rodada 2 de 2026 não bloqueia nem colide com a rodada 2 de 2027.
- `CpuAI.getContractWarnings()` mantém compatibilidade com chamadas legadas sem temporada, mas o fluxo real da carreira usa IDs sazonais.
- Na virada de temporada, IDs duplicados legados da caixa de entrada são saneados mantendo a ocorrência mais recente, sem remover mensagens distintas.

### Histórico de carreira e transações anuais
- `h2hHistory` deixa de ser zerado em `generateNextSeason()`. O confronto direto passa a representar a carreira inteira e continua disponível no pré-jogo e na tela de carreira após a virada anual.
- `lastMatchCommit` e `lastRoundMaintenance` são zerados ao iniciar uma nova temporada, impedindo que marcadores transacionais do calendário anterior vazem para o novo ano.

### Validação
- Suíte completa `npm run test:smoke`: 692/692 verificações aprovadas.
- Match commit: 35/35 verificações aprovadas.
- Fim de temporada: 51/51 verificações aprovadas.
- CPU AI: 38/38 verificações aprovadas.
- Matches/App: 47/47 verificações aprovadas.
- Parser TypeScript: 324 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 814 verificados, 0 quebrados.
- `npm run build` foi tentado sem instalar dependências; o ambiente continua sem `node_modules`/Vite disponível (`vite: not found`).


## [1.0.0-beta.44] - 2026-08-17

### Fonte única de verdade da partida
- Criado `matchLiveState.js` como estado canônico do jogo ao vivo. Placar, relógio, status, narração, `rawEvents`, escalações ativas, cartões, substituições e estatísticas passam a ser atualizados juntos e publicados como um único snapshot.
- `matchPlayback.js` deixa de manter contadores locais de gols e de reconstruir dados em paralelo. Reprodução normal, pausa/retomada, intervalo, `forceEnd()` e encerramento usam o mesmo estado da timeline.
- Auto-simulação deixa de reescrever manualmente `liveScore` e `visibleEvents`; o React passa a refletir o snapshot publicado pelo playback, reduzindo diferenças entre o que foi exibido e o que será salvo.
- O apito final normaliza a narração e o `rawEvent` de encerramento com o placar canônico, sem permitir que um resultado antigo do snapshot inicial sobrescreva os lances realmente processados.
- Estatísticas canônicas mantêm posse normalizada e garantem coerência mínima entre gols, finalizações e chutes no alvo.

### Idempotência e isolamento entre partidas
- Cada lance mantém seu `sourceIndex`; um mesmo índice já resolvido não pode ser aplicado novamente. Callbacks repetidos, remontagens ou caminhos duplicados deixam de somar gol/cartão duas vezes.
- `playbackSessionId` identifica cada execução. Timers e callbacks atrasados de uma partida anterior são ignorados assim que uma nova sessão é criada, evitando escrita tardia sobre o jogo seguinte.
- `activeLineups`, substituições e expulsões continuam integrados à timeline da beta 43, agora dentro do mesmo snapshot que controla placar e eventos.

### Barreira de integridade antes do commit
- Criado `buildLiveMatchIntegrityReport()` para comparar placar declarado, gols derivados de `rawEvents` e gols derivados da narração, além de validar coerência básica de finalizações/chutes no alvo.
- `useMatchEngine` executa essa auditoria imediatamente antes de construir o estado definitivo da carreira. Se houver divergência, o commit é abortado antes de alterar tabela, finanças, disciplina, jogadores ou calendário.
- O simulador ganhou checagem determinística de integridade; uma amostra de 500 partidas confirma que placar, eventos estruturados, narração e estatísticas permanecem coerentes.

### Validação
- Partida ao vivo: 69/69 verificações aprovadas.
- Match commit: 33/33 verificações aprovadas.
- Simulador: 39/39 verificações aprovadas, incluindo 500 partidas verificadas por integridade.
- Suíte completa `npm run test:smoke`: 686/686 verificações aprovadas.
- Parser TypeScript: 324 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 812 verificados, 0 quebrados.
- `npm run build` foi tentado sem instalar dependências; o ambiente continua sem `node_modules`/Vite disponível (`vite: not found`).


## [1.0.0-beta.43] - 2026-08-17

### Linha do tempo ao vivo e eventos futuros
- Criado `matchLiveTimeline.js` para manter uma escalação ativa própria durante o playback. Substituições manuais, substituições estruturadas da CPU e expulsões passam a alterar imediatamente quem pode participar dos lances seguintes.
- Eventos pré-calculados de gol, pênalti, gol contra e cartões são reconciliados no instante da exibição. Se o ator original já saiu ou foi expulso, o evento estruturado e a narração são reatribuídos juntos a um jogador realmente ativo.
- `matchPlayback.js` preserva o índice original de cada narração em relação a `rawEvents`, inclusive quando encontra entradas malformadas, evitando corrigir um lance usando os metadados de outro.
- `forceEnd()` resolve silenciosamente todos os eventos restantes antes do commit, mantendo auto-simulação e encerramento antecipado sob as mesmas regras da reprodução normal.
- Cartões mantêm coerência disciplinar: um segundo amarelo só permanece como tal quando o atleta ativo já tinha amarelo; caso contrário, uma expulsão pré-calculada é convertida para vermelho direto. Um amarelo reatribuído prioriza atleta ainda sem cartão para não fabricar uma expulsão.

### Campo, substituições e expulsões
- `MatchField`/`matchFieldViewModel` passam a receber `liveActiveLineups`; substituições e expulsões dos dois times são refletidas no campo em tempo real, inclusive mudanças da CPU.
- Jogador do usuário expulso recebe `liveUnavailable`, sai dos titulares e não reaparece como reserva elegível para reentrada; sugestões do intervalo respeitam a mesma indisponibilidade.
- `SubstitutionDialog` registra a troca na linha do tempo antes de confirmar o estado visual, tornando a alteração atômica entre interface e playback.
- Corrigidos dois usos residuais de coerção booleana de ID: expulsões e marcadores do campo preservam corretamente atletas com ID numérico `0`.

### Commit e estatísticas reais da participação
- O estado resolvido do playback passa ao commit. Na Liga, `applyResolvedLeagueMatchData()` substitui somente a faixa de `rawEvents` da partida do usuário, preservando eventos das partidas CPU; na Copa, o commit também usa os eventos reconciliados.
- `buildMatchMinutes()` passa a encerrar a participação no minuto exato de uma expulsão e suporta reserva que entra e depois é expulso. Minutos, fadiga e risco de lesão deixam de tratar o expulso como atleta de 90 minutos.
- Assistências são atribuídas apenas entre jogadores que estavam efetivamente em campo no momento do gol; quem já havia sido substituído ou expulso não pode receber assistência posterior.
- Gols/cartões reatribuídos na linha do tempo chegam ao pós-processamento estruturado, evitando divergência entre o que o usuário viu e o que foi salvo em artilharia, disciplina e histórico.

### Validação
- Partida ao vivo: 63/63 verificações aprovadas.
- Match commit: 32/32 verificações aprovadas.
- Simulador: 37/37 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 677/677 verificações aprovadas.
- Parser TypeScript: 324 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 807 verificados, 0 quebrados.
- `npm run build` foi tentado sem instalar dependências; o ambiente continua sem `node_modules`/Vite disponível (`vite: not found`).


## [1.0.0-beta.42] - 2026-08-17

### Identidade das equipes e lados da partida
- `getUserMatchSide()` passa a ser a fonte única para decidir casa/fora na apresentação: prioriza `userSide`/`userIsHome`, marcadores `isPlayer`, IDs do fixture e, por último, nomes normalizados. Diferenças de caixa, espaços ou nomes legados deixam de inverter o time do usuário.
- `SMR_PreMatch`, `matchFieldViewModel`, próxima partida e resumo pós-jogo foram alinhados à mesma identidade; nome da equipe, escalação e jogadores de campo permanecem no mesmo lado real da partida.
- Snapshots de Liga/Copa passam a carregar `homeId`, `awayId`, `homeIsPlayer` e `awayIsPlayer`, reduzindo dependência de comparação textual.
- Removido o fallback da Copa que assumia automaticamente o usuário como visitante quando a identidade era inconclusiva. Partidas ambíguas agora são bloqueadas antes da simulação em vez de escolher um lado arbitrário.

### Escalação válida antes do início
- `getLineupValidation()` agora valida estruturalmente os titulares: exige exatamente 11 registros, 11 IDs únicos e válidos, posições válidas, formação reconhecida com 11 slots e pelo menos um goleiro.
- `inspectMatchStart()` e o fluxo de avanço para a próxima partida compartilham a mesma validação; 10/11, titular duplicado, goleiro ausente ou formação desconhecida não conseguem mais chegar ao simulador.
- A interface passa a mostrar a quantidade de titulares únicos (`10/11`, por exemplo) e diferencia escalação incompleta de formação estruturalmente inválida.
- O indicador tático da formação deixa de exibir apenas `🛡️-1`: bônus e penalidades passam a ser rotulados como `ATQ +N` / `DEF -N`, deixando claro que o `-1` era um modificador tático, não um jogador faltando.

### IDs e snapshot da partida
- Corrigido `activeLineups` em `matchSimulator.js`: o antigo `.filter(Boolean)` removia IDs numéricos válidos iguais a `0`, podendo transformar visualmente uma escalação de 11 em 10 no snapshot. Agora somente IDs nulos/vazios são descartados.
- IDs de escalação são normalizados nas comparações de campo/pré-jogo, evitando divergência entre `1` e `"1"` na seleção dos atletas ativos.

### Validação
- Pré-jogo/motor: 24/24 verificações aprovadas.
- Partida ao vivo: 58/58 verificações aprovadas.
- Simulador: 35/35 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 666/666 verificações aprovadas.
- Parser TypeScript: 323 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 803 verificados, 0 quebrados.
- `npm run build` foi tentado sem instalar dependências; o ambiente continua sem `node_modules`/Vite disponível (`vite: not found`).


## [1.0.0-beta.41] - 2026-08-16

### Commit atômico e idempotência
- Criado `matchCommitService.js` para gerar uma identidade determinística por partida, validar o relógio da carreira antes do commit e carimbar `lastMatchCommit` no estado persistido. Uma closure atrasada da mesma partida deixa de poder aplicar novamente dinheiro, XP, cartões, lesões, histórico ou avanço de calendário.
- `useMatchEngine.js` ganha lock síncrono por `ref` antes da simulação, fechando a janela em que dois cliques rápidos podiam preparar duas simulações da mesma rodada antes do React renderizar a primeira mudança de tela.
- O estado definitivo de Liga/Copa deixa de ser pré-calculado antes do playback: `completeLeagueRound()` e `buildCupPostMatchState()` agora são executados somente quando a partida é realmente confirmada.
- Cancelar no pré-jogo limpa a transação pendente e libera o lock; listas sem eventos também cancelam o commit em vez de deixar uma partida presa em estado preparado.
- O commit confirmado é enviado imediatamente à persistência, reduzindo a janela em que fechar/recarregar o app após o apito final poderia recuperar a rodada anterior.

### Persistência e concorrência de saves
- `hooks_persistence.js` passa a serializar gravações Dexie em uma fila (`saveQueueRef`), preservando a ordem de chamada: uma gravação antiga não pode terminar depois de uma nova e sobrescrever o estado recém-confirmado.
- A manutenção disparada depois do avanço da rodada também entra nessa fila; auto-bench, avisos contratuais e propostas geradas no pós-rodada não ficam mais fora do autosave do commit.
- Cada gravação captura o nome do save no momento da chamada, evitando que uma troca de carreira redirecione uma escrita pendente para outro slot.
- O botão global de salvar reutiliza o `saveGame()` central do controlador e só mostra sucesso depois de a gravação realmente retornar sucesso.

### Substituições, minutos e condição física
- As substituições realizadas na interface ao vivo passam a integrar a transação de commit por `matchControlsRef.liveSubstitutions`; antes, elas existiam apenas visualmente e o estado final já estava pronto antes da troca.
- `buildMatchMinutes()` reconstrói a linha do tempo real dos atletas, incluindo troca no intervalo e substituição de um jogador que havia entrado anteriormente.
- `minutesPlayed` passa a somar os minutos efetivos: por exemplo, troca aos 60' registra 60 minutos para quem saiu e 30 para quem entrou.
- `FatigueEngine.calculateNewEnergy()` aceita minutos da partida e escala o desgaste proporcionalmente; reservas utilizados deixam de recuperar energia como se não tivessem entrado, e titulares substituídos deixam de sofrer automaticamente o desgaste de 90 minutos.
- O risco de lesão pós-jogo também passa a considerar qualquer atleta que efetivamente entrou em campo, não somente quem tinha `isStarting` no save antes do jogo.

### Validação
- Match commit: 28/28 verificações aprovadas.
- Partida ao vivo: 57/57 verificações aprovadas.
- Motor de partida: 17/17 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 656/656 verificações aprovadas.
- Parser TypeScript: 323 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 794 verificados, 0 quebrados.
- `npm run build` foi tentado sem instalar dependências; o ambiente continua sem `node_modules`/Vite disponível.


## [1.0.0-beta.40] - 2026-08-16

### Commit unificado de Liga e Copa
- `processMatchPlayers()` passa a ser o pós-processador único para partidas de Liga e Copa; a Copa deixa de usar o caminho paralelo que chamava `FatigueEngine.applyMatchFatigue`, método inexistente no engine atual.
- Partidas de Copa agora persistem minutos, gols, assistências, `seasonGoals`, moral individual, energia, lesões e disciplina pelas mesmas regras usadas na Liga.
- O commit de Copa passa a atualizar também histórico do treinador e confronto direto, mantendo `leagueRound` intacta e avançando apenas a rodada de calendário.
- Fixtures legados sem `isPlayer` podem recuperar o time do usuário por `id: "user"` ou nome do clube antes da simulação, evitando partidas do usuário tratadas como CPU×CPU.

### Estatísticas, condição física e disciplina
- `penalty_goal` passa a contar em artilharia estruturada, gols individuais e gols sazonais; pênalti convertido não gera assistência artificial.
- `seasonGoals` preserva gols de todas as competições sem ser reduzido quando a artilharia da Liga é sincronizada.
- Corrigido o parâmetro de lesão: `injuryChanceMult` chega ao `InjuryEngine`, em vez de reutilizar incorretamente o multiplicador de fadiga.
- Lesões de partida e de treino passam a registrar histórico com a rodada correta mesmo quando o engine não expõe um helper opcional de histórico.
- A moral individual é aplicada depois do processamento físico, então uma lesão sofrida na própria partida já influencia o pós-jogo.
- `engine_discipline.js` normaliza IDs e rodadas, preserva a maior suspensão existente e distingue corretamente segundo amarelo de vermelho direto no fallback textual.

### Finanças e pós-jogo
- `getPostMatchFinanceEntry()` deixa de aceitar qualquer lançamento da mesma rodada como fallback; uma transferência/renovação da rodada não pode mais aparecer como receita/despesa da partida.
- O fallback financeiro do pós-jogo usa as regras reais de TV do `FinanceEngine`, patrocinadores ativos e premiações da Copa, removendo valores hardcoded divergentes do motor financeiro.
- Simulação e eventos preservam também IDs numéricos válidos como `0`, evitando descartá-los por coerção booleana.

### Validação
- Match commit: 18/18 verificações aprovadas.
- Motor de partida: 17/17 verificações aprovadas.
- Pós-jogo: 34/34 verificações aprovadas.
- Partida ao vivo: 57/57 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 646/646 verificações aprovadas.
- Parser TypeScript: 321 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 793 verificados, 0 quebrados.
- `npm run build` foi tentado, mas este ambiente não contém `node_modules`; o Vite não está disponível (`vite: not found`).

## [1.0.0-beta.39] - 2026-08-16

### Intervalo e retomada do segundo tempo
- Criado `matchHalftimeViewModel.js` para centralizar placar/cartões do 1º tempo e recomendações de substituição; eventos `45+N` permanecem no primeiro tempo e equipes com nomes sobrepostos deixam de contaminar as contagens.
- Recomendações do intervalo respeitam posição compatível, lesão, suspensão, histórico de trocas e limite real de substituições, impedindo sugerir reentrada de atleta já retirado.
- A transição para o segundo tempo deixa de ser otimista: `matchPlayback.js` retorna sucesso/falha nas operações de start/pause/resume e `useMatchPresentation.js` só muda a UI para o 2º tempo depois de o playback confirmar a retomada.
- `SMR_Halftime.jsx` ganhou trava contra clique duplo ao iniciar o 2º tempo, callbacks opcionais seguros e normalização do histórico de substituições.
- `MatchBench.jsx` passa a usar `MAX_LIVE_SUBSTITUTIONS`, normaliza histórico/jogadores e protege nomes, energia e overall malformados.

### Súmula e pós-jogo
- `postMatchViewModel.js` passa a preferir o placar oficial no pós-jogo, preservando `45+N`/`90+N` em gols e cartões e contabilizando cartões pelo lado parseado, não por `includes(nomeDoTime)`.
- `calendarRound` numérico ou string é normalizado em um contexto único para data da partida, rodada disputada e próxima rodada, evitando concatenações como `"6" + 1 = "61"`.
- `PostMatchAgent.js` foi endurecido para IDs string/número equivalentes, eventos estruturados e severidade determinística; corrigido o caso em que severidade `high` (valor 0) era tratada como falsa e empatava com prioridades inferiores.
- Componentes de súmula/pós-jogo toleram `events`, `rawEvents`, `subsDone`, jogadores e estatísticas nulos/malformados sem derrubar a interface.
- O playback ignora entradas não-textuais/vazias na lista visual de eventos, mantendo `rawEvents` estruturados separados da narração.

### Finanças do pós-jogo
- A associação financeira foi extraída para `getPostMatchFinanceEntry()`: somente lançamentos da rodada realmente disputada podem alimentar a aba de Finanças.
- Removido o fallback que reutilizava `financialHistory[0]`; um save sem lançamento correspondente agora reconstrói os valores apenas a partir dos dados da própria partida, evitando mostrar receita de rodada antiga.

### Validação
- Partida ao vivo: 57/57 verificações aprovadas.
- Pós-jogo: 32/32 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 624/624 verificações aprovadas.
- Parser TypeScript: 320 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 783 verificados, 0 quebrados.
- `npm run build` foi tentado, mas este ambiente não contém `node_modules`; o Vite não está disponível (`vite: not found`).

## [1.0.0-beta.38] - 2026-08-16

### Apresentação ao vivo e sincronização
- `useMatchPresentation.js` passa a controlar timers temporários por refs próprias, limpando corretamente campo/comemoração ao trocar de partida ou desmontar a tela e evitando comemoração de gol presa após eventos subsequentes.
- Pausa/retomada agora confirma o estado real de `matchControlsRef` antes de alterar a UI; início da partida e do segundo tempo só avançam de etapa quando os controles correspondentes estão realmente disponíveis.
- O estado do diálogo de substituições é zerado ao iniciar uma nova partida e o áudio usa um ref sincronizado, eliminando a condição de corrida em que o primeiro clique podia mostrar som desligado e deixar o engine ativado.
- `MatchLiveView.jsx` reutiliza `getUserMatchSide`, normaliza o histórico de trocas e só oferece substituição quando o clube do usuário participa e a partida ainda aceita interação.

### Substituições
- Criado `matchSubstitutionViewModel.js` para centralizar IDs equivalentes string/número, relógio da troca, reservas elegíveis e a transação completa de substituição.
- `SubstitutionDialog.jsx` deixa de duplicar regras de elenco: bloqueia quarta troca, reentrada, lesionado/suspenso, posição incompatível e estado pós-apito; também tolera props/histórico malformados sem derrubar a tela.
- Trocas preservam posição adaptada, usam nomes seguros, protegem `matchControlsRef` ausente e têm trava contra clique duplo antes do rerender.

### Acréscimos e intervalo
- Eventos em `45+N` agora preservam o rótulo visual original (`45+2`) em vez de aparecerem como `47`, mantendo o minuto total apenas para ordenação/cálculo.
- `SMR_Halftime.jsx` usa minuto-base para incluir corretamente gols e cartões de `45+N` no primeiro tempo e usa o parser central de cartões para não confundir equipes com nomes sobrepostos.

### Validação
- Partida ao vivo: 51/51 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 609/609 verificações aprovadas.
- Parser TypeScript: 319 arquivos JS/JSX/MJS, 0 erros.
- Imports locais: 772 verificados, 0 quebrados.
- O build Vite não pôde ser executado: `npm ci` falhou por indisponibilidade de rede (`EAI_AGAIN`) e o `vite` não ficou instalado; o `node_modules` parcial foi removido antes do empacotamento.

## [1.0.0-beta.37] - 2026-08-16

### Playback e apresentação da partida
- `matchPlayback.js` passa a rejeitar listas de eventos inválidas, limpar timers órfãos antes de preparar uma nova partida e encerrar o apito final sem deixar um tick residual ativo.
- O relógio agora separa minuto-base e acréscimo: `45+2'` continua pertencendo ao primeiro tempo, enquanto o intervalo só é aberto quando o próximo evento tem minuto-base acima de 45.
- Pausa, retomada, intervalo, encerramento forçado e auto-simulação ganharam guardas adicionais contra chamadas duplicadas ou estados já encerrados.
- O placar final pode ser reconciliado com o resultado oficial da simulação no evento de fim de jogo, evitando divergência visual caso uma narração legada não seja reconhecida como gol.

### View-models ao vivo e pós-jogo
- `matchPresentationViewModel.js` centraliza a identificação do lado do usuário, sanitização de placar e normalização de posse, eliminando resultados `NaN`, percentuais que não fecham em 100% e inferência incorreta quando o clube não participa da partida.
- Snapshots de escalação aceitam IDs equivalentes em formato numérico/string; substituições inválidas, incompletas ou do jogador por ele mesmo viram no-op e não criam titulares extras.
- `postMatchViewModel.js` reutiliza as regras do view-model ao vivo em vez de duplicar placar/posse e passa a classificar eventos pela tipagem central, ignorando entradas nulas/objetos malformados sem derrubar a súmula.
- Estatísticas pós-jogo são sanitizadas para valores não negativos e garantem `chutes no alvo <= finalizações`; a posição do usuário também pode ser localizada por `isPlayer` ou nome do clube quando o id legado `user` não estiver presente.
- Corrigido o relatório de `smoke-match-live`: as verificações adicionadas na beta.36 agora são contadas antes da linha de resumo.
- Nomes de equipes sobrepostos (ex.: um nome contido integralmente no outro) passam a escolher o lado mais específico em gols normais, e o botão de substituição deixa de permanecer disponível depois do apito final.

### Validação
- Partida ao vivo: 40/40 verificações aprovadas.
- Pós-jogo: 23/23 verificações aprovadas.
- Suíte completa `npm run test:smoke`: 598/598 verificações aprovadas.
- Sintaxe dos módulos alterados validada com `node --check`.
- `npm ci` foi tentado para validar o build Vite, mas a instalação não concluiu dentro do ambiente; o `node_modules` parcial foi removido antes do empacotamento.

## [1.0.0-beta.36] - 2026-08-16

### Auditoria de eventos da partida
- `matchSimulationEvents.js`, `matchEventViewModel.js` e `matchEventParser.js` foram auditados em conjunto para alinhar eventos estruturados, narração e consumo pela interface.
- Gols normais, pênaltis convertidos e gols contra preservam autor e lado correto; segundo amarelo e vermelho direto passam por parsing consistente.
- Substituições, eventos neutros e fim de jogo passam a ter tipo próprio nos eventos da simulação, reduzindo inferência por texto em consumidores posteriores.
- Acréscimos como `45+2'` passam a ser interpretados como minuto total 47 para ordenação/placar por minuto, mantendo compatibilidade com eventos antigos.
- Listas de eventos nulas/inválidas recebem fallback seguro em cálculos de placar.

### Validação
- `match-live` recebeu verificações adicionais para acréscimos, substituições e listas inválidas.
- Simulador e helpers permaneceram sem regressões nas suítes existentes.

## [1.0.0-beta.35] - 2026-08-16

### Partida ao vivo e ciclo de confirmação
- `MatchField.jsx` reduzido de 301 para 28 linhas; campo, marcadores e rodapé foram separados em componentes próprios e o estado visual foi movido para view-models puros.
- `ScreenMatchResult.jsx` deixa de concentrar timers e reprodução; `useMatchPresentation.js` coordena pré-jogo, partida, intervalo, pausa, som e pós-jogo.
- O playback é preparado sem iniciar automaticamente: a partida só começa quando o usuário aciona **Iniciar partida**. Sair ainda no pré-jogo descarta o resultado pré-calculado e não consome a rodada.
- O estado oficial da carreira deixa de ser aplicado antes do apito inicial; tabela, caixa, fadiga e avanço do calendário só são confirmados quando a partida termina ou quando uma partida já iniciada é encerrada/auto-simulada.
- O commit do estado é idempotente e um pré-jogo cancelado limpa também o commit pendente.

### Correções de campo, eventos e substituições
- O campo usa snapshots do roster realmente simulado e não ordena mais `teamRosters` in-place, eliminando mutação silenciosa do save apenas para renderizar o adversário.
- Posição adaptada é respeitada no campo e os labels usam `leagueRound`/`calendarRound` explícitos, evitando mostrar a rodada seguinte durante a partida atual.
- Gol normal, pênalti e gol contra passam por um parser único; placar, intervalo e pós-jogo creditam o lado e o autor corretos. Segundo amarelo também compartilha parsing consistente e não aparece duplicado como amarelo + vermelho.
- O intervalo ocorre mesmo quando não há eventos comuns no segundo tempo, e pausa/retomada funciona após o intervalo.
- Substituições da reprodução ficam em roster local da partida: não duplicam minutos, não alteram `isStarting` permanente e não permitem reentrada, jogador lesionado/suspenso ou reserva incompatível com a posição.
- O pré-jogo visitante mostra o estádio do mandante real, e o cabeçalho diferencia corretamente pré-jogo, intervalo, partida ativa e encerrada.
- Pós-jogo prefere a posse oficial produzida pelo simulador e a aba financeira associa o lançamento à rodada de calendário realmente disputada.

### Validação
- Partida ao vivo: 28/28 verificações específicas aprovadas.
- Suíte completa `npm run test:smoke`: 582/582 verificações aprovadas.
- Parser TypeScript: 318 arquivos JS/JSX/MJS sem erro; 765 imports locais verificados, 0 quebrados.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- O build Vite continua dependente de `node_modules`; neste ambiente a tentativa retorna `vite: not found`.

## [1.0.0-beta.34] - 2026-08-16

### Refatoração financeira (plano originalmente reservado à beta.32)
- `engine_finances.js` reduzido a uma fachada de compatibilidade e `financeViewModel.js` reduzido a um barrel curto; regras passam a viver em módulos de partida/bilheteria, risco, ledger, projeções, patrocinadores e apresentação do histórico.
- Metadados puros de estádio foram extraídos para `src/data/teamStadiumData.js`, permitindo ao motor financeiro consultar capacidade do mandante sem carregar React.
- Criada suíte `test:finances` para validar a economia sem depender da interface.

### Correções de caixa, bilheteria e projeção
- Jogos fora deixam de calcular público e renda usando o estádio do próprio usuário; a capacidade real do mandante CPU passa a ser usada e o usuário recebe exatamente a cota de 10% da bilheteria bruta.
- Público de partidas fora deixa de ser truncado pela capacidade do estádio do usuário; chuva e ocupação passam a aceitar RNG/opção determinística para testes.
- Projeção financeira passa a usar `leagueRound`, não o índice geral do calendário, e identifica corretamente próxima partida em casa ou cota de visitante.
- Direitos de TV limitam a rodada ao intervalo real da competição, evitando bônus negativos/fora de faixa.
- Custos operacionais deixam de ser cobrados novamente em jogos de Copa; o ciclo permanece a cada 4 rodadas da Liga.
- Folha salarial passa a ser calculada a partir dos jogadores como fonte de verdade; carreiras novas já nascem com `club.wage` sincronizado.
- Diagnóstico de risco passa a considerar receita fixa de TV + patrocínios antes de calcular o burn rate, evitando marcar como insolvente um clube com fluxo recorrente positivo apenas por ter caixa baixo.

### Extrato e temporada
- Novos lançamentos financeiros recebem `season`, `round`, `leagueRound` e competição; o limite do ledger sobe para 300 entradas para reduzir perda de movimentações em temporadas movimentadas.
- O painel e o snapshot de fim de temporada passam a somar apenas a temporada corrente; lançamentos legados sem `season` são migrados na virada anual.
- Luvas de assinatura são separadas de patrocínio recorrente, e despesas de Academy, DM e renovações contratuais ganham categorias próprias no resumo.
- Assinatura comercial impede sobrescrever um patrocinador ativo e rejeita valores negativos; RNG de ofertas é injetável para testes.

### Validação
- Finanças: 37/37 verificações específicas aprovadas.
- Suíte completa `npm run test:smoke`: 553/553 verificações aprovadas.
- Parser TypeScript: 310 arquivos JS/JSX/MJS sem erro; 743 imports locais verificados, 0 quebrados.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- `npm run build` foi tentado; este ambiente não contém `node_modules`, portanto o Vite não está disponível (`vite: not found`).
- Todas as correções da beta.33 de IA CPU permanecem como base; a antiga beta.32 não foi publicada como artefato separado, e seu escopo financeiro foi incorporado nesta beta.34.

## [1.0.0-beta.33] - 2026-08-16

### Refatoração
- `engine_cpu_ai.js` reduzido de 319 para 34 linhas e transformado em fachada compatível. As regras foram separadas em `src/engines/cpu/`: configuração/janelas, contratos, moral, recrutamento, rosters e transferências CPU×CPU.
- Recrutamento e transferências passam a aceitar RNG opcional para testes determinísticos, sem alterar as chamadas existentes.
- `playerFactory.js` passa a aceitar RNG e `generateSquad()` passa a propagar corretamente `teamId` aos atletas gerados.

### Correções de IA e mercado
- Recrutamento automático de clubes CPU agora respeita as mesmas janelas 1–5 e 20–24; antes a reposição por jogadores gerados ocorria também com a janela fechada.
- Compras CPU×CPU passam a movimentar `money` e `budget`, respeitar orçamento, limite de 30 jogadores e mínimo de 20 no vendedor.
- O atleta transferido muda de `teamId`/`teamName`, deixa de ficar listado e recebe vínculo mínimo de 2 anos; vendedor e comprador permanecem sincronizados em `teamRosters` e `leagues`.
- Recrutamento por reposição prioriza uma espinha mínima jogável (goleiro, zagueiros, laterais e atacante) e não pode ultrapassar 30 atletas.
- A força CPU passa a considerar a qualidade real do roster, então contratações, vendas e elencos fracos deixam de ser quase cosméticos no simulador. A força só é recalculada quando o elenco muda, evitando deriva artificial por rodada.
- Jogadores com contrato CPU expirado são removidos do clube antes das negociações e entram no mercado como agentes livres reais, sem vínculo fantasma com o ex-clube.
- O mercado evita inserir duas vezes o mesmo agente livre liberado.

### Contratos e consistência de estado
- Elencos CPU recém-gerados na virada de temporada não perdem mais um ano de contrato imediatamente; contratos de 1 ano deixaram de começar a nova temporada em 0.
- Jogador do usuário com contrato expirado sai ao fim da temporada mesmo sendo titular, alinhando a regra ao aviso de contrato.
- Renovação de contrato expirado adiciona exatamente 2 anos, valida jogador antes do saldo, impede custo negativo de gerar dinheiro e produz lançamento no histórico financeiro.
- `getSeasonEndDepartures()` passa a incluir titulares expirados.
- Estado inicial passa a criar `teamRosters.user` e jogadores de usuário/CPU com `teamId` correto desde a origem.

### Validação
- Nova suíte `test:cpu-ai` com 37 verificações de janela, orçamento, contratos, agentes livres, força, rosters, recrutamento e transferências CPU×CPU.
- Suíte completa: 516/516 verificações aprovadas.
- Parser TypeScript: 301 arquivos JS/JSX/MJS sem erro; 703 imports locais verificados, 0 quebrados.
- `npm run build` foi tentado; o ambiente desta sessão não contém `node_modules`, portanto o Vite não está disponível (`vite: not found`).
- Numeração avançada diretamente de beta.31 para beta.33 conforme o ciclo de desenvolvimento desta etapa.

## [1.0.0-beta.31] - 2026-08-16

### Refatoração
- `matchSimulator.js` reduzido de 378 para 51 linhas e transformado em orquestrador puro; roster/eleven ativo, cálculo de força, linha do tempo, taxas/frases e estatísticas foram separados em `matchSimulationRoster.js`, `matchSimulationStrength.js`, `matchSimulationEvents.js`, `matchSimulationConfig.js` e `matchSimulationStats.js`.
- A simulação passa a aceitar RNG opcional no sexto argumento, mantendo compatibilidade com chamadas antigas e permitindo reproduzir exatamente a mesma partida em testes.
- O roster de cada equipe é resolvido uma única vez por simulação; o fallback sem squad deixa de gerar um elenco novo a cada evento.

### Correções e consistência
- Segundo amarelo passa a significar dois amarelos do mesmo jogador na partida atual. Ter dois cartões acumulados de jogos anteriores não expulsa mais o atleta no primeiro amarelo do jogo; o acúmulo de três continua responsabilidade do `DisciplineEngine`.
- Reservas não podem mais marcar gols ou receber cartões antes de entrar. Substituições da CPU trocam atletas de fato no onze ativo; expulsos são removidos imediatamente e não podem participar de eventos posteriores.
- Estilo Defensivo deixa de aumentar a força ofensiva rival; Defensivo reduz ataque do usuário e do adversário em lados coerentes, enquanto Ofensivo aumenta poder de ataque e exposição defensiva.
- Vantagem de mando passa a usar a torcida/fanBase do mandante real e do visitante real. Quando o usuário joga fora, sua fidelidade não é mais aplicada como torcida da casa.
- Desfalques da CPU passam a afetar sua força também contra o usuário, não apenas em partidas CPU×CPU.
- Ajuste tático aos 60 minutos passa a funcionar para cada clube CPU independentemente; em CPU×CPU o time perdendo abre o jogo e o time vencendo fecha, em vez de fortalecer o lado errado.
- A taxa de amarelos foi alinhada ao comentário/regra configurada (~3,5 por jogo no total), corrigindo a divisão duplicada que deixava a incidência pela metade.
- Estatísticas garantem `chutes no alvo <= finalizações`, usam tentativas-base independentes para cada equipe e permanecem persistidas uma única vez por partida.
- Removido o recálculo de intervalo que não podia observar substituições do usuário durante uma simulação já pré-calculada e reaplicava multiplicadores de estilo/cartões de forma inconsistente.
- O destaque da tela Sobre passa a usar automaticamente o título da versão atual do changelog, evitando texto congelado de betas antigas.

### Validação
- Simulador: 33/33 verificações novas aprovadas; amostra determinística de 500 partidas ficou em 2,89 gols e 3,54 amarelos por jogo.
- Suíte completa `npm run test:smoke` aprovada: 479/479 verificações.
- Sintaxe de 295 arquivos JS/JSX/MJS analisada sem erros e 684 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- `npm run build` continua dependente de `node_modules`; neste ambiente o Vite não está instalado (`vite: not found`).
- Versão sincronizada para `1.0.0-beta.31`.

## [1.0.0-beta.30] - 2026-08-16

### Refatoração
- `continentalEngine.js` reduzido de 380 para cerca de 140 linhas e transformado em fachada/orquestrador; elegibilidade/configuração, fase de grupos e mata-mata foram separados em `continentalConfig.js`, `continentalGroup.js` e `continentalKnockout.js`.
- Criado `cupPrizeAccounting.js` para transformar a diferença real de `totalPrize` de cada Copa em receita da partida, sem depender de mensagens visuais para movimentar o caixa.
- `cupUtils.js` passa a aceitar RNG opcional em sorteio, gols, pênaltis, desempate e criação de confrontos, mantendo o padrão com `Math.random` e permitindo testes determinísticos.

### Correções e consistência
- A fase de grupos de Libertadores/Sul-Americana passa a simular também CPU×CPU: ao final dos seis jogos do usuário, todos os quatro clubes possuem seis partidas na tabela.
- A classificação continental passa a usar pontos, vitórias, saldo, gols marcados e nome como fallback determinístico.
- Saves continentais antigos sem confrontos CPU paralelos são compatíveis: jogos CPU ausentes são simulados quando uma rodada já disputada é processada novamente pelo fluxo novo.
- O prêmio total da fase de grupos usa o valor exato configurado (`prizes.group`), eliminando perda de unidades causada por `floor(group / 3) * 3`.
- Mata-mata deixa de tentar evitar repetição apenas por `history[].winner`; agora todos os clubes já enfrentados no grupo e no mata-mata são excluídos do sorteio enquanto houver alternativas.
- O clube original escolhido pelo usuário (`existingTeamId`) não pode aparecer como adversário continental do próprio time.
- Premiações de Copa do Brasil, Libertadores e Sul-Americana passam a entrar no caixa pelo delta real de `totalPrize`; avanços de fase e prêmio de grupos não ficam mais apenas no histórico visual.
- Resultado duplicado de uma mesma perna continental é ignorado e não soma pontos ou prêmios novamente.

### Validação
- Continental: 23/23 verificações novas aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 446/446 verificações.
- Sintaxe de 288 arquivos JS/JSX/MJS analisada sem erros e 671 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- `npm run build` foi tentado e continua dependente de `node_modules`; neste ambiente o Vite não está instalado (`vite: not found`).
- Versão sincronizada para `1.0.0-beta.30`.

## [1.0.0-beta.29] - 2026-08-16

### Refatoração
- `app.jsx` reduzido de 386 para 37 linhas; estado/ações passam para `useGameController.js`, manutenção pós-rodada para `useRoundMaintenance.js`, roteamento para `components/app/GameScreenRouter.jsx` e modais/diálogos para `components/app/AppOverlays.jsx`.
- `matchesViewModel.js` reduzido de 387 para 8 linhas e preservado como fachada pública; constantes, placares, resolução de Copas, calendário mensal e linha do tempo foram separados em módulos dentro de `src/engines/matches/`.
- Regras puras do controlador principal foram concentradas em `src/engines/app/gameControllerService.js`, permitindo testar manutenção de rodada, venda rápida, camisa, salário e contratos sem React.
- `app.jsx` deixa de importar motores e componentes sem uso e passa a ser apenas o shell visual da aplicação.

### Correções e consistência
- Adicionar/remover titulares pelo controlador principal reutiliza `lineupService.js`, eliminando uma segunda implementação e passando a verificar suspensão para a próxima partida, não para o slot atual.
- Auto-bench pós-rodada limpa também `adaptedPosition` de lesionados/suspensos e usa a próxima partida real para verificar indisponibilidade.
- Avisos de contrato passam a seguir `leagueRound`; jogos de Copa não criam lembretes duplicados nem deslocam a cadência de 5 rodadas.
- Venda rápida pelo perfil do jogador passa a sincronizar `teamRosters.user`, favoritos/mercado, folha salarial, caixa, orçamento e contador de transferências do clube de origem.
- O PlayerModal recebe a próxima rodada para exibir suspensão de forma consistente com Elenco, Campo, DM e Escalação.
- O calendário de partidas mantém compatibilidade com saves sem `calendar`, recupera jogos de Copa já disputados e preserva pênaltis no histórico recente.
- Resultados inválidos deixam de produzir placares `NaN`; o parser retorna `null` de forma segura.

### Validação
- Partidas/App: 47/47 verificações novas aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 423/423 verificações.
- Sintaxe de 283 arquivos JS/JSX/MJS analisada sem erros e 658 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- Build Vite continua dependente de `node_modules`; neste ambiente o Vite não está instalado.
- Versão sincronizada para `1.0.0-beta.29`.

## [1.0.0-beta.28] - 2026-08-16

### Refatoração
- `ScreenSeasonEnd.jsx` reduzido de 310 para 47 linhas e transformado em compositor; hero, abas, resumo da temporada, elenco, finanças, tabela final e ações foram extraídos para `src/components/seasonEnd/`.
- `seasonEngine.js` reduzido a um orquestrador de 73 linhas; objetivo, resultado/snapshot, elenco, clubes, Academy e transição anual foram separados em `src/engines/season/`.
- `useRoundAdvance.js` deixa de montar objetivo/histórico/transição diretamente e delega a virada para `seasonTransitionService.js`.
- `applySeasonEvolution` aceita RNG injetável, preservando o comportamento padrão e permitindo testes determinísticos.

### Correções e consistência
- Objetivos `libertadores`, `sulamericana` e `midtable` passam a ser avaliados de verdade no fim da temporada; antes eram oferecidos no setup, mas não participavam da decisão de permanência/demissão.
- O encerramento da temporada passa a respeitar o calendário completo: uma final de Copa/continental posicionada depois da última rodada da Liga não é mais pulada.
- A classificação final usa os critérios completos de desempate com as fixtures da temporada.
- `seasonResult` passa a guardar um snapshot antes do reset anual, preservando artilheiro, líder de assistências, elenco, finanças, objetivo, estatísticas e tabela final.
- “Ver Tabela Final” deixa de abrir a tabela zerada da nova temporada e passa a exibir a classificação encerrada armazenada no snapshot.
- Folha salarial é recalculada após envelhecimento, reajustes, saídas e reposições; o orçamento anual de transferências é reconstruído a partir do caixa da nova temporada.
- Histórico disciplinar é preservado entre temporadas enquanto cartões/suspensões correntes são reiniciados.
- Títulos de Liga e copas conquistados no ano passam a incrementar `managerProfile.trophies`.
- Histórico de carreira passa a ser construído a partir do fechamento real da temporada, antes de o estado anual ser zerado.

### Validação
- Fim de temporada: 48/48 verificações novas aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 376/376 verificações.
- Sintaxe de 273 arquivos JS/JSX/MJS analisada sem erros e 643 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- Build Vite continua dependente de `node_modules`; neste ambiente o Vite não está instalado.
- Versão sincronizada para `1.0.0-beta.28`.

## [1.0.0-beta.27] - 2026-08-16

### Refatoração
- `matchPostProcessor.js` reduzido de 402 linhas para um barril de compatibilidade; jogadores, notificações, base, transferências e contexto de rodadas foram separados em módulos próprios em `src/engines/match/`.
- Criado `matchRoundContext.js` para distinguir explicitamente índice do calendário completo, rodada de Liga concluída e próxima partida.
- Criados `matchPlayerPostProcessor.js`, `matchAcademyPostProcessor.js`, `matchTransferPostProcessor.js`, `matchNotifications.js` e `matchNotificationBuilders.js`.
- `matchRoundState.js` passa a consolidar o estado usando o contexto de rodadas em vez de recalcular números de forma independente.

### Correções e consistência
- Avisos de contrato, imprensa, rumores, cobrança da diretoria, Base, mercado CPU e progressão da Academy passam a seguir a rodada da Liga; slots de Copa não deslocam mais essas regras.
- Pressão da torcida passa a considerar a partida recém-encerrada e usa as fixtures atualizadas, permitindo disparar corretamente após a terceira derrota consecutiva.
- Suspensões continuam usando o calendário real de partidas, mas a contagem pós-jogo agora olha a próxima partida; vermelho direto exibe 2 jogos e segundo amarelo 1 jogo.
- `engine_discipline.js` passa a processar `red_second_yellow` nos eventos estruturados; antes o tipo era reconhecido no código, mas removido pelo filtro inicial e podia não suspender o atleta.
- Jogador cuja suspensão termina no jogo atual não é mais retirado indevidamente da escalação do próximo compromisso.
- Lesão de treino escolhe apenas reservas ainda saudáveis após o processamento da partida.
- Direitos de TV, custos operacionais e importância financeira da rodada de Liga deixam de usar o índice do calendário com Copas intercaladas.
- Força do clube só é recalculada quando ainda existem 11 titulares válidos após lesões/suspensões, evitando gravar uma força artificialmente reduzida por escalação incompleta.

### Validação
- Pós-jogo: 18/18 verificações novas aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 328/328 verificações.
- Sintaxe de 255 arquivos JS/JSX/MJS analisada sem erros e 603 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- `npm run build` continua dependente de `node_modules`; neste ambiente o Vite não está instalado.
- Versão sincronizada para `1.0.0-beta.27`.

## [1.0.0-beta.26] - 2026-08-15

### Refatoração
- `MarketSections.jsx` reduzido de 425 para 7 linhas e mantido apenas como barril de compatibilidade; cabeçalho, negociação e as cinco abas foram separados em `src/components/market/sections/`.
- `ScreenMarket.jsx` reduzido de 236 para aproximadamente 87 linhas e mantido como compositor da tela.
- `MarketPlayerCards.jsx` reduzido de 237 para aproximadamente 125 linhas, reutilizando `JerseyBadge` e as cores centralizadas em `playerVisuals.js`.
- Estado, filtros, favoritos e ações do Mercado extraídos para `src/hooks/useMarketController.js`.
- Constantes e view-model do catálogo movidos para `src/engines/market/marketViewModel.js`.
- Janela, caixa/orçamento, limite de elenco, saúde financeira, reputação e mínimo do vendedor centralizados em `src/engines/market/transferRules.js` e compartilhados com `useSquad`.

### Correções e consistência
- Cards, Scout, favoritos, negociação e `buyPlayer` passam a consultar a mesma elegibilidade; a interface não anuncia mais uma compra possível quando o motor vai recusá-la.
- Negociação deixa de exibir sucesso falso quando janela, orçamento, elenco, reputação ou situação financeira impedem a contratação.
- Janela de transferências passa a usar a próxima rodada de Liga (`leagueRound + 1`) em vez do índice do calendário completo; slots de Copa não deslocam mais as janelas.
- Mercado inicial passa a reconhecer a rodada 1 antes da primeira partida, mantendo as janelas 1–5 e 20–24 coerentes com a Liga.
- Cabeçalho diferencia caixa, orçamento de transferências e folha salarial; Scout usa a verba efetivamente disponível.
- Favoritos usam preço/OVR/clube atuais antes de liberar a contratação, evitando comprar pelo valor antigo do snapshot.
- Scout passa a considerar elencos das Séries C/D e `teamRosters`, com deduplicação por jogador.
- Filtros modernos `LD`/`LE`/`CA` reconhecem `LAT`/`ATA` de saves antigos.
- Compras passam a remover o atleta do vendedor em `teamRosters`, `teams` e ligas A/B/C/D, adicionar o atleta ao roster do usuário e gravar `teamId: 'user'`.
- Vendas para clubes C/D passam a sincronizar squad, `teamRosters`, `teamId`, caixa, orçamento, folha e Inbox.
- Transferências CPU→CPU respeitam a janela de transferências, e a renovação automática do catálogo usa a rodada de Liga.
- Geração do catálogo passa a incluir corretamente o limite superior da faixa de OVR configurada.

### Validação
- Mercado: 45/45 verificações novas aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 310/310 verificações.
- Sintaxe de 248 arquivos JS/JSX/MJS analisada sem erros e 581 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; usos executáveis continuam restritos a APIs nativas do navegador (`location`, listeners e `AudioContext`).
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.26`.

## [1.0.0-beta.25] - 2026-08-15

### Refatoração
- `ScreenBoot.jsx` reduzido de 462 para aproximadamente 70 linhas e mantido apenas como orquestrador da inicialização.
- `ScreenAbout.jsx` reduzido de 489 para aproximadamente 35 linhas e mantido como compositor da tela Sobre.
- Cabeçalho, cards de save, estado vazio, loading, progresso e rodapé extraídos para `src/components/boot/`.
- Logo/hero, apoio via PIX e histórico de versões extraídos para `src/components/about/`.
- Regras puras da inicialização movidas para `src/engines/boot/bootViewModel.js`; changelog visual movido para `src/data/aboutChangelog.js`.
- Chave PIX centralizada em `src/config/support.js`.

### Correções e consistência
- Tela inicial passa a usar `APP_NAME` e exibe Tática Manager, removendo o vestígio visual “CLUBE DE BOLSO”.
- Logo da tela Sobre deixa de exibir “CDB” e passa a usar a identidade “TM”.
- Chave PIX exibida e chave copiada passam a vir da mesma constante; antes a interface mostrava `suporte@brasfootweb.com`, mas copiava `brasfoot@pix.com`.
- Saves são ordenados por `savedAt` decrescente antes de destacar a carreira mais recente; a ordem bruta do IndexedDB não define mais o destaque.
- Metadado `totalRounds` do Boot passa a preferir `calendar.length`, compatível com `gameData.round` como índice do calendário completo com Copa.
- Histórico de carreira respeita valores numéricos zero com `??`, evitando fallback indevido para dados legados.
- Cards expansíveis e retorno da tela Sobre usam controles semânticos/ARIA.

### Validação
- Boot/Sobre: 29/29 verificações novas aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 265/265 verificações.
- Sintaxe de 238 arquivos JS/JSX/MJS analisada sem erros e 552 imports locais verificados sem referências quebradas.
- Somente APIs nativas do navegador permanecem em `window` (`location`, listeners e `AudioContext`).
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.25`.

## [1.0.0-beta.24] - 2026-08-15

### Refatoração
- `FieldView.jsx` reduzido de 306 para aproximadamente 31 linhas e mantido apenas como compositor do campo tático.
- Gramados vertical/horizontal, cabeçalho, legenda e marcador de jogador extraídos para `src/components/field/`.
- Layouts, distribuição de titulares, nome curto e estado dos marcadores centralizados em `src/engines/field/fieldViewModel.js`.
- `JerseyBadge` removido de `helpers.js` e transformado em componente próprio em `src/components/player/JerseyBadge.jsx`, com IDs SVG únicos por instância.
- `helpers.js` reduzido de 259 para 7 linhas e mantido apenas como barril legado de regras puras; nenhum módulo interno do app depende mais dele.
- Cores/OVR/idade movidos para `src/utils/playerVisuals.js`, moral para `src/engines/core/moraleEngine.js`, fadiga/lesões para `src/engines/match/playerConditionProcessor.js` e parser para `src/engines/match/matchEventParser.js`.

### Correções e consistência
- Campo tático passa a suportar de verdade `4-1-4-1` e `4-5-1`; antes essas formações exibiam o nome correto, mas usavam silenciosamente o desenho do 4-4-2.
- Distribuição no campo considera `adaptedPosition` antes da posição original e sinaliza improvisação quando precisa usar fallback.
- `JerseyBadge` passa a respeitar `showPos={false}`, que antes era ignorado, e evita colisões entre IDs de gradiente/filtro SVG.
- Moral recente deixa de tratar o índice do calendário completo como índice de `fixtures`: usa as últimas partidas de Liga efetivamente jogadas, independentemente de slots de Copa.
- Disponibilidade de Elenco, Centro Médico, navegação, escalação e campo passa a usar a próxima rodada (`gameData.round + 1`), igual à pré-validação da partida, evitando divergência visual de suspensões.
- Somente APIs nativas do navegador continuam usando `window` (`location`, listeners e `AudioContext`).

### Validação
- Campo/Helpers: 37/37 verificações novas aprovadas.
- Centro Médico ampliado para 29/29 e Elenco para 32/32 após a unificação da próxima rodada; demais domínios permanecem verdes.
- Suíte completa `npm run test:smoke` aprovada: 236/236 verificações.
- Sintaxe de 224 arquivos JS/JSX/MJS analisada sem erros e 540 imports locais verificados sem referências quebradas.
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.24`.

## [1.0.0-beta.23] - 2026-08-15

### Refatoração
- `ScreenMedical.jsx` reduzido de 404 para aproximadamente 53 linhas e mantido como orquestrador do Centro Médico.
- `ScreenSquad.jsx` reduzido de 395 para aproximadamente 27 linhas e mantido como orquestrador do Elenco.
- Cabeçalho, seções, cards e legenda do Centro Médico extraídos para `src/components/medical/`.
- Cabeçalho, filtros, cards, campo/lista e ações do Elenco extraídos para `src/components/squad/`.
- Regras puras extraídas para `src/engines/medical/medicalViewModel.js`, `src/engines/squad/squadViewModel.js` e `src/engines/core/playerStatus.js`.

### Correções e consistência
- Penalidades de fadiga exibidas no Centro Médico passam a seguir `FatigueEngine`: -2 OVR abaixo de 70, -5 abaixo de 50 e -8 abaixo de 30.
- Gastos de tratamento, recuperação individual e fisioterapia passam a gerar lançamento em `financialHistory`, mantendo caixa e extrato sincronizados.
- Fisioterapia evita cobrança inútil quando todo o elenco já está com 100% de energia; recuperação individual também bloqueia jogador já totalmente recuperado.
- Ordenação do Elenco passa a reconhecer `LD`, `LE`, `MC`, `PD`, `PE` e `CA`, preservando `LAT` e `ATA` de saves antigos.
- Total de desfalques deixa de somar duas vezes um jogador simultaneamente lesionado e suspenso; os contadores individuais continuam independentes.
- Estado “elenco em plena forma” não aparece mais ao mesmo tempo que uma seção de energia baixa.
- Filtros do Elenco e cards de jogador usam controles semânticos/ARIA sem alterar o fluxo de navegação.

### Validação
- Centro Médico: 28/28 verificações novas aprovadas.
- Elenco: 31/31 verificações novas aprovadas.
- Navegação ampliada para 24/24 com regressão de desfalque único.
- Suíte completa `npm run test:smoke` aprovada: 197/197 verificações.
- Sintaxe de 213 arquivos JS/JSX/MJS analisada sem erros e 515 imports locais verificados sem referências quebradas.
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.23`.

## [1.0.0-beta.22] - 2026-08-15

### Refatoração
- `MenuPrincipal.jsx` reduzido de 400 para aproximadamente 29 linhas e mantido apenas como compositor da Central.
- Cabeçalho, alerta de escalação, próxima partida, títulos de seção e grid de navegação extraídos para `src/components/home/`.
- Regras da Central centralizadas em `src/engines/home/homeViewModel.js`, reutilizando os resumos já extraídos para a navegação inferior.
- Removidos cálculos duplicados locais de Inbox, Base, DM, classificação, forma, finanças e calendário.

### Correções e consistência
- Fim da temporada passa a usar `calendar.length` quando disponível, evitando encerrar a Central antes dos slots de Copa restantes.
- Forma recente deixa de percorrer `gameData.round` como índice de `fixtures`; agora considera apenas partidas de Liga realmente jogadas.
- Card da Base passa a incluir `academyReady`, igualando o painel ao badge da navegação inferior.
- Mensagens não lidas passam a respeitar `readMsgIds`, lixeira, exclusões e flags legadas, evitando divergência entre Central e BottomNav.
- Próxima partida de Copa calcula mando e orientação de ida/volta pelo confronto real, em vez de herdar `isHome` de uma partida de Liga inexistente.
- Slots de Copa já inativos são ignorados ao localizar o próximo compromisso exibido.
- Alerta de escalação passa a funcionar em qualquer rodada e também detecta titular lesionado/suspenso.
- Cards e chamadas principais usam botões semânticos e rótulos ARIA sem alterar o visual do painel.

### Validação
- 26/26 verificações novas da Central aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 137/137 verificações.
- Sintaxe de 199 arquivos JS/JSX/MJS analisada sem erros e 489 imports locais verificados sem referências quebradas.
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.22`.

## [1.0.0-beta.21] - 2026-08-15

### Refatoração
- `BottomNav.jsx` reduzido de 513 para aproximadamente 90 linhas e mantido apenas como orquestrador da navegação inferior.
- Barra fixa extraída para `src/components/navigation/BottomNavigationBar.jsx`.
- Submenus Time, Clube e Opções separados em componentes próprios, com primitivas visuais compartilhadas em `NavDialogPrimitives.jsx`.
- Itens, estado ativo/bloqueado, badges e resumos contextuais centralizados em `src/engines/navigation/bottomNavViewModel.js`.
- Removidos 17 imports legados sem uso do antigo `BottomNav`, incluindo helpers de jogador e componentes MUI não utilizados.

### Correções e consistência
- Badge/descrição da Categoria de Base passa a considerar `academyReady`, mantendo visíveis os garotos que já atingiram a idade de promoção.
- Progresso exibido no menu do clube usa `gameData.calendar.length` quando existe, em vez de misturar o índice do calendário completo com apenas as rodadas de Liga.
- Estado de Opções durante uma simulação deixa de parecer clicável sem responder: apresentação e regra de clique agora usam a mesma função de bloqueio.
- Mensagens de navegação respeitam `readMsgIds`, lixeira, exclusões permanentes e o marcador legado `message.read`; datas ausentes recebem fallback por rodada.
- Posição não encontrada na tabela passa a exibir `—` em vez de `0º`.
- Backup JSON troca o prefixo legado `brasfoot_` por `tatica_manager_`, com nome do clube sanitizado.
- Botões da barra e dos diálogos usam elementos `button`/atributos ARIA, melhorando navegação por teclado e leitores de tela.

### Validação
- 23/23 verificações novas da navegação aprovadas.
- Suíte completa `npm run test:smoke` aprovada: 111/111 verificações.
- Sintaxe de 190 arquivos JS/JSX/MJS analisada sem erros e 469 imports locais verificados sem referências quebradas.
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.21`.

## [1.0.0-beta.20] - 2026-08-15

### Refatoração
- `useMatchEngine.js` reduzido de 536 para aproximadamente 161 linhas e mantido como orquestrador React.
- Pré-validação e reconstrução do calendário extraídas para `src/engines/match/matchPreflight.js`.
- Rodadas de Liga e Copa separadas em `matchLeagueRound.js` e `matchCupRound.js`.
- Construção do estado pós-jogo da Liga movida para `matchRoundState.js`, com utilitários puros em `matchStateUtils.js`.
- O hook deixa de concentrar atualização de tabela, finanças, H2H, estádio, artilharia, CPU, academia e inbox.
- `FORMATION_SLOTS`, compatibilidade de posições e `getLineupValidation` extraídos de `helpers.js` para `src/engines/lineup/lineupRules.js`, com reexport compatível para a UI antiga.

### Correções e consistência
- Corrigida a mutação direta de `gameData.fixtures`: partidas de Liga agora são clonadas, simuladas imutavelmente e salvas explicitamente em `fixtures`.
- Corrigida a persistência de `seasonGoals`: a artilharia é acumulada e sincronizada nos jogadores antes de `preparePostMatchPlayers`, eliminando o antigo side-effect tardio que podia perder os gols no save.
- Conclusão de obras do estádio deixa de disparar `setTimeout` dentro do updater de estado; o domínio sinaliza a conclusão e o hook apenas exibe o toast.
- Pré-validação de escalação, jogador irregular e slots de Copa inativos passa a ter retorno explícito, reduzindo branches duplicados no hook.
- O fluxo de Copa preserva comportamento financeiro, disciplina, fadiga e fidelidade da torcida sem depender do hook monolítico.

### Validação
- 15/15 smoke tests novos do motor de partidas aprovados, incluindo imutabilidade de fixtures/tabela e sincronização de `seasonGoals`.
- Suíte completa `npm run test:smoke` aprovada: 88/88 verificações (pré-jogo 10, classificação 10, Inbox 12, Carreira 18, Categoria de Base 23 e motor de partidas 15).
- Sintaxe de 183 arquivos JS/JSX/MJS analisada sem erros e 458 imports locais verificados sem referências quebradas.
- `npm run build` foi tentado, mas o ambiente não possui `node_modules`; o comando encerra em `vite: not found`.
- Versão sincronizada para `1.0.0-beta.20`.

## [1.0.0-beta.19] - 2026-08-15

### Refatoração
- `ScreenAcademy.jsx` reduzida de 532 para aproximadamente 107 linhas e mantida como orquestradora da Categoria de Base.
- Cabeçalho, elenco/filtros, cards de prospectos, investimentos e diálogos separados em `src/components/academy/`.
- Pools, estatísticas, filtros, salário de promoção, progresso e mutações puras centralizados em `src/engines/academy/academyViewModel.js`.
- Metadados de nível/prestígio e validação de investimento consolidados no `AcademyEngine`.

### Correções e consistência
- Corrigido o pool `academyReady`: garotos que completavam a idade de promoção no fim da temporada deixavam `academy` e ficavam invisíveis para a interface. Agora permanecem visíveis e promovíveis, inclusive em saves antigos.
- A transição de temporada preserva prospectos já pendentes em `academyReady` em vez de sobrescrevê-los na temporada seguinte.
- Promoção e dispensa removem o garoto tanto de `academy` quanto de `academyReady`, evitando reaparecimentos e duplicações.
- Promoção recalcula `club.wage` com a folha real do elenco profissional.
- Investimentos não permitem mais pagar para rebaixar a academia de Elite/Avançada para um nível inferior.
- A aba Investir deixa de prometer OVR/potencial inicial maior: a apresentação agora reflete a regra real de maior chance de evolução.
- Progresso visual do prospecto é limitado a 0–100% e trajetórias desconhecidas de saves legados recebem fallback seguro.
- Notificações de promoção também consideram o pool `academyReady`.

### Validação
- 23/23 verificações da Categoria de Base aprovados.
- Classificação 10/10, Inbox 12/12 e Carreira 18/18 continuam aprovados.
- Sintaxe de 176 arquivos JS/JSX/MJS analisada sem erros.
- 440 imports locais verificados sem referências quebradas.
- Nenhum global interno `window.*` foi reintroduzido; permanecem apenas APIs nativas do navegador.
- Versão sincronizada para `1.0.0-beta.19`.

## [1.0.0-beta.18] - 2026-08-15

### Refatoração
- `ScreenCareer.jsx` reduzida de 571 para 67 linhas e mantida como orquestradora da carreira.
- Hero, proposta, estatísticas da temporada, carreira acumulada, moral/torcida, histórico, H2H, Copa e modal separados em `src/components/career/`.
- Cálculos de nível, aproveitamento, saldo, histórico e confrontos centralizados em `src/engines/career/careerViewModel.js`.
- Propostas de clube centralizadas em `src/engines/career/managerOfferService.js` e compartilhadas entre Career e Inbox, removendo regras duplicadas.
- Shim global removido de `main.jsx`; motores, bancos, componentes, helpers e geradores deixam de ser publicados em `window`.
- Consumidores legados em Boot, mercado, Academy, Medical, BottomNav, MenuPrincipal, `helpers.js` e branding passam a usar imports ES diretos.

### Correções e consistência
- Barra de experiência da carreira passa a respeitar os marcos reais de 5/20/50/100 XP; nível Lendário agora exibe progresso completo em vez de barra vazia.
- Aceitar/recusar proposta pela tela de Carreira evita IDs duplicados na lixeira e usa exatamente a mesma mutação da Inbox.
- `database_branding.js` deixa de depender de `window.teamBranding`, corrigindo a dependência oculta de ordem de inicialização.
- `helpers.js` usa `FatigueEngine` e `InjuryEngine` diretamente para penalidade de energia, recuperação e lesões.
- Mercado usa `generatePlayer` e `CpuAI` por import; badges, escudos e disciplina deixam de depender de registros globais.
- Os únicos `window.*` restantes são APIs reais do navegador (`location`, eventos e `AudioContext`).

### Validação
- 18/18 smoke tests do novo domínio de carreira aprovados.
- 12/12 smoke tests da Inbox reexecutados e aprovados após compartilhar o serviço de proposta.
- Sintaxe de 168 arquivos JS/JSX/MJS analisada sem erros.
- 422 imports locais verificados sem referências quebradas.
- Build Vite completo não foi executado neste ambiente porque `node_modules` não está disponível.
- Versão sincronizada para `1.0.0-beta.18`.

## [1.0.0-beta.17] - 2026-08-15

### Refatoração
- `ScreenInbox.jsx` reduzida de 571 para aproximadamente 200 linhas e mantida como orquestradora da caixa de entrada.
- Lista/lixeira e leitura de mensagem separadas em `src/components/inbox/`.
- Geração, ordenação, busca, contadores, normalização de tipos e mutações puras centralizadas em `src/engines/inbox/inboxService.js`.
- Removidos imports legados e não utilizados da Inbox; os componentes passam a depender apenas do que realmente consomem.

### Correções e consistência
- Propostas `managerOffer`, já suportadas pela regra interna, agora exibem botões de aceitar/recusar também na Inbox.
- Mensagens `renew_contract` geradas pelo motor CPU passam a permitir renovação diretamente pelo correio.
- `warning` deixa de exibir “resposta requerida” sem qualquer ação disponível.
- `CpuAI.applyContractRenewal` passa a validar jogador inexistente, aceita RNG injetável para testes e recalcula `club.wage` após o reajuste.
- Tipos legados `contract` são normalizados para `CONTRATO`; imprensa, rumor, torcida e disciplina recebem estilos próprios.
- Mensagens sem `date` ou `preview` usam `round` e `body` como fallback, melhorando notificações já gravadas em saves antigos.
- Dependências do `useMemo` das mensagens geradas passam a acompanhar mudanças reais de clube e elenco, inclusive salário e titularidade.
- IDs de leitura/lixeira/exclusão passam a evitar duplicatas nas operações centralizadas.

### Validação
- 12/12 smoke tests da Inbox aprovados.
- Scripts adicionados: `npm run test:inbox` e `npm run test:smoke` atualizado para incluir Inbox.
- Build Vite completo não foi executado neste ambiente porque `node_modules` não está disponível e a instalação das dependências não pôde ser concluída.
- Versão sincronizada para `1.0.0-beta.17`.

## [1.0.0-beta.16] - 2026-08-15

### Refatoração
- `ScreenTable.jsx` reduzida de 614 para aproximadamente 60 linhas e mantida como orquestradora da classificação.
- Cabeçalho/abas, classificação, ranking de artilheiros e modal de detalhes separados em `src/components/table/`.
- Zonas por série, movimentos de fim de temporada, progresso, saldo de gols, técnicos e ranking centralizados em `src/engines/table/tableViewModel.js`.
- Removidas redefinições locais de `posColor`/`ovrColor` e dependências de `window.TeamIcon`/`window.getTeamCoach` no fluxo da classificação.

### Correções e consistência
- Posições modernas de ataque (`CA`, `PD`, `PE`) passam a usar as cores compartilhadas corretas no ranking em vez do fallback cinza da implementação antiga.
- `ScreenTable` passa a receber `sharedProps`; o modal de artilheiros recupera acesso a `buyPlayer`, `formatMoney` e `showToast`, que existiam na assinatura mas nunca eram enviados por `app.jsx`.
- Compra iniciada pelo ranking normaliza `teamName` antes de chegar ao fluxo central, preservando validações do clube vendedor, remoção de `teamRosters` e contabilização de transferências.
- Modal de artilheiro passa a considerar também `transferBudget`, evitando apresentar uma contratação como disponível quando o valor excede o orçamento.
- Abas e linhas clicáveis de artilheiros recebem semântica de botão/tab para navegação mais previsível por teclado e leitores de tela.

### Validação
- 10/10 smoke tests do novo view-model de classificação aprovados.
- Smoke tests de pré-jogo da beta 15 reexecutados: 10/10 aprovados.
- Sintaxe de 150 arquivos JS/JSX analisada pelo parser TypeScript sem erros.
- 403 imports locais verificados sem referências quebradas.
- `npm run test:smoke` passa a executar os testes de pré-jogo e classificação em sequência após a instalação normal das dependências.
- Build Vite completo não foi executado neste ambiente porque `node_modules` não está disponível.
- Versão sincronizada para `1.0.0-beta.16`.

## [1.0.0-beta.15] - 2026-08-15

### Refatoração
- `ScreenNextMatch.jsx` reduzida de 624 para aproximadamente 62 linhas e mantida como orquestradora da tela pré-jogo.
- Cabeçalho/ações, confronto, escalações, status da escalação, agregado e fim de temporada separados em `src/components/nextmatch/`.
- Resolução de calendário Liga/Copa, adversário, titulares CPU, forma recente e regras do agregado centralizadas em `src/engines/nextmatch/nextMatchViewModel.js`.
- `ScreenNextMatch` deixa de depender diretamente de `window.TeamIcon`, `window.JerseyBadge`, `window.DisciplineEngine` e `window.getLineupValidation`; os consumidores passam a usar imports ES.
- Auto-simulação deixa de trafegar pela flag global `window._smrAutoSimulate`; `startMatchSimulation` agora recebe a opção `{ autoSimulate: true }` e grava o estado diretamente em `matchControlsRef`.

### Correções e consistência
- Forma recente deixa de usar `gameData.round` como índice de `fixtures`, evitando resultados incorretos quando Copas inserem slots entre rodadas da Liga.
- Mensagem do placar agregado passa a considerar a diferença real de gols: informa quando empate classifica, quantos gols são necessários para levar aos pênaltis e quantos classificam diretamente.
- Texto ambíguo “Quem marca avança” foi removido do agregado e substituído por contexto correto do jogo de ida.
- Busca da linha do adversário na tabela prioriza `id` e mantém fallback por nome para compatibilidade com saves antigos.
- Indicadores de força no card “VS” passam a respeitar a ordem mandante/visitante, inclusive quando o usuário joga fora de casa.
- Seleção automática dos 11 jogadores do adversário foi isolada e preserva compatibilidade com posições legadas `LAT`/`ATA`.

### Validação
- 10/10 smoke tests do novo view-model de pré-jogo aprovados.
- Sintaxe de 145 arquivos JS/JSX analisada pelo parser TypeScript sem erros.
- 392 imports locais verificados sem referências quebradas.
- Build completo não foi executado neste ambiente porque as dependências npm não estavam disponíveis no cache offline.
- Versão sincronizada para `1.0.0-beta.15`.

## [1.0.0-beta.14] - 2026-08-15

### Refatoração
- `PlayerModal.jsx` reduzido de 627 para aproximadamente 84 linhas e mantido como orquestrador do modal de atleta.
- Cabeçalho, navegação e as abas Perfil, Temporada, Camisa, Salário e Disciplina separados em `src/components/player/`.
- Regras puras de potencial, camisas ocupadas, salário, renovação, listagem e status disciplinar centralizadas em `src/engines/player/playerProfileService.js`.
- Removidos estados, componentes auxiliares e imports não utilizados do modal antigo.
- `JerseyBadge`, `FatigueEngine` e `DisciplineEngine` passam a ser consumidos por imports ES diretos em vez de `window.*`.

### Correções e consistência
- Corrigido o fluxo de **Listar para venda**: `PlayerModal` agora recebe `onSetGameData` e altera `isListed`/`market` sem cair acidentalmente na venda imediata.
- Retirar um jogador da lista remove também sua entrada correspondente do mercado.
- Renovação por desempenho passa a renovar de fato a duração contratual, além de aplicar o reajuste salarial exibido no botão.
- Validação de salário e definição de duração do novo contrato ficam em funções únicas, evitando regras duplicadas na interface.
- Status disciplinar e penalidade física deixam de depender de globals carregados em ordem específica.

### Validação
- 11/11 smoke tests do novo serviço de jogador aprovados.
- Sintaxe JS/JSX analisada pelo parser TypeScript sem erros.
- Imports locais verificados sem referências quebradas.
- Versão sincronizada para `1.0.0-beta.14`.

## [1.0.0-beta.13] - 2026-08-15

### Refatoração
- `ScreenCopas.jsx` reduzida de 340 para aproximadamente 35 linhas e mantida como orquestradora visual.
- Status, confronto atual, grupos, jogos, histórico e navegação separados em `src/components/cups/`.

### Correções e consistência
- Finais de jogo único passam a ser identificadas corretamente na interface.
- Placar da volta é exibido na mesma orientação visual do confronto.
- Agregado incompleto deixa de renderizar valores inexistentes.
- Imports não utilizados removidos da tela de Copas.

### Validação
- Smoke tests da interface de Copas aprovados.
- Sintaxe JS/JSX e imports locais verificados.
- Versão sincronizada para `1.0.0-beta.13`.

## [1.0.0-beta.12] - 2026-08-15

### Refatoração
- `cups_engine.js` reduzido de 690 para aproximadamente 86 linhas e convertido em fachada compatível.
- Regras separadas em `src/engines/cups/`: configuração, utilitários, Copa do Brasil, torneios continentais, consultas e inicialização por temporada.
- `CalendarEngine.js` e o motor de copas passam a compartilhar a mesma fonte de fases, premiações e posições de calendário.
- Adicionado `registerCopaLegResult` com o nome correto; `registerCupaLegResult` permanece como alias para compatibilidade.

### Correções e consistência
- Fase de grupos da Libertadores/Sul-Americana deixa de encerrar após apenas três chamadas e agora exige os seis jogos de ida/volta.
- Estatísticas do adversário também são atualizadas corretamente nos jogos de volta da fase de grupos.
- Finais de Libertadores e Sul-Americana passam a ser decididas em jogo único, inclusive ao carregar saves antigos que ainda contenham uma `leg2`.
- Slots de grupos são associados à fase/adversário correto pelo calendário, evitando consumir o primeiro confronto pendente de outra rodada.
- Clubes da CONMEBOL passam a ser carregados pelo próprio motor continental, sem depender da ordem de imports de `main.jsx`.
- Datas/posições divergentes entre `cups_engine.js` e `CalendarEngine.js` foram unificadas.
- Consulta de próximos jogos passa a incluir também as partidas de volta da fase de grupos.
- Tela de Copas usa `TeamIcon` por import ES direto e passa a exibir placares de ida e volta dos grupos.

### Validação
- Smoke tests de grupos, elegibilidade, Copa do Brasil, calendário e final continental aprovados.
- Sintaxe dos módulos JavaScript e imports locais verificados.
- Versão sincronizada para `1.0.0-beta.12`.

## [1.0.0-beta.11] - 2026-08-15

### Refatoração
- `ScreenLineup.jsx` reduzida de 663 para aproximadamente 167 linhas e mantida como orquestradora da escalação.
- Cabeçalho/formações, campo, cards, banco/indisponíveis e diálogos separados em `src/components/lineup/`.
- View-model, disponibilidade, autoescala, troca de formação e mutações de titulares/adaptados centralizados em `src/engines/lineup/lineupService.js`.
- `ScreenLineup` deixa de depender de `window.DisciplineEngine`, `window.FatigueEngine`, `window.JerseyBadge`, `window.posColor`, `window.ovrColor` e `window.getLineupValidation`.

### Correções e consistência
- Formação 4-4-2 alinhada entre campo e `FORMATION_SLOTS`: passa a usar `PD + 2 VOL + PE`, eliminando a antiga divergência com `2 MEI`.
- Suspensões são verificadas para a próxima rodada também ao adicionar manualmente um titular.
- Jogadores improvisados deixam de virar "ghost starters" e agora permanecem visíveis nos slots livres do campo, recebendo a penalidade já prevista pela validação global.
- Troca de formação limpa adaptações incompatíveis com o novo desenho tático sem remover silenciosamente titulares.
- Autoescala prioriza posição exata, depois posição compatível e só então improvisação.
- Alterações na escalação passam a alimentar `setIsDirtyLineup`, fazendo o aviso de saída sem salvar funcionar de fato.
- Long press para editar camisa não dispara mais, em seguida, a troca titular/banco do mesmo jogador.
- Número de camisa é validado entre 1 e 99 antes de ser aplicado.
- `APP_VERSION_LABEL` passa a ser derivado de `APP_VERSION`, reduzindo risco de versão visual ficar atrasada.

### Validação
- 10/10 smoke tests do novo serviço de escalação aprovados.
- Sintaxe JS/JSX analisada pelo parser TypeScript sem erros.
- Imports locais verificados sem referências quebradas.
- Versão sincronizada para `1.0.0-beta.11`.

## [1.0.0-beta.10] - 2026-08-15

### Refatoração
- `ScreenFinances.jsx` reduzida de 721 para aproximadamente 74 linhas e mantida como orquestradora da área financeira.
- Cabeçalho/risco, resumo, extrato, acordos comerciais e evolução separados em `src/components/finances/`.
- Projeções, ofertas de patrocinadores, assinatura de contratos, parsing de extrato e agregações movidos para `src/engines/finances/financeViewModel.js`.
- Removidos `window.FinanceEngine` e o stub `window.getFinancialSuggestions` do fluxo financeiro.

### Correções e consistência
- Diagnóstico financeiro passa a calcular a folha diretamente dos jogadores quando `club.wage` ainda está zerado em uma carreira nova.
- Resumo de temporada passa a contabilizar `detail.wage` e `detail.opCost` dos registros atuais em vez de ignorar parte das despesas recorrentes.
- Histórico legado de patrocínios continua sendo reconhecido nas agregações.
- Projeção de TV usa `FinanceEngine.getTVRights` para a próxima rodada, em vez de uma tabela estática duplicada na interface.
- Bilheteria estimada passa a usar a média real do histórico quando disponível.
- Despesas estimadas por rodada incluem a parcela média dos custos operacionais, alinhando o saldo projetado ao diagnóstico de risco.
- Corrigido o uso de `<Alert>` sem importação no bloco do Diretor Financeiro.
- `APP_VERSION_LABEL`, que havia ficado preso em `v1.0 beta.6`, volta a acompanhar a versão real do projeto.

### Validação
- Smoke tests de agregação moderna/legada, contratos, projeção e parsing do extrato aprovados.
- Sintaxe JS/JSX analisada pelo parser TypeScript sem erros.
- Imports locais verificados sem referências quebradas.
- Versão sincronizada para `1.0.0-beta.10`.

## [1.0.0-beta.9] - 2026-08-15

### Refatoração
- `ScreenMatches.jsx` reduzida de 930 para aproximadamente 112 linhas e mantida como orquestradora visual.
- Calendário, detalhe do dia, próximos jogos, resultados recentes e súmula separados em `src/components/matches/`.
- Construção dos eventos de Liga/Copa, histórico e próximos jogos centralizada em `src/engines/matches/matchesViewModel.js`.
- Datas de Liga/Copa passam a reutilizar `src/utils/matchDateUtils.js` como fonte única.

### Correções e consistência
- Comparações de próximo jogo normalizadas por `calendarSlot`, evitando misturar índice do calendário completo com número da rodada da Liga após a entrada das Copas.
- Jogos de Copa já disputados voltam a aparecer no calendário mensal e podem abrir súmula quando o resultado estiver disponível.
- Resultados recentes da Liga usam os slots de Liga realmente jogados, evitando saltos quando existem Copas intercaladas.
- Histórico de Copas também considera confrontos arquivados em `history`, com deduplicação.
- `ScreenMatches` deixa de depender de `window.TeamIcon`, `window.CupsEngine`, `window.getLineupValidation` e `window.SMR_parseEvent`.
- Cabeçalho passa a exibir rodada real da Liga (`leagueRound`) em vez do índice geral do calendário.

### Validação
- Sintaxe JS/JSX analisada com parser TypeScript sem erros.
- 305 imports locais verificados sem referências quebradas.
- Smoke tests de calendário, histórico de Copa, próximo slot e resultados recentes aprovados.
- Versão sincronizada para `1.0.0-beta.9`.

## [1.0.0-beta.8] - 2026-08-15

### Refatoração
- `ScreenPostMatch.jsx` reduzida de 805 para aproximadamente 195 linhas e mantida como orquestradora do pós-jogo.
- Cabeçalho/placar movido para `src/components/postmatch/PostMatchHeader.jsx`.
- Súmula, finanças, classificação e desfalques separados em componentes próprios.
- Cards e linhas de estatísticas compartilhados extraídos para `PostMatchUi.jsx`.
- Parsing de eventos, estatísticas e variação de posição centralizados em `postMatchViewModel.js`.

### Correções e consistência
- Faltas e escanteios deixam de ser sorteados pela interface a cada render e passam a ser gerados uma única vez pelo `matchSimulator`.
- A súmula passa a usar `homeOnTarget`/`awayOnTarget` produzidos pelo motor, em vez de recalcular chutes no alvo na UI.
- Variação de posição usa `posVariation` real da tabela e não tenta reconstruir a classificação anterior desfazendo o placar.
- Partidas de Copa não exibem mais falsa variação de posição da Liga.
- Aba Finanças prioriza o `financialHistory` efetivamente aplicado ao caixa, evitando mostrar cota de TV/patrocínio incorretos em jogos de Copa e incluindo premiações no total.
- Minutos de substituição são normalizados para evitar apóstrofo duplicado também na súmula pós-jogo.

### Validação
- 95 arquivos JS/JSX analisados sem erros de sintaxe.
- 284 imports locais verificados sem referências quebradas.
- Smoke tests do `postMatchViewModel` aprovados.
- Versão sincronizada para `1.0.0-beta.8`.

## [1.0.0-beta.7] - 2026-08-15

### Refatoração
- `ScreenMatchResult.jsx` reduzida de 1.289 para aproximadamente 297 linhas e mantida como orquestradora do fluxo da partida.
- Cabeçalho/placar extraído para `src/components/match/MatchHeader.jsx`.
- Campo e formações extraídos para `MatchField.jsx`.
- Banco, narração, overlays, substituições e controles ao vivo separados em componentes próprios.
- Removidos estados, cálculos e componentes mortos que pertenciam a versões antigas da tela.

### Correções
- Corrigido fallback do número da camisa no mini-campo, que referenciava uma variável inexistente quando `shirt` não estava definido.
- A escalação visual do adversário não ordena mais o array original do save in-place.
- Registro visual das substituições deixou de duplicar o apóstrofo do minuto.
- Timers de transição e overlays agora têm limpeza explícita ao desmontar/atualizar efeitos.

### Validação
- 88 arquivos JS/JSX analisados pelo parser TypeScript sem erros de sintaxe.
- 265 imports locais verificados sem referências quebradas.
- Versão sincronizada para `1.0.0-beta.7`.

## [1.0.0-beta.6] - 2026-08-15

### Refatoração
- `src/engines/engine.js` reduzido de aproximadamente 669 linhas para um barrel de compatibilidade com cerca de 20 linhas.
- Geração de jogadores e elencos movida para `src/engines/core/playerFactory.js`.
- Evolução/regressão anual movida para `src/engines/core/playerDevelopment.js`.
- Fixtures, classificação, desempates e zonas da tabela movidos para `src/engines/core/leagueEngine.js`.
- Criação do estado inicial movida para `src/engines/core/gameStateFactory.js`.
- Transição de temporada movida para `src/engines/core/seasonEngine.js`.
- Forma recente e força CPU disponível movidas para `src/engines/core/teamMetrics.js`.

### Compatibilidade
- A API pública de `engine.js` foi preservada, evitando alterações em massa nos hooks, telas e engines que já importam suas funções.
- Regras de geração, promoção/rebaixamento, contratos, finanças de virada e evolução foram mantidas durante a extração.
- Estrutura de saves e identificadores legados não foi alterada.

### Validação
- Imports locais e sintaxe dos módulos extraídos validados.
- Versão sincronizada para `1.0.0-beta.6`.

## [1.0.0-beta.5] - 2026-08-15

### Refatoração
- `ScreenSetup.jsx` reduzida de 935 para aproximadamente 48 linhas e mantida como orquestradora da criação de carreira.
- Os seis passos da configuração foram separados em componentes próprios em `src/components/setup/steps/`.
- `SetupSteps.jsx` virou um roteador pequeno entre as etapas.
- Cabeçalho, navegação, progresso e uniforme foram extraídos para `SetupUi.jsx`.
- Paleta, estilos de campos e formatação monetária foram centralizados em `setupTheme.js`.
- Validação, times disponíveis, branding e defaults de clube/estádio foram movidos para `setupService.js`.

### Arquitetura e robustez
- O fluxo de nova carreira deixou de depender de `window.teamBranding`, `window.diexDatabase`, `window.getTeamStadium`, `window.TeamIcon` e `window.clubsDatabase`.
- Dados de clubes, cores, estádios e escudos agora são consumidos diretamente pelos módulos ES.
- Fluxo visual e regras de divisão, clube, dificuldade, objetivo, técnico, uniforme e contrato foram preservados.

### Validação
- Todos os arquivos JS/JSX do `src` foram analisados sem erros de sintaxe.
- Imports locais verificados sem referências quebradas.
- JSONs de projeto validados e versão sincronizada para `1.0.0-beta.5`.

## [1.0.0-beta.4] - 2026-08-15

### Refatoração
- `ScreenMarket.jsx` reduzida de aproximadamente 821 para 243 linhas e mantida como orquestradora da tela.
- Criado `src/components/market/MarketSections.jsx` com cabeçalho, negociação e abas Livres, Clubes, Vendas, Scout e Favoritos.
- Análise do Scout movida para `buildScoutAnalysis()` no `marketService.js`.
- Resolução visual da negociação centralizada em `getNegotiationPreview()`.
- Busca de jogadores monitorados centralizada em `getWatchlistPlayerState()`.

### Correções
- Negociações agora reencontram corretamente jogadores pertencentes às Séries C e D antes de concluir a proposta.
- Favoritos agora localizam jogadores atualizados também na Série D.
- Regras de preço, filtros, vendas e recomendações do Scout foram preservadas durante a divisão dos componentes.

### Validação
- Testes básicos do `marketService` aprovados.
- Todos os arquivos JS/JSX analisados sem erros de sintaxe e imports locais verificados.

## [1.0.0-beta.3] - 2026-08-15

### Refatoração
- Extraídos os cards de contratação e venda para `src/components/market/MarketPlayerCards.jsx`.
- `ScreenMarket.jsx` reduzida de aproximadamente 1.030 para 820 linhas sem alterar o fluxo visual.
- Agrupamento de jogadores com proposta, listados e restantes movido para `marketService.js`.
- Busca de proposta de venda centralizada em `findPlayerSaleOffer()`.
- Imports obsoletos da tela de mercado removidos.

### Compatibilidade
- Regras de compra, negociação, venda e watchlist preservadas.
- Estrutura de saves e identificadores legados mantidos.

## [1.0.0-beta.2] - 2026-08-15

### Identidade
- Nome oficial definido como **Tática Manager**, substituindo o nome provisório usado durante a preparação da beta.
- Pacote npm definido como `tatica-manager`.
- Splash, tela inicial, nova carreira, Sobre, título HTML, relatórios e documentação atualizados.
- `appName` do Capacitor atualizado; `appId` e banco IndexedDB legados preservados para compatibilidade.

### Refatoração
- Criado `src/engines/market/marketService.js`.
- Filtros, normalização, atualização do mercado, identificação de divisão, negociação e aplicação de vendas extraídos de `ScreenMarket.jsx`.
- `ScreenMarket.jsx` reduzido de aproximadamente 1.127 para 1.030 linhas.
- Corrigida perda acidental das Séries C e D no estado ao concluir determinadas vendas de jogadores.

## [1.0.0-beta.1] - 2026-08-14
- `useMatchEngine.js` reduzido de 1.351 para aproximadamente 541 linhas.
- Simulação, playback, estatísticas e pós-jogo extraídos para `src/engines/match/`.
- Metadados centralizados em `src/config/appMeta.js`.
- Adicionados README, arquitetura, deploy, contribuição, CI e configuração Vercel.

## Histórico legado
As versões internas `v3` a `v8` continuam registradas na tela **Sobre** e não representam versões SemVer do repositório.

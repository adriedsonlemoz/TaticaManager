# Changelog

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

# Changelog

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

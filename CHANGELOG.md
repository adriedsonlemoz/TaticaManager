# Changelog

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

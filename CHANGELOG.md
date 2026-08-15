# Changelog

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

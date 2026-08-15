# Arquitetura — Tática Manager

Tática Manager é uma aplicação frontend React/Vite; a carreira e as regras rodam no cliente e não exigem backend.

```text
React UI
 ├─ hooks
 │   ├─ useMatchEngine
 │   └─ useRoundAdvance
 ├─ engines
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

## Motor de partidas
- `matchSimulator.js`: simulação de campo.
- `matchPlayback.js`: reprodução e narração.
- `matchPlayerStats.js`: estatísticas individuais.
- `matchPostProcessor.js`: pós-jogo.

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
1. Dividir `engine.js` por domínio.
2. Separar cálculo e UI de `ScreenMatchResult.jsx` e `ScreenPostMatch.jsx`.
3. Modularizar `ScreenMatches.jsx` e `ScreenFinances.jsx`.
4. Centralizar aleatoriedade e criar testes unitários.
5. Revisar componentes de setup/mercado restantes acima de 200 linhas.


## Mercado
A tela de transferências segue a divisão entre orquestração, apresentação e domínio:
- `src/components/ScreenMarket.jsx`: estado visual e coordenação das ações.
- `src/components/market/MarketPlayerCards.jsx`: cards reutilizáveis de compra e venda.
- `src/components/market/MarketSections.jsx`: cabeçalho, negociação e conteúdo das cinco abas.
- `src/engines/market/marketService.js`: filtros, Scout, negociação, vendas, favoritos e regras puras do mercado.

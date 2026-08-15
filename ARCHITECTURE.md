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

## Compatibilidade
O banco Dexie legado e o `appId` do Capacitor foram preservados no rename para evitar que saves existentes desapareçam para o usuário.

## Próximos alvos
1. Extrair cards e diálogos de `ScreenMarket.jsx`.
2. Dividir `engine.js` por domínio.
3. Separar cálculo e UI de `ScreenMatchResult.jsx` e `ScreenPostMatch.jsx`.
4. Modularizar `ScreenSetup.jsx` por etapa.
5. Centralizar aleatoriedade e criar testes unitários.

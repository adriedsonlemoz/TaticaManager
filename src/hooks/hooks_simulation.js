// @migrated to ES module
// hooks/hooks_simulation.js — v4.0 (thin re-export)
// A lógica foi extraída para:
//   useMatchEngine.js   — simulação de partida (helpers + startMatchSimulation)
//   useRoundAdvance.js  — avanço de rodada, fim de temporada, escalação
// Este arquivo mantém a assinatura pública para compatibilidade com app.jsx.

import useMatchEngine from './useMatchEngine.js';
export { useMatchEngine as useMatchSimulation };
export default useMatchEngine;

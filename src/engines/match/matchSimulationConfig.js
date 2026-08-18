export const MATCH_SIMULATION_RATES = Object.freeze({
  goalPerMinuteTotal: 0.029,
  // ~3,5 amarelos por partida no total: 0,0194 por time/minuto.
  yellowPerTeamPerMinute: 0.0194,
  directRedPerMinuteTotal: 0.00156,
  penaltyPerMinuteTotal: 0.003,
  ownGoalShare: 0.03,
  neutralEventChance: 0.35,
  cpuSubstitutionChance: 0.12,
});

export const GOAL_PHRASES = Object.freeze([
  '⚽ GOL do',
  '⚽ GOL! Que pintura do',
  '⚽ GOL! Jogada ensaiada do',
  '⚽ GOL! De cabeça para o',
  '⚽ GOL! Um chutaço do',
]);

export const YELLOW_PHRASES = Object.freeze([
  '🟨 Amarelo para',
  '🟨 Falta tática de',
  '🟨 Juiz marca falta dura e dá amarelo para',
]);

export const PENALTY_PHRASES = Object.freeze([
  '🚨 PÊNALTI! Falta dentro da área marcada pelo árbitro',
  '🚨 PÊNALTI! VAR confirmou a infração',
  '🚨 PÊNALTI! Derrubado dentro da área',
]);

export const NEUTRAL_PHRASES = Object.freeze([
  'Boa troca de passes no meio-campo',
  'Falta cobrada, nada de perigo',
  'Lateral cobrado rapidamente',
  'Goleiro segura com tranquilidade',
  'Pressão alta da equipe visitante',
  'Contra-ataque travado pela defesa',
  'Tentativa de longe, por cima',
  'VAR checando possível falta',
  'Árbitro marca falta no campo de defesa',
  'Escanteio afastado pela zaga',
]);

export const randomItem = (items, rng = Math.random) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index];
};

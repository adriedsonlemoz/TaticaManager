import { FatigueEngine } from '../engine_fatigue.js';

// Fonte única das formações e compatibilidades de posição.
// Módulo puro de domínio: não depende de React nem de componentes.
export const LINEUP_SIZE = 11;

export const FORMATION_SLOTS = {
  '4-4-2':   { GOL:1, ZAG:2, LD:1, LE:1, PD:1, VOL:2, PE:1, CA:2 },
  '4-3-3':   { GOL:1, ZAG:2, LD:1, LE:1, VOL:1, MC:1, MEI:1, PD:1, PE:1, CA:1 },
  '4-2-3-1': { GOL:1, ZAG:2, LD:1, LE:1, VOL:2, PD:1, MEI:1, PE:1, CA:1 },
  '3-5-2':   { GOL:1, ZAG:3, LD:1, LE:1, VOL:2, MC:1, CA:2 },
  '3-4-3':   { GOL:1, ZAG:3, LD:1, LE:1, VOL:2, PD:1, PE:1, CA:1 },
  '5-3-2':   { GOL:1, ZAG:3, LD:1, LE:1, VOL:2, MC:1, CA:2 },
  '4-1-4-1': { GOL:1, ZAG:2, LD:1, LE:1, VOL:1, MC:2, PD:1, PE:1, CA:1 },
  '4-5-1':   { GOL:1, ZAG:2, LD:1, LE:1, VOL:2, MC:1, PD:1, PE:1, CA:1 },
};

export const POSITION_COMPAT = {
  CA:  ['PD', 'PE', 'MEI', 'ATA'],
  PE:  ['CA', 'PD', 'MEI', 'LD', 'ATA'],
  PD:  ['CA', 'PE', 'MEI', 'LE', 'ATA'],
  ATA: ['CA', 'PD', 'PE'],
  MEI: ['MC', 'VOL', 'CA'],
  MC:  ['VOL', 'MEI'],
  VOL: ['MC', 'ZAG'],
  ZAG: ['VOL', 'LD', 'LE'],
  LD:  ['LE', 'ZAG', 'PD', 'LAT'],
  LE:  ['LD', 'ZAG', 'PE', 'LAT'],
  LAT: ['LD', 'LE', 'ZAG'],
  GOL: [],
};

export const canPlayAs = (playerPos, slotRole) => (
  playerPos === slotRole || (POSITION_COMPAT[playerPos] || []).includes(slotRole)
);

const playerIdKey = (value) => value == null || String(value).trim() === '' ? null : String(value);
const isPlayerRecord = (player) => player && typeof player === 'object';

export const getLineupValidation = (gameData) => {
  if (!gameData) return {
    isValid:false, isComplete:false, avgStrength:0, counts:{}, req:{}, improvised:[], adapted:[],
    starters:[], starterCount:0, uniqueStarterCount:0, missingStarters:LINEUP_SIZE, extraStarters:0,
    duplicateStarterIds:[], invalidStarters:[], formationValid:false, hasGoalkeeper:false,
  };

  const players = Array.isArray(gameData.players) ? gameData.players.filter(isPlayerRecord) : [];
  const starters = players.filter((player) => player.isStarting === true);
  const formation = gameData.club?.formation || '4-4-2';
  const selectedFormation = FORMATION_SLOTS[formation];
  const formationValid = Boolean(selectedFormation)
    && Object.values(selectedFormation).reduce((sum, value) => sum + (Number(value) || 0), 0) === LINEUP_SIZE;
  const req = selectedFormation || FORMATION_SLOTS['4-4-2'];

  const idCounts = new Map();
  starters.forEach((player) => {
    const key = playerIdKey(player.id);
    if (key != null) idCounts.set(key, (idCounts.get(key) || 0) + 1);
  });
  const duplicateStarterIds = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  const invalidStarters = starters.filter((player) => (
    playerIdKey(player.id) == null || !String(player.position || '').trim()
  ));
  const uniqueStarterCount = new Set(starters.map((player) => playerIdKey(player.id)).filter(Boolean)).size;
  const starterCount = starters.length;
  const missingStarters = Math.max(0, LINEUP_SIZE - uniqueStarterCount);
  const extraStarters = Math.max(0, starterCount - LINEUP_SIZE);

  const counts = starters.reduce((acc, player) => {
    const effectivePosition = player.adaptedPosition || player.position;
    acc[effectivePosition] = (acc[effectivePosition] || 0) + 1;
    return acc;
  }, {});
  const availableSlots = { ...req };
  const improvised = [];
  const adapted = [];

  starters.forEach((player) => {
    const effectivePosition = player.adaptedPosition || player.position;
    if ((availableSlots[effectivePosition] || 0) > 0) {
      availableSlots[effectivePosition] -= 1;
      if (player.adaptedPosition && player.adaptedPosition !== player.position) adapted.push(player.id);
    } else {
      improvised.push(player.id);
    }
  });

  const hasGoalkeeper = starters.some((player) => (player.adaptedPosition || player.position) === 'GOL');
  const isComplete = starterCount === LINEUP_SIZE
    && uniqueStarterCount === LINEUP_SIZE
    && duplicateStarterIds.length === 0
    && invalidStarters.length === 0;
  const isValid = formationValid && isComplete && hasGoalkeeper;
  const avgStrength = starters.length
    ? Math.round(starters.reduce((sum, player) => {
        const penalty = FatigueEngine.getOverallPenalty(player.energy ?? 100) || 0;
        const baseOverall = Math.max(30, (Number(player.overall) || 0) - penalty);
        if (improvised.includes(player.id)) return sum + Math.round(baseOverall * 0.80);
        if (adapted.includes(player.id)) return sum + Math.max(30, baseOverall - 10);
        return sum + baseOverall;
      }, 0) / starters.length)
    : 0;

  return {
    isValid,
    isComplete,
    avgStrength,
    counts,
    req,
    improvised,
    adapted,
    starters,
    starterCount,
    uniqueStarterCount,
    missingStarters,
    extraStarters,
    duplicateStarterIds,
    invalidStarters,
    formation,
    formationValid,
    hasGoalkeeper,
  };
};

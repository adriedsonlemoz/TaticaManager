import { FatigueEngine } from '../engine_fatigue.js';

// Fonte única das formações e compatibilidades de posição.
// Módulo puro de domínio: não depende de React nem de componentes.
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

export const getLineupValidation = (gameData) => {
  if (!gameData) return { isValid:false, avgStrength:0, counts:{}, req:{}, improvised:[], adapted:[] };

  const starters = (gameData.players || []).filter((player) => player.isStarting);
  const counts = starters.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {});
  const formation = gameData.club?.formation || '4-4-2';
  const req = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
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

  const isValid = starters.length === 11 && (counts.GOL || 0) >= 1;
  const avgStrength = starters.length
    ? Math.round(starters.reduce((sum, player) => {
        const penalty = FatigueEngine.getOverallPenalty(player.energy ?? 100) || 0;
        const baseOverall = Math.max(30, player.overall - penalty);
        if (improvised.includes(player.id)) return sum + Math.round(baseOverall * 0.80);
        if (adapted.includes(player.id)) return sum + Math.max(30, baseOverall - 10);
        return sum + baseOverall;
      }, 0) / starters.length)
    : 0;

  return { isValid, avgStrength, counts, req, improvised, adapted };
};

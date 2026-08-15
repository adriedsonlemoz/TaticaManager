export const COPA_PRIZES = {
  '2ª Fase': 418000,
  '3ª Fase': 730000,
  Oitavas: 1300000,
  Quartas: 2100000,
  Semifinal: 3700000,
  Final: 7400000,
  Campeão: 73400000,
};

export const COPA_PHASES_A = ['3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
export const COPA_PHASES_B = ['2ª Fase', '3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
export const COPA_PHASES_C = ['1ª Fase', '2ª Fase', '3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
export const COPA_PHASES_D = ['1ª Fase', '2ª Fase', '3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];

// Fonte única para posicionamento das copas no calendário. Os valores indicam
// depois de qual rodada da liga o slot deve ser inserido.
export const COPA_CALENDAR_POSITIONS = {
  A: {
    '3ª Fase': { leg1: 4, leg2: 7 },
    Oitavas: { leg1: 11, leg2: 14 },
    Quartas: { leg1: 18, leg2: 21 },
    Semifinal: { leg1: 25, leg2: 28 },
    Final: { leg1: 33, leg2: 36 },
  },
  B: {
    '2ª Fase': { leg1: 2, leg2: 5 },
    '3ª Fase': { leg1: 8, leg2: 12 },
    Oitavas: { leg1: 15, leg2: 19 },
    Quartas: { leg1: 22, leg2: 26 },
    Semifinal: { leg1: 30, leg2: 34 },
    Final: { leg1: 37, leg2: 39 },
  },
  C: {
    '1ª Fase': { leg1: 2, leg2: 5 },
    '2ª Fase': { leg1: 8, leg2: 12 },
    '3ª Fase': { leg1: 15, leg2: 19 },
    Oitavas: { leg1: 22, leg2: 26 },
    Quartas: { leg1: 30, leg2: 34 },
    Semifinal: { leg1: 37, leg2: 39 },
    Final: { leg1: 41, leg2: 43 },
  },
  D: {
    '1ª Fase': { leg1: 1, leg2: 3 },
    '2ª Fase': { leg1: 6, leg2: 9 },
    '3ª Fase': { leg1: 12, leg2: 16 },
    Oitavas: { leg1: 19, leg2: 23 },
    Quartas: { leg1: 26, leg2: 30 },
    Semifinal: { leg1: 33, leg2: 36 },
    Final: { leg1: 39, leg2: 41 },
  },
};

export const LIBERTA_PRIZES = {
  group: 2000000,
  Oitavas: 3000000,
  Quartas: 5000000,
  Semifinal: 8000000,
  Final: 15000000,
  Campeão: 40000000,
};

export const SULAM_PRIZES = {
  group: 800000,
  Oitavas: 1500000,
  Quartas: 2500000,
  Semifinal: 4000000,
  Final: 7000000,
  Campeão: 18000000,
};

export const LIBERTA_CALENDAR_POSITIONS = {
  'Grupos 1': { leg1: 2, leg2: 6 },
  'Grupos 2': { leg1: 9, leg2: 13 },
  'Grupos 3': { leg1: 16, leg2: 20 },
  Oitavas: { leg1: 23, leg2: 26 },
  Quartas: { leg1: 29, leg2: 32 },
  Semifinal: { leg1: 34, leg2: 37 },
  Final: { leg1: 40, leg2: null },
};

export const SULAM_CALENDAR_POSITIONS = {
  'Grupos 1': { leg1: 3, leg2: 8 },
  'Grupos 2': { leg1: 10, leg2: 15 },
  'Grupos 3': { leg1: 17, leg2: 22 },
  Oitavas: { leg1: 24, leg2: 27 },
  Quartas: { leg1: 30, leg2: 35 },
  Semifinal: { leg1: 38, leg2: 42 },
  Final: { leg1: 44, leg2: null },
};

const toSchedule = (positions) => Object.fromEntries(
  Object.entries(positions).map(([phase, rounds]) => [
    phase,
    rounds.leg2 == null ? [rounds.leg1] : [rounds.leg1, rounds.leg2],
  ])
);

export const COPA_SCHEDULE_A = toSchedule(COPA_CALENDAR_POSITIONS.A);
export const COPA_SCHEDULE_B = toSchedule(COPA_CALENDAR_POSITIONS.B);
export const COPA_SCHEDULE_C = toSchedule(COPA_CALENDAR_POSITIONS.C);
export const COPA_SCHEDULE_D = toSchedule(COPA_CALENDAR_POSITIONS.D);
export const LIBERTA_SCHEDULE = toSchedule(LIBERTA_CALENDAR_POSITIONS);
export const SULAM_SCHEDULE = toSchedule(SULAM_CALENDAR_POSITIONS);

export const CONTINENTAL_CONFIG = {
  libertadores: {
    label: '🌟 Libertadores',
    prizes: LIBERTA_PRIZES,
    schedule: LIBERTA_SCHEDULE,
    positions: LIBERTA_CALENDAR_POSITIONS,
  },
  sulAmericana: {
    label: '🌎 Sul-Americana',
    prizes: SULAM_PRIZES,
    schedule: SULAM_SCHEDULE,
    positions: SULAM_CALENDAR_POSITIONS,
  },
};

export const getCopaConfigForSerie = (serie = 'A') => {
  const normalized = ['A', 'B', 'C', 'D'].includes(serie) ? serie : 'A';
  return {
    phases: normalized === 'A' ? COPA_PHASES_A
      : normalized === 'B' ? COPA_PHASES_B
      : normalized === 'C' ? COPA_PHASES_C
      : COPA_PHASES_D,
    schedule: normalized === 'A' ? COPA_SCHEDULE_A
      : normalized === 'B' ? COPA_SCHEDULE_B
      : normalized === 'C' ? COPA_SCHEDULE_C
      : COPA_SCHEDULE_D,
    positions: COPA_CALENDAR_POSITIONS[normalized],
  };
};

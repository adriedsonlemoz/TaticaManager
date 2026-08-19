export const COPA_PRIZES = {
  '1ª Fase': 400000,
  '2ª Fase': 830000,
  '3ª Fase': 950000,
  '4ª Fase': 1070000,
  '5ª Fase': 2000000,
  Oitavas: 3000000,
  Quartas: 4000000,
  Semifinal: 9000000,
  Final: 34000000,
  Campeão: 78000000,
};

// Cotas 2026: Série B possui valores próprios nas fases 2–4. Da 5ª fase em
// diante, os valores são comuns a todos os participantes. O motor atribui a
// cota da fase disputada independentemente do resultado e, na final, usa
// "Final" para o vice e "Campeão" para o vencedor.
export const COPA_PRIZES_BY_SERIE = Object.freeze({
  A: Object.freeze({ ...COPA_PRIZES }),
  B: Object.freeze({
    ...COPA_PRIZES,
    '2ª Fase': 1380000,
    '3ª Fase': 1530000,
    '4ª Fase': 1680000,
  }),
  C: Object.freeze({ ...COPA_PRIZES }),
  D: Object.freeze({ ...COPA_PRIZES }),
});

export const getCopaPhasePrize = (serie = 'A', phase = '') => (
  COPA_PRIZES_BY_SERIE[String(serie || 'A').toUpperCase()]?.[phase]
  ?? COPA_PRIZES[phase]
  ?? 0
);

export const COPA_PHASES_A = ['5ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
// A elegibilidade completa das 102 vagas estaduais ainda não é modelada pelo
// jogo. Para clubes B/C/D, preservamos a entrada simplificada já existente,
// mas o caminho de fases e a quantidade de pernas seguem o formato 2026.
export const COPA_PHASES_B = ['2ª Fase', '3ª Fase', '4ª Fase', '5ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
export const COPA_PHASES_C = ['1ª Fase', '2ª Fase', '3ª Fase', '4ª Fase', '5ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
export const COPA_PHASES_D = ['1ª Fase', '2ª Fase', '3ª Fase', '4ª Fase', '5ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];

// Sequência lógica legada usada por consumidores antigos. Desde o calendário
// civil anual, estes números NÃO significam mais "rodada da Liga"; são apenas
// índices estáveis dos compromissos da Copa do Brasil para compatibilidade.
export const COPA_CALENDAR_POSITIONS = {
  A: {
    '5ª Fase': { leg1: 1, leg2: 2 },
    Oitavas: { leg1: 3, leg2: 4 },
    Quartas: { leg1: 5, leg2: 6 },
    Semifinal: { leg1: 7, leg2: 8 },
    Final: { leg1: 9, leg2: null },
  },
  B: {
    '2ª Fase': { leg1: 1, leg2: 2 },
    '3ª Fase': { leg1: 3, leg2: null },
    '4ª Fase': { leg1: 4, leg2: null },
    '5ª Fase': { leg1: 5, leg2: 6 },
    Oitavas: { leg1: 7, leg2: 8 },
    Quartas: { leg1: 9, leg2: 10 },
    Semifinal: { leg1: 11, leg2: 12 },
    Final: { leg1: 13, leg2: null },
  },
  C: {
    '1ª Fase': { leg1: 1, leg2: null },
    '2ª Fase': { leg1: 2, leg2: 3 },
    '3ª Fase': { leg1: 4, leg2: null },
    '4ª Fase': { leg1: 5, leg2: null },
    '5ª Fase': { leg1: 6, leg2: 7 },
    Oitavas: { leg1: 8, leg2: 9 },
    Quartas: { leg1: 10, leg2: 11 },
    Semifinal: { leg1: 12, leg2: 13 },
    Final: { leg1: 14, leg2: null },
  },
  D: {
    '1ª Fase': { leg1: 1, leg2: null },
    '2ª Fase': { leg1: 2, leg2: 3 },
    '3ª Fase': { leg1: 4, leg2: null },
    '4ª Fase': { leg1: 5, leg2: null },
    '5ª Fase': { leg1: 6, leg2: 7 },
    Oitavas: { leg1: 8, leg2: 9 },
    Quartas: { leg1: 10, leg2: 11 },
    Semifinal: { leg1: 12, leg2: 13 },
    Final: { leg1: 14, leg2: null },
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

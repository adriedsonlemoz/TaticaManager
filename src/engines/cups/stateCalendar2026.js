// Datas-base dos campeonatos estaduais já implementados.
//
// 2026 usa janelas e datas de rodada/fase próprias de cada federação, em vez
// de interpolar todos os estaduais entre 11/01 e 08/03. Como uma rodada pode
// ter partidas em mais de um dia, o jogo usa uma data-base por rodada/fase;
// o CalendarEngine ainda pode deslocar a partida do usuário quando houver
// choque real com outra competição, preservando o descanso mínimo global.

const freezeDates = (dates = []) => Object.freeze([...dates]);
const freezeKnockout = (knockout = {}) => Object.freeze(Object.fromEntries(
  Object.entries(knockout).map(([phase, dates]) => [phase, freezeDates(dates)]),
));

const calendar = ({ label, firstStage, knockout, sourceLabel }) => Object.freeze({
  label,
  sourceLabel,
  firstStage:freezeDates(firstStage),
  knockout:freezeKnockout(knockout),
  start:firstStage[0],
  end:Object.values(knockout).flat().at(-1) || firstStage.at(-1),
  official:true,
});

// Datas-base de 2026. Nos mata-matas em que a federação distribui partidas
// pelo fim de semana, usamos o dia-base da janela da fase. O agendador pode
// mover o jogo do clube dentro da janela quando necessário.
export const STATE_2026_CALENDARS = Object.freeze({
  carioca:calendar({
    label:'Campeonato Carioca', sourceLabel:'FERJ — Estadual 2026',
    firstStage:['2026-01-14','2026-01-18','2026-01-21','2026-01-25','2026-02-01','2026-02-08'],
    knockout:{ Quartas:['2026-02-14'], Semifinal:['2026-02-22','2026-03-01'], Final:['2026-03-08'] },
  }),
  gauchao:calendar({
    label:'Campeonato Gaúcho', sourceLabel:'FGF-RS — Gauchão 2026',
    firstStage:['2026-01-10','2026-01-14','2026-01-17','2026-01-21','2026-01-24','2026-01-31'],
    knockout:{ Quartas:['2026-02-06'], Semifinal:['2026-02-14','2026-02-21'], Final:['2026-03-01','2026-03-08'] },
  }),
  paulista:calendar({
    label:'Campeonato Paulista', sourceLabel:'FPF — Paulistão 2026',
    firstStage:['2026-01-11','2026-01-14','2026-01-18','2026-01-21','2026-01-25','2026-02-01','2026-02-08','2026-02-15'],
    knockout:{ Quartas:['2026-02-22'], Semifinal:['2026-03-01'], Final:['2026-03-08'] },
  }),
  mineiro:calendar({
    label:'Campeonato Mineiro', sourceLabel:'FMF — Mineiro 2026',
    firstStage:['2026-01-10','2026-01-14','2026-01-17','2026-01-21','2026-01-24','2026-01-31','2026-02-07','2026-02-14'],
    knockout:{ Semifinal:['2026-02-21','2026-02-28'], Final:['2026-03-08'] },
  }),
  paranaense:calendar({
    label:'Campeonato Paranaense', sourceLabel:'FPF-PR — Paranaense 2026',
    firstStage:['2026-01-07','2026-01-11','2026-01-14','2026-01-18','2026-01-21','2026-01-25'],
    knockout:{ Quartas:['2026-02-01','2026-02-08'], Semifinal:['2026-02-15','2026-02-22'], Final:['2026-03-01','2026-03-07'] },
  }),
  catarinense:calendar({
    label:'Campeonato Catarinense', sourceLabel:'FCF — Catarinense 2026',
    firstStage:['2026-01-07','2026-01-11','2026-01-14','2026-01-18','2026-01-21','2026-01-25'],
    knockout:{ Quartas:['2026-02-01','2026-02-08'], Semifinal:['2026-02-15','2026-02-22'], Final:['2026-03-01','2026-03-08'] },
  }),
  baiano:calendar({
    label:'Campeonato Baiano', sourceLabel:'FBF — Baianão 2026',
    firstStage:['2026-01-10','2026-01-13','2026-01-17','2026-01-20','2026-01-25','2026-02-01','2026-02-07','2026-02-11','2026-02-21'],
    knockout:{ Semifinal:['2026-02-28'], Final:['2026-03-07'] },
  }),
  pernambucano:calendar({
    label:'Campeonato Pernambucano', sourceLabel:'FPF-PE — Pernambucano A1 2026',
    firstStage:['2026-01-09','2026-01-13','2026-01-17','2026-01-21','2026-01-24','2026-01-28','2026-01-31'],
    knockout:{ Playoff:['2026-02-04','2026-02-07'], Semifinal:['2026-02-11','2026-02-21'], Final:['2026-03-01','2026-03-08'] },
  }),
  goiano:calendar({
    label:'Campeonato Goiano', sourceLabel:'FGF-GO — Goianão 2026',
    firstStage:['2026-01-10','2026-01-14','2026-01-18','2026-01-21','2026-01-25','2026-01-28','2026-02-01','2026-02-08'],
    knockout:{ Quartas:['2026-02-15','2026-02-22'], Semifinal:['2026-02-28','2026-03-08'], Final:['2026-03-11','2026-03-15'] },
  }),
  paraense:calendar({
    label:'Campeonato Paraense', sourceLabel:'FPF-PA — Parazão 2026',
    firstStage:['2026-01-24','2026-01-31','2026-02-04','2026-02-07','2026-02-11','2026-02-15'],
    knockout:{ Quartas:['2026-02-18'], Semifinal:['2026-02-22'], Final:['2026-03-01','2026-03-08'] },
  }),
  paraibano:calendar({
    label:'Campeonato Paraibano', sourceLabel:'FPF-PB — Paraibano 2026',
    firstStage:['2026-01-17','2026-01-21','2026-01-24','2026-01-28','2026-01-31','2026-02-04','2026-02-08','2026-02-09','2026-02-21'],
    knockout:{ Semifinal:['2026-02-28','2026-03-07'], Final:['2026-03-15','2026-03-21'] },
  }),
  alagoano:calendar({
    label:'Campeonato Alagoano', sourceLabel:'FAF — Alagoano Série A 2026',
    firstStage:['2026-01-10','2026-01-14','2026-01-17','2026-01-21','2026-01-24','2026-01-31','2026-02-07'],
    knockout:{ Semifinal:['2026-02-14','2026-02-21'], Final:['2026-02-28','2026-03-07'] },
  }),
  potiguar:calendar({
    label:'Campeonato Potiguar', sourceLabel:'FNF — Potiguar 2026',
    firstStage:['2026-01-10','2026-01-14','2026-01-17','2026-01-24','2026-01-31','2026-02-04','2026-02-07'],
    knockout:{ Playoff:['2026-02-28','2026-03-04'], Semifinal:['2026-03-07','2026-03-14'], Final:['2026-03-18','2026-03-21'] },
  }),
  sergipano:calendar({
    label:'Campeonato Sergipano', sourceLabel:'FSF — Sergipão A1 2026',
    firstStage:['2026-01-10','2026-01-16','2026-01-21','2026-01-24','2026-01-31','2026-02-03','2026-02-07','2026-02-10','2026-02-14'],
    knockout:{ Playoff:['2026-02-20'], Semifinal:['2026-02-25','2026-02-28'], Final:['2026-03-07','2026-03-14'] },
  }),
});

const normalizeSeason = (season) => Math.max(2026, Number(season) || 2026);
const copyDateToSeason = (dateISO, season) => {
  const targetYear = normalizeSeason(season);
  return String(dateISO || '').replace(/^2026-/, `${targetYear}-`);
};

export function getStateCalendarPlan(competitionKey, { season = 2026 } = {}) {
  const base = STATE_2026_CALENDARS[competitionKey];
  if (!base) return null;
  const targetYear = normalizeSeason(season);
  return {
    ...base,
    firstStage:base.firstStage.map((date) => copyDateToSeason(date, targetYear)),
    knockout:Object.fromEntries(Object.entries(base.knockout).map(([phase, dates]) => [
      phase,
      dates.map((date) => copyDateToSeason(date, targetYear)),
    ])),
    start:copyDateToSeason(base.start, targetYear),
    end:copyDateToSeason(base.end, targetYear),
    official:targetYear === 2026,
  };
}

export function getStateCompetitionWindow(competitionKey, { season = 2026 } = {}) {
  const plan = getStateCalendarPlan(competitionKey, { season });
  return plan ? {
    start:plan.start,
    end:plan.end,
    label:plan.label,
    official:plan.official,
    sourceLabel:plan.sourceLabel,
    stateCalendar:true,
  } : null;
}

export function getStateCalendarEnvelope({ season = 2026 } = {}) {
  const plans = Object.keys(STATE_2026_CALENDARS)
    .map((key) => getStateCompetitionWindow(key, { season }))
    .filter(Boolean);
  if (!plans.length) return null;
  return {
    start:plans.map((plan) => plan.start).sort()[0],
    end:plans.map((plan) => plan.end).sort().at(-1),
    label:'Campeonatos Estaduais',
    official:normalizeSeason(season) === 2026,
    stateCalendarEnvelope:true,
  };
}

export function buildStateCompetitionTargetDates(events = [], competitionKey, { season = 2026 } = {}) {
  const list = Array.isArray(events) ? events : [];
  const plan = getStateCalendarPlan(competitionKey, { season });
  if (!plan || !list.length) return null;

  const phaseOccurrences = Object.create(null);
  return list.map((event, index) => {
    if (event?.isGroup || Number.isInteger(event?.stateRound)) {
      const roundIndex = Number.isInteger(event?.stateRound) ? event.stateRound : index;
      return plan.firstStage[roundIndex] || null;
    }
    const phase = event?.phase;
    if (!phase || !plan.knockout[phase]) return null;
    const occurrence = phaseOccurrences[phase] || 0;
    phaseOccurrences[phase] = occurrence + 1;
    return plan.knockout[phase][occurrence] || null;
  });
}

export function validateStateCalendarAgainstEvents(events = [], competitionKey, { season = 2026 } = {}) {
  const targets = buildStateCompetitionTargetDates(events, competitionKey, { season });
  if (!targets) return { valid:false, missing:['calendário ausente'] };
  const missing = targets.flatMap((date, index) => date ? [] : [`evento ${index + 1}`]);
  return { valid:missing.length === 0, missing, targets };
}

export default {
  STATE_2026_CALENDARS,
  getStateCalendarPlan,
  getStateCompetitionWindow,
  getStateCalendarEnvelope,
  buildStateCompetitionTargetDates,
  validateStateCalendarAgainstEvents,
};

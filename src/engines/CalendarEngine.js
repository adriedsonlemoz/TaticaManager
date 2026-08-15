// @migrated to ES module
// engines/CalendarEngine.js — v1.0
// FILOSOFIA: cada slot do calendário tem exatamente 1 jogo — liga OU copa, nunca os dois.
// Nenhum time joga dois dias seguidos (dois slots consecutivos nunca são ambos jogos do usuário).
// Os slots de copa são distribuídos entre rodadas de liga de forma que nunca haja colisão.
//
// ESTRUTURA DO CALENDÁRIO:
//   gameData.calendar = [
//     { type: 'league', leagueIdx: 0 },   // fixtures[0]
//     { type: 'league', leagueIdx: 1 },   // fixtures[1]
//     { type: 'cup', cupKey:'copaBrasil', phase:'3ª Fase', leg:'leg1' },
//     { type: 'league', leagueIdx: 2 },   // fixtures[2]
//     ...
//   ]
//   gameData.round   = índice no calendário (0-based)
//   gameData.leagueRound = quantas rodadas de LIGA já foram jogadas
//
// POSIÇÕES DE COPA (afterLeague = inserir APÓS esta rodada de liga ter sido jogada)
// Verificado: sem colisão entre Copa × Liberta × SulAm para time na Série A.

// ── Copa do Brasil por série ──────────────────────────────────────────────────
const COPA_POSITIONS = {
  A: {
    '3ª Fase':   { leg1: 4,  leg2: 7  },
    'Oitavas':   { leg1: 11, leg2: 14 },
    'Quartas':   { leg1: 18, leg2: 21 },
    'Semifinal': { leg1: 25, leg2: 28 },
    'Final':     { leg1: 33, leg2: 36 },
  },
  B: {
    '2ª Fase':   { leg1: 2,  leg2: 5  },
    '3ª Fase':   { leg1: 8,  leg2: 12 },
    'Oitavas':   { leg1: 15, leg2: 19 },
    'Quartas':   { leg1: 22, leg2: 26 },
    'Semifinal': { leg1: 30, leg2: 34 },
    'Final':     { leg1: 37, leg2: 39 },
  },
  C: {
    '1ª Fase':   { leg1: 2,  leg2: 5  },
    '2ª Fase':   { leg1: 8,  leg2: 12 },
    '3ª Fase':   { leg1: 15, leg2: 19 },
    'Oitavas':   { leg1: 22, leg2: 26 },
    'Quartas':   { leg1: 30, leg2: 34 },
    'Semifinal': { leg1: 37, leg2: 39 },
    'Final':     { leg1: 41, leg2: 43 },
  },
  D: {
    '1ª Fase':   { leg1: 1,  leg2: 3  },
    '2ª Fase':   { leg1: 6,  leg2: 9  },
    '3ª Fase':   { leg1: 12, leg2: 16 },
    'Oitavas':   { leg1: 19, leg2: 23 },
    'Quartas':   { leg1: 26, leg2: 30 },
    'Semifinal': { leg1: 33, leg2: 36 },
    'Final':     { leg1: 39, leg2: 41 },
  },
};

// ── Libertadores (grupos + mata-mata) ─────────────────────────────────────────
// afterLeague: nunca coincide com Copa A nem SulAm
const LIBERTA_POSITIONS = {
  'Grupos 1':  { leg1: 2,  leg2: 6  },
  'Grupos 2':  { leg1: 9,  leg2: 13 },
  'Grupos 3':  { leg1: 16, leg2: 20 },
  'Oitavas':   { leg1: 23, leg2: 26 },
  'Quartas':   { leg1: 29, leg2: 32 },
  'Semifinal': { leg1: 34, leg2: 37 },
  'Final':     { leg1: 40, leg2: null }, // final única pós-liga
};

// ── Sul-Americana (grupos + mata-mata) ────────────────────────────────────────
// afterLeague: nunca coincide com Copa A nem Liberta
const SULAM_POSITIONS = {
  'Grupos 1':  { leg1: 3,  leg2: 8  },
  'Grupos 2':  { leg1: 10, leg2: 15 },
  'Grupos 3':  { leg1: 17, leg2: 22 },
  'Oitavas':   { leg1: 24, leg2: 27 },
  'Quartas':   { leg1: 30, leg2: 35 },
  'Semifinal': { leg1: 38, leg2: 42 },
  'Final':     { leg1: 44, leg2: null },
};

// ── buildCalendar ─────────────────────────────────────────────────────────────
// Regras de espaçamento:
//   • Liga joga Seg/Ter e Sáb/Dom alternando, NUNCA dia consecutivo.
//   • Padrão: Sábado → Terça → Sábado → Terça → ...
//   • Quando liga cai na Terça, copa só pode ser na Quinta (+2 dias).
//   • Copa nunca cai na Terça ou Quinta quando a liga está nessas janelas.
//   • Mínimo de 2 slots de liga entre dois slots de copa.
//
// Na prática para o calendário (apenas sequência de slots):
//   - Slot de copa NUNCA imediatamente após slot de liga.
//   - Entre dois slots de copa deve haver ao menos 1 slot de liga.
//   - Copa é inserida como: liga, liga, copa, liga, liga, copa, ...
//   - Garante gap mínimo de 2 rodadas de liga entre qualquer copa e a próxima.
const buildCalendar = (leagueRounds, cups, serie) => {
  const cupEvents = [];

  // ── Copa do Brasil ──
  if (cups?.copaBrasil?.status === 'active') {
    const copaPos = COPA_POSITIONS[serie] || COPA_POSITIONS.A;
    Object.entries(copaPos).forEach(([phase, pos]) => {
      cupEvents.push({ cupKey: 'copaBrasil', phase, leg: 'leg1', afterLeague: pos.leg1, isGroup: false });
      if (pos.leg2 != null) {
        cupEvents.push({ cupKey: 'copaBrasil', phase, leg: 'leg2', afterLeague: pos.leg2, isGroup: false });
      }
    });
  }

  // ── Libertadores ──
  if (cups?.libertadores?.status === 'active') {
    Object.entries(LIBERTA_POSITIONS).forEach(([phase, pos]) => {
      const isGroup = phase.startsWith('Grupos');
      cupEvents.push({ cupKey: 'libertadores', phase, leg: 'leg1', afterLeague: pos.leg1, isGroup });
      if (pos.leg2 != null) {
        cupEvents.push({ cupKey: 'libertadores', phase, leg: 'leg2', afterLeague: pos.leg2, isGroup });
      }
    });
  }

  // ── Sul-Americana ──
  if (cups?.sulAmericana?.status === 'active') {
    Object.entries(SULAM_POSITIONS).forEach(([phase, pos]) => {
      const isGroup = phase.startsWith('Grupos');
      cupEvents.push({ cupKey: 'sulAmericana', phase, leg: 'leg1', afterLeague: pos.leg1, isGroup });
      if (pos.leg2 != null) {
        cupEvents.push({ cupKey: 'sulAmericana', phase, leg: 'leg2', afterLeague: pos.leg2, isGroup });
      }
    });
  }

  // Ordena por posição desejada
  cupEvents.sort((a, b) => a.afterLeague - b.afterLeague);

  // ── Intercala liga e copa com gap mínimo ──────────────────────────────────
  // Regra: após uma copa, os próximos 2 slots devem ser liga.
  //        Entre dois eventos de copa deve haver ao menos 2 rodadas de liga.
  const calendar = [];
  let leagueIdx  = 0;
  let qi         = 0;
  let leagueSinceLastCup = 2; // garante que a 1ª copa já pode entrar após 2 ligas

  while (leagueIdx < leagueRounds || qi < cupEvents.length) {
    if (leagueIdx < leagueRounds) {
      calendar.push({ type: 'league', leagueIdx });
      leagueIdx++;
      leagueSinceLastCup++;

      // Insere copa SOMENTE se:
      //  1. Há pelo menos 2 rodadas de liga desde a última copa
      //  2. O afterLeague do próximo evento já foi atingido
      //  3. O PRÓXIMO slot do calendário também será liga (não cola duas copas)
      while (
        qi < cupEvents.length &&
        cupEvents[qi].afterLeague <= leagueIdx &&
        leagueSinceLastCup >= 2
      ) {
        calendar.push({ type: 'cup', ...cupEvents[qi] });
        qi++;
        leagueSinceLastCup = 0; // reset: precisa de 2 ligas antes da próxima copa
      }
    } else {
      // Copas pós-liga (finais continentais): garante 1 slot de liga fictício entre elas
      if (leagueSinceLastCup < 2 && leagueIdx < leagueRounds + 2) {
        // Insere uma liga "extra" se necessário para manter o gap
        // (isso não deve acontecer na prática com os schedules atuais)
        leagueIdx++;
        leagueSinceLastCup++;
        continue;
      }
      calendar.push({ type: 'cup', ...cupEvents[qi] });
      qi++;
      leagueSinceLastCup = 0;
    }
  }

  return calendar;
};

// ── getCupMatchForCalendarSlot ────────────────────────────────────────────────
// Verifica se o slot de copa ainda é válido (cup ativa, leg não jogada).
// NOTA: NÃO filtra por nome de fase — a fase do tie pode ter avançado entre
//       a construção do calendário e a execução do slot. O que importa é:
//       1) a cup está ativa
//       2) a leg indicada ainda não foi jogada
//       3) para leg2: o tie da fase anterior está decidido (leg1 jogada)
const getCupMatchForCalendarSlot = (cups, entry) => {
  if (!entry || entry.type !== 'cup') return { hasCupMatch: false };
  const { cupKey, leg, isGroup } = entry;
  const cup = cups?.[cupKey];
  if (!cup || cup.status !== 'active') return { hasCupMatch: false };

  // ── Copa do Brasil ──
  if (cupKey === 'copaBrasil') {
    const tie = cup.currentTie;
    if (!tie) return { hasCupMatch: false };
    // Verifica apenas a leg — sem checar nome da fase (pode ter avançado)
    if (leg === 'leg1') {
      if (tie.leg1.played) return { hasCupMatch: false };
      return { hasCupMatch: true, cupKey, cup, tie, leg, label: '🏆 Copa do Brasil', isCopa: true };
    }
    if (leg === 'leg2') {
      if (!tie.leg1.played)      return { hasCupMatch: false }; // ida ainda não jogada
      if (!tie.leg2)             return { hasCupMatch: false }; // jogo único
      if (tie.leg2.played)       return { hasCupMatch: false };
      return { hasCupMatch: true, cupKey, cup, tie, leg, label: '🏆 Copa do Brasil', isCopa: true };
    }
    return { hasCupMatch: false };
  }

  // ── Libertadores / Sul-Americana ──
  const label  = cupKey === 'libertadores' ? '🌟 Libertadores' : '🌎 Sul-Americana';
  const prizes = cupKey === 'libertadores'
    ? { group:2000000, 'Oitavas':3000000, 'Quartas':5000000, 'Semifinal':8000000, 'Final':15000000, 'Campeão':40000000 }
    : { group:800000,  'Oitavas':1500000, 'Quartas':2500000, 'Semifinal':4000000, 'Final':7000000,  'Campeão':18000000 };

  if (isGroup) {
    if (cup.phase !== 'group') return { hasCupMatch: false };
    // Encontra a partida de grupo com a leg não jogada
    const gm = (cup.groupMatches || []).find(g =>
      leg === 'leg1' ? !g.leg1.played : !g.leg2.played
    );
    if (!gm) return { hasCupMatch: false };
    return { hasCupMatch: true, cupKey, cup, tie: gm, leg, label, isGroup: true, matchId: gm.id, prizeMap: prizes };
  }

  // Mata-mata: não bloqueia por fase, só verifica a leg
  if (cup.phase === 'group') return { hasCupMatch: false }; // ainda em grupos
  const tie = cup.knockoutTie || cup.currentTie;
  if (!tie) return { hasCupMatch: false };
  if (leg === 'leg1') {
    if (tie.leg1.played) return { hasCupMatch: false };
    return { hasCupMatch: true, cupKey, cup, tie, leg, label, prizeMap: prizes };
  }
  if (leg === 'leg2') {
    if (!tie.leg1.played)   return { hasCupMatch: false };
    if (!tie.leg2)          return { hasCupMatch: false };
    if (tie.leg2.played)    return { hasCupMatch: false };
    return { hasCupMatch: true, cupKey, cup, tie, leg, label, prizeMap: prizes };
  }
  return { hasCupMatch: false };
};

// ── getCalendarSummary ────────────────────────────────────────────────────────
// Retorna lista de próximos eventos do calendário a partir da rodada atual.
const getCalendarSummary = (calendar, currentRound, cups, limit = 5) => {
  if (!calendar) return [];
  const upcoming = [];
  for (let i = currentRound; i < calendar.length && upcoming.length < limit; i++) {
    const entry = calendar[i];
    if (entry.type === 'league') {
      upcoming.push({ slotIdx: i, type: 'league', label: 'Campeonato' });
    } else {
      const info = getCupMatchForCalendarSlot(cups, entry);
      if (info.hasCupMatch) {
        upcoming.push({ slotIdx: i, type: 'cup', label: info.label, phase: entry.phase, leg: entry.leg });
      }
    }
  }
  return upcoming;
};

export const CalendarEngine = {
  buildCalendar,
  getCupMatchForCalendarSlot,
  getCalendarSummary,
  COPA_POSITIONS, LIBERTA_POSITIONS, SULAM_POSITIONS,
};
export default CalendarEngine;

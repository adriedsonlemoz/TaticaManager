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

import {
  COPA_CALENDAR_POSITIONS,
  LIBERTA_CALENDAR_POSITIONS,
  SULAM_CALENDAR_POSITIONS,
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cups/cupConfig.js';

// Aliases públicos preservados para compatibilidade com módulos antigos.
const COPA_POSITIONS = COPA_CALENDAR_POSITIONS;
const LIBERTA_POSITIONS = LIBERTA_CALENDAR_POSITIONS;
const SULAM_POSITIONS = SULAM_CALENDAR_POSITIONS;

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
    const copaPos = COPA_CALENDAR_POSITIONS[serie] || COPA_CALENDAR_POSITIONS.A;
    Object.entries(copaPos).forEach(([phase, pos]) => {
      cupEvents.push({ cupKey: 'copaBrasil', phase, leg: 'leg1', afterLeague: pos.leg1, isGroup: false });
      if (pos.leg2 != null) {
        cupEvents.push({ cupKey: 'copaBrasil', phase, leg: 'leg2', afterLeague: pos.leg2, isGroup: false });
      }
    });
  }

  // ── Libertadores ──
  if (cups?.libertadores?.status === 'active') {
    Object.entries(LIBERTA_CALENDAR_POSITIONS).forEach(([phase, pos]) => {
      const isGroup = phase.startsWith('Grupos');
      cupEvents.push({ cupKey: 'libertadores', phase, leg: 'leg1', afterLeague: pos.leg1, isGroup });
      if (pos.leg2 != null) {
        cupEvents.push({ cupKey: 'libertadores', phase, leg: 'leg2', afterLeague: pos.leg2, isGroup });
      }
    });
  }

  // ── Sul-Americana ──
  if (cups?.sulAmericana?.status === 'active') {
    Object.entries(SULAM_CALENDAR_POSITIONS).forEach(([phase, pos]) => {
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
  const prizes = cupKey === 'libertadores' ? LIBERTA_PRIZES : SULAM_PRIZES;
  const scheduleMap = cupKey === 'libertadores' ? LIBERTA_SCHEDULE : SULAM_SCHEDULE;

  if (isGroup) {
    if (cup.phase !== 'group') return { hasCupMatch: false };
    // O calendário já identifica a fase do grupo; usa essa informação para
    // não associar um slot ao adversário errado em saves antigos.
    const gm = (cup.groupMatches || []).find((groupMatch) => {
      if (entry.phase && groupMatch.phase !== entry.phase) return false;
      if (leg === 'leg1') return !groupMatch.leg1?.played;
      return Boolean(groupMatch.leg2 && !groupMatch.leg2.played);
    });
    if (!gm) return { hasCupMatch: false };
    return {
      hasCupMatch: true, cupKey, cup, tie: gm, leg, label,
      isGroup: true, matchId: gm.id, prizeMap: prizes, scheduleMap,
    };
  }

  // Mata-mata: não bloqueia por fase, só verifica a leg
  if (cup.phase === 'group') return { hasCupMatch: false }; // ainda em grupos
  const tie = cup.knockoutTie || cup.currentTie;
  if (!tie) return { hasCupMatch: false };
  if (leg === 'leg1') {
    if (tie.leg1.played) return { hasCupMatch: false };
    return { hasCupMatch: true, cupKey, cup, tie, leg, label, prizeMap: prizes, scheduleMap };
  }
  if (leg === 'leg2') {
    if (!tie.leg1.played)   return { hasCupMatch: false };
    if (!tie.leg2)          return { hasCupMatch: false };
    if (tie.leg2.played)    return { hasCupMatch: false };
    return { hasCupMatch: true, cupKey, cup, tie, leg, label, prizeMap: prizes, scheduleMap };
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

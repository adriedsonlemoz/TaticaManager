// @migrated to ES module
// engines/CalendarEngine.js — agenda lógica Liga/Copas.
// A sequência de slots continua representando qual competição vem a seguir;
// a data civil real é atribuída por calendarDateEngine.js após a montagem.
// Desde a beta 54, a integridade temporal é medida por dateISO: cada compromisso
// do usuário respeita o intervalo mínimo canônico, independentemente de slots adjacentes.

import {
  COPA_CALENDAR_POSITIONS,
  LIBERTA_CALENDAR_POSITIONS,
  SULAM_CALENDAR_POSITIONS,
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cups/cupConfig.js';
import { attachCanonicalDates, validateCalendarSpacing } from './calendar/calendarDateEngine.js';
import { buildAnnualCalendarTargets } from './calendar/seasonCalendar.js';
import { getRegionalMatchForCalendarSlot } from './cups/regionalEngine.js';
import { getStateMatchForCalendarSlot } from './cups/stateEngine.js';

// Aliases públicos preservados para compatibilidade com módulos antigos.
const COPA_POSITIONS = COPA_CALENDAR_POSITIONS;
const LIBERTA_POSITIONS = LIBERTA_CALENDAR_POSITIONS;
const SULAM_POSITIONS = SULAM_CALENDAR_POSITIONS;

// ── buildCalendar ─────────────────────────────────────────────────────────────
// Intercala os slots lógicos de Liga e Copas. A sequência não representa dias.
// Depois de montada, as janelas anuais distribuem os compromissos ao longo do ano e
// attachCanonicalDates() garante o intervalo mínimo sem empilhar partidas em dias seguidos.
const buildCalendar = (leagueRounds, cups, serie, options = {}) => {
  const cupEvents = [];

  if (cups?.copaBrasil?.status === 'active') {
    const copaPos = COPA_CALENDAR_POSITIONS[serie] || COPA_CALENDAR_POSITIONS.A;
    Object.entries(copaPos).forEach(([phase, pos]) => {
      cupEvents.push({ cupKey:'copaBrasil', phase, leg:'leg1', afterLeague:pos.leg1, isGroup:false });
      if (pos.leg2 != null) cupEvents.push({ cupKey:'copaBrasil', phase, leg:'leg2', afterLeague:pos.leg2, isGroup:false });
    });
  }

  if (cups?.libertadores?.status === 'active') {
    Object.entries(LIBERTA_CALENDAR_POSITIONS).forEach(([phase, pos]) => {
      const isGroup = phase.startsWith('Grupos');
      cupEvents.push({ cupKey:'libertadores', phase, leg:'leg1', afterLeague:pos.leg1, isGroup });
      if (pos.leg2 != null) cupEvents.push({ cupKey:'libertadores', phase, leg:'leg2', afterLeague:pos.leg2, isGroup });
    });
  }

  if (cups?.sulAmericana?.status === 'active') {
    Object.entries(SULAM_CALENDAR_POSITIONS).forEach(([phase, pos]) => {
      const isGroup = phase.startsWith('Grupos');
      cupEvents.push({ cupKey:'sulAmericana', phase, leg:'leg1', afterLeague:pos.leg1, isGroup });
      if (pos.leg2 != null) cupEvents.push({ cupKey:'sulAmericana', phase, leg:'leg2', afterLeague:pos.leg2, isGroup });
    });
  }

  // Competições regionais publicam seu próprio plano máximo de dez datas.
  // O plano é independente de rodadas da Liga; se o usuário for eliminado,
  // os slots futuros simplesmente se tornam inativos quando a data chegar.
  if (cups?.regional?.status === 'active' && Array.isArray(cups.regional.calendarEvents)) {
    cups.regional.calendarEvents.forEach((event) => cupEvents.push({
      cupKey:cups.regional.competitionKey,
      ...event,
    }));
  }

  // Estaduais implementados publicam sua própria sequência dentro da janela
  // janeiro–março. O restante da agenda usa a mesma data civil canônica.
  if (cups?.estadual?.status === 'active' && Array.isArray(cups.estadual.calendarEvents)) {
    cups.estadual.calendarEvents.forEach((event) => cupEvents.push({
      cupKey:cups.estadual.competitionKey,
      ...event,
    }));
  }

  // Beta 55: a ordem deixa de ser "duas rodadas de Liga, depois uma Copa".
  // Cada competição recebe datas-alvo dentro de sua janela anual e todos os
  // compromissos são então mesclados cronologicamente. Isso permite o padrão
  // realista meio-de-semana/fim-de-semana sem empurrar B/C para o ano seguinte.
  const targeted = buildAnnualCalendarTargets({
    leagueRounds,
    cupEvents,
    season:options.season || 2026,
    serie,
  });
  const dated = attachCanonicalDates(targeted, { season:options.season || 2026, serie });
  const spacing = validateCalendarSpacing(dated);
  if (!spacing.ok) throw new Error(`Calendário inválido: ${spacing.errors[0]}`);
  return dated;
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
  const cup = cupKey === cups?.regional?.competitionKey
    ? cups?.regional
    : cupKey === cups?.estadual?.competitionKey
      ? cups?.estadual
      : cups?.[cupKey];
  if (!cup || cup.status !== 'active') return { hasCupMatch: false };

  if (cup.kind === 'regional') return getRegionalMatchForCalendarSlot(cup, entry);
  if (cup.kind === 'state') return getStateMatchForCalendarSlot(cup, entry);

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

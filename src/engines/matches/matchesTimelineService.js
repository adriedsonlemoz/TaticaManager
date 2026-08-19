import { MONTH_NAMES, WEEK_DAYS_SHORT, CUP_META, getCupColor } from './matchesConstants.js';
import { getCupInfoForSlot, getCupTeams } from './cupMatchResolver.js';
import { getCupRoundDate } from './matchesCalendarService.js';
import { fromDateISO } from '../calendar/calendarDateEngine.js';

export function buildUpcomingEvents({ gameData, currentRound, roundDates, limit = 8 }) {
  const events = [];
  const calendar = gameData?.calendar || [];
  const maxScan = Math.max(limit * 3, 10);

  for (let calendarSlot = currentRound; calendarSlot < calendar.length && events.length < maxScan; calendarSlot += 1) {
    const entry = calendar[calendarSlot];
    if (!entry) continue;

    if (entry.type === 'league') {
      const leagueIdx = entry.leagueIdx;
      if (!Number.isInteger(leagueIdx) || leagueIdx >= (gameData.fixtures?.length || 0)) continue;
      const date = fromDateISO(entry.dateISO || entry.calendarDate) || roundDates[leagueIdx];
      if (!date) continue;
      const fixtures = gameData.fixtures?.[leagueIdx] || [];
      const match = fixtures.find(item => item.home?.isPlayer || item.away?.isPlayer);
      if (!match) continue;
      events.push({
        calendarSlot,
        leagueRound: leagueIdx + 1,
        date,
        monthName: MONTH_NAMES[date.getMonth()].substring(0, 3),
        weekDay: WEEK_DAYS_SHORT[(date.getDay() + 6) % 7],
        day: date.getDate(),
        match,
        isCup: false,
      });
      continue;
    }

    if (entry.type !== 'cup') continue;
    const cupInfo = getCupInfoForSlot(gameData.cups, entry);
    if (!cupInfo.hasCupMatch || cupInfo.played) continue;
    const leagueRoundAfter = entry.afterLeague ?? (entry.leagueIdx ?? 0);
    const date = fromDateISO(entry.dateISO || entry.calendarDate) || getCupRoundDate(roundDates, leagueRoundAfter) || roundDates[leagueRoundAfter - 1];
    if (!date) continue;
    const tie = cupInfo.tie;
    events.push({
      calendarSlot,
      leagueRound: leagueRoundAfter,
      date,
      monthName: MONTH_NAMES[date.getMonth()].substring(0, 3),
      weekDay: WEEK_DAYS_SHORT[(date.getDay() + 6) % 7],
      day: date.getDate(),
      isCup: true,
      cupLabel: cupInfo.label,
      cupColor: getCupColor(cupInfo.label),
      legLabel: cupInfo.leg === 'leg1' ? (tie.leg2 ? 'Jogo de Ida' : 'Jogo Único') : 'Jogo de Volta',
      phase: tie.phase,
      match: getCupTeams(cupInfo),
      cupKey: cupInfo.cupKey,
      leg: cupInfo.leg,
      tie,
    });
  }

  return events
    .sort((a, b) => (a.date - b.date) || (a.calendarSlot - b.calendarSlot))
    .slice(0, limit);
}

function pushCupRecentResults(results, cup, cupKey, label, color, roundDates, calendar = []) {
  if (!cup || cup.status === 'inactive') return;

  const canonicalDate = (tie, leg) => {
    const entry = (calendar || []).find((item) => (
      item?.type === 'cup'
      && item?.cupKey === cupKey
      && item?.leg === leg
      && (!tie?.phase || item?.phase === tie.phase)
    ));
    return fromDateISO(entry?.dateISO || entry?.calendarDate);
  };

  const pushTie = tie => {
    if (!tie) return;
    if (tie.leg2?.played) {
      results.push({
        match: {
          home: tie.away,
          away: tie.home,
          result: `${tie.leg2.home}-${tie.leg2.away}`,
          played: true,
          events: tie.leg2.events || tie.events || [],
          penalties: tie.penalties || null,
        },
        round: tie.leg2.round,
        date: canonicalDate(tie, 'leg2') || getCupRoundDate(roundDates, tie.leg2.round),
        isCup: true,
        cupLabel: label,
        cupColor: color,
        legLabel: 'Jogo de Volta',
        phase: tie.phase,
      });
    }
    if (tie.leg1?.played) {
      results.push({
        match: {
          home: tie.home,
          away: tie.away,
          result: `${tie.leg1.home}-${tie.leg1.away}`,
          played: true,
          events: tie.leg1.events || tie.events || [],
        },
        round: tie.leg1.round,
        date: canonicalDate(tie, 'leg1') || getCupRoundDate(roundDates, tie.leg1.round),
        isCup: true,
        cupLabel: label,
        cupColor: color,
        legLabel: tie.leg2 ? 'Jogo de Ida' : 'Jogo Único',
        phase: tie.phase,
      });
    }
  };

  (cup.groupMatches || []).forEach(groupMatch => {
    if (!groupMatch.leg1?.played) return;
    results.push({
      match: {
        home: groupMatch.home,
        away: groupMatch.away,
        result: `${groupMatch.leg1.home}-${groupMatch.leg1.away}`,
        played: true,
        events: groupMatch.leg1.events || groupMatch.events || [],
      },
      round: groupMatch.leg1.round,
      date: canonicalDate(groupMatch, 'leg1') || getCupRoundDate(roundDates, groupMatch.leg1.round),
      isCup: true,
      cupLabel: label,
      cupColor: color,
      legLabel: 'Fase de Grupos',
      phase: groupMatch.phase,
    });
  });
  if (cup.phase === 'group') return;

  (cup.history || []).forEach(pushTie);
  pushTie(cup.currentTie);
  pushTie(cup.knockoutTie);
}

export function buildRecentResults({ gameData, currentRound, roundDates, limit = 6 }) {
  const results = [];
  const playedLeagueRounds = new Set();
  const calendar = gameData?.calendar || [];

  calendar.slice(0, currentRound).forEach(entry => {
    if (entry?.type === 'league' && Number.isInteger(entry.leagueIdx)) playedLeagueRounds.add(entry.leagueIdx);
  });

  if (playedLeagueRounds.size === 0 && calendar.length === 0) {
    const legacyLeagueRound = Math.min(gameData?.leagueRound ?? currentRound, gameData?.fixtures?.length || 0);
    for (let leagueIdx = 0; leagueIdx < legacyLeagueRound; leagueIdx += 1) playedLeagueRounds.add(leagueIdx);
  }

  [...playedLeagueRounds]
    .sort((a, b) => b - a)
    .forEach(leagueIdx => {
      const match = (gameData?.fixtures?.[leagueIdx] || []).find(item => item.home?.isPlayer || item.away?.isPlayer);
      if (match?.played && match.result) {
        const calendarEntry = calendar.find((entry) => entry?.type === 'league' && entry.leagueIdx === leagueIdx);
        results.push({ match, round: leagueIdx + 1, date:fromDateISO(calendarEntry?.dateISO || calendarEntry?.calendarDate) || roundDates[leagueIdx], isCup:false });
      }
    });

  if (gameData?.cups) {
    pushCupRecentResults(results, gameData.cups.copaBrasil, 'copaBrasil', CUP_META.copaBrasil.label, CUP_META.copaBrasil.color, roundDates, calendar);
    pushCupRecentResults(results, gameData.cups.libertadores, 'libertadores', CUP_META.libertadores.label, CUP_META.libertadores.color, roundDates, calendar);
    pushCupRecentResults(results, gameData.cups.sulAmericana, 'sulAmericana', CUP_META.sulAmericana.label, CUP_META.sulAmericana.color, roundDates, calendar);
    if (gameData.cups.regional) {
      pushCupRecentResults(
        results,
        gameData.cups.regional,
        gameData.cups.regional.competitionKey,
        gameData.cups.regional.label || 'Copa Regional',
        gameData.cups.regional.color || '#2e7d32',
        roundDates,
        calendar,
      );
    }
    if (gameData.cups.estadual) {
      pushCupRecentResults(
        results,
        gameData.cups.estadual,
        gameData.cups.estadual.competitionKey,
        gameData.cups.estadual.label || 'Campeonato Estadual',
        gameData.cups.estadual.color || '#1565c0',
        roundDates,
        calendar,
      );
    }
  }

  const seen = new Set();
  return results
    .filter(item => {
      const key = [item.isCup ? item.cupLabel : 'league', item.round, item.legLabel || '', item.match?.home?.name, item.match?.away?.name, item.match?.result].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const aTime = a.date?.getTime?.() ?? 0;
      const bTime = b.date?.getTime?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

import { FinanceEngine } from '../engine_finances.js';
import { sortLeagueTable, calcTeamRecentForm } from '../engine.js';
import { simulateMatch } from './matchSimulator.js';

const cloneMatch = (match) => ({
  ...match,
  home: match.home ? { ...match.home } : match.home,
  away: match.away ? { ...match.away } : match.away,
  events: Array.isArray(match.events) ? [...match.events] : match.events,
});

export function simulateLeagueRound({ gameData, leagueIdx, tactics, starters }) {
  const sourceMatches = gameData.fixtures?.[leagueIdx] || [];
  if (!sourceMatches.length) return { empty: true, leagueIdx };

  const currentMatches = sourceMatches.map(cloneMatch);
  const updatedTable = (gameData.table || []).map((row) => ({ ...row }));
  const oldPositions = Object.fromEntries((gameData.table || []).map((team, index) => [team.id, index + 1]));
  const allRawEvents = [];
  let userMatchData = null;
  let ticketIncome = 0;

  currentMatches.forEach((match) => {
    const result = simulateMatch(gameData, match, tactics, starters, gameData.players || []);
    match.played = true;
    match.result = `${result.homeGoals} - ${result.awayGoals}`;
    match.events = result.events;
    allRawEvents.push(...(result.rawEvents || []));

    if (match.home?.isPlayer || match.away?.isPlayer) {
      let attendance = 0;
      if (FinanceEngine?.calculateMatchFinances) {
        const finances = FinanceEngine.calculateMatchFinances(match.home, match.away, gameData);
        attendance = finances.attendance;
        ticketIncome = finances.ticketRevenue;
      }
      attendance = Math.min(attendance, gameData.club?.stadium?.capacity || 50000);
      userMatchData = {
        ...result,
        homeName: match.home?.name,
        awayName: match.away?.name,
        attendance,
        income: ticketIncome,
      };
    }

    const homeRow = updatedTable.find((team) => team.id === match.home?.id);
    const awayRow = updatedTable.find((team) => team.id === match.away?.id);
    if (!homeRow || !awayRow) return;

    if (result.homeGoals > result.awayGoals) {
      homeRow.w += 1; homeRow.pts += 3; awayRow.l += 1;
    } else if (result.awayGoals > result.homeGoals) {
      awayRow.w += 1; awayRow.pts += 3; homeRow.l += 1;
    } else {
      homeRow.d += 1; homeRow.pts += 1; awayRow.d += 1; awayRow.pts += 1;
    }
    homeRow.p += 1; homeRow.gf += result.homeGoals; homeRow.ga += result.awayGoals;
    awayRow.p += 1; awayRow.gf += result.awayGoals; awayRow.ga += result.homeGoals;
  });

  const fixtures = (gameData.fixtures || []).map((round, index) => (
    index === leagueIdx ? currentMatches : round
  ));
  const displayRound = (gameData.leagueRound ?? gameData.round ?? 0) + 1;
  const table = sortLeagueTable(updatedTable).map((team, index) => ({
    ...team,
    posVariation: (oldPositions[team.id] || index + 1) - (index + 1),
    recentForm: calcTeamRecentForm(team.id, fixtures, displayRound) || team.recentForm || [],
  }));

  return {
    empty: false,
    leagueIdx,
    currentMatches,
    fixtures,
    table,
    userMatchData,
    allRawEvents,
    ticketIncome,
  };
}

import { CalendarEngine } from '../CalendarEngine.js';
import { DisciplineEngine } from '../engine_discipline.js';
import { getLineupValidation } from '../lineup/lineupRules.js';
import { resolveMatchInfo } from '../../utils/matchDateUtils.js';

export const NEXT_MATCH_POSITION_ORDER = {
  GOL: 0,
  ZAG: 1,
  LD: 2,
  LE: 3,
  LAT: 2,
  VOL: 4,
  MC: 5,
  MEI: 6,
  PD: 7,
  PE: 8,
  CA: 9,
  ATA: 9,
};

export const sortNextMatchPlayers = (players = []) => [...players].sort((a, b) =>
  (NEXT_MATCH_POSITION_ORDER[a?.position] ?? 9) - (NEXT_MATCH_POSITION_ORDER[b?.position] ?? 9)
  || (b?.overall || 0) - (a?.overall || 0)
);

export const getSeasonEndSummary = (gameData) => {
  const calendarLength = gameData?.calendar?.length || gameData?.fixtures?.length || 0;
  const seasonOver = (gameData?.round || 0) >= calendarLength;
  const row = gameData?.table?.find((team) => team.id === 'user') || {};
  const position = (gameData?.table?.findIndex((team) => team.id === 'user') ?? -1) + 1;
  return { seasonOver, row, position, calendarLength };
};

const resolveLeagueIndex = (gameData, calendarEntry, isCalendarCup) => {
  if (!isCalendarCup) return calendarEntry?.leagueIdx ?? gameData.round;

  const calendar = gameData.calendar || [];
  for (let index = gameData.round + 1; index < calendar.length; index += 1) {
    if (calendar[index]?.type === 'league') return calendar[index].leagueIdx;
  }

  for (let index = gameData.round - 1; index >= 0; index -= 1) {
    if (calendar[index]?.type === 'league') return calendar[index].leagueIdx;
  }

  return gameData.round;
};

export const resolveNextMatchContext = (gameData) => {
  const calendar = gameData.calendar || [];
  const calendarEntry = calendar[gameData.round];
  const isCalendarCup = calendarEntry?.type === 'cup';
  const cupInfo = isCalendarCup && CalendarEngine?.getCupMatchForCalendarSlot
    ? CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calendarEntry)
    : { hasCupMatch: false };
  const isCupRound = !!cupInfo?.hasCupMatch;
  const leagueIdx = resolveLeagueIndex(gameData, calendarEntry, isCalendarCup);
  const leagueMatches = leagueIdx >= 0 ? (gameData.fixtures?.[leagueIdx] || []) : [];
  const leagueMatch = !isCupRound
    ? leagueMatches.find((match) => match.home?.isPlayer || match.away?.isPlayer) || null
    : null;

  let displayHome;
  let displayAway;
  let matchLabel;
  let matchInfoSecondary;
  let competition = 'league';

  if (isCupRound && cupInfo.tie) {
    const tie = cupInfo.tie;
    const isLeg2 = cupInfo.leg === 'leg2';
    displayHome = isLeg2 ? tie.away : tie.home;
    displayAway = isLeg2 ? tie.home : tie.away;
    matchLabel = `${cupInfo.label} · ${tie.phase} · ${isLeg2 ? 'Jogo de Volta' : 'Jogo de Ida'}`;
    competition = cupInfo.label?.includes('Brasil')
      ? 'copa_brasil'
      : cupInfo.label?.includes('Libert')
        ? 'libertadores'
        : 'sulamericana';

    if (isLeg2 && tie.leg1?.played) {
      matchInfoSecondary = `Ida: ${tie.home?.name} ${tie.leg1.home}×${tie.leg1.away} ${tie.away?.name}`;
    }
  } else if (leagueMatch) {
    displayHome = leagueMatch.home;
    displayAway = leagueMatch.away;
    matchLabel = `Série ${gameData.serie} · Rodada ${(leagueIdx >= 0 ? leagueIdx : (calendarEntry?.leagueIdx ?? gameData.round)) + 1}/${gameData.fixtures?.length || 0}`;
  }

  return {
    calendar,
    calendarEntry,
    isCalendarCup,
    cupInfo,
    isCupRound,
    leagueIdx,
    leagueMatch,
    displayHome,
    displayAway,
    matchLabel,
    matchInfoSecondary,
    competition,
    matchInfo: resolveMatchInfo(gameData, gameData.round),
  };
};

export const buildOpponentStarters = (gameData, opponent) => {
  if (!opponent) return [];
  const roster = gameData?.teamRosters?.[opponent.id] || opponent.squad || [];
  const marked = roster.filter((player) => player.isStarting);
  if (marked.length >= 11) return sortNextMatchPlayers(marked).slice(0, 11);

  const byPosition = {};
  roster.forEach((player) => {
    if (!byPosition[player.position]) byPosition[player.position] = [];
    byPosition[player.position].push(player);
  });
  Object.values(byPosition).forEach((players) => {
    players.sort((a, b) => (b.overall || 0) - (a.overall || 0));
  });

  const pick = (position, amount) => (byPosition[position] || []).slice(0, amount);
  const auto = [
    ...pick('GOL', 1),
    ...pick('ZAG', 2),
    ...pick('LD', 1),
    ...pick('LE', 1),
    ...pick('VOL', 2),
    ...pick('MC', 1),
    ...pick('PD', 1),
    ...pick('PE', 1),
    ...pick('CA', 1),
    // Compatibilidade com saves antigos.
    ...pick('LAT', 2),
    ...pick('ATA', 3),
  ].slice(0, 11);

  if (auto.length < 11) {
    const selectedIds = new Set(auto.map((player) => player.id));
    const remaining = roster
      .filter((player) => !selectedIds.has(player.id))
      .sort((a, b) => (b.overall || 0) - (a.overall || 0));
    auto.push(...remaining.slice(0, 11 - auto.length));
  }

  return sortNextMatchPlayers(auto);
};

export const getRecentLeagueForm = (gameData, limit = 5) => {
  const results = [];
  const fixtures = gameData?.fixtures || [];

  // gameData.round é índice do calendário completo e pode conter slots de Copa.
  // Por isso a forma recente é derivada apenas das rodadas de Liga realmente jogadas.
  for (let leagueIdx = fixtures.length - 1; leagueIdx >= 0 && results.length < limit; leagueIdx -= 1) {
    const match = (fixtures[leagueIdx] || []).find((item) => item.home?.isPlayer || item.away?.isPlayer);
    if (!match?.played || !match.result) continue;

    const [homeGoals, awayGoals] = String(match.result)
      .split('-')
      .map((value) => Number.parseInt(value.trim(), 10) || 0);
    const userGoals = match.home?.isPlayer ? homeGoals : awayGoals;
    const opponentGoals = match.home?.isPlayer ? awayGoals : homeGoals;
    results.push(userGoals > opponentGoals ? 'V' : userGoals < opponentGoals ? 'D' : 'E');
  }

  return results;
};

export const getAggregateInfo = (isCupRound, cupInfo) => {
  if (!isCupRound || cupInfo?.leg !== 'leg2' || !cupInfo?.tie?.leg1?.played) return null;

  const tie = cupInfo.tie;
  const leg1Home = tie.leg1.home ?? 0;
  const leg1Away = tie.leg1.away ?? 0;
  const userWasHome = !!tie.home?.isPlayer;
  const userFirstLegGoals = userWasHome ? leg1Home : leg1Away;
  const opponentFirstLegGoals = userWasHome ? leg1Away : leg1Home;
  const goalDifference = userFirstLegGoals - opponentFirstLegGoals;

  let requirementText;
  let requirementTone;
  if (goalDifference > 0) {
    requirementTone = 'ahead';
    requirementText = `Você começa ${goalDifference} gol${goalDifference > 1 ? 's' : ''} na frente. Empate classifica.`;
  } else if (goalDifference < 0) {
    const deficit = Math.abs(goalDifference);
    requirementTone = 'behind';
    requirementText = `Vença por ${deficit + 1}+ para classificar; por ${deficit} leva aos pênaltis.`;
  } else {
    requirementTone = 'level';
    requirementText = 'Agregado empatado: vitória classifica; empate leva aos pênaltis.';
  }

  return {
    homeTeam: tie.home?.name,
    awayTeam: tie.away?.name,
    leg1Home,
    leg1Away,
    userFirstLegGoals,
    opponentFirstLegGoals,
    goalDifference,
    requirementText,
    requirementTone,
  };
};

export const buildNextMatchViewModel = (gameData) => {
  const season = getSeasonEndSummary(gameData);
  if (season.seasonOver) return { season };

  const match = resolveNextMatchContext(gameData);
  const validation = getLineupValidation(gameData);
  const starters = (gameData.players || []).filter((player) => player.isStarting);
  const nextRound = gameData.round + 1;
  const illegalStarters = starters.filter((player) =>
    !!player.injury || DisciplineEngine.isPlayerSuspended(player, nextRound)
  );
  const isFullyReady = validation.isValid && illegalStarters.length === 0;

  const isUserHome = !!match.displayHome?.isPlayer;
  const opponent = isUserHome ? match.displayAway : match.displayHome;
  const userRow = gameData.table?.find((team) => team.id === 'user') || {};
  const opponentRow = gameData.table?.find((team) =>
    (opponent?.id && team.id === opponent.id) || team.name === opponent?.name
  ) || {};
  const userPosition = (gameData.table?.findIndex((team) => team.id === 'user') ?? -1) + 1;
  const opponentPosition = (gameData.table?.findIndex((team) =>
    (opponent?.id && team.id === opponent.id) || team.name === opponent?.name
  ) ?? -1) + 1;
  const h2hRecord = opponent?.name ? gameData.h2hHistory?.[opponent.name] || null : null;

  return {
    season,
    ...match,
    validation,
    starters,
    illegalStarters,
    isFullyReady,
    nextRound,
    isUserHome,
    opponent,
    userRow,
    opponentRow,
    userPosition,
    opponentPosition,
    h2hRecord,
    userStrength: validation.avgStrength || 70,
    opponentStrength: opponent?.strength || 70,
    opponentStarters: buildOpponentStarters(gameData, opponent),
    recentForm: getRecentLeagueForm(gameData),
    aggregateInfo: getAggregateInfo(match.isCupRound, match.cupInfo),
  };
};

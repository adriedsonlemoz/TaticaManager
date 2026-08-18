import { simGoals, shuffle } from './cupUtils.js';

const resetGroupStats = (team) => ({
  ...team,
  pts: 0,
  w: 0,
  d: 0,
  l: 0,
  gf: 0,
  ga: 0,
  p: 0,
});

export const sortContinentalGroup = (group = []) => [...group].sort((a, b) => (
  (b.pts || 0) - (a.pts || 0)
  || (b.w || 0) - (a.w || 0)
  || ((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0))
  || (b.gf || 0) - (a.gf || 0)
  || String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
));

export const applyContinentalGroupResult = (
  group = [],
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
) => sortContinentalGroup(group.map((team) => {
  const isHome = team.id === homeTeam?.id;
  const isAway = team.id === awayTeam?.id;
  if (!isHome && !isAway) return team;

  const goalsFor = isHome ? homeGoals : awayGoals;
  const goalsAgainst = isHome ? awayGoals : homeGoals;
  const next = {
    ...team,
    gf: (team.gf || 0) + goalsFor,
    ga: (team.ga || 0) + goalsAgainst,
    p: (team.p || 0) + 1,
  };

  if (goalsFor > goalsAgainst) {
    next.w = (team.w || 0) + 1;
    next.pts = (team.pts || 0) + 3;
  } else if (goalsFor < goalsAgainst) {
    next.l = (team.l || 0) + 1;
  } else {
    next.d = (team.d || 0) + 1;
    next.pts = (team.pts || 0) + 1;
  }
  return next;
}));

const buildCpuMatch = (remainingTeams, reverse = false) => {
  if (remainingTeams.length < 2) return null;
  const [first, second] = reverse ? [...remainingTeams].reverse() : remainingTeams;
  return {
    played: false,
    home: null,
    away: null,
    homeTeam: { ...first, isPlayer: false },
    awayTeam: { ...second, isPlayer: false },
  };
};

export const buildGroupCompetition = ({
  gameData,
  competitionKey,
  userStrength,
  prizes,
  schedule,
  idPrefix,
  opponentPool = [],
  rng = Math.random,
}) => {
  const userTeam = {
    id: 'user',
    name: gameData.club.name,
    strength: gameData.club.strength || userStrength,
    isPlayer: true,
  };
  const opponents = shuffle(opponentPool, rng).slice(0, 3).map((team) => ({ ...team, isPlayer: false }));
  const groupTeams = [userTeam, ...opponents].map(resetGroupStats);

  const groupMatches = opponents.map((opponent, index) => {
    const phase = `Grupos ${index + 1}`;
    const [leg1Round, leg2Round = null] = schedule[phase] || [];
    const userHomeOnLeg1 = index % 2 === 0;
    const home = userHomeOnLeg1 ? userTeam : opponent;
    const away = userHomeOnLeg1 ? opponent : userTeam;
    const remainingTeams = opponents.filter((team) => team.id !== opponent.id);

    return {
      id: `${idPrefix}${index}`,
      phase,
      home,
      away,
      leg1: {
        played: false,
        home: null,
        away: null,
        round: leg1Round,
        cpuMatch: buildCpuMatch(remainingTeams, false),
      },
      leg2: leg2Round == null ? null : {
        played: false,
        home: null,
        away: null,
        round: leg2Round,
        homeTeam: away,
        awayTeam: home,
        cpuMatch: buildCpuMatch(remainingTeams, true),
      },
      decided: false,
      winner: null,
      prize: Math.floor((prizes.group || 0) / 3),
    };
  });

  return {
    active: true,
    status: 'active',
    competitionKey,
    userSourceTeamId: gameData.club?.existingTeamId || null,
    phase: 'group',
    phaseLabel: 'Fase de Grupos',
    group: groupTeams,
    groupMatches,
    currentGroupMatchIndex: 0,
    knockoutTie: null,
    history: [],
    totalPrize: 0,
  };
};

const getUserFixtureTeams = (match, isLeg2) => {
  if (isLeg2) {
    return {
      homeTeam: match.leg2?.homeTeam || match.away,
      awayTeam: match.leg2?.awayTeam || match.home,
    };
  }
  return { homeTeam: match.home, awayTeam: match.away };
};

const deriveCpuFixture = (group, match, isLeg2) => {
  const leg = isLeg2 ? match.leg2 : match.leg1;
  if (leg?.cpuMatch?.homeTeam && leg?.cpuMatch?.awayTeam) return leg.cpuMatch;

  const { homeTeam, awayTeam } = getUserFixtureTeams(match, isLeg2);
  const participantIds = new Set([homeTeam?.id, awayTeam?.id].filter(Boolean));
  const remaining = (group || []).filter((team) => !team.isPlayer && !participantIds.has(team.id));
  return buildCpuMatch(remaining, isLeg2);
};

const settleCpuMatch = (group, match, isLeg2, rng) => {
  const legKey = isLeg2 ? 'leg2' : 'leg1';
  const leg = match?.[legKey];
  if (!leg?.played) return { group, match };
  if (leg.cpuMatch?.played) return { group, match };

  const cpuMatch = deriveCpuFixture(group, match, isLeg2);
  if (!cpuMatch?.homeTeam || !cpuMatch?.awayTeam) return { group, match };
  const [homeGoals, awayGoals] = simGoals(
    cpuMatch.homeTeam.strength || 75,
    cpuMatch.awayTeam.strength || 75,
    rng,
  );
  const settledCpuMatch = { ...cpuMatch, played: true, home: homeGoals, away: awayGoals };
  return {
    group: applyContinentalGroupResult(
      group,
      settledCpuMatch.homeTeam,
      settledCpuMatch.awayTeam,
      homeGoals,
      awayGoals,
    ),
    match: { ...match, [legKey]: { ...leg, cpuMatch: settledCpuMatch } },
  };
};

const settlePlayedCpuMatches = (group, matches, rng) => {
  let nextGroup = group;
  const nextMatches = [];
  for (const original of matches) {
    let match = original;
    for (const isLeg2 of [false, true]) {
      const settled = settleCpuMatch(nextGroup, match, isLeg2, rng);
      nextGroup = settled.group;
      match = settled.match;
    }
    nextMatches.push(match);
  }
  return { group: nextGroup, matches: nextMatches };
};

export const nextPendingGroupMatchIndex = (matches = []) => {
  const index = matches.findIndex((match) => (
    !match.leg1?.played || (match.leg2 && !match.leg2.played)
  ));
  return index === -1 ? matches.length : index;
};

export const recordGroupLegResult = ({
  cup,
  matchId,
  homeGoals,
  awayGoals,
  isLeg2 = false,
  rng = Math.random,
}) => {
  if (!cup) return null;
  const match = (cup.groupMatches || []).find((item) => item.id === matchId);
  if (!match || (isLeg2 && !match.leg2)) return null;

  const legKey = isLeg2 ? 'leg2' : 'leg1';
  if (match[legKey]?.played) return { cup, allDone: false, duplicate: true };
  const fixtureTeams = getUserFixtureTeams(match, isLeg2);
  let group = applyContinentalGroupResult(
    cup.group || [],
    fixtureTeams.homeTeam,
    fixtureTeams.awayTeam,
    homeGoals,
    awayGoals,
  );

  let matches = (cup.groupMatches || []).map((item) => {
    if (item.id !== matchId) return item;
    const next = {
      ...item,
      [legKey]: { ...item[legKey], played: true, home: homeGoals, away: awayGoals },
    };
    return {
      ...next,
      decided: Boolean(next.leg1?.played && (!next.leg2 || next.leg2.played)),
    };
  });

  const settled = settlePlayedCpuMatches(group, matches, rng);
  group = settled.group;
  matches = settled.matches;
  const allDone = matches.every((item) => item.leg1?.played && (!item.leg2 || item.leg2.played));

  return {
    cup: {
      ...cup,
      groupMatches: matches,
      group,
      currentGroupMatchIndex: nextPendingGroupMatchIndex(matches),
    },
    allDone,
    duplicate: false,
  };
};

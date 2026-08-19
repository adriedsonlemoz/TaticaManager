// League scheduling, standings and table-zone helpers.

const getTableZoneColorA = (idx) => {
  if (idx < 4)   return '#32a852'; // Libertadores
  if (idx < 6)   return '#118a8b'; // Pré-Libertadores
  if (idx < 12)  return '#b87a00'; // Sul-Americana
  if (idx >= 16) return '#941818'; // Rebaixamento → Série B
  return 'transparent';
};
const getTableZoneColorB = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série A
  if (idx >= 16) return '#941818'; // Rebaixamento → Série C
  return 'transparent';
};
const getTableZoneColorC = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série B
  if (idx >= 16) return '#941818'; // Rebaixamento → Série D
  return 'transparent';
};
const getTableZoneColorD = (idx) => {
  if (idx < 4) return '#32a852'; // Acesso → Série C
  // Não existe Série E no modelo atual; a Série D usa classificação por grupos
  // e mata-mata, sem zona de rebaixamento na tabela exibida ao usuário.
  return 'transparent';
};
const getTableZoneColor = (idx, serie) => {
  if (serie === 'B') return getTableZoneColorB(idx);
  if (serie === 'C') return getTableZoneColorC(idx);
  if (serie === 'D') return getTableZoneColorD(idx);
  return getTableZoneColorA(idx);
};

const safeTeamId = (value) => (value === null || value === undefined ? null : String(value));
const safeStat = (value) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);

const generateFixtures = (teams) => {
  const sourceTeams = Array.isArray(teams) ? teams.filter(Boolean) : [];
  const n = sourceTeams.length;
  if (n < 2 || n % 2 !== 0) return [];

  const fixtures = [];
  const roundTeams = [...sourceTeams];
  for (let r = 0; r < n - 1; r++) {
    const roundMatches = [];
    for (let m = 0; m < n / 2; m++) {
      const home = roundTeams[m];
      const away = roundTeams[n - 1 - m];
      if (r % 2 === 0 && m === 0) roundMatches.push({ home: away, away: home, played: false, result: null });
      else roundMatches.push({ home, away, played: false, result: null });
    }
    fixtures.push(roundMatches);
    roundTeams.splice(1, 0, roundTeams.pop());
  }

  const firstHalf = fixtures.map((round) => [...round]);
  firstHalf.forEach((round) => {
    fixtures.push(round.map((match) => ({ home: match.away, away: match.home, played: false, result: null })));
  });
  return fixtures;
};


const generateSingleRoundFixtures = (teams) => {
  const sourceTeams = Array.isArray(teams) ? teams.filter(Boolean) : [];
  const n = sourceTeams.length;
  if (n < 2 || n % 2 !== 0) return [];
  const fixtures = [];
  const roundTeams = [...sourceTeams];
  for (let r = 0; r < n - 1; r += 1) {
    const roundMatches = [];
    for (let m = 0; m < n / 2; m += 1) {
      const left = roundTeams[m];
      const right = roundTeams[n - 1 - m];
      const reverse = (r + m) % 2 === 0;
      roundMatches.push(reverse
        ? { home:right, away:left, played:false, result:null }
        : { home:left, away:right, played:false, result:null });
    }
    fixtures.push(roundMatches);
    roundTeams.splice(1, 0, roundTeams.pop());
  }
  return fixtures;
};

const generateInitialTable = (teams) => (Array.isArray(teams) ? teams : []).filter(Boolean).map((team) => ({
  id: team.id,
  name: team.name,
  pts: 0,
  p: 0,
  w: 0,
  d: 0,
  l: 0,
  gf: 0,
  ga: 0,
}));

const parseLeagueResult = (result) => {
  if (typeof result !== 'string' && typeof result !== 'number') return null;
  const match = String(result).trim().match(/^(\d+)\s*[-x×]\s*(\d+)$/i);
  if (!match) return null;
  const homeGoals = Number(match[1]);
  const awayGoals = Number(match[2]);
  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) || homeGoals < 0 || awayGoals < 0) return null;
  return { homeGoals, awayGoals };
};

const getPlayedFixtureMatches = (fixtures = []) => (Array.isArray(fixtures) ? fixtures : [])
  .flatMap((round, roundIndex) => (Array.isArray(round) ? round.map((match, matchIndex) => ({ match, roundIndex, matchIndex })) : []))
  .filter(({ match }) => match?.played === true && parseLeagueResult(match?.result));

const createResetRow = (row = {}) => ({
  ...row,
  pts: 0,
  p: 0,
  w: 0,
  d: 0,
  l: 0,
  gf: 0,
  ga: 0,
});

const rebuildLeagueTable = (table = [], fixtures = []) => {
  const sourceRows = (Array.isArray(table) ? table : []).filter((row) => row && row.id !== undefined && row.id !== null);
  const rows = sourceRows.map(createResetRow);
  const byId = new Map(rows.map((row) => [safeTeamId(row.id), row]));

  getPlayedFixtureMatches(fixtures).forEach(({ match }) => {
    const score = parseLeagueResult(match.result);
    const homeRow = byId.get(safeTeamId(match.home?.id));
    const awayRow = byId.get(safeTeamId(match.away?.id));
    if (!score || !homeRow || !awayRow || homeRow === awayRow) return;

    homeRow.p += 1;
    awayRow.p += 1;
    homeRow.gf += score.homeGoals;
    homeRow.ga += score.awayGoals;
    awayRow.gf += score.awayGoals;
    awayRow.ga += score.homeGoals;

    if (score.homeGoals > score.awayGoals) {
      homeRow.w += 1;
      homeRow.pts += 3;
      awayRow.l += 1;
    } else if (score.awayGoals > score.homeGoals) {
      awayRow.w += 1;
      awayRow.pts += 3;
      homeRow.l += 1;
    } else {
      homeRow.d += 1;
      awayRow.d += 1;
      homeRow.pts += 1;
      awayRow.pts += 1;
    }
  });

  return sortLeagueTable(rows, fixtures);
};

const primaryTieKey = (row = {}) => [
  safeStat(row.pts),
  safeStat(row.w),
  safeStat(row.gf) - safeStat(row.ga),
  safeStat(row.gf),
].join('|');

const comparePrimary = (a = {}, b = {}) => {
  const pts = safeStat(b.pts) - safeStat(a.pts);
  if (pts) return pts;
  const wins = safeStat(b.w) - safeStat(a.w);
  if (wins) return wins;
  const gdA = safeStat(a.gf) - safeStat(a.ga);
  const gdB = safeStat(b.gf) - safeStat(b.ga);
  if (gdB !== gdA) return gdB - gdA;
  const goals = safeStat(b.gf) - safeStat(a.gf);
  if (goals) return goals;
  return 0;
};

const getHeadToHead = (teamA, teamB, fixtures = []) => {
  const aId = safeTeamId(teamA?.id);
  const bId = safeTeamId(teamB?.id);
  const totals = {
    a: { pts: 0, gf: 0, ga: 0 },
    b: { pts: 0, gf: 0, ga: 0 },
    matches: 0,
  };
  if (aId === null || bId === null || aId === bId) return totals;

  getPlayedFixtureMatches(fixtures).forEach(({ match }) => {
    const homeId = safeTeamId(match.home?.id);
    const awayId = safeTeamId(match.away?.id);
    const direct = (homeId === aId && awayId === bId) || (homeId === bId && awayId === aId);
    if (!direct) return;
    const score = parseLeagueResult(match.result);
    if (!score) return;

    totals.matches += 1;
    const homeBucket = homeId === aId ? totals.a : totals.b;
    const awayBucket = awayId === aId ? totals.a : totals.b;
    homeBucket.gf += score.homeGoals;
    homeBucket.ga += score.awayGoals;
    awayBucket.gf += score.awayGoals;
    awayBucket.ga += score.homeGoals;
    if (score.homeGoals > score.awayGoals) homeBucket.pts += 3;
    else if (score.awayGoals > score.homeGoals) awayBucket.pts += 3;
    else {
      homeBucket.pts += 1;
      awayBucket.pts += 1;
    }
  });

  return totals;
};

const compareHeadToHead = (a, b, fixtures) => {
  const direct = getHeadToHead(a, b, fixtures);
  if (!direct.matches) return 0;
  if (direct.b.pts !== direct.a.pts) return direct.b.pts - direct.a.pts;
  const gdA = direct.a.gf - direct.a.ga;
  const gdB = direct.b.gf - direct.b.ga;
  if (gdB !== gdA) return gdB - gdA;
  if (direct.b.gf !== direct.a.gf) return direct.b.gf - direct.a.gf;
  return 0;
};

const sortLeagueTable = (table = [], fixtures = null) => {
  // Critério do Brasileirão: PTS → V → SG → GF → confronto direto (quando restam 2 clubes).
  // O jogo não mantém cartões agregados por clube na tabela; nome é apenas fallback determinístico final.
  const primarySorted = [...(Array.isArray(table) ? table : [])].sort((a, b) => {
    const primary = comparePrimary(a, b);
    if (primary) return primary;
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
  });

  const output = [];
  for (let index = 0; index < primarySorted.length;) {
    const key = primaryTieKey(primarySorted[index]);
    let end = index + 1;
    while (end < primarySorted.length && primaryTieKey(primarySorted[end]) === key) end += 1;
    const group = primarySorted.slice(index, end);
    if (group.length === 2 && fixtures) {
      const direct = compareHeadToHead(group[0], group[1], fixtures);
      if (direct > 0) group.reverse();
      else if (direct === 0) group.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    } else if (group.length > 1) {
      group.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    }
    output.push(...group);
    index = end;
  }
  return output;
};

const getLeagueFixtureSummary = (fixtures = []) => {
  const rounds = Array.isArray(fixtures) ? fixtures : [];
  const allMatches = rounds.flatMap((round) => (Array.isArray(round) ? round : []));
  const validPlayed = getPlayedFixtureMatches(fixtures);
  return {
    rounds: rounds.length,
    totalMatches: allMatches.length,
    playedMatches: validPlayed.length,
    unplayedMatches: allMatches.filter((match) => match?.played !== true).length,
    invalidPlayedMatches: allMatches.filter((match) => match?.played === true && !parseLeagueResult(match?.result)).length,
  };
};


const buildLeagueScheduleReport = (table = [], fixtures = []) => {
  const rows = (Array.isArray(table) ? table : []).filter(Boolean);
  const teamIds = rows.map((row) => safeTeamId(row?.id)).filter((id) => id !== null);
  const teamIdSet = new Set(teamIds);
  const rounds = Array.isArray(fixtures) ? fixtures : [];
  const expectedRounds = rows.length >= 2 && rows.length % 2 === 0 ? (rows.length - 1) * 2 : 0;
  const expectedMatches = rows.length >= 2 && rows.length % 2 === 0 ? rows.length * (rows.length - 1) : 0;
  const expectedMatchesPerRound = rows.length >= 2 && rows.length % 2 === 0 ? rows.length / 2 : 0;
  const errors = [];
  const oriented = new Map();
  const pairs = new Map();

  if (teamIds.length !== teamIdSet.size) errors.push('duplicate-team-ids');
  if (!expectedRounds) errors.push('invalid-team-count');
  if (expectedRounds && rounds.length !== expectedRounds) errors.push(`round-count:${rounds.length}!=${expectedRounds}`);

  rounds.forEach((round, roundIndex) => {
    const matches = Array.isArray(round) ? round : [];
    if (expectedMatchesPerRound && matches.length !== expectedMatchesPerRound) {
      errors.push(`round-${roundIndex + 1}-matches:${matches.length}!=${expectedMatchesPerRound}`);
    }
    const seenRound = new Set();
    matches.forEach((match, matchIndex) => {
      const homeId = safeTeamId(match?.home?.id);
      const awayId = safeTeamId(match?.away?.id);
      if (homeId === null || awayId === null) {
        errors.push(`round-${roundIndex + 1}-match-${matchIndex + 1}-missing-team`);
        return;
      }
      if (!teamIdSet.has(homeId) || !teamIdSet.has(awayId)) errors.push(`unknown-team:${homeId}>${awayId}`);
      if (homeId === awayId) errors.push(`self-match:${homeId}`);
      if (seenRound.has(homeId) || seenRound.has(awayId)) errors.push(`round-${roundIndex + 1}-duplicate-team`);
      seenRound.add(homeId);
      seenRound.add(awayId);
      const orientedKey = `${homeId}>${awayId}`;
      oriented.set(orientedKey, (oriented.get(orientedKey) || 0) + 1);
      const pairKey = [homeId, awayId].sort().join('|');
      pairs.set(pairKey, (pairs.get(pairKey) || 0) + 1);
    });
    if (teamIds.length && seenRound.size !== teamIds.length) errors.push(`round-${roundIndex + 1}-team-count:${seenRound.size}!=${teamIds.length}`);
  });

  if (expectedMatches) {
    const totalMatches = rounds.reduce((sum, round) => sum + (Array.isArray(round) ? round.length : 0), 0);
    if (totalMatches !== expectedMatches) errors.push(`match-count:${totalMatches}!=${expectedMatches}`);
    const expectedPairs = rows.length * (rows.length - 1) / 2;
    if (pairs.size !== expectedPairs) errors.push(`pair-count:${pairs.size}!=${expectedPairs}`);
    pairs.forEach((count, key) => { if (count !== 2) errors.push(`pair-${key}:${count}!=2`); });
    oriented.forEach((count, key) => { if (count !== 1) errors.push(`oriented-${key}:${count}!=1`); });
  }

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    teamCount: rows.length,
    rounds: rounds.length,
    expectedRounds,
    expectedMatches,
    expectedMatchesPerRound,
  };
};

const hasDoubleRoundRobinShape = (table = [], fixtures = []) => buildLeagueScheduleReport(table, fixtures).ok;



const leagueStatsEqual = (a = {}, b = {}) => ['pts','p','w','d','l','gf','ga']
  .every((key) => safeStat(a?.[key]) === safeStat(b?.[key]));

const reconcileLeagueState = (gameData = {}) => {
  const table = Array.isArray(gameData?.table) ? gameData.table : [];
  const fixtures = Array.isArray(gameData?.fixtures) ? gameData.fixtures : [];
  if (!hasDoubleRoundRobinShape(table, fixtures)) return gameData;

  const rebuilt = rebuildLeagueTable(table, fixtures);
  const same = table.length === rebuilt.length && rebuilt.every((row, index) => (
    safeTeamId(row?.id) === safeTeamId(table[index]?.id) && leagueStatsEqual(row, table[index])
  ));
  return same ? gameData : { ...gameData, table:rebuilt };
};

const isCompleteDoubleRoundRobin = (table = [], fixtures = []) => {
  const schedule = buildLeagueScheduleReport(table, fixtures);
  if (!schedule.ok) return false;
  const summary = getLeagueFixtureSummary(fixtures);
  return summary.playedMatches === schedule.expectedMatches && summary.invalidPlayedMatches === 0;
};

const buildLeagueIntegrityReport = (table = [], fixtures = []) => {
  const rows = Array.isArray(table) ? table : [];
  const fixtureSummary = getLeagueFixtureSummary(fixtures);
  const schedule = buildLeagueScheduleReport(rows, fixtures);
  const ids = rows.map((row) => safeTeamId(row?.id)).filter((id) => id !== null);
  const duplicateTeamIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const tableMatches = rows.reduce((sum, row) => sum + safeStat(row?.p), 0);
  const wins = rows.reduce((sum, row) => sum + safeStat(row?.w), 0);
  const draws = rows.reduce((sum, row) => sum + safeStat(row?.d), 0);
  const losses = rows.reduce((sum, row) => sum + safeStat(row?.l), 0);
  const goalsFor = rows.reduce((sum, row) => sum + safeStat(row?.gf), 0);
  const goalsAgainst = rows.reduce((sum, row) => sum + safeStat(row?.ga), 0);
  const points = rows.reduce((sum, row) => sum + safeStat(row?.pts), 0);
  const rowErrors = rows.flatMap((row) => {
    const errors = [];
    const played = safeStat(row?.p);
    const w = safeStat(row?.w);
    const d = safeStat(row?.d);
    const l = safeStat(row?.l);
    const pts = safeStat(row?.pts);
    if (played !== w + d + l) errors.push(`${row?.id ?? row?.name}:p!=w+d+l`);
    if (pts !== (w * 3) + d) errors.push(`${row?.id ?? row?.name}:pts!=3w+d`);
    return errors;
  });

  const expectedTableMatchEntries = fixtureSummary.playedMatches * 2;
  const expectedPoints = wins * 3 + draws;
  const errors = [
    ...schedule.errors.map((error) => `schedule:${error}`),
    ...(duplicateTeamIds.length ? [`duplicate-team-ids:${duplicateTeamIds.join(',')}`] : []),
    ...(fixtureSummary.invalidPlayedMatches ? [`invalid-played-results:${fixtureSummary.invalidPlayedMatches}`] : []),
    ...(tableMatches !== expectedTableMatchEntries ? [`played:${tableMatches}!=${expectedTableMatchEntries}`] : []),
    ...(wins !== losses ? [`wins-losses:${wins}!=${losses}`] : []),
    ...(draws % 2 !== 0 ? [`draws-not-paired:${draws}`] : []),
    ...(goalsFor !== goalsAgainst ? [`goals:${goalsFor}!=${goalsAgainst}`] : []),
    ...(points !== expectedPoints ? [`points:${points}!=${expectedPoints}`] : []),
    ...rowErrors,
  ];

  return {
    ok: errors.length === 0,
    errors,
    duplicateTeamIds,
    ...fixtureSummary,
    totals: { tableMatches, wins, draws, losses, goalsFor, goalsAgainst, points },
  };
};

export {
  buildLeagueIntegrityReport,
  buildLeagueScheduleReport,
  generateFixtures,
  generateSingleRoundFixtures,
  generateInitialTable,
  getHeadToHead,
  getLeagueFixtureSummary,
  hasDoubleRoundRobinShape,
  getTableZoneColor,
  isCompleteDoubleRoundRobin,
  parseLeagueResult,
  rebuildLeagueTable,
  reconcileLeagueState,
  sortLeagueTable,
};

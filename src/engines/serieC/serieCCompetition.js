import {
  generateFixtures,
  generateInitialTable,
  generateSingleRoundFixtures,
  parseLeagueResult,
  rebuildLeagueTable,
} from '../core/leagueEngine.js';

export const SERIE_C_COMPETITION_VERSION = 1;
export const SERIE_C_2026_FIRST_PHASE_ROUNDS = 19;
export const SERIE_C_2026_QUADRANGULAR_ROUNDS = 6;
export const SERIE_C_2026_TOTAL_ROUNDS = 27;
export const SERIE_C_2027_FIRST_PHASE_ROUNDS = 23;
export const SERIE_C_2027_QUADRANGULAR_ROUNDS = 6;
export const SERIE_C_2027_TOTAL_ROUNDS = 31;

export const SERIE_C_FORMATS = Object.freeze({
  2026: Object.freeze({
    season:2026,
    teamCount:20,
    firstPhaseRounds:SERIE_C_2026_FIRST_PHASE_ROUNDS,
    quadrangularRounds:SERIE_C_2026_QUADRANGULAR_ROUNDS,
    totalRounds:SERIE_C_2026_TOTAL_ROUNDS,
    format:'2026-20-single-quadrangular',
  }),
  2027: Object.freeze({
    season:2027,
    teamCount:24,
    firstPhaseRounds:SERIE_C_2027_FIRST_PHASE_ROUNDS,
    quadrangularRounds:SERIE_C_2027_QUADRANGULAR_ROUNDS,
    totalRounds:SERIE_C_2027_TOTAL_ROUNDS,
    format:'2027-24-single-quadrangular',
  }),
});

export const getSerieCFormat = (season = 2026) => SERIE_C_FORMATS[Number(season)] || null;
const phaseIndexes = (season) => {
  const format = getSerieCFormat(season);
  if (!format) return null;
  const firstEnd = format.firstPhaseRounds - 1;
  const quadrangularStart = format.firstPhaseRounds;
  const quadrangularEnd = quadrangularStart + format.quadrangularRounds - 1;
  const finalStart = quadrangularEnd + 1;
  const finalEnd = finalStart + 1;
  return { ...format, firstEnd, quadrangularStart, quadrangularEnd, finalStart, finalEnd };
};

const idOf = (team) => team == null ? null : String(typeof team === 'object' ? team.id : team);
const canonicalIdOf = (team) => team?.id === 'user'
  ? String(team.teamId || team.canonicalTeamId || '')
  : idOf(team);
const cloneTeam = (team) => ({ ...team, isPlayer:team?.id === 'user' || team?.isPlayer === true });
const emptyRound = () => [];

function hash01(value) {
  const text = String(value ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 0x100000000;
}
function strength(team) { return Number(team?.strength) || 58; }
function deterministicScore(home, away, seed = '') {
  const diff = (strength(home) - strength(away)) / 10;
  const hg = Math.max(0, Math.min(5, Math.floor(0.65 + diff * .18 + hash01(`${seed}|h|${canonicalIdOf(home)}`) * 2.8)));
  const ag = Math.max(0, Math.min(5, Math.floor(0.55 - diff * .15 + hash01(`${seed}|a|${canonicalIdOf(away)}`) * 2.6)));
  return `${hg} - ${ag}`;
}
function autoplayRound(round = [], seed = '') {
  return round.map((match, index) => match?.played === true ? match : ({ ...match, played:true, result:deterministicScore(match.home, match.away, `${seed}|${index}`), events:[] }));
}
function autoplayRange(fixtures, start, end, seed = '') {
  const next = fixtures.map((round) => [...(round || [])]);
  for (let idx = start; idx <= end; idx += 1) next[idx] = autoplayRound(next[idx] || [], `${seed}|r${idx}`);
  return next;
}
function mergeGroupRounds(groupA = [], groupB = [], roundCount = 6) {
  return Array.from({ length:roundCount }, (_, index) => [
    ...(groupA[index] || []).map((match) => ({ ...match, serieCGroup:'B' })),
    ...(groupB[index] || []).map((match) => ({ ...match, serieCGroup:'C' })),
  ]);
}
function teamMap(teams = []) { return new Map(teams.map((team) => [idOf(team), team])); }
function rowsToTeams(rows = [], teams = []) {
  const byId = teamMap(teams);
  return rows.map((row) => cloneTeam(byId.get(idOf(row)) || row));
}
function rebuildGroupTable(teams, fixtures, start, end, groupKey = null) {
  const rounds = fixtures.slice(start, end + 1).map((round) => (
    groupKey ? (round || []).filter((match) => match.serieCGroup === groupKey) : (round || [])
  ));
  return rebuildLeagueTable(generateInitialTable(teams), rounds);
}
function firstPhaseTable(teams, fixtures, roundCount) {
  return rebuildLeagueTable(generateInitialTable(teams), fixtures.slice(0, roundCount));
}
function buildQuadrangular(qualifierRows, teams) {
  const ordered = rowsToTeams(qualifierRows, teams);
  // Regulamento: Grupo B = 1º, 4º, 5º e 8º; Grupo C = 2º, 3º, 6º e 7º.
  const groupB = [ordered[0], ordered[3], ordered[4], ordered[7]].filter(Boolean);
  const groupC = [ordered[1], ordered[2], ordered[5], ordered[6]].filter(Boolean);
  return { B:groupB, C:groupC };
}
function userGroupOf(groups = {}) {
  return Object.entries(groups).find(([, teams]) => teams.some((team) => idOf(team) === 'user'))?.[0] || null;
}
function canonicalIds(rows = [], teams = []) {
  const byId = teamMap(teams);
  return rows.map((row) => canonicalIdOf(byId.get(idOf(row)) || row)).filter(Boolean);
}

function buildFinalRounds(winnerB, winnerC) {
  if (!winnerB || !winnerC) return [[], []];
  return [
    [{ tieId:'serie-c-final', home:cloneTeam(winnerB), away:cloneTeam(winnerC), played:false, result:null }],
    [{ tieId:'serie-c-final', home:cloneTeam(winnerC), away:cloneTeam(winnerB), played:false, result:null }],
  ];
}
function decideFinal(fixtures, indexes, seed = '') {
  const leg1 = fixtures?.[indexes.finalStart]?.[0];
  const leg2 = fixtures?.[indexes.finalEnd]?.[0];
  const a = parseLeagueResult(leg1?.result); const b = parseLeagueResult(leg2?.result);
  if (!a || !b || !leg1?.home || !leg1?.away) return null;
  const homeAgg = a.homeGoals + b.awayGoals;
  const awayAgg = a.awayGoals + b.homeGoals;
  if (homeAgg > awayAgg) return leg1.home;
  if (awayAgg > homeAgg) return leg1.away;
  return hash01(`${seed}|pens`) >= .5 ? leg1.home : leg1.away;
}

function finishCpuStages(competition, fixtures) {
  const indexes = phaseIndexes(competition.season);
  if (!indexes) return { fixtures, groupTables:null, promotedCanonicalIds:[], championCanonicalId:null };
  let nextFixtures = autoplayRange(fixtures, indexes.quadrangularStart, indexes.quadrangularEnd, `${competition.season}|serie-c-quadrangular`);
  const tables = {
    B:rebuildGroupTable(competition.groups.B, nextFixtures, indexes.quadrangularStart, indexes.quadrangularEnd, 'B'),
    C:rebuildGroupTable(competition.groups.C, nextFixtures, indexes.quadrangularStart, indexes.quadrangularEnd, 'C'),
  };
  const promoted = [...tables.B.slice(0,2), ...tables.C.slice(0,2)];
  const winners = [tables.B[0], tables.C[0]].map((row, idx) => rowsToTeams([row], competition.groups[idx === 0 ? 'B' : 'C'])[0]);
  const finals = buildFinalRounds(winners[0], winners[1]);
  nextFixtures[indexes.finalStart] = finals[0]; nextFixtures[indexes.finalEnd] = finals[1];
  nextFixtures = autoplayRange(nextFixtures, indexes.finalStart, indexes.finalEnd, `${competition.season}|serie-c-final`);
  const champion = decideFinal(nextFixtures, indexes, `${competition.season}|serie-c-final`);
  return {
    fixtures:nextFixtures,
    groupTables:tables,
    promotedCanonicalIds:canonicalIds(promoted, [...(competition.groups.B || []), ...(competition.groups.C || [])]),
    championCanonicalId:canonicalIdOf(champion) || null,
  };
}

export function initializeSerieCCompetition({ userTeam, userCanonicalId, cpuTeams = [], season = 2026 } = {}) {
  const format = getSerieCFormat(season);
  if (!format) return null;
  const cleanCpu = (Array.isArray(cpuTeams) ? cpuTeams : []).filter((team) => team && idOf(team) !== 'user' && idOf(team) !== String(userCanonicalId || ''));
  const participant = { ...userTeam, id:'user', teamId:userCanonicalId || userTeam?.teamId || null, canonicalTeamId:userCanonicalId || userTeam?.teamId || null, isPlayer:true };
  const teams = [participant, ...cleanCpu].slice(0, format.teamCount);
  if (teams.length !== format.teamCount) return null;
  const firstFixtures = generateSingleRoundFixtures(teams);
  if (firstFixtures.length !== format.firstPhaseRounds) return null;
  const fixtures = [...firstFixtures, ...Array.from({ length:format.totalRounds - firstFixtures.length }, emptyRound)];
  const table = generateInitialTable(teams);
  return {
    teams,
    table,
    fixtures,
    competition:{
      version:SERIE_C_COMPETITION_VERSION,
      format:format.format,
      season:format.season,
      teamCount:format.teamCount,
      firstPhaseRounds:format.firstPhaseRounds,
      quadrangularRounds:format.quadrangularRounds,
      totalRounds:format.totalRounds,
      phase:'first',
      phaseLabel:'1ª Fase · Grupo Único',
      firstPhaseTable:table,
      qualifiers:[],
      relegatedCanonicalIds:[],
      groups:null,
      groupTables:null,
      userGroup:null,
      promotedCanonicalIds:[],
      championCanonicalId:null,
      userStatus:'active',
      userPromoted:false,
      userChampion:false,
    },
  };
}

export function advanceSerieCCompetitionAfterRound(state = {}, justPlayedLeagueIdx = null) {
  const comp = state?.serieCCompetition;
  const indexes = phaseIndexes(comp?.season);
  if (state?.serie !== 'C' || !comp || comp.version !== SERIE_C_COMPETITION_VERSION || !indexes) return state;
  const idx = Number(justPlayedLeagueIdx);
  if (!Number.isInteger(idx) || idx < 0) return state;
  let fixtures = (state.fixtures || []).map((round) => [...(round || [])]);
  let competition = { ...comp };

  if (idx <= indexes.firstEnd) {
    const firstTable = firstPhaseTable(state.teams || [], fixtures, indexes.firstPhaseRounds);
    competition.firstPhaseTable = firstTable;
    if (idx < indexes.firstEnd) return { ...state, table:firstTable, serieCCompetition:competition };

    const qualifiers = firstTable.slice(0, 8);
    const relegated = firstTable.slice(-2);
    const groups = buildQuadrangular(qualifiers, state.teams || []);
    const userGroup = userGroupOf(groups);
    competition = {
      ...competition,
      qualifiers:qualifiers.map((row) => ({ ...row })),
      relegatedCanonicalIds:canonicalIds(relegated, state.teams || []),
      groups,
      userGroup,
      phase:userGroup ? 'quadrangular' : 'finished-for-user',
      phaseLabel:userGroup ? `2ª Fase · Grupo ${userGroup}` : 'Eliminado na 1ª Fase',
      userStatus:userGroup ? 'active' : 'eliminated-first',
    };
    const groupRounds = mergeGroupRounds(generateFixtures(groups.B), generateFixtures(groups.C), indexes.quadrangularRounds);
    groupRounds.forEach((round, offset) => { fixtures[indexes.quadrangularStart + offset] = round; });
    if (!userGroup) {
      const done = finishCpuStages(competition, fixtures);
      competition = {
        ...competition,
        groupTables:done.groupTables,
        promotedCanonicalIds:done.promotedCanonicalIds,
        championCanonicalId:done.championCanonicalId,
      };
      return { ...state, table:firstTable, fixtures:done.fixtures, serieCCompetition:competition };
    }
    const groupTables = { B:generateInitialTable(groups.B), C:generateInitialTable(groups.C) };
    competition.groupTables = groupTables;
    return { ...state, table:groupTables[userGroup], fixtures, serieCCompetition:competition };
  }

  if (idx >= indexes.quadrangularStart && idx <= indexes.quadrangularEnd && competition.groups) {
    const groupTables = {
      B:rebuildGroupTable(competition.groups.B, fixtures, indexes.quadrangularStart, indexes.quadrangularEnd, 'B'),
      C:rebuildGroupTable(competition.groups.C, fixtures, indexes.quadrangularStart, indexes.quadrangularEnd, 'C'),
    };
    competition.groupTables = groupTables;
    const userTable = groupTables[competition.userGroup] || state.table;
    if (idx < indexes.quadrangularEnd) return { ...state, table:userTable, serieCCompetition:competition };

    const promotedRows = [...groupTables.B.slice(0,2), ...groupTables.C.slice(0,2)];
    competition.promotedCanonicalIds = canonicalIds(promotedRows, [...(competition.groups.B || []), ...(competition.groups.C || [])]);
    const userCanonical = String(state.club?.existingTeamId || state.club?.teamId || '');
    competition.userPromoted = competition.promotedCanonicalIds.includes(userCanonical);
    const winnerB = rowsToTeams([groupTables.B[0]], competition.groups.B)[0];
    const winnerC = rowsToTeams([groupTables.C[0]], competition.groups.C)[0];
    const finalRounds = buildFinalRounds(winnerB, winnerC);
    fixtures[indexes.finalStart] = finalRounds[0]; fixtures[indexes.finalEnd] = finalRounds[1];
    const userInFinal = idOf(winnerB) === 'user' || idOf(winnerC) === 'user';
    if (!userInFinal) {
      fixtures = autoplayRange(fixtures, indexes.finalStart, indexes.finalEnd, `${competition.season}|serie-c-final`);
      competition.championCanonicalId = canonicalIdOf(decideFinal(fixtures, indexes, `${competition.season}|serie-c-final`)) || null;
      competition.phase = 'finished'; competition.phaseLabel = 'Encerrada';
      competition.userStatus = competition.userPromoted ? 'promoted' : 'eliminated-second';
      return { ...state, table:userTable, fixtures, serieCCompetition:competition };
    }
    competition.phase = 'final'; competition.phaseLabel = 'Final';
    return { ...state, table:userTable, fixtures, serieCCompetition:competition };
  }

  if (idx === indexes.finalEnd && competition.phase === 'final') {
    const champion = decideFinal(fixtures, indexes, `${competition.season}|serie-c-final`);
    competition.championCanonicalId = canonicalIdOf(champion) || null;
    competition.userChampion = idOf(champion) === 'user';
    competition.userPromoted = true;
    competition.userStatus = competition.userChampion ? 'champion' : 'promoted';
    competition.phase = 'finished'; competition.phaseLabel = 'Encerrada';
    return { ...state, serieCCompetition:competition };
  }
  return state;
}

export function getSerieCPhaseLabel(state = {}, leagueIdx = null) {
  const comp = state?.serieCCompetition;
  const indexes = phaseIndexes(comp?.season);
  if (state?.serie !== 'C' || !comp || !indexes) return null;
  const idx = leagueIdx == null ? Number(state.leagueRound) || 0 : Number(leagueIdx);
  if (idx <= indexes.firstEnd) return '1ª Fase · Grupo Único';
  if (idx <= indexes.quadrangularEnd) return comp.userGroup ? `2ª Fase · Grupo ${comp.userGroup}` : '2ª Fase';
  if (idx <= indexes.finalEnd) return 'Final';
  return comp.phaseLabel || 'Série C';
}

export function isSerieCLeagueSlotInactive(state = {}, leagueIdx = null) {
  if (state?.serie !== 'C' || !state?.serieCCompetition) return false;
  const idx = Number(leagueIdx);
  if (!Number.isInteger(idx)) return false;
  const matches = state.fixtures?.[idx] || [];
  return !matches.some((match) => idOf(match?.home) === 'user' || idOf(match?.away) === 'user');
}

export function getSerieCUserOutcome(state = {}) {
  const comp = state?.serieCCompetition;
  if (state?.serie !== 'C' || !comp) return null;
  const canonical = String(state.club?.existingTeamId || state.club?.teamId || '');
  const firstPosition = (comp.firstPhaseTable || []).findIndex((row) => idOf(row) === 'user') + 1;
  const groupPosition = comp.userGroup ? (comp.groupTables?.[comp.userGroup] || []).findIndex((row) => idOf(row) === 'user') + 1 : 0;
  return {
    firstPosition,
    group:comp.userGroup || null,
    groupPosition,
    promoted:Boolean(comp.userPromoted || comp.promotedCanonicalIds?.includes(canonical)),
    relegated:Boolean(comp.relegatedCanonicalIds?.includes(canonical)),
    champion:Boolean(comp.userChampion || (canonical && comp.championCanonicalId === canonical)),
    status:comp.userStatus || 'active',
    promotedCanonicalIds:[...(comp.promotedCanonicalIds || [])],
    relegatedCanonicalIds:[...(comp.relegatedCanonicalIds || [])],
    championCanonicalId:comp.championCanonicalId || null,
  };
}

export function simulateCpuSerieCOutcome(cpuTeams = [], season = 2026) {
  const indexes = phaseIndexes(season);
  if (!indexes || !Array.isArray(cpuTeams) || cpuTeams.length !== indexes.teamCount) return null;
  let fixtures = generateSingleRoundFixtures(cpuTeams);
  fixtures = autoplayRange(fixtures, 0, indexes.firstEnd, `${season}|serie-c-first`);
  const firstTable = firstPhaseTable(cpuTeams, fixtures, indexes.firstPhaseRounds);
  const groups = buildQuadrangular(firstTable.slice(0,8), cpuTeams);
  const expanded = [...fixtures, ...Array.from({ length:indexes.totalRounds - fixtures.length }, emptyRound)];
  mergeGroupRounds(generateFixtures(groups.B), generateFixtures(groups.C), indexes.quadrangularRounds).forEach((round, offset) => { expanded[indexes.quadrangularStart + offset] = round; });
  const comp = { season, groups };
  const done = finishCpuStages(comp, expanded);
  return {
    firstPhaseTable:firstTable,
    promotedCanonicalIds:done.promotedCanonicalIds,
    relegatedCanonicalIds:canonicalIds(firstTable.slice(-2), cpuTeams),
    championCanonicalId:done.championCanonicalId,
  };
}

export default {
  initializeSerieCCompetition,
  advanceSerieCCompetitionAfterRound,
  getSerieCPhaseLabel,
  getSerieCUserOutcome,
  isSerieCLeagueSlotInactive,
  simulateCpuSerieCOutcome,
  getSerieCFormat,
};

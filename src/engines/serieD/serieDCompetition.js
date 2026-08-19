import { getClubCatalogEntry, getSeriesTeams2026 } from '../../data/clubCatalog.js';
import { SERIE_D_2026_GROUPS, getSerieD2026GroupForClub } from '../../data/serieD2026.js';
import { generateFixtures, generateInitialTable, rebuildLeagueTable, parseLeagueResult } from '../core/leagueEngine.js';

export const SERIE_D_COMPETITION_VERSION = 1;
export const SERIE_D_MAX_LEAGUE_ROUNDS = 22;
export const SERIE_D_GROUP_ROUNDS = 10;
export const SERIE_D_PHASES = Object.freeze({
  groups:{ key:'groups', label:'1ª Fase', start:0, end:9 },
  r64:{ key:'r64', label:'2ª Fase', start:10, end:11 },
  r32:{ key:'r32', label:'3ª Fase', start:12, end:13 },
  r16:{ key:'r16', label:'4ª Fase', start:14, end:15 },
  qf:{ key:'qf', label:'Quartas de Final', start:16, end:17 },
  access:{ key:'access', label:'Semifinais / Playoffs de Acesso', start:18, end:19 },
  final:{ key:'final', label:'Final', start:20, end:21 },
});

const idOf = (team) => team == null ? null : String(typeof team === 'object' ? team.id : team);
const canonicalIdOf = (team) => team?.id === 'user' ? String(team.teamId || team.canonicalTeamId || '') : idOf(team);
const hasExpandedAccessPlayoffs = (season) => Number(season) <= 2027;
const cloneTeam = (team) => ({ ...team, isPlayer: team?.id === 'user' || team?.isPlayer === true });
const emptyRound = () => [];

function hash01(value) {
  const text = String(value ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0x100000000;
}

function teamStrength(team) { return Number(team?.strength) || 55; }
function deterministicScore(home, away, seed = '') {
  const diff = (teamStrength(home) - teamStrength(away)) / 10;
  const homeNoise = hash01(`${seed}|h|${canonicalIdOf(home)}`);
  const awayNoise = hash01(`${seed}|a|${canonicalIdOf(away)}`);
  const homeGoals = Math.max(0, Math.min(5, Math.floor(0.7 + diff * 0.20 + homeNoise * 2.8)));
  const awayGoals = Math.max(0, Math.min(5, Math.floor(0.55 - diff * 0.16 + awayNoise * 2.6)));
  return `${homeGoals} - ${awayGoals}`;
}

function withAutoResult(match, seed) {
  if (!match || match.played === true) return match;
  return { ...match, played:true, result:deterministicScore(match.home, match.away, seed), events:[] };
}

function mergeGroupsIntoRounds(groupFixtures) {
  const rounds = Array.from({ length:SERIE_D_GROUP_ROUNDS }, emptyRound);
  Object.values(groupFixtures).forEach((fixtures) => {
    fixtures.forEach((round, index) => rounds[index].push(...round.map((match) => ({ ...match }))));
  });
  return rounds;
}

function normalizeDTeams(cpuTeams = [], season = 2026) {
  const source = (Array.isArray(cpuTeams) ? cpuTeams : []).filter((team) => team && team.id !== 'user');
  const byId = new Map(source.map((team) => [String(team?.id), team]));
  if (Number(season) === 2026) {
    return getSeriesTeams2026('D').map((base) => ({ ...base, ...(byId.get(String(base.id)) || {}), isPlayer:false }));
  }
  const seen = new Set();
  return source.reduce((result, team) => {
    const id = String(team.id || '');
    if (!id || seen.has(id)) return result;
    seen.add(id);
    const catalog = getClubCatalogEntry(id);
    result.push({ ...(catalog || {}), ...team, id, isPlayer:false });
    return result;
  }, []);
}


function buildGroups({ userTeam, userCanonicalId, cpuTeams, season = 2026 }) {
  const all = normalizeDTeams(cpuTeams, season);
  const byId = new Map(all.map((team) => [String(team.id), team]));
  const userId = String(userCanonicalId || userTeam?.teamId || '');
  const useOfficial = Number(season) === 2026 && Boolean(getSerieD2026GroupForClub(userId));
  const groups = {};

  if (useOfficial) {
    Object.entries(SERIE_D_2026_GROUPS).forEach(([groupKey, ids]) => {
      groups[groupKey] = ids.map((id) => {
        if (String(id) === userId) return { ...userTeam, id:'user', teamId:userId, canonicalTeamId:userId, isPlayer:true };
        return cloneTeam(byId.get(String(id)) || getClubCatalogEntry(id) || { id, name:id, strength:55 });
      });
    });
    return groups;
  }

  const ordered = [...all]
    .filter((team) => String(team.id) !== userId)
    .sort((a, b) => hash01(`${season}|${a.id}`) - hash01(`${season}|${b.id}`));
  const participant = { ...userTeam, id:'user', teamId:userId || null, canonicalTeamId:userId || null, isPlayer:true };
  ordered.splice(Math.floor(hash01(`${season}|user-group`) * Math.max(1, ordered.length + 1)), 0, participant);
  const groupKeys = Object.keys(SERIE_D_2026_GROUPS);
  groupKeys.forEach((key, index) => { groups[key] = ordered.slice(index * 6, index * 6 + 6); });
  return groups;
}

function buildGroupTables(groups, fixtures) {
  const tables = {};
  Object.entries(groups || {}).forEach(([key, teams]) => {
    const ids = new Set(teams.map(idOf));
    const filtered = (fixtures || []).slice(0, SERIE_D_GROUP_ROUNDS).map((round) =>
      (round || []).filter((match) => ids.has(idOf(match.home)) && ids.has(idOf(match.away))));
    tables[key] = rebuildLeagueTable(generateInitialTable(teams), filtered);
  });
  return tables;
}

function groupQualifiers(groupTables = {}) {
  const qualifiers = {};
  Object.entries(groupTables).forEach(([key, table]) => { qualifiers[key] = (table || []).slice(0, 4); });
  return qualifiers;
}

function entityForRow(row, teamsById) {
  return cloneTeam(teamsById.get(idOf(row)) || row);
}

function firstKnockoutTies(qualifiers, teamsById) {
  const keys = Object.keys(SERIE_D_2026_GROUPS);
  const ties = [];
  for (let i = 0; i < keys.length; i += 2) {
    const a = qualifiers[keys[i]] || [];
    const b = qualifiers[keys[i + 1]] || [];
    const pairings = [[a[0], b[3]], [a[1], b[2]], [b[0], a[3]], [b[1], a[2]]];
    pairings.forEach(([homeRow, awayRow], pairIndex) => {
      if (!homeRow || !awayRow) return;
      ties.push({
        id:`r64-${i / 2}-${pairIndex}`,
        home:entityForRow(homeRow, teamsById), away:entityForRow(awayRow, teamsById),
      });
    });
  }
  return ties;
}

function pairAdjacent(teams, prefix) {
  const ties = [];
  for (let i = 0; i + 1 < teams.length; i += 2) {
    ties.push({ id:`${prefix}-${i / 2}`, home:cloneTeam(teams[i]), away:cloneTeam(teams[i + 1]) });
  }
  return ties;
}

function tiesToRounds(ties = []) {
  return [
    ties.map((tie) => ({ tieId:tie.id, home:cloneTeam(tie.home), away:cloneTeam(tie.away), played:false, result:null })),
    ties.map((tie) => ({ tieId:tie.id, home:cloneTeam(tie.away), away:cloneTeam(tie.home), played:false, result:null })),
  ];
}

function decideTie(tie, leg1, leg2, seed) {
  const s1 = parseLeagueResult(leg1?.result);
  const s2 = parseLeagueResult(leg2?.result);
  if (!s1 || !s2) return null;
  const homeAgg = s1.homeGoals + s2.awayGoals;
  const awayAgg = s1.awayGoals + s2.homeGoals;
  if (homeAgg > awayAgg) return { winner:tie.home, loser:tie.away, aggregate:`${homeAgg}-${awayAgg}`, decidedBy:'aggregate' };
  if (awayAgg > homeAgg) return { winner:tie.away, loser:tie.home, aggregate:`${homeAgg}-${awayAgg}`, decidedBy:'aggregate' };
  const homeWins = hash01(`${seed}|pens|${canonicalIdOf(tie.home)}|${canonicalIdOf(tie.away)}`) >= 0.5;
  return { winner:homeWins ? tie.home : tie.away, loser:homeWins ? tie.away : tie.home, aggregate:`${homeAgg}-${awayAgg}`, decidedBy:'penalties' };
}

function resolveStageTies(ties, fixtures, startIndex, seed) {
  return (ties || []).map((tie) => {
    const leg1 = (fixtures[startIndex] || []).find((match) => match.tieId === tie.id);
    const leg2 = (fixtures[startIndex + 1] || []).find((match) => match.tieId === tie.id);
    const decision = decideTie(tie, leg1, leg2, `${seed}|${tie.id}`);
    return decision ? { ...tie, ...decision } : { ...tie };
  });
}

function allTeamsMap(groups = {}) {
  return new Map(Object.values(groups).flat().map((team) => [idOf(team), team]));
}

function userIsIn(teams = []) { return (teams || []).some((team) => idOf(team) === 'user'); }
function canonicalizePromoted(teams = []) { return teams.map(canonicalIdOf).filter(Boolean); }

function autoplayRounds(fixtures, start, end, seed) {
  const next = fixtures.map((round) => [...(round || [])]);
  for (let index = start; index <= end; index += 1) {
    next[index] = (next[index] || []).map((match, matchIndex) => withAutoResult(match, `${seed}|r${index}|m${matchIndex}`));
  }
  return next;
}

function buildInitialCompetition({ userTeam, userCanonicalId, cpuTeams, season }) {
  const groups = buildGroups({ userTeam, userCanonicalId, cpuTeams, season });
  const userGroup = Object.entries(groups).find(([, teams]) => userIsIn(teams))?.[0] || null;
  const groupFixtures = Object.fromEntries(Object.entries(groups).map(([key, teams]) => [key, generateFixtures(teams)]));
  const firstRounds = mergeGroupsIntoRounds(groupFixtures);
  const fixtures = [...firstRounds, ...Array.from({ length:SERIE_D_MAX_LEAGUE_ROUNDS - firstRounds.length }, emptyRound)];
  const groupTables = buildGroupTables(groups, fixtures);
  return {
    version:SERIE_D_COMPETITION_VERSION,
    format:'2026-96x16', season:Number(season) || 2026,
    phase:'groups', phaseLabel:'1ª Fase', userGroup,
    groups, groupTables, qualifiers:null,
    ties:{}, promotedCanonicalIds:[], championCanonicalId:null,
    userStatus:'active', userPromoted:false, userChampion:false,
  };
}

export function initializeSerieDCompetition({ userTeam, userCanonicalId, cpuTeams = [], season = 2026 } = {}) {
  const competition = buildInitialCompetition({ userTeam, userCanonicalId, cpuTeams, season });
  const userTeams = competition.groups[competition.userGroup] || [];
  return {
    competition,
    teams:userTeams,
    table:competition.groupTables[competition.userGroup] || generateInitialTable(userTeams),
    fixtures:[...mergeGroupsIntoRounds(Object.fromEntries(Object.entries(competition.groups).map(([key, teams]) => [key, generateFixtures(teams)]))), ...Array.from({ length:12 }, emptyRound)],
  };
}

function prepareStage(fixtures, ties, startIndex) {
  const next = fixtures.map((round) => [...(round || [])]);
  const [leg1, leg2] = tiesToRounds(ties);
  next[startIndex] = leg1;
  next[startIndex + 1] = leg2;
  return next;
}

function finishCompetitionFromStage(state, comp, fixtures, stageKey, ties, startIndex) {
  let nextFixtures = fixtures;
  let nextComp = { ...comp, ties:{ ...(comp.ties || {}), [stageKey]:ties } };
  const seed = `${comp.season}|${stageKey}`;
  nextFixtures = autoplayRounds(nextFixtures, startIndex, startIndex + 1, seed);
  const resolved = resolveStageTies(ties, nextFixtures, startIndex, seed);
  return { nextFixtures, resolved, nextComp:{ ...nextComp, ties:{ ...nextComp.ties, [stageKey]:resolved } } };
}

function autoplayRemaining(state, comp, fixtures, startPhase = 'r64') {
  let c = { ...comp, ties:{ ...(comp.ties || {}) } };
  let f = fixtures.map((round) => [...(round || [])]);
  if (startPhase === 'access') {
    const accessTies = c.ties?.access || [];
    f = prepareStage(f, accessTies, 18);
    const accessFinished = finishCompetitionFromStage(state, c, f, 'access', accessTies, 18);
    f = accessFinished.nextFixtures; c = accessFinished.nextComp;
    const semiResolved = accessFinished.resolved.filter((tie) => tie.id.startsWith('sf-'));
    const poResolved = accessFinished.resolved.filter((tie) => tie.id.startsWith('po-'));
    c.promotedCanonicalIds = [...new Set([...c.promotedCanonicalIds, ...canonicalizePromoted(poResolved.map((tie) => tie.winner))])];
    const finalTies = pairAdjacent(semiResolved.map((tie) => tie.winner).filter(Boolean), 'final');
    f = prepareStage(f, finalTies, 20);
    const finalFinished = finishCompetitionFromStage(state, c, f, 'final', finalTies, 20);
    f = finalFinished.nextFixtures; c = finalFinished.nextComp;
    c.championCanonicalId = canonicalIdOf(finalFinished.resolved[0]?.winner) || null;
    c.phase = 'finished'; c.phaseLabel = 'Encerrada';
    return { competition:c, fixtures:f };
  }
  const sequence = [
    ['r64',10,'r32'], ['r32',12,'r16'], ['r16',14,'qf'], ['qf',16,'access'],
  ];
  let current = startPhase;
  let sourceTeams = null;
  for (const [stage, start, nextStage] of sequence) {
    if (stage !== current && sourceTeams == null) continue;
    let ties = c.ties?.[stage] || [];
    if (!ties.length && sourceTeams) ties = pairAdjacent(sourceTeams, stage);
    if (!ties.length) break;
    f = prepareStage(f, ties, start);
    const finished = finishCompetitionFromStage(state, c, f, stage, ties, start);
    f = finished.nextFixtures; c = finished.nextComp;
    const winners = finished.resolved.map((tie) => tie.winner).filter(Boolean);
    if (stage === 'qf') {
      const losers = finished.resolved.map((tie) => tie.loser).filter(Boolean);
      c.promotedCanonicalIds = [...new Set([...c.promotedCanonicalIds, ...canonicalizePromoted(winners)])];
      const semiTies = pairAdjacent(winners, 'sf');
      const playoffTies = hasExpandedAccessPlayoffs(c.season) ? pairAdjacent(losers, 'po') : [];
      const accessTies = [...semiTies, ...playoffTies];
      f = prepareStage(f, accessTies, 18);
      const accessFinished = finishCompetitionFromStage(state, c, f, 'access', accessTies, 18);
      f = accessFinished.nextFixtures; c = accessFinished.nextComp;
      const semiResolved = accessFinished.resolved.filter((tie) => tie.id.startsWith('sf-'));
      const poResolved = accessFinished.resolved.filter((tie) => tie.id.startsWith('po-'));
      c.promotedCanonicalIds = [...new Set([...c.promotedCanonicalIds, ...canonicalizePromoted(poResolved.map((tie) => tie.winner))])];
      const finalTies = pairAdjacent(semiResolved.map((tie) => tie.winner).filter(Boolean), 'final');
      f = prepareStage(f, finalTies, 20);
      const finalFinished = finishCompetitionFromStage(state, c, f, 'final', finalTies, 20);
      f = finalFinished.nextFixtures; c = finalFinished.nextComp;
      c.championCanonicalId = canonicalIdOf(finalFinished.resolved[0]?.winner) || null;
      c.phase = 'finished'; c.phaseLabel = 'Encerrada';
      break;
    }
    sourceTeams = winners;
    current = nextStage;
  }
  return { competition:c, fixtures:f };
}

export function advanceSerieDCompetitionAfterRound(state = {}, justPlayedLeagueIdx = null) {
  const comp = state?.serieDCompetition;
  if (state?.serie !== 'D' || !comp || comp.version !== SERIE_D_COMPETITION_VERSION) return state;
  const idx = Number(justPlayedLeagueIdx);
  if (!Number.isInteger(idx) || idx < 0) return state;
  let fixtures = (state.fixtures || []).map((round) => [...(round || [])]);
  let competition = { ...comp, ties:{ ...(comp.ties || {}) } };

  if (idx <= 9) {
    const groupTables = buildGroupTables(comp.groups, fixtures);
    competition.groupTables = groupTables;
    const table = groupTables[comp.userGroup] || state.table;
    if (idx < 9) return { ...state, table, serieDCompetition:competition };
    const qualifiers = groupQualifiers(groupTables);
    competition.qualifiers = qualifiers;
    const teamsById = allTeamsMap(comp.groups);
    const ties = firstKnockoutTies(qualifiers, teamsById);
    competition.ties.r64 = ties;
    const userQualified = Object.values(qualifiers).flat().some((row) => idOf(row) === 'user');
    if (!userQualified) {
      competition.userStatus = 'eliminated-groups';
      const auto = autoplayRemaining(state, competition, prepareStage(fixtures, ties, 10), 'r64');
      return { ...state, table, fixtures:auto.fixtures, serieDCompetition:{ ...auto.competition, userStatus:'eliminated-groups' } };
    }
    competition.phase = 'r64'; competition.phaseLabel = SERIE_D_PHASES.r64.label;
    fixtures = prepareStage(fixtures, ties, 10);
    return { ...state, table, fixtures, serieDCompetition:competition };
  }

  const stages = [
    { key:'r64', end:11, next:'r32', nextStart:12 },
    { key:'r32', end:13, next:'r16', nextStart:14 },
    { key:'r16', end:15, next:'qf', nextStart:16 },
  ];
  const stage = stages.find((entry) => entry.end === idx);
  if (stage) {
    const ties = competition.ties?.[stage.key] || [];
    const resolved = resolveStageTies(ties, fixtures, idx - 1, `${competition.season}|${stage.key}`);
    competition.ties[stage.key] = resolved;
    const winners = resolved.map((tie) => tie.winner).filter(Boolean);
    const userAlive = userIsIn(winners);
    const nextTies = pairAdjacent(winners, stage.next);
    competition.ties[stage.next] = nextTies;
    fixtures = prepareStage(fixtures, nextTies, stage.nextStart);
    if (!userAlive) {
      competition.userStatus = `eliminated-${stage.key}`;
      const auto = autoplayRemaining(state, competition, fixtures, stage.next);
      return { ...state, fixtures:auto.fixtures, serieDCompetition:{ ...auto.competition, userStatus:competition.userStatus } };
    }
    competition.phase = stage.next; competition.phaseLabel = SERIE_D_PHASES[stage.next].label;
    return { ...state, fixtures, serieDCompetition:competition };
  }

  if (idx === 17) {
    const resolved = resolveStageTies(competition.ties?.qf || [], fixtures, 16, `${competition.season}|qf`);
    competition.ties.qf = resolved;
    const winners = resolved.map((tie) => tie.winner).filter(Boolean);
    const losers = resolved.map((tie) => tie.loser).filter(Boolean);
    competition.promotedCanonicalIds = [...new Set(canonicalizePromoted(winners))];
    competition.userPromoted = userIsIn(winners);
    const playoffTies = hasExpandedAccessPlayoffs(competition.season) ? pairAdjacent(losers, 'po') : [];
    const accessTies = [...pairAdjacent(winners, 'sf'), ...playoffTies];
    competition.ties.access = accessTies;
    competition.phase = 'access';
    competition.phaseLabel = hasExpandedAccessPlayoffs(competition.season) ? SERIE_D_PHASES.access.label : 'Semifinais';
    fixtures = prepareStage(fixtures, accessTies, 18);
    if (!competition.userPromoted && !hasExpandedAccessPlayoffs(competition.season)) {
      competition.userStatus = 'eliminated-qf';
      const auto = autoplayRemaining(state, competition, fixtures, 'access');
      return { ...state, fixtures:auto.fixtures, serieDCompetition:{ ...auto.competition, userStatus:'eliminated-qf' } };
    }
    return { ...state, fixtures, serieDCompetition:competition };
  }

  if (idx === 19) {
    const resolved = resolveStageTies(competition.ties?.access || [], fixtures, 18, `${competition.season}|access`);
    competition.ties.access = resolved;
    const semiWinners = resolved.filter((tie) => tie.id.startsWith('sf-')).map((tie) => tie.winner).filter(Boolean);
    const playoffWinners = resolved.filter((tie) => tie.id.startsWith('po-')).map((tie) => tie.winner).filter(Boolean);
    competition.promotedCanonicalIds = [...new Set([...competition.promotedCanonicalIds, ...canonicalizePromoted(playoffWinners)])];
    competition.userPromoted = competition.promotedCanonicalIds.includes(String(state.club?.existingTeamId || state.club?.teamId || ''));
    const finalTies = pairAdjacent(semiWinners, 'final');
    competition.ties.final = finalTies;
    fixtures = prepareStage(fixtures, finalTies, 20);
    const userInFinal = userIsIn(semiWinners);
    if (!userInFinal) {
      fixtures = autoplayRounds(fixtures, 20, 21, `${competition.season}|final`);
      const finalResolved = resolveStageTies(finalTies, fixtures, 20, `${competition.season}|final`);
      competition.ties.final = finalResolved;
      competition.championCanonicalId = canonicalIdOf(finalResolved[0]?.winner) || null;
      competition.phase = 'finished'; competition.phaseLabel = 'Encerrada';
      competition.userStatus = competition.userPromoted ? 'promoted' : 'eliminated-access';
    } else {
      competition.phase = 'final'; competition.phaseLabel = SERIE_D_PHASES.final.label;
    }
    return { ...state, fixtures, serieDCompetition:competition };
  }

  if (idx === 21) {
    const resolved = resolveStageTies(competition.ties?.final || [], fixtures, 20, `${competition.season}|final`);
    competition.ties.final = resolved;
    competition.championCanonicalId = canonicalIdOf(resolved[0]?.winner) || null;
    competition.userChampion = idOf(resolved[0]?.winner) === 'user';
    competition.userPromoted = true;
    competition.userStatus = competition.userChampion ? 'champion' : 'promoted';
    competition.phase = 'finished'; competition.phaseLabel = 'Encerrada';
    return { ...state, serieDCompetition:competition };
  }

  return state;
}

export function getSerieDPhaseLabel(state = {}, leagueIdx = null) {
  if (state?.serie !== 'D' || !state?.serieDCompetition) return null;
  const index = leagueIdx == null ? Number(state.leagueRound) || 0 : Number(leagueIdx);
  const phase = Object.values(SERIE_D_PHASES).find((entry) => index >= entry.start && index <= entry.end);
  if (phase?.key === 'groups') return `${phase.label} · ${state.serieDCompetition.userGroup || 'Grupo'}`;
  if (phase?.key === 'access' && !hasExpandedAccessPlayoffs(state.serieDCompetition.season)) return 'Semifinais';
  return phase?.label || state.serieDCompetition.phaseLabel || 'Série D';
}

export function isSerieDLeagueSlotInactive(state = {}, leagueIdx = null) {
  if (state?.serie !== 'D' || !state?.serieDCompetition) return false;
  const idx = Number(leagueIdx);
  if (!Number.isInteger(idx)) return false;
  const matches = state.fixtures?.[idx] || [];
  return !matches.some((match) => idOf(match?.home) === 'user' || idOf(match?.away) === 'user');
}

export function getSerieDUserOutcome(state = {}) {
  const comp = state?.serieDCompetition;
  if (state?.serie !== 'D' || !comp) return null;
  const table = comp.groupTables?.[comp.userGroup] || state.table || [];
  const groupPosition = table.findIndex((row) => idOf(row) === 'user') + 1;
  const canonicalId = String(state.club?.existingTeamId || state.club?.teamId || '');
  return {
    group:comp.userGroup || null,
    groupPosition,
    promoted:Boolean(comp.userPromoted || comp.promotedCanonicalIds?.includes(canonicalId)),
    champion:Boolean(comp.userChampion || (canonicalId && comp.championCanonicalId === canonicalId)),
    status:comp.userStatus || 'active',
    promotedCanonicalIds:[...(comp.promotedCanonicalIds || [])],
    championCanonicalId:comp.championCanonicalId || null,
  };
}

export function simulateCpuSerieDOutcome(cpuTeams = [], season = 2026) {
  const teams = normalizeDTeams(cpuTeams, season);
  const fakeUser = { ...teams[0], id:'user', teamId:teams[0]?.id, canonicalTeamId:teams[0]?.id, isPlayer:true };
  const init = initializeSerieDCompetition({ userTeam:fakeUser, userCanonicalId:fakeUser.teamId, cpuTeams:teams.slice(1), season });
  let fixtures = autoplayRounds(init.fixtures, 0, 9, `${season}|groups`);
  const groupTables = buildGroupTables(init.competition.groups, fixtures);
  const qualifiers = groupQualifiers(groupTables);
  const teamsById = allTeamsMap(init.competition.groups);
  const r64 = firstKnockoutTies(qualifiers, teamsById);
  const seeded = {
    ...init.competition,
    groupTables,
    qualifiers,
    ties:{ r64 },
    phase:'r64',
    phaseLabel:SERIE_D_PHASES.r64.label,
  };
  fixtures = prepareStage(fixtures, r64, 10);
  const auto = autoplayRemaining({ serie:'D', season }, seeded, fixtures, 'r64');
  return {
    promotedCanonicalIds:[...(auto.competition?.promotedCanonicalIds || [])],
    championCanonicalId:auto.competition?.championCanonicalId || null,
    competition:auto.competition,
  };
}

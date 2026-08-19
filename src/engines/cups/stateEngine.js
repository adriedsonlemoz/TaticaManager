import { getClubCatalogEntry } from '../../data/clubCatalog.js';
import { decideTie, makeTie, simGoals } from './cupUtils.js';
import {
  STATE_2026_CONFIGS,
  STATE_EXTRA_TEAMS,
  getStateConfigForTeam,
  getStateGroupForTeam,
  getStateParticipantIds,
} from './stateConfig.js';

const statLine = (team) => ({ ...team, pts:0, w:0, d:0, l:0, gf:0, ga:0, p:0 });
const sortTable = (table = []) => [...table].sort((a, b) => (
  (b.pts || 0) - (a.pts || 0)
  || (b.w || 0) - (a.w || 0)
  || (((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0)))
  || (b.gf || 0) - (a.gf || 0)
  || String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
));

const sourceTeamId = (gameData = {}) => gameData.club?.existingTeamId || gameData.club?.teamId || null;
const teamIdentity = (team) => team?.isPlayer ? 'user' : String(team?.sourceTeamId || team?.id || '');
const sameTeam = (a, b) => Boolean(a && b && teamIdentity(a) === teamIdentity(b));

function resolveStateTeam(teamId, gameData = {}) {
  const id = String(teamId || '');
  if (id === String(sourceTeamId(gameData))) {
    const canonical = getClubCatalogEntry(id);
    return {
      id:'user', sourceTeamId:id,
      name:gameData.club?.name || canonical?.name || 'Seu clube',
      strength:Number(gameData.club?.strength) || Number(canonical?.strength) || 60,
      isPlayer:true,
    };
  }
  const canonical = getClubCatalogEntry(id);
  const fallback = STATE_EXTRA_TEAMS[id];
  const source = canonical || fallback || { id, name:id, strength:52 };
  return { id:source.id, sourceTeamId:source.id, name:source.name, strength:Number(source.strength) || 52, isPlayer:false };
}

function applyResult(tables, home, away, hg, ag) {
  const next = Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.map((row) => ({ ...row }))]));
  for (const key of Object.keys(next)) {
    next[key] = next[key].map((row) => {
      const isHome = sameTeam(row, home);
      const isAway = sameTeam(row, away);
      if (!isHome && !isAway) return row;
      const gf = isHome ? hg : ag;
      const ga = isHome ? ag : hg;
      const updated = { ...row, p:(row.p || 0) + 1, gf:(row.gf || 0) + gf, ga:(row.ga || 0) + ga };
      if (gf > ga) { updated.w = (row.w || 0) + 1; updated.pts = (row.pts || 0) + 3; }
      else if (gf < ga) updated.l = (row.l || 0) + 1;
      else { updated.d = (row.d || 0) + 1; updated.pts = (row.pts || 0) + 1; }
      return updated;
    });
  }
  return Object.fromEntries(Object.entries(next).map(([key, rows]) => [key, sortTable(rows)]));
}

function makeMatch(configKey, roundIndex, index, a, b, groupKeys = []) {
  const flip = (roundIndex + index) % 2 === 1;
  return {
    id:`${configKey}-g-${roundIndex}-${index}`,
    groupKeys, roundIndex,
    home:flip ? b : a,
    away:flip ? a : b,
    played:false, homeGoals:null, awayGoals:null,
  };
}

function buildCrossGroupRounds(config, teamsByGroup) {
  const [leftKey, rightKey] = Object.keys(config.groups || {});
  const left = teamsByGroup[leftKey] || [];
  const right = teamsByGroup[rightKey] || [];
  const count = Math.min(left.length, right.length);
  return Array.from({ length:count }, (_, roundIndex) => (
    Array.from({ length:count }, (_, index) => makeMatch(
      config.key, roundIndex, index,
      left[index], right[(index + roundIndex) % count],
      [leftKey, rightKey],
    ))
  ));
}

function buildRoundRobinRounds(config, teams = []) {
  const list = [...teams];
  if (list.length % 2 === 1) list.push(null);
  const totalRounds = Math.max(0, list.length - 1);
  const rounds = [];
  let rotation = [...list];
  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const round = [];
    for (let i = 0; i < rotation.length / 2; i += 1) {
      const a = rotation[i];
      const b = rotation[rotation.length - 1 - i];
      if (a && b) round.push(makeMatch(config.key, roundIndex, round.length, a, b, ['Geral']));
    }
    rounds.push(round);
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  return rounds;
}

// Decomposição determinística do grafo tripartido K4,4,4 em oito rodadas.
// Cada clube enfrenta exatamente uma vez todos os oito adversários das outras chaves.
const OUTSIDE_GROUP_TEMPLATE_3X4 = Object.freeze([
  [['A',0,'B',0],['A',1,'B',2],['A',2,'C',0],['A',3,'C',1],['B',1,'C',2],['B',3,'C',3]],
  [['A',0,'B',1],['A',1,'B',0],['A',2,'C',1],['A',3,'C',0],['B',2,'C',3],['B',3,'C',2]],
  [['A',0,'B',2],['A',1,'B',1],['A',2,'C',2],['A',3,'C',3],['B',0,'C',0],['B',3,'C',1]],
  [['A',0,'B',3],['A',1,'C',0],['A',2,'B',0],['A',3,'C',2],['B',1,'C',3],['B',2,'C',1]],
  [['A',0,'C',0],['A',1,'B',3],['A',2,'C',3],['A',3,'B',0],['B',1,'C',1],['B',2,'C',2]],
  [['A',0,'C',1],['A',1,'C',2],['A',2,'B',1],['A',3,'B',3],['B',0,'C',3],['B',2,'C',0]],
  [['A',0,'C',2],['A',1,'C',3],['A',2,'B',3],['A',3,'B',2],['B',0,'C',1],['B',1,'C',0]],
  [['A',0,'C',3],['A',1,'C',1],['A',2,'B',2],['A',3,'B',1],['B',0,'C',2],['B',3,'C',0]],
]);

function buildOutsideGroupRounds(config, teamsByGroup) {
  const keys = Object.keys(config.groups || {});
  if (keys.length !== 3 || keys.some((key) => (teamsByGroup[key] || []).length !== 4)) return [];
  const mapKey = Object.fromEntries(keys.map((key, index) => [['A','B','C'][index], key]));
  return OUTSIDE_GROUP_TEMPLATE_3X4.map((pairs, roundIndex) => pairs.map((pair, index) => {
    const [ga, ia, gb, ib] = pair;
    const realA = mapKey[ga];
    const realB = mapKey[gb];
    return makeMatch(config.key, roundIndex, index, teamsByGroup[realA][ia], teamsByGroup[realB][ib], [realA, realB]);
  }));
}

function buildFirstStage(config, teamsByGroup) {
  const mode = config.firstStage?.mode;
  if (mode === 'cross-groups') return buildCrossGroupRounds(config, teamsByGroup);
  if (mode === 'outside-groups') return buildOutsideGroupRounds(config, teamsByGroup);
  const teams = teamsByGroup.Geral || Object.values(teamsByGroup).flat();
  const rounds = buildRoundRobinRounds(config, teams);
  if (mode === 'partial-league') return rounds.slice(0, Math.max(1, Number(config.firstStage?.rounds) || 8));
  return rounds;
}

function buildUserGroupMatches(groupRounds = []) {
  return groupRounds.map((round, roundIndex) => {
    const match = round.find((item) => item.home?.isPlayer || item.away?.isPlayer);
    if (!match) return null;
    return {
      id:match.id,
      phase:`Classificatória ${roundIndex + 1}`,
      home:match.home,
      away:match.away,
      leg1:{ played:false, home:null, away:null, round:roundIndex + 1 },
      leg2:null,
      decided:false,
      winner:null,
    };
  }).filter(Boolean);
}

function buildCalendarEvents(config, firstStageRoundCount) {
  const events = Array.from({ length:firstStageRoundCount }, (_, roundIndex) => ({
    phase:`Classificatória ${roundIndex + 1}`, leg:'leg1', isGroup:true, stateRound:roundIndex,
  }));
  (config.knockout || []).forEach((knockoutPhase) => {
    events.push({ phase:knockoutPhase.phase, leg:'leg1', isGroup:false });
    if (knockoutPhase.legs === 2) events.push({ phase:knockoutPhase.phase, leg:'leg2', isGroup:false });
  });
  return events;
}

function simulateCpuRound(cup, roundIndex, rng) {
  let tables = cup.groupTables;
  const rounds = cup.groupRounds.map((round) => round.map((match) => ({ ...match })));
  const round = rounds[roundIndex] || [];
  round.forEach((match, index) => {
    if (match.played || match.home?.isPlayer || match.away?.isPlayer) return;
    const [hg, ag] = simGoals(match.home?.strength || 52, match.away?.strength || 52, rng);
    round[index] = { ...match, played:true, homeGoals:hg, awayGoals:ag };
    tables = applyResult(tables, match.home, match.away, hg, ag);
  });
  rounds[roundIndex] = round;
  return { tables, rounds };
}

function getUserTeam(cup) {
  return Object.values(cup.groupTables || {}).flat().find((team) => team.isPlayer)
    || { id:'user', name:cup.userTeamName || 'Seu clube', strength:60, isPlayer:true };
}

function getOverallTable(cup) {
  if (cup.groupTables?.Geral) return sortTable(cup.groupTables.Geral);
  return sortTable(Object.values(cup.groupTables || {}).flat());
}

function visibleTable(config, tables, userGroupKey) {
  if (config?.firstStage?.tableMode === 'global') {
    if (tables?.Geral) return sortTable(tables.Geral);
    return sortTable(Object.values(tables || {}).flat());
  }
  return sortTable(tables?.[userGroupKey] || tables?.Geral || []);
}

function uniqueTeams(teams = []) {
  const seen = new Set();
  return teams.filter((team) => {
    const id = teamIdentity(team);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function isDirectSemiPlayoff(qualify = {}) {
  return ['pernambuco-2026', 'direct-semi-playoff'].includes(qualify.type);
}

function qualificationSnapshot(cup, config) {
  const qualify = config.firstStage?.qualify || { type:'global-top', count:4 };
  const all = getOverallTable(cup);
  const user = all.find((team) => team.isPlayer);
  const userOverallRank = all.findIndex((team) => team.isPlayer) + 1;

  if (qualify.type === 'top-per-group') {
    const qualified = uniqueTeams(Object.values(cup.groupTables || {}).flatMap((rows) => sortTable(rows).slice(0, qualify.count || 4)));
    const userTable = sortTable(cup.groupTables?.[cup.userGroupKey] || []);
    const userRank = userTable.findIndex((team) => team.isPlayer) + 1;
    return { qualified, user, userRank, userQualified:userRank > 0 && userRank <= (qualify.count || 4), startIndex:0 };
  }

  if (qualify.type === 'group-winners-plus-best-runner-up') {
    const sortedGroups = Object.values(cup.groupTables || {}).map((rows) => sortTable(rows));
    const winners = sortedGroups.map((rows) => rows[0]).filter(Boolean);
    const bestRunner = sortTable(sortedGroups.map((rows) => rows[1]).filter(Boolean))[0];
    const qualified = sortTable(uniqueTeams([...winners, ...(bestRunner ? [bestRunner] : [])]));
    return {
      qualified, user, userRank:qualified.findIndex((team) => team.isPlayer) + 1,
      userQualified:qualified.some((team) => team.isPlayer), startIndex:0,
    };
  }

  if (isDirectSemiPlayoff(qualify)) {
    const top = all.slice(0, Math.max(qualify.playoffTo || 6, qualify.directSemi || 2));
    const rank = userOverallRank;
    if (rank >= 1 && rank <= (qualify.directSemi || 2)) return { qualified:top, user, userRank:rank, userQualified:true, startIndex:1, directSemi:true };
    if (rank >= (qualify.playoffFrom || 3) && rank <= (qualify.playoffTo || 6)) return { qualified:top, user, userRank:rank, userQualified:true, startIndex:0, directSemi:false };
    return { qualified:top, user, userRank:rank, userQualified:false, startIndex:0 };
  }

  const count = qualify.count || 4;
  const qualified = all.slice(0, count);
  return { qualified, user, userRank:userOverallRank, userQualified:userOverallRank > 0 && userOverallRank <= count, startIndex:0 };
}

function findByRank(table, rank) {
  return rank > 0 ? table[rank - 1] || null : null;
}

function firstOpponent(cup, config, snapshot) {
  const pairing = config.firstStage?.firstPairing;
  if (pairing === 'same-group') {
    const table = sortTable(cup.groupTables?.[cup.userGroupKey] || []);
    const count = Number(config.firstStage?.qualify?.count) || 4;
    return findByRank(table, count + 1 - snapshot.userRank);
  }
  if (['pernambuco-playoff', 'direct-semi-playoff'].includes(pairing) && snapshot.startIndex === 0) {
    const qualify = config.firstStage?.qualify || {};
    return findByRank(getOverallTable(cup), (Number(qualify.playoffFrom) || 3) + (Number(qualify.playoffTo) || 6) - snapshot.userRank);
  }
  const qualified = sortTable(snapshot.qualified || []);
  if (snapshot.startIndex === 1 && ['pernambuco-playoff', 'direct-semi-playoff'].includes(pairing)) {
    const directSemi = Number(config.firstStage?.qualify?.directSemi) || 2;
    const playoffPool = qualified.slice(directSemi).filter((team) => !team.isPlayer);
    return playoffPool.at(-1) || playoffPool[0] || qualified.find((team) => !team.isPlayer) || null;
  }
  const seed = qualified.findIndex((team) => team.isPlayer) + 1;
  return findByRank(qualified, qualified.length + 1 - seed) || qualified.find((team) => !team.isPlayer) || null;
}

function qualifiedCpuTeams(cup) {
  return (cup.qualifiedTeams || []).filter((team) => !team.isPlayer);
}

function pickNextOpponent(cup) {
  const used = new Set();
  (cup.history || []).forEach((item) => {
    const tie = item?.home && item?.away ? item : null;
    if (!tie) return;
    if (tie.home?.isPlayer && tie.away?.sourceTeamId) used.add(tie.away.sourceTeamId);
    if (tie.away?.isPlayer && tie.home?.sourceTeamId) used.add(tie.home.sourceTeamId);
  });
  const candidates = qualifiedCpuTeams(cup).filter((team) => !used.has(team.sourceTeamId || team.id));
  return [...candidates].sort((a, b) => (Number(b.strength) || 0) - (Number(a.strength) || 0))[0]
    || qualifiedCpuTeams(cup)[0]
    || getOverallTable(cup).find((team) => !team.isPlayer)
    || null;
}

function makeStateTie(cup, phaseIndex, opponent, rng = Math.random) {
  const config = STATE_2026_CONFIGS[cup.competitionKey];
  const knockoutPhase = config?.knockout?.[phaseIndex];
  if (!knockoutPhase || !opponent) return null;
  const user = getUserTeam(cup);
  const qualified = sortTable(cup.qualifiedTeams || []);
  const userSeed = qualified.findIndex((team) => team.isPlayer) + 1;
  const opponentSeed = qualified.findIndex((team) => sameTeam(team, opponent)) + 1;
  const userHomeFirst = knockoutPhase.legs === 1
    ? (userSeed > 0 && opponentSeed > 0 ? userSeed < opponentSeed : phaseIndex % 2 === 0)
    : !(userSeed > 0 && opponentSeed > 0 ? userSeed < opponentSeed : phaseIndex % 2 === 0);
  return makeTie(
    userHomeFirst ? user : { ...opponent, isPlayer:false },
    userHomeFirst ? { ...opponent, isPlayer:false } : user,
    knockoutPhase.phase,
    0,
    1,
    knockoutPhase.legs === 2 ? 2 : null,
    rng,
  );
}

function buildTeamsAndTables(config, gameData) {
  if (config.groups) {
    const teamsByGroup = Object.fromEntries(Object.entries(config.groups).map(([key, ids]) => [
      key, ids.map((id) => resolveStateTeam(id, gameData)),
    ]));
    return {
      teamsByGroup,
      groupTables:Object.fromEntries(Object.entries(teamsByGroup).map(([key, teams]) => [key, teams.map(statLine)])),
    };
  }
  const teams = getStateParticipantIds(config).map((id) => resolveStateTeam(id, gameData));
  return { teamsByGroup:{ Geral:teams }, groupTables:{ Geral:teams.map(statLine) } };
}

function displayQualifyCount(config) {
  const qualify = config.firstStage?.qualify || {};
  if (isDirectSemiPlayoff(qualify)) return qualify.playoffTo || 6;
  if (qualify.type === 'group-winners-plus-best-runner-up') return 1;
  return qualify.count || 4;
}

function stateTablePresentation(config) {
  const qualify = config.firstStage?.qualify || {};
  const tableLabel = config.firstStage?.tableMode === 'global' ? 'CLASSIFICAÇÃO GERAL' : 'TABELA DO GRUPO';
  if (isDirectSemiPlayoff(qualify)) {
    const direct = Number(qualify.directSemi) || 2;
    const directLabel = direct === 1 ? '1º direto à semifinal' : `1º–${direct}º às semifinais`;
    return { tableLabel, qualificationNote:`🟢 ${directLabel} · ${qualify.playoffFrom || (direct + 1)}º–${qualify.playoffTo || 6}º aos playoffs` };
  }
  if (qualify.type === 'group-winners-plus-best-runner-up') {
    return { tableLabel, qualificationNote:'🟢 Líder de cada grupo + melhor 2º avançam' };
  }
  const count = qualify.count || 4;
  return { tableLabel, qualificationNote:`🟢 Top ${count} ${config.firstStage?.tableMode === 'global' ? 'avançam' : 'do grupo avançam'}` };
}

export function initStateCompetition(gameData = {}, { rng = Math.random } = {}) {
  const teamId = sourceTeamId(gameData);
  const config = getStateConfigForTeam(teamId);
  if (!config) return null;

  const { teamsByGroup, groupTables } = buildTeamsAndTables(config, gameData);
  const groupRounds = buildFirstStage(config, teamsByGroup);
  const userGroupKey = getStateGroupForTeam(config, teamId) || 'Geral';

  return {
    kind:'state', active:true, status:'active',
    competitionKey:config.key, label:config.label, color:config.color,
    officialSeason:Number(gameData.season) === 2026,
    userSourceTeamId:teamId, userTeamName:gameData.club?.name || '', userGroupKey,
    phase:'group', phaseLabel:'Fase Classificatória', qualifyCount:displayQualifyCount(config),
    ...stateTablePresentation(config),
    tableMode:config.firstStage?.tableMode || (config.groups ? 'groups' : 'global'),
    group:visibleTable(config, groupTables, userGroupKey), groupTables, groupRounds,
    groupMatches:buildUserGroupMatches(groupRounds),
    qualifiedTeams:[], knockoutPhaseIndex:-1, currentTie:null, history:[], totalPrize:0,
    calendarEvents:buildCalendarEvents(config, groupRounds.length),
  };
}

function finishGroup(cup, rng) {
  const config = STATE_2026_CONFIGS[cup.competitionKey];
  if (!config) return cup;
  const snapshot = qualificationSnapshot(cup, config);
  const table = visibleTable(config, cup.groupTables, cup.userGroupKey);
  const historyGroup = config.firstStage?.tableMode === 'global' ? getOverallTable(cup) : table;
  const firstStageHistory = { label:'Fase Classificatória', group:historyGroup };
  if (!snapshot.userQualified) {
    return { ...cup, group:table, qualifiedTeams:snapshot.qualified, status:'eliminated', history:[...(cup.history || []), firstStageHistory] };
  }
  const firstIndex = Number(snapshot.startIndex) || 0;
  const knockoutPhase = config.knockout?.[firstIndex];
  const opponent = firstOpponent(cup, config, snapshot);
  return {
    ...cup,
    group:table,
    qualifiedTeams:snapshot.qualified,
    phase:'knockout',
    phaseLabel:knockoutPhase?.label || 'Mata-mata',
    knockoutPhaseIndex:firstIndex,
    currentTie:makeStateTie({ ...cup, qualifiedTeams:snapshot.qualified }, firstIndex, opponent, rng),
    history:[...(cup.history || []), firstStageHistory],
  };
}

function recordGroupResult(cup, entry, homeGoals, awayGoals, rng) {
  const roundIndex = Number(entry?.stateRound);
  if (!Number.isInteger(roundIndex) || roundIndex < 0) return cup;
  const rounds = cup.groupRounds.map((round) => round.map((match) => ({ ...match })));
  const round = rounds[roundIndex] || [];
  const matchIndex = round.findIndex((match) => match.home?.isPlayer || match.away?.isPlayer);
  if (matchIndex < 0 || round[matchIndex]?.played) return cup;
  const match = round[matchIndex];
  round[matchIndex] = { ...match, played:true, homeGoals, awayGoals };
  rounds[roundIndex] = round;
  let tables = applyResult(cup.groupTables, match.home, match.away, homeGoals, awayGoals);
  const cpu = simulateCpuRound({ ...cup, groupTables:tables, groupRounds:rounds }, roundIndex, rng);
  tables = cpu.tables;
  const groupMatches = (cup.groupMatches || []).map((item) => item.id === match.id ? {
    ...item, leg1:{ ...item.leg1, played:true, home:homeGoals, away:awayGoals }, decided:true,
  } : item);
  const next = {
    ...cup,
    groupTables:tables,
    groupRounds:cpu.rounds,
    groupMatches,
    group:visibleTable(STATE_2026_CONFIGS[cup.competitionKey], tables, cup.userGroupKey),
  };
  return groupMatches.every((item) => item.leg1?.played) ? finishGroup(next, rng) : next;
}

function advanceKnockout(cup, decided, rng) {
  const config = STATE_2026_CONFIGS[cup.competitionKey];
  const history = [...(cup.history || []), decided];
  if (!decided.winner?.isPlayer) return { ...cup, currentTie:decided, status:'eliminated', history };
  const nextIndex = (Number(cup.knockoutPhaseIndex) || 0) + 1;
  if (nextIndex >= (config?.knockout?.length || 0)) {
    return { ...cup, currentTie:decided, status:'champion', phaseLabel:'Campeão', history };
  }
  const knockoutPhase = config.knockout[nextIndex];
  const opponent = pickNextOpponent({ ...cup, history });
  return {
    ...cup, history, knockoutPhaseIndex:nextIndex, phaseLabel:knockoutPhase.label,
    currentTie:makeStateTie({ ...cup, history }, nextIndex, opponent, rng),
  };
}

function recordKnockoutResult(cup, entry, homeGoals, awayGoals, rng) {
  const tie = cup.currentTie;
  if (!tie) return cup;
  const config = STATE_2026_CONFIGS[cup.competitionKey];
  const expectedPhase = config?.knockout?.[cup.knockoutPhaseIndex]?.phase;
  if (expectedPhase && entry?.phase && entry.phase !== expectedPhase) return cup;
  const leg = entry?.leg || 'leg1';
  if (leg === 'leg1') {
    if (tie.leg1?.played) return cup;
    const updated = { ...tie, leg1:{ ...tie.leg1, played:true, home:homeGoals, away:awayGoals } };
    if (updated.leg2) return { ...cup, currentTie:updated };
    return advanceKnockout(cup, decideTie(updated, rng), rng);
  }
  if (!tie.leg2 || tie.leg2.played || !tie.leg1?.played) return cup;
  const decided = decideTie({ ...tie, leg2:{ ...tie.leg2, played:true, home:homeGoals, away:awayGoals } }, rng);
  return advanceKnockout(cup, decided, rng);
}

export function registerStateResult(cup, entry, homeGoals, awayGoals, rng = Math.random) {
  if (!cup || cup.kind !== 'state' || cup.status !== 'active') return cup;
  return entry?.isGroup
    ? recordGroupResult(cup, entry, homeGoals, awayGoals, rng)
    : recordKnockoutResult(cup, entry, homeGoals, awayGoals, rng);
}

export function getStateMatchForCalendarSlot(cup, entry) {
  if (!cup || cup.kind !== 'state' || cup.status !== 'active') return { hasCupMatch:false };
  if (entry?.isGroup) {
    if (cup.phase !== 'group') return { hasCupMatch:false };
    const match = cup.groupMatches?.[Number(entry.stateRound)];
    if (!match || match.leg1?.played) return { hasCupMatch:false };
    return {
      hasCupMatch:true, cupKey:cup.competitionKey, cup, tie:match, leg:'leg1', label:cup.label,
      isGroup:true, isState:true, matchId:match.id,
    };
  }
  if (cup.phase === 'group' || !cup.currentTie) return { hasCupMatch:false };
  const config = STATE_2026_CONFIGS[cup.competitionKey];
  const expectedPhase = config?.knockout?.[cup.knockoutPhaseIndex]?.phase;
  if (expectedPhase && entry?.phase !== expectedPhase) return { hasCupMatch:false };
  const tie = cup.currentTie;
  const leg = entry?.leg || 'leg1';
  if (leg === 'leg1') {
    if (tie.leg1?.played) return { hasCupMatch:false };
    return { hasCupMatch:true, cupKey:cup.competitionKey, cup, tie, leg, label:cup.label, isState:true };
  }
  if (!tie.leg2 || !tie.leg1?.played || tie.leg2.played) return { hasCupMatch:false };
  return { hasCupMatch:true, cupKey:cup.competitionKey, cup, tie, leg, label:cup.label, isState:true };
}

export { sortTable as sortStateTable };
export default { initStateCompetition, registerStateResult, getStateMatchForCalendarSlot };

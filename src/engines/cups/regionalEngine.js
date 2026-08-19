import { getClubCatalogEntry } from '../../data/clubCatalog.js';
import { decideTie, makeTie, simGoals } from './cupUtils.js';
import {
  REGIONAL_2026_CONFIGS,
  REGIONAL_EXTRA_TEAMS,
  getPairedRegionalGroup,
  getRegionalConfigForTeam,
  getRegionalGroupForTeam,
} from './regionalConfig.js';

const statLine = (team) => ({ ...team, pts:0, w:0, d:0, l:0, gf:0, ga:0, p:0 });
const sortTable = (table = []) => [...table].sort((a, b) => (
  (b.pts || 0) - (a.pts || 0)
  || (b.w || 0) - (a.w || 0)
  || (((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0)))
  || (b.gf || 0) - (a.gf || 0)
  || String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
));

const sourceTeamId = (gameData = {}) => gameData.club?.existingTeamId || gameData.club?.teamId || null;

function resolveRegionalTeam(teamId, gameData = {}) {
  const id = String(teamId || '');
  if (id === String(sourceTeamId(gameData))) {
    return {
      id:'user', sourceTeamId:id, name:gameData.club?.name || getClubCatalogEntry(id)?.name || 'Seu clube',
      strength:Number(gameData.club?.strength) || Number(getClubCatalogEntry(id)?.strength) || 60,
      isPlayer:true,
    };
  }
  const canonical = getClubCatalogEntry(id);
  const fallback = REGIONAL_EXTRA_TEAMS[id];
  const source = canonical || fallback || { id, name:id, strength:54 };
  return { id:source.id, sourceTeamId:source.id, name:source.name, strength:Number(source.strength) || 54, isPlayer:false };
}

const applyResult = (tables, home, away, hg, ag) => {
  const next = Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.map((row) => ({ ...row }))]));
  for (const key of Object.keys(next)) {
    next[key] = next[key].map((row) => {
      const isHome = row.id === home.id || (row.isPlayer && home.isPlayer);
      const isAway = row.id === away.id || (row.isPlayer && away.isPlayer);
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
};

function circleRounds(teams = []) {
  const list = [...teams];
  if (list.length % 2) list.push(null);
  const n = list.length;
  const rounds = [];
  let rotating = [...list];
  for (let round = 0; round < n - 1; round += 1) {
    const matches = [];
    for (let i = 0; i < n / 2; i += 1) {
      const a = rotating[i];
      const b = rotating[n - 1 - i];
      if (!a || !b) continue;
      const flip = (round + i) % 2 === 1;
      matches.push({ home:flip ? b : a, away:flip ? a : b });
    }
    rounds.push(matches);
    rotating = [rotating[0], rotating[n - 1], ...rotating.slice(1, n - 1)];
  }
  return rounds;
}

function buildGroupRounds(config, teamsByGroup) {
  const rounds = [];
  if (config.groupMode === 'round-robin') {
    const perGroup = Object.entries(teamsByGroup).map(([groupKey, teams]) => ({ groupKey, rounds:circleRounds(teams) }));
    const count = Math.max(...perGroup.map((entry) => entry.rounds.length));
    for (let r = 0; r < count; r += 1) {
      const matches = [];
      perGroup.forEach(({ groupKey, rounds:groupRounds }) => {
        (groupRounds[r] || []).forEach((match, index) => matches.push({
          id:`${config.key}-g-${r}-${groupKey}-${index}`,
          groupKeys:[groupKey], roundIndex:r, ...match, played:false, homeGoals:null, awayGoals:null,
        }));
      });
      rounds.push(matches);
    }
    return rounds;
  }

  for (const [leftKey, rightKey] of config.groupPairs || []) {
    const left = teamsByGroup[leftKey] || [];
    const right = teamsByGroup[rightKey] || [];
    const count = Math.min(left.length, right.length);
    for (let r = 0; r < count; r += 1) {
      if (!rounds[r]) rounds[r] = [];
      for (let i = 0; i < count; i += 1) {
        const a = left[i];
        const b = right[(i + r) % count];
        const flip = (r + i) % 2 === 1;
        rounds[r].push({
          id:`${config.key}-g-${r}-${leftKey}-${i}`,
          groupKeys:[leftKey, rightKey], roundIndex:r,
          home:flip ? b : a, away:flip ? a : b,
          played:false, homeGoals:null, awayGoals:null,
        });
      }
    }
  }
  return rounds;
}

function buildUserGroupMatches(groupRounds = []) {
  return groupRounds.map((matches, roundIndex) => {
    const match = matches.find((item) => item.home?.isPlayer || item.away?.isPlayer);
    if (!match) return null;
    return {
      id:match.id,
      phase:`Grupos ${roundIndex + 1}`,
      home:match.home,
      away:match.away,
      leg1:{ played:false, home:null, away:null, round:roundIndex + 1 },
      leg2:null,
      decided:false,
      winner:null,
    };
  }).filter(Boolean);
}

function buildCalendarEvents(config, groupRoundCount) {
  const events = Array.from({ length:groupRoundCount }, (_, roundIndex) => ({
    phase:`Grupos ${roundIndex + 1}`, leg:'leg1', isGroup:true, regionalRound:roundIndex,
  }));
  (config.knockout || []).forEach((phase) => {
    events.push({ phase:phase.phase, leg:'leg1', isGroup:false });
    if (phase.legs === 2) events.push({ phase:phase.phase, leg:'leg2', isGroup:false });
  });
  return events;
}

function getUserGroup(cup) {
  return cup?.userGroupKey || null;
}

function rankedGroup(cup, key) {
  return sortTable(cup?.groupTables?.[key] || []);
}

function opponentForFirstKnockout(cup) {
  const config = REGIONAL_2026_CONFIGS[cup.competitionKey];
  const userGroup = getUserGroup(cup);
  const paired = getPairedRegionalGroup(config, userGroup);
  const userRank = rankedGroup(cup, userGroup).findIndex((team) => team.isPlayer) + 1;
  const pairedTable = rankedGroup(cup, paired);
  if (!pairedTable.length) return null;
  return pairedTable[userRank === 1 ? 1 : 0] || pairedTable[0];
}

function pickUnusedOpponent(cup, { otherBlock = false } = {}) {
  const config = REGIONAL_2026_CONFIGS[cup.competitionKey];
  const used = new Set([sourceTeamId(cup._gameData || {}), cup.userSourceTeamId]);
  (cup.history || []).forEach((tie) => {
    tie?.home?.sourceTeamId && used.add(tie.home.sourceTeamId);
    tie?.away?.sourceTeamId && used.add(tie.away.sourceTeamId);
    tie?.home?.id && used.add(tie.home.id);
    tie?.away?.id && used.add(tie.away.id);
  });

  let groupKeys = Object.keys(config.groups);
  if (config.key === 'copaVerde') {
    const block = String(cup.userGroupKey || '').startsWith('N_') ? 'N' : 'CO';
    groupKeys = otherBlock ? config.regionalBlocks[block === 'N' ? 'CO' : 'N'] : config.regionalBlocks[block];
  }
  const candidates = groupKeys.flatMap((key) => rankedGroup(cup, key).slice(0, 2))
    .filter((team) => !team.isPlayer && !used.has(team.id) && !used.has(team.sourceTeamId));
  return [...candidates].sort((a, b) => (Number(b.strength) || 0) - (Number(a.strength) || 0))[0]
    || Object.values(cup.groupTables || {}).flat().find((team) => !team.isPlayer);
}

function makeRegionalTie(cup, phaseIndex, opponent, rng = Math.random) {
  const config = REGIONAL_2026_CONFIGS[cup.competitionKey];
  const phase = config.knockout[phaseIndex];
  if (!phase || !opponent) return null;
  const user = Object.values(cup.groupTables || {}).flat().find((team) => team.isPlayer)
    || { id:'user', name:cup.userTeamName || 'Seu clube', strength:60, isPlayer:true };
  const userHome = phaseIndex % 2 === 0;
  return makeTie(
    userHome ? user : { ...opponent, isPlayer:false },
    userHome ? { ...opponent, isPlayer:false } : user,
    phase.phase,
    0,
    1,
    phase.legs === 2 ? 2 : null,
    rng,
  );
}

export function initRegionalCompetition(gameData = {}, { hasContinental = false, rng = Math.random } = {}) {
  if (hasContinental) return null;
  const teamId = sourceTeamId(gameData);
  const config = getRegionalConfigForTeam(teamId);
  if (!config) return null;

  const teamsByGroup = Object.fromEntries(Object.entries(config.groups).map(([key, ids]) => [
    key,
    ids.map((id) => resolveRegionalTeam(id, gameData)),
  ]));
  const groupTables = Object.fromEntries(Object.entries(teamsByGroup).map(([key, teams]) => [key, teams.map(statLine)]));
  const groupRounds = buildGroupRounds(config, teamsByGroup);
  const userGroupKey = getRegionalGroupForTeam(config, teamId);
  const groupMatches = buildUserGroupMatches(groupRounds);

  return {
    kind:'regional',
    active:true,
    status:'active',
    competitionKey:config.key,
    label:config.label,
    color:config.color,
    officialSeason:Number(gameData.season) === 2026,
    userSourceTeamId:teamId,
    userTeamName:gameData.club?.name || '',
    userGroupKey,
    phase:'group',
    phaseLabel:'Fase de Grupos',
    group:groupTables[userGroupKey] || [],
    groupTables,
    groupRounds,
    groupMatches,
    knockoutPhaseIndex:-1,
    currentTie:null,
    history:[],
    totalPrize:0,
    calendarEvents:buildCalendarEvents(config, groupRounds.length),
  };
}

function simulateCpuMatchesForRound(cup, roundIndex, rng) {
  let tables = cup.groupTables;
  const rounds = cup.groupRounds.map((round) => round.map((match) => ({ ...match })));
  const round = rounds[roundIndex] || [];
  round.forEach((match, index) => {
    if (match.played || match.home?.isPlayer || match.away?.isPlayer) return;
    const [hg, ag] = simGoals(match.home?.strength || 55, match.away?.strength || 55, rng);
    round[index] = { ...match, played:true, homeGoals:hg, awayGoals:ag };
    tables = applyResult(tables, match.home, match.away, hg, ag);
  });
  rounds[roundIndex] = round;
  return { tables, rounds };
}

function finishGroupIfNeeded(cup, rng) {
  const allUserPlayed = (cup.groupMatches || []).every((match) => match.leg1?.played);
  if (!allUserPlayed) return cup;
  const table = rankedGroup(cup, cup.userGroupKey);
  const userRank = table.findIndex((team) => team.isPlayer) + 1;
  const groupHistory = { label:'Fase de Grupos', group:table };
  if (userRank < 1 || userRank > 2) {
    return { ...cup, group:table, phase:'group', status:'eliminated', history:[...(cup.history || []), groupHistory] };
  }
  const opponent = opponentForFirstKnockout({ ...cup, group:table });
  return {
    ...cup,
    group:table,
    phase:'knockout',
    phaseLabel:REGIONAL_2026_CONFIGS[cup.competitionKey].knockout[0]?.label || 'Mata-mata',
    knockoutPhaseIndex:0,
    currentTie:makeRegionalTie(cup, 0, opponent, rng),
    history:[...(cup.history || []), groupHistory],
  };
}

function recordRegionalGroupResult(cup, entry, homeGoals, awayGoals, rng) {
  const roundIndex = Number(entry?.regionalRound);
  if (!Number.isInteger(roundIndex) || roundIndex < 0) return cup;
  const rounds = cup.groupRounds.map((round) => round.map((match) => ({ ...match })));
  const round = rounds[roundIndex] || [];
  const matchIndex = round.findIndex((match) => match.home?.isPlayer || match.away?.isPlayer);
  if (matchIndex < 0 || round[matchIndex]?.played) return cup;
  const match = round[matchIndex];
  round[matchIndex] = { ...match, played:true, homeGoals, awayGoals };
  rounds[roundIndex] = round;
  let tables = applyResult(cup.groupTables, match.home, match.away, homeGoals, awayGoals);
  const cpuSettled = simulateCpuMatchesForRound({ ...cup, groupTables:tables, groupRounds:rounds }, roundIndex, rng);
  tables = cpuSettled.tables;

  const groupMatches = (cup.groupMatches || []).map((item) => item.id === match.id ? {
    ...item,
    leg1:{ ...item.leg1, played:true, home:homeGoals, away:awayGoals },
    decided:true,
  } : item);
  return finishGroupIfNeeded({
    ...cup,
    groupTables:tables,
    groupRounds:cpuSettled.rounds,
    groupMatches,
    group:sortTable(tables[cup.userGroupKey] || []),
  }, rng);
}

function advanceRegionalKnockout(cup, decided, rng) {
  const config = REGIONAL_2026_CONFIGS[cup.competitionKey];
  const history = [...(cup.history || []), decided];
  if (!decided.winner?.isPlayer) {
    return { ...cup, currentTie:decided, status:'eliminated', history };
  }
  const nextIndex = (Number(cup.knockoutPhaseIndex) || 0) + 1;
  if (nextIndex >= config.knockout.length) {
    return { ...cup, currentTie:decided, status:'champion', phaseLabel:'Campeão', history };
  }
  const nextPhase = config.knockout[nextIndex];
  const otherBlock = config.key === 'copaVerde' && nextPhase.phase === 'Final';
  const opponent = pickUnusedOpponent({ ...cup, history }, { otherBlock });
  return {
    ...cup,
    history,
    knockoutPhaseIndex:nextIndex,
    phaseLabel:nextPhase.label,
    currentTie:makeRegionalTie({ ...cup, history }, nextIndex, opponent, rng),
  };
}

function recordRegionalKnockoutResult(cup, entry, homeGoals, awayGoals, rng) {
  const tie = cup.currentTie;
  if (!tie) return cup;
  const leg = entry?.leg || 'leg1';
  if (leg === 'leg1') {
    if (tie.leg1?.played) return cup;
    const updated = { ...tie, leg1:{ ...tie.leg1, played:true, home:homeGoals, away:awayGoals } };
    if (updated.leg2) return { ...cup, currentTie:updated };
    return advanceRegionalKnockout(cup, decideTie(updated, rng), rng);
  }
  if (!tie.leg2 || tie.leg2.played || !tie.leg1?.played) return cup;
  const decided = decideTie({ ...tie, leg2:{ ...tie.leg2, played:true, home:homeGoals, away:awayGoals } }, rng);
  return advanceRegionalKnockout(cup, decided, rng);
}

export function registerRegionalResult(cup, entry, homeGoals, awayGoals, rng = Math.random) {
  if (!cup || cup.kind !== 'regional' || cup.status !== 'active') return cup;
  if (entry?.isGroup) return recordRegionalGroupResult(cup, entry, homeGoals, awayGoals, rng);
  return recordRegionalKnockoutResult(cup, entry, homeGoals, awayGoals, rng);
}

export function getRegionalMatchForCalendarSlot(cup, entry) {
  if (!cup || cup.kind !== 'regional' || cup.status !== 'active') return { hasCupMatch:false };
  if (entry?.isGroup) {
    if (cup.phase !== 'group') return { hasCupMatch:false };
    const match = cup.groupMatches?.[Number(entry.regionalRound)];
    if (!match || match.leg1?.played) return { hasCupMatch:false };
    return {
      hasCupMatch:true, cupKey:cup.competitionKey, cup, tie:match, leg:'leg1', label:cup.label,
      isGroup:true, isRegional:true, matchId:match.id,
    };
  }
  if (cup.phase === 'group' || !cup.currentTie) return { hasCupMatch:false };
  const tie = cup.currentTie;
  const leg = entry?.leg || 'leg1';
  if (leg === 'leg1') {
    if (tie.leg1?.played) return { hasCupMatch:false };
    return { hasCupMatch:true, cupKey:cup.competitionKey, cup, tie, leg, label:cup.label, isRegional:true };
  }
  if (!tie.leg2 || !tie.leg1?.played || tie.leg2.played) return { hasCupMatch:false };
  return { hasCupMatch:true, cupKey:cup.competitionKey, cup, tie, leg, label:cup.label, isRegional:true };
}

export default {
  initRegionalCompetition,
  registerRegionalResult,
  getRegionalMatchForCalendarSlot,
};

import { diexDatabase } from '../../data/database.js';
import '../../data/database_extra.js'; // garante clubes CONMEBOL mesmo fora do entrypoint principal
import {
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cupConfig.js';
import {
  decideTie,
  isSingleLegPhase,
  makeTie,
  shuffle,
} from './cupUtils.js';

const getCompetitionKey = (cup, prizeMap) => {
  if (cup?.competitionKey) return cup.competitionKey;
  if ((cup?.groupMatches || []).some((m) => String(m.id || '').startsWith('sul_g'))) {
    return 'sulAmericana';
  }
  if (prizeMap?.group === SULAM_PRIZES.group) return 'sulAmericana';
  return 'libertadores';
};

const resolveCompetitionConfig = (cup, prizeMap, scheduleMap) => {
  const key = getCompetitionKey(cup, prizeMap);
  const defaultPrizes = key === 'sulAmericana' ? SULAM_PRIZES : LIBERTA_PRIZES;
  const defaultSchedule = key === 'sulAmericana' ? SULAM_SCHEDULE : LIBERTA_SCHEDULE;
  return {
    key,
    prizes: prizeMap && Object.keys(prizeMap).length ? prizeMap : defaultPrizes,
    schedule: scheduleMap && Object.keys(scheduleMap).length ? scheduleMap : defaultSchedule,
  };
};

const buildGroupCompetition = ({
  gameData,
  competitionKey,
  userStrength,
  prizes,
  schedule,
  idPrefix,
}) => {
  const userTeam = {
    id: 'user',
    name: gameData.club.name,
    strength: gameData.club.strength || userStrength,
    isPlayer: true,
  };
  const conmebol = shuffle(diexDatabase.conmebolTeams || []).slice(0, 3);
  const groupTeams = [userTeam, ...conmebol].map((team) => ({
    ...team,
    pts: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    p: 0,
  }));

  const groupMatches = groupTeams.filter((team) => !team.isPlayer).map((opponent, index) => {
    const phase = `Grupos ${index + 1}`;
    const [leg1Round, leg2Round = null] = schedule[phase] || [];
    const userHomeOnLeg1 = index % 2 === 0;
    const home = userHomeOnLeg1 ? userTeam : { ...opponent, isPlayer: false };
    const away = userHomeOnLeg1 ? { ...opponent, isPlayer: false } : userTeam;

    return {
      id: `${idPrefix}${index}`,
      phase,
      home,
      away,
      leg1: { played: false, home: null, away: null, round: leg1Round },
      leg2: leg2Round == null ? null : {
        played: false,
        home: null,
        away: null,
        round: leg2Round,
        homeTeam: away,
        awayTeam: home,
      },
      decided: false,
      winner: null,
      prize: Math.floor(prizes.group / 3),
    };
  });

  return {
    active: true,
    status: 'active',
    competitionKey,
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

export const initLibertadores = (gameData) => {
  const myPos = gameData.table.findIndex((team) => team.id === 'user') + 1;
  if (gameData.serie !== 'A' || myPos < 1 || myPos > 6) return null;

  return buildGroupCompetition({
    gameData,
    competitionKey: 'libertadores',
    userStrength: 80,
    prizes: LIBERTA_PRIZES,
    schedule: LIBERTA_SCHEDULE,
    idPrefix: 'lib_g',
  });
};

export const initSulAmericana = (gameData) => {
  const myPos = gameData.table.findIndex((team) => team.id === 'user') + 1;
  if (gameData.serie === 'A' && (myPos < 7 || myPos > 12)) return null;
  if (gameData.serie === 'B' && myPos !== 1) return null;
  if (!['A', 'B'].includes(gameData.serie)) return null;

  return buildGroupCompetition({
    gameData,
    competitionKey: 'sulAmericana',
    userStrength: 75,
    prizes: SULAM_PRIZES,
    schedule: SULAM_SCHEDULE,
    idPrefix: 'sul_g',
  });
};

const updateGroupTable = (group, match, homeGoals, awayGoals, isLeg2) => {
  const homeTeam = isLeg2 ? (match.leg2?.homeTeam || match.away) : match.home;
  const awayTeam = isLeg2 ? (match.leg2?.awayTeam || match.home) : match.away;
  const userIsHome = Boolean(homeTeam?.isPlayer);
  const userGoals = userIsHome ? homeGoals : awayGoals;
  const opponentGoals = userIsHome ? awayGoals : homeGoals;
  const opponent = [homeTeam, awayTeam].find((team) => team && !team.isPlayer);

  const updated = group.map((team) => {
    const isUser = Boolean(team.isPlayer);
    const isOpponent = !isUser && opponent && team.id === opponent.id;
    if (!isUser && !isOpponent) return team;

    const goalsFor = isUser ? userGoals : opponentGoals;
    const goalsAgainst = isUser ? opponentGoals : userGoals;
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
  });

  updated.sort((a, b) => (
    (b.pts || 0) - (a.pts || 0)
    || ((b.gf || 0) - (b.ga || 0)) - ((a.gf || 0) - (a.ga || 0))
    || (b.gf || 0) - (a.gf || 0)
  ));
  return updated;
};

const nextPendingGroupMatchIndex = (matches) => {
  const index = matches.findIndex((match) => (
    !match.leg1?.played || (match.leg2 && !match.leg2.played)
  ));
  return index === -1 ? matches.length : index;
};

export const registerGroupLegResult = (
  cup,
  matchId,
  homeGoals,
  awayGoals,
  prizeMap,
  scheduleMap,
  isLeg2 = false,
) => {
  if (!cup) return cup;
  const match = (cup.groupMatches || []).find((item) => item.id === matchId);
  if (!match) return cup;

  if (isLeg2 && !match.leg2) return cup;
  const updatedMatches = cup.groupMatches.map((item) => {
    if (item.id !== matchId) return item;
    const next = isLeg2
      ? { ...item, leg2: { ...item.leg2, played: true, home: homeGoals, away: awayGoals } }
      : { ...item, leg1: { ...item.leg1, played: true, home: homeGoals, away: awayGoals } };
    return {
      ...next,
      decided: Boolean(next.leg1?.played && (!next.leg2 || next.leg2.played)),
    };
  });

  const newGroup = updateGroupTable(cup.group || [], match, homeGoals, awayGoals, isLeg2);
  const allDone = updatedMatches.every((item) => (
    item.leg1?.played && (!item.leg2 || item.leg2.played)
  ));
  const nextIdx = nextPendingGroupMatchIndex(updatedMatches);

  if (!allDone) {
    return {
      ...cup,
      groupMatches: updatedMatches,
      group: newGroup,
      currentGroupMatchIndex: nextIdx,
    };
  }

  const { prizes, schedule, key } = resolveCompetitionConfig(cup, prizeMap, scheduleMap);
  const groupEarned = updatedMatches.reduce((sum, item) => sum + (item.prize || 0), 0);
  const userRank = newGroup.findIndex((team) => team.isPlayer) + 1;
  const groupHistory = { label: 'Fase de Grupos', group: newGroup };

  if (userRank < 1 || userRank > 2) {
    return {
      ...cup,
      competitionKey: cup.competitionKey || key,
      groupMatches: updatedMatches,
      group: newGroup,
      currentGroupMatchIndex: nextIdx,
      status: 'eliminated',
      history: [...(cup.history || []), groupHistory],
      totalPrize: (cup.totalPrize || 0) + groupEarned,
    };
  }

  const [leg1Round, leg2Round = null] = schedule.Oitavas || [14, 16];
  const allTeams = [
    ...(diexDatabase.conmebolTeams || []),
    ...(diexDatabase.serieATeams || []),
  ];
  const usedIds = newGroup.map((team) => team.id);
  const opponent = shuffle(allTeams.filter((team) => !usedIds.includes(team.id)))[0]
    || allTeams[0]
    || { id: 'cpu_continental', name: 'Adversário', strength: 75 };
  const userTeam = { ...newGroup.find((team) => team.isPlayer) };
  const tie = makeTie(
    userTeam,
    { ...opponent, isPlayer: false },
    'Oitavas',
    prizes.Oitavas || 3000000,
    leg1Round,
    leg2Round,
  );

  return {
    ...cup,
    competitionKey: cup.competitionKey || key,
    groupMatches: updatedMatches,
    group: newGroup,
    phase: 'knockout',
    phaseLabel: 'Oitavas de Final',
    knockoutTie: tie,
    currentGroupMatchIndex: nextIdx,
    history: [...(cup.history || []), groupHistory],
    totalPrize: (cup.totalPrize || 0) + groupEarned,
  };
};

export const registerKnockoutLegResult = (
  cup,
  leg,
  homeGoals,
  awayGoals,
  prizeMap,
  scheduleMap,
) => {
  if (!cup?.knockoutTie) return cup;
  const tie = cup.knockoutTie;
  const { prizes, schedule, key } = resolveCompetitionConfig(cup, prizeMap, scheduleMap);
  const singleLeg = isSingleLegPhase(schedule, tie.phase) || !tie.leg2;

  if (leg === 'leg1') {
    const leg1Tie = {
      ...tie,
      leg1: { ...tie.leg1, played: true, home: homeGoals, away: awayGoals },
    };
    if (!singleLeg) {
      return {
        ...cup,
        competitionKey: cup.competitionKey || key,
        knockoutTie: leg1Tie,
      };
    }

    const decided = decideTie({ ...leg1Tie, leg2: null });
    if (!decided.winner?.isPlayer) {
      return {
        ...cup,
        competitionKey: cup.competitionKey || key,
        knockoutTie: decided,
        status: 'eliminated',
        history: [...(cup.history || []), decided],
        totalPrize: (cup.totalPrize || 0) + (tie.prize || 0),
      };
    }

    return {
      ...cup,
      competitionKey: cup.competitionKey || key,
      knockoutTie: decided,
      status: 'champion',
      history: [...(cup.history || []), decided],
      totalPrize: (cup.totalPrize || 0) + (prizes.Campeão || 40000000),
    };
  }

  if (!tie.leg2) return cup;
  const decided = decideTie({
    ...tie,
    leg2: { ...tie.leg2, played: true, home: homeGoals, away: awayGoals },
  });
  const earned = tie.prize || 0;

  if (!decided.winner?.isPlayer) {
    return {
      ...cup,
      competitionKey: cup.competitionKey || key,
      knockoutTie: decided,
      status: 'eliminated',
      history: [...(cup.history || []), decided],
      totalPrize: (cup.totalPrize || 0) + earned,
    };
  }

  const phases = ['Oitavas', 'Quartas', 'Semifinal', 'Final'];
  const currentIndex = phases.indexOf(tie.phase);
  const nextPhase = phases[currentIndex + 1];
  if (!nextPhase) {
    return {
      ...cup,
      competitionKey: cup.competitionKey || key,
      knockoutTie: decided,
      status: 'champion',
      history: [...(cup.history || []), decided],
      totalPrize: (cup.totalPrize || 0) + (prizes.Campeão || 40000000),
    };
  }

  const [leg1Round, leg2Round = null] = schedule[nextPhase] || [21, 23];
  const allTeams = [
    ...(diexDatabase.conmebolTeams || []),
    ...(diexDatabase.serieATeams || []),
  ];
  const usedIds = (cup.history || []).map((item) => item.winner?.id).filter(Boolean);
  const opponent = shuffle(allTeams.filter((team) => !usedIds.includes(team.id)))[0]
    || allTeams[0]
    || { id: 'cpu_continental', name: 'Adversário', strength: 75 };
  const nextTie = makeTie(
    { ...decided.winner },
    { ...opponent, isPlayer: false },
    nextPhase,
    prizes[nextPhase] || 5000000,
    leg1Round,
    leg2Round,
  );

  return {
    ...cup,
    competitionKey: cup.competitionKey || key,
    knockoutTie: nextTie,
    phaseLabel: nextPhase,
    history: [...(cup.history || []), decided],
    totalPrize: (cup.totalPrize || 0) + earned,
  };
};

import { CONTINENTAL_PHASES } from './continentalConfig.js';
import { decideTie, isSingleLegPhase, makeTie, shuffle } from './cupUtils.js';

export const collectUsedContinentalTeamIds = (cup = {}) => {
  const ids = new Set(['user']);
  if (cup.userSourceTeamId) ids.add(cup.userSourceTeamId);
  (cup.group || []).forEach((team) => team?.id && ids.add(team.id));
  (cup.history || []).forEach((entry) => {
    entry?.home?.id && ids.add(entry.home.id);
    entry?.away?.id && ids.add(entry.away.id);
  });
  const current = cup.knockoutTie || cup.currentTie;
  current?.home?.id && ids.add(current.home.id);
  current?.away?.id && ids.add(current.away.id);
  return ids;
};

export const pickContinentalOpponent = (cup, opponentPool = [], rng = Math.random) => {
  const used = collectUsedContinentalTeamIds(cup);
  const available = opponentPool.filter((team) => team?.id && !used.has(team.id));
  return shuffle(available, rng)[0]
    || shuffle(opponentPool.filter((team) => team?.id && team.id !== cup.userSourceTeamId), rng)[0]
    || { id: 'cpu_continental', name: 'Adversário', strength: 75 };
};

export const createFirstKnockoutTie = ({ cup, prizes, schedule, opponentPool, rng = Math.random }) => {
  const [leg1Round, leg2Round = null] = schedule.Oitavas || [14, 16];
  const opponent = pickContinentalOpponent(cup, opponentPool, rng);
  const userTeam = { ...(cup.group || []).find((team) => team.isPlayer) };
  return makeTie(
    userTeam,
    { ...opponent, isPlayer: false },
    'Oitavas',
    prizes.Oitavas || 3000000,
    leg1Round,
    leg2Round,
    rng,
  );
};

const buildNextKnockoutTie = ({ cup, decided, prizes, schedule, opponentPool, rng }) => {
  const currentIndex = CONTINENTAL_PHASES.indexOf(decided.phase);
  const nextPhase = CONTINENTAL_PHASES[currentIndex + 1];
  if (!nextPhase) return null;
  const [leg1Round, leg2Round = null] = schedule[nextPhase] || [21, 23];
  const opponent = pickContinentalOpponent(
    { ...cup, history: [...(cup.history || []), decided], knockoutTie: decided },
    opponentPool,
    rng,
  );
  return makeTie(
    { ...decided.winner },
    { ...opponent, isPlayer: false },
    nextPhase,
    prizes[nextPhase] || 5000000,
    leg1Round,
    leg2Round,
    rng,
  );
};

export const recordKnockoutLegResult = ({
  cup,
  leg,
  homeGoals,
  awayGoals,
  prizes,
  schedule,
  opponentPool,
  rng = Math.random,
}) => {
  if (!cup?.knockoutTie) return cup;
  const tie = cup.knockoutTie;
  const singleLeg = isSingleLegPhase(schedule, tie.phase) || !tie.leg2;

  if (leg === 'leg1') {
    if (tie.leg1?.played) return cup;
    const leg1Tie = {
      ...tie,
      leg1: { ...tie.leg1, played: true, home: homeGoals, away: awayGoals },
    };
    if (!singleLeg) return { ...cup, knockoutTie: leg1Tie };

    const decided = decideTie({ ...leg1Tie, leg2: null }, rng);
    if (!decided.winner?.isPlayer) {
      return {
        ...cup,
        knockoutTie: decided,
        status: 'eliminated',
        history: [...(cup.history || []), decided],
        totalPrize: (cup.totalPrize || 0) + (tie.prize || 0),
      };
    }
    return {
      ...cup,
      knockoutTie: decided,
      status: 'champion',
      history: [...(cup.history || []), decided],
      totalPrize: (cup.totalPrize || 0) + (prizes.Campeão || 40000000),
    };
  }

  if (!tie.leg2 || tie.leg2.played) return cup;
  const decided = decideTie({
    ...tie,
    leg2: { ...tie.leg2, played: true, home: homeGoals, away: awayGoals },
  }, rng);
  const earned = tie.prize || 0;

  if (!decided.winner?.isPlayer) {
    return {
      ...cup,
      knockoutTie: decided,
      status: 'eliminated',
      history: [...(cup.history || []), decided],
      totalPrize: (cup.totalPrize || 0) + earned,
    };
  }

  const nextTie = buildNextKnockoutTie({ cup, decided, prizes, schedule, opponentPool, rng });
  if (!nextTie) {
    return {
      ...cup,
      knockoutTie: decided,
      status: 'champion',
      history: [...(cup.history || []), decided],
      totalPrize: (cup.totalPrize || 0) + (prizes.Campeão || 40000000),
    };
  }

  return {
    ...cup,
    knockoutTie: nextTie,
    phaseLabel: nextTie.phase,
    history: [...(cup.history || []), decided],
    totalPrize: (cup.totalPrize || 0) + earned,
  };
};

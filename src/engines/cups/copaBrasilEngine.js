import { diexDatabase } from '../../data/database.js';
import {
  COPA_PRIZES,
  getCopaConfigForSerie,
} from './cupConfig.js';
import {
  decideTie,
  findFreeRound,
  getLeagueRoundsInUse,
  makeTie,
  shuffle,
} from './cupUtils.js';

const AMATEUR_NAMES = [
  'Esporte Clube Guerreiro',
  'União Esportiva FC',
  'Atlético Interiorano',
  'Grêmio da Cidade',
  'Sport Club da Serra',
  'Associação Atlética Popular',
  'EC Independente',
  'FC Esperança',
  'Esporte Clube União',
  'Associação Esportiva Vitória',
  'Clube Atlético Regional',
  'FC Renascença',
];

const buildOpponentPool = (gameData, serie, userTeamId) => {
  const source = (key, fallback) => Array.isArray(gameData?.leagues?.[key]) && gameData.leagues[key].length
    ? gameData.leagues[key]
    : fallback;
  const poolA = source('A', diexDatabase.serieATeams || []).filter((t) => t.id !== userTeamId);
  const poolB = source('B', diexDatabase.serieBTeams || []).filter((t) => t.id !== userTeamId);
  const poolC = source('C', diexDatabase.serieCTeams || []).filter((t) => t.id !== userTeamId);
  const poolD = source('D', diexDatabase.serieDTeams || []).filter((t) => t.id !== userTeamId);

  return shuffle(
    serie === 'A' ? [...poolA, ...poolB]
      : serie === 'B' ? [...poolB, ...poolA]
        : serie === 'C' ? [...poolC, ...poolB]
          : [...poolD, ...poolC],
  );
};

const buildFirstOpponent = (serie, firstPhase, pool) => {
  if (serie !== 'D' || firstPhase !== '1ª Fase') {
    return pool[0] || { id: 'cpu_copa0', name: 'Adversário', strength: 60 };
  }

  const name = AMATEUR_NAMES[Math.floor(Math.random() * AMATEUR_NAMES.length)];
  return {
    id: `amador_${Math.random().toString(36).substring(2, 6)}`,
    name,
    strength: 35 + Math.floor(Math.random() * 12),
    isPlayer: false,
    teamName: name,
  };
};

const resolveSafeRounds = (gameData, desiredRounds) => {
  const leagueRoundsInUse = getLeagueRoundsInUse(gameData);
  const totalRounds = gameData.fixtures?.length || 38;
  const usedCupRounds = new Set();
  const [leg1Desired, leg2Desired] = desiredRounds;

  const leg1Round = findFreeRound(
    leg1Desired,
    leagueRoundsInUse,
    usedCupRounds,
    totalRounds,
  );
  usedCupRounds.add(leg1Round);

  const leg2Round = leg2Desired == null
    ? null
    : findFreeRound(
      leg2Desired,
      leagueRoundsInUse,
      usedCupRounds,
      totalRounds,
    );

  return { leg1Round, leg2Round, leagueRoundsInUse, totalRounds };
};

export const initCopaBrasil = (gameData) => {
  const serie = gameData.serie || 'A';
  const { phases, schedule } = getCopaConfigForSerie(serie);
  const pool = buildOpponentPool(gameData, serie, gameData.club.existingTeamId);
  const userTeam = {
    id: 'user',
    name: gameData.club.name,
    strength: gameData.club.strength || 60,
    isPlayer: true,
  };

  const firstPhase = phases[0];
  const opponent = buildFirstOpponent(serie, firstPhase, pool);
  const desiredRounds = schedule[firstPhase] || [2, 4];
  const {
    leg1Round,
    leg2Round,
    leagueRoundsInUse,
    totalRounds,
  } = resolveSafeRounds(gameData, desiredRounds);

  return {
    active: true,
    status: 'active',
    serie,
    phases,
    schedule,
    phaseIndex: 0,
    phaseLabel: firstPhase,
    currentTie: makeTie(
      userTeam,
      { ...opponent, isPlayer: false },
      firstPhase,
      COPA_PRIZES[firstPhase] || 0,
      leg1Round,
      leg2Round,
    ),
    history: [],
    totalPrize: 0,
    pool,
    _serie: serie,
    _leagueRoundsInUse: Array.from(leagueRoundsInUse),
    _totalRounds: totalRounds,
  };
};

const advanceCopa = (copa, earnedPrize) => {
  const nextIdx = copa.phaseIndex + 1;
  if (nextIdx >= copa.phases.length) {
    return {
      ...copa,
      status: 'champion',
      history: [...copa.history, copa.currentTie],
      totalPrize: copa.totalPrize + COPA_PRIZES.Campeão,
      currentTie: null,
    };
  }

  const nextPhase = copa.phases[nextIdx];
  const [desiredLeg1, desiredLeg2 = null] = copa.schedule[nextPhase] || [0, 0];
  const opponent = copa.pool[nextIdx]
    || copa.pool[copa.pool.length - 1]
    || { id: 'cpu', name: 'Adversário', strength: 70 };
  const userIsHome = nextIdx % 2 !== 0;
  const userTeam = copa.currentTie?.winner?.isPlayer
    ? copa.currentTie.winner
    : { id: 'user', name: copa.currentTie?.home?.name || 'Time', isPlayer: true };
  const homeTeam = userIsHome ? userTeam : { ...opponent, isPlayer: false };
  const awayTeam = userIsHome ? { ...opponent, isPlayer: false } : userTeam;

  const usedByCopa = new Set();
  copa.history?.forEach((tie) => {
    if (tie?.leg1?.round) usedByCopa.add(tie.leg1.round);
    if (tie?.leg2?.round) usedByCopa.add(tie.leg2.round);
  });
  if (copa.currentTie?.leg1?.round) usedByCopa.add(copa.currentTie.leg1.round);
  if (copa.currentTie?.leg2?.round) usedByCopa.add(copa.currentTie.leg2.round);

  const leagueUsed = copa._leagueRoundsInUse
    ? new Set(copa._leagueRoundsInUse)
    : new Set();
  const totalRounds = copa._totalRounds || 38;
  const leg1Round = findFreeRound(desiredLeg1, leagueUsed, usedByCopa, totalRounds);
  usedByCopa.add(leg1Round);
  const leg2Round = desiredLeg2 == null
    ? null
    : findFreeRound(desiredLeg2, leagueUsed, usedByCopa, totalRounds);

  return {
    ...copa,
    phaseIndex: nextIdx,
    phaseLabel: nextPhase,
    currentTie: makeTie(
      homeTeam,
      awayTeam,
      nextPhase,
      COPA_PRIZES[nextPhase] || 0,
      leg1Round,
      leg2Round,
    ),
    history: [...copa.history, copa.currentTie],
    totalPrize: copa.totalPrize + earnedPrize,
  };
};

export const registerCopaLegResult = (copa, leg, homeGoals, awayGoals) => {
  if (!copa?.currentTie) return copa;
  const tie = copa.currentTie;

  if (leg === 'leg1') {
    const updatedTie = {
      ...tie,
      leg1: { ...tie.leg1, played: true, home: homeGoals, away: awayGoals },
    };
    if (updatedTie.leg2) return { ...copa, currentTie: updatedTie };

    const decided = decideTie(updatedTie);
    const earned = tie.prize || 0;
    if (!decided.winner?.isPlayer) {
      return {
        ...copa,
        status: 'eliminated',
        currentTie: decided,
        history: [...copa.history, decided],
        totalPrize: copa.totalPrize + earned,
      };
    }
    return advanceCopa({ ...copa, currentTie: decided }, earned);
  }

  if (!tie.leg2) return copa;
  const updatedTie = decideTie({
    ...tie,
    leg2: { ...tie.leg2, played: true, home: homeGoals, away: awayGoals },
  });
  const earned = tie.prize || 0;

  if (!updatedTie.winner?.isPlayer) {
    return {
      ...copa,
      status: 'eliminated',
      currentTie: updatedTie,
      history: [...copa.history, updatedTie],
      totalPrize: copa.totalPrize + earned,
    };
  }
  return advanceCopa({ ...copa, currentTie: updatedTie }, earned);
};

// Compatibilidade com saves/imports e chamadas antigas que usavam o typo "Cupa".
export const registerCupaLegResult = registerCopaLegResult;

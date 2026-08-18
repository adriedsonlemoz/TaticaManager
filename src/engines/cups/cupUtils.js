export const shuffle = (arr = [], rng = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const getLeagueRoundsInUse = (gameData) => {
  const used = new Set();
  if (!gameData?.fixtures) return used;
  gameData.fixtures.forEach((round, i) => {
    if ((round || []).some((m) => m.home?.isPlayer || m.away?.isPlayer)) {
      used.add(i + 1);
    }
  });
  return used;
};

export const findFreeRound = (
  preferredRound,
  leagueRoundsInUse,
  usedCupRounds,
  totalRounds,
  maxSearch = 8,
) => {
  const total = totalRounds || 38;
  for (let delta = 0; delta <= maxSearch; delta++) {
    for (const sign of [1, -1]) {
      if (delta === 0 && sign === -1) continue;
      const r = preferredRound + delta * sign;
      if (r < 1 || r > total) continue;
      if (!leagueRoundsInUse.has(r) && !usedCupRounds.has(r)) return r;
    }
  }

  for (let r = preferredRound + 1; r <= total; r++) {
    if (!leagueRoundsInUse.has(r) && !usedCupRounds.has(r)) return r;
  }
  for (let r = preferredRound - 1; r >= 1; r--) {
    if (!leagueRoundsInUse.has(r) && !usedCupRounds.has(r)) return r;
  }
  return preferredRound;
};

export const simGoals = (strA, strB, rng = Math.random) => {
  const total = strA + strB || 1;
  const probA = (strA / total) * 0.034 * 1.05;
  const probB = (strB / total) * 0.034;
  let gA = 0;
  let gB = 0;
  for (let minute = 1; minute <= 90; minute++) {
    if (rng() < probA) gA++;
    if (rng() < probB) gB++;
  }
  return [gA, gB];
};

export const simPenalties = (homeStrength, awayStrength, rng = Math.random) => {
  const diff = ((homeStrength || 75) - (awayStrength || 75)) / 10;
  const homeConv = Math.min(0.90, Math.max(0.60, 0.75 + diff * 0.05));
  const awayConv = Math.min(0.90, Math.max(0.60, 0.75 - diff * 0.05));

  let pA = 0;
  let pB = 0;
  for (let i = 0; i < 5; i++) {
    if (rng() < homeConv) pA++;
    if (rng() < awayConv) pB++;
  }

  let kicks = 0;
  while (pA === pB && kicks < 20) {
    if (rng() < homeConv) pA++;
    if (rng() < awayConv) pB++;
    kicks++;
  }
  if (pA === pB) pA++;
  return [pA, pB];
};

const decideSingleMatch = (tie, rng = Math.random) => {
  if (!tie.leg1?.played) return tie;
  const homeGoals = tie.leg1.home ?? 0;
  const awayGoals = tie.leg1.away ?? 0;
  let winner;
  let penalties = null;

  if (homeGoals > awayGoals) winner = tie.home;
  else if (awayGoals > homeGoals) winner = tie.away;
  else {
    const [pH, pA] = simPenalties(tie.home?.strength, tie.away?.strength, rng);
    penalties = { home: pH, away: pA };
    winner = pH > pA ? tie.home : tie.away;
  }

  return {
    ...tie,
    decided: true,
    winner,
    penalties,
    homeAggr: homeGoals,
    awayAggr: awayGoals,
  };
};

export const decideTie = (tie, rng = Math.random) => {
  if (!tie?.leg2) return decideSingleMatch(tie, rng);
  if (!tie.leg1?.played || !tie.leg2?.played) return tie;

  const homeAggr = tie.leg1.home + tie.leg2.away;
  const awayAggr = tie.leg1.away + tie.leg2.home;
  let winner;
  let penalties = null;

  if (homeAggr > awayAggr) winner = tie.home;
  else if (awayAggr > homeAggr) winner = tie.away;
  else {
    const [pH, pA] = simPenalties(tie.home?.strength, tie.away?.strength, rng);
    penalties = { home: pH, away: pA };
    winner = pH > pA ? tie.home : tie.away;
  }

  return { ...tie, decided: true, winner, penalties, homeAggr, awayAggr };
};

export const makeTie = (home, away, phase, prize, leg1Round, leg2Round = null, rng = Math.random) => ({
  id: rng().toString(36).substring(2, 10),
  phase,
  home,
  away,
  prize,
  leg1: { played: false, home: null, away: null, round: leg1Round },
  leg2: leg2Round == null
    ? null
    : { played: false, home: null, away: null, round: leg2Round },
  decided: false,
  winner: null,
  penalties: null,
  homeAggr: null,
  awayAggr: null,
});

export const isSingleLegPhase = (schedule, phase) => {
  const rounds = schedule?.[phase];
  return Array.isArray(rounds) && rounds.length === 1;
};

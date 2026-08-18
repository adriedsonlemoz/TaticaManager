const finiteInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
};

const textKey = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export function buildMatchCommitId(gameData = {}, matchData = {}) {
  const season = finiteInt(gameData?.season, 0);
  const calendarRound = finiteInt(matchData?.calendarRound, finiteInt(gameData?.round, 0) + 1);
  const competition = matchData?.isCupMatch
    ? `cup:${textKey(matchData?.cupLabel || matchData?.cupPhase || 'cup')}:${textKey(matchData?.cupLeg || 'single')}`
    : `league:${finiteInt(matchData?.leagueRound, finiteInt(gameData?.leagueRound, 0) + 1)}`;
  return [
    `s${season}`,
    `r${calendarRound}`,
    competition,
    textKey(matchData?.homeName || '?'),
    textKey(matchData?.awayName || '?'),
  ].join('|');
}

export function createMatchCommitTransaction(gameData = {}, matchData = {}) {
  return {
    id: buildMatchCommitId(gameData, matchData),
    season: finiteInt(gameData?.season, 0),
    expectedRound: finiteInt(gameData?.round, 0),
    expectedLeagueRound: finiteInt(gameData?.leagueRound, 0),
    competition: matchData?.isCupMatch ? 'cup' : 'league',
    calendarRound: finiteInt(matchData?.calendarRound, finiteInt(gameData?.round, 0) + 1),
  };
}

export function hasAppliedMatchCommit(gameData = {}, transactionOrId) {
  const id = typeof transactionOrId === 'string' ? transactionOrId : transactionOrId?.id;
  return Boolean(id && gameData?.lastMatchCommit?.id === id);
}

export function inspectMatchCommit(gameData = {}, transaction = {}) {
  if (!transaction?.id) return { status: 'invalid' };
  if (hasAppliedMatchCommit(gameData, transaction)) return { status: 'duplicate' };

  const season = finiteInt(gameData?.season, 0);
  const round = finiteInt(gameData?.round, 0);
  const leagueRound = finiteInt(gameData?.leagueRound, 0);
  if (season !== transaction.season || round !== transaction.expectedRound) {
    return { status: 'conflict', reason: 'calendar' };
  }
  if (transaction.competition === 'league' && leagueRound !== transaction.expectedLeagueRound) {
    return { status: 'conflict', reason: 'league' };
  }
  return { status: 'ready' };
}

export function stampMatchCommit(gameData = {}, transaction = {}) {
  if (!transaction?.id) return gameData;
  return {
    ...gameData,
    lastMatchCommit: {
      id: transaction.id,
      season: transaction.season,
      calendarRound: transaction.calendarRound,
      competition: transaction.competition,
    },
  };
}

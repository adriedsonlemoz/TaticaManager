export const getPostMatchResultMeta = ({ gameData, matchResultData, liveScore }) => {
  const homeName = matchResultData?.homeName || '';
  const awayName = matchResultData?.awayName || '';
  const isUserHome = homeName === gameData?.club?.name;
  const userScore = isUserHome ? liveScore.home : liveScore.away;
  const opponentScore = isUserHome ? liveScore.away : liveScore.home;

  return {
    isUserHome,
    resultLabel: userScore > opponentScore ? 'VITÓRIA' : userScore < opponentScore ? 'DERROTA' : 'EMPATE',
    resultKind: userScore > opponentScore ? 'win' : userScore < opponentScore ? 'loss' : 'draw',
  };
};

export const parsePostMatchGoal = (event, homeName) => {
  const min = event.match(/^(\d+)'/)?.[1] || '';
  const scorer = event.match(/\(([^)]+)\)/)?.[1] || '';
  const isOwnGoal = event.includes('GOL CONTRA');
  const isHome = isOwnGoal ? !event.includes(`(${homeName})`) : event.includes(homeName);
  return { min, scorer, isHome };
};

export const parsePostMatchCard = (event, homeName, awayName) => {
  const min = event.match(/^(\d+)'/)?.[1] || '';
  const player = event.match(/para (.+?) \(/)?.[1]
    || event.match(/de (.+?) \(/)?.[1]
    || event.match(/EXPULSO! (?:Vermelho direto para )?(.+?) \(/)?.[1]
    || '';
  const team = event.includes(homeName) ? homeName : awayName;
  return { min, player, team };
};

export const buildPostMatchEventGroups = (events = []) => ({
  goals: events.filter(event => event.includes('GOL') || event.includes('⚽')),
  yellows: events.filter(event => event.includes('🟨')),
  reds: events.filter(event => event.includes('🟥')),
});

export const buildPostMatchStats = ({ matchResultData, liveScore, possession }) => {
  const homeShots = Math.max(liveScore.home, matchResultData?.homeShots ?? 0);
  const awayShots = Math.max(liveScore.away, matchResultData?.awayShots ?? 0);

  return {
    homeShots,
    awayShots,
    homeOnTarget: Math.max(liveScore.home, matchResultData?.homeOnTarget ?? Math.round(homeShots * 0.4)),
    awayOnTarget: Math.max(liveScore.away, matchResultData?.awayOnTarget ?? Math.round(awayShots * 0.4)),
    homeCorners: matchResultData?.homeCorners ?? Math.max(0, Math.round(homeShots * 0.35)),
    awayCorners: matchResultData?.awayCorners ?? Math.max(0, Math.round(awayShots * 0.35)),
    homeFouls: matchResultData?.homeFouls ?? 0,
    awayFouls: matchResultData?.awayFouls ?? 0,
    possession: {
      home: possession?.home ?? matchResultData?.homePoss ?? 50,
      away: possession?.away ?? matchResultData?.awayPoss ?? 50,
    },
  };
};

export const getLeaguePositionChange = ({ gameData, sortedTable, isCupMatch }) => {
  if (isCupMatch || !sortedTable?.length) return null;
  const positionIndex = sortedTable.findIndex(team => team.id === 'user');
  if (positionIndex < 0) return null;

  const row = sortedTable[positionIndex];
  const delta = Number(row?.posVariation || 0);
  const posAfter = positionIndex + 1;
  const posBefore = Math.max(1, posAfter + delta);

  return { posBefore, posAfter, delta };
};

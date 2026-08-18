const normalizeTeamIdentityName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

export const isUserMatchTeam = (team, clubName = '') => {
  if (!team || typeof team !== 'object') return false;
  if (team.isPlayer === true) return true;
  if (String(team.id ?? '').trim().toLowerCase() === 'user') return true;
  const expectedName = normalizeTeamIdentityName(clubName);
  return Boolean(expectedName) && normalizeTeamIdentityName(team.name) === expectedName;
};

const idKey = (value) => value == null ? null : String(value);

const isUserHome = (clubName, matchData = {}) => (
  typeof matchData.userIsHome === 'boolean'
    ? matchData.userIsHome
    : isUserMatchTeam({ id:matchData.homeId, name:matchData.homeName, isPlayer:matchData.homeIsPlayer }, clubName)
);

const getMatchScore = (clubName, matchData) => {
  if (!matchData) return null;
  const home = isUserHome(clubName, matchData);
  return {
    isHome: home,
    myGoals: home ? (Number(matchData.homeGoals) || 0) : (Number(matchData.awayGoals) || 0),
    opponentGoals: home ? (Number(matchData.awayGoals) || 0) : (Number(matchData.homeGoals) || 0),
    opponent: home ? matchData.awayName : matchData.homeName,
  };
};

export function syncPlayerSeasonGoals(players, scorers) {
  const goalMap = Object.values(scorers || {}).reduce((map, entry) => {
    const key = idKey(entry?.id);
    if (key != null) map[key] = Number(entry?.goals) || 0;
    return map;
  }, {});
  return (Array.isArray(players) ? players : []).map((player) => {
    const key = idKey(player?.id);
    if (key == null || goalMap[key] === undefined) return player;
    // O ranking `scorers` cobre a Liga; `seasonGoals` também inclui Copas.
    // Nunca reduzimos o total já acumulado ao sincronizar a artilharia da Liga.
    return { ...player, seasonGoals: Math.max(Number(player.seasonGoals) || 0, goalMap[key]) };
  });
}

export function updateHeadToHead(history, clubName, matchData) {
  const next = { ...(history || {}) };
  const score = getMatchScore(clubName, matchData);
  if (!score?.opponent) return next;
  const previous = next[score.opponent] || { w: 0, d: 0, l: 0 };
  next[score.opponent] = score.myGoals > score.opponentGoals
    ? { ...previous, w: (Number(previous.w) || 0) + 1 }
    : score.myGoals === score.opponentGoals
      ? { ...previous, d: (Number(previous.d) || 0) + 1 }
      : { ...previous, l: (Number(previous.l) || 0) + 1 };
  return next;
}

export function advanceStadium(stadium = {}) {
  if (!stadium.underConstruction) return { stadium, completed: false };
  const left = (Number(stadium.underConstruction) || 0) - 1;
  if (left > 0) return { stadium: { ...stadium, underConstruction: left }, completed: false };
  return {
    completed: true,
    stadium: {
      ...stadium,
      capacity: (Number(stadium.capacity) || 15000) + (Number(stadium.pendingCapacity) || 5000),
      level: Number(stadium.pendingLevel) || (Number(stadium.level) || 1) + 1,
      underConstruction: null,
      pendingCapacity: null,
      pendingLevel: null,
    },
  };
}

export function buildManagerProfile(profile, clubName, matchData) {
  const current = profile || {};
  const score = getMatchScore(clubName, matchData);
  if (!score) return { ...current, experience: (Number(current.experience) || 0) + 1 };
  return {
    ...current,
    wins: (Number(current.wins) || 0) + (score.myGoals > score.opponentGoals ? 1 : 0),
    draws: (Number(current.draws) || 0) + (score.myGoals === score.opponentGoals ? 1 : 0),
    losses: (Number(current.losses) || 0) + (score.myGoals < score.opponentGoals ? 1 : 0),
    experience: (Number(current.experience) || 0) + 1,
  };
}

export function syncPlayerSeasonGoals(players, scorers) {
  const goalMap = Object.values(scorers || {}).reduce((map, entry) => {
    if (entry?.id) map[entry.id] = entry.goals || 0;
    return map;
  }, {});
  return (players || []).map((player) => (
    goalMap[player.id] === undefined ? player : { ...player, seasonGoals: goalMap[player.id] }
  ));
}

export function updateHeadToHead(history, clubName, matchData) {
  const next = { ...(history || {}) };
  if (!matchData) return next;
  const isHome = matchData.homeName === clubName;
  const myGoals = isHome ? (matchData.homeGoals || 0) : (matchData.awayGoals || 0);
  const oppGoals = isHome ? (matchData.awayGoals || 0) : (matchData.homeGoals || 0);
  const opponent = isHome ? matchData.awayName : matchData.homeName;
  if (!opponent) return next;
  const previous = next[opponent] || { w: 0, d: 0, l: 0 };
  next[opponent] = myGoals > oppGoals
    ? { ...previous, w: previous.w + 1 }
    : myGoals === oppGoals
      ? { ...previous, d: previous.d + 1 }
      : { ...previous, l: previous.l + 1 };
  return next;
}

export function advanceStadium(stadium = {}) {
  if (!stadium.underConstruction) return { stadium, completed: false };
  const left = stadium.underConstruction - 1;
  if (left > 0) return { stadium: { ...stadium, underConstruction: left }, completed: false };
  return {
    completed: true,
    stadium: {
      ...stadium,
      capacity: (stadium.capacity || 15000) + (stadium.pendingCapacity || 5000),
      level: stadium.pendingLevel || (stadium.level || 1) + 1,
      underConstruction: null,
      pendingCapacity: null,
      pendingLevel: null,
    },
  };
}

export function buildManagerProfile(profile, clubName, matchData) {
  const current = profile || {};
  if (!matchData) return { ...current, experience: (current.experience || 0) + 1 };
  const isHome = matchData.homeName === clubName;
  const myGoals = isHome ? (matchData.homeGoals || 0) : (matchData.awayGoals || 0);
  const oppGoals = isHome ? (matchData.awayGoals || 0) : (matchData.homeGoals || 0);
  return {
    ...current,
    wins: (current.wins || 0) + (myGoals > oppGoals ? 1 : 0),
    draws: (current.draws || 0) + (myGoals === oppGoals ? 1 : 0),
    losses: (current.losses || 0) + (myGoals < oppGoals ? 1 : 0),
    experience: (current.experience || 0) + 1,
  };
}

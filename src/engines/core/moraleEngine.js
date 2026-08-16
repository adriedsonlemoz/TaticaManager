const resultPoints = (match) => {
  if (!match?.played || !match.result) return null;
  const [homeGoals, awayGoals] = String(match.result).split('-').map((value) => Number.parseInt(value, 10) || 0);
  const playerAtHome = Boolean(match.home?.isPlayer);
  const playerGoals = playerAtHome ? homeGoals : awayGoals;
  const opponentGoals = playerAtHome ? awayGoals : homeGoals;
  return playerGoals > opponentGoals ? 3 : playerGoals === opponentGoals ? 1 : 0;
};

export function getRecentMoraleResults(fixtures = [], limit = 5) {
  const form = [];
  for (let index = fixtures.length - 1; index >= 0 && form.length < limit; index -= 1) {
    const userMatch = (fixtures[index] || []).find((match) => match?.home?.isPlayer || match?.away?.isPlayer);
    const points = resultPoints(userMatch);
    if (points != null) form.push(points);
  }
  return form;
}

export function calculateMorale(gameData) {
  if (!gameData) return 60;
  const form = getRecentMoraleResults(gameData.fixtures || []);
  if (form.length === 0) return Math.max(10, (gameData.morale ?? 60) - 1);

  const points = form.reduce((sum, value) => sum + value, 0);
  const maxPoints = form.length * 3;
  const decay = Math.max(0, 5 - form.length);
  const morale = Math.round(40 + (points / maxPoints) * 60) - decay;
  return Math.max(10, Math.min(100, morale));
}

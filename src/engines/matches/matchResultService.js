export function getMatchResult(match) {
  if (!match?.result) return null;
  const [homeGoals, awayGoals] = String(match.result).split('-').map(Number);
  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return null;

  const won = (match.home?.isPlayer && homeGoals > awayGoals)
    || (match.away?.isPlayer && awayGoals > homeGoals);
  const draw = homeGoals === awayGoals;
  const penalties = match.penalties;

  return {
    homeGoals,
    awayGoals,
    penaltiesLabel: penalties ? `pen. ${penalties.home}×${penalties.away}` : null,
    outcome: won ? 'win' : draw ? 'draw' : 'loss',
  };
}

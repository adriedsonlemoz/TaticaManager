const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildTeamShots = ({ goals, possession, rng }) => {
  const baseMisses = 4 + Math.floor(rng() * 4);
  const possessionAdjustment = Math.floor((possession - 50) / 10);
  const shots = Math.max(goals, goals + baseMisses + possessionAdjustment);
  const possibleExtraOnTarget = Math.max(1, Math.floor(shots * 0.35));
  const onTarget = clamp(goals + Math.floor(rng() * possibleExtraOnTarget), goals, shots);
  const corners = Math.max(0, Math.round(shots * 0.30 + rng() * 2));
  const fouls = 7 + Math.floor(rng() * 9);
  return { shots, onTarget, corners, fouls };
};

export const buildMatchStatistics = ({
  homeGoals,
  awayGoals,
  adjustedHomeStrength,
  adjustedAwayStrength,
  rng = Math.random,
}) => {
  const totalStrength = adjustedHomeStrength + adjustedAwayStrength || 1;
  const homePoss = clamp(Math.round((adjustedHomeStrength / totalStrength) * 100), 20, 80);
  const awayPoss = 100 - homePoss;
  const home = buildTeamShots({ goals: homeGoals, possession: homePoss, rng });
  const away = buildTeamShots({ goals: awayGoals, possession: awayPoss, rng });

  return {
    homeShots: home.shots,
    awayShots: away.shots,
    homeOnTarget: home.onTarget,
    awayOnTarget: away.onTarget,
    homeCorners: home.corners,
    awayCorners: away.corners,
    homeFouls: home.fouls,
    awayFouls: away.fouls,
    homePoss,
    awayPoss,
  };
};

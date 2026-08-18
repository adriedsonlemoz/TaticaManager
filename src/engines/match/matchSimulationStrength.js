import { diexDatabase } from '../../data/database.js';
import { calcCPUAvailableStrength } from '../core/teamMetrics.js';
import { CpuAI } from '../engine_cpu_ai.js';
import { FatigueEngine } from '../engine_fatigue.js';
import { MATCH_SIMULATION_RATES } from './matchSimulationConfig.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const applyRecentFormBonus = (team, baseStrength) => {
  if (!Array.isArray(team?.recentForm) || team.recentForm.length === 0) return baseStrength;
  const wins = team.recentForm.filter((result) => result === 'W').length;
  const losses = team.recentForm.filter((result) => result === 'L').length;
  return clamp(baseStrength + Math.round((wins - losses) * 1.3), 40, 99);
};

export const getManagerStyleMultipliers = (style = 'Equilibrado') => {
  if (style === 'Ofensivo') return { userAttack: 1.04, opponentAttack: 1.03 };
  if (style === 'Defensivo') return { userAttack: 0.97, opponentAttack: 0.96 };
  return { userAttack: 1, opponentAttack: 1 };
};

export const getIndividualMoraleMultiplier = (starters = []) => {
  if (!starters.length) return 1;
  const average = starters.reduce((sum, player) => sum + (player.moralIndividual ?? 60), 0) / starters.length;
  return 0.95 + (clamp(average, 0, 100) / 100) * 0.10;
};

export const getUserTeamStrength = (starters = [], tactics = {}) => {
  if (FatigueEngine?.calcTeamStrength) {
    return FatigueEngine.calcTeamStrength(starters, null, tactics.isValid !== false);
  }
  if (!starters.length) return 60;
  const total = starters.reduce((sum, player) => {
    const penalty = FatigueEngine?.getOverallPenalty?.(player.energy ?? 100) || 0;
    return sum + Math.max(30, (player.overall || 60) - penalty);
  }, 0);
  const average = Math.floor(total / starters.length);
  return tactics.isValid === false ? average - 8 : average;
};

const getCpuTeamStrength = (team, gameData) => {
  const nextRound = (gameData?.round || 0) + 1;
  const available = calcCPUAvailableStrength(team, gameData?.teamRosters, nextRound);
  const withForm = applyRecentFormBonus(team, available);
  const cpuBonus = gameData?.difficultyMultipliers?.cpuStrengthBonus || 0;
  return clamp(withForm + cpuBonus, 40, 99);
};

export const getTeamFanBase = (team, gameData) => {
  if (team?.isPlayer) {
    const loyalty = gameData?.club?.fanLoyalty;
    if (Number.isFinite(loyalty)) return clamp(loyalty / 100, 0, 1);
  }
  if (Number.isFinite(team?.fanBase)) return clamp(team.fanBase, 0, 1);
  const allTeams = [
    ...(diexDatabase?.serieATeams || []),
    ...(diexDatabase?.serieBTeams || []),
    ...(diexDatabase?.serieCTeams || []),
    ...(diexDatabase?.serieDTeams || []),
  ];
  const found = allTeams.find((candidate) => (
    (team?.id && candidate.id === team.id) || candidate.name === team?.name
  ));
  return clamp(found?.fanBase ?? 0.5, 0, 1);
};

export const calculateHomeAdvantage = (home, away, gameData) => {
  const homeFanBase = getTeamFanBase(home, gameData);
  const awayFanBase = getTeamFanBase(away, gameData);
  return clamp(1.08 + (homeFanBase * 0.10) - (awayFanBase * 0.04), 1.04, 1.25);
};

export const resolveMatchStrengths = ({ gameData, home, away, tactics = {}, starters = [] }) => {
  let homeStrength = home?.isPlayer
    ? getUserTeamStrength(starters, tactics)
    : getCpuTeamStrength(home, gameData);
  let awayStrength = away?.isPlayer
    ? getUserTeamStrength(starters, tactics)
    : getCpuTeamStrength(away, gameData);

  const moraleMultiplier = CpuAI?.getMoraleMultiplier
    ? CpuAI.getMoraleMultiplier(gameData?.morale)
    : (1 + (((gameData?.morale ?? 60) - 60) / 400));
  const individualMoraleMultiplier = getIndividualMoraleMultiplier(starters);
  const style = getManagerStyleMultipliers(gameData?.club?.managerProfile?.style || 'Equilibrado');

  if (home?.isPlayer) {
    homeStrength = Math.round(homeStrength * moraleMultiplier * individualMoraleMultiplier * style.userAttack);
    awayStrength = Math.round(awayStrength * style.opponentAttack);
  } else if (away?.isPlayer) {
    awayStrength = Math.round(awayStrength * moraleMultiplier * individualMoraleMultiplier * style.userAttack);
    homeStrength = Math.round(homeStrength * style.opponentAttack);
  }

  homeStrength = clamp(homeStrength, 30, 110);
  awayStrength = clamp(awayStrength, 30, 110);

  const homeAdvantage = calculateHomeAdvantage(home, away, gameData);
  const adjustedHomeStrength = homeStrength * homeAdvantage;
  const adjustedAwayStrength = awayStrength;
  const total = adjustedHomeStrength + adjustedAwayStrength || 1;

  return {
    homeStrength,
    awayStrength,
    homeAdvantage,
    adjustedHomeStrength,
    adjustedAwayStrength,
    homeGoalProbability: (adjustedHomeStrength / total) * MATCH_SIMULATION_RATES.goalPerMinuteTotal,
    awayGoalProbability: (adjustedAwayStrength / total) * MATCH_SIMULATION_RATES.goalPerMinuteTotal,
  };
};

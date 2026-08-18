import { AcademyEngine } from '../engine_academy.js';
import { appendFinancialEntry } from '../finances/financeLedger.js';
import { syncUserRosterState } from '../core/gameStateIntegrity.js';

export const ACADEMY_FILTERS = ['all', 'ready', 'burst', 'steady', 'late'];

export const ACADEMY_TRAJECTORIES = {
  burst: { key: 'burst', label: '🚀 Explosivo', shortLabel: 'EXPLOSIVO', desc: 'Evolui mais rápido quando jovem' },
  steady: { key: 'steady', label: '📈 Constante', shortLabel: 'CONSTANTE', desc: 'Mantém progresso mais equilibrado' },
  late: { key: 'late', label: '⏳ Revelação', shortLabel: 'REVELAÇÃO', desc: 'Tende a florescer mais tarde' },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const getTrajectoryInfo = (trajectory) => (
  ACADEMY_TRAJECTORIES[trajectory] || ACADEMY_TRAJECTORIES.steady
);

export const getProspectWage = (prospect) => Math.max(
  3000,
  Math.round(((prospect?.value || 50000) * 0.012) / 1000) * 1000,
);

export const getProspectDevelopmentProgress = (prospect) => {
  const overall = Number(prospect?.overall) || 50;
  const potential = Math.max(overall, Number(prospect?.potential) || 70);
  const denominator = Math.max(1, potential - 40);
  return clamp(Math.round(((overall - 40) / denominator) * 100), 0, 100);
};

export const getAcademyProspects = (gameData = {}) => {
  const professionalIds = new Set((gameData.players || []).map((player) => player.id));
  return AcademyEngine.mergeProspectPools(gameData.academy, gameData.academyReady)
    .filter((prospect) => prospect?.id && !professionalIds.has(prospect.id));
};

export const getAcademyStats = (prospects = [], promoteAge = AcademyEngine.PROMOTE_AGE) => {
  const ready = prospects.filter((prospect) => (prospect.age || 0) >= promoteAge);
  const average = (key) => prospects.length
    ? Math.round(prospects.reduce((sum, prospect) => sum + (Number(prospect[key]) || 0), 0) / prospects.length)
    : 0;
  const totalValue = prospects.reduce((sum, prospect) => sum + (Number(prospect.value) || 0), 0);
  const positionFrequency = prospects.reduce((acc, prospect) => {
    const position = prospect.position || '—';
    acc[position] = (acc[position] || 0) + 1;
    return acc;
  }, {});
  const mostCommonPosition = Object.entries(positionFrequency)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || '—';

  return {
    total: prospects.length,
    readyCount: ready.length,
    averageOverall: average('overall'),
    averagePotential: average('potential'),
    totalValue,
    bestOverall: prospects.length ? Math.max(...prospects.map((prospect) => Number(prospect.overall) || 0)) : 0,
    bestPotential: prospects.length ? Math.max(...prospects.map((prospect) => Number(prospect.potential) || 0)) : 0,
    mostCommonPosition,
  };
};

export const filterAcademyProspects = (prospects = [], filter = 'all', promoteAge = AcademyEngine.PROMOTE_AGE) => {
  if (filter === 'ready') return prospects.filter((prospect) => (prospect.age || 0) >= promoteAge);
  if (['burst', 'steady', 'late'].includes(filter)) {
    return prospects.filter((prospect) => prospect.trajectory === filter);
  }
  return prospects;
};

export const getAcademyFilterOptions = (prospects = [], promoteAge = AcademyEngine.PROMOTE_AGE) => [
  { id: 'all', label: 'Todos', count: prospects.length },
  { id: 'ready', label: '🌟 Prontos', count: prospects.filter((prospect) => (prospect.age || 0) >= promoteAge).length },
  { id: 'burst', label: '🚀 Explosivo', count: prospects.filter((prospect) => prospect.trajectory === 'burst').length },
  { id: 'steady', label: '📈 Constante', count: prospects.filter((prospect) => prospect.trajectory === 'steady').length },
  { id: 'late', label: '⏳ Revelação', count: prospects.filter((prospect) => prospect.trajectory === 'late').length },
];

export const getAcademyInvestmentOptions = (gameData = {}) => {
  const currentLevel = gameData.club?.academyLevel || 'basic';
  const currentIndex = AcademyEngine.LEVEL_ORDER.indexOf(currentLevel);
  const money = Number(gameData.club?.money) || 0;

  return AcademyEngine.LEVEL_ORDER.map((key, index) => {
    const info = AcademyEngine.LEVELS[key];
    const isCurrent = key === currentLevel;
    const isPrevious = index < currentIndex;
    const isUpgrade = index > currentIndex;
    const canAfford = money >= info.cost;
    return {
      key,
      ...info,
      isCurrent,
      isPrevious,
      isUpgrade,
      canAfford,
      canInvest: isUpgrade && canAfford,
    };
  });
};

export const buildAcademyViewModel = (gameData = {}, filter = 'all') => {
  const academyLevel = gameData.club?.academyLevel || 'basic';
  const prospects = getAcademyProspects(gameData);
  const promoteAge = AcademyEngine.PROMOTE_AGE;
  const stats = getAcademyStats(prospects, promoteAge);

  return {
    academyLevel,
    levelInfo: AcademyEngine.LEVELS[academyLevel] || AcademyEngine.LEVELS.basic,
    prestige: AcademyEngine.LEVELS[academyLevel]?.prestige ?? 20,
    promoteAge,
    prospects,
    filteredProspects: filterAcademyProspects(prospects, filter, promoteAge),
    filters: getAcademyFilterOptions(prospects, promoteAge),
    stats,
    investmentOptions: getAcademyInvestmentOptions(gameData),
  };
};

const removeProspect = (pool, prospectId) => (pool || []).filter((prospect) => prospect.id !== prospectId);

export const promoteProspectState = (gameData, prospect) => {
  if (!prospect) return gameData;
  const professional = AcademyEngine.promoteProspect(prospect, gameData.club?.name || prospect.teamName);
  const players = [...(gameData.players || []), professional];
  return syncUserRosterState({
    ...gameData,
    academy: removeProspect(gameData.academy, prospect.id),
    academyReady: removeProspect(gameData.academyReady, prospect.id),
  }, players);
};

export const dispenseProspectState = (gameData, prospectId) => ({
  ...gameData,
  academy: removeProspect(gameData.academy, prospectId),
  academyReady: removeProspect(gameData.academyReady, prospectId),
});

export const investAcademyState = (gameData, level) => {
  const result = AcademyEngine.investAcademy(gameData, level);
  if (result.error) return { state: gameData, ...result };

  const info = AcademyEngine.LEVELS[result.newLevel];
  const transaction = {
    round: gameData.round || 0,
    income: 0,
    expense: result.cost,
    total: -result.cost,
    detail: { description: `Investimento: Academia (${info.label})` },
  };

  return {
    state: {
      ...gameData,
      club: {
        ...(gameData.club || {}),
        money: (Number(gameData.club?.money) || 0) - result.cost,
        academyLevel: result.newLevel,
      },
      financialHistory: appendFinancialEntry(gameData.financialHistory, transaction, { season: gameData.season, round: gameData.round, leagueRound: gameData.leagueRound ?? gameData.round, competition: 'academy' }),
    },
    ...result,
    label: info.label,
  };
};

export const ensureAcademyState = (gameData) => {
  if (Array.isArray(gameData?.academy)) return gameData;
  return {
    ...gameData,
    academy: AcademyEngine.initUserAcademy(
      gameData?.club?.name || 'Clube',
      'user',
      gameData?.club?.academyLevel || 'basic',
    ),
  };
};

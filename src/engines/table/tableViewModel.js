import { getTeamCoach } from '../../data/database_coaches.js';
import { evaluateTransferPurchase, getTransferFunds } from '../market/transferRules.js';
import { samePlayerId } from '../market/marketIntegrity.js';
import { getSerieDPhaseLabel, getSerieDUserOutcome } from '../serieD/serieDCompetition.js';
import { getSerieCPhaseLabel, getSerieCUserOutcome } from '../serieC/serieCCompetition.js';

export const TABLE_TABS = ['CLASSIFICAÇÃO', 'ARTILHEIROS'];

const DEFAULT_ZONE = Object.freeze({
  type: 'neutral',
  colorKey: null,
  label: '',
  background: null,
  icon: null,
});

const getZoneForSerieA = (index) => {
  if (index < 4) return { type: 'libertadores', colorKey: 'zGreen', label: 'Libertadores', background: 'rgba(34,197,94,0.10)', icon: '🌟' };
  if (index < 6) return { type: 'pre-libertadores', colorKey: 'zLightBlue', label: 'Pré-Libertadores', background: 'rgba(0,212,200,0.08)', icon: '🌟' };
  if (index < 12) return { type: 'sul-americana', colorKey: 'zBlue', label: 'Sul-Americana', background: 'rgba(59,130,246,0.08)', icon: '🌎' };
  if (index >= 16) return { type: 'relegation', colorKey: 'zRed', label: 'Rebaixamento', background: 'rgba(239,68,68,0.10)', icon: null };
  return DEFAULT_ZONE;
};

const getZoneForLowerSerie = (index, serie, context = {}) => {
  if (serie === 'C' && context.serieCCompetition) {
    const phase = context.serieCCompetition.phase || 'first';
    const inFirstPhaseTable = phase === 'first' || phase === 'finished-for-user' || Number(context.totalTeams) > 8;
    if (inFirstPhaseTable) {
      if (index < 8) return { type:'qualification', colorKey:'zGreen', label:'Classificação à 2ª Fase', background:'rgba(34,197,94,0.10)', icon:'✅' };
      const totalTeams = Math.max(1, Number(context.totalTeams) || 24);
      if (index >= totalTeams - 2) return { type:'relegation', colorKey:'zRed', label:'Rebaixamento Série D', background:'rgba(239,68,68,0.10)', icon:null };
      return DEFAULT_ZONE;
    }
    if (index < 2) return { type:'promotion', colorKey:'zGreen', label:'Acesso Série B', background:'rgba(34,197,94,0.10)', icon:'⬆️' };
    return DEFAULT_ZONE;
  }
  if (index < 4) {
    if (serie === 'D') return { type: 'qualification', colorKey: 'zGreen', label: 'Classificação à 2ª Fase', background: 'rgba(34,197,94,0.10)', icon: '✅' };
    const target = serie === 'B' ? 'A' : 'B';
    return { type: 'promotion', colorKey: 'zGreen', label: `Acesso Série ${target}`, background: 'rgba(34,197,94,0.10)', icon: '⬆️' };
  }
  const totalTeams = Math.max(1, Number(context.totalTeams) || 20);
  const relegationCount = serie === 'C' && Number(context.season) <= 2027 ? 2 : 4;
  if (index >= totalTeams - relegationCount) {
    if (serie === 'D') return DEFAULT_ZONE;
    const target = serie === 'B' ? 'C' : 'D';
    return { type: 'relegation', colorKey: 'zRed', label: `Rebaixamento ${target}`, background: 'rgba(239,68,68,0.10)', icon: null };
  }
  return DEFAULT_ZONE;
};

export const getLeagueZone = (index, serie = 'A', context = {}) => {
  if (serie === 'A') return getZoneForSerieA(index);
  if (['B', 'C', 'D'].includes(serie)) return getZoneForLowerSerie(index, serie, context);

  if (index < 4) return { type: 'promotion', colorKey: 'zGreen', label: 'Acesso', background: 'rgba(34,197,94,0.10)', icon: '⬆️' };
  if (index >= 16) return { type: 'relegation', colorKey: 'zRed', label: 'Rebaixamento', background: 'rgba(239,68,68,0.10)', icon: null };
  return DEFAULT_ZONE;
};

export const getSeasonMovement = (index, serie = 'A', isSeasonEnd = false, context = {}) => {
  if (!isSeasonEnd) return null;

  if (serie === 'A') {
    if (index >= 16) return { icon: '⬇️', color: '#ef4444', label: 'Rebaixado → Série B' };
    if (index < 4) return { icon: '🌟', color: '#22c55e', label: 'Libertadores' };
    return null;
  }

  if (serie === 'B') {
    if (index >= 16) return { icon: '⬇️', color: '#ef4444', label: 'Rebaixado → Série C' };
    if (index < 4) return { icon: '⬆️', color: '#22c55e', label: 'Acesso → Série A' };
    return null;
  }

  if (serie === 'C') {
    const totalTeams = Math.max(1, Number(context.totalTeams) || 20);
    const relegationCount = Number(context.season) <= 2027 ? 2 : 4;
    if (index >= totalTeams - relegationCount) return { icon: '⬇️', color: '#ef4444', label: 'Rebaixado → Série D' };
    if (index < 4) return { icon: '⬆️', color: '#22c55e', label: 'Acesso → Série B' };
    return null;
  }

  if (serie === 'D' && index < 4) {
    return { icon: '✅', color: '#22c55e', label: 'Classificado à 2ª Fase' };
  }

  return null;
};

export const getLeagueLegend = (serie = 'A', context = {}) => {
  if (serie === 'A') {
    return [
      { colorKey: 'zGreen', label: '🌟 Libertadores (G4)' },
      { colorKey: 'zLightBlue', label: '🌟 Pré-Libertadores (G6)' },
      { colorKey: 'zBlue', label: '🌎 Sul-Americana (G12)' },
      { colorKey: 'zRed', label: '⬇ Rebaixamento (Z4)' },
    ];
  }
  if (serie === 'B') {
    return [
      { colorKey: 'zGreen', label: '⬆ Acesso Série A (G4)' },
      { colorKey: 'zRed', label: '⬇ Rebaixamento C (Z4)' },
    ];
  }
  if (serie === 'C') {
    if (context.serieCCompetition) {
      const phase = context.serieCCompetition.phase || 'first';
      const inFirstPhaseTable = phase === 'first' || phase === 'finished-for-user' || Number(context.totalTeams) > 8;
      return inFirstPhaseTable
        ? [
            { colorKey:'zGreen', label:'✅ Classificam à 2ª Fase (G8)' },
            { colorKey:'zRed', label:'⬇ Rebaixamento D (Z2)' },
          ]
        : [{ colorKey:'zGreen', label:'⬆ Acesso Série B (G2 do grupo)' }];
    }
    const relegationLabel = Number(context.season) <= 2027 ? 'Z2' : 'Z4';
    return [
      { colorKey: 'zGreen', label: '⬆ Acesso Série B (G4)' },
      { colorKey: 'zRed', label: `⬇ Rebaixamento D (${relegationLabel})` },
    ];
  }
  return [
    { colorKey: 'zGreen', label: '✅ Classificam à 2ª Fase (G4)' },
  ];
};

export const getSeasonProgress = (gameData = {}) => {
  const totalRounds = Array.isArray(gameData.fixtures) && gameData.fixtures.length > 0
    ? gameData.fixtures.length
    : 38;
  const hasLeagueRound = gameData.leagueRound !== undefined && gameData.leagueRound !== null
    && Number.isFinite(Number(gameData.leagueRound));
  const currentRound = hasLeagueRound ? Number(gameData.leagueRound) : (Number(gameData.round) || 0);
  return {
    currentRound: Math.max(0, currentRound),
    totalRounds,
    isSeasonEnd: currentRound >= totalRounds,
  };
};

export const buildStandingsRows = (gameData = {}, isSeasonEnd = false) => {
  const serie = gameData.serie || 'A';
  const managerName = gameData.club?.manager || 'Você';

  const context = { season:gameData.season, totalTeams:(gameData.table || []).length, serieCCompetition:gameData.serieCCompetition || null };
  return (gameData.table || []).map((team, index) => {
    const isUser = team.id === 'user';
    const zone = getLeagueZone(index, serie, context);
    return {
      ...team,
      index,
      position: index + 1,
      isUser,
      goalDifference: (Number(team.gf) || 0) - (Number(team.ga) || 0),
      zone,
      movement: serie === 'D' && isUser && isSeasonEnd
      ? (() => { const out = getSerieDUserOutcome(gameData); return out?.promoted ? { icon:'⬆️', color:'#22c55e', label:'Acesso → Série C' } : null; })()
      : serie === 'C' && gameData.serieCCompetition && isUser && isSeasonEnd
        ? (() => {
            const out = getSerieCUserOutcome(gameData);
            if (out?.promoted) return { icon:'⬆️', color:'#22c55e', label:'Acesso → Série B' };
            if (out?.relegated) return { icon:'⬇️', color:'#ef4444', label:'Rebaixado → Série D' };
            return null;
          })()
        : getSeasonMovement(index, serie, isSeasonEnd, context),
      coach: isUser ? managerName : getTeamCoach(team.name),
    };
  });
};

export const buildScorers = (scorers = {}) => Object.values(scorers || {})
  .filter(value => value && typeof value === 'object')
  .sort((a, b) => (Number(b.goals) || 0) - (Number(a.goals) || 0))
  .slice(0, 20)
  .map((player, index, sorted) => ({
    ...player,
    rank: index + 1,
    goals: Number(player.goals) || 0,
    maxGoals: Math.max(1, Number(sorted[0]?.goals) || 0),
    scorerKey: `${player.teamId || player.team || 'team'}:${player.id || player.name || index}`,
  }));

export const isScorerAlreadyInSquad = (gameData = {}, scorer = {}) => Boolean(
  scorer.isUserTeam || (gameData.players || []).some(player => samePlayerId(player, scorer))
);

const SCORER_TRANSFER_LABELS = Object.freeze({
  already_owned: '✅ No seu elenco',
  cash: '💸 Sem saldo',
  transfer_budget: '📉 Fora do orçamento',
  window_closed: '🔒 Janela fechada',
  seller_min_squad: '👥 Clube sem reposição',
  reputation: '⭐ Clube sem prestígio',
  financial_crisis: '⚠️ Crise financeira',
  unavailable: '⏳ Indisponível',
  invalid_price: '⚠️ Valor inválido',
});

export const getScorerPurchaseStatus = (gameData = {}, scorer = {}) => {
  const alreadyInSquad = isScorerAlreadyInSquad(gameData, scorer);
  if (alreadyInSquad) return { alreadyInSquad, canBuy: false, label: SCORER_TRANSFER_LABELS.already_owned, reason: 'already' };

  const normalized = normalizeScorerForTransfer(scorer);
  const eligibility = evaluateTransferPurchase(gameData, normalized, normalized.agreedTransferFee ?? normalized.value ?? 0);
  if (eligibility.allowed) return { alreadyInSquad: false, canBuy: true, label: '🤝 Contratar', reason: null };

  const reason = eligibility.code === 'transfer_budget' ? 'budget' : eligibility.code;
  return {
    alreadyInSquad: false,
    canBuy: false,
    label: SCORER_TRANSFER_LABELS[eligibility.code] || eligibility.label || '🚫 Indisponível',
    reason,
  };
};

export const getScorerTransferFunds = (gameData = {}) => getTransferFunds(gameData);

export const normalizeScorerForTransfer = (scorer = {}) => ({
  ...scorer,
  teamName: scorer.teamName || scorer.team || 'Livre',
  isStarting: false,
  shirt: null,
  goals: 0,
  assists: 0,
  energy: 100,
  injury: null,
});

export const buildTableViewModel = (gameData = {}) => {
  const progress = getSeasonProgress(gameData);
  const scorers = buildScorers(gameData.scorers);

  return {
    serie: gameData.serie || 'A',
    phaseLabel: getSerieDPhaseLabel(gameData) || getSerieCPhaseLabel(gameData),
    ...progress,
    standings: buildStandingsRows(gameData, progress.isSeasonEnd),
    legend: getLeagueLegend(gameData.serie || 'A', { season:gameData.season, totalTeams:(gameData.table || []).length, serieCCompetition:gameData.serieCCompetition || null }),
    scorers,
  };
};

import { buildSeasonSnapshot } from './seasonOutcome.js';

const number = (value) => Number(value) || 0;

function fallbackSnapshot(gameData = {}) {
  const stored = gameData.seasonResult;
  if (stored?.league && stored?.squad && stored?.finances) return stored;

  // Compatibilidade com saves beta.27 ou anteriores: preserva os campos antigos
  // e completa o que ainda estiver disponível no estado carregado.
  const fallback = buildSeasonSnapshot({
    ...gameData,
    season: stored?.season ?? Math.max(0, number(gameData.season) - 1),
    serie: stored?.prevSerie || gameData.serie || 'A',
  });
  return {
    ...fallback,
    ...(stored || {}),
    league: stored?.league || fallback.league,
    squad: stored?.squad || fallback.squad,
    finances: stored?.finances || fallback.finances,
  };
}

export function buildSeasonEndViewModel(gameData = {}) {
  const result = fallbackSnapshot(gameData);
  const league = result.league || {};
  const squad = result.squad || {};
  const finances = result.finances || {};
  const goalDifference = number(league.goalsFor) - number(league.goalsAgainst);
  const newSerie = gameData.serie || result.newSerie || result.prevSerie || 'A';
  const tone = result.champion || result.promoted ? 'success' : result.relegated ? 'danger' : 'gold';
  const icon = result.champion ? '🏆' : result.promoted ? '🎉' : result.relegated ? '😰' : '📋';
  const title = result.champion ? 'CAMPEÃO!'
    : result.promoted ? 'PROMOVIDO!'
      : result.relegated ? 'REBAIXADO'
        : 'TEMPORADA ENCERRADA';

  const achievements = [];
  if (result.champion) achievements.push({ icon: '🏆', text: `Campeão da Série ${result.prevSerie}!` });
  if (result.promoted) achievements.push({ icon: '⬆️', text: `Promovido para a Série ${result.newSerie}!` });
  if (result.relegated) achievements.push({ icon: '⬇️', text: `Rebaixado para a Série ${result.newSerie}` });
  if (squad.topScorer?.goals > 0) achievements.push({ icon: '⚽', text: `Artilheiro: ${String(squad.topScorer.name || '').split(' ').pop()} (${squad.topScorer.goals} gols)` });
  if (number(league.wins) >= 20) achievements.push({ icon: '💪', text: `${league.wins} vitórias na temporada!` });
  if (number(league.goalsFor) >= 50) achievements.push({ icon: '🎯', text: `${league.goalsFor} gols marcados!` });

  return {
    result,
    tone,
    icon,
    title,
    achievements,
    league: {
      wins: number(league.wins),
      draws: number(league.draws),
      losses: number(league.losses),
      goalsFor: number(league.goalsFor),
      goalsAgainst: number(league.goalsAgainst),
      goalDifference,
    },
    squad: {
      count: number(squad.count),
      avgOverall: number(squad.avgOverall),
      totalValue: number(squad.totalValue),
      totalWage: number(squad.totalWage),
      topPlayers: squad.topPlayers || [],
      topScorer: squad.topScorer || null,
      topAssist: squad.topAssist || null,
    },
    finances: {
      income: number(finances.income),
      expense: number(finances.expense),
      net: number(finances.net),
      transactions: finances.transactions || [],
    },
    nextSeason: {
      season: number(result.season) + 1,
      serie: newSerie,
      playerCount: gameData.players?.length || 0,
      money: number(gameData.club?.money),
      transferBudget: number(gameData.club?.transferBudget),
      wage: number(gameData.club?.wage),
    },
  };
}

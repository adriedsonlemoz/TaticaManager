const OBJECTIVES = {
  champion: { icon: '🏆', label: 'Ser Campeão' },
  promotion: { icon: '⬆️', label: 'Subir de Div.' },
  libertadores: { icon: '🌎', label: 'Libertadores' },
  sulamericana: { icon: '🌐', label: 'Sul-Americana' },
  survive: { icon: '🛡️', label: 'Não Rebaixar' },
  midtable: { icon: '📊', label: 'Meio da Tabela' },
};

const AVATARS = {
  suit: '🤵',
  jacket: '🧥',
  glasses: '🕶️',
  cap: '🧢',
  beard: '🧔',
  headset: '🎧',
};

export const sortSavesByRecent = (saves = []) => [...(saves || [])].sort((a, b) => {
  const byDate = Number(b?.savedAt || 0) - Number(a?.savedAt || 0);
  if (byDate !== 0) return byDate;
  return String(a?.name || '').localeCompare(String(b?.name || ''), 'pt-BR');
});

export const getBootStats = (saves = []) => {
  const list = saves || [];
  return {
    saves: list.length,
    seasons: list.reduce((sum, meta) => sum + Number(meta?.managerProfile?.seasonsTotal || 0), 0),
    wins: list.reduce((sum, meta) => sum + Number(meta?.managerProfile?.wins || 0), 0),
    trophies: list.reduce((sum, meta) => sum + Number(meta?.managerProfile?.trophies ?? meta?.trophies ?? 0), 0),
  };
};

export const formatSavedAt = (timestamp, now = Date.now()) => {
  if (!timestamp) return 'Nunca salvo';
  const value = Number(timestamp);
  if (!Number.isFinite(value)) return 'Data desconhecida';
  const diff = Math.max(0, Math.floor((Number(now) - value) / 1000));
  if (diff < 60) return 'Agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const getDifficultyStyle = (difficulty) => {
  if (difficulty === 'Fácil') return { tone: 'greenLight', icon: '🟢' };
  if (difficulty === 'Difícil') return { tone: 'orangeDark', icon: '🟠' };
  if (difficulty === 'Lendário') return { tone: 'red', icon: '🔴' };
  return { tone: 'gold', icon: '🟡' };
};

export const getObjectiveInfo = (objective) => OBJECTIVES[objective] || null;
export const getAvatarEmoji = (style) => AVATARS[style] || AVATARS.suit;

export const getRoundProgress = (round, total) => {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeRound = Math.max(0, Number(round) || 0);
  const percentage = safeTotal > 0 ? Math.min(100, Math.round((safeRound / safeTotal) * 100)) : 0;
  return { round: Math.min(safeRound, safeTotal || safeRound), total: safeTotal, percentage };
};

export const getCareerPerformance = (meta = {}) => {
  const profile = meta.managerProfile || {};
  const wins = Number(profile.wins || 0);
  const draws = Number(profile.draws || 0);
  const losses = Number(profile.losses || 0);
  const total = wins + draws + losses;
  const percentage = (value) => total > 0 ? Math.round((value / total) * 100) : 0;
  const seasons = Number(profile.seasonsTotal ?? 0) || Math.max(1, Number(meta.season || 2026) - 2025);
  return {
    wins,
    draws,
    losses,
    total,
    seasons,
    trophies: Number(profile.trophies ?? meta.trophies ?? 0),
    winPct: percentage(wins),
    drawPct: percentage(draws),
    lossPct: percentage(losses),
  };
};

export const formatCompactMoney = (value) => {
  const money = Number(value || 0);
  if (Math.abs(money) >= 1e6) return `R$${(money / 1e6).toFixed(1).replace('.0', '')}M`;
  if (Math.abs(money) >= 1e3) return `R$${(money / 1e3).toFixed(0)}K`;
  return `R$${money}`;
};

export const buildSaveViewModel = (meta = {}, now = Date.now()) => ({
  ...meta,
  managerProfile: meta.managerProfile || {},
  objectiveInfo: getObjectiveInfo(meta.seasonObjective),
  difficultyStyle: getDifficultyStyle(meta.difficulty),
  avatarEmoji: getAvatarEmoji(meta.avatarStyle),
  positionLabel: meta.position ? `${meta.position}º` : '—',
  savedAtLabel: formatSavedAt(meta.savedAt, now),
  progress: getRoundProgress(meta.round, meta.totalRounds),
  career: getCareerPerformance(meta),
  moneyLabel: formatCompactMoney(meta.money),
});

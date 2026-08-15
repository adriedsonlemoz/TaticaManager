export const ACADEMY_ACCENT = '#7c3aed';

export const LEVEL_VISUALS = {
  basic: { color: '#64748b', icon: '🏫' },
  advanced: { color: '#3b82f6', icon: '🏟️' },
  elite: { color: '#f59e0b', icon: '⭐' },
};

export const TRAJECTORY_VISUALS = {
  burst: { color: '#ef4444' },
  steady: { color: '#22c55e' },
  late: { color: '#3b82f6' },
};

export const getLevelVisual = (level, fallbackColor = '#64748b') => (
  LEVEL_VISUALS[level] || { color: fallbackColor, icon: '🏫' }
);

export const getTrajectoryVisual = (trajectory) => (
  TRAJECTORY_VISUALS[trajectory] || TRAJECTORY_VISUALS.steady
);

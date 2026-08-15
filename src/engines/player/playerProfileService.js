export const PLAYER_MODAL_TABS = [
  { key: 'info', label: 'Perfil' },
  { key: 'season', label: 'Temporada' },
  { key: 'shirt', label: 'Camisa' },
  { key: 'wage', label: 'Salário' },
  { key: 'discipline', label: 'Disciplina' },
];

export const getTakenShirts = (players = [], currentPlayerId) => new Set(
  players
    .filter((candidate) => candidate.id !== currentPlayerId && candidate.shirt != null)
    .map((candidate) => candidate.shirt),
);

export const getPotentialRange = (player) => {
  if (!player || player.age > 21) return null;
  const maxGain = player.age <= 18 ? 12 : player.age <= 20 ? 9 : 6;
  return {
    min: player.overall + Math.floor(maxGain * 0.5),
    max: Math.min(99, player.overall + maxGain),
    progress: Math.max(0, Math.min(100, Math.round(((player.overall - 40) / 59) * 100))),
  };
};

export const validateWage = (rawValue) => {
  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value) || value < 1000) return { value: null, error: 'Mínimo: R$ 1.000.' };
  if (value > 5000000) return { value: null, error: 'Máximo: R$ 5.000.000.' };
  return { value, error: '' };
};

export const getContractLengthForWage = (player, wage) => {
  const value = Math.max(1, Number(player?.value) || 0);
  if (wage > value * 0.08) return 3;
  if (wage > value * 0.05) return 2;
  return 1;
};

export const getRenewalOffer = (player) => {
  const goals = player?.seasonGoals || player?.goals || 0;
  const currentWage = player?.wage || 0;
  const bonusMultiplier = goals >= 8 ? 1.2 : goals >= 5 ? 1.1 : 1;
  const wage = bonusMultiplier > 1
    ? Math.round((currentWage * bonusMultiplier) / 500) * 500
    : currentWage;
  const bonusPercent = Math.round((bonusMultiplier - 1) * 100);
  return { goals, wage, bonusPercent };
};

export const setTransferListing = (gameData, player, nextListed) => ({
  ...gameData,
  players: (gameData.players || []).map((candidate) => (
    candidate.id === player.id ? { ...candidate, isListed: nextListed } : candidate
  )),
  market: nextListed
    ? [
        ...(gameData.market || []).filter((candidate) => candidate.id !== player.id),
        { ...player, isListed: true, _listedAt: gameData.round || 0 },
      ]
    : (gameData.market || []).filter((candidate) => candidate.id !== player.id),
});

export const getDisciplineStatus = (player, currentRound, disciplineEngine) => {
  const discipline = player?.discipline || {
    yellowCards: 0,
    suspendedUntilRound: null,
    disciplineHistory: [],
  };
  const yellows = discipline.yellowCards || 0;
  const suspended = disciplineEngine?.isPlayerSuspended
    ? disciplineEngine.isPlayerSuspended(player, currentRound || 0)
    : (discipline.suspendedUntilRound != null && (currentRound || 0) <= discipline.suspendedUntilRound);

  if (suspended) return { discipline, yellows, suspended, tone: 'danger', label: 'Suspenso', icon: '🔴' };
  if (yellows === 1) return { discipline, yellows, suspended, tone: 'warning', label: 'Atenção', icon: '⚠️' };
  if (yellows >= 2) return { discipline, yellows, suspended, tone: 'warning', label: 'Pendurado', icon: '🔶' };
  return { discipline, yellows, suspended, tone: 'success', label: 'Ficha Limpa', icon: '✅' };
};

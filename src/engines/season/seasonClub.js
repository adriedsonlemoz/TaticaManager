const nextSeasonMoney = ({ currentMoney = 10_000_000, promoted = false, relegated = false, champion = false } = {}) => {
  const base = Number(currentMoney) || 0;
  if (relegated) return Math.max(5_000_000, base - Math.round(base * 0.55));
  if (promoted) return Math.round(base * 1.35);
  if (champion) return Math.round(base * 1.15);
  return base;
};

export function calculateFanLoyalty(baseValue = 50, { promoted = false, relegated = false, champion = false, position = 0 } = {}) {
  const base = Number(baseValue) || 50;
  if (promoted) return Math.min(100, base + 15);
  if (relegated) return Math.max(10, base - 20);
  if (champion) return Math.min(100, base + 10);
  if (position > 0 && position <= 4) return Math.min(100, base + 5);
  if (position >= 17) return Math.max(10, base - 8);
  return Math.max(10, Math.min(100, base + 2));
}

export function buildDifficultyProgression(prevState = {}, { promoted = false, relegated = false } = {}) {
  const level = Math.min(10, (prevState.club?.difficultyLevel || 1) + (promoted ? 2 : relegated ? 0 : 1));
  return {
    level,
    multipliers: {
      cpuStrengthBonus: level * 0.5,
      fatigueLoss: 1 + level * 0.03,
      injuryChance: 1 + level * 0.05,
    },
  };
}

export function buildNextSeasonClub({
  prevState = {}, newClubData = null, existingTeamId = null,
  promoted = false, relegated = false, champion = false, position = 0,
  players = [], difficultyLevel = 1, newSerie = 'A', seasonTrophies = 0,
} = {}) {
  const prevClub = prevState.club || {};
  const prevProfile = prevClub.managerProfile || {};
  const changedClub = Boolean(newClubData);
  const money = changedClub
    ? Number(newClubData.money ?? prevClub.money ?? 10_000_000)
    : nextSeasonMoney({ currentMoney: prevClub.money, promoted, relegated, champion });
  const transferBudget = changedClub && newClubData.budget != null
    ? Number(newClubData.budget) || 0
    : Math.max(0, Math.round((money * 0.80) / 1000) * 1000);
  const baseFanLoyalty = changedClub
    ? Math.round((newClubData.fanBase ?? 0.5) * 100)
    : prevClub.fanLoyalty;
  const ticketPrice = { A: 50, B: 30, C: 20, D: 12 }[newSerie] || 30;

  return {
    ...prevClub,
    ...(changedClub ? {
      name: newClubData.name,
      colorPrimary: newClubData.colorPrimary || prevClub.colorPrimary,
      stadium: {
        name: `Estádio do ${newClubData.name}`,
        capacity: 20_000 + (newClubData.strength || 70) * 300,
        ticketPrice,
        level: 1,
        underConstruction: null,
      },
      strength: newClubData.strength || 70,
    } : {}),
    existingTeamId,
    money,
    transferBudget,
    wage: players.reduce((sum, player) => sum + (Number(player.wage) || 0), 0),
    fanLoyalty: changedClub
      ? baseFanLoyalty
      : calculateFanLoyalty(baseFanLoyalty, { promoted, relegated, champion, position }),
    difficultyLevel,
    managerProfile: {
      ...prevProfile,
      seasonsTotal: (prevProfile.seasonsTotal || 0) + 1,
      wins: prevProfile.wins || 0,
      draws: prevProfile.draws || 0,
      losses: prevProfile.losses || 0,
      experience: prevProfile.experience || 0,
      trophies: (prevProfile.trophies || 0) + (Number(seasonTrophies) || 0),
    },
  };
}

export { nextSeasonMoney };

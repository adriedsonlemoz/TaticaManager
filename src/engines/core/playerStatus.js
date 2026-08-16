import { DisciplineEngine } from '../engine_discipline.js';
import { FatigueEngine } from '../engine_fatigue.js';

const number = (value, fallback = 0) => {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};


export function getUpcomingRound(gameData = {}) {
  return number(gameData?.round, 0) + 1;
}

export function normalizeEnergy(value) {
  return Math.max(0, Math.min(100, number(value, 100)));
}

export function getEnergyBand(value) {
  const energy = normalizeEnergy(value);
  const ovrPenalty = FatigueEngine.getOverallPenalty(energy);

  if (energy >= 80) return { key: 'ideal', energy, ovrPenalty, label: 'Forma ideal' };
  if (energy >= 70) return { key: 'attention', energy, ovrPenalty, label: 'Atenção' };
  if (energy >= 50) return { key: 'fatigued', energy, ovrPenalty, label: 'Cansado' };
  if (energy >= 30) return { key: 'very_tired', energy, ovrPenalty, label: 'Muito cansado' };
  return { key: 'exhausted', energy, ovrPenalty, label: 'Exausto' };
}

export function getPlayerAvailability(player = {}, currentRound = 0) {
  const injured = Boolean(player.injury);
  const suspended = DisciplineEngine.isPlayerSuspended(player, number(currentRound));
  const suspensionRounds = suspended
    ? DisciplineEngine.getPlayerSuspensionRoundsLeft(player, number(currentRound))
    : 0;
  const energy = normalizeEnergy(player.energy);

  return {
    injured,
    suspended,
    suspensionRounds,
    unavailable: injured || suspended,
    energy,
    energyBand: getEnergyBand(energy),
  };
}

export function getContractStatus(contractValue) {
  const contract = number(contractValue, 2);
  if (contract <= 0) return { key: 'expired', contract, label: 'EXPIRADO' };
  if (contract === 1) return { key: 'last_year', contract, label: '1T RESTANTE' };
  if (contract === 2) return { key: 'short', contract, label: '2T' };
  return { key: 'normal', contract, label: `${contract}T` };
}

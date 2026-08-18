// Compatibility facade for CPU club behavior.
// Detailed rules live in src/engines/cpu/.
import {
  CPU_MAX_SQUAD_SIZE,
  getTransferWindowInfo,
  isTransferWindowOpen,
} from './cpu/cpuConfig.js';
import {
  applyContractRenewal,
  calculateRenewalCost,
  getContractWarnings,
  getFreeAgentsFromExpiredContracts,
  getSeasonEndDepartures,
  validateContractRenewal,
} from './cpu/cpuContracts.js';
import { getMoraleMultiplier } from './cpu/cpuMorale.js';
import { processTransferActivity } from './cpu/cpuRecruitment.js';
import { processCpuToCpuTransfers, releaseExpiredCpuPlayers } from './cpu/cpuTransfers.js';

export const CpuAI = Object.freeze({
  processTransferActivity,
  processCpuToCpuTransfers,
  releaseExpiredCpuPlayers,
  getContractWarnings,
  calculateRenewalCost,
  applyContractRenewal,
  getSeasonEndDepartures,
  getFreeAgentsFromExpiredContracts,
  validateContractRenewal,
  getMoraleMultiplier,
  isTransferWindowOpen,
  getTransferWindowInfo,
  MAX_SQUAD_SIZE: CPU_MAX_SQUAD_SIZE,
});

export default CpuAI;

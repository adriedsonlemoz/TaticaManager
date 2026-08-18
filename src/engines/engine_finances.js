// FinanceEngine compatibility facade. Domain logic lives in src/engines/finances/.
import { calculateMatchFinances, getTVRights } from './finances/financeMatch.js';
import { getCurrentWage, getFinancialStatus, getOperationalCosts, getRecurringFinanceBaseline } from './finances/financeRisk.js';

const FinanceEngine = {
  getTVRights,
  calculateMatchFinances,
  getOperationalCosts,
  getFinancialStatus,
  getCurrentWage,
  getRecurringFinanceBaseline,
};

export { FinanceEngine };
export default FinanceEngine;

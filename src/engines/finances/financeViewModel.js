// Finance UI facade. Detailed rules live in the finance domain modules.
export { applySponsorContract, canSignSponsor, generateSponsorOffers } from './financeSponsors.js';
export { buildFinanceOverview, getFinancialSuggestions, getSuggestionSeverity } from './financeProjection.js';
export { buildEvolutionEntries, parseFinancialEntry } from './financeHistoryView.js';
export {
  appendFinancialEntry,
  getAverageTicketIncome,
  getSeasonFinancialHistory,
  summarizeFinancialHistory,
  tagLegacyFinancialHistory,
} from './financeLedger.js';

// Barrel de compatibilidade do pós-jogo.
// As responsabilidades vivem em módulos menores para evitar acoplamento circular.
export { processLeaguePlayers, preparePostMatchPlayers } from './matchPlayerPostProcessor.js';
export { processCpuTransfers, refreshTransferMarket } from './matchTransferPostProcessor.js';
export { progressAcademy } from './matchAcademyPostProcessor.js';
export { buildPostMatchNotifications } from './matchNotifications.js';

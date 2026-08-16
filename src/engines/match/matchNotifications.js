import { buildMatchRoundContext } from './matchRoundContext.js';
import {
  buildAcademyNotifications,
  buildBoardObjectiveNotification,
  buildContractWarnings,
  buildFanPressureNotification,
  buildJournalNotification,
  buildMatchInjuryNotifications,
  buildRumorNotification,
  buildSuspensionNotifications,
  buildTrainingInjury,
} from './matchNotificationBuilders.js';

export function buildPostMatchNotifications({
  gameData,
  userMatchData,
  updatedTable = [],
  updatedPlayers = [],
  updatedFixtures = gameData?.fixtures || [],
  allRawEvents = [],
  leagueIdx = null,
  rng = Math.random,
}) {
  const rounds = buildMatchRoundContext(gameData, leagueIdx);
  const common = { gameData, leagueRoundPlayed: rounds.leagueRoundPlayed };

  return {
    contractWarnings: buildContractWarnings(common),
    jornal: buildJournalNotification({ ...common, userMatchData, updatedTable }),
    rumores: buildRumorNotification({ ...common, rng }),
    objetivoDiretoria: buildBoardObjectiveNotification({
      ...common,
      updatedTable,
      totalLeagueRounds: rounds.totalLeagueRounds,
    }),
    pressaoTorcida: buildFanPressureNotification({ ...common, fixtures: updatedFixtures }),
    lesaoTreino: buildTrainingInjury({ updatedPlayers, leagueRoundPlayed: rounds.leagueRoundPlayed, rng }),
    academyNotifs: buildAcademyNotifications(common),
    matchInjuryMsgs: buildMatchInjuryNotifications({ ...common, updatedPlayers }),
    suspensionMsgs: buildSuspensionNotifications({
      ...common,
      updatedPlayers,
      allRawEvents,
      nextCalendarRound: rounds.nextCalendarRound,
    }),
  };
}

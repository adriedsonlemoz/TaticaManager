const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// gameData.round = índice 0-based do calendário completo (Liga + Copas)
// gameData.leagueRound = quantidade de rodadas de Liga já concluídas.
// Este helper evita misturar os dois relógios no pós-jogo.
export function buildMatchRoundContext(gameData = {}, leagueIdx = null) {
  const calendarIndexBefore = Math.max(0, toFiniteNumber(gameData.round, 0));
  const calendarRoundPlayed = calendarIndexBefore + 1;

  const explicitLeagueIndex = Number.isFinite(Number(leagueIdx)) ? Number(leagueIdx) : null;
  const playedLeagueBefore = Math.max(
    0,
    toFiniteNumber(gameData.leagueRound, explicitLeagueIndex ?? calendarIndexBefore),
  );
  const leagueRoundPlayed = explicitLeagueIndex !== null
    ? explicitLeagueIndex + 1
    : playedLeagueBefore + 1;

  return {
    calendarIndexBefore,
    calendarIndexAfter: calendarIndexBefore + 1,
    calendarRoundPlayed,
    nextCalendarRound: calendarRoundPlayed + 1,
    playedLeagueBefore,
    leagueRoundPlayed,
    playedLeagueAfter: leagueRoundPlayed,
    nextLeagueRound: leagueRoundPlayed + 1,
    totalLeagueRounds: gameData.fixtures?.length || 38,
  };
}

export default buildMatchRoundContext;

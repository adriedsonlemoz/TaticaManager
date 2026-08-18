export function calculateUserWage(players = []) {
  return (Array.isArray(players) ? players : []).reduce(
    (sum, player) => sum + Math.max(0, Number(player?.wage) || 0),
    0,
  );
}

// `players` é a fonte canônica do elenco do usuário. `teamRosters.user` existe
// como espelho para consumidores compartilhados com clubes CPU e nunca deve
// divergir durante a sessão, mesmo antes do próximo save em IndexedDB.
export function syncUserRosterState(state = {}, nextPlayers = state?.players || []) {
  const players = Array.isArray(nextPlayers) ? nextPlayers : [];
  return {
    ...state,
    players,
    teamRosters: {
      ...(state?.teamRosters || {}),
      user: players,
    },
    club: {
      ...(state?.club || {}),
      wage: calculateUserWage(players),
    },
  };
}

// Funções puras de estatísticas individuais pós-partida.
// Mantidas fora do hook para reduzir responsabilidades do motor de simulação.

export const accumulateScorers = (prevScorers, rawEvents) => {
  const updated = { ...prevScorers };
  rawEvents.filter(e => e.type === 'goal' && e.scorerObj).forEach(e => {
    const p = e.scorerObj;
    const key = `${p.name}__${p.teamId || 'ai'}`;
    if (updated[key]) {
      updated[key] = { ...updated[key], goals: updated[key].goals + 1 };
    } else {
      updated[key] = {
        id: p.id,
        name: p.name,
        team: p.teamName || p.team || e.teamName || '?',
        teamId: p.teamId || e.teamId || 'ai',
        position: p.position || 'ATA',
        overall: p.overall || 70,
        age: p.age || 24,
        value: p.value || 1500000,
        wage: p.wage || 75000,
        goals: 1,
        isUserTeam: p.teamId === 'user' || e.isPlayer,
      };
    }
  });
  return updated;
};

export const accumulateMinutes = players => players.map(p => ({
  ...p,
  // Titulares que ficaram 90min inteiros; substituídos já têm minutesPlayed
  // ajustado em tempo real pelo fluxo de substituição.
  minutesPlayed: p.isStarting
    ? (p.minutesPlayed || 0) + 90
    : (p.minutesPlayed || 0),
}));

export const accumulateUserGoals = (players, rawEvents) => {
  const userGoals = rawEvents.filter(e => e.type === 'goal' && e.isPlayer && e.scorerObj);
  if (!userGoals.length) return players;

  const assistMap = {};
  userGoals.forEach(e => {
    const scorerId = e.scorerObj.id;
    const roster = players.filter(p => p.isStarting && p.id !== scorerId);
    if (roster.length > 0) {
      const assister = roster[Math.floor(Math.random() * roster.length)];
      assistMap[assister.id] = (assistMap[assister.id] || 0) + 1;
    }
  });

  return players.map(p => {
    const scored = userGoals.filter(e => e.scorerObj.id === p.id).length;
    const assisted = assistMap[p.id] || 0;
    if (scored === 0 && assisted === 0) return p;
    return { ...p, goals: (p.goals || 0) + scored, assists: (p.assists || 0) + assisted };
  });
};

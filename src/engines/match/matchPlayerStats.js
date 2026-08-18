// Funções puras de estatísticas individuais pós-partida.
// Mantidas fora do hook para reduzir responsabilidades do motor de simulação.

const GOAL_EVENT_TYPES = new Set(['goal', 'penalty_goal']);
const safeEvents = (events) => Array.isArray(events) ? events.filter(Boolean) : [];
const idKey = (value) => value == null ? null : String(value);
const idsEqual = (left, right) => {
  const leftKey = idKey(left);
  const rightKey = idKey(right);
  return leftKey != null && rightKey != null && leftKey === rightKey;
};

export const isScoringEvent = (event) => GOAL_EVENT_TYPES.has(event?.type) && Boolean(event?.scorerObj);

export const accumulateScorers = (prevScorers = {}, rawEvents = []) => {
  const updated = { ...(prevScorers || {}) };
  safeEvents(rawEvents).filter(isScoringEvent).forEach((event) => {
    const player = event.scorerObj;
    const key = `${player.name}__${player.teamId || 'ai'}`;
    if (updated[key]) {
      updated[key] = { ...updated[key], goals: (Number(updated[key].goals) || 0) + 1 };
    } else {
      updated[key] = {
        id: player.id,
        name: player.name,
        team: player.teamName || player.team || event.teamName || '?',
        teamId: player.teamId || event.teamId || 'ai',
        position: player.position || 'ATA',
        overall: player.overall || 70,
        age: player.age || 24,
        value: player.value || 1500000,
        wage: player.wage || 75000,
        goals: 1,
        isUserTeam: player.teamId === 'user' || event.isPlayer,
      };
    }
  });
  return updated;
};

const substitutionMinute = (value) => {
  if (value === 'HT') return 45;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(120, Math.trunc(parsed))) : null;
};

export const buildMatchMinutes = (players = [], liveSubstitutions = [], rawEvents = []) => {
  const roster = Array.isArray(players) ? players : [];
  const minutes = {};
  const enteredAt = new Map();
  roster.forEach((player) => {
    const key = idKey(player?.id);
    if (key == null) return;
    minutes[key] = 0;
    if (player?.isStarting) enteredAt.set(key, 0);
  });

  const structuredSubs = safeEvents(rawEvents)
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event?.isPlayer && event?.type === 'sub' && Array.isArray(event?.changes));
  const useStructuredSubs = structuredSubs.length > 0;
  const actions = [];

  if (useStructuredSubs) {
    structuredSubs.forEach(({ event, index }) => {
      const minute = substitutionMinute(event?.min);
      if (minute == null) return;
      event.changes.forEach((change, changeIndex) => {
        actions.push({
          type:'sub',
          minute,
          order:index + (changeIndex / 1000),
          outKey:idKey(change?.outgoingId),
          inKey:idKey(change?.incomingId),
        });
      });
    });
  } else {
    (Array.isArray(liveSubstitutions) ? liveSubstitutions : []).filter(Boolean).forEach((substitution, index) => {
      const minute = substitutionMinute(substitution?.min);
      if (minute == null) return;
      actions.push({
        type:'sub',
        minute,
        order:index,
        outKey:idKey(substitution?.outId),
        inKey:idKey(substitution?.inId),
      });
    });
  }

  safeEvents(rawEvents).forEach((event, index) => {
    if (!event?.isPlayer || !['red', 'red_direct', 'red_second_yellow'].includes(event?.type)) return;
    const minute = substitutionMinute(event?.min);
    const playerKey = idKey(event?.playerId);
    if (minute == null || playerKey == null) return;
    actions.push({ type:'red', minute, order:index + 0.5, playerKey });
  });

  actions
    .sort((left, right) => left.minute - right.minute || left.order - right.order)
    .forEach((action) => {
      if (action.type === 'sub') {
        const { outKey, inKey, minute } = action;
        if (outKey == null || inKey == null || outKey === inKey) return;
        if (!enteredAt.has(outKey) || enteredAt.has(inKey)) return;
        const entered = enteredAt.get(outKey);
        minutes[outKey] = (minutes[outKey] || 0) + Math.max(0, minute - entered);
        enteredAt.delete(outKey);
        enteredAt.set(inKey, minute);
        return;
      }

      if (action.type === 'red') {
        const { playerKey, minute } = action;
        if (!enteredAt.has(playerKey)) return;
        const entered = enteredAt.get(playerKey);
        minutes[playerKey] = (minutes[playerKey] || 0) + Math.max(0, minute - entered);
        enteredAt.delete(playerKey);
      }
    });

  enteredAt.forEach((entered, key) => {
    minutes[key] = (minutes[key] || 0) + Math.max(0, 90 - entered);
  });
  return minutes;
};

export const accumulateMinutes = (players = [], liveSubstitutions = [], rawEvents = []) => {
  const roster = Array.isArray(players) ? players : [];
  const matchMinutes = buildMatchMinutes(roster, liveSubstitutions, rawEvents);
  return roster.map((player) => ({
    ...player,
    minutesPlayed: (Number(player.minutesPlayed) || 0) + (matchMinutes[idKey(player?.id)] || 0),
  }));
};

export const accumulateUserGoals = (players = [], rawEvents = [], rng = Math.random) => {
  const roster = Array.isArray(players) ? players : [];
  const events = safeEvents(rawEvents);
  const userGoals = events.filter((event) => isScoringEvent(event) && event.isPlayer);
  if (!userGoals.length) return roster;

  const activeIds = new Set(
    roster
      .filter((player) => player?.isStarting)
      .map((player) => idKey(player?.id))
      .filter((key) => key != null),
  );
  const assistMap = {};

  // Reproduz as mudanças de campo na mesma ordem dos rawEvents. Assim um atleta
  // substituído/expulso não recebe assistência artificial em um gol posterior,
  // enquanto quem entrou passa a ser elegível imediatamente.
  events.forEach((event) => {
    if (event?.isPlayer && event?.type === 'sub' && Array.isArray(event.changes)) {
      event.changes.forEach((change) => {
        const outKey = idKey(change?.outgoingId);
        const inKey = idKey(change?.incomingId);
        if (outKey == null || inKey == null || outKey === inKey || !activeIds.has(outKey)) return;
        activeIds.delete(outKey);
        activeIds.add(inKey);
      });
      return;
    }

    if (isScoringEvent(event) && event.isPlayer && event.type === 'goal') {
      const scorerId = event.scorerObj?.id;
      const candidates = roster.filter((player) => {
        const key = idKey(player?.id);
        return key != null && activeIds.has(key) && !idsEqual(player.id, scorerId);
      });
      if (candidates.length > 0) {
        const roll = Number(rng());
        const safeRoll = Number.isFinite(roll) ? Math.max(0, Math.min(0.999999, roll)) : 0;
        const assister = candidates[Math.floor(safeRoll * candidates.length)];
        const key = idKey(assister.id);
        if (key != null) assistMap[key] = (assistMap[key] || 0) + 1;
      }
    }

    if (event?.isPlayer && ['red', 'red_direct', 'red_second_yellow'].includes(event?.type)) {
      const key = idKey(event?.playerId);
      if (key != null) activeIds.delete(key);
    }
  });

  return roster.map((player) => {
    const scored = userGoals.filter((event) => idsEqual(event.scorerObj?.id, player.id)).length;
    const assisted = assistMap[idKey(player.id)] || 0;
    if (scored === 0 && assisted === 0) return player;
    return {
      ...player,
      goals: (Number(player.goals) || 0) + scored,
      seasonGoals: (Number(player.seasonGoals) || 0) + scored,
      assists: (Number(player.assists) || 0) + assisted,
    };
  });
};

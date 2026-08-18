// @migrated
// engines/engine_discipline.js — v1.4
// Cartão vermelho direto = 2 jogos | Segundo amarelo (= vermelho) = 1 jogo
// Amarelo: 3 acumulados = 1 jogo de suspensão + reset do contador

const DISCIPLINE_TYPES = {
  YELLOW: 'yellow',
  RED: 'red',
  RED_DIRECT: 'red_direct',
};

const roundNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
};

const idKey = (value) => value == null ? null : String(value);
const idsEqual = (left, right) => {
  const leftKey = idKey(left);
  const rightKey = idKey(right);
  return leftKey != null && rightKey != null && leftKey === rightKey;
};

const initPlayerDiscipline = (player) => ({
  ...player,
  discipline: {
    yellowCards: 0,
    suspendedUntilRound: null,
    disciplineHistory: [],
  },
});

const applyCardToPlayer = (player, cardType, minute, round) => {
  const playedRound = roundNumber(round);
  const history = [...(Array.isArray(player.discipline?.disciplineHistory) ? player.discipline.disciplineHistory : [])];
  history.push({ round: playedRound, type: cardType, minute });

  let yellowCards = Number(player.discipline?.yellowCards) || 0;
  let suspendedUntilRound = player.discipline?.suspendedUntilRound == null
    ? null
    : roundNumber(player.discipline.suspendedUntilRound);

  const extendSuspension = (untilRound) => {
    suspendedUntilRound = Math.max(suspendedUntilRound ?? 0, untilRound);
  };

  if (cardType === DISCIPLINE_TYPES.YELLOW) {
    yellowCards += 1;
    if (yellowCards >= 3) {
      extendSuspension(playedRound + 1);
      yellowCards = 0;
    }
  } else if (cardType === DISCIPLINE_TYPES.RED) {
    extendSuspension(playedRound + 1);
  } else if (cardType === DISCIPLINE_TYPES.RED_DIRECT) {
    extendSuspension(playedRound + 2);
  }

  return {
    ...player,
    discipline: { yellowCards, suspendedUntilRound, disciplineHistory: history },
  };
};

const recordPlayerCard = (players, playerName, cardType, minute, round) => (
  (Array.isArray(players) ? players : []).map((player) => (
    player?.name === playerName ? applyCardToPlayer(player, cardType, minute, round) : player
  ))
);

const processMatchDisciplineEvents = (players, matchEvents, round, rawEvents = []) => {
  let updatedPlayers = Array.isArray(players) ? players : [];
  const rawList = Array.isArray(rawEvents) ? rawEvents : [];

  const structuredCards = rawList.filter((event) => (
    ['yellow', 'red', 'red_direct', 'red_second_yellow'].includes(event?.type)
  ));
  if (structuredCards.length > 0) {
    structuredCards.forEach((event) => {
      if (!event?.isPlayer) return;
      const cardType = event.type === 'red_direct' ? DISCIPLINE_TYPES.RED_DIRECT
        : event.type === 'red' || event.type === 'red_second_yellow' ? DISCIPLINE_TYPES.RED
          : DISCIPLINE_TYPES.YELLOW;

      if (event.playerId != null) {
        updatedPlayers = updatedPlayers.map((player) => (
          idsEqual(player?.id, event.playerId)
            ? applyCardToPlayer(player, cardType, event.min, round)
            : player
        ));
      } else if (event.playerName) {
        updatedPlayers = recordPlayerCard(updatedPlayers, event.playerName, cardType, event.min, round);
      }
    });
    return updatedPlayers;
  }

  const eventList = Array.isArray(matchEvents) ? matchEvents.filter((event) => typeof event === 'string') : [];
  const cardEvents = eventList.filter((event) => (
    event.includes('🟨') || event.includes('🟥')
    || event.includes('Cartão amarelo') || event.includes('Cartão VERMELHO')
  ));

  const sortedPlayers = [...updatedPlayers]
    .filter((player) => player?.name)
    .sort((a, b) => String(b.name).length - String(a.name).length);

  cardEvents.forEach((event) => {
    const isSecondYellow = event.includes('SEGUNDO AMARELO');
    const isDirectRed = !isSecondYellow && (event.includes('Vermelho direto') || event.includes('vermelho direto'));
    const isRed = event.includes('🟥') || event.includes('VERMELHO') || isSecondYellow;
    const isYellow = event.includes('🟨') || event.toLowerCase().includes('amarelo');
    if (!isRed && !isYellow) return;

    const minuteMatch = event.match(/^(\d+)(?:\+(\d+))?'/);
    const minute = minuteMatch
      ? Number.parseInt(minuteMatch[1], 10) + (Number.parseInt(minuteMatch[2] || '0', 10) || 0)
      : 0;
    const matchedPlayer = sortedPlayers.find((player) => event.includes(player.name));
    if (!matchedPlayer) return;

    const cardType = isDirectRed ? DISCIPLINE_TYPES.RED_DIRECT
      : isRed ? DISCIPLINE_TYPES.RED
        : DISCIPLINE_TYPES.YELLOW;
    updatedPlayers = updatedPlayers.map((player) => (
      idsEqual(player?.id, matchedPlayer.id)
        ? applyCardToPlayer(player, cardType, minute, round)
        : player
    ));
  });

  return updatedPlayers;
};

const isPlayerSuspended = (player, currentRound) => {
  if (!player?.discipline) return false;
  const suspendedUntil = player.discipline.suspendedUntilRound;
  if (suspendedUntil == null) return false;
  return roundNumber(currentRound) <= roundNumber(suspendedUntil);
};

const getPlayerSuspensionRoundsLeft = (player, currentRound) => {
  if (!player?.discipline) return 0;
  const suspendedUntil = player.discipline.suspendedUntilRound;
  if (suspendedUntil == null) return 0;
  const current = roundNumber(currentRound);
  const until = roundNumber(suspendedUntil);
  return current > until ? 0 : until - current + 1;
};

const getPlayerYellowCards = (player) => Math.max(0, Number(player?.discipline?.yellowCards) || 0);
const getCardsUntilSuspension = (player) => Math.max(0, 3 - getPlayerYellowCards(player));

const clearSuspensionAndResetCards = (players, currentRound) => {
  const current = roundNumber(currentRound);
  return (Array.isArray(players) ? players : []).map((player) => {
    if (!player?.discipline) return player;
    const suspendedUntil = player.discipline.suspendedUntilRound;
    if (suspendedUntil != null && current > roundNumber(suspendedUntil)) {
      return {
        ...player,
        discipline: {
          yellowCards: getPlayerYellowCards(player),
          suspendedUntilRound: null,
          disciplineHistory: Array.isArray(player.discipline.disciplineHistory)
            ? player.discipline.disciplineHistory
            : [],
        },
      };
    }
    return player;
  });
};

const resetSeasonalDiscipline = (players) => (Array.isArray(players) ? players : []).map((player) => ({
  ...player,
  discipline: {
    yellowCards: 0,
    suspendedUntilRound: null,
    disciplineHistory: Array.isArray(player?.discipline?.disciplineHistory)
      ? player.discipline.disciplineHistory
      : [],
  },
}));

const getDisciplineSummary = (player, currentRound) => {
  const yellows = getPlayerYellowCards(player);
  const suspended = isPlayerSuspended(player, currentRound);
  const suspensionRoundsLeft = getPlayerSuspensionRoundsLeft(player, currentRound);
  const cardsUntilSuspension = getCardsUntilSuspension(player);
  return {
    yellowCards: yellows,
    isSuspended: suspended,
    suspensionRoundsLeft,
    cardsUntilSuspension,
    status: suspended
      ? `🔴 Suspenso (${suspensionRoundsLeft} rod.)`
      : yellows === 0 ? '✅ Sem cartões'
        : yellows === 1 ? '🟨 1 amarelo (2 até suspensão)'
          : '🟨🟨 2 amarelos (1 até suspensão)',
  };
};

const validateLineupForSuspensions = (starters, currentRound) => {
  const suspendedInLineup = (Array.isArray(starters) ? starters : [])
    .filter((player) => isPlayerSuspended(player, currentRound));
  return { valid: suspendedInLineup.length === 0, suspendedInLineup };
};

export const DisciplineEngine = {
  DISCIPLINE_TYPES,
  initPlayerDiscipline,
  recordPlayerCard,
  processMatchDisciplineEvents,
  isPlayerSuspended,
  getPlayerSuspensionRoundsLeft,
  getPlayerYellowCards,
  getCardsUntilSuspension,
  resetSeasonalDiscipline,
  clearSuspensionAndResetCards,
  getDisciplineSummary,
  validateLineupForSuspensions,
};
export default DisciplineEngine;

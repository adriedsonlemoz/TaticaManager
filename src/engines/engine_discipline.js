// @migrated
// engines/engine_discipline.js — v1.3 (Regras corrigidas para padrão brasileiro)
// Cartão vermelho direto = 2 rodadas | Segundo amarelo (= vermelho) = 1 rodada
// Amarelo: 3 acumulados = 1 rodada de suspensão + reset do contador

const DISCIPLINE_TYPES = {
  YELLOW: 'yellow',
  RED: 'red',
  RED_DIRECT: 'red_direct', // vermelho direto (falta grave) = 2 rodadas
};

const initPlayerDiscipline = (player) => ({
  ...player,
  discipline: {
    yellowCards: 0,
    suspendedUntilRound: null,
    disciplineHistory: [],
  }
});

// ── Registra um cartão e atualiza a suspensão ──────────────
const recordPlayerCard = (players, playerName, cardType, minute, round) => {
  return players.map(p => {
    if (p.name !== playerName) return p;

    const history = [...(p.discipline?.disciplineHistory || [])];
    history.push({ round, type: cardType, minute });

    let yellowCards          = p.discipline?.yellowCards || 0;
    let suspendedUntilRound  = p.discipline?.suspendedUntilRound || null;

    if (cardType === DISCIPLINE_TYPES.YELLOW) {
      yellowCards += 1;
      // Brasileirão: 3 amarelos = 1 rodada de suspensão + reset
      if (yellowCards >= 3) {
        suspendedUntilRound = round + 1; // suspenso na PRÓXIMA rodada
        yellowCards = 0;                 // reset após cumprir
      }
    } else if (cardType === DISCIPLINE_TYPES.RED) {
      // Segundo amarelo convertido em vermelho = 1 rodada
      suspendedUntilRound = round + 1;
    } else if (cardType === DISCIPLINE_TYPES.RED_DIRECT) {
      // Vermelho direto (falta grave) = 2 rodadas de suspensão
      suspendedUntilRound = round + 2;
    }

    return {
      ...p,
      discipline: { yellowCards, suspendedUntilRound, disciplineHistory: history }
    };
  });
};

// ── Processa cartões dos eventos de uma partida ────────────
// ✅ FIX #4: Aceita rawEvents (4º parâmetro) com playerId estruturado.
// Quando playerId está presente, usa matching por ID (preciso).
// Fallback para parsing de texto se rawEvents não vier.
const processMatchDisciplineEvents = (players, matchEvents, round, rawEvents = []) => {
  let updatedPlayers = players;

  // --- Caminho 1: rawEvents estruturados (preciso, por ID) ---
  const structuredCards = rawEvents.filter(e => e.type === 'yellow' || e.type === 'red' || e.type === 'red_direct');
  if (structuredCards.length > 0) {
    structuredCards.forEach(e => {
      if (!e.isPlayer) return; // só processa cartões do time do usuário
      const cardType = e.type === 'red_direct'        ? DISCIPLINE_TYPES.RED_DIRECT
                     : e.type === 'red'               ? DISCIPLINE_TYPES.RED
                     : e.type === 'red_second_yellow' ? DISCIPLINE_TYPES.RED  // segundo amarelo = suspensão de 1 rodada
                     :                                  DISCIPLINE_TYPES.YELLOW;
      const applyCard = (p) => {
        const history = [...(p.discipline?.disciplineHistory || [])];
        history.push({ round, type: cardType, minute: e.min });
        let yellowCards = p.discipline?.yellowCards || 0;
        let suspendedUntilRound = p.discipline?.suspendedUntilRound || null;
        if (cardType === DISCIPLINE_TYPES.YELLOW) {
          yellowCards += 1;
          if (yellowCards >= 3) { suspendedUntilRound = round + 1; yellowCards = 0; }
        } else if (cardType === DISCIPLINE_TYPES.RED) {
          suspendedUntilRound = round + 1;
        } else {
          suspendedUntilRound = round + 2;
        }
        return { ...p, discipline: { yellowCards, suspendedUntilRound, disciplineHistory: history } };
      };

      if (e.playerId) {
        // Matching por ID — sem ambiguidade
        updatedPlayers = updatedPlayers.map(p => p.id === e.playerId ? applyCard(p) : p);
      } else if (e.playerName) {
        // Fallback por nome quando id não está disponível
        updatedPlayers = recordPlayerCard(updatedPlayers, e.playerName, cardType, e.min, round);
      }
    });
    return updatedPlayers;
  }

  // --- Caminho 2: fallback — parsing de texto (comportamento legado) ---
  const cardEvents = matchEvents.filter(event =>
    event.includes('🟨') || event.includes('🟥') ||
    event.includes('Cartão amarelo') || event.includes('Cartão VERMELHO')
  );

  // Ordena por nome mais longo primeiro para evitar correspondência parcial
  const sortedPlayers = [...players].sort((a, b) => b.name.length - a.name.length);

  cardEvents.forEach(event => {
    const isDirectRed = event.includes('EXPULSO') || event.includes('Vermelho direto');
    const isRed       = event.includes('🟥') || event.includes('VERMELHO');
    const isYellow    = event.includes('🟨') || event.includes('amarelo');

    if (!isRed && !isYellow) return;

    const minuteMatch = event.match(/^(\d+)'/);
    const minute = minuteMatch ? parseInt(minuteMatch[1]) : 0;

    const matchedPlayer = sortedPlayers.find(p => event.includes(p.name));
    if (!matchedPlayer) return;

    let cardType;
    if (isDirectRed) {
      cardType = DISCIPLINE_TYPES.RED_DIRECT; // 2 rodadas
    } else if (isRed) {
      cardType = DISCIPLINE_TYPES.RED;        // 1 rodada
    } else {
      cardType = DISCIPLINE_TYPES.YELLOW;     // acúmulo
    }

    updatedPlayers = recordPlayerCard(updatedPlayers, matchedPlayer.name, cardType, minute, round);
  });

  return updatedPlayers;
};

// ── Verifica se está suspenso ──────────────────────────────
const isPlayerSuspended = (player, currentRound) => {
  if (!player.discipline) return false;
  const s = player.discipline.suspendedUntilRound;
  return s !== null && currentRound <= s;
};

const getPlayerSuspensionRoundsLeft = (player, currentRound) => {
  if (!player.discipline) return 0;
  const s = player.discipline.suspendedUntilRound;
  if (s === null || currentRound > s) return 0;
  return s - currentRound + 1;
};

const getPlayerYellowCards   = (p) => p.discipline?.yellowCards || 0;
const getCardsUntilSuspension = (p) => Math.max(0, 3 - getPlayerYellowCards(p));

// ── Reset ao cumprir suspensão ─────────────────────────────
const clearSuspensionAndResetCards = (players, currentRound) => {
  return players.map(p => {
    if (!p.discipline) return p;
    const s = p.discipline.suspendedUntilRound;
    if (s !== null && currentRound > s) {
      return {
        ...p,
        discipline: {
          yellowCards: p.discipline.yellowCards, // mantém amarelos (apenas reset quando atinge 3)
          suspendedUntilRound: null,
          disciplineHistory: p.discipline.disciplineHistory,
        }
      };
    }
    return p;
  });
};

// ── Reset de temporada ─────────────────────────────────────
const resetSeasonalDiscipline = (players) => players.map(p => ({
  ...p,
  discipline: {
    yellowCards: 0,
    suspendedUntilRound: null,
    disciplineHistory: p.discipline?.disciplineHistory || [],
  }
}));

// ── Resumo ─────────────────────────────────────────────────
const getDisciplineSummary = (player, currentRound) => {
  const yellows     = getPlayerYellowCards(player);
  const suspended   = isPlayerSuspended(player, currentRound);
  const suspLeft    = getPlayerSuspensionRoundsLeft(player, currentRound);
  const cardsLeft   = getCardsUntilSuspension(player);
  return {
    yellowCards: yellows, isSuspended: suspended,
    suspensionRoundsLeft: suspLeft, cardsUntilSuspension: cardsLeft,
    status: suspended
      ? `🔴 Suspenso (${suspLeft} rod.)`
      : yellows === 0 ? '✅ Sem cartões'
      : yellows === 1 ? '🟨 1 amarelo (2 até suspensão)'
      : '🟨🟨 2 amarelos (1 até suspensão)',
  };
};

const validateLineupForSuspensions = (starters, currentRound) => {
  const suspendedInLineup = starters.filter(p => isPlayerSuspended(p, currentRound));
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

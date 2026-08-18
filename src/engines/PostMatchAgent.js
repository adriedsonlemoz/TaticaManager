// @migrated to ES module
// engines/PostMatchAgent.js — v1.1
// Analisa desfalques novos causados pela partida sem modificar o estado.

const idKey = (value) => value == null ? null : String(value);
const samePlayerId = (left, right) => {
  const leftKey = idKey(left);
  const rightKey = idKey(right);
  return leftKey != null && rightKey != null && leftKey === rightKey;
};
const nonNegativeInt = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
};
const SEVERITY_ORDER = { high:0, medium:1, low:2 };

const playerEvents = (rawEvents, player) => (
  (Array.isArray(rawEvents) ? rawEvents : []).filter((event) => {
    if (!event || typeof event !== 'object' || event.isPlayer === false) return false;
    if (event.playerId != null && player?.id != null) return samePlayerId(event.playerId, player.id);
    const eventName = String(event.playerName ?? '').trim();
    const playerName = String(player?.name ?? '').trim();
    return Boolean(eventName && playerName && eventName === playerName);
  })
);

export const PostMatchAgent = {
  analyzeDesfalques: (playersBefore, playersAfter, rawEvents = [], nextRound = 0) => {
    const before = Array.isArray(playersBefore) ? playersBefore : [];
    const after = Array.isArray(playersAfter) ? playersAfter : [];
    const round = Math.max(0, nonNegativeInt(nextRound));
    const suspensions = [];
    const injuries = [];

    after.forEach((pAfter) => {
      const pBefore = before.find((player) => (
        samePlayerId(player?.id, pAfter?.id)
        || (player?.id == null && pAfter?.id == null && player?.name === pAfter?.name)
      ));
      if (!pBefore) return;

      const beforeUntil = Number(pBefore.discipline?.suspendedUntilRound);
      const afterUntil = Number(pAfter.discipline?.suspendedUntilRound);
      const wasSuspended = Number.isFinite(beforeUntil) && round <= beforeUntil;
      const isNowSuspended = Number.isFinite(afterUntil) && round <= afterUntil;

      if (!wasSuspended && isNowSuspended) {
        const events = playerEvents(rawEvents, pAfter);
        const hasRedDirect = events.some((event) => event.type === 'red_direct');
        const hasSecondYellow = events.some((event) => event.type === 'red_second_yellow' || event.type === 'red');
        const yellowCount = events.filter((event) => event.type === 'yellow').length;
        const roundsLeft = Math.max(1, Math.trunc(afterUntil - round + 1));

        let reason;
        let icon;
        let severity;
        if (hasRedDirect) {
          reason = 'Cartão vermelho direto';
          icon = '🟥';
          severity = 'high';
        } else if (hasSecondYellow) {
          reason = 'Segundo amarelo';
          icon = '🟨🟥';
          severity = 'medium';
        } else {
          const previousYellows = nonNegativeInt(pBefore.discipline?.yellowCards);
          reason = `3 amarelos acumulados (${previousYellows + yellowCount} no total)`;
          icon = '🟨🟨🟨';
          severity = 'medium';
        }

        suspensions.push({
          player:pAfter,
          reason,
          icon,
          severity,
          roundsLeft,
          wasStarter:Boolean(pBefore.isStarting),
        });
      }

      const wasInjured = Boolean(pBefore.injury);
      const isNowInjured = Boolean(pAfter.injury);
      if (!wasInjured && isNowInjured) {
        const roundsLeft = Math.max(1, nonNegativeInt(pAfter.injury?.roundsLeft, 1));
        const injuryType = String(pAfter.injury?.type || 'Lesão');
        injuries.push({
          player:pAfter,
          injuryType,
          roundsLeft,
          isTraining:/treino/i.test(injuryType),
          severity:roundsLeft >= 4 ? 'high' : roundsLeft >= 2 ? 'medium' : 'low',
          wasStarter:Boolean(pBefore.isStarting),
        });
      }
    });

    const sortFn = (left, right) => {
      if (left.wasStarter !== right.wasStarter) return left.wasStarter ? -1 : 1;
      return (SEVERITY_ORDER[left.severity] ?? 1) - (SEVERITY_ORDER[right.severity] ?? 1);
    };

    suspensions.sort(sortFn);
    injuries.sort(sortFn);
    const hasBlockers = suspensions.some((item) => item.wasStarter) || injuries.some((item) => item.wasStarter);
    return { suspensions, injuries, hasBlockers };
  },

  formatRoundsLeft: (value) => {
    const rounds = Math.max(1, nonNegativeInt(value, 1));
    return rounds === 1 ? 'próximo jogo' : `próximos ${rounds} jogos`;
  },
};

export default PostMatchAgent;

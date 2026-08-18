export const getCupPrizeDelta = (beforeCup, afterCup) => Math.max(
  0,
  (afterCup?.totalPrize || 0) - (beforeCup?.totalPrize || 0),
);

export const appendCupPrizeToEvents = (events = [], {
  cup,
  color,
  earned,
  message = 'Premiação da fase garantida.',
} = {}) => {
  if (!(earned > 0)) return events;
  const existingEarned = events.reduce((sum, event) => sum + (event.earned || 0), 0);
  if (existingEarned === earned) return events;
  if (events.length && existingEarned === 0) {
    const next = [...events];
    next[next.length - 1] = { ...next[next.length - 1], earned };
    return next;
  }
  return [...events, { cup, msg: message, color, earned }];
};

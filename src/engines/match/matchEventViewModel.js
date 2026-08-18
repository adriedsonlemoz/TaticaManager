const safeText = (value) => String(value ?? '');
const normalizeName = (value) => safeText(value).trim();
const finalParenthesis = (text) => safeText(text).match(/\(([^()]*)\)\s*$/)?.[1]?.trim() || '';

const parseMatchEventClock = (event) => {
  const match = safeText(event).trimStart().match(/^(\d+)(?:\+(\d+))?'?/);
  if (!match) return { baseMinute: null, stoppageMinute: 0, minute: null };
  const baseMinute = Number(match[1]);
  const stoppageMinute = Number(match[2]) || 0;
  return { baseMinute, stoppageMinute, minute: baseMinute + stoppageMinute };
};

export const getMatchEventBaseMinute = (event) => parseMatchEventClock(event).baseMinute;
export const getMatchEventMinute = (event) => parseMatchEventClock(event).minute;
export const getMatchEventMinuteLabel = (event) => {
  const { baseMinute, stoppageMinute } = parseMatchEventClock(event);
  if (baseMinute == null) return '';
  return stoppageMinute > 0 ? `${baseMinute}+${stoppageMinute}` : String(baseMinute);
};

export const isGoalMatchEvent = (event) => {
  const text = safeText(event);
  return /GOL CONTRA/i.test(text) || /CONVERTIDO por/i.test(text) || text.includes('⚽') || /\bGOL\b/i.test(text);
};

export const getMatchEventTeam = (event, homeName = '', awayName = '') => {
  const text = safeText(event);
  const home = normalizeName(homeName);
  const away = normalizeName(awayName);
  if (!home && !away) return null;

  const ending = finalParenthesis(text);
  if (ending && ending === home) return 'home';
  if (ending && ending === away) return 'away';

  const hasHome = Boolean(home && text.includes(home));
  const hasAway = Boolean(away && text.includes(away));
  if (hasHome !== hasAway) return hasHome ? 'home' : 'away';
  if (hasHome && hasAway) {
    if (away.includes(home) && away.length > home.length) return 'away';
    if (home.includes(away) && home.length > away.length) return 'home';
  }
  return null;
};

const getOwnGoalOffenderSide = (event, homeName, awayName) => {
  const ending = finalParenthesis(event);
  if (ending === normalizeName(homeName)) return 'home';
  if (ending === normalizeName(awayName)) return 'away';
  return getMatchEventTeam(event, homeName, awayName);
};

export const getGoalScoringSide = (event, homeName = '', awayName = '') => {
  const text = safeText(event);
  if (!isGoalMatchEvent(text)) return null;
  if (/GOL CONTRA/i.test(text)) {
    const offenderSide = getOwnGoalOffenderSide(text, homeName, awayName);
    return offenderSide === 'home' ? 'away' : offenderSide === 'away' ? 'home' : null;
  }
  return getMatchEventTeam(text, homeName, awayName);
};

export const getGoalScorerName = (event) => {
  const text = safeText(event);
  if (/GOL CONTRA/i.test(text)) return text.match(/GOL CONTRA!\s+(.+?)\s+manda\b/i)?.[1]?.trim() || '';
  if (/CONVERTIDO por/i.test(text)) return text.match(/CONVERTIDO por\s+(.+?)!\s*\(/i)?.[1]?.trim() || '';
  return finalParenthesis(text);
};

export const parseMatchGoalEvent = (event, homeName = '', awayName = '') => ({
  minute: getMatchEventMinute(event),
  minuteLabel: getMatchEventMinuteLabel(event),
  scorer: getGoalScorerName(event),
  side: getGoalScoringSide(event, homeName, awayName),
  isOwnGoal: /GOL CONTRA/i.test(safeText(event)),
  isPenalty: /CONVERTIDO por/i.test(safeText(event)),
});

export const getGoalScoreFromEvents = (events = [], homeName = '', awayName = '', maxMinute = Infinity) => (
  (Array.isArray(events) ? events : []).reduce((score, event) => {
    if (!isGoalMatchEvent(event)) return score;
    const minute = getMatchEventMinute(event);
    if (minute != null && minute > maxMinute) return score;
    const side = getGoalScoringSide(event, homeName, awayName);
    if (side === 'home') score.home += 1;
    if (side === 'away') score.away += 1;
    return score;
  }, { home: 0, away: 0 })
);

export const parseMatchCardEvent = (event, homeName = '', awayName = '') => {
  const text = safeText(event);
  const minute = getMatchEventMinute(text);
  const minuteLabel = getMatchEventMinuteLabel(text);
  const secondYellow = text.includes('🟨🟥') || /SEGUNDO AMARELO/i.test(text);
  const directRed = (text.includes('🟥') || /Vermelho direto/i.test(text)) && !secondYellow;
  const yellow = text.includes('🟨') || /\bamarelo\b/i.test(text);
  const kind = secondYellow ? 'second-yellow' : directRed ? 'red' : yellow ? 'yellow' : 'unknown';
  const player = secondYellow
    ? text.match(/SEGUNDO AMARELO!\s+(.+?)\s+está EXPULSO!/i)?.[1]?.trim() || ''
    : directRed
      ? text.match(/Vermelho direto para\s+(.+?)\s*\(/i)?.[1]?.trim() || ''
      : text.match(/(?:Amarelo para|Falta tática de|amarelo para)\s+(.+?)\s*\(/i)?.[1]?.trim() || '';
  const side = getMatchEventTeam(text, homeName, awayName);
  return { minute, minuteLabel, player, side, teamName: side === 'home' ? homeName : side === 'away' ? awayName : '', kind };
};

export const getMatchEventKind = (event) => {
  const text = safeText(event);
  if (/FIM DE JOGO/i.test(text)) return 'end';
  if (isGoalMatchEvent(text)) return 'goal';
  if (text.includes('🟥') || /\bEXPULSO\b/i.test(text)) return 'red';
  if (text.includes('🟨') || /\bamarelo\b/i.test(text)) return 'yellow';
  if (/SUBSTITUIÇÃO/i.test(text) || text.includes('🔄')) return 'sub';
  return 'neutral';
};

export const buildLiveEventMeta = (event, { homeName = '', awayName = '', userTeamName = '' } = {}) => {
  const kind = getMatchEventKind(event);
  const goalSide = kind === 'goal' ? getGoalScoringSide(event, homeName, awayName) : null;
  const eventSide = goalSide || getMatchEventTeam(event, homeName, awayName);
  const teamName = eventSide === 'home' ? homeName : eventSide === 'away' ? awayName : '';
  return {
    kind,
    side: eventSide,
    teamName,
    isUserEvent: Boolean(userTeamName && teamName === userTeamName),
    goal: kind === 'goal' ? parseMatchGoalEvent(event, homeName, awayName) : null,
  };
};

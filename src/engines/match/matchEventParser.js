const safeText = (value) => String(value ?? '');

const parseMinute = (value) => {
  const match = safeText(value).trimStart().match(/^(\d+)(?:\+(\d+))?'?/);
  if (!match) return null;
  return Number(match[1]) + (Number(match[2]) || 0);
};

const extractFinalParenthesis = (value) => safeText(value).match(/\(([^()]*)\)\s*$/)?.[1]?.trim() || null;

const extractPlayer = (value, type) => {
  const text = safeText(value);
  if (type === 'goal') {
    if (/GOL CONTRA/i.test(text)) return text.match(/GOL CONTRA!\s+(.+?)\s+manda\b/i)?.[1]?.trim() || null;
    if (/CONVERTIDO por/i.test(text)) return text.match(/CONVERTIDO por\s+(.+?)!\s*\(/i)?.[1]?.trim() || null;
    return extractFinalParenthesis(text);
  }
  if (type === 'red') {
    return text.match(/SEGUNDO AMARELO!\s+(.+?)\s+está EXPULSO!/i)?.[1]?.trim()
      || text.match(/Vermelho direto para\s+(.+?)\s*\(/i)?.[1]?.trim()
      || text.match(/EXPULSO!\s+(.+?)\s*\(/i)?.[1]?.trim()
      || null;
  }
  if (type === 'yellow') {
    return text.match(/(?:Amarelo para|Falta tática de|amarelo para)\s+(.+?)\s*\(/i)?.[1]?.trim() || null;
  }
  return null;
};

export function parseMatchEvent(raw) {
  const value = safeText(raw);
  if (!value) return { type: 'neutral', player: null, minute: null, raw };

  let type = 'neutral';
  if (/GOL CONTRA/i.test(value) || /CONVERTIDO por/i.test(value) || value.includes('⚽') || /\bGOL\b/i.test(value)) type = 'goal';
  else if (value.includes('🟥') || /\bEXPULSO\b/i.test(value)) type = 'red';
  else if (value.includes('🟨') || /\bamarelo\b/i.test(value)) type = 'yellow';
  else if (/FIM DE JOGO/i.test(value)) type = 'end';
  else if (/SUBSTITUIÇÃO/i.test(value) || value.includes('🔄')) type = 'sub';

  return { type, player: extractPlayer(value, type), minute: parseMinute(value), raw };
}

export const SMR_parseEvent = parseMatchEvent;

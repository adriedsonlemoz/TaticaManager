export function parseMatchEvent(raw) {
  if (!raw) return { type: 'neutral', player: null, minute: null, raw };
  const value = String(raw);
  const minuteMatch = value.match(/^(\d+)'/);
  const minute = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : null;
  let type = 'neutral';
  let player = null;

  if (value.includes('GOL') || value.includes('⚽')) {
    type = 'goal';
    player = value.match(/\(([^)]+)\)/)?.[1] || null;
  } else if (value.includes('🟥') || value.includes('EXPULSO')) {
    type = 'red';
    player = value.match(/para (.+?) \(/)?.[1]
      || value.match(/de (.+?) \(/)?.[1]
      || value.match(/EXPULSO! (?:Vermelho direto para )?(.+?) \(/)?.[1]
      || null;
  } else if (value.includes('🟨')) {
    type = 'yellow';
    player = value.match(/para (.+?) \(/)?.[1]
      || value.match(/de (.+?) \(/)?.[1]
      || null;
  } else if (value.includes('FIM DE JOGO')) {
    type = 'end';
  } else if (value.includes('SUBSTITUIÇÃO') || value.includes('🔄')) {
    type = 'sub';
  }

  return { type, player, minute, raw };
}

export const SMR_parseEvent = parseMatchEvent;

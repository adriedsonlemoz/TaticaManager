export { acceptManagerOfferState } from '../career/managerOfferService.js';

const WAGE_LIMITS = { A: 2100000, B: 600000, C: 200000, D: 60000 };

export const getMessageSender = (msg) => msg?.from || msg?.sender || msg?.type || 'Sistema';

export const getMessageDate = (msg) => msg?.date || (msg?.round != null ? `Rodada ${msg.round}` : '');

export function getMessagePreview(msg) {
  if (msg?.preview) return msg.preview;
  const body = String(msg?.body || '').replace(/\s+/g, ' ').trim();
  return body.length > 110 ? `${body.slice(0, 107)}...` : body;
}

export function getMessageTypeLabel(type) {
  const normalized = String(type || 'OUTRO').trim().toUpperCase();
  if (normalized === 'CONTRACT') return 'CONTRATO';
  return normalized || 'OUTRO';
}

export const isMessageRead = (msg, readIds) => readIds.has(msg.id) || Boolean(msg.defaultRead);

export function buildGeneratedMessages(gameData, formatMoney) {
  const msgs = [];
  const table = gameData.table || [];
  const players = gameData.players || [];
  const club = gameData.club || {};
  const myPos = (table.findIndex(t => t.id === 'user') + 1) || 0;
  const round = gameData.round || 0;
  const money = club.money || 0;
  const serie = gameData.serie || 'A';
  const totalWage = players.reduce((sum, player) => sum + (player.wage || 0), 0);
  const wageLimit = WAGE_LIMITS[serie] ?? WAGE_LIMITS.A;
  const starters = players.filter(player => player.isStarting).length;
  const managerName = club.manager || 'Treinador';

  msgs.push({
    id: 'welcome', icon: '📋', type: 'DIRETORIA', defaultRead: round > 2,
    from: 'Presidente do Clube', subject: 'Metas para a Temporada', date: 'Pré-temporada',
    preview: 'Bem-vindo ao clube. Verifique as nossas expectativas...',
    body: `Sr. ${managerName},\n\nSeja bem-vindo ao ${club.name}.\n\nA meta é terminar entre os ${myPos <= 10 ? 'primeiros 10' : 'primeiros 8'} da Série ${serie}.\n\nSeu orçamento inicial é de ${formatMoney(money)}.\n\nBoa sorte, Comandante.`,
    actionData: { type: 'link', target: 'squad', label: 'VER MEU ELENCO' },
  });

  if (starters < 11 && round === 0) {
    msgs.push({
      id: 'squad_analysis', icon: '⚠️', type: 'COMISSÃO', defaultRead: false,
      from: 'Assistente Técnico', subject: 'Escalação Incompleta', date: 'Rodada 1',
      preview: 'Ainda não temos 11 titulares definidos...',
      body: 'Chefe,\n\nNotei que ainda não definimos os 11 titulares para a nossa estreia.\n\nPor favor, acesse a prancheta tática e ajuste a equipe antes do jogo.',
      actionData: { type: 'link', target: 'lineup', label: 'AJUSTAR TÁTICA' },
    });
  }

  if (totalWage > wageLimit * 0.85) {
    const warnId = `wage_warning_r${Math.floor(round / 5) * 5}`;
    msgs.push({
      id: warnId, icon: '📉', type: 'FINANCEIRO', defaultRead: false,
      from: 'Diretor Financeiro', subject: 'Folha Salarial em Risco', date: `Rodada ${Math.max(round, 1)}`,
      preview: `Gastos mensais em ${formatMoney(totalWage)} — perto do limite.`,
      body: `Treinador,\n\nA folha salarial atingiu ${formatMoney(totalWage)}, muito próxima do limite de ${formatMoney(wageLimit)}.\n\nConsidere vender jogadores de alto salário que não estão sendo utilizados.\n\nA saúde financeira do clube depende desta decisão.`,
      actionData: { type: 'link', target: 'finances', label: 'ABRIR FINANÇAS' },
    });
  }

  return msgs;
}

export function combineAndSortMessages(dynamicMessages, generatedMessages, readIds) {
  const dynamic = (dynamicMessages || []).map(message => ({ ...message, isDynamic: true }));
  return [...dynamic, ...generatedMessages].sort((a, b) => {
    const aRead = isMessageRead(a, readIds);
    const bRead = isMessageRead(b, readIds);
    if (aRead !== bRead) return aRead ? 1 : -1;
    const tsA = parseInt(String(a.id).replace(/\D/g, '').slice(-13), 10) || 0;
    const tsB = parseInt(String(b.id).replace(/\D/g, '').slice(-13), 10) || 0;
    return tsB - tsA || String(b.id).localeCompare(String(a.id));
  });
}

export function partitionMessages(allMessages, trashIds, erasedIds) {
  return {
    inboxMessages: allMessages.filter(message => !trashIds.has(message.id) && !erasedIds.has(message.id)),
    trashMessages: allMessages.filter(message => trashIds.has(message.id) && !erasedIds.has(message.id)),
  };
}

export function filterMessages(messages, search) {
  const q = search.trim().toLowerCase();
  if (!q) return messages;
  return messages.filter(message =>
    message.subject?.toLowerCase().includes(q) ||
    getMessageSender(message).toLowerCase().includes(q) ||
    getMessagePreview(message).toLowerCase().includes(q) ||
    getMessageTypeLabel(message.type).toLowerCase().includes(q)
  );
}

export function countUnreadByType(messages, readIds) {
  return messages.reduce((counts, message) => {
    if (isMessageRead(message, readIds)) return counts;
    const type = getMessageTypeLabel(message.type);
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
}

export function getMessageTypeStyle(type, theme) {
  const label = getMessageTypeLabel(type);
  return ({
    'TRANSFERÊNCIA': { color: theme.blue, bg: `${theme.blue}15` },
    'CONTRATO': { color: theme.gold, bg: `${theme.gold}15` },
    'FINANCEIRO': { color: theme.teal, bg: `${theme.teal}15` },
    'DIRETORIA': { color: theme.primary, bg: `${theme.primary}15` },
    'COMISSÃO': { color: theme.gold, bg: `${theme.gold}15` },
    'PROPOSTA': { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
    'IMPRENSA': { color: theme.blue, bg: `${theme.blue}12` },
    'RUMOR': { color: theme.purple, bg: `${theme.purple}12` },
    'TORCIDA': { color: theme.orange, bg: `${theme.orange}12` },
    'DISCIPLINA': { color: theme.red, bg: `${theme.red}12` },
  }[label] || { color: theme.txt2, bg: theme.cardAlt });
}

const appendUnique = (items, value) => items.includes(value) ? items : [...items, value];

export const markMessageReadState = (state, id) => ({
  ...state,
  readMsgIds: appendUnique(state.readMsgIds || [], id),
});

export const moveMessageToTrashState = (state, id) => ({
  ...state,
  trashMsgIds: appendUnique(state.trashMsgIds || [], id),
});

export const restoreMessageState = (state, id) => ({
  ...state,
  trashMsgIds: (state.trashMsgIds || []).filter(item => item !== id),
});

export function permanentlyDeleteMessageState(state, { id, isDynamic }) {
  if (isDynamic) {
    return {
      ...state,
      inbox: (state.inbox || []).filter(message => message.id !== id),
      trashMsgIds: (state.trashMsgIds || []).filter(item => item !== id),
      readMsgIds: (state.readMsgIds || []).filter(item => item !== id),
    };
  }
  return {
    ...state,
    erasedMsgIds: appendUnique(state.erasedMsgIds || [], id),
    trashMsgIds: (state.trashMsgIds || []).filter(item => item !== id),
  };
}

export function emptyTrashState(state, trashMessages) {
  const dynamicIds = new Set(trashMessages.filter(message => message.isDynamic).map(message => message.id));
  const staticIds = trashMessages.filter(message => !message.isDynamic).map(message => message.id);
  return {
    ...state,
    inbox: (state.inbox || []).filter(message => !dynamicIds.has(message.id)),
    erasedMsgIds: [...new Set([...(state.erasedMsgIds || []), ...staticIds])],
    readMsgIds: (state.readMsgIds || []).filter(id => !dynamicIds.has(id)),
    trashMsgIds: [],
  };
}



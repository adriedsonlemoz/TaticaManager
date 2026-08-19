import { buildRecentResults } from '../matches/matchesTimelineService.js';

export const NEWS_LIMIT = 240;
export const NEWS_CATEGORIES = Object.freeze({
  MARKET: 'market',
  RESULTS: 'results',
  COMPETITIONS: 'competitions',
  CLUB: 'club',
  SQUAD: 'squad',
});

const asArray = (value) => (Array.isArray(value) ? value : []);
const safeText = (value, fallback = '') => String(value ?? fallback).trim();
const safeDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
const number = (value) => Number(value) || 0;

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getNewsDateISO(gameData = {}, calendarIndex = null) {
  const explicit = safeDate(gameData.currentDateISO || gameData.currentDate);
  if (calendarIndex != null) {
    const entry = gameData.calendar?.[Math.max(0, Number(calendarIndex) || 0)];
    const entryDate = safeDate(entry?.dateISO || entry?.calendarDate);
    if (entryDate) return entryDate;
  }
  if (explicit) return explicit;
  const fallback = `${Math.max(2026, Number(gameData.season) || 2026)}-01-01`;
  return safeDate(fallback);
}

export function makeNewsItem({
  id = null,
  category = NEWS_CATEGORIES.CLUB,
  title = '',
  summary = '',
  dateISO = null,
  season = null,
  importance = 1,
  icon = null,
  competition = null,
  teamId = null,
  teamName = null,
  playerId = null,
  playerName = null,
  ref = null,
  meta = null,
} = {}) {
  const normalized = {
    category: safeText(category, NEWS_CATEGORIES.CLUB),
    title: safeText(title, 'Notícia da carreira'),
    summary: safeText(summary),
    dateISO: safeDate(dateISO),
    season: Number.isFinite(Number(season)) ? Math.trunc(Number(season)) : null,
    importance: Math.max(1, Math.min(5, Math.trunc(Number(importance) || 1))),
    icon: icon || null,
    competition: competition || null,
    teamId: teamId ?? null,
    teamName: teamName || null,
    playerId: playerId ?? null,
    playerName: playerName || null,
    ref: ref || null,
    meta: meta && typeof meta === 'object' ? { ...meta } : null,
  };
  const signature = [
    normalized.category, normalized.dateISO, normalized.season, normalized.title,
    normalized.teamId, normalized.playerId, normalized.ref,
  ].join('|');
  return { ...normalized, id: safeText(id) || `news_${hashText(signature)}` };
}

export function normalizeNewsFeed(feed = []) {
  const seen = new Set();
  const result = [];
  asArray(feed).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const item = makeNewsItem(entry);
    if (seen.has(item.id)) return;
    seen.add(item.id);
    result.push(item);
  });
  return result.slice(0, NEWS_LIMIT);
}

export function appendNewsItems(feed = [], items = []) {
  const incoming = asArray(items).filter(Boolean).map(makeNewsItem);
  if (!incoming.length) return normalizeNewsFeed(feed);
  const existing = normalizeNewsFeed(feed);
  const ids = new Set(incoming.map((item) => item.id));
  return [...incoming, ...existing.filter((item) => !ids.has(item.id))].slice(0, NEWS_LIMIT);
}

function parseScore(result) {
  const match = String(result || '').match(/(\d+)\s*[-x×]\s*(\d+)/i);
  return match ? { home:Number(match[1]), away:Number(match[2]) } : null;
}

function resultImportance(homeGoals, awayGoals, isUserHome, competition = '') {
  const userGoals = isUserHome ? homeGoals : awayGoals;
  const oppGoals = isUserHome ? awayGoals : homeGoals;
  if (/final/i.test(competition)) return 5;
  if (userGoals > oppGoals) return 3;
  if (userGoals < oppGoals) return 2;
  return 1;
}

export function buildMatchResultNews(gameData = {}, userMatchData = {}, competition = null, calendarIndex = null) {
  if (!userMatchData) return null;
  const homeName = safeText(userMatchData.homeName, 'Mandante');
  const awayName = safeText(userMatchData.awayName, 'Visitante');
  const homeGoals = Math.max(0, number(userMatchData.homeGoals));
  const awayGoals = Math.max(0, number(userMatchData.awayGoals));
  const isUserHome = typeof userMatchData.userIsHome === 'boolean'
    ? userMatchData.userIsHome
    : Boolean(userMatchData.homeIsPlayer);
  const userGoals = isUserHome ? homeGoals : awayGoals;
  const oppGoals = isUserHome ? awayGoals : homeGoals;
  const opponent = isUserHome ? awayName : homeName;
  const resultWord = userGoals > oppGoals ? 'Vitória' : userGoals < oppGoals ? 'Derrota' : 'Empate';
  const label = safeText(competition || userMatchData.cupLabel || (gameData.serie ? `Série ${gameData.serie}` : 'Partida'));
  const dateISO = getNewsDateISO(gameData, calendarIndex ?? gameData.round);
  return makeNewsItem({
    category:NEWS_CATEGORIES.RESULTS,
    title:`${homeName} ${homeGoals} × ${awayGoals} ${awayName}`,
    summary:`${resultWord} do ${safeText(gameData.club?.name, 'clube')} contra ${opponent} · ${label}.`,
    dateISO,
    season:gameData.season,
    importance:resultImportance(homeGoals, awayGoals, isUserHome, `${label} ${userMatchData.cupPhase || ''}`),
    icon:userGoals > oppGoals ? 'sports_soccer' : userGoals < oppGoals ? 'trending_down' : 'handshake',
    competition:label,
    teamId:gameData.club?.teamId || gameData.club?.existingTeamId || 'user',
    teamName:gameData.club?.name || null,
    ref:`match:${calendarIndex ?? gameData.round}:${homeName}:${awayName}:${homeGoals}-${awayGoals}`,
    meta:{ homeName, awayName, homeGoals, awayGoals, userIsHome:isUserHome },
  });
}

export function buildCupEventNews(gameData = {}, cupEvents = [], calendarIndex = null) {
  const dateISO = getNewsDateISO(gameData, calendarIndex ?? gameData.round);
  return asArray(cupEvents).filter((event) => event?.msg).map((event, index) => {
    const text = safeText(event.msg);
    const champion = /campe/i.test(text) || /🏆/.test(text);
    const eliminated = /eliminad/i.test(text);
    const classified = /classificad/i.test(text);
    return makeNewsItem({
      category:NEWS_CATEGORIES.COMPETITIONS,
      title:safeText(event.cup, 'Competição'),
      summary:text,
      dateISO,
      season:gameData.season,
      importance:champion ? 5 : (classified || eliminated ? 4 : 2),
      icon:champion ? 'emoji_events' : eliminated ? 'cancel' : classified ? 'trending_up' : 'military_tech',
      competition:event.cup || null,
      teamId:gameData.club?.teamId || gameData.club?.existingTeamId || 'user',
      teamName:gameData.club?.name || null,
      ref:`cup:${calendarIndex ?? gameData.round}:${event.cup || 'cup'}:${index}:${text}`,
      meta:{ earned:number(event.earned) },
    });
  });
}

export function buildUserTransferNews(state = {}, { direction, player, price = 0, otherTeamName = null, otherTeamId = null } = {}) {
  if (!player) return null;
  const incoming = direction === 'in';
  const clubName = safeText(state.club?.name, 'Clube');
  const fee = Math.max(0, number(price));
  const free = incoming && fee === 0;
  const counterpart = safeText(otherTeamName, incoming ? 'mercado' : 'novo clube');
  return makeNewsItem({
    category:NEWS_CATEGORIES.MARKET,
    title:incoming ? `${clubName} anuncia ${player.name}` : `${player.name} deixa o ${clubName}`,
    summary:incoming
      ? `${player.name} chega ${free ? 'sem custo de transferência' : `por R$ ${fee.toLocaleString('pt-BR')}`}${counterpart && counterpart !== 'mercado' ? ` vindo do ${counterpart}` : ''}.`
      : `${player.name} foi negociado com ${counterpart}${fee ? ` por R$ ${fee.toLocaleString('pt-BR')}` : ''}.`,
    dateISO:getNewsDateISO(state),
    season:state.season,
    importance:3,
    icon:incoming ? 'person_add' : 'person_remove',
    teamId:state.club?.teamId || state.club?.existingTeamId || 'user',
    teamName:clubName,
    playerId:player.id,
    playerName:player.name,
    ref:`transfer:${direction}:${player.id}:${state.season}:${state.round}:${fee}:${otherTeamId || counterpart}`,
    meta:{ direction, price:fee, otherTeamId, otherTeamName:otherTeamName || null },
  });
}

export function buildCpuTransferNews(state = {}, activity = [], limit = 6) {
  const sameSerie = safeText(state.serie);
  const relevant = asArray(activity)
    .filter((item) => item?.playerName && item?.toTeamName)
    .sort((a, b) => {
      const aSame = a.serie === sameSerie ? 1 : 0;
      const bSame = b.serie === sameSerie ? 1 : 0;
      return bSame - aSame || number(b.price) - number(a.price) || number(b.overall) - number(a.overall);
    })
    .slice(0, Math.max(0, limit));
  return relevant.map((item) => makeNewsItem({
    category:NEWS_CATEGORIES.MARKET,
    title:`${item.playerName} acerta com ${item.toTeamName}`,
    summary:item.fromTeamName
      ? `${item.fromTeamName} negociou ${item.playerName} com ${item.toTeamName}${number(item.price) ? ` por R$ ${number(item.price).toLocaleString('pt-BR')}` : ''}.`
      : `${item.toTeamName} confirmou a chegada de ${item.playerName}.`,
    dateISO:getNewsDateISO(state),
    season:state.season,
    importance:number(item.overall) >= 76 || number(item.price) >= 3_000_000 ? 3 : 2,
    icon:'swap_horiz',
    teamId:item.toTeamId || null,
    teamName:item.toTeamName,
    playerId:item.playerId || null,
    playerName:item.playerName,
    ref:`cpu-transfer:${item.playerId}:${item.fromTeamId || 'free'}:${item.toTeamId}:${state.season}:${state.round}`,
    meta:{ ...item },
  }));
}

export function buildSquadStatusNews(beforePlayers = [], afterPlayers = [], state = {}) {
  const previous = new Map(asArray(beforePlayers).filter((player) => player?.id != null).map((player) => [String(player.id), player]));
  const dateISO = getNewsDateISO(state);
  const items = [];
  asArray(afterPlayers).forEach((player) => {
    const before = previous.get(String(player?.id));
    if (!before) return;
    if (!before.injury && player.injury) {
      items.push(makeNewsItem({
        category:NEWS_CATEGORIES.SQUAD,
        title:`${player.name} vai para o departamento médico`,
        summary:`${player.injury.type || 'Lesão'} · previsão de ${Math.max(1, number(player.injury.roundsLeft))} jogo(s) fora.`,
        dateISO, season:state.season, importance:3, icon:'medical_services',
        playerId:player.id, playerName:player.name,
        ref:`injury:${player.id}:${state.season}:${state.round}:${player.injury.type}:${player.injury.roundsLeft}`,
      }));
    }
    const beforeSuspension = number(before.discipline?.suspendedUntilRound);
    const afterSuspension = number(player.discipline?.suspendedUntilRound);
    if (afterSuspension > beforeSuspension && afterSuspension > number(state.round)) {
      items.push(makeNewsItem({
        category:NEWS_CATEGORIES.SQUAD,
        title:`${player.name} está suspenso`,
        summary:`O atleta ficará indisponível por suspensão disciplinar.`,
        dateISO, season:state.season, importance:2, icon:'gavel',
        playerId:player.id, playerName:player.name,
        ref:`suspension:${player.id}:${state.season}:${afterSuspension}`,
      }));
    }
  });
  return items;
}

export function buildSeasonOutcomeNews(state = {}, snapshot = {}) {
  const club = safeText(state.club?.name, 'Clube');
  const serie = safeText(snapshot.prevSerie || state.serie, 'A');
  const position = number(snapshot.userPos || snapshot.finalPosition);
  const movements = snapshot.promoted ? ' O acesso foi confirmado.' : snapshot.relegated ? ' O clube foi rebaixado.' : '';
  const champion = Boolean(snapshot.champion);
  return makeNewsItem({
    category:NEWS_CATEGORIES.CLUB,
    title:champion ? `${club} é campeão da Série ${serie}` : `Temporada ${snapshot.season || state.season} encerrada`,
    summary:`${club} terminou a Série ${serie}${position ? ` em ${position}º lugar` : ''}.${movements}`,
    dateISO:getNewsDateISO(state),
    season:snapshot.season || state.season,
    importance:champion || snapshot.promoted || snapshot.relegated ? 5 : 3,
    icon:champion ? 'emoji_events' : snapshot.promoted ? 'trending_up' : snapshot.relegated ? 'trending_down' : 'flag',
    competition:`Série ${serie}`,
    teamId:state.club?.teamId || state.club?.existingTeamId || 'user',
    teamName:club,
    ref:`season:${snapshot.season || state.season}:${serie}:${position}:${snapshot.promoted ? 'up' : snapshot.relegated ? 'down' : 'stay'}:${champion ? 'champion' : 'regular'}`,
  });
}

function legacyTransferNews(state = {}) {
  return asArray(state.financialHistory).filter((entry) => {
    const description = safeText(entry?.detail?.description || entry?.description).toLowerCase();
    return description.startsWith('compra:') || description.startsWith('contratação livre:') || description.startsWith('venda:');
  }).slice(0, 8).map((entry, index) => {
    const description = safeText(entry?.detail?.description || entry?.description);
    const sale = /^venda:/i.test(description);
    const playerName = description.replace(/^(compra|contratação livre|venda):\s*/i, '').split('→')[0].trim();
    const fee = sale ? number(entry.income || entry.total) : number(entry.expense || Math.abs(number(entry.total)));
    return makeNewsItem({
      category:NEWS_CATEGORIES.MARKET,
      title:sale ? `${playerName} foi negociado` : `${playerName} chegou ao clube`,
      summary:`${description}${fee ? ` · R$ ${fee.toLocaleString('pt-BR')}` : ''}`,
      dateISO:getNewsDateISO(state, Math.max(0, number(entry.round) - 1)),
      season:entry.season || state.season,
      importance:2,
      icon:sale ? 'person_remove' : 'person_add',
      playerName,
      ref:`legacy-transfer:${entry.season || state.season}:${entry.round || index}:${description}:${fee}`,
    });
  });
}

function legacyMatchNews(state = {}) {
  try {
    return buildRecentResults({ gameData:state, currentRound:number(state.round), roundDates:[], limit:8 }).map((item, index) => {
      const score = parseScore(item.match?.result);
      if (!score) return null;
      const userIsHome = Boolean(item.match?.home?.isPlayer || item.match?.home?.id === 'user');
      return makeNewsItem({
        category:NEWS_CATEGORIES.RESULTS,
        title:`${item.match?.home?.name || 'Mandante'} ${score.home} × ${score.away} ${item.match?.away?.name || 'Visitante'}`,
        summary:`${item.isCup ? item.cupLabel || 'Copa' : `Série ${state.serie || 'A'}`} · resultado da carreira.`,
        dateISO:item.date?.toISOString?.().slice(0, 10) || getNewsDateISO(state),
        season:state.season,
        importance:resultImportance(score.home, score.away, userIsHome, item.cupLabel || ''),
        icon:'sports_soccer',
        competition:item.isCup ? item.cupLabel : `Série ${state.serie || 'A'}`,
        ref:`legacy-match:${item.isCup ? item.cupLabel : 'league'}:${item.round}:${index}:${item.match?.home?.name}:${item.match?.away?.name}:${item.match?.result}`,
      });
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export function reconcileNewsFeed(state = {}) {
  const existing = normalizeNewsFeed(state.newsFeed);
  if (existing.length) return existing;
  const seeded = [
    ...legacyMatchNews(state),
    ...legacyTransferNews(state),
  ];
  if (!seeded.length && state.club?.name) {
    seeded.push(makeNewsItem({
      category:NEWS_CATEGORIES.CLUB,
      title:`Novo trabalho no ${state.club.name}`,
      summary:`A carreira começou na Série ${state.serie || 'A'} com ${state.club.manager || 'o novo treinador'} no comando.`,
      dateISO:getNewsDateISO(state),
      season:state.season,
      importance:3,
      icon:'campaign',
      teamId:state.club?.teamId || state.club?.existingTeamId || 'user',
      teamName:state.club.name,
      ref:`career-start:${state.season}:${state.club?.teamId || state.club?.name}`,
    }));
  }
  return appendNewsItems([], seeded);
}

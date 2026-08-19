import { NEWS_CATEGORIES, normalizeNewsFeed } from './newsEngine.js';

export const NEWS_FILTERS = Object.freeze([
  { id:'all', label:'Todas' },
  { id:NEWS_CATEGORIES.MARKET, label:'Mercado' },
  { id:NEWS_CATEGORIES.RESULTS, label:'Resultados' },
  { id:NEWS_CATEGORIES.COMPETITIONS, label:'Competições' },
  { id:NEWS_CATEGORIES.SQUAD, label:'Elenco' },
  { id:NEWS_CATEGORIES.CLUB, label:'Clube' },
]);

export const NEWS_META = Object.freeze({
  [NEWS_CATEGORIES.MARKET]:{ label:'Mercado', icon:'swap_horiz', color:'#0f766e' },
  [NEWS_CATEGORIES.RESULTS]:{ label:'Resultados', icon:'sports_soccer', color:'#2563eb' },
  [NEWS_CATEGORIES.COMPETITIONS]:{ label:'Competições', icon:'emoji_events', color:'#d97706' },
  [NEWS_CATEGORIES.SQUAD]:{ label:'Elenco', icon:'medical_services', color:'#dc2626' },
  [NEWS_CATEGORIES.CLUB]:{ label:'Clube', icon:'shield', color:'#7c3aed' },
});

const formatDate = (dateISO) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || ''))) return 'Data da carreira';
  const [year, month, day] = String(dateISO).split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short', year:'numeric', timeZone:'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace('.', '');
};

export function buildNewsViewModel(gameData = {}, { filter = 'all', query = '' } = {}) {
  const feed = normalizeNewsFeed(gameData.newsFeed);
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase('pt-BR');
  const filtered = feed.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (!normalizedQuery) return true;
    return [item.title, item.summary, item.teamName, item.playerName, item.competition]
      .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  });
  const categoryCounts = Object.fromEntries(NEWS_FILTERS.map((item) => [
    item.id,
    item.id === 'all' ? feed.length : feed.filter((entry) => entry.category === item.id).length,
  ]));
  return {
    total:feed.length,
    filtered:filtered.map((item) => ({
      ...item,
      displayDate:formatDate(item.dateISO),
      meta:NEWS_META[item.category] || NEWS_META[NEWS_CATEGORIES.CLUB],
    })),
    filters:NEWS_FILTERS.map((item) => ({ ...item, count:categoryCounts[item.id] || 0 })),
    headline:feed[0] || null,
  };
}

import { findPendingManagerOffer } from './managerOfferService.js';

const STYLE_ICONS = { Defensivo:'🛡️', Equilibrado:'⚖️', Ofensivo:'⚔️', Direto:'🎯' };
const SERIE_COLORS = { A:'#16a34a', B:'#2563eb', C:'#d97706', D:'#9333ea' };

export const getManagerLevel = (experience = 0, fallbackColor = '#64748b') => {
  const exp = Math.max(0, Number(experience) || 0);
  const level = exp >= 100
    ? { label:'Lendário', color:'#f59e0b', min:100, next:null }
    : exp >= 50
      ? { label:'Experiente', color:'#22c55e', min:50, next:100 }
      : exp >= 20
        ? { label:'Veterano', color:'#3b82f6', min:20, next:50 }
        : exp >= 5
          ? { label:'Intermediário', color:'#8b5cf6', min:5, next:20 }
          : { label:'Novato', color:fallbackColor, min:0, next:5 };
  const progressPct = level.next == null
    ? 100
    : Math.max(0, Math.min(100, Math.round(((exp - level.min) / (level.next - level.min)) * 100)));
  return { ...level, experience:exp, progressPct };
};

export const getManagerInitials = (name = 'Treinador') => String(name)
  .trim().split(/\s+/).filter(Boolean).map(word => word[0] || '').join('').slice(0, 2).toUpperCase();

export const getMoraleSummary = (value = 60) => {
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  if (score >= 80) return { score, label:'Excelente', emoji:'🔥', tone:'green' };
  if (score >= 65) return { score, label:'Bom', emoji:'😊', tone:'green' };
  if (score >= 50) return { score, label:'Regular', emoji:'😐', tone:'gold' };
  if (score >= 35) return { score, label:'Baixo', emoji:'😟', tone:'red' };
  return { score, label:'Crítico', emoji:'😡', tone:'red' };
};

export const getFanLoyaltySummary = (value = 0) => {
  const score = Math.max(0, Math.min(100, Number(value) || 0));
  if (score >= 80) return { score, label:'Fanática', tone:'green' };
  if (score >= 65) return { score, label:'Fiel', tone:'green' };
  if (score >= 45) return { score, label:'Dividida', tone:'gold' };
  if (score >= 25) return { score, label:'Insatisfeita', tone:'red' };
  return { score, label:'Revoltada', tone:'red' };
};

export const buildSeasonHistory = (history = []) => [...history].reverse().map(entry => {
  const games = (entry.wins || 0) + (entry.draws || 0) + (entry.losses || 0);
  const winPct = games > 0 ? Math.round((entry.wins || 0) / games * 100) : 0;
  return {
    ...entry,
    games,
    winPct,
    serieColor: SERIE_COLORS[entry.serie] || null,
    positionIcon: entry.position === 1 ? '🏆' : entry.position <= 4 ? '🟢' : entry.position >= 17 ? '🔴' : '⚪',
  };
});

export const buildHeadToHead = (history = {}, limit = 6) => Object.entries(history || {})
  .map(([name, record]) => {
    const wins = record?.w || 0;
    const draws = record?.d || 0;
    const losses = record?.l || 0;
    const total = wins + draws + losses;
    return { name, ...record, w:wins, d:draws, l:losses, total, winPct:total ? Math.round(wins / total * 100) : 0 };
  })
  .filter(entry => entry.total > 0)
  .sort((a, b) => b.total - a.total || b.w - a.w || a.name.localeCompare(b.name))
  .slice(0, limit);

export const buildCareerViewModel = (gameData = {}, fallbackColor = '#64748b') => {
  const profile = gameData.club?.managerProfile || {};
  const manager = gameData.club?.manager || 'Treinador';
  const table = gameData.table || [];
  const rowIndex = table.findIndex(row => row.id === 'user');
  const myRow = rowIndex >= 0 ? table[rowIndex] : {};
  const total = (profile.wins || 0) + (profile.draws || 0) + (profile.losses || 0);
  const careerWinPct = total > 0 ? Math.round((profile.wins || 0) / total * 100) : 0;
  const seasonWinPct = (myRow.p || 0) > 0 ? Math.round((myRow.w || 0) / myRow.p * 100) : 0;
  const managerLevel = getManagerLevel(profile.experience, fallbackColor);
  return {
    profile,
    manager,
    initials:getManagerInitials(manager),
    myRow,
    myPos:rowIndex >= 0 ? rowIndex + 1 : 0,
    total,
    careerWinPct,
    seasonWinPct,
    goalDifference:(myRow.gf || 0) - (myRow.ga || 0),
    managerLevel,
    styleIcon:STYLE_ICONS[profile.style] || '⚽',
    pendingOffer:findPendingManagerOffer(gameData),
    seasonHistory:buildSeasonHistory(gameData.careerHistory || []),
    headToHead:buildHeadToHead(gameData.h2hHistory || {}),
  };
};

export { STYLE_ICONS, SERIE_COLORS };

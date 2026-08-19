import { getAcademyProspects, getAcademyStats } from '../academy/academyViewModel.js';
import { getMessageDate } from '../inbox/inboxService.js';
import { getPlayerAvailability, getUpcomingRound } from '../core/playerStatus.js';

export const NAV_MENU = Object.freeze({
  TEAM: 'team',
  CLUB: 'club',
  OPTIONS: 'options',
});

export const BOTTOM_NAV_ITEMS = Object.freeze([
  { id: 'home', label: 'Central', icon: 'home', target: 'home' },
  { id: 'squad', label: 'Elenco', icon: 'groups', target: 'squad' },
  { id: 'team', label: 'Time', icon: 'sports_soccer', menu: NAV_MENU.TEAM },
  { id: 'club', label: 'Clube', icon: 'shield', menu: NAV_MENU.CLUB },
  { id: 'matches', label: 'Calendário', icon: 'calendar_month', target: 'matches' },
  { id: 'market', label: 'Transf.', icon: 'swap_horiz', target: 'market' },
  { id: 'finances', label: 'Finanças', icon: 'account_balance', target: 'finances' },
  { id: 'options', label: 'Opções', icon: 'settings', menu: NAV_MENU.OPTIONS },
]);

const number = (value) => Number(value) || 0;

export function getManagerInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words.map((word) => word[0]).join('').slice(0, 2).toUpperCase();
}

export function getUnreadNavigationMessages(gameData = {}) {
  const readIds = new Set(gameData.readMsgIds || []);
  const trashIds = new Set(gameData.trashMsgIds || []);
  const erasedIds = new Set(gameData.erasedMsgIds || []);

  return (gameData.inbox || [])
    .filter((message) => message?.id != null)
    .filter((message) => !trashIds.has(message.id) && !erasedIds.has(message.id))
    .filter((message) => !readIds.has(message.id) && !message.read && !message.defaultRead)
    .map((message) => ({
      ...message,
      displayDate: getMessageDate(message),
    }));
}

export function getSquadAvailability(gameData = {}) {
  const players = gameData.players || [];
  const currentRound = getUpcomingRound(gameData);
  const decorated = players.map((player, index) => ({
    player,
    index,
    status: getPlayerAvailability(player, currentRound),
  }));
  const unavailableIds = new Set(
    decorated
      .filter(({ status }) => status.unavailable)
      .map(({ player, index }) => player?.id ?? `idx:${index}`),
  );

  return {
    injured: decorated.filter(({ status }) => status.injured).length,
    suspended: decorated.filter(({ status }) => status.suspended).length,
    unavailable: unavailableIds.size,
  };
}

export function getAcademyNavigationSummary(gameData = {}) {
  const prospects = getAcademyProspects(gameData);
  const stats = getAcademyStats(prospects);
  return {
    total: stats.total,
    ready: stats.readyCount,
    label: stats.readyCount > 0
      ? `${stats.readyCount} garoto(s) pronto(s) para promoção ⭐`
      : `${stats.total} garoto(s) em formação`,
  };
}

export function getClubNavigationSummary(gameData = {}) {
  const table = gameData.table || [];
  const rowIndex = table.findIndex((row) => row.id === 'user');
  const tableRow = rowIndex >= 0 ? table[rowIndex] : {};
  const position = rowIndex >= 0 ? rowIndex + 1 : 0;
  const club = gameData.club || {};
  const managerProfile = club.managerProfile || {};
  const goalDifference = number(tableRow.gf) - number(tableRow.ga);
  const leagueRound = Number.isFinite(Number(gameData.leagueRound))
    ? Math.max(0, Math.trunc(Number(gameData.leagueRound)))
    : (Array.isArray(gameData.calendar)
      ? gameData.calendar.slice(0, Math.max(0, number(gameData.round))).filter((entry) => entry?.type === 'league').length
      : number(gameData.round));
  const leagueTotal = Math.max(0, Number(gameData.fixtures?.length) || 0) || 38;

  return {
    name: club.name || 'Meu Clube',
    serie: gameData.serie || '—',
    round: leagueRound,
    roundTotal: leagueTotal,
    position,
    positionLabel: position > 0 ? `${position}º` : '—',
    points: number(tableRow.pts),
    wins: number(tableRow.w),
    draws: number(tableRow.d),
    losses: number(tableRow.l),
    goalDifference,
    goalDifferenceLabel: `${goalDifference >= 0 ? '+' : ''}${goalDifference}`,
    manager: club.manager || 'Treinador',
    managerInitials: getManagerInitials(club.manager),
    managerStyle: managerProfile.style || 'Técnico',
    managerNationality: managerProfile.nationality || '',
    managerWins: number(managerProfile.wins),
    managerDraws: number(managerProfile.draws),
    managerLosses: number(managerProfile.losses),
    managerExperience: number(managerProfile.experience),
    money: number(club.money),
    wage: number(club.wage),
    transferBudget: number(club.transferBudget),
  };
}

export function buildBottomNavViewModel(gameData = {}) {
  const unread = getUnreadNavigationMessages(gameData);
  const squad = getSquadAvailability(gameData);
  const academy = getAcademyNavigationSummary(gameData);
  const club = getClubNavigationSummary(gameData);

  return {
    unread,
    unreadCount: unread.length,
    squad,
    academy,
    club,
    badges: {
      club: unread.length,
      team: squad.unavailable,
    },
  };
}

export function isBottomNavItemDisabled(item, { simulating = false, screen = '' } = {}) {
  if (!simulating || screen === 'match_result') return false;
  if (item.target) return item.target !== screen;
  return true;
}

export function isBottomNavItemActive(item, { screen = '', openMenu = null } = {}) {
  if (openMenu) return item.menu === openMenu;
  return item.target === screen;
}


export function buildBottomNavItems({ screen = '', openMenu = null, simulating = false, badges = {} } = {}) {
  return BOTTOM_NAV_ITEMS.map((item) => ({
    ...item,
    active: isBottomNavItemActive(item, { screen, openMenu }),
    disabled: isBottomNavItemDisabled(item, { screen, simulating }),
    badge: item.menu ? number(badges[item.menu]) : 0,
  }));
}

export function getBackupFilename(gameData = {}) {
  const clubName = String(gameData.club?.name || 'save')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'save';
  return `tatica_manager_${clubName}.json`;
}

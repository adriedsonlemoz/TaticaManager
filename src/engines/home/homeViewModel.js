import { CalendarEngine } from '../CalendarEngine.js';
import { FinanceEngine } from '../engine_finances.js';
import { DisciplineEngine } from '../engine_discipline.js';
import { getLineupValidation } from '../lineup/lineupRules.js';
import { buildBottomNavViewModel } from '../navigation/bottomNavViewModel.js';
import { getRecentLeagueForm } from '../nextmatch/nextMatchViewModel.js';
import { resolveMatchInfo } from '../../utils/matchDateUtils.js';
import { APP_NAME, APP_VERSION_LABEL } from '../../config/appMeta.js';
import { getUpcomingRound } from '../core/playerStatus.js';
import { getInactiveCupSkipCount } from '../calendar/idleCalendarAdvance.js';

const number = (value) => Number(value) || 0;
const totalSlots = (gameData = {}) => gameData.calendar?.length || gameData.fixtures?.length || 0;

export function getHomeSeasonSummary(gameData = {}) {
  const total = totalSlots(gameData);
  const round = number(gameData.round);
  return {
    round,
    total,
    seasonOver: round >= total,
  };
}

function findUserLeagueMatch(gameData, leagueIdx) {
  if (leagueIdx == null || leagueIdx < 0) return null;
  return (gameData.fixtures?.[leagueIdx] || [])
    .find((match) => match?.home?.isPlayer || match?.away?.isPlayer) || null;
}

function getTeamTableSummary(gameData, team) {
  if (!team) return { position: 0, points: 0 };
  const table = gameData.table || [];
  const index = table.findIndex((row) => (
    (team.id && row.id === team.id)
    || (team.name && row.name === team.name)
  ));
  const row = index >= 0 ? table[index] : {};
  return { position: index >= 0 ? index + 1 : 0, points: number(row.pts) };
}

function getLeagueMatchContext(gameData, slotIndex, calendarEntry) {
  const leagueIdx = calendarEntry?.leagueIdx ?? slotIndex;
  const match = findUserLeagueMatch(gameData, leagueIdx);
  if (!match) return null;

  return {
    slotIndex,
    type: 'league',
    competition: `Série ${gameData.serie || '—'}`,
    competitionLabel: `🏟️ Série ${gameData.serie || '—'} · Rodada ${leagueIdx + 1}/${gameData.fixtures?.length || 0}`,
    leagueIdx,
    displayHome: match.home,
    displayAway: match.away,
    rawMatch: match,
    cupInfo: null,
    matchInfo: resolveMatchInfo(gameData, slotIndex),
  };
}

function getCupMatchContext(gameData, slotIndex, calendarEntry) {
  const cupInfo = CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calendarEntry);
  if (!cupInfo?.hasCupMatch || !cupInfo.tie) return null;
  const isLeg2 = cupInfo.leg === 'leg2';
  const displayHome = isLeg2 ? cupInfo.tie.away : cupInfo.tie.home;
  const displayAway = isLeg2 ? cupInfo.tie.home : cupInfo.tie.away;

  return {
    slotIndex,
    type: 'cup',
    competition: cupInfo.label || 'Copa',
    competitionLabel: `${cupInfo.label || '🏆 Copa'}${calendarEntry?.phase ? ` · ${calendarEntry.phase}` : ''}`,
    leagueIdx: null,
    displayHome,
    displayAway,
    rawMatch: null,
    cupInfo,
    matchInfo: resolveMatchInfo(gameData, slotIndex),
  };
}

export function resolveHomeNextMatch(gameData = {}) {
  const season = getHomeSeasonSummary(gameData);
  if (season.seasonOver) return null;

  const calendar = gameData.calendar || [];
  const hasCalendar = calendar.length > 0;

  for (let slotIndex = season.round; slotIndex < season.total; slotIndex += 1) {
    const entry = hasCalendar ? calendar[slotIndex] : null;
    const context = entry?.type === 'cup'
      ? getCupMatchContext(gameData, slotIndex, entry)
      : getLeagueMatchContext(gameData, slotIndex, entry);
    if (!context) continue;

    const isUserHome = Boolean(context.displayHome?.isPlayer);
    const opponent = isUserHome ? context.displayAway : context.displayHome;
    const userSummary = getTeamTableSummary(gameData, { id: 'user', name: gameData.club?.name });
    const opponentSummary = getTeamTableSummary(gameData, opponent);

    return {
      ...context,
      isUserHome,
      opponent,
      userSummary,
      opponentSummary,
      skippedSlots: slotIndex - season.round,
    };
  }

  const idleSlots = getInactiveCupSkipCount(gameData);
  if (idleSlots > 0) {
    return {
      slotIndex: season.round,
      type: 'idle',
      competition: 'Calendário',
      competitionLabel: '⏭️ Datas sem partida',
      isUserHome: true,
      opponent: null,
      displayHome: { id:'user', name:gameData.club?.name || 'Meu Clube', isPlayer:true },
      displayAway: null,
      userSummary: getTeamTableSummary(gameData, { id:'user', name:gameData.club?.name }),
      opponentSummary: { position:0, points:0 },
      skippedSlots: idleSlots,
      matchInfo: resolveMatchInfo(gameData, season.round),
    };
  }

  return null;
}

export function getHomeCupSummary(gameData = {}) {
  const cup = gameData.cups?.copaBrasil;
  if (!cup) return 'Sem copas';
  if (cup.status === 'champion') return '🎉 Campeão!';
  if (cup.status === 'eliminated') return 'Eliminado';
  return cup.phaseLabel || cup.phase || 'Ativa';
}

export function getHomeLineupSummary(gameData = {}) {
  const validation = getLineupValidation(gameData);
  const starters = validation.starters;
  const nextMatch = resolveHomeNextMatch(gameData);
  const currentSlot = nextMatch?.slotIndex != null ? nextMatch.slotIndex + 1 : getUpcomingRound(gameData);
  const invalidStarters = starters.filter((player) => (
    Boolean(player.injury) || DisciplineEngine.isPlayerSuspended(player, currentSlot)
  ));

  return {
    startersCount: validation.uniqueStarterCount,
    validation,
    invalidStarters,
    needsAttention: !validation.isValid || invalidStarters.length > 0,
  };
}

export function buildHomeNavigationCards(gameData = {}, shared = null) {
  const navigation = shared || buildBottomNavViewModel(gameData);
  const club = gameData.club || {};
  const financial = FinanceEngine.getFinancialStatus(gameData);
  const lineup = getHomeLineupSummary(gameData);
  const academy = navigation.academy;
  const squad = navigation.squad;
  const clubSummary = navigation.club;
  const marketCount = (gameData.market || []).length;

  return [
    {
      id: 'table', emoji: '📊', label: 'Classificação', screen: 'table', color: '#16a34a',
      sub: clubSummary.position > 0 ? `${clubSummary.position}º lugar · ${clubSummary.points} pts` : 'Ver tabela',
    },
    {
      id: 'inbox', emoji: '📬', label: 'Mensagens', screen: 'inbox', color: '#0891b2',
      sub: navigation.unreadCount > 0 ? `${navigation.unreadCount} nova(s)` : 'Tudo lido',
      badge: navigation.unreadCount || null,
    },
    {
      id: 'lineup', emoji: '📋', label: 'Escalação', screen: 'lineup',
      color: lineup.needsAttention ? '#dc2626' : '#16a34a',
      sub: lineup.needsAttention
        ? (lineup.invalidStarters.length ? `${lineup.invalidStarters.length} inapto(s) na escalação` : `${lineup.startersCount}/11 titulares`)
        : 'Táticas e formação',
      badge: lineup.needsAttention ? '!' : null,
      pulse: lineup.needsAttention,
    },
    {
      id: 'medical', emoji: '🏥', label: 'DM', screen: 'medical',
      color: squad.unavailable > 0 ? '#dc2626' : '#4b7a5c',
      sub: squad.unavailable > 0 ? `${squad.injured} les. · ${squad.suspended} susp.` : 'Elenco 100%',
      badge: squad.unavailable || null,
    },
    {
      id: 'copas', emoji: '🏆', label: 'Copas', screen: 'copas', color: '#d97706',
      sub: getHomeCupSummary(gameData),
    },
    {
      id: 'academy', emoji: '⚽', label: 'Base', screen: 'academy', color: '#7c3aed',
      sub: academy.ready > 0 ? `${academy.ready} pronto(s) ⭐` : `${academy.total} em formação`,
      badge: academy.ready || null,
    },
    {
      id: 'matches', emoji: '📅', label: 'Calendário', screen: 'matches', color: '#0284c7',
      sub: `Rod. ${clubSummary.round}/${clubSummary.roundTotal}`,
    },
    {
      id: 'career', emoji: '🏅', label: 'Carreira', screen: 'career', color: '#d97706',
      sub: `${number(club.managerProfile?.wins)}V ${number(club.managerProfile?.draws)}E ${number(club.managerProfile?.losses)}D`,
    },
    {
      id: 'stadium', emoji: '🏟️', label: 'Estádio', screen: 'stadium', color: '#0891b2',
      sub: club.stadium?.underConstruction > 0
        ? `🏗️ Obras: ${club.stadium.underConstruction}rod`
        : `${number(club.stadium?.capacity).toLocaleString('pt-BR')} lug.`,
    },
    {
      id: 'market', emoji: '🛒', label: 'Mercado', screen: 'market', color: '#16a34a',
      sub: `${marketCount} disponíveis`,
    },
    {
      id: 'finances', emoji: '💰', label: 'Finanças', screen: 'finances',
      color: financial.status === 'critico' ? '#dc2626' : '#16a34a',
      sub: financial.label,
    },
    {
      id: 'about', emoji: 'ℹ️', label: 'Sobre', screen: 'about', color: '#4b7a5c',
      sub: `${APP_VERSION_LABEL} · ${APP_NAME}`,
    },
  ];
}

export function buildHomeViewModel(gameData = {}) {
  const navigation = buildBottomNavViewModel(gameData);
  const clubSummary = navigation.club;
  const season = getHomeSeasonSummary(gameData);
  const lineup = getHomeLineupSummary(gameData);
  const nextMatch = resolveHomeNextMatch(gameData);
  const row = gameData.table?.find((team) => team.id === 'user') || {};

  return {
    club: gameData.club || {},
    clubSummary,
    season,
    lineup,
    nextMatch,
    recentForm: getRecentLeagueForm(gameData),
    cards: buildHomeNavigationCards(gameData, navigation),
    headerStats: {
      money: number(gameData.club?.money),
      wage: number(gameData.club?.wage),
      goalsFor: number(row.gf),
      goalsAgainst: number(row.ga),
      points: number(row.pts),
    },
  };
}

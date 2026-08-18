import { getTeamStadiumData } from '../../data/teamStadiumData.js';
import {
  DEFAULT_STADIUM_CAPACITY_BY_SERIE,
  DEFAULT_TICKET_PRICE_BY_SERIE,
  TV_BASE_BY_SERIE,
  clamp,
  number,
} from './financeConfig.js';

export function getTVRights(serie = 'D', round = 1, totalRounds = 38) {
  const total = Math.max(1, number(totalRounds, 38));
  const current = clamp(number(round, 1), 1, total);
  const base = TV_BASE_BY_SERIE[serie] || TV_BASE_BY_SERIE.D;
  const midPoint = Math.max(1, total / 2);
  const proximity = clamp(1 - Math.abs(current - midPoint) / midPoint, 0, 1);
  return Math.round(base * (1 + proximity * 0.20));
}

export function resolveHomeStadium(homeTeam = {}, gameData = {}) {
  const serie = gameData?.serie || 'D';
  if (homeTeam?.id === 'user' || homeTeam?.isPlayer) {
    const stadium = gameData?.club?.stadium || {};
    return {
      name: stadium.name || `Arena ${gameData?.club?.name || 'do Clube'}`,
      capacity: Math.max(1, number(stadium.capacity, DEFAULT_STADIUM_CAPACITY_BY_SERIE[serie] || 6_000)),
      ticketPrice: Math.max(1, number(stadium.ticketPrice, DEFAULT_TICKET_PRICE_BY_SERIE[serie] || 12)),
      source: 'user',
    };
  }

  const branding = getTeamStadiumData(homeTeam?.name) || {};
  return {
    name: branding.stadium || `Estádio do ${homeTeam?.name || 'Mandante'}`,
    capacity: Math.max(1, number(homeTeam?.capacity ?? branding.capacity, DEFAULT_STADIUM_CAPACITY_BY_SERIE[serie] || 6_000)),
    ticketPrice: Math.max(1, number(homeTeam?.ticketPrice, DEFAULT_TICKET_PRICE_BY_SERIE[serie] || 12)),
    source: branding.capacity ? 'database' : 'fallback',
  };
}

function getUserTablePosition(gameData = {}) {
  const index = (gameData.table || []).findIndex((team) => team?.id === 'user');
  return index >= 0 ? index + 1 : 10;
}

export function calculateAttendance({ homeTeam = {}, awayTeam = {}, gameData = {}, rng = Math.random, includeWeather = true } = {}) {
  const stadium = resolveHomeStadium(homeTeam, gameData);
  const isUserHome = homeTeam?.id === 'user' || Boolean(homeTeam?.isPlayer);
  const isUserAway = awayTeam?.id === 'user' || Boolean(awayTeam?.isPlayer);
  if (!isUserHome && !isUserAway) {
    return { attendance: 0, occupationRate: 0, stadium, weather: 'unknown' };
  }

  let occupation = 0.40;
  if (isUserHome) {
    const fanLoyalty = number(gameData.club?.fanLoyalty, 50);
    occupation += ((fanLoyalty - 50) / 100) * 0.25;
    occupation += (number(gameData.morale, 60) / 100) * 0.25;
    occupation += Math.max(-0.12, (10 - getUserTablePosition(gameData)) / 60);

    const price = stadium.ticketPrice;
    if (price > 80) occupation -= 0.28;
    else if (price > 50) occupation -= 0.12;
    else if (price < 25) occupation += 0.12;

    const opponentStrength = number(awayTeam?.strength, 70);
    if (opponentStrength >= 82) occupation += 0.18;
    else if (opponentStrength >= 74) occupation += 0.08;
  } else {
    const homeFanBase = clamp(number(homeTeam?.fanBase, 0.55), 0, 1);
    const homeStrength = number(homeTeam?.strength, 70);
    const userStrength = number(gameData.club?.strength, 70);
    occupation = 0.38 + homeFanBase * 0.28;
    if (homeStrength >= 82) occupation += 0.08;
    if (userStrength >= 82) occupation += 0.10;
    else if (userStrength >= 74) occupation += 0.05;
  }

  const totalRounds = Math.max(1, number(gameData.fixtures?.length, 38));
  const leagueRound = Math.max(1, number(gameData.leagueRound ?? gameData.round, 1));
  if (leagueRound > totalRounds - 8) occupation += 0.10;

  let weather = 'dry';
  if (includeWeather && rng() < 0.20) {
    occupation -= 0.15;
    weather = 'rain';
  }

  occupation = clamp(occupation, 0.08, 1);
  return {
    attendance: Math.floor(stadium.capacity * occupation),
    occupationRate: occupation,
    stadium,
    weather,
  };
}

export function calculateMatchFinances(homeTeam, awayTeam, gameData = {}, options = {}) {
  const isUserHome = homeTeam?.id === 'user' || Boolean(homeTeam?.isPlayer);
  const isUserAway = awayTeam?.id === 'user' || Boolean(awayTeam?.isPlayer);
  const totalRounds = Math.max(1, number(gameData.fixtures?.length, 38));
  const round = number(gameData.leagueRound ?? gameData.round, 0) || 1;
  const tvRights = getTVRights(gameData.serie || 'D', round, totalRounds);

  if (!isUserHome && !isUserAway) {
    return {
      tvRights,
      ticketRevenue: 0,
      grossTicketRevenue: 0,
      awayShare: 0,
      attendance: 0,
      occupationPct: 0,
      stadiumCapacity: 0,
      stadiumName: null,
      userIsHome: false,
      userIsAway: false,
      homeTotalIncome: 0,
      awayTotalIncome: 0,
    };
  }

  const attendanceData = calculateAttendance({ homeTeam, awayTeam, gameData, ...options });
  const grossTicketRevenue = attendanceData.attendance * attendanceData.stadium.ticketPrice;
  const awayShare = Math.round(grossTicketRevenue * 0.10);
  const userTicketRevenue = isUserHome ? grossTicketRevenue - awayShare : awayShare;

  return {
    tvRights,
    ticketRevenue: userTicketRevenue,
    grossTicketRevenue,
    awayShare,
    attendance: attendanceData.attendance,
    occupationPct: Math.round(attendanceData.occupationRate * 100),
    stadiumCapacity: attendanceData.stadium.capacity,
    stadiumName: attendanceData.stadium.name,
    weather: attendanceData.weather,
    userIsHome: isUserHome,
    userIsAway: isUserAway,
    homeTotalIncome: isUserHome ? userTicketRevenue + tvRights : grossTicketRevenue - awayShare,
    awayTotalIncome: isUserAway ? userTicketRevenue + tvRights : awayShare,
  };
}

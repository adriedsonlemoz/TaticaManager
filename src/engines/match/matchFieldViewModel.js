import { FIELD_LAYOUTS, assignStartersToField, getFieldPlayerName } from '../field/fieldViewModel.js';
import { isSimulationPlayerAvailable } from './matchSimulationRoster.js';
import { getUserMatchSide } from './matchPresentationViewModel.js';

const mirrorX = (x) => 160 - x;
const toMatchCoordinate = (marker) => ({
  pos: marker.role,
  x: 5 + ((126 - marker.y) / 100) * 65,
  y: marker.x,
});

export const getMatchHorizontalLayout = (formation = '4-4-2') => (
  (FIELD_LAYOUTS[formation] || FIELD_LAYOUTS['4-4-2']).map(toMatchCoordinate)
);

export const findMatchTeam = (gameData = {}, name = '') => {
  const pools = [
    gameData?.teams,
    gameData?.leagues?.A,
    gameData?.leagues?.B,
    gameData?.leagues?.C,
    gameData?.leagues?.D,
  ];
  for (const pool of pools) {
    const found = (pool || []).find((team) => team?.name === name);
    if (found) return found;
  }
  return null;
};

export const getOpponentRoster = (gameData = {}, opponent = null) => {
  const source = gameData?.teamRosters?.[opponent?.id] || opponent?.squad || [];
  return Array.isArray(source) ? source.map((player) => ({ ...player })) : [];
};

export const selectDisplayStarters = (roster = [], round = 0) => {
  const available = roster.filter((player) => isSimulationPlayerAvailable(player, round));
  const marked = available.filter((player) => player.isStarting).slice(0, 11);
  if (marked.length >= 11) return marked;
  const used = new Set(marked.map((player) => player.id));
  return [
    ...marked,
    ...available
      .filter((player) => !used.has(player.id))
      .sort((a, b) => (b.overall || 0) - (a.overall || 0))
      .slice(0, 11 - marked.length),
  ];
};

const buildDots = ({ starters, formation, side, teamName }) => {
  const assigned = assignStartersToField(starters, formation);
  return assigned.map((marker, index) => {
    const base = toMatchCoordinate(marker);
    const x = side === 'right' ? mirrorX(base.x) : base.x;
    return {
      ...base,
      x,
      id: marker.player?.id ?? `${teamName}_${index}`,
      name: getFieldPlayerName(marker.player, 7),
      pos: marker.player?.adaptedPosition || marker.player?.position || marker.role,
      shirt: marker.player?.shirt ?? (index + 1),
      improvised: marker.improvised,
    };
  });
};

export function buildMatchFieldViewModel({
  gameData = {},
  matchResultData = {},
  liveUserPlayers = null,
  liveFormation = null,
  liveActiveLineups = null,
} = {}) {
  const homeName = matchResultData?.homeName || '';
  const awayName = matchResultData?.awayName || '';
  const userSide = getUserMatchSide(gameData, matchResultData);
  const isUserHome = userSide === 'home';
  if (userSide !== 'home' && userSide !== 'away') {
    return {
      userSide: null,
      identityValid: false,
      isUserHome: false,
      homeName,
      awayName,
      homeFormation: null,
      awayFormation: null,
      homeDots: [],
      awayDots: [],
    };
  }
  const userFormation = liveFormation || gameData?.club?.formation || gameData?.club?.managerProfile?.formation || '4-4-2';
  const round = matchResultData?.calendarRound ?? Math.max(1, Number(gameData?.round || 0));

  const snapshotHome = matchResultData?.rosters?.home;
  const snapshotAway = matchResultData?.rosters?.away;
  const liveHomeIds = Array.isArray(liveActiveLineups?.home) ? liveActiveLineups.home : null;
  const liveAwayIds = Array.isArray(liveActiveLineups?.away) ? liveActiveLineups.away : null;
  const activeHomeIds = new Set((liveHomeIds || matchResultData?.activeLineups?.home || []).map((id) => String(id)));
  const activeAwayIds = new Set((liveAwayIds || matchResultData?.activeLineups?.away || []).map((id) => String(id)));

  const opponentName = userSide === 'home' ? awayName : userSide === 'away' ? homeName : ''; 
  const opponent = findMatchTeam(gameData, opponentName);
  const opponentFormation = opponent?.formation || opponent?.managerProfile?.formation || '4-4-2';

  let userStarters;
  if (Array.isArray(liveUserPlayers)) {
    const ids = userSide === 'home' ? activeHomeIds : activeAwayIds;
    const hasLiveIds = userSide === 'home' ? liveHomeIds !== null : liveAwayIds !== null;
    userStarters = liveUserPlayers
      .filter((player) => player?.isStarting && (!hasLiveIds || ids.has(String(player?.id))))
      .slice(0, 11);
  } else {
    const snapshot = userSide === 'home' ? snapshotHome : userSide === 'away' ? snapshotAway : null;
    const ids = userSide === 'home' ? activeHomeIds : userSide === 'away' ? activeAwayIds : new Set();
    userStarters = Array.isArray(snapshot) && snapshot.length
      ? snapshot.filter((player) => ids.size ? ids.has(String(player.id)) : player.isStarting).slice(0, 11)
      : (gameData?.players || []).filter((player) => player.isStarting).slice(0, 11);
  }

  const oppSnapshot = userSide === 'home' ? snapshotAway : userSide === 'away' ? snapshotHome : null;
  const oppIds = userSide === 'home' ? activeAwayIds : userSide === 'away' ? activeHomeIds : new Set();
  const oppRoster = Array.isArray(oppSnapshot) && oppSnapshot.length
    ? oppSnapshot.map((player) => ({ ...player }))
    : getOpponentRoster(gameData, opponent);
  const hasLiveOpponentIds = userSide === 'home' ? liveAwayIds !== null : liveHomeIds !== null;
  const opponentStarters = hasLiveOpponentIds
    ? oppRoster.filter((player) => oppIds.has(String(player.id))).slice(0, 11)
    : oppIds.size
      ? oppRoster.filter((player) => oppIds.has(String(player.id))).slice(0, 11)
      : selectDisplayStarters(oppRoster, round);

  const homeFormation = userSide === 'home' ? userFormation : opponentFormation;
  const awayFormation = userSide === 'away' ? userFormation : opponentFormation;
  const homeStarters = userSide === 'home' ? userStarters : opponentStarters;
  const awayStarters = userSide === 'away' ? userStarters : opponentStarters;

  return {
    userSide,
    identityValid: true,
    isUserHome,
    homeName,
    awayName,
    homeFormation,
    awayFormation,
    homeDots: buildDots({ starters: homeStarters, formation: homeFormation, side: 'left', teamName: homeName }),
    awayDots: buildDots({ starters: awayStarters, formation: awayFormation, side: 'right', teamName: awayName }),
  };
}

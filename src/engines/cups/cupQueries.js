import {
  CONTINENTAL_CONFIG,
  LIBERTA_PRIZES,
  LIBERTA_SCHEDULE,
  SULAM_PRIZES,
  SULAM_SCHEDULE,
} from './cupConfig.js';

const activeTieMatch = (cup, cupKey, round, label, prizeMap, scheduleMap) => {
  if (!cup || cup.status !== 'active') return null;

  if (cup.phase === 'group') {
    for (const match of cup.groupMatches || []) {
      if (!match.leg1?.played && match.leg1?.round === round) {
        return {
          hasCupMatch: true,
          cupKey,
          cup,
          tie: match,
          leg: 'leg1',
          label,
          isGroup: true,
          matchId: match.id,
          prizeMap,
          scheduleMap,
        };
      }
      if (match.leg2 && match.leg1?.played && !match.leg2.played && match.leg2.round === round) {
        return {
          hasCupMatch: true,
          cupKey,
          cup,
          tie: match,
          leg: 'leg2',
          label,
          isGroup: true,
          matchId: match.id,
          prizeMap,
          scheduleMap,
        };
      }
    }
    return null;
  }

  const tie = cup.currentTie || cup.knockoutTie;
  if (!tie) return null;
  if (!tie.leg1?.played && tie.leg1?.round === round) {
    return {
      hasCupMatch: true,
      cupKey,
      cup,
      tie,
      leg: 'leg1',
      label,
      prizeMap,
      scheduleMap,
    };
  }
  if (tie.leg2 && tie.leg1?.played && !tie.leg2.played && tie.leg2.round === round) {
    return {
      hasCupMatch: true,
      cupKey,
      cup,
      tie,
      leg: 'leg2',
      label,
      prizeMap,
      scheduleMap,
    };
  }
  return null;
};

export const getCupMatchForRound = (cups, round) => {
  if (!cups) return { hasCupMatch: false };

  const copa = activeTieMatch(
    cups.copaBrasil,
    'copaBrasil',
    round,
    '🏆 Copa do Brasil',
    null,
    cups.copaBrasil?.schedule,
  );
  if (copa) return { ...copa, isCopa: true };

  const lib = activeTieMatch(
    cups.libertadores,
    'libertadores',
    round,
    CONTINENTAL_CONFIG.libertadores.label,
    LIBERTA_PRIZES,
    LIBERTA_SCHEDULE,
  );
  if (lib) return lib;

  const sul = activeTieMatch(
    cups.sulAmericana,
    'sulAmericana',
    round,
    CONTINENTAL_CONFIG.sulAmericana.label,
    SULAM_PRIZES,
    SULAM_SCHEDULE,
  );
  if (sul) return sul;

  return { hasCupMatch: false };
};

export const getUpcomingCupMatches = (cups, currentRound) => {
  if (!cups) return [];
  const matches = [];

  const addCup = (cup, cupKey, label, color) => {
    if (!cup || cup.status !== 'active') return;

    if (cup.phase === 'group') {
      (cup.groupMatches || []).forEach((match) => {
        if (!match.leg1?.played && match.leg1?.round >= currentRound) {
          matches.push({
            cupKey,
            label,
            color,
            phase: match.phase,
            legLabel: 'Jogo de Ida',
            leg: 'leg1',
            round: match.leg1.round,
            home: match.home,
            away: match.away,
            isCup: true,
            isGroup: true,
            matchId: match.id,
          });
        }
        if (match.leg2 && !match.leg2.played && match.leg2.round >= currentRound) {
          matches.push({
            cupKey,
            label,
            color,
            phase: match.phase,
            legLabel: 'Jogo de Volta',
            leg: 'leg2',
            round: match.leg2.round,
            home: match.leg2.homeTeam || match.away,
            away: match.leg2.awayTeam || match.home,
            isCup: true,
            isGroup: true,
            matchId: match.id,
          });
        }
      });
      return;
    }

    const tie = cup.currentTie || cup.knockoutTie;
    if (!tie) return;
    if (!tie.leg1?.played && tie.leg1?.round >= currentRound) {
      matches.push({
        cupKey,
        label,
        color,
        phase: tie.phase,
        legLabel: tie.leg2 ? 'Jogo de Ida' : 'Jogo Único',
        leg: 'leg1',
        round: tie.leg1.round,
        home: tie.home,
        away: tie.away,
        isCup: true,
      });
    }
    if (tie.leg2 && !tie.leg2.played && tie.leg2.round >= currentRound) {
      matches.push({
        cupKey,
        label,
        color,
        phase: tie.phase,
        legLabel: 'Jogo de Volta',
        leg: 'leg2',
        round: tie.leg2.round,
        home: tie.away,
        away: tie.home,
        isCup: true,
      });
    }
  };

  addCup(cups.copaBrasil, 'copaBrasil', '🏆 Copa do Brasil', '#00695c');
  addCup(cups.libertadores, 'libertadores', '🌟 Libertadores', '#1a237e');
  addCup(cups.sulAmericana, 'sulAmericana', '🌎 Sul-Americana', '#b71c1c');

  return matches.sort((a, b) => a.round - b.round);
};

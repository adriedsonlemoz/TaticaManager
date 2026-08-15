import { CalendarEngine } from '../CalendarEngine.js';
import { CupsEngine } from '../cups_engine.js';
import { DisciplineEngine } from '../engine_discipline.js';
import { FatigueEngine } from '../engine_fatigue.js';
import { FinanceEngine } from '../engine_finances.js';
import { simulateMatch } from './matchSimulator.js';

export function simulateCupRound({ gameData, calendarEntry, tactics, starters }) {
  const info = CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calendarEntry);
  if (!info.hasCupMatch) return { inactive: true };

  const tie = info.tie;
  const isLeg2 = calendarEntry.leg === 'leg2';
  const cupHome = isLeg2 ? tie.away : tie.home;
  const cupAway = isLeg2 ? tie.home : tie.away;
  const userIsHome = Boolean(cupHome?.isPlayer);
  const match = {
    home: { ...cupHome, id: cupHome?.isPlayer ? 'user' : cupHome?.id, isPlayer: userIsHome },
    away: { ...cupAway, id: cupAway?.isPlayer ? 'user' : cupAway?.id, isPlayer: !userIsHome },
    _isLeg2: isLeg2,
    _cpuAggrDiff: (() => {
      if (!isLeg2 || !tie.leg1?.played) return 0;
      const cpuIsHome = !userIsHome;
      const cpuLeg1 = cpuIsHome ? (tie.leg1.home ?? 0) : (tie.leg1.away ?? 0);
      const userLeg1 = cpuIsHome ? (tie.leg1.away ?? 0) : (tie.leg1.home ?? 0);
      return cpuLeg1 - userLeg1;
    })(),
  };

  const result = simulateMatch(gameData, match, tactics, starters, gameData.players || []);
  let ticketIncome = 0;
  let attendance = Math.floor(Math.random() * 15000) + 5000;
  if (FinanceEngine?.calculateMatchFinances) {
    const finances = FinanceEngine.calculateMatchFinances(match.home, match.away, gameData);
    attendance = finances.attendance;
    ticketIncome = finances.ticketRevenue;
  }
  attendance = Math.min(attendance, gameData.club?.stadium?.capacity || 15000);

  const userMatchData = {
    ...result,
    homeName: match.home?.name || cupHome?.name,
    awayName: match.away?.name || cupAway?.name,
    attendance,
    income: ticketIncome,
    isCupMatch: true,
    cupLabel: info.label,
    cupPhase: calendarEntry.phase,
    cupLeg: calendarEntry.leg,
  };

  const cupEvents = [];
  const cupKey = calendarEntry.cupKey;
  let cups = { ...(gameData.cups || {}) };
  if (cupKey === 'copaBrasil') {
    cups = {
      ...cups,
      copaBrasil: CupsEngine.registerCopaLegResult(
        cups.copaBrasil,
        calendarEntry.leg,
        result.homeGoals,
        result.awayGoals,
      ),
    };
    const after = cups.copaBrasil;
    if (after.currentTie?.penalties && isLeg2) {
      const penalties = after.currentTie.penalties;
      cupEvents.push({ cup: 'Copa do Brasil', msg: `Pênaltis: ${penalties.home} × ${penalties.away}`, color: '#00695c', earned: 0 });
    }
    if (after.status === 'champion') {
      cupEvents.push({ cup: 'Copa do Brasil', msg: '🏆 CAMPEÕES DA COPA DO BRASIL!', color: '#00695c', earned: CupsEngine.COPA_PRIZES?.['Campeão'] || 73400000 });
    } else if (after.status === 'eliminated') {
      cupEvents.push({ cup: 'Copa do Brasil', msg: 'Eliminados da Copa do Brasil.', color: '#b71c1c', earned: info.tie?.prize || 0 });
    } else if (calendarEntry.leg === 'leg1') {
      cupEvents.push({ cup: 'Copa do Brasil', msg: `${after.phaseLabel} — Jogo de Ida jogado.`, color: '#00695c', earned: 0 });
    }
  } else {
    cups = {
      ...cups,
      [cupKey]: info.isGroup
        ? CupsEngine.registerGroupLegResult(cups[cupKey], info.matchId, result.homeGoals, result.awayGoals, info.prizeMap, info.scheduleMap, isLeg2)
        : CupsEngine.registerKnockoutLegResult(cups[cupKey], calendarEntry.leg, result.homeGoals, result.awayGoals, info.prizeMap, info.scheduleMap),
    };
    const after = cups[cupKey];
    if (after?.status === 'champion') {
      cupEvents.push({ cup: info.label, msg: `🏆 CAMPEÕES DA ${info.label.toUpperCase()}!`, color: '#1a237e', earned: info.prizeMap?.['Campeão'] || 0 });
    } else if (after?.status === 'eliminated') {
      cupEvents.push({ cup: info.label, msg: `Eliminados da ${info.label}.`, color: '#b71c1c', earned: 0 });
    } else if (calendarEntry.leg === 'leg1') {
      cupEvents.push({ cup: info.label, msg: 'Jogo de Ida jogado.', color: '#1a237e', earned: 0 });
    }
  }

  let players = [...(gameData.players || [])];
  if (DisciplineEngine?.clearSuspensionAndResetCards) {
    players = DisciplineEngine.clearSuspensionAndResetCards(players, (gameData.round || 0) + 1);
  }
  if (DisciplineEngine?.processMatchDisciplineEvents) {
    players = DisciplineEngine.processMatchDisciplineEvents(
      players,
      userMatchData.events || [],
      (gameData.round || 0) + 1,
      (result.rawEvents || []).filter((event) => event.isPlayer),
    );
  }
  if (FatigueEngine?.applyMatchFatigue) {
    const myGoals = userIsHome ? result.homeGoals : result.awayGoals;
    const oppGoals = userIsHome ? result.awayGoals : result.homeGoals;
    players = FatigueEngine.applyMatchFatigue(players, myGoals, oppGoals);
  }

  const cupEarned = cupEvents.reduce((sum, event) => sum + (event.earned || 0), 0);
  const wage = players.reduce((sum, player) => sum + (player.wage || 0), 0);
  const operationalCost = (((gameData.round || 0) + 1) % 4 === 0 && FinanceEngine?.getOperationalCosts)
    ? FinanceEngine.getOperationalCosts(gameData)
    : 0;
  const income = ticketIncome + cupEarned;
  const expense = wage + operationalCost;

  return {
    inactive: false,
    userIsHome,
    userMatchData,
    allRawEvents: result.rawEvents || [],
    cups,
    cupEvents,
    players,
    finance: { ticketIncome, cupEarned, wage, operationalCost, income, expense },
  };
}

export function buildCupPostMatchState(gameData, cupRound) {
  const { userMatchData, userIsHome, finance } = cupRound;
  const myGoals = userIsHome ? (userMatchData.homeGoals || 0) : (userMatchData.awayGoals || 0);
  const oppGoals = userIsHome ? (userMatchData.awayGoals || 0) : (userMatchData.homeGoals || 0);
  const diff = myGoals - oppGoals;
  const loyaltyDelta = diff > 0 ? (diff >= 3 ? 2 : 1) : diff < 0 ? (diff <= -3 ? -2 : -1) : 0;

  return {
    ...gameData,
    round: (gameData.round || 0) + 1,
    cups: cupRound.cups,
    players: cupRound.players,
    club: {
      ...(gameData.club || {}),
      money: (gameData.club?.money || 0) + finance.income - finance.expense,
      wage: finance.wage,
      fanLoyalty: Math.max(5, Math.min(100, (gameData.club?.fanLoyalty ?? 50) + loyaltyDelta)),
    },
    inbox: (gameData.inbox || []).filter((message) => message?.id),
    financialHistory: [{
      round: (gameData.round || 0) + 1,
      income: finance.income,
      expense: finance.expense,
      total: finance.income - finance.expense,
      detail: {
        ticket: finance.ticketIncome,
        cup: finance.cupEarned,
        tv: 0,
        sponsor: 0,
        wage: finance.wage,
        opCost: finance.operationalCost,
      },
    }, ...(gameData.financialHistory || [])].slice(0, 100),
  };
}

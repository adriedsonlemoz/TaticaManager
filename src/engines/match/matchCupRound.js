import { CalendarEngine } from '../CalendarEngine.js';
import { CupsEngine } from '../cups_engine.js';
import { appendCupPrizeToEvents, getCupPrizeDelta } from '../cups/cupPrizeAccounting.js';
import { FinanceEngine } from '../engine_finances.js';
import { appendFinancialEntry } from '../finances/financeLedger.js';
import { syncUserRosterState } from '../core/gameStateIntegrity.js';
import { processMatchPlayers, preparePostMatchPlayers } from './matchPlayerPostProcessor.js';
import { buildManagerProfile, isUserMatchTeam, updateHeadToHead } from './matchStateUtils.js';
import { simulateMatch } from './matchSimulator.js';
import { stampPlayedCalendarDate } from '../calendar/calendarDateEngine.js';

export function simulateCupRound({ gameData, calendarEntry, tactics, starters, rng = Math.random }) {
  const info = CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calendarEntry);
  if (!info.hasCupMatch) return { inactive: true };

  const tie = info.tie;
  const isLeg2 = calendarEntry.leg === 'leg2';
  const cupHome = isLeg2 ? tie.away : tie.home;
  const cupAway = isLeg2 ? tie.home : tie.away;
  const clubName = gameData.club?.name || '';
  const detectedHome = isUserMatchTeam(cupHome, clubName);
  const detectedAway = isUserMatchTeam(cupAway, clubName);
  if (detectedHome === detectedAway) {
    return { inactive: false, identityError: true };
  }
  const userIsHome = detectedHome;
  const userIsAway = detectedAway;
  const match = {
    home: { ...cupHome, id: userIsHome ? 'user' : cupHome?.id, isPlayer: userIsHome },
    away: { ...cupAway, id: userIsAway ? 'user' : cupAway?.id, isPlayer: userIsAway },
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

  const userMatchData = {
    ...result,
    userIsHome,
    homeName: match.home?.name || cupHome?.name,
    awayName: match.away?.name || cupAway?.name,
    homeId: match.home?.id,
    awayId: match.away?.id,
    homeIsPlayer: Boolean(match.home?.isPlayer),
    awayIsPlayer: Boolean(match.away?.isPlayer),
    attendance,
    income: ticketIncome,
    isCupMatch: true,
    cupLabel: info.label,
    cupPhase: calendarEntry.phase,
    cupLeg: calendarEntry.leg,
    leagueRound: gameData.leagueRound ?? 0,
    calendarRound: (gameData.round || 0) + 1,
    preMatchTable: (gameData.table || []).map((row) => ({ ...row })),
  };

  let cupEvents = [];
  const cupKey = calendarEntry.cupKey;
  const storageKey = info.isRegional ? 'regional' : info.isState ? 'estadual' : cupKey;
  let cups = { ...(gameData.cups || {}) };
  const beforeCup = cups[storageKey];

  if (info.isState) {
    cups = {
      ...cups,
      estadual:CupsEngine.registerStateResult(
        cups.estadual,
        calendarEntry,
        result.homeGoals,
        result.awayGoals,
        rng,
      ),
    };
    const after = cups.estadual;
    const color = beforeCup?.color || '#1565c0';
    if (after?.status === 'champion') {
      cupEvents.push({ cup:info.label, msg:`🏆 CAMPEÕES DO ${String(info.label || 'ESTADUAL').replace(/^[^A-Za-zÀ-ÿ]+\s*/, '').toUpperCase()}!`, color, earned:0 });
    } else if (after?.status === 'eliminated') {
      cupEvents.push({ cup:info.label, msg:`Eliminados do ${info.label}.`, color:'#b71c1c', earned:0 });
    } else if (beforeCup?.phase === 'group' && after?.phase === 'knockout') {
      cupEvents.push({ cup:info.label, msg:`Classificados para ${after.phaseLabel}.`, color, earned:0 });
    } else if (calendarEntry.isGroup) {
      cupEvents.push({ cup:info.label, msg:'Jogo da fase de grupos concluído.', color, earned:0 });
    } else if (calendarEntry.leg === 'leg1' && after?.currentTie?.leg2) {
      cupEvents.push({ cup:info.label, msg:`${after.phaseLabel} — Jogo de Ida jogado.`, color, earned:0 });
    } else if (beforeCup?.phaseLabel !== after?.phaseLabel) {
      cupEvents.push({ cup:info.label, msg:`Classificados para ${after.phaseLabel}.`, color, earned:0 });
    }
  } else if (info.isRegional) {
    cups = {
      ...cups,
      regional:CupsEngine.registerRegionalResult(
        cups.regional,
        calendarEntry,
        result.homeGoals,
        result.awayGoals,
        rng,
      ),
    };
    const after = cups.regional;
    const color = beforeCup?.color || '#2e7d32';
    if (after?.status === 'champion') {
      cupEvents.push({ cup:info.label, msg:`🏆 CAMPEÕES DA ${String(info.label || 'COPA REGIONAL').replace(/^[^A-Za-zÀ-ÿ]+\s*/, '').toUpperCase()}!`, color, earned:0 });
    } else if (after?.status === 'eliminated') {
      cupEvents.push({ cup:info.label, msg:`Eliminados da ${info.label}.`, color:'#b71c1c', earned:0 });
    } else if (beforeCup?.phase === 'group' && after?.phase === 'knockout') {
      cupEvents.push({ cup:info.label, msg:`Classificados para ${after.phaseLabel}.`, color, earned:0 });
    } else if (calendarEntry.isGroup) {
      cupEvents.push({ cup:info.label, msg:'Jogo da fase de grupos concluído.', color, earned:0 });
    } else if (calendarEntry.leg === 'leg1' && after?.currentTie?.leg2) {
      cupEvents.push({ cup:info.label, msg:`${after.phaseLabel} — Jogo de Ida jogado.`, color, earned:0 });
    } else if (beforeCup?.phaseLabel !== after?.phaseLabel) {
      cupEvents.push({ cup:info.label, msg:`Classificados para ${after.phaseLabel}.`, color, earned:0 });
    }
  } else if (cupKey === 'copaBrasil') {
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
      cupEvents.push({ cup: 'Copa do Brasil', msg: '🏆 CAMPEÕES DA COPA DO BRASIL!', color: '#00695c', earned: 0 });
    } else if (after.status === 'eliminated') {
      cupEvents.push({ cup: 'Copa do Brasil', msg: 'Eliminados da Copa do Brasil.', color: '#b71c1c', earned: 0 });
    } else if (calendarEntry.leg === 'leg1') {
      cupEvents.push({ cup: 'Copa do Brasil', msg: `${after.phaseLabel} — Jogo de Ida jogado.`, color: '#00695c', earned: 0 });
    } else if (beforeCup?.phaseLabel !== after?.phaseLabel) {
      cupEvents.push({ cup: 'Copa do Brasil', msg: `Classificados para ${after.phaseLabel}.`, color: '#00695c', earned: 0 });
    }
  } else {
    cups = {
      ...cups,
      [cupKey]: info.isGroup
        ? CupsEngine.registerGroupLegResult(cups[cupKey], info.matchId, result.homeGoals, result.awayGoals, info.prizeMap, info.scheduleMap, isLeg2)
        : CupsEngine.registerKnockoutLegResult(cups[cupKey], calendarEntry.leg, result.homeGoals, result.awayGoals, info.prizeMap, info.scheduleMap),
    };
    const after = cups[cupKey];
    const color = cupKey === 'sulAmericana' ? '#b71c1c' : '#1a237e';
    if (after?.status === 'champion') {
      cupEvents.push({ cup: info.label, msg: `🏆 CAMPEÕES DA ${info.label.toUpperCase()}!`, color, earned: 0 });
    } else if (after?.status === 'eliminated') {
      cupEvents.push({ cup: info.label, msg: `Eliminados da ${info.label}.`, color: '#b71c1c', earned: 0 });
    } else if (beforeCup?.phase === 'group' && after?.phase === 'knockout') {
      cupEvents.push({ cup: info.label, msg: 'Classificados às Oitavas de Final!', color, earned: 0 });
    } else if (calendarEntry.leg === 'leg1') {
      cupEvents.push({ cup: info.label, msg: info.isGroup ? 'Jogo da fase de grupos concluído.' : 'Jogo de Ida jogado.', color, earned: 0 });
    } else if (beforeCup?.phaseLabel !== after?.phaseLabel) {
      cupEvents.push({ cup: info.label, msg: `Classificados para ${after.phaseLabel}.`, color, earned: 0 });
    }
  }

  const cupPrizeDelta = getCupPrizeDelta(beforeCup, cups[storageKey]);
  const prizeColor = (info.isRegional || info.isState) ? (beforeCup?.color || '#2e7d32') : cupKey === 'copaBrasil' ? '#00695c' : cupKey === 'sulAmericana' ? '#b71c1c' : '#1a237e';
  cupEvents = appendCupPrizeToEvents(cupEvents, {
    cup: cupKey === 'copaBrasil' ? 'Copa do Brasil' : info.label,
    color: prizeColor,
    earned: cupPrizeDelta,
  });

  const cupEarned = cupPrizeDelta;
  const wage = (Array.isArray(gameData.players) ? gameData.players : []).reduce((sum, player) => sum + (player?.wage || 0), 0);
  // Custos operacionais pertencem ao ciclo da Liga (a cada 4 rodadas) e não
  // devem ser cobrados novamente quando um slot de Copa cai no mesmo período.
  const operationalCost = 0;
  const income = ticketIncome + cupEarned;
  const expense = wage + operationalCost;

  return {
    inactive: false,
    userIsHome,
    userMatchData,
    allRawEvents: result.rawEvents || [],
    cups,
    cupEvents,
    finance: { ticketIncome, cupEarned, wage, operationalCost, income, expense },
  };
}

export function buildCupPostMatchState(gameData, cupRound, { liveSubstitutions = [], rng = Math.random } = {}) {
  const { userMatchData, userIsHome, finance } = cupRound;
  const processedPlayers = processMatchPlayers({
    gameData,
    userMatchData,
    allRawEvents: cupRound.allRawEvents || [],
    liveSubstitutions,
    rng,
  });
  const players = preparePostMatchPlayers(gameData, processedPlayers, {}, rng);
  const myGoals = userIsHome ? (userMatchData.homeGoals || 0) : (userMatchData.awayGoals || 0);
  const oppGoals = userIsHome ? (userMatchData.awayGoals || 0) : (userMatchData.homeGoals || 0);
  const diff = myGoals - oppGoals;
  const loyaltyDelta = diff > 0 ? (diff >= 3 ? 2 : 1) : diff < 0 ? (diff <= -3 ? -2 : -1) : 0;

  const datedGameData = stampPlayedCalendarDate(gameData, gameData.round);
  return syncUserRosterState({
    ...datedGameData,
    round: (gameData.round || 0) + 1,
    cups: cupRound.cups,
    h2hHistory: updateHeadToHead(gameData.h2hHistory, gameData.club?.name, userMatchData),
    club: {
      ...(gameData.club || {}),
      money: (gameData.club?.money || 0) + finance.income - finance.expense,
      wage: finance.wage,
      fanLoyalty: Math.max(5, Math.min(100, (gameData.club?.fanLoyalty ?? 50) + loyaltyDelta)),
      managerProfile: buildManagerProfile(gameData.club?.managerProfile, gameData.club?.name, userMatchData),
    },
    inbox: (gameData.inbox || []).filter((message) => message?.id),
    financialHistory: appendFinancialEntry(gameData.financialHistory, {
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
        isHome: Boolean(userIsHome),
      },
    }, {
      season: gameData.season,
      round: (gameData.round || 0) + 1,
      leagueRound: gameData.leagueRound ?? 0,
      competition: 'cup',
    }),
  }, players);
}

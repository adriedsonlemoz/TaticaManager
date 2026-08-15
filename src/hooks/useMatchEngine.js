// @migrated to ES module
import React from 'react';
import { DisciplineEngine } from '../engines/engine_discipline.js';
import { FatigueEngine } from '../engines/engine_fatigue.js';
import { FinanceEngine } from '../engines/engine_finances.js';
import { CupsEngine } from '../engines/cups_engine.js';
import { CalendarEngine } from '../engines/CalendarEngine.js';
import {
  generateNextSeason, sortLeagueTable, calcTeamRecentForm,
} from '../engines/engine.js';
import {
  getLineupValidation, calculateMorale,
} from '../helpers.js';

// hooks/useMatchEngine.js — v1.0
// Extraído de hooks_simulation.js.
// Contém os helpers privados de simulação de partida e o startMatchSimulation.
// hooks_simulation.js importa e compõe este hook com useRoundAdvance.

import useRoundAdvance from './useRoundAdvance.js';
import { accumulateScorers, accumulateMinutes, accumulateUserGoals } from '../engines/match/matchPlayerStats.js';
import { simulateMatch } from '../engines/match/matchSimulator.js';
import { startMatchPlayback } from '../engines/match/matchPlayback.js';
import {
  buildPostMatchNotifications,
  preparePostMatchPlayers,
  processCpuTransfers,
  processLeaguePlayers,
  progressAcademy,
  refreshTransferMarket,
} from '../engines/match/matchPostProcessor.js';
const useMatchSimulation = (gameData, setGameData, setScreen, showToast, setLineupDialog) => {
  const [simulating, setSimulating] = React.useState(false);
  const [visibleEvents, setVisibleEvents] = React.useState([]);
  const [liveScore, setLiveScore] = React.useState({ home: 0, away: 0 });
  const [matchResultData, setMatchResultData] = React.useState(null);
  const [roundSummary, setRoundSummary] = React.useState([]);
  const matchFeedRef = React.useRef(null);
  const intervalRef  = React.useRef(null);
  // matchControlsRef expõe pause/resume/forceEnd para ScreenMatchResult via props.
  // Substitui os antigos window._smrPauseMatch / window._smrResumeMatch / window._smrForceEnd
  // que poluíam o escopo global e dificultavam debug.
  const matchControlsRef = React.useRef({
    isPaused:           false,
    addEvent:           null,
    setLiveScore:       null,
    setVisibleEvents:   null,
    pauseMatch:         null,
    resumeMatch:        null,
    forceEnd:           null,
    resumeSecondHalf:   null,
    autoSimulate:       false,
  });

  // ── useRoundAdvance — avanço de rodada e fim de temporada ──
  const { handleGoToNextMatch } = useRoundAdvance(
    gameData, setGameData, setScreen, showToast, setLineupDialog,
    intervalRef, matchControlsRef, setSimulating
  );

  // 🌟 SIMULAÇÃO DE PARTIDA — startMatchSimulation 🌟
  const startMatchSimulation = React.useCallback(() => {
    if (!gameData || simulating || gameData.round >= (gameData.calendar?.length || gameData.fixtures.length)) return;

    // Transfere o sinal de auto-simular (sem animação) de window para matchControlsRef
    // ScreenNextMatch.handleAutoSimulate seta window._smrAutoSimulate = true
    // ScreenMatchResult lê matchControlsRef.current.autoSimulate
    if (window._smrAutoSimulate === true) {
      matchControlsRef.current.autoSimulate = true;
      window._smrAutoSimulate = false;
    }

    // ── INICIALIZA COPAS E CALENDÁRIO NA RODADA 0 ──────────
    // IMPORTANTE: retorna após inicializar — evita dois setGameData no mesmo callback
    // (React 17 não faz batch fora de event handlers, o segundo sobrescreveria o primeiro)
    if (gameData.round === 0 && !gameData.cups && CupsEngine?.autoInitCupsForSeason) {
      const isFirst = !gameData.seasonResult;
      const newCups = CupsEngine.autoInitCupsForSeason(gameData, isFirst);
      const newCal  = CalendarEngine
        ? CalendarEngine.buildCalendar(gameData.fixtures.length, newCups, gameData.serie || 'A')
        : null;
      setGameData(prev => ({ ...prev, cups: newCups, calendar: newCal, leagueRound: 0 }));
      return; // ← próximo clique já terá cups+calendar disponíveis
    }

    // ── RECONSTRÓI CALENDÁRIO SE AUSENTE (saves antigos) ──
    if (!gameData.calendar && gameData.cups && CalendarEngine) {
      const newCal = CalendarEngine.buildCalendar(
        gameData.fixtures.length, gameData.cups, gameData.serie || 'A'
      );
      setGameData(prev => ({ ...prev, calendar: newCal, leagueRound: prev.leagueRound ?? prev.round }));
      return; // ← próximo clique usa o calendário reconstruído
    }

    const starters = gameData.players.filter(p => p.isStarting);

    // 1ª VERIFICAÇÃO: Tem 11 jogadores?
    if (starters.length !== 11) {
      setLineupDialog({ open: true, n: starters.length });
      setScreen('lineup');
      return;
    }

    // 2ª VERIFICAÇÃO (JUIZ): Algum titular está expulso ou machucado?
    // Suspenso até round X significa: não pode jogar no round X.
    // Como gameData.round é o índice da próxima rodada, a verificação é correta com round+1.
    const illegalPlayer = starters.find(p => {
      const isSusp = DisciplineEngine
        ? DisciplineEngine.isPlayerSuspended(p, gameData.round + 1)
        : (p.discipline?.suspendedUntilRound !== null && (gameData.round + 1) <= p.discipline?.suspendedUntilRound);
      return isSusp || !!p.injury;
    });

    if (illegalPlayer) {
      const isInjured = !!illegalPlayer.injury;
      
      // Manda a notificação com o motivo do bloqueio
      showToast(`🚨 JUIZ BARROU: ${illegalPlayer.name} está ${isInjured ? 'lesionado 🚑' : 'suspenso 🟥'} e não pode jogar!`, 'error');
      
      // Remove o jogador irregular da escalação titular na marra
      setGameData(prev => ({
        ...prev, players: prev.players.map(p => p.id === illegalPlayer.id ? { ...p, isStarting: false } : p)
      }));
      
      // Joga o usuário direto pra prancheta pra ele arrumar o time
      setScreen('lineup');
      return;
    }

    // ── SETUP COMPARTILHADO ──────────────────────────────
    const tactics = getLineupValidation
      ? getLineupValidation(gameData)
      : { isValid: true, avgStrength: 70, counts: {}, req: {} };
    const oldPositions = {};
    gameData.table.forEach((t, i) => { oldPositions[t.id] = i + 1; });
    let updatedTable = [...gameData.table];
    let cupEvents = [];
    const fixtures = [...gameData.fixtures];
    // Declaradas aqui pois são usadas tanto no bloco de copa quanto no de liga
    let userMatchData = null;
    let allRawEvents  = [];

        // ── DESPACHA COM BASE NO CALENDÁRIO ─────────────────────
    const calendar = gameData.calendar || [];
    const calEntry = calendar[gameData.round];

    // Se o slot for de COPA mas a copa já foi eliminada/avançada, pula automaticamente.
    // Avança em loop para cobrir múltiplos slots inativos consecutivos (ex: eliminado em fase inicial
    // com Libertadores e Sul-Americana no mesmo trecho do calendário).
    if (calEntry?.type === 'cup') {
      const cupMatchInfo = CalendarEngine
        ? CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, calEntry)
        : { hasCupMatch: false };

      if (!cupMatchInfo.hasCupMatch) {
        // Conta quantos slots de copa inativos existem a partir daqui
        let skipCount = 1;
        const cal = gameData.calendar || [];
        while (
          (gameData.round + skipCount) < cal.length &&
          cal[gameData.round + skipCount]?.type === 'cup' &&
          CalendarEngine &&
          !CalendarEngine.getCupMatchForCalendarSlot(gameData.cups, cal[gameData.round + skipCount]).hasCupMatch
        ) { skipCount++; }
        setGameData(prev => ({ ...prev, round: prev.round + skipCount }));
        return;
      }

      // ── SIMULAÇÃO DE COPA (slot exclusivo, sem liga) ──────
      const tie     = cupMatchInfo.tie;
      const isLeg2  = calEntry.leg === 'leg2';
      const cupHome = isLeg2 ? tie.away : tie.home;
      const cupAway = isLeg2 ? tie.home : tie.away;
      const userIsHomeInCup = cupHome?.isPlayer;

      const cupMatchFake = {
        home: { ...cupHome, id: cupHome?.isPlayer ? 'user' : cupHome?.id, isPlayer: userIsHomeInCup },
        away: { ...cupAway, id: cupAway?.isPlayer ? 'user' : cupAway?.id, isPlayer: !userIsHomeInCup },
        _isLeg2: isLeg2,
        _cpuAggrDiff: (() => {
          if (!isLeg2 || !tie.leg1?.played) return 0;
          const cpuIsHome = !userIsHomeInCup;
          const cpuLeg1 = cpuIsHome ? (tie.leg1.home ?? 0) : (tie.leg1.away ?? 0);
          const usrLeg1 = cpuIsHome ? (tie.leg1.away ?? 0) : (tie.leg1.home ?? 0);
          return cpuLeg1 - usrLeg1;
        })(),
      };

      const result = simulateMatch(gameData, cupMatchFake, tactics, starters, gameData.players);
      let ticketIncome = 0;
      let attendance = Math.floor(Math.random() * 15000) + 5000;
      if (FinanceEngine?.calculateMatchFinances) {
        const fin = FinanceEngine.calculateMatchFinances(cupMatchFake.home, cupMatchFake.away, gameData);
        attendance = fin.attendance; ticketIncome = fin.ticketRevenue;
      }
      const _stadCap = gameData.club?.stadium?.capacity || 15000;
      attendance = Math.min(attendance, _stadCap);

      userMatchData = {
        ...result,
        homeName: cupMatchFake.home.name || cupHome?.name,
        awayName: cupMatchFake.away.name || cupAway?.name,
        attendance, income: ticketIncome,
        isCupMatch: true,
        cupLabel: cupMatchInfo.label,
        cupPhase: calEntry.phase,
        cupLeg: calEntry.leg,
      };
      allRawEvents = result.rawEvents || [];

      // LIGA: NÃO simulada nesta rodada (é um slot EXCLUSIVO de copa).
      // A tabela NÃO é atualizada — os times da liga descansam neste slot.
      // updatedTable permanece inalterada.

      // Processa resultado da copa
      let newCups = { ...(gameData.cups || {}) };
      const cupKey = calEntry.cupKey;
      const cupHomeGoals = result.homeGoals;
      const cupAwayGoals = result.awayGoals;

      if (cupKey === 'copaBrasil') {
        newCups = { ...newCups, copaBrasil: CupsEngine.registerCopaLegResult(newCups.copaBrasil, calEntry.leg, cupHomeGoals, cupAwayGoals) };
        const after = newCups.copaBrasil;
        if (after.currentTie?.penalties && calEntry.leg === 'leg2') {
          const p = after.currentTie.penalties;
          cupEvents.push({ cup: 'Copa do Brasil', msg: `Pênaltis: ${p.home} × ${p.away}`, color: '#00695c', earned: 0 });
        }
        if (after.status === 'champion') cupEvents.push({ cup: 'Copa do Brasil', msg: '🏆 CAMPEÕES DA COPA DO BRASIL!', color: '#00695c', earned: CupsEngine.COPA_PRIZES?.['Campeão'] || 73400000 });
        else if (after.status === 'eliminated') cupEvents.push({ cup: 'Copa do Brasil', msg: 'Eliminados da Copa do Brasil.', color: '#b71c1c', earned: cupMatchInfo.tie?.prize || 0 });
        else if (calEntry.leg === 'leg1') cupEvents.push({ cup: 'Copa do Brasil', msg: `${after.phaseLabel} — Jogo de Ida jogado.`, color: '#00695c', earned: 0 });
      } else {
        const _isLeg2group = calEntry.leg === 'leg2';
        if (cupMatchInfo.isGroup) {
          newCups = { ...newCups, [cupKey]: CupsEngine.registerGroupLegResult(newCups[cupKey], cupMatchInfo.matchId, cupHomeGoals, cupAwayGoals, cupMatchInfo.prizeMap, cupMatchInfo.scheduleMap, _isLeg2group) };
        } else {
          newCups = { ...newCups, [cupKey]: CupsEngine.registerKnockoutLegResult(newCups[cupKey], calEntry.leg, cupHomeGoals, cupAwayGoals, cupMatchInfo.prizeMap, cupMatchInfo.scheduleMap) };
        }
        const lb = cupMatchInfo.label;
        const aft = newCups[cupKey];
        if (aft?.status === 'champion') cupEvents.push({ cup: lb, msg: `🏆 CAMPEÕES DA ${lb.toUpperCase()}!`, color: '#1a237e', earned: cupMatchInfo.prizeMap?.['Campeão'] || 0 });
        else if (aft?.status === 'eliminated') cupEvents.push({ cup: lb, msg: `Eliminados da ${lb}.`, color: '#b71c1c', earned: 0 });
        else if (calEntry.leg === 'leg1') cupEvents.push({ cup: lb, msg: `Jogo de Ida jogado.`, color: '#1a237e', earned: 0 });
      }

      allRawEvents = result.rawEvents || [];
      // Passa direto para o bloco de setGameData (mais abaixo)
      // sem simular jogo de liga — deixa updatedTable como está

      const updatedFixtures2 = [...fixtures];
      // NÃO atualiza fixtures — é rodada de copa

      setScreen('match_result');
      startMatchPlayback({
        matchData: userMatchData,
        intervalRef,
        matchControlsRef,
        setSimulating,
        setVisibleEvents,
        setLiveScore,
      });

      // Processa disciplina, cansaço, e finaliza setGameData para copa
      let updatedPlayers2 = [...gameData.players];
      // Limpa suspensões expiradas ANTES de processar os cartões do jogo de copa
      if (DisciplineEngine?.clearSuspensionAndResetCards)
        updatedPlayers2 = DisciplineEngine.clearSuspensionAndResetCards(updatedPlayers2, gameData.round + 1);
      if (DisciplineEngine?.processMatchDisciplineEvents)
        updatedPlayers2 = DisciplineEngine.processMatchDisciplineEvents(updatedPlayers2, userMatchData.events || [], gameData.round + 1, allRawEvents.filter(e => e.isPlayer));
      if (FatigueEngine?.applyMatchFatigue)
        updatedPlayers2 = FatigueEngine.applyMatchFatigue(updatedPlayers2, userMatchData.isUserHome ? userMatchData.homeGoals : userMatchData.awayGoals, userMatchData.isUserHome ? userMatchData.awayGoals : userMatchData.homeGoals);

      const cupEarned = cupEvents.reduce((s, e) => s + (e.earned || 0), 0);
      const folhaCopa  = updatedPlayers2.reduce((s, p) => s + (p.wage || 0), 0);
      const opCostCopa = ((gameData.round + 1) % 4 === 0 && FinanceEngine?.getOperationalCosts)
        ? FinanceEngine.getOperationalCosts(gameData) : 0;
      const totalIncome2  = ticketIncome + cupEarned;
      const totalExpense2 = folhaCopa + opCostCopa;

      setRoundSummary([]); // não tem rodada de liga
      setMatchResultData({ ...userMatchData, cupEvents });

      setGameData(prev => ({
        ...prev,
        round:       prev.round + 1,
        // leagueRound NÃO incrementa — foi rodada de copa
        cups:        newCups,
        players:     updatedPlayers2,
        club: {
          ...prev.club,
          money: (prev.club.money || 0) + totalIncome2 - totalExpense2,
          wage:  folhaCopa,
          fanLoyalty: (() => {
            const cur = prev.club.fanLoyalty ?? 50;
            const myG = userIsHomeInCup ? result.homeGoals : result.awayGoals;
            const oG  = userIsHomeInCup ? result.awayGoals : result.homeGoals;
            const diff = myG - oG;
            const delta = diff > 0 ? (diff >= 3 ? 2 : 1) : diff < 0 ? (diff <= -3 ? -2 : -1) : 0;
            return Math.max(5, Math.min(100, cur + delta));
          })(),
        },
        financialHistory: [{
          round: prev.round + 1,
          income: totalIncome2,
          expense: totalExpense2,
          total: totalIncome2 - totalExpense2,
          detail: { ticket: ticketIncome, cup: cupEarned, tv: 0, sponsor: 0, wage: folhaCopa, opCost: opCostCopa },
        }, ...(prev.financialHistory || [])].slice(0, 100),
        inbox: [
          ...(prev.inbox || []).filter(m => m.id),
        ],
      }));
      return; // ← RETORNA AQUI — a copa foi processada completamente

    } // fim calEntry.type === 'cup'

    // ── RODADA DE LIGA ────────────────────────────────────────────────────────
    // A partir daqui: calEntry.type === 'league' (ou calendário ausente = fallback)
    const leagueIdx2 = calEntry?.leagueIdx ?? gameData.round;
    const currentMatches = gameData.fixtures[leagueIdx2];
    const thisRound = (gameData.leagueRound ?? gameData.round) + 1; // para disciplina/display

    if (!currentMatches || currentMatches.length === 0) {
      // Rodada sem jogos (não deveria acontecer, mas guarda contra crashes)
      setGameData(prev => ({ ...prev, round: prev.round + 1, leagueRound: (prev.leagueRound ?? 0) + 1 }));
      return;
    }

    let ticketIncome = 0;

    // ── SIMULAÇÃO DE LIGA (slot exclusivo — sem copa nesta rodada) ────────────
    currentMatches.forEach(match => {
      const result = simulateMatch(gameData, match, tactics, starters, gameData.players);
      match.played = true; match.result = `${result.homeGoals} - ${result.awayGoals}`; match.events = result.events;
      allRawEvents = allRawEvents.concat(result.rawEvents || []);

      if (match.home.isPlayer || match.away.isPlayer) {
        let attendance = 0;
        if (FinanceEngine?.calculateMatchFinances) {
          const fin = FinanceEngine.calculateMatchFinances(match.home, match.away, gameData);
          attendance = fin.attendance; ticketIncome = fin.ticketRevenue;
        }
        attendance = Math.min(attendance, gameData.club?.stadium?.capacity || 50000);
        userMatchData = { ...result, homeName: match.home.name, awayName: match.away.name, attendance, income: ticketIncome };
      }

      const hRow = updatedTable.find(t => t.id === match.home.id);
      const aRow = updatedTable.find(t => t.id === match.away.id);
      if (!hRow || !aRow) return;
      if (result.homeGoals > result.awayGoals)      { hRow.w++; hRow.pts += 3; aRow.l++; }
      else if (result.awayGoals > result.homeGoals)  { aRow.w++; aRow.pts += 3; hRow.l++; }
      else { hRow.d++; hRow.pts++; aRow.d++; aRow.pts++; }
      hRow.p++; hRow.gf += result.homeGoals; hRow.ga += result.awayGoals;
      aRow.p++; aRow.gf += result.awayGoals; aRow.ga += result.homeGoals;
    });

    const sorter = sortLeagueTable || (t => t);
    const updatedFixtures = [...fixtures];
    updatedFixtures[leagueIdx2] = currentMatches;
    updatedTable = sorter(updatedTable).map((t, i) => ({
      ...t,
      posVariation: (oldPositions[t.id] || i + 1) - (i + 1),
      recentForm: calcTeamRecentForm
        ? calcTeamRecentForm(t.id, updatedFixtures, thisRound)
        : (t.recentForm || []),
    }));

    // Pós-jogo de jogadores: gols, minutos, moral, disciplina, fadiga e lesões.
    let updatedPlayers = processLeaguePlayers({
      gameData,
      userMatchData,
      allRawEvents,
    });

    // #47 TV dinâmica — varia com a rodada (clássicos valem mais)
    const tvIncome = FinanceEngine?.getTVRights
      ? FinanceEngine.getTVRights(gameData.serie, gameData.round + 1, gameData.fixtures?.length || 38)
      : ({ A:400000, B:60000, C:12000, D:6000 }[gameData.serie] || 6000);
    const sponsorIncome = (gameData.club.sponsors?.master?.roundValue || 0) + (gameData.club.sponsors?.stadium?.roundValue || 0);

    // Novo sistema de copas: registra resultado SE esta rodada tem jogo de copa
    // nextRound = gameData.round + 1 porque gameData.round é 0-indexed e cup rounds são 1-indexed
    let newCups = gameData.cups;
    let cupEarned = 0;
    // cupEvents already declared in shared scope above

    // #49 Custos operacionais a cada 4 rodadas (manutenção estádio, staff, etc.)
    const opCost = ((gameData.round + 1) % 4 === 0 && FinanceEngine?.getOperationalCosts)
      ? FinanceEngine.getOperationalCosts(gameData)
      : 0;

    const totalIncome = ticketIncome + tvIncome + sponsorIncome + cupEarned;
    const folhaSalarial = updatedPlayers.reduce((s, p) => s + (p.wage || 0), 0);
    const totalExpense = folhaSalarial + opCost;

    setRoundSummary(currentMatches); setMatchResultData({ ...userMatchData, cupEvents });

    // Pós-jogo fora do React: CPU, academia e notificações ficam no processador dedicado.
    const _cpuTrades = processCpuTransfers(gameData);
    const _updatedAcademy = progressAcademy(gameData);
    const {
      contractWarnings: _contractWarnings,
      jornal: _jornal,
      rumores: _rumores,
      objetivoDiretoria: _objetivoDiretoria,
      pressaoTorcida: _pressaoTorcida,
      lesaoTreino: _lesaoTreino,
      academyNotifs: _academyNotifs,
      matchInjuryMsgs: _matchInjuryMsgs,
      suspensionMsgs: _suspensionMsgs,
    } = buildPostMatchNotifications({
      gameData,
      userMatchData,
      updatedTable,
      updatedPlayers,
      allRawEvents,
    });

    setGameData(prev => ({
      ...prev,
      round:       prev.round + 1,
      leagueRound: (prev.leagueRound ?? 0) + 1, // só incrementa em rodadas de LIGA
      morale: (() => {
        const raw = calculateMorale ? calculateMorale({ ...prev, round: prev.round + 1 }) : (prev.morale ?? 60);
        const prev_morale = prev.morale ?? 60;
        let blended = Math.round(raw * 0.60 + prev_morale * 0.40);
        if (_pressaoTorcida.length > 0) blended = Math.max(10, blended - 5);
        return blended;
      })(),
      // #17 H2H: registrar resultado contra o adversário
      h2hHistory: (() => {
        const hist = { ...(prev.h2hHistory || {}) };
        if (userMatchData) {
          const isH   = userMatchData.homeName === (prev.club?.name);
          const myG   = isH ? (userMatchData.homeGoals||0) : (userMatchData.awayGoals||0);
          const oppG  = isH ? (userMatchData.awayGoals||0) : (userMatchData.homeGoals||0);
          const oppName = isH ? userMatchData.awayName : userMatchData.homeName;
          if (oppName) {
            const prev_h2h = hist[oppName] || { w:0, d:0, l:0 };
            if (myG > oppG)      hist[oppName] = { ...prev_h2h, w: prev_h2h.w + 1 };
            else if (myG === oppG) hist[oppName] = { ...prev_h2h, d: prev_h2h.d + 1 };
            else                   hist[oppName] = { ...prev_h2h, l: prev_h2h.l + 1 };
          }
        }
        return hist;
      })(),
      table: updatedTable,
      // FEATURE 2: atualiza leagues e teamRosters com atividade da CPU (reposição + trocas)
      leagues:     _cpuTrades ? _cpuTrades.leagues     : prev.leagues,
      teamRosters: _cpuTrades ? _cpuTrades.teamRosters : prev.teamRosters,
      // Academia: progressão gradual a cada 8 rodadas
      academy: _updatedAcademy !== undefined ? _updatedAcademy : prev.academy,
      // #19 Lesão em treino: aplica lesão leve se sorteado
      // Auto-remove da escalação qualquer jogador lesionado OU suspenso após o jogo
      players: preparePostMatchPlayers(prev, updatedPlayers, _lesaoTreino),
      // Inbox consolidado: jornal + rumores + objetivo + pressão + treino + contrato + academia + lesões + suspensões
      inbox: [
        ..._jornal,
        ..._rumores,
        ..._objetivoDiretoria,
        ..._pressaoTorcida,
        ...(_lesaoTreino.msg ? [_lesaoTreino.msg] : []),
        ..._contractWarnings,
        ..._academyNotifs,
        ..._matchInjuryMsgs,
        ..._suspensionMsgs,
        ...(prev.inbox || []),
      ].slice(0, 80),
      club: (() => {
        const base = prev.club || {};
        const mp   = base.managerProfile || {};
        const uM   = userMatchData;
        const isH  = uM && uM.homeName === base.name;
        const myG  = uM ? (isH ? (uM.homeGoals||0) : (uM.awayGoals||0)) : 0;
        const oG   = uM ? (isH ? (uM.awayGoals||0) : (uM.homeGoals||0)) : 0;
        return {
          ...base,
          money: base.money + totalIncome - totalExpense,
          wage:  folhaSalarial,  // folha por rodada (sem custos operacionais)
          strength: Math.round(updatedPlayers.filter(p=>p.isStarting).reduce((s,p)=>s+p.overall,0)/11) || base.strength,
          managerProfile: { ...mp, wins:(mp.wins||0)+(myG>oG?1:0), draws:(mp.draws||0)+(myG===oG?1:0), losses:(mp.losses||0)+(myG<oG?1:0), experience:(mp.experience||0)+1 },
          // Processar obras de estádio: decrementa contador, aplica quando chega a zero
          stadium: (() => {
            const st = base.stadium || {};
            if (!st.underConstruction) return st;
            const left = st.underConstruction - 1;
            if (left <= 0) {
              // Obras concluídas!
              setTimeout(() => showToast('🏟️ Obras concluídas! +5.000 lugares no estádio.', 'success'), 200);
              return {
                ...st,
                capacity: (st.capacity || 15000) + (st.pendingCapacity || 5000),
                level:    st.pendingLevel || (st.level || 1) + 1,
                underConstruction: null,
                pendingCapacity:   null,
                pendingLevel:      null,
              };
            }
            return { ...st, underConstruction: left };
          })(),
        };
      })(),
      market: refreshTransferMarket(prev),
      financialHistory: [{ round: prev.round + 1, income: totalIncome, expense: totalExpense, total: totalIncome - totalExpense, detail: { ticket: ticketIncome, tv: tvIncome, sponsor: sponsorIncome, cup: cupEarned, wage: folhaSalarial, opCost } }, ...(prev.financialHistory || [])].slice(0, 100),
      cups: newCups,
      scorers: (() => {
        const newScorers = accumulateScorers(prev.scorers || {}, allRawEvents);
        // Mapeia os gols acumulados de volta para player.seasonGoals
        // (permite que PlayerModal aba Temporada exiba os gols)
        const goalMap = {};
        Object.values(newScorers).forEach(entry => {
          if (entry.id) goalMap[entry.id] = entry.goals || 0;
        });
        // Atualiza updatedPlayers com seasonGoals — mas updatedPlayers já foi processado acima
        // Fazemos via side-effect: atualizamos inline no array que será salvo
        for (let i = 0; i < updatedPlayers.length; i++) {
          const pid = updatedPlayers[i].id;
          if (goalMap[pid] !== undefined) {
            updatedPlayers[i] = { ...updatedPlayers[i], seasonGoals: goalMap[pid] };
          }
        }
        return newScorers;
      })(),
    }));

    setScreen('match_result');
    startMatchPlayback({
      matchData: userMatchData,
      intervalRef,
      matchControlsRef,
      setSimulating,
      setVisibleEvents,
      setLiveScore,
    });

  }, [gameData, simulating, setGameData, setScreen, showToast, setLineupDialog]);

  return { simulating, visibleEvents, liveScore, matchResultData, roundSummary, matchFeedRef, matchControlsRef, handleGoToNextMatch, startMatchSimulation };
};

export { useMatchSimulation };
export default useMatchSimulation;

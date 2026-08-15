// @migrated to ES module
// cups_engine.js — v2.0 Copa integrada ao calendário — Ida e Volta separados
// FILOSOFIA: cada confronto tem IDA e VOLTA separados no calendário
// O usuário JOGA cada partida normalmente, como num campeonato
// Após a VOLTA o placar agregado decide o classificado
import { diexDatabase } from '../data/database.js';
// Empate no agregado → pênaltis (sem gol fora desde 2023)

const _shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Detecta rodadas com jogo de liga do usuário ───────────────────────────────
// Retorna um Set com todas as rodadas onde o usuário já tem partida de liga.
const _getLeagueRoundsInUse = (gameData) => {
  const used = new Set();
  if (!gameData?.fixtures) return used;
  gameData.fixtures.forEach((round, i) => {
    if ((round || []).some(m => m.home?.isPlayer || m.away?.isPlayer)) {
      used.add(i + 1); // fixtures são 0-indexed, rodadas são 1-indexed
    }
  });
  return used;
};

// ── Encontra a próxima rodada livre (sem conflito de liga) ────────────────────
// A partir de preferredRound busca ±delta até encontrar slot livre.
// Prefere deslocar para frente para manter cronologia.
// Nunca retorna slot com conflito — busca até o fim do calendário.
const _findFreeRound = (preferredRound, leagueRoundsInUse, usedCupRounds, totalRounds, maxSearch = 8) => {
  const total = totalRounds || 38;
  for (let delta = 0; delta <= maxSearch; delta++) {
    for (const sign of [1, -1]) {
      if (delta === 0 && sign === -1) continue;
      const r = preferredRound + delta * sign;
      if (r < 1 || r > total) continue;
      if (!leagueRoundsInUse.has(r) && !usedCupRounds.has(r)) return r;
    }
  }
  // Fallback estendido: varre para frente até achar slot livre
  for (let r = preferredRound + 1; r <= total; r++) {
    if (!leagueRoundsInUse.has(r) && !usedCupRounds.has(r)) return r;
  }
  // Último recurso: varre para trás
  for (let r = preferredRound - 1; r >= 1; r--) {
    if (!leagueRoundsInUse.has(r) && !usedCupRounds.has(r)) return r;
  }
  return preferredRound; // impossível com calendário de 38 rodadas
};

const _simGoals = (strA, strB) => {
  const total = strA + strB || 1;
  const probA = (strA / total) * 0.034 * 1.05;
  const probB = (strB / total) * 0.034;
  let gA = 0, gB = 0;
  for (let m = 1; m <= 90; m++) {
    if (Math.random() < probA) gA++;
    if (Math.random() < probB) gB++;
  }
  return [gA, gB];
};

const _simPenalties = (homeStrength, awayStrength) => {
  // Taxa de conversão base: 75% (historicamente ~77% no futebol profissional)
  // Times mais fortes têm leve vantagem: ±5% por 10 de diferença de OVR
  const diff = ((homeStrength || 75) - (awayStrength || 75)) / 10;
  const homeConv = Math.min(0.90, Math.max(0.60, 0.75 + diff * 0.05));
  const awayConv = Math.min(0.90, Math.max(0.60, 0.75 - diff * 0.05));

  let pA = 0, pB = 0;
  for (let i = 0; i < 5; i++) {
    if (Math.random() < homeConv) pA++;
    if (Math.random() < awayConv) pB++;
  }
  // Morte-súbita se empatado após 5 cobranças
  let kicks = 0;
  while (pA === pB && kicks < 20) {
    if (Math.random() < homeConv) pA++;
    if (Math.random() < awayConv) pB++;
    kicks++;
  }
  // Garantir diferença
  if (pA === pB) pA++;
  return [pA, pB];
};

// ── Decide confronto depois de ida+volta ─────────────────────────────────────
// tie.leg1 = { home, away }  (gols jogo de ida  — 'home' jogou em casa)
// tie.leg2 = { home, away }  (gols jogo de volta — 'away' original jogou em casa)
// No jogo de volta: o time 'away' original joga EM CASA, portanto:
//   agregado do time 'home' original = leg1.home + leg2.away
//   agregado do time 'away' original = leg1.away + leg2.home
const _decideTie = (tie) => {
  if (!tie.leg1?.played || !tie.leg2?.played) return tie;
  const homeAggr = tie.leg1.home + tie.leg2.away;
  const awayAggr = tie.leg1.away + tie.leg2.home;
  let winner, penalties = null;
  if (homeAggr > awayAggr) {
    winner = tie.home;
  } else if (awayAggr > homeAggr) {
    winner = tie.away;
  } else {
    const [pH, pA] = _simPenalties(tie.home?.strength, tie.away?.strength);
    penalties = { home: pH, away: pA };
    winner = pH > pA ? tie.home : tie.away;
  }
  return { ...tie, decided: true, winner, penalties, homeAggr, awayAggr };
};

const _makeTie = (home, away, phase, prize, leg1Round, leg2Round) => ({
  id: Math.random().toString(36).substring(2, 10),
  phase, home, away, prize,
  leg1: { played: false, home: null, away: null, round: leg1Round },
  leg2: { played: false, home: null, away: null, round: leg2Round },
  decided: false, winner: null, penalties: null,
  homeAggr: null, awayAggr: null,
});

// ── PRÊMIOS POR FASE ─────────────────────────────────────────────────────────
const COPA_PRIZES = {
  '2ª Fase':   418000,
  '3ª Fase':   730000,
  'Oitavas':   1300000,
  'Quartas':   2100000,
  'Semifinal': 3700000,
  'Final':     7400000,
  'Campeão':   73400000,
};

const COPA_PHASES_A = ['3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
const COPA_PHASES_B = ['2ª Fase', '3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
const COPA_PHASES_C = ['1ª Fase', '2ª Fase', '3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
const COPA_PHASES_D = ['1ª Fase', '2ª Fase', '3ª Fase', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];

// Rodadas do campeonato onde cada jogo de copa ocorre [ida, volta]
const COPA_SCHEDULE_A = {
  '3ª Fase':   [4,  7],
  'Oitavas':   [11, 14],
  'Quartas':   [18, 21],
  'Semifinal': [25, 28],
  'Final':     [33, 36],
};

const COPA_SCHEDULE_B = {
  '2ª Fase':   [2,  4],
  '3ª Fase':   [8,  10],
  'Oitavas':   [14, 16],
  'Quartas':   [20, 22],
  'Semifinal': [27, 29],
  'Final':     [33, 36],
};

// Séries C e D entram na Copa do Brasil desde a 1ª Fase
const COPA_SCHEDULE_C = {
  '1ª Fase':   [2,  3],
  '2ª Fase':   [7,  9],
  '3ª Fase':   [13, 15],
  'Oitavas':   [19, 21],
  'Quartas':   [25, 27],
  'Semifinal': [31, 33],
  'Final':     [36, 38],
};

const COPA_SCHEDULE_D = {
  '1ª Fase':   [1,  2],
  '2ª Fase':   [6,  8],
  '3ª Fase':   [12, 14],
  'Oitavas':   [18, 20],
  'Quartas':   [24, 26],
  'Semifinal': [30, 32],
  'Final':     [36, 38],
};

const LIBERTA_PRIZES = {
  group: 2000000, 'Oitavas': 3000000, 'Quartas': 5000000,
  'Semifinal': 8000000, 'Final': 15000000, 'Campeão': 40000000,
};
const SULAM_PRIZES = {
  group: 800000, 'Oitavas': 1500000, 'Quartas': 2500000,
  'Semifinal': 4000000, 'Final': 7000000, 'Campeão': 18000000,
};

const LIBERTA_SCHEDULE = {
  'Grupos 1':  [2],
  'Grupos 2':  [7],
  'Grupos 3':  [12],
  'Oitavas':   [21, 23],
  'Quartas':   [26, 28],
  'Semifinal': [30, 32],
  'Final':     [35],
};
const SULAM_SCHEDULE = {
  'Grupos 1':  [3],
  'Grupos 2':  [8],
  'Grupos 3':  [15],
  'Oitavas':   [22, 24],
  'Quartas':   [29, 31],
  'Semifinal': [34, 37],
  'Final':     [38],
};

// ── Inicializar Copa do Brasil ────────────────────────────────────────────────
const initCopaBrasil = (gameData) => {
  const db    = diexDatabase;
  const serie = gameData.serie;

  // Fases e schedule por série
  const phases = serie === 'A' ? COPA_PHASES_A
    : serie === 'B' ? COPA_PHASES_B
    : serie === 'C' ? COPA_PHASES_C
    : COPA_PHASES_D;
  const sched = serie === 'A' ? COPA_SCHEDULE_A
    : serie === 'B' ? COPA_SCHEDULE_B
    : serie === 'C' ? COPA_SCHEDULE_C
    : COPA_SCHEDULE_D;

  // Pool de adversários: times de nível similar e divisões próximas
  const uid = gameData.club.existingTeamId;
  const poolA = (db.serieATeams || []).filter(t => t.id !== uid);
  const poolB = (db.serieBTeams || []).filter(t => t.id !== uid);
  const poolC = (db.serieCTeams || []).filter(t => t.id !== uid);
  const poolD = (db.serieDTeams || []).filter(t => t.id !== uid);

  // Série A: adversários da A e B; B: B e A; C: C e B; D: D e C
  const pool = _shuffle(
    serie === 'A' ? [...poolA, ...poolB]
    : serie === 'B' ? [...poolB, ...poolA]
    : serie === 'C' ? [...poolC, ...poolB]
    : [...poolD, ...poolC]
  );

  const userTeam = { id: 'user', name: gameData.club.name, strength: gameData.club.strength || 60, isPlayer: true };

  // #15 Série D na 1ª Fase: adversário é um time amador (força 35-45) simulando clubes menores
  let opp;
  if (serie === 'D' && phases[0] === '1ª Fase') {
    const amadorNames = [
      'Esporte Clube Guerreiro','União Esportiva FC','Atlético Interiorano','Grêmio da Cidade',
      'Sport Club da Serra','Associação Atlética Popular','EC Independente','FC Esperança',
      'Esporte Clube União','Associação Esportiva Vitória','Clube Atlético Regional','FC Renascença',
    ];
    const amadorName = amadorNames[Math.floor(Math.random() * amadorNames.length)];
    opp = {
      id: `amador_${Math.random().toString(36).substring(2,6)}`,
      name: amadorName,
      strength: 35 + Math.floor(Math.random() * 12), // 35-46
      isPlayer: false,
      teamName: amadorName,
    };
  } else {
    opp = pool[0] || { id: 'cpu_copa0', name: 'Adversário', strength: 60 };
  }

  const firstPhase = phases[0];
  const [idaR, voltaR] = sched[firstPhase] || [2, 4];

  // Evitar conflito de calendário: deslocar rodadas da copa se já houver jogo de liga
  const leagueRoundsInUse = _getLeagueRoundsInUse(gameData);
  const totalRounds = gameData.fixtures?.length || 38;
  const usedCupRounds = new Set();
  const safeIdaR   = _findFreeRound(idaR,   leagueRoundsInUse, usedCupRounds, totalRounds);
  usedCupRounds.add(safeIdaR);
  const safeVoltaR = _findFreeRound(voltaR, leagueRoundsInUse, usedCupRounds, totalRounds);

  const firstTie = _makeTie(userTeam, { ...opp, isPlayer: false }, firstPhase, COPA_PRIZES[firstPhase] || 0, safeIdaR, safeVoltaR);

  return {
    active: true, status: 'active', serie, phases, schedule: sched,
    phaseIndex: 0, phaseLabel: firstPhase,
    currentTie: firstTie,
    history: [], totalPrize: 0,
    pool, _serie: serie,
    _leagueRoundsInUse: Array.from(leagueRoundsInUse),
    _totalRounds: totalRounds,
  };
};

// ── Avança Copa do Brasil para próxima fase ───────────────────────────────────
const _advanceCopa = (copa, earnedPrize) => {
  const nextIdx = copa.phaseIndex + 1;
  if (nextIdx >= copa.phases.length) {
    // Campeão!
    return {
      ...copa, status: 'champion',
      history: [...copa.history, copa.currentTie],
      totalPrize: copa.totalPrize + COPA_PRIZES['Campeão'],
      currentTie: null,
    };
  }
  const nextPhase = copa.phases[nextIdx];
  const [idaR, voltaR] = copa.schedule[nextPhase] || [0, 0];
  const opp = copa.pool[nextIdx] || copa.pool[copa.pool.length - 1] || { id: 'cpu', name: 'Adversário', strength: 70 };
  // Alterna quem joga em casa na ida
  const userIsHome = nextIdx % 2 !== 0;
  const userTeam = copa.currentTie?.winner?.isPlayer ? copa.currentTie.winner : { id: 'user', name: copa.currentTie?.home?.name || 'Time', isPlayer: true };
  const homeTeam = userIsHome ? userTeam : { ...opp, isPlayer: false };
  const awayTeam = userIsHome ? { ...opp, isPlayer: false } : userTeam;

  // Evitar conflito: descobrir rodadas já usadas pela copa nessa temporada
  const _usedByCopa = new Set();
  copa.history?.forEach(t => { if (t?.leg1?.round) _usedByCopa.add(t.leg1.round); if (t?.leg2?.round) _usedByCopa.add(t.leg2.round); });
  const _leagueUsed = copa._leagueRoundsInUse ? new Set(copa._leagueRoundsInUse) : new Set();
  const _total = copa._totalRounds || 38;
  const safeIdaR   = _findFreeRound(idaR,   _leagueUsed, _usedByCopa, _total);
  _usedByCopa.add(safeIdaR);
  const safeVoltaR = _findFreeRound(voltaR, _leagueUsed, _usedByCopa, _total);

  const nextTie = _makeTie(homeTeam, awayTeam, nextPhase, COPA_PRIZES[nextPhase] || 0, safeIdaR, safeVoltaR);

  return {
    ...copa, phaseIndex: nextIdx, phaseLabel: nextPhase,
    currentTie: nextTie,
    history: [...copa.history, copa.currentTie],
    totalPrize: copa.totalPrize + earnedPrize,
  };
};

// ── Registra resultado de jogo de copa (chamado pelo hooks_simulation) ────────
const registerCupaLegResult = (copa, leg, homeGoals, awayGoals) => {
  if (!copa || !copa.currentTie) return copa;
  const tie = copa.currentTie;
  let updatedTie;

  if (leg === 'leg1') {
    updatedTie = { ...tie, leg1: { ...tie.leg1, played: true, home: homeGoals, away: awayGoals } };
    return { ...copa, currentTie: updatedTie };
  }

  // Volta jogada — decide o confronto
  updatedTie = _decideTie({ ...tie, leg2: { ...tie.leg2, played: true, home: homeGoals, away: awayGoals } });
  const userWon = updatedTie.winner?.isPlayer;
  const earned  = tie.prize || 0;

  if (!userWon) {
    return {
      ...copa, status: 'eliminated',
      currentTie: updatedTie,
      history: [...copa.history, updatedTie],
      totalPrize: copa.totalPrize + earned,
    };
  }
  return _advanceCopa({ ...copa, currentTie: updatedTie }, earned);
};

// ── Inicializar Libertadores ──────────────────────────────────────────────────
const initLibertadores = (gameData) => {
  const db    = diexDatabase;
  const myPos = gameData.table.findIndex(t => t.id === 'user') + 1;
  if (gameData.serie !== 'A' || myPos > 6) return null;

  const userTeam   = { id: 'user', name: gameData.club.name, strength: gameData.club.strength || 80, isPlayer: true };
  const conmebol   = _shuffle(db.conmebolTeams || []).slice(0, 3);
  const groupTeams = [userTeam, ...conmebol].map(t => ({ ...t, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, p: 0 }));

  const groupMatches = groupTeams.filter(t => !t.isPlayer).map((opp, i) => ({
    id: 'lib_g' + i, phase: 'Grupos ' + (i + 1),
    home: i % 2 === 0 ? userTeam : { ...opp, isPlayer: false },
    away: i % 2 === 0 ? { ...opp, isPlayer: false } : userTeam,
    leg1: { played: false, home: null, away: null, round: [2, 9, 16][i] },
    // leg2: jogo de volta no estádio do adversário
    leg2: {
      played: false, home: null, away: null,
      round: [6, 13, 20][i],
      // No jogo de volta, mandante/visitante invertem
      homeTeam: i % 2 === 0 ? { ...opp, isPlayer: false } : userTeam,
      awayTeam: i % 2 === 0 ? userTeam : { ...opp, isPlayer: false },
    },
    decided: false, winner: null,
    prize: Math.floor(LIBERTA_PRIZES.group / 3),
  }));

  return {
    active: true, status: 'active',
    phase: 'group', phaseLabel: 'Fase de Grupos',
    group: groupTeams, groupMatches,
    currentGroupMatchIndex: 0,
    knockoutTie: null, history: [], totalPrize: 0,
  };
};

const initSulAmericana = (gameData) => {
  const db    = diexDatabase;
  const myPos = gameData.table.findIndex(t => t.id === 'user') + 1;
  if (gameData.serie === 'A' && (myPos < 7 || myPos > 12)) return null;
  if (gameData.serie === 'B' && myPos !== 1) return null;

  const userTeam   = { id: 'user', name: gameData.club.name, strength: gameData.club.strength || 75, isPlayer: true };
  const conmebol   = _shuffle((diexDatabase.conmebolTeams || [])).slice(0, 3);
  const groupTeams = [userTeam, ...conmebol].map(t => ({ ...t, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, p: 0 }));

  const groupMatches = groupTeams.filter(t => !t.isPlayer).map((opp, i) => ({
    id: 'sul_g' + i, phase: 'Grupos ' + (i + 1),
    home: i % 2 === 0 ? userTeam : { ...opp, isPlayer: false },
    away: i % 2 === 0 ? { ...opp, isPlayer: false } : userTeam,
    leg1: { played: false, home: null, away: null, round: [3, 10, 17][i] },
    leg2: {
      played: false, home: null, away: null,
      round: [8, 15, 22][i],
      homeTeam: i % 2 === 0 ? { ...opp, isPlayer: false } : userTeam,
      awayTeam: i % 2 === 0 ? userTeam : { ...opp, isPlayer: false },
    },
    decided: false, winner: null,
    prize: Math.floor(SULAM_PRIZES.group / 3),
  }));

  return {
    active: true, status: 'active',
    phase: 'group', phaseLabel: 'Fase de Grupos',
    group: groupTeams, groupMatches,
    currentGroupMatchIndex: 0,
    knockoutTie: null, history: [], totalPrize: 0,
  };
};

// ── Registra jogo de grupo (Lib/Sul) ─────────────────────────────────────────
const registerGroupLegResult = (cup, matchId, homeGoals, awayGoals, prizeMap, scheduleMap, isLeg2 = false) => {
  if (!cup) return cup;
  const match = cup.groupMatches.find(m => m.id === matchId);
  if (!match) return cup;

  // Bug #5 fix: leg2 usa homeTeam/awayTeam invertidos (jogo de volta)
  // leg2.homeTeam = adversário (joga em casa no jogo de volta)
  // leg2.awayTeam = usuário (joga fora no jogo de volta)
  let updatedMatches;
  if (isLeg2 && match.leg2) {
    updatedMatches = cup.groupMatches.map(m =>
      m.id !== matchId ? m : {
        ...m,
        leg2: { ...m.leg2, played: true, home: homeGoals, away: awayGoals },
        decided: true,
      }
    );
  } else {
    updatedMatches = cup.groupMatches.map(m =>
      m.id !== matchId ? m : { ...m, leg1: { ...m.leg1, played: true, home: homeGoals, away: awayGoals }, decided: true }
    );
  }

  // Atualiza tabela do grupo
  // No leg2, mandante/visitante invertem — isUserHome precisa considerar isso
  const baseIsUserHome = match.home?.isPlayer ?? false;
  // No jogo de volta, o usuário é visitante se era mandante na ida
  const isUserHome = isLeg2 ? !baseIsUserHome : baseIsUserHome;
  const userG = isUserHome ? homeGoals : awayGoals;
  const oppG  = isUserHome ? awayGoals : homeGoals;

  let newGroup = cup.group.map(t => {
    const isUser = t.isPlayer;
    const isOpp  = isUserHome ? t.id === match.away.id : t.id === match.home.id;
    if (!isUser && !isOpp) return t;
    const myG = isUser ? userG : oppG;
    const thG = isUser ? oppG : userG;
    const upd = { ...t, gf: t.gf + myG, ga: t.ga + thG, p: t.p + 1 };
    if (myG > thG) { upd.w++; upd.pts += 3; }
    else if (myG < thG) { upd.l++; }
    else { upd.d++; upd.pts++; }
    return upd;
  });
  newGroup.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));

  const nextIdx     = cup.currentGroupMatchIndex + 1;
  const allDone     = nextIdx >= cup.groupMatches.length;
  const prizes      = prizeMap || LIBERTA_PRIZES;
  const schedule    = scheduleMap || LIBERTA_SCHEDULE;
  const groupEarned = cup.groupMatches.reduce((s, m) => s + (m.prize || 0), 0);

  if (!allDone) {
    return { ...cup, groupMatches: updatedMatches, group: newGroup, currentGroupMatchIndex: nextIdx };
  }

  const userRank = newGroup.findIndex(t => t.isPlayer) + 1;
  if (userRank > 2) {
    return {
      ...cup, groupMatches: updatedMatches, group: newGroup,
      status: 'eliminated',
      history: [...cup.history, { label: 'Fase de Grupos', group: newGroup }],
      totalPrize: cup.totalPrize + groupEarned,
    };
  }

  // Avança para oitavas
  const [iR, vR] = schedule['Oitavas'] || [14, 16];
  const allTeams = [...(diexDatabase?.conmebolTeams || []), ...(diexDatabase?.serieATeams || [])];
  const usedIds  = newGroup.map(t => t.id);
  const opp      = _shuffle(allTeams.filter(t => !usedIds.includes(t.id)))[0] || allTeams[0];
  const userTeam = { ...newGroup.find(t => t.isPlayer) };
  const tie      = _makeTie(userTeam, { ...opp, isPlayer: false }, 'Oitavas', prizes['Oitavas'] || 3000000, iR, vR);

  return {
    ...cup, groupMatches: updatedMatches, group: newGroup,
    phase: 'knockout', phaseLabel: 'Oitavas de Final',
    knockoutTie: tie, currentGroupMatchIndex: nextIdx,
    history: [...cup.history, { label: 'Fase de Grupos', group: newGroup }],
    totalPrize: cup.totalPrize + groupEarned,
  };
};

// ── Registra jogo de mata-mata (Lib/Sul) ─────────────────────────────────────
const registerKnockoutLegResult = (cup, leg, homeGoals, awayGoals, prizeMap, scheduleMap) => {
  if (!cup || !cup.knockoutTie) return cup;
  const tie = cup.knockoutTie;
  const pm  = prizeMap || LIBERTA_PRIZES;
  const sc  = scheduleMap || LIBERTA_SCHEDULE;

  if (leg === 'leg1') {
    return { ...cup, knockoutTie: { ...tie, leg1: { ...tie.leg1, played: true, home: homeGoals, away: awayGoals } } };
  }

  const decided = _decideTie({ ...tie, leg2: { ...tie.leg2, played: true, home: homeGoals, away: awayGoals } });
  const userWon = decided.winner?.isPlayer;
  const earned  = tie.prize || 0;

  if (!userWon) {
    return {
      ...cup, knockoutTie: decided,
      status: 'eliminated',
      history: [...cup.history, decided],
      totalPrize: cup.totalPrize + earned,
    };
  }

  const phases  = ['Oitavas', 'Quartas', 'Semifinal', 'Final'];
  const curIdx  = phases.indexOf(tie.phase);
  const nextP   = phases[curIdx + 1];

  if (!nextP) {
    return {
      ...cup, knockoutTie: decided,
      status: 'champion',
      history: [...cup.history, decided],
      totalPrize: cup.totalPrize + (pm['Campeão'] || 40000000),
    };
  }

  const [iR, vR] = (sc[nextP] || [21, 23]);
  const allTeams = [...(diexDatabase?.conmebolTeams || []), ...(diexDatabase?.serieATeams || [])];
  const usedIds  = cup.history.map(h => h.winner?.id).filter(Boolean);
  const opp      = _shuffle(allTeams.filter(t => !usedIds.includes(t.id)))[0] || allTeams[0];
  const userTeam = { ...decided.winner };
  const nextTie  = _makeTie(userTeam, { ...opp, isPlayer: false }, nextP, pm[nextP] || 5000000, iR, vR || iR + 2);

  return {
    ...cup, knockoutTie: nextTie,
    phaseLabel: nextP,
    history: [...cup.history, decided],
    totalPrize: cup.totalPrize + earned,
  };
};

// ── getCupMatchForRound: retorna info do jogo de copa na rodada ───────────────
const getCupMatchForRound = (cups, round) => {
  if (!cups) return { hasCupMatch: false };

  // Copa do Brasil
  const copa = cups.copaBrasil;
  if (copa?.status === 'active' && copa.currentTie) {
    const t = copa.currentTie;
    if (!t.leg1.played && t.leg1.round === round)
      return { hasCupMatch: true, cupKey: 'copaBrasil', cup: copa, tie: t, leg: 'leg1', label: '🏆 Copa do Brasil', isCopa: true };
    if (t.leg2 && t.leg1.played && !t.leg2.played && t.leg2.round === round)
      return { hasCupMatch: true, cupKey: 'copaBrasil', cup: copa, tie: t, leg: 'leg2', label: '🏆 Copa do Brasil', isCopa: true };
  }

  // Libertadores
  const lib = cups.libertadores;
  if (lib?.status === 'active') {
    if (lib.phase === 'group') {
      const gm = (lib.groupMatches || []).find(m => !m.leg1.played && m.leg1.round === round);
      if (gm) return { hasCupMatch: true, cupKey: 'libertadores', cup: lib, tie: gm, leg: 'leg1', label: '🌟 Libertadores', isGroup: true, matchId: gm.id, prizeMap: LIBERTA_PRIZES, scheduleMap: LIBERTA_SCHEDULE };
    } else if (lib.knockoutTie) {
      const t = lib.knockoutTie;
      if (!t.leg1.played && t.leg1.round === round)
        return { hasCupMatch: true, cupKey: 'libertadores', cup: lib, tie: t, leg: 'leg1', label: '🌟 Libertadores', prizeMap: LIBERTA_PRIZES, scheduleMap: LIBERTA_SCHEDULE };
      if (t.leg2 && t.leg1.played && !t.leg2.played && t.leg2.round === round)
        return { hasCupMatch: true, cupKey: 'libertadores', cup: lib, tie: t, leg: 'leg2', label: '🌟 Libertadores', prizeMap: LIBERTA_PRIZES, scheduleMap: LIBERTA_SCHEDULE };
    }
  }

  // Sul-Americana
  const sul = cups.sulAmericana;
  if (sul?.status === 'active') {
    if (sul.phase === 'group') {
      const gm = (sul.groupMatches || []).find(m => !m.leg1.played && m.leg1.round === round);
      if (gm) return { hasCupMatch: true, cupKey: 'sulAmericana', cup: sul, tie: gm, leg: 'leg1', label: '🌎 Sul-Americana', isGroup: true, matchId: gm.id, prizeMap: SULAM_PRIZES, scheduleMap: SULAM_SCHEDULE };
    } else if (sul.knockoutTie) {
      const t = sul.knockoutTie;
      if (!t.leg1.played && t.leg1.round === round)
        return { hasCupMatch: true, cupKey: 'sulAmericana', cup: sul, tie: t, leg: 'leg1', label: '🌎 Sul-Americana', prizeMap: SULAM_PRIZES, scheduleMap: SULAM_SCHEDULE };
      if (t.leg2 && t.leg1.played && !t.leg2.played && t.leg2.round === round)
        return { hasCupMatch: true, cupKey: 'sulAmericana', cup: sul, tie: t, leg: 'leg2', label: '🌎 Sul-Americana', prizeMap: SULAM_PRIZES, scheduleMap: SULAM_SCHEDULE };
    }
  }

  return { hasCupMatch: false };
};

// ── getUpcomingCupMatches: lista próximos jogos de copa para o calendário ─────
const getUpcomingCupMatches = (cups, currentRound) => {
  if (!cups) return [];
  const matches = [];

  const addTie = (cup, cupKey, label, color) => {
    if (!cup || cup.status !== 'active') return;
    if (cup.phase === 'group') {
      (cup.groupMatches || []).forEach(gm => {
        if (!gm.leg1.played && gm.leg1.round >= currentRound) {
          matches.push({ cupKey, label, color, phase: gm.phase, legLabel: 'Jogo Único', round: gm.leg1.round, home: gm.home, away: gm.away, isCup: true, isGroup: true, matchId: gm.id });
        }
      });
    } else {
      const tie = cup.currentTie || cup.knockoutTie;
      if (!tie) return;
      if (!tie.leg1.played && tie.leg1.round >= currentRound)
        matches.push({ cupKey, label, color, phase: tie.phase, legLabel: 'Jogo de Ida', round: tie.leg1.round, home: tie.home, away: tie.away, isCup: true });
      if (tie.leg1.played && !tie.leg2?.played && tie.leg2?.round >= currentRound)
        matches.push({ cupKey, label, color, phase: tie.phase, legLabel: 'Jogo de Volta', round: tie.leg2.round, home: tie.away, away: tie.home, isCup: true });
    }
  };

  addTie(cups.copaBrasil,   'copaBrasil',   '🏆 Copa do Brasil', '#00695c');
  addTie(cups.libertadores, 'libertadores', '🌟 Libertadores',   '#1a237e');
  addTie(cups.sulAmericana, 'sulAmericana', '🌎 Sul-Americana',  '#b71c1c');

  return matches.sort((a, b) => a.round - b.round);
};

const autoInitCupsForSeason = (gameData, isFirstSeason) => {
  const copa = initCopaBrasil(gameData);

  // Primeira temporada: apenas Copa do Brasil
  if (isFirstSeason) return { copaBrasil: copa, libertadores: null, sulAmericana: null };

  // Séries C e D: sem Libertadores nem Sul-Americana
  const currentSerie = gameData.serie || 'A';
  if (currentSerie === 'C' || currentSerie === 'D') {
    return { copaBrasil: copa, libertadores: null, sulAmericana: null };
  }

  // A partir da 2ª temporada: usa a posição FINAL da temporada anterior
  const prevPos   = gameData.seasonResult?.finalPosition || null;
  const prevSerie = gameData.seasonResult?.prevSerie     || gameData.serie;

  if (!prevPos) {
    return { copaBrasil: copa, libertadores: null, sulAmericana: null };
  }

  // Séries C/D na temporada anterior: sem continentais mesmo que tenha promovido
  if (prevSerie === 'C' || prevSerie === 'D') {
    return { copaBrasil: copa, libertadores: null, sulAmericana: null };
  }

  // Cria uma versão do gameData com a posição anterior "fingida" na tabela
  const fakeTable = [...(gameData.table || [])].map((t, i) => {
    if (t.id === 'user') return { ...t, _prevPos: prevPos };
    return t;
  });
  const gdWithPrevPos = {
    ...gameData,
    serie: prevSerie,
    table: fakeTable.sort((a, b) => {
      if (a.id === 'user') return prevPos - 1;
      if (b.id === 'user') return -(prevPos - 1);
      return 0;
    }),
  };

  const liberta = initLibertadores(gdWithPrevPos);
  const sulAm   = initSulAmericana(gdWithPrevPos);

  return { copaBrasil: copa, libertadores: liberta, sulAmericana: sulAm };
};

// ── Export ────────────────────────────────────────────────────────────────────

export const CupsEngine = {
  initCopaBrasil, registerCupaLegResult,
  initLibertadores, registerGroupLegResult, registerKnockoutLegResult,
  initSulAmericana,
  getCupMatchForRound, getUpcomingCupMatches, autoInitCupsForSeason,
  COPA_PRIZES, COPA_PHASES_A, COPA_PHASES_B, COPA_PHASES_C, COPA_PHASES_D,
  COPA_SCHEDULE_A, COPA_SCHEDULE_B, COPA_SCHEDULE_C, COPA_SCHEDULE_D,
  LIBERTA_PRIZES, LIBERTA_SCHEDULE, SULAM_PRIZES, SULAM_SCHEDULE,
  _decideTie, _simGoals, _simPenalties,
};
export default CupsEngine;

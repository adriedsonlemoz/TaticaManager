// @migrated to ES module
// engines/engine.js — Motor de jogo v6.0 (Gerador de Universo Persistente)
import { diexDatabase } from '../data/database.js';
import { realPlayers } from '../data/realPlayers.js';
import { DisciplineEngine } from './engine_discipline.js';
import { FatigueEngine } from './engine_fatigue.js';
import { AcademyEngine } from './engine_academy.js';

const getTableZoneColorA = (idx) => {
  if (idx < 4)   return '#32a852'; // Libertadores
  if (idx < 6)   return '#118a8b'; // Pré-Libertadores
  if (idx < 12)  return '#b87a00'; // Sul-Americana
  if (idx >= 16) return '#941818'; // Rebaixamento → Série B
  return 'transparent';
};
const getTableZoneColorB = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série A
  if (idx >= 16) return '#941818'; // Rebaixamento → Série C
  return 'transparent';
};
const getTableZoneColorC = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série B
  if (idx >= 16) return '#941818'; // Rebaixamento → Série D
  return 'transparent';
};
const getTableZoneColorD = (idx) => {
  if (idx < 4)   return '#32a852'; // Acesso → Série C
  if (idx >= 16) return '#941818'; // Eliminação (sem divisão abaixo)
  return 'transparent';
};
const getTableZoneColor = (idx, serie) => {
  if (serie === 'B') return getTableZoneColorB(idx);
  if (serie === 'C') return getTableZoneColorC(idx);
  if (serie === 'D') return getTableZoneColorD(idx);
  return getTableZoneColorA(idx);
};
// ── Cálculo de orçamento inicial por série/strength ─────────────────────────
// Mínimo absoluto: R$ 10.000.000 (todos os times e saves novos)
// Grandes clubes da Série A ultrapassam R$ 100M
const calcClubFinances = (serie, strength, overrideMoney) => {
  if (overrideMoney !== undefined && overrideMoney !== null) {
    const m = Math.max(10_000_000, Math.round(overrideMoney / 1_000_000) * 1_000_000);
    return { money: m, budget: Math.round(m * 0.80 / 1_000_000) * 1_000_000 };
  }
  const configs = {
    A: { base: 10_000_000, scale: 10_500_000, ref: 73 },
    B: { base: 10_000_000, scale:  1_875_000, ref: 66 },
    C: { base: 10_000_000, scale:    555_000, ref: 55 },
    D: { base: 10_000_000, scale:    250_000, ref: 43 },
  };
  const cfg = configs[serie] || configs.B;
  const raw    = cfg.base + (strength - cfg.ref) * cfg.scale;
  const money  = Math.max(10_000_000, Math.round(raw / 1_000_000) * 1_000_000);
  const budget = Math.round(money * 0.80 / 1_000_000) * 1_000_000;
  return { money, budget };
};



// 🌟 ATUALIZADO: Motor para criar jogador aceitando dados reais 🌟
// ── Contador global para IDs únicos ─────────────────────────
let _playerIdCounter = 0;
// ── generatePlayer v2.2 ──────────────────────────────────────
const generatePlayer = (positionHint, teamName = 'Livre', overallBase = 70, realData = null, teamId = null) => {
  const db = diexDatabase || { firstNames: ['Jogador'], lastNames: ['Genérico'], positions: ['CA'] };
  const isReal = realData !== null;

  const minOvr = overallBase >= 68 ? 58 : overallBase >= 58 ? 50 : overallBase >= 48 ? 43 : 38;
  const ovr = isReal
    ? realData.overall
    : Math.max(minOvr, Math.min(99, overallBase + Math.floor(Math.random() * 10) - 5));

  // Idade correlacionada com OVR
  let age;
  if (isReal) {
    age = realData.age;
  } else if (ovr <= 65) {
    age = Math.random() < 0.6 ? Math.floor(Math.random() * 5) + 18 : Math.floor(Math.random() * 8) + 22;
  } else if (ovr <= 75) {
    age = Math.floor(Math.random() * 12) + 21;
  } else {
    age = Math.random() < 0.75 ? Math.floor(Math.random() * 7) + 23 : Math.floor(Math.random() * 5) + 29;
  }

  const name = isReal
    ? realData.name
    : `${db.firstNames[Math.floor(Math.random() * db.firstNames.length)]} ${db.lastNames[Math.floor(Math.random() * db.lastNames.length)]}`;

  const pos = isReal
    ? realData.position
    : (positionHint || db.positions[Math.floor(Math.random() * db.positions.length)]);

  // Fórmula de valor: OVR 65→≈R$900K | 70→≈R$1.6M | 80→≈R$3.6M | 90→≈R$6.4M
  // Calibrada para que a folha total caiba na receita por rodada de cada série
  const rawValue = Math.round(Math.pow(Math.max(1, ovr - 50), 2.0) * 4000);
  const agePenalty = age >= 32 ? 0.55 : age >= 30 ? 0.75 : age >= 28 ? 0.90 : 1.0;
  const finalValue = Math.max(50000, Math.round(rawValue * agePenalty / 10000) * 10000);

  // Salário = 1.2% do valor de mercado (mínimo R$ 2.000/rodada)
  const wage = Math.max(2000, Math.round(finalValue * 0.012 / 1000) * 1000);

  // Contrato: jovens e veteranos têm contratos mais curtos
  const contract = isReal
    ? (realData.contract || 2)
    : (age <= 21 ? Math.floor(Math.random() * 2) + 1
     : age >= 30 ? Math.floor(Math.random() * 2) + 1
     : Math.floor(Math.random() * 3) + 1);

  // ID único — timestamp(36) + contador monotônico + random, previne colisão em burst
  const id = Date.now().toString(36) + (++_playerIdCounter).toString(36) + Math.random().toString(36).substring(2, 6);

  return {
    id,
    name,
    position:    pos,
    age,
    overall:     ovr,
    value:       finalValue,
    // Multa rescisória = 3× valor de mercado (padrão FIFA/contratos brasileiros)
    releaseClause: Math.round(finalValue * 3 / 10000) * 10000,
    wage,
    contract,
    teamName,
    teamId:      teamId || null,
    shirt:       null,
    goals:       0,
    assists:     0,
    seasonGoals: 0,
    energy:      100,
    injury:      null,
    isStarting:  false,
    isListed:    false,
    discipline:  { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
    isReal,
    // Moral individual: começa neutro (60), sobe com gols/vitórias, cai com lesão/derrota
    moralIndividual: 60,
    // Clube formador: preenchido pela academia; null para jogadores externos
    formerClub:  null,
    previousTeam: null,
    previousTeamGoals: null,
    previousTeamAssists: null,
  };
};

// 🌟 ATUALIZADO: Motor de elenco híbrido (Reais + Genéricos) 🌟
const generateSquad = (serie, teamName = 'Livre', baseOverall) => {
  const starterPos = ['GOL','ZAG','ZAG','LD','LE','VOL','VOL','MC','MEI','CA','CA'];
  const benchPos   = ['GOL','ZAG','ZAG','LD','LE','VOL','MC','MEI','PD','PE','CA'];
  const base = baseOverall || (serie === 'A' ? 75 : serie === 'B' ? 67 : serie === 'C' ? 59 : 48);
  const squad = [];
  
  // Pega os jogadores reais (se existirem para este time)
  const rpDB = realPlayers || {};
  const realPlayersList = rpDB[teamName] ? [...rpDB[teamName]] : [];
  
  starterPos.forEach((pos, i) => {
    const realIndex = realPlayersList.findIndex(rp => rp.position === pos);
    let p;
    if (realIndex !== -1) {
      const realData = realPlayersList.splice(realIndex, 1)[0];
      p = generatePlayer(pos, teamName, base, realData);
    } else {
      p = generatePlayer(pos, teamName, base, null);
    }
    p.isStarting = true; p.shirt = i + 1; squad.push(p);
  });
  
  benchPos.forEach((pos, i) => {
    const realIndex = realPlayersList.findIndex(rp => rp.position === pos);
    let p;
    if (realIndex !== -1) {
      const realData = realPlayersList.splice(realIndex, 1)[0];
      p = generatePlayer(pos, teamName, base - 5, realData);
    } else if (realPlayersList.length > 0) {
      const realData = realPlayersList.splice(0, 1)[0];
      p = generatePlayer(realData.position, teamName, base - 5, realData);
    } else {
      p = generatePlayer(pos, teamName, base - 5, null);
    }
    p.isStarting = false; p.shirt = i + 12; squad.push(p);
  });
  
  return squad;
};

const generateFixtures = (teams) => {
  let fixtures = []; const n = teams.length; let roundTeams = [...teams];
  for (let r = 0; r < n - 1; r++) {
    let roundMatches = [];
    for (let m = 0; m < n / 2; m++) {
      const home = roundTeams[m], away = roundTeams[n - 1 - m];
      if (r % 2 === 0 && m === 0) roundMatches.push({ home: away, away: home, played: false, result: null });
      else roundMatches.push({ home, away, played: false, result: null });
    }
    fixtures.push(roundMatches); roundTeams.splice(1, 0, roundTeams.pop());
  }
  const firstHalf = [...fixtures];
  firstHalf.forEach(round => { fixtures.push(round.map(m => ({ home: m.away, away: m.home, played: false, result: null }))); });
  return fixtures;
};

const generateInitialTable = (teams) => teams.map(t => ({ id: t.id, name: t.name, pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }));

const sortLeagueTable = (table, fixtures) => {
  // Critério Brasileirão: PTS → V → Confronto Direto → SG → GF → Nome (alfabético)
  const _h2h = (a, b) => {
    if (!fixtures) return 0;
    let aGols = 0, bGols = 0;
    fixtures.forEach(round => {
      (round || []).forEach(match => {
        const hId = match.home?.id, aId = match.away?.id;
        if (!match.played || !match.result) return;
        const [hg, ag] = (match.result || '0-0').split('-').map(n => parseInt(n.trim()) || 0);
        if (hId === a.id && aId === b.id) { aGols += hg; bGols += ag; }
        if (hId === b.id && aId === a.id) { bGols += hg; aGols += ag; }
      });
    });
    return bGols !== aGols ? bGols - aGols : 0; // positivo = b tem menos gols, a sobe
  };

  return [...table].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.w   !== a.w)   return b.w - a.w;
    // Confronto direto (só entre os dois)
    const h2h = _h2h(a, b);
    if (h2h !== 0) return h2h;
    // Saldo de gols geral
    const saldoA = a.gf - a.ga, saldoB = b.gf - b.ga;
    if (saldoB !== saldoA) return saldoB - saldoA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return (a.name || '').localeCompare(b.name || '');
  });
};

const getInitialGameState = (teamName, managerName, serie = 'A', managerProfile = {}) => {
  const db = diexDatabase;

  // BUG FIX: incluir séries C e D na busca do time existente
  const allDbTeams = [
    ...(db.serieATeams || []), ...(db.serieBTeams || []),
    ...(db.serieCTeams || []), ...(db.serieDTeams || []),
  ];
  const existingTeamId = allDbTeams.find(t => t.name === teamName)?.id || null;

  const strengthMap = { A: 78, B: 70, C: 60, D: 50 };
  // Se for time real, usar money/budget do database; senão calcular pela série
  const dbTeam = allDbTeams.find(t => t.name === teamName);
  const userStrength = dbTeam?.strength || strengthMap[serie] || 60;
  const userTeam = { id: 'user', name: teamName, strength: userStrength, isPlayer: true };

  const poolA = (db.serieATeams || []).filter(t => t.id !== existingTeamId)
    .map(t => ({ ...t, isPlayer: false, squad: generateSquad('A', t.name, t.strength, t.id) }));
  const poolB = (db.serieBTeams || []).filter(t => t.id !== existingTeamId)
    .map(t => ({ ...t, isPlayer: false, squad: generateSquad('B', t.name, t.strength, t.id) }));
  const poolC = (db.serieCTeams || []).filter(t => t.id !== existingTeamId)
    .map(t => ({ ...t, isPlayer: false, squad: generateSquad('C', t.name, t.strength, t.id) }));
  const poolD = (db.serieDTeams || []).filter(t => t.id !== existingTeamId)
    .map(t => ({ ...t, isPlayer: false, squad: generateSquad('D', t.name, t.strength, t.id) }));

  const allTeams = serie === 'A' ? [userTeam, ...poolA.slice(0, 19)]
    : serie === 'B' ? [userTeam, ...poolB.slice(0, 19)]
    : serie === 'C' ? [userTeam, ...poolC.slice(0, 19)]
    : [userTeam, ...poolD.slice(0, 19)];

  const teamRosters = {};
  allTeams.forEach(t => { if (t.squad) teamRosters[t.id] = t.squad; });

  const mktOvr = { A: 70, B: 63, C: 57, D: 50 }[serie] || 63;

  return {
    season: 2026, serie, round: 0, morale: 60,
    club: {
      name: teamName, manager: managerName,
      managerProfile: {
        age:                managerProfile.age        || 40,
        nationality:        managerProfile.nationality || 'Brasileiro',
        preferredFormation: managerProfile.formation   || '4-4-2',
        style:              managerProfile.style       || 'Equilibrado',
        experience: 0, wins: 0, draws: 0, losses: 0,
      },
      colorPrimary:   managerProfile.colorPrimary   || '#118a8b',
      colorSecondary: managerProfile.colorSecondary || '#ffffff',
      ...(() => {
        // Times reais: usar money do database (se disponível); senão calcular pela série
        // Times criados: respeitar initialMoney do setupData (slider do usuário)
        const overrideMoney = dbTeam?.money != null ? null : managerProfile.initialMoney;
        const base = dbTeam?.money
          ? { money: dbTeam.money, budget: dbTeam.budget || Math.round(dbTeam.money * 0.80 / 1000) * 1000 }
          : calcClubFinances(serie, userStrength, overrideMoney);
        return { money: base.money, transferBudget: base.budget };
      })(),
      wage: 0,
      formation: managerProfile.formation || '4-4-2',
      sponsors: { master: null, stadium: null },
      upgrades: {},
      existingTeamId,
      strength: userStrength,
      // #64 Fidelidade da torcida — cresce com vitórias, cai com rebaixamento
      fanLoyalty: dbTeam?.fanBase != null ? Math.round(dbTeam.fanBase * 100) : 50,
      stadium: {
        name: managerProfile.stadiumName || `Arena ${teamName}`,
        capacity:    { A: 20000, B: 12000, C: 7000, D: 4000 }[serie] || 12000,
        level: 1,
        ticketPrice: { A: 50,    B: 30,    C: 20,   D: 12   }[serie] || 30,
      },
    },
    players:  generateSquad(serie, teamName, { A: 75, B: 67, C: 59, D: 48 }[serie] || 67),
    teams:    allTeams,
    teamRosters,
    table:    generateInitialTable(allTeams),
    fixtures: generateFixtures(allTeams),
    leagues:  { A: poolA, B: poolB, C: poolC, D: poolD },
    market:   Array.from({ length: 15 }, () => {
      const p = generatePlayer(null, 'Livre', mktOvr);
      return p ? { ...p, teamName: 'Livre' } : null;
    }).filter(Boolean),
    cups: null, scorers: {}, financialHistory: [],
  };
};

// ═══════════════════════════════════════════════════════════════
// PRÓXIMA TEMPORADA
// ═══════════════════════════════════════════════════════════════
const generateNextSeason = (prevState) => {
  const db = diexDatabase;
  const prevSerie = prevState.serie;
  const prevTable = sortLeagueTable([...prevState.table]);
  const userPos   = prevTable.findIndex(t => t.id === 'user') + 1;

  // Determina a nova série (promoção/rebaixamento A↔B↔C↔D)
  let newSerie = prevSerie;
  if (prevSerie === 'A' && userPos >= 17) newSerie = 'B';
  if (prevSerie === 'B' && userPos <= 4)  newSerie = 'A';
  if (prevSerie === 'B' && userPos >= 17) newSerie = 'C';
  if (prevSerie === 'C' && userPos <= 4)  newSerie = 'B';
  if (prevSerie === 'C' && userPos >= 17) newSerie = 'D';
  if (prevSerie === 'D' && userPos <= 4)  newSerie = 'C';
  // Série D: posições >= 17 ficam na D (sem divisão abaixo)

  // Monta o resultado da temporada para exibição
  const serieOrder = { A: 0, B: 1, C: 2, D: 3 };
  const wasPromoted  = serieOrder[newSerie] < serieOrder[prevSerie];
  const wasRelegated = serieOrder[newSerie] > serieOrder[prevSerie];
  const seasonResult = {
    prevSerie, newSerie, userPos,
    promoted:  wasPromoted,
    relegated: wasRelegated,
    champion:  userPos === 1,
    pts:       prevTable.find(t => t.id === 'user')?.pts || 0,
    season:    prevState.season,
    finalPosition: userPos,  // usado por autoInitCupsForSeason
  };

  // Incrementa seasonsTotal no managerProfile
  const prevMp = prevState.club?.managerProfile || {};

  // ── Transferência de técnico aceita: troca de clube ─────────────────────
  const _transfer = prevState.pendingManagerTransfer?.accepted ? prevState.pendingManagerTransfer : null;
  const _newClubData = _transfer
    ? (() => {
        const db2 = diexDatabase;
        const allT = [...(db2?.serieATeams||[]),...(db2?.serieBTeams||[]),...(db2?.serieCTeams||[]),...(db2?.serieDTeams||[])];
        return allT.find(t => t.id === _transfer.offeringClub.id) || null;
      })()
    : null;

  // Gera novos times (mantém o clube do usuário, renova os CPUs)
  // existingTeamId garante que o time do usuário não aparece no pool de CPUs
  const existingTeamId = _newClubData ? _newClubData.id : prevState.club.existingTeamId;
  const _str = { A:78, B:70, C:60, D:50 };
  const userTeam  = {
    id: 'user',
    name: _newClubData ? _newClubData.name : prevState.club.name,
    strength: _newClubData ? (_newClubData.strength || 70) : (prevState.club.strength || (_str[newSerie]||60)),
    isPlayer: true,
  };

  // CPU EVOLUI: calcula bônus de strength por desempenho na temporada anterior
  // Top 4 → +2 | 5-10 → +1 | 11-16 → 0 | rebaixados → -1
  const _cpuStrengthBonus = (teamId) => {
    const pos = prevTable.findIndex(t => t.id === teamId) + 1;
    if (pos <= 0)  return 0;
    if (pos <= 4)  return 2;
    if (pos <= 10) return 1;
    if (pos <= 16) return 0;
    return -1;
  };

  const _evolveTeam = (t) => {
    const bonus = _cpuStrengthBonus(t.id);
    // Clamp: nunca cai abaixo de 55, nunca ultrapassa 94
    const newStr = Math.max(55, Math.min(94, (t.strength || 70) + bonus));
    return { ...t, strength: newStr };
  };

  const poolA = (db.serieATeams || []).filter(t => t.id !== existingTeamId)
    .map(t => { const ev = _evolveTeam(t); return { ...ev, isPlayer: false, squad: generateSquad('A', ev.name, ev.strength, ev.id) }; });
  const poolB = (db.serieBTeams || []).filter(t => t.id !== existingTeamId)
    .map(t => { const ev = _evolveTeam(t); return { ...ev, isPlayer: false, squad: generateSquad('B', ev.name, ev.strength, ev.id) }; });
  const poolC = (db.serieCTeams || []).filter(t => t.id !== existingTeamId)
    .map(t => { const ev = _evolveTeam(t); return { ...ev, isPlayer: false, squad: generateSquad('C', ev.name, ev.strength, ev.id) }; });
  const poolD = (db.serieDTeams || []).filter(t => t.id !== existingTeamId)
    .map(t => { const ev = _evolveTeam(t); return { ...ev, isPlayer: false, squad: generateSquad('D', ev.name, ev.strength, ev.id) }; });

  const allTeams = newSerie === 'A' ? [userTeam, ...poolA.slice(0,19)]
    : newSerie === 'B' ? [userTeam, ...poolB.slice(0,19)]
    : newSerie === 'C' ? [userTeam, ...poolC.slice(0,19)]
    : [userTeam, ...poolD.slice(0,19)];

  const teamRosters = {};
  allTeams.forEach(t => { if (t.squad) teamRosters[t.id] = t.squad; });

  // Recupera e atualiza jogadores: energia, contratos + evolução automática (#92)
  // FIX: envelhecimento (+1 age), decaimento de OVR para veteranos, aposentadoria
  const rawPlayers = (prevState.players || []).map(p => {
    const newAge = (p.age || 25) + 1;

    // Aposentadoria: todos se aposentam aos 42; reservas com 38+
    if (newAge >= 42) return null;
    if (newAge >= 38 && !p.isStarting) return null;

    // Decaimento de OVR para veteranos (começa aos 32, acelera aos 35)
    let ovrDecay = 0;
    if (newAge >= 36)      ovrDecay = Math.random() < 0.70 ? 2 : 1;
    else if (newAge >= 34) ovrDecay = Math.random() < 0.50 ? 1 : 0;
    else if (newAge >= 32) ovrDecay = Math.random() < 0.25 ? 1 : 0;

    return {
      ...p,
      age:       newAge,
      overall:   Math.max(50, (p.overall || 60) - ovrDecay),
      // #7 Inflação salarial: +8% ao ano (simula mercado/sindicato)
      wage:      Math.round((p.wage || 2000) * 1.08 / 500) * 500,
      energy:    100,
      injury:    null,
      isStarting: p.isStarting,
      contract:  Math.max(0, (p.contract || 1) - 1),
      discipline: { yellowCards: 0, suspendedUntilRound: null },
    };
  }).filter(Boolean).filter(p => (p.contract || 0) > 0 || p.isStarting);
  const updatedPlayers = applySeasonEvolution(rawPlayers, prevState.scorers || {});

  // Garante mínimo de 18 jogadores
  while (updatedPlayers.length < 18) {
    const _baseOvr = { A:72, B:65, C:58, D:47 };
    const newP = generatePlayer(null, prevState.club.name, _baseOvr[newSerie]||58);
    if (newP) updatedPlayers.push(newP);
  }

  // #94 Multiplicadores de dificuldade crescem com as temporadas
  const dLevel = Math.min(10, (prevState.club.difficultyLevel || 1) + 1);
  const difficultyMultipliers = {
    cpuStrengthBonus: dLevel * 0.5,        // CPU ganha até +5 de força
    fatigueLoss:      1 + dLevel * 0.03,   // até +30% mais cansaço
    injuryChance:     1 + dLevel * 0.05,   // até +50% mais lesões
  };

  return {
    ...prevState,
    season:   prevState.season + 1,
    serie:    newSerie,
    round:    0,
    morale:   65,
    teams:    allTeams,
    teamRosters: (() => {
      // #20 Renovação automática CPU: contratos expirados renovam por 2 temporadas
      const renewed = { ...teamRosters };
      Object.keys(renewed).forEach(teamId => {
        if (!Array.isArray(renewed[teamId])) return;
        renewed[teamId] = renewed[teamId].map(p => {
          if ((p.contract || 1) <= 0) return { ...p, contract: 2, wage: Math.round((p.wage||2000)*1.05/500)*500 };
          return { ...p, contract: Math.max(0, (p.contract||1) - 1) };
        });
      });
      return renewed;
    })(),
    table:    generateInitialTable(allTeams),
    fixtures: generateFixtures(allTeams),
    players:  updatedPlayers,
    market:   Array.from({ length: 15 }, () => { const _o={A:70,B:63,C:57,D:50}; const p=generatePlayer(null,'Livre',_o[newSerie]||57); return p?{...p,teamName:'Livre'}:null; }).filter(Boolean),
    cups:     null,
    scorers:  {},
    h2hHistory: {}, // B08: reset H2H a cada temporada
    pendingManagerTransfer: null,
    leagueRound: 0,  // resets with each new season
    calendar: null,  // rebuilt by CalendarEngine on first round // limpa após aplicar a transferência
    difficultyMultipliers,
    seasonResult,
    financialHistory: prevState.financialHistory || [],
    leagues:  { A: poolA, B: poolB, C: poolC, D: poolD },
    // Categoria de base: evolui garotos do usuário e da CPU
    ...(() => {
      if (!AcademyEngine) return {};
      const AE = AcademyEngine;
      const userAcademy = prevState.academy || [];
      const userLevel   = prevState.club?.academyLevel || 'basic';
      const { ready: userReady, remaining: userRemaining } =
        userAcademy.length
          ? AE.evolveAcademy(userAcademy, prevState.club?.name, 'user', userLevel)
          : { ready: [], remaining: AE.initUserAcademy(prevState.club?.name, 'user', userLevel) };
      const cpuResult = AE.processCpuAcademies(
        { A: poolA, B: poolB, C: poolC, D: poolD },
        teamRosters,
        prevState.academies || {}
      );
      return { academy: userRemaining, academyReady: userReady, academies: cpuResult.academies };
    })(),
    club: {
      ...prevState.club,
      // ── Transferência de técnico: sobreescreve nome/cor/estádio se aceita ──
      ...(_newClubData ? {
        name:         _newClubData.name,
        colorPrimary: _newClubData.colorPrimary || prevState.club.colorPrimary,
        stadium:      {
          name: `Estádio do ${_newClubData.name}`,
          capacity: 20000 + (_newClubData.strength || 70) * 300,
          level: 1, underConstruction: null,
        },
        fanLoyalty:   Math.round((_newClubData.fanBase ?? 0.5) * 100),
        strength:     _newClubData.strength || 70,
      } : {}),
      existingTeamId,
      // Penalidade/bônus financeiro por resultado da temporada
      money: (() => {
        const base = prevState.club.money ?? 10_000_000;
        if (wasRelegated) {
          // Rebaixamento: -55% do caixa (real: perda de cotas de TV e patrocinadores)
          const penalty = Math.round(base * 0.55);
          return Math.max(5_000_000, base - penalty);
        }
        if (wasPromoted) {
          // Acesso: +35% (cotas de TV da divisão superior)
          return Math.round(base * 1.35);
        }
        if (userPos === 1) {
          // Campeão: +15% extra (premiação)
          return Math.round(base * 1.15);
        }
        return base;
      })(),
      // #64 Atualizar fanLoyalty baseado no resultado da temporada
      fanLoyalty: (() => {
        const base = prevState.club.fanLoyalty ?? 50;
        if (wasPromoted)  return Math.min(100, base + 15);
        if (wasRelegated) return Math.max(10,  base - 20);
        if (userPos === 1) return Math.min(100, base + 10);
        if (userPos <= 4)  return Math.min(100, base + 5);
        if (userPos >= 17) return Math.max(10,  base - 8);
        return Math.max(10, Math.min(100, base + 2));
      })(),
      // #94 Progressão de dificuldade — novas temporadas são mais difíceis
      difficultyLevel: Math.min(10, (prevState.club.difficultyLevel || 1) + (wasPromoted ? 2 : wasRelegated ? 0 : 1)),
      managerProfile: {
        ...prevMp,
        seasonsTotal: (prevMp.seasonsTotal || 0) + 1,
        // wins/draws/losses mantidos (carreira acumulada)
        wins:       prevMp.wins       || 0,
        draws:      prevMp.draws      || 0,
        losses:     prevMp.losses     || 0,
        experience: prevMp.experience || 0,
      },
    },
  };
};

// ── calcTeamRecentForm: últimas N formas de um time (#18) ────────────────────
const calcTeamRecentForm = (teamId, fixtures, round, maxGames) => {
  maxGames = maxGames || 5;
  const form = [];
  for (var r = round - 1; r >= 0 && form.length < maxGames; r--) {
    const rnd = fixtures[r];
    if (!rnd) continue;
    const m = rnd.find(function(mx) { return mx.home && mx.home.id === teamId || mx.away && mx.away.id === teamId; });
    if (!m || !m.played || !m.result) continue;
    const parts = (m.result || '0-0').split('-').map(function(n) { return parseInt(n) || 0; });
    const [hg, ag] = parts;
    const isHome = m.home && m.home.id === teamId;
    const myG = isHome ? hg : ag, oppG = isHome ? ag : hg;
    form.push(myG > oppG ? 'W' : myG < oppG ? 'L' : 'D');
  }
  return form;
};

// ── calcCPUAvailableStrength: força CPU ajustada por elenco (#19) ────────────
const calcCPUAvailableStrength = (team, teamRosters, currentRound) => {
  const base = team.strength || 70;
  const roster = (teamRosters && teamRosters[team.id]) || team.squad || [];
  if (!roster.length) return base;
  const unavailable = roster.filter(function(p) {
    const injured = !!p.injury;
    const susp = DisciplineEngine
      ? DisciplineEngine.isPlayerSuspended(p, currentRound)
      : (p.discipline && p.discipline.suspendedUntilRound != null && currentRound <= p.discipline.suspendedUntilRound);
    return injured || susp;
  }).length;
  const penalty = Math.min(4, unavailable * 0.7);
  return Math.max(40, base - penalty);
};

// ── applySeasonEvolution: evolução automática por performance (#92) ──────────
const applySeasonEvolution = (players, scorers) => {
  return players.map(function(p) {
    const goals   = p.seasonGoals || 0;
    const assists = p.assists     || 0;
    const energy  = p.energy      != null ? p.energy : 100;
    const fatMult = FatigueEngine?.getEvolutionFatigueMultiplier
      ? FatigueEngine.getEvolutionFatigueMultiplier(energy)
      : 1.0;

    let evoChance = 0;
    if (['CA','PD','PE'].includes(p.position))              evoChance = goals >= 10 ? 0.80 : goals >= 5 ? 0.55 : goals >= 2 ? 0.30 : 0.08;
    else if (p.position === 'MEI')                           evoChance = (goals + assists) >= 8 ? 0.70 : (goals + assists) >= 4 ? 0.45 : 0.12;
    else if (['VOL','MC'].includes(p.position))              evoChance = assists >= 4 ? 0.50 : 0.15;
    else if (['ZAG','LD','LE'].includes(p.position))         evoChance = 0.18;
    // compat saves antigos
    else if (p.position === 'ATA')                           evoChance = goals >= 10 ? 0.80 : goals >= 5 ? 0.55 : goals >= 2 ? 0.30 : 0.08;
    else if (p.position === 'LAT')                           evoChance = 0.18;
    else evoChance = 0.12;

    // FEATURE: progressão de jovens — bônus escalonado por idade
    // ≤ 18 → +25% | 19-20 → +18% | 21 → +10% | 32+ → penalidade
    if      (p.age <= 18) evoChance += 0.25;
    else if (p.age <= 20) evoChance += 0.18;
    else if (p.age <= 21) evoChance += 0.10;
    else if (p.age >= 32) evoChance -= 0.10;

    if (p.overall >= 88) evoChance *= 0.3;
    else if (p.overall >= 82) evoChance *= 0.6;
    evoChance = Math.max(0, evoChance * fatMult);

    // Jovens excepcionais (≤ 20 com boa performance) podem ganhar +2 OVR
    let evoPoints = 1;
    if (p.age <= 20 && evoChance > 0.6 && Math.random() < 0.25) evoPoints = 2;

    const evolved    = p.overall < 99 && Math.random() < evoChance;
    const valueBonus = evolved ? (evoPoints >= 2 ? 1.15 : 1.08) : (goals >= 5 || assists >= 4 ? 1.04 : 1.0);

    // Veteranos (≥ 32) podem regredir
    let regression = 0;
    if (p.age >= 34 && p.overall > 65 && Math.random() < 0.35) regression = 1;
    else if (p.age >= 32 && p.overall > 70 && Math.random() < 0.15) regression = 1;

    return {
      ...p,
      overall:      Math.max(40, Math.min(99,
        evolved ? p.overall + evoPoints : p.overall - regression
      )),
      value:        Math.round((p.value || 50000) * valueBonus),
      seasonGoals:  0,
      assists:      0,
      minutesPlayed: 0,
    };
  });
};

// Named exports (all top-level functions/vars)
export {
  sortLeagueTable,
  getInitialGameState,
  generatePlayer,
  generateSquad,
  generateFixtures,
  generateInitialTable,
  getTableZoneColor,
  generateNextSeason,
  calcTeamRecentForm,
  calcCPUAvailableStrength,
  applySeasonEvolution,
};

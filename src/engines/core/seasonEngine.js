// Season transition, promotion/relegation and yearly squad refresh.
import { diexDatabase } from '../../data/database.js';
import { AcademyEngine } from '../engine_academy.js';
import { generatePlayer, generateSquad } from './playerFactory.js';
import { generateFixtures, generateInitialTable, sortLeagueTable } from './leagueEngine.js';
import { applySeasonEvolution } from './playerDevelopment.js';

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


export { generateNextSeason };

// @migrated to ES module
// engine_academy.js — Categoria de Base (TÁTICA MANAGER)
// Script normal (sem JSX) — carrega antes dos hooks.

import { diexDatabase } from '../data/database.js';

export const AcademyEngine = (() => {
  const ACADEMY_SIZE  = 8;
  const PROMOTE_AGE   = 18;
  const INVEST_COST   = { basic: 500000, advanced: 1500000, elite: 4000000 };
  // FIX 8.1: INVEST_BONUS agora e um bonus ADITIVO a evoChance (ex: +0.08 = +8%),
  // nao mais um bonus direto de OVR inicial. Antes, 'elite' adicionava +7 OVR ao
  // prospecto logo na geracao, tornando-o irrealisticamente forte desde o inicio.
  // Os valores abaixo aumentam a PROBABILIDADE de evolução anual da base.
  const INVEST_BONUS  = { basic: 0.08, advanced: 0.15, elite: 0.25 };
  const LEVEL_ORDER   = ['basic', 'advanced', 'elite'];

  const _generateProspect = (teamName, teamId, academyLevel) => {
    const db  = diexDatabase || { firstNames: ['Garoto'], lastNames: ['Promessa'], positions: ['CA'] };
    const pos = db.positions[Math.floor(Math.random() * db.positions.length)];
    const age = 14 + Math.floor(Math.random() * 4);
    // FIX 8.1: OVR inicial nao e mais inflado por INVEST_BONUS.
    // O nivel da academia agora so afeta a CHANCE de evolucao (em evolveAcademy),
    // nao o patamar inicial do jogador.
    const ovr    = Math.min(65, 42 + Math.floor(Math.random() * 16));
    const potential = Math.min(92, ovr + 10 + Math.floor(Math.random() * 22));
    const trajectories = ['burst', 'steady', 'late'];
    const trajectory   = trajectories[Math.floor(Math.random() * 3)];
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6) + 'ac';

    return {
      id, position: pos, age, overall: ovr, potential, trajectory,
      name: `${db.firstNames[Math.floor(Math.random()*db.firstNames.length)]} ${db.lastNames[Math.floor(Math.random()*db.lastNames.length)]}`,
      teamName, teamId: teamId || null,
      academyYear: 1, goals: 0, assists: 0, energy: 100, injury: null,
      isAcademy: true, contract: 3, wage: 2000, value: 50000, shirt: null,
      isStarting: false, isListed: false, seasonGoals: 0,
      discipline: { yellowCards: 0, suspendedUntilRound: null, disciplineHistory: [] },
    };
  };

  const generateAcademy = (teamName, teamId, level, size) =>
    Array.from({ length: size || ACADEMY_SIZE }, () => _generateProspect(teamName, teamId, level || 'basic'));

  const evolveAcademy = (academy, teamName, teamId, level) => {
    const lvl = level || 'basic';
    if (!academy || !academy.length) return { ready: [], remaining: generateAcademy(teamName, teamId, lvl, 4) };

    const evolved = academy.map(p => {
      const newAge = (p.age || 14) + 1;
      const gap    = Math.max(0, (p.potential || 70) - (p.overall || 50));
      let evoChance, evoMax;
      if (p.trajectory === 'burst') {
        evoChance = newAge <= 16 ? 0.85 : newAge <= 17 ? 0.60 : 0.30;
        evoMax    = newAge <= 16 ? 4    : newAge <= 17 ? 2    : 1;
      } else if (p.trajectory === 'late') {
        evoChance = newAge <= 15 ? 0.25 : newAge <= 16 ? 0.45 : 0.80;
        evoMax    = newAge <= 15 ? 1    : newAge <= 16 ? 2    : 4;
      } else {
        evoChance = 0.65; evoMax = 2;
      }
      // FIX 8.1: INVEST_BONUS e somado diretamente a evoChance (valor ja e fracionario, ex: 0.15).
      // Antes multiplicava por 0.05, o que gerava bônus negligenciavel mesmo para 'elite'.
      evoChance = Math.min(0.95, evoChance + (INVEST_BONUS[lvl] || 0));
      const gain = Math.random() < evoChance
        ? 1 + Math.floor(Math.random() * Math.min(evoMax, Math.max(1, Math.ceil(gap / 3))))
        : 0;
      const newOvr = Math.min(p.potential || 70, (p.overall || 50) + gain);
      return { ...p, age: newAge, overall: newOvr,
        value: Math.max(50000, Math.round(Math.pow(Math.max(1, newOvr - 50), 2.0) * 4000)),
        academyYear: (p.academyYear || 1) + 1, goals: 0, assists: 0 };
    });

    const ready   = evolved.filter(p => p.age >= PROMOTE_AGE);
    const younger = evolved.filter(p => p.age  < PROMOTE_AGE);
    const deficit = Math.max(0, ACADEMY_SIZE - younger.length);
    const recruits = Array.from({ length: deficit }, () => _generateProspect(teamName, teamId, lvl));
    return { ready, remaining: [...younger, ...recruits] };
  };

  const promoteProspect = (prospect, clubName) => {
    const { potential, trajectory, academyYear, ...rest } = prospect;
    return { ...rest, isAcademy: false, teamName: clubName, isStarting: false,
      shirt: null, contract: 2, wage: Math.max(3000, Math.round((prospect.value||50000)*0.012/1000)*1000),
      goals: 0, assists: 0, seasonGoals: 0, energy: 100, injury: null };
  };

  const cpuAutoPromote = (team, academyReady, teamRosters) => {
    if (!academyReady || !academyReady.length) return { updatedRoster: teamRosters?.[team.id] || [] };
    const minOvr = { A:62, B:55, C:48, D:42 }[team.serie||'A'] || 55;
    const roster = [...(teamRosters?.[team.id] || team.squad || [])];
    academyReady.forEach(p => {
      if (p.overall >= minOvr) roster.push(promoteProspect(p, team.name));
    });
    return { updatedRoster: roster };
  };

  const processCpuAcademies = (leagues, teamRosters, academies) => {
    const updRosters   = { ...(teamRosters || {}) };
    const updAcademies = { ...(academies   || {}) };
    const processPool  = (pool) => (pool || []).map(team => {
      if (team.isPlayer || team.id === 'user') return team;
      const lvl     = team.academyLevel || 'basic';
      const current = updAcademies[team.id] || generateAcademy(team.name, team.id, lvl);
      const { ready, remaining } = evolveAcademy(current, team.name, team.id, lvl);
      const { updatedRoster } = cpuAutoPromote(team, ready, updRosters);
      updRosters[team.id]   = updatedRoster;
      updAcademies[team.id] = remaining;
      return team;
    });
    return {
      leagues: { A: processPool(leagues?.A), B: processPool(leagues?.B),
                 C: processPool(leagues?.C), D: processPool(leagues?.D) },
      teamRosters: updRosters, academies: updAcademies,
    };
  };

  const investAcademy = (gameData, level) => {
    const cost = INVEST_COST[level];
    if (!cost) return { error: 'Nível inválido.' };

    const currentLevel = gameData.club?.academyLevel || 'basic';
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
    const targetIndex  = LEVEL_ORDER.indexOf(level);
    if (targetIndex <= currentIndex) {
      return { error: 'A academia só pode ser evoluída para um nível superior.' };
    }
    if ((gameData.club?.money || 0) < cost) return { error: 'Saldo insuficiente.' };
    return { cost, newLevel: level };
  };

  const initUserAcademy = (clubName, clubId, level) =>
    generateAcademy(clubName, clubId || 'user', level || 'basic', 6);

  const LEVELS = {
    basic: {
      label: 'Básica', cost: INVEST_COST.basic, prestige: 20, evolutionBonusPct: 8, focus: 'Formação',
      desc: 'Estrutura inicial para desenvolver as promessas do clube',
    },
    advanced: {
      label: 'Avançada', cost: INVEST_COST.advanced, prestige: 55, evolutionBonusPct: 15, focus: 'Evolução',
      desc: 'Instalações melhores e desenvolvimento mais consistente',
    },
    elite: {
      label: 'Elite', cost: INVEST_COST.elite, prestige: 90, evolutionBonusPct: 25, focus: 'Excelência',
      desc: 'CT de ponta com a maior chance de evolução da categoria de base',
    },
  };

  const mergeProspectPools = (...pools) => {
    const merged = new Map();
    pools.flat().filter(Boolean).forEach((prospect) => {
      if (prospect?.id && !merged.has(prospect.id)) merged.set(prospect.id, prospect);
    });
    return [...merged.values()];
  };

  return { generateAcademy, evolveAcademy, promoteProspect,
           cpuAutoPromote, processCpuAcademies, investAcademy, mergeProspectPools,
           initUserAcademy, ACADEMY_SIZE, PROMOTE_AGE, INVEST_COST, INVEST_BONUS, LEVEL_ORDER, LEVELS };
})();
export default AcademyEngine;

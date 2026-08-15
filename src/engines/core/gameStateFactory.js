// Initial career/game-state factory.
import { diexDatabase } from '../../data/database.js';
import { generatePlayer, generateSquad } from './playerFactory.js';
import { generateFixtures, generateInitialTable } from './leagueEngine.js';

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

export { getInitialGameState };

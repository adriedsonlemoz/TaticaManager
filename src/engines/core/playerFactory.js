// Player and squad generation.
import { diexDatabase } from '../../data/database.js';
import { realPlayers } from '../../data/realPlayers.js';

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

export { generatePlayer, generateSquad };

import { DisciplineEngine } from '../engine_discipline.js';
import { FatigueEngine } from '../engine_fatigue.js';
import { FORMATION_SLOTS, canPlayAs } from './lineupRules.js';

export const LINEUP_VIEWBOX = { width: 160, height: 100 };

export const FORMATION_POSITIONS = {
  '4-4-2': [
    { role:'GOL', x:8, y:50 },
    { role:'LD', x:34, y:10 }, { role:'ZAG', x:34, y:34 }, { role:'ZAG', x:34, y:66 }, { role:'LE', x:34, y:90 },
    { role:'PD', x:82, y:14 }, { role:'VOL', x:82, y:40 }, { role:'VOL', x:82, y:60 }, { role:'PE', x:82, y:86 },
    { role:'CA', x:130, y:34 }, { role:'CA', x:130, y:66 },
  ],
  '4-3-3': [
    { role:'GOL', x:8, y:50 },
    { role:'LD', x:34, y:10 }, { role:'ZAG', x:34, y:34 }, { role:'ZAG', x:34, y:66 }, { role:'LE', x:34, y:90 },
    { role:'VOL', x:82, y:24 }, { role:'MC', x:82, y:50 }, { role:'MEI', x:82, y:76 },
    { role:'PD', x:132, y:12 }, { role:'CA', x:132, y:50 }, { role:'PE', x:132, y:88 },
  ],
  '4-2-3-1': [
    { role:'GOL', x:8, y:50 },
    { role:'LD', x:32, y:10 }, { role:'ZAG', x:32, y:34 }, { role:'ZAG', x:32, y:66 }, { role:'LE', x:32, y:90 },
    { role:'VOL', x:68, y:36 }, { role:'VOL', x:68, y:64 },
    { role:'PD', x:100, y:14 }, { role:'MEI', x:100, y:50 }, { role:'PE', x:100, y:86 },
    { role:'CA', x:140, y:50 },
  ],
  '3-5-2': [
    { role:'GOL', x:8, y:50 },
    { role:'ZAG', x:34, y:22 }, { role:'ZAG', x:34, y:50 }, { role:'ZAG', x:34, y:78 },
    { role:'LD', x:76, y:6 }, { role:'VOL', x:76, y:30 }, { role:'MC', x:76, y:50 }, { role:'VOL', x:76, y:70 }, { role:'LE', x:76, y:94 },
    { role:'CA', x:130, y:34 }, { role:'CA', x:130, y:66 },
  ],
  '3-4-3': [
    { role:'GOL', x:8, y:50 },
    { role:'ZAG', x:34, y:22 }, { role:'ZAG', x:34, y:50 }, { role:'ZAG', x:34, y:78 },
    { role:'LD', x:78, y:10 }, { role:'VOL', x:78, y:38 }, { role:'VOL', x:78, y:62 }, { role:'LE', x:78, y:90 },
    { role:'PD', x:132, y:14 }, { role:'CA', x:132, y:50 }, { role:'PE', x:132, y:86 },
  ],
  '5-3-2': [
    { role:'GOL', x:8, y:50 },
    { role:'LD', x:32, y:6 }, { role:'ZAG', x:32, y:28 }, { role:'ZAG', x:32, y:50 }, { role:'ZAG', x:32, y:72 }, { role:'LE', x:32, y:94 },
    { role:'VOL', x:82, y:26 }, { role:'MC', x:82, y:50 }, { role:'VOL', x:82, y:74 },
    { role:'CA', x:130, y:34 }, { role:'CA', x:130, y:66 },
  ],
  '4-1-4-1': [
    { role:'GOL', x:8, y:50 },
    { role:'LD', x:32, y:10 }, { role:'ZAG', x:32, y:34 }, { role:'ZAG', x:32, y:66 }, { role:'LE', x:32, y:90 },
    { role:'VOL', x:62, y:50 },
    { role:'PD', x:92, y:12 }, { role:'MC', x:92, y:38 }, { role:'MC', x:92, y:62 }, { role:'PE', x:92, y:88 },
    { role:'CA', x:140, y:50 },
  ],
  '4-5-1': [
    { role:'GOL', x:8, y:50 },
    { role:'LD', x:32, y:10 }, { role:'ZAG', x:32, y:34 }, { role:'ZAG', x:32, y:66 }, { role:'LE', x:32, y:90 },
    { role:'PD', x:82, y:6 }, { role:'VOL', x:82, y:30 }, { role:'MC', x:82, y:50 }, { role:'VOL', x:82, y:70 }, { role:'PE', x:82, y:94 },
    { role:'CA', x:140, y:50 },
  ],
};

export const FORMATION_DESCRIPTIONS = {
  '4-4-2': { icon:'⚖️', atk:0, def:0, desc:'Equilibrado' },
  '4-3-3': { icon:'⚡', atk:2, def:-1, desc:'+Ataque' },
  '4-2-3-1': { icon:'🧠', atk:1, def:1, desc:'Controle' },
  '3-5-2': { icon:'🎯', atk:1, def:0, desc:'+Meio-campo' },
  '3-4-3': { icon:'🔥', atk:3, def:-2, desc:'+++ Ofensivo' },
  '5-3-2': { icon:'🛡️', atk:-1, def:3, desc:'+++ Defensivo' },
  '4-1-4-1': { icon:'🔒', atk:-2, def:4, desc:'Ultra-Defensivo' },
  '4-5-1': { icon:'🏃', atk:0, def:2, desc:'Contra-Ataque' },
};

const POSITION_ORDER = { GOL:0, ZAG:1, LD:2, LE:3, LAT:2, VOL:4, MC:5, MEI:6, PD:7, PE:8, CA:9, ATA:9 };

export const isPlayerInjured = player => Boolean(player?.injury);
export const isPlayerSuspended = (player, currentRound) => DisciplineEngine.isPlayerSuspended(player, currentRound);
export const isPlayerUnavailable = (player, currentRound) => isPlayerInjured(player) || isPlayerSuspended(player, currentRound);

const effectiveOvr = player => Math.max(30, (player?.overall || 0) - FatigueEngine.getOverallPenalty(player?.energy ?? 100));

export function buildSlotPlayers(starters, formation) {
  const slots = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-4-2'];
  const remaining = [...starters];
  const result = slots.map((slot, idx) => {
    const matchIndex = remaining.findIndex(p => (p.adaptedPosition || p.position) === slot.role);
    if (matchIndex < 0) return { slot, idx, player: null, improvised: false };
    const [player] = remaining.splice(matchIndex, 1);
    return { slot, idx, player, improvised: false };
  });

  // Jogadores sem slot natural/adaptado continuam titulares e aparecem nos espaços vazios.
  // A validação global aplica a penalidade de improvisação (-20%).
  const improvised = remaining.sort((a, b) => effectiveOvr(b) - effectiveOvr(a));
  result.forEach(item => {
    if (!item.player && improvised.length) {
      item.player = improvised.shift();
      item.improvised = true;
    }
  });
  return result;
}

export function buildLineupViewModel(gameData) {
  const players = gameData?.players || [];
  const club = gameData?.club || {};
  const currentRound = (gameData?.round || 0) + 1;
  const formation = club.formation || '4-4-2';
  const starters = players.filter(p => p.isStarting);
  const unavailable = players.filter(p => isPlayerUnavailable(p, currentRound));
  const unavailableIds = new Set(unavailable.map(p => p.id));
  const bench = players
    .filter(p => !p.isStarting && !unavailableIds.has(p.id))
    .sort((a, b) => (POSITION_ORDER[a.position] ?? 9) - (POSITION_ORDER[b.position] ?? 9) || (b.overall || 0) - (a.overall || 0));

  const avgOvrPure = starters.length
    ? Math.round(starters.reduce((sum, p) => sum + (p.overall || 0), 0) / starters.length)
    : 0;
  const avgOvr = starters.length
    ? Math.round(starters.reduce((sum, p) => sum + effectiveOvr(p), 0) / starters.length)
    : 0;

  return {
    players, club, currentRound, formation, starters, bench, unavailable,
    avgOvr, avgOvrPure, energyPenaltyTotal: Math.max(0, avgOvrPure - avgOvr),
    slotPlayers: buildSlotPlayers(starters, formation),
    formationInfo: FORMATION_DESCRIPTIONS[formation] || {},
  };
}

export function getAvailableForRole(bench, role) {
  const exact = bench.filter(p => p.position === role);
  const exactIds = new Set(exact.map(p => p.id));
  const adapted = bench.filter(p => !exactIds.has(p.id) && p.position !== role && canPlayAs(p.position, role));
  return { exact, adapted, all: [...exact, ...adapted] };
}

export function changeFormationState(gameData, formation) {
  if (!FORMATION_POSITIONS[formation]) return gameData;
  const allowedRoles = new Set(FORMATION_POSITIONS[formation].map(s => s.role));
  return {
    ...gameData,
    club: { ...(gameData.club || {}), formation },
    players: (gameData.players || []).map(p => ({
      ...p,
      adaptedPosition: p.adaptedPosition && allowedRoles.has(p.adaptedPosition) && canPlayAs(p.position, p.adaptedPosition)
        ? p.adaptedPosition
        : null,
    })),
  };
}

export function toggleStarterState(gameData, playerId) {
  const players = gameData?.players || [];
  const player = players.find(p => p.id === playerId);
  if (!player) return { gameData, error: 'Jogador não encontrado.' };
  const currentRound = (gameData?.round || 0) + 1;

  if (player.isStarting) {
    return {
      gameData: {
        ...gameData,
        players: players.map(p => p.id === playerId ? { ...p, isStarting:false, adaptedPosition:null } : p),
      },
    };
  }

  if (isPlayerInjured(player)) return { gameData, error: `${player.name.split(' ')[0]} está lesionado!` };
  if (isPlayerSuspended(player, currentRound)) return { gameData, error: `${player.name.split(' ')[0]} está suspenso!` };

  const starters = players.filter(p => p.isStarting);
  if (starters.length >= 11) return { gameData, error: 'Já há 11 titulares. Remova um antes de adicionar.' };

  const formation = gameData.club?.formation || '4-4-2';
  const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-4-2'];
  const role = player.position;
  const maxForRole = slots[role] ?? 0;
  const currentForRole = starters.filter(p => (p.adaptedPosition || p.position) === role).length;
  if (maxForRole === 0) return { gameData, error: `A formação ${formation} não tem posição para ${role}. Use um slot compatível no campo.` };
  if (currentForRole >= maxForRole) return { gameData, error: `Já há ${maxForRole} ${role}(s) escalado(s) na formação ${formation}.` };

  return {
    gameData: {
      ...gameData,
      players: players.map(p => p.id === playerId ? { ...p, isStarting:true, adaptedPosition:null } : p),
    },
  };
}

export function selectPlayerForRoleState(gameData, playerId, role) {
  const players = gameData?.players || [];
  const player = players.find(p => p.id === playerId);
  if (!player) return { gameData, error:'Jogador não encontrado.' };
  const currentRound = (gameData?.round || 0) + 1;
  if (isPlayerUnavailable(player, currentRound)) return { gameData, error:`${player.name.split(' ')[0]} está indisponível.` };

  const starters = players.filter(p => p.isStarting);
  if (!player.isStarting && starters.length >= 11) return { gameData, error:'Já há 11 titulares. Remova um antes de adicionar.' };

  const roleLimit = (FORMATION_SLOTS[gameData.club?.formation || '4-4-2'] || {})[role] || 0;
  const currentInRole = starters.filter(p => p.id !== playerId && (p.adaptedPosition || p.position) === role).length;
  if (currentInRole >= roleLimit) return { gameData, error:`Posição ${role} já está completa nessa formação!` };

  const exact = player.position === role;
  if (!exact && !canPlayAs(player.position, role)) return { gameData, error:`${player.position} não pode ser adaptado para ${role}.` };

  return {
    gameData: {
      ...gameData,
      players: players.map(p => p.id === playerId
        ? { ...p, isStarting:true, adaptedPosition: exact ? null : role }
        : p),
    },
  };
}

export function autoLineupState(gameData) {
  const players = gameData?.players || [];
  const currentRound = (gameData?.round || 0) + 1;
  const formation = gameData?.club?.formation || '4-4-2';
  const slots = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-4-2'];
  const available = players
    .filter(p => !isPlayerUnavailable(p, currentRound))
    .sort((a, b) => effectiveOvr(b) - effectiveOvr(a));
  const unused = new Map(available.map(p => [p.id, p]));
  const assignments = new Map();
  let improvisedCount = 0;

  for (const slot of slots) {
    const candidates = [...unused.values()];
    let chosen = candidates.find(p => p.position === slot.role);
    let adapted = false;
    if (!chosen) {
      chosen = candidates.find(p => canPlayAs(p.position, slot.role));
      adapted = Boolean(chosen);
    }
    if (!chosen) {
      chosen = candidates[0];
      if (chosen) improvisedCount += 1;
    }
    if (!chosen) continue;
    assignments.set(chosen.id, adapted ? slot.role : null);
    unused.delete(chosen.id);
  }

  const nextPlayers = players.map(p => assignments.has(p.id)
    ? { ...p, isStarting:true, adaptedPosition: assignments.get(p.id) }
    : { ...p, isStarting:false, adaptedPosition:null });

  return {
    gameData: { ...gameData, players: nextPlayers },
    starterCount: assignments.size,
    improvisedCount,
  };
}

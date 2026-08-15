// @migrated to ES module
// engine_cpu_ai.js — IA dos times CPU: transferências + sistema de contratos
// ─────────────────────────────────────────────────────────────────────────────
import { generatePlayer } from './engine.js';

export const CpuAI = (() => {
  
  // ═══════════════════════════════════════════════════════════════
  // FEATURE 2 — CPU COMPRANDO JOGADORES
  // A cada rodada, times com elenco abaixo do mínimo buscam reforços.
  // Probabilidade escalonada: times mais fracos repõem com mais urgência.
  // ═══════════════════════════════════════════════════════════════
  
  const MIN_SQUAD_SIZE = 20; // abaixo disso o time busca reforços (mínimo para disputar campeonato)
  const CPU_BUY_CHANCE = 0.22; // chance base por rodada de tentar comprar
  const CPU_MAX_PER_RND = 2; // máx de novas contratações por time por rodada
  
  const _serieBaseOvr = { A: 76, B: 68, C: 60, D: 50 };
  
  const _processTeam = (team, teamRosters, round) => {
    const squad = (teamRosters?.[team.id] || team.squad || []);
    const lacking = squad.length < MIN_SQUAD_SIZE;
    
    // Ativa compra se: elenco curto OU chance aleatória (para times saudáveis também evoluírem)
    const shouldBuy = lacking || Math.random() < CPU_BUY_CHANCE * 0.4;
    if (!shouldBuy) return { team: { ...team, squad }, changed: false };
    
    // Stagger por id para não rodar todos no mesmo round
    const seed = team.id ? (team.id.charCodeAt(team.id.length - 1) || 0) : 0;
    if (!lacking && (round + seed) % 4 !== 0) return { team: { ...team, squad }, changed: false };
    
    const neededCount = lacking ?
      Math.min(CPU_MAX_PER_RND, MIN_SQUAD_SIZE - squad.length) :
      1;
    
    const baseOvr = team.strength || _serieBaseOvr.A;
    // Reposição: OVR um pouco abaixo da média do time (mercado de reposição)
    const buyOvr = Math.max(50, baseOvr - 4 + Math.floor(Math.random() * 6));
    const newPlayers = [];
    
    for (let i = 0; i < neededCount; i++) {
      const p = generatePlayer(null, team.name, buyOvr, null, team.id);
      if (p) newPlayers.push({
        ...p,
        isStarting: false,
        goals: 0,
        assists: 0,
        energy: 90 + Math.floor(Math.random() * 10),
        injury: null,
      });
    }
    
    if (!newPlayers.length) return { team: { ...team, squad }, changed: false };
    return { team: { ...team, squad: [...squad, ...newPlayers] }, changed: true };
  };
  
  /**
   * processTransferActivity — chamado a cada rodada no hooks_simulation.
   * Retorna { leagues, teamRosters } atualizados.
   */
  const processTransferActivity = (leagues, teamRosters, round) => {
    const updRosters = { ...(teamRosters || {}) };
    const processPool = (pool, key) =>
      (pool || []).map(team => {
        if (team.isPlayer || team.id === 'user') return team;
        const { team: updTeam } = _processTeam(team, updRosters, round);
        if (updTeam.squad) updRosters[updTeam.id] = updTeam.squad;
        return updTeam;
      });
    
    return {
      leagues: {
        A: processPool(leagues?.A, 'A'),
        B: processPool(leagues?.B, 'B'),
        C: processPool(leagues?.C, 'C'),
        D: processPool(leagues?.D, 'D'),
      },
      teamRosters: updRosters,
    };
  };
  
  // ═══════════════════════════════════════════════════════════════
  // FEATURE 1 — CONTRATOS: AVISOS + RENOVAÇÃO
  // Gera mensagens no inbox quando contratos estão expirando.
  // Renovação custa 2x salário anual e adiciona 2 anos ao contrato.
  // ═══════════════════════════════════════════════════════════════
  
  const CONTRACT_WARN_ROUNDS = [2, 19]; // rodadas em que avisos são enviados
  
  /**
   * getContractWarnings — retorna array de mensagens de inbox para contratos expirando.
   * Filtra duplicatas com base em mensagens já existentes no inbox.
   */
  const getContractWarnings = (players, round, existingInbox) => {
    if (!CONTRACT_WARN_ROUNDS.includes(round)) return [];
    
    const existing = new Set((existingInbox || []).map(m => m.id));
    const msgs = [];
    
    players.forEach(p => {
      if ((p.contract ?? 2) > 1) return; // só avisa quem tem ≤ 1 ano
      const msgId = `contract_warn_${p.id}_r${round}`;
      if (existing.has(msgId)) return;
      
      const renewCost = Math.round((p.wage || 0) * 24); // 24 rodadas = ~1 temporada
      const isUrgent = (p.contract ?? 1) === 0;
      
      msgs.push({
        id: msgId,
        type: 'contract',
        from: 'Departamento de Futebol',
        subject: isUrgent ?
          `⚠️ CONTRATO EXPIRADO — ${p.name.split(' ').pop()} sairá em livre-arbítrio` :
          `📋 Contrato de ${p.name.split(' ').pop()} expira ao fim da temporada`,
        body: isUrgent ?
          `O contrato de ${p.name} (${p.position} · OVR ${p.overall}) expirou. Se não renovar antes do fim da temporada, ele sairá sem custo de transferência.` :
          `${p.name} (${p.position} · OVR ${p.overall} · ⚡${p.energy ?? 100}%) tem apenas 1 temporada de contrato restante.\nRenove por R$${(renewCost/1000).toFixed(0)}K (2 anos adicionais) ou perca-o ao final da temporada.`,
        round,
        read: false,
        actionData: {
          type: 'renew_contract',
          playerId: p.id,
          cost: renewCost,
          label: `Renovar por R$${(renewCost/1000).toFixed(0)}K`,
        },
      });
    });
    
    return msgs;
  };
  
  /**
   * applyContractRenewal — renova o contrato de um jogador.
   * Chame quando usuário aceitar proposta no inbox.
   * Retorna { players, club } atualizados.
   */
  const applyContractRenewal = (players, club, playerId, cost, rng = Math.random) => {
    if ((club.money || 0) < cost) return { players, club, error: 'Saldo insuficiente!' };

    const target = players.find(p => p.id === playerId);
    if (!target) return { players, club, error: 'Jogador não encontrado.' };

    const oldWage = target.wage || 0;
    const newWage = Math.round(oldWage * (1.10 + rng() * 0.10));
    const updPlayers = players.map(p =>
      p.id === playerId
        ? { ...p, contract: (p.contract || 1) + 2, wage: newWage }
        : p
    );

    return {
      players: updPlayers,
      club: {
        ...club,
        money: (club.money || 0) - cost,
        wage: updPlayers.reduce((sum, p) => sum + (p.wage || 0), 0),
      },
      error: null,
    };
  };
  
  /**
   * processSeasonEndDepartures — ao final da temporada, lista jogadores
   * que saíram por contrato expirado. (generateNextSeason já os remove;
   * esta função só monta o relatório para exibir ao jogador.)
   */
  const getSeasonEndDepartures = (players) =>
    players.filter(p => (p.contract ?? 1) <= 0 && !p.isStarting);

  /**
   * getFreeAgentsFromExpiredContracts — retorna jogadores de times CPU
   * cujo contrato expirou, para injetar no mercado livre.
   * Chamado a cada virada de temporada.
   */
  const getFreeAgentsFromExpiredContracts = (leagues, teamRosters) => {
    const freeAgents = [];
    const allTeams = [
      ...(leagues?.A || []), ...(leagues?.B || []),
      ...(leagues?.C || []), ...(leagues?.D || []),
    ];
    allTeams.forEach(team => {
      if (team.isPlayer || team.id === 'user') return;
      const squad = teamRosters?.[team.id] || team.squad || [];
      squad.forEach(p => {
        if ((p.contract ?? 2) <= 0) {
          freeAgents.push({ ...p, teamName: 'Livre', teamId: null,
            isStarting: false, isListed: true, goals: 0, assists: 0 });
        }
      });
    });
    return freeAgents.slice(0, 8); // máx 8 agentes livres no mercado por temporada
  };

  /**
   * processCpuToCpuTransfers — times CPU compram entre si.
   * Chance de 8% por rodada de cada time tentar contratar de outro time.
   * Simula movimentação real do mercado entre clubes.
   */
  const processCpuToCpuTransfers = (leagues, teamRosters, round) => {
    // Só acontece a cada 3 rodadas para não ser pesado
    if (round % 3 !== 0) return { leagues, teamRosters };

    const updRosters = { ...(teamRosters || {}) };
    const allTeams = [
      ...(leagues?.A || []), ...(leagues?.B || []),
      ...(leagues?.C || []), ...(leagues?.D || []),
    ].filter(t => !t.isPlayer && t.id !== 'user');

    const CPU_TRADE_CHANCE = 0.08;

    allTeams.forEach(buyer => {
      if (Math.random() > CPU_TRADE_CHANCE) return;
      const buyerSquad = updRosters[buyer.id] || buyer.squad || [];
      if (buyerSquad.length >= 28) return; // elenco cheio

      // Escolhe time vendedor aleatório diferente do comprador
      const sellers = allTeams.filter(t => t.id !== buyer.id);
      if (!sellers.length) return;
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const sellerSquad = updRosters[seller.id] || seller.squad || [];

      // Pega reserva listada ou com contrato expirando
      const available = sellerSquad.filter(p =>
        !p.isStarting && ((p.isListed) || (p.contract ?? 2) <= 1)
      );
      if (!available.length) return;

      const target = available[Math.floor(Math.random() * available.length)];

      // Executa a transferência nos rosters
      updRosters[seller.id] = sellerSquad.filter(p => p.id !== target.id);
      updRosters[buyer.id]  = [...buyerSquad, {
        ...target, teamName: buyer.name, teamId: buyer.id,
        isListed: false, contract: 2,
      }];
    });

    // Reconstrói leagues com squads atualizados
    const rebuildPool = (pool) => (pool || []).map(t =>
      updRosters[t.id] ? { ...t, squad: updRosters[t.id] } : t
    );

    return {
      leagues: {
        A: rebuildPool(leagues?.A),
        B: rebuildPool(leagues?.B),
        C: rebuildPool(leagues?.C),
        D: rebuildPool(leagues?.D),
      },
      teamRosters: updRosters,
    };
  };
  
  // ═══════════════════════════════════════════════════════════════
  // FEATURE 3 — MORAL: coeficientes por faixa
  // Usado pelo hooks_simulation para aplicar bônus/penalidade corretos.
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * getMoraleMultiplier — converte moral (0–100) em multiplicador de força.
   * Faixas:
   *   ≥ 85 → +8%   (time em chamas)
   *   ≥ 70 → +4%   (confiante)
   *   ≥ 55 → +0%   (neutro)
   *   ≥ 40 → -4%   (abatido)
   *   ≥ 25 → -8%   (em crise)
   *   < 25 → -13%  (colapso)
   */
  const getMoraleMultiplier = (morale) => {
    const m = morale ?? 60;
    if (m >= 85) return 1.08;
    if (m >= 70) return 1.04;
    if (m >= 55) return 1.00;
    if (m >= 40) return 0.96;
    if (m >= 25) return 0.92;
    return 0.87;
  };
  
  return {
    processTransferActivity,
    getContractWarnings,
    applyContractRenewal,
    getSeasonEndDepartures,
    getMoraleMultiplier,
    getFreeAgentsFromExpiredContracts,
    processCpuToCpuTransfers,
  };
})();

// ═══════════════════════════════════════════════════════════════
// JANELA DE TRANSFERÊNCIAS
// Rodadas abertas: 1-5 (jan) e 20-24 (jul) — estilo Brasileirão
// Fora da janela: compras de CPU bloqueadas, usuário também bloqueado
// ═══════════════════════════════════════════════════════════════

const TRANSFER_WINDOWS = [
  { open: 1, close: 5 }, // Janela de inverno
  { open: 20, close: 24 }, // Janela de verão
];

const MAX_SQUAD_SIZE = 30; // elenco máximo; acima disso compra bloqueada

CpuAI.isTransferWindowOpen = (round) => {
  return TRANSFER_WINDOWS.some(w => round >= w.open && round <= w.close);
};

CpuAI.getTransferWindowInfo = (round) => {
  const open = CpuAI.isTransferWindowOpen(round);
  if (open) {
    const w = TRANSFER_WINDOWS.find(w => round >= w.open && round <= w.close);
    return { open: true, closesIn: w.close - round, label: round <= 5 ? 'Janela de Inverno' : 'Janela de Verão' };
  }
  const next = TRANSFER_WINDOWS.find(w => w.open > round) || TRANSFER_WINDOWS[0];
  const opensIn = next.open > round ? next.open - round : (38 - round) + next.open;
  return { open: false, opensIn, label: next.open <= 5 ? 'Janela de Inverno' : 'Janela de Verão' };
};

CpuAI.MAX_SQUAD_SIZE = MAX_SQUAD_SIZE;
export default CpuAI;

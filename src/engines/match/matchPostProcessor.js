import { DisciplineEngine } from '../engine_discipline.js';
import { AcademyEngine } from '../engine_academy.js';
import { CpuAI } from '../engine_cpu_ai.js';
import { generatePlayer } from '../engine.js';
import { processFatigueAndInjuries } from '../../helpers.js';
import { accumulateMinutes, accumulateUserGoals } from './matchPlayerStats.js';

// Regras de domínio executadas após uma rodada de liga.
// O hook React apenas orquestra; este módulo cuida de jogadores, inbox,
// atividade da CPU, base e renovação do mercado.

export function processLeaguePlayers({ gameData, userMatchData, allRawEvents }) {
  let updatedPlayers = accumulateUserGoals(gameData.players, allRawEvents);
  updatedPlayers = accumulateMinutes(updatedPlayers);

  const userResult = userMatchData && (() => {
    const isHome = userMatchData.homeName === gameData.club.name;
    const myGoals = isHome ? (userMatchData.homeGoals || 0) : (userMatchData.awayGoals || 0);
    const oppGoals = isHome ? (userMatchData.awayGoals || 0) : (userMatchData.homeGoals || 0);
    return myGoals > oppGoals ? 'W' : myGoals < oppGoals ? 'L' : 'D';
  })();

  updatedPlayers = updatedPlayers.map(player => {
    let delta = 0;
    if (userResult === 'W') delta += player.isStarting ? 4 : 2;
    else if (userResult === 'L') delta -= player.isStarting ? 3 : 1;

    const scored = allRawEvents.filter(event =>
      event.type === 'goal' && event.isPlayer && event.scorerObj?.id === player.id
    ).length;
    delta += scored * 6;
    if (player.injury) delta -= 8;

    return {
      ...player,
      moralIndividual: Math.max(10, Math.min(100, (player.moralIndividual ?? 60) + delta)),
    };
  });

  if (DisciplineEngine?.clearSuspensionAndResetCards) {
    updatedPlayers = DisciplineEngine.clearSuspensionAndResetCards(
      updatedPlayers,
      gameData.round + 1,
    );
  }

  if (DisciplineEngine?.processMatchDisciplineEvents) {
    updatedPlayers = DisciplineEngine.processMatchDisciplineEvents(
      updatedPlayers,
      userMatchData?.events || [],
      gameData.round + 1,
      allRawEvents,
    );
  }

  const fatigueOptions = {
    difficultyMult: gameData.difficultyMultipliers?.fatigueLoss || 1.0,
    injuryChanceMult: gameData.difficultyMultipliers?.injuryChance || 1.0,
    isCupMatch: !!userMatchData?.isCupMatch,
  };

  if (processFatigueAndInjuries) {
    updatedPlayers = processFatigueAndInjuries(
      updatedPlayers,
      userMatchData?.events || null,
      fatigueOptions,
    );
  }

  return updatedPlayers;
}

export function processCpuTransfers(gameData) {
  const activity = CpuAI?.processTransferActivity
    ? CpuAI.processTransferActivity(gameData.leagues, gameData.teamRosters, gameData.round)
    : null;

  return activity && CpuAI?.processCpuToCpuTransfers
    ? CpuAI.processCpuToCpuTransfers(activity.leagues, activity.teamRosters, gameData.round)
    : activity;
}

export function progressAcademy(gameData) {
  if (!gameData.academy?.length) return gameData.academy;

  const nextRound = gameData.round + 1;
  if (nextRound % 8 !== 0) return gameData.academy;

  const level = gameData.club?.academyLevel || 'basic';
  const bonus = { basic: 0.3, advanced: 0.5, elite: 0.8 }[level] || 0.3;

  return gameData.academy.map(player => {
    const gap = Math.max(0, (player.potential || 70) - (player.overall || 50));
    if (gap <= 0) return player;

    const chance = player.trajectory === 'burst' ? 0.5 + bonus
      : player.trajectory === 'late' ? 0.2 + bonus * 0.5
        : 0.35 + bonus * 0.7;

    return Math.random() < chance
      ? { ...player, overall: Math.min(player.potential || 70, (player.overall || 50) + 1) }
      : player;
  });
}

export function buildPostMatchNotifications({
  gameData,
  userMatchData,
  updatedTable,
  updatedPlayers,
  allRawEvents,
}) {
  const nextRound = gameData.round + 1;

  const contractWarnings = CpuAI?.getContractWarnings
    ? CpuAI.getContractWarnings(gameData.players, nextRound, gameData.inbox || [])
    : [];

  const jornal = (() => {
    if (!userMatchData) return [];
    const isHome = userMatchData.homeName === gameData.club?.name;
    const myGoals = isHome ? (userMatchData.homeGoals || 0) : (userMatchData.awayGoals || 0);
    const oppGoals = isHome ? (userMatchData.awayGoals || 0) : (userMatchData.homeGoals || 0);
    const opponent = isHome ? userMatchData.awayName : userMatchData.homeName;
    const myPos = (updatedTable.findIndex ? updatedTable.findIndex(team => team.id === 'user') : -1) + 1;
    const leader = [...updatedTable].sort((a, b) => b.pts - a.pts)[0];

    let headline = '';
    if (myGoals >= 4) headline = `🗞️ GOLEADA! ${gameData.club?.name} massacra ${opponent} com ${myGoals}x${oppGoals}`;
    else if (myGoals > oppGoals && oppGoals === 0) headline = `🗞️ De Portão Fechado! ${gameData.club?.name} vence sem sofrer gols`;
    else if (myGoals > oppGoals) headline = `🗞️ Vitória importante! ${gameData.club?.name} bate ${opponent} por ${myGoals}x${oppGoals}`;
    else if (myGoals === oppGoals) headline = `🗞️ Empate no clássico entre ${gameData.club?.name} e ${opponent}`;
    else if (oppGoals >= 4) headline = `🗞️ Noite difícil! ${gameData.club?.name} é goleado por ${opponent}`;
    else headline = `🗞️ Derrota! ${opponent} vence ${gameData.club?.name} por ${oppGoals}x${myGoals}`;

    const leaderLine = leader && leader.id !== 'user' ? `\n\nNa liderança: ${leader.name} com ${leader.pts} pts.` : '';
    const posLine = myPos > 0 ? `\n${gameData.club?.name} está em ${myPos}º lugar.` : '';

    return [{
      id: `jornal_r${nextRound}`,
      icon: '🗞️',
      type: 'IMPRENSA',
      from: 'Tática Manager Sports',
      subject: headline,
      body: `${headline}${posLine}${leaderLine}\n\nRodada ${nextRound} do Brasileirão Série ${gameData.serie}.`,
      round: nextRound,
      read: false,
    }];
  })();

  const rumores = (() => {
    if (nextRound % 5 !== 0) return [];
    const listedOrStars = (gameData.players || []).filter(player => player.overall >= 72 && !player.isListed);
    if (!listedOrStars.length) return [];

    const target = listedOrStars[Math.floor(Math.random() * listedOrStars.length)];
    const cpuClubs = ['Flamengo', 'Palmeiras', 'Grêmio', 'São Paulo', 'Corinthians', 'Atlético MG', 'Botafogo', 'Vasco', 'Internacional', 'Athletico PR'];
    const candidates = cpuClubs.filter(club => club !== gameData.club?.name);
    const interested = candidates[Math.floor(Math.random() * candidates.length)];
    const offerEst = Math.round(target.value * (1.1 + Math.random() * 0.5) / 100000) * 100000;
    const formatMoney = value => value >= 1e6 ? `R$ ${(value / 1e6).toFixed(1)}M` : `R$ ${(value / 1e3).toFixed(0)}K`;

    return [{
      id: `rumor_r${nextRound}_${target.id}`,
      icon: '🗞️',
      type: 'RUMOR',
      from: 'Tática Manager Sports',
      subject: `🗞️ Rumor: ${interested} teria interesse em ${target.name.split(' ').pop()}`,
      body: `Segundo fontes da imprensa, o ${interested} estaria monitorando ${target.name} (${target.position} · OVR ${target.overall}).\n\nValor estimado da proposta: ${formatMoney(offerEst)}.\n\nNenhuma oferta formal chegou até o momento.`,
      round: nextRound,
      read: false,
    }];
  })();

  const objetivoDiretoria = (() => {
    if (nextRound % 5 !== 0 || nextRound < 10) return [];
    const myPos = (updatedTable.findIndex ? updatedTable.findIndex(team => team.id === 'user') : -1) + 1;
    const objective = gameData.seasonObjective || 'survive';
    const roundsRemaining = (gameData.fixtures?.length || 38) - nextRound;
    if (roundsRemaining < 5) return [];

    let msgId = null;
    let demand = null;
    if (objective === 'survive' && myPos >= 16) {
      msgId = `dir_survive_r${nextRound}`;
      demand = `Sair da zona de rebaixamento até a rodada ${nextRound + 5}`;
    }
    if (objective === 'promotion' && myPos > 6) {
      msgId = `dir_promo_r${nextRound}`;
      demand = `Entrar no G4 até a rodada ${nextRound + 5}`;
    }
    if (objective === 'champion' && myPos > 4) {
      msgId = `dir_champ_r${nextRound}`;
      demand = `Estar entre os 4 primeiros até a rodada ${nextRound + 5}`;
    }
    if (!msgId || (gameData.inbox || []).some(message => message.id === msgId)) return [];

    return [{
      id: msgId,
      icon: '🤝',
      type: 'DIRETORIA',
      from: 'Diretoria Executiva',
      subject: '⚠️ Cobrança da diretoria — desempenho abaixo do esperado',
      body: `${gameData.club?.name} está em ${myPos}º lugar.\n\nA diretoria exige: ${demand}.\n\nSe o objetivo não for cumprido, o orçamento de transferências será reduzido em 10%.`,
      round: nextRound,
      read: false,
      actionData: { type: 'warning', targetRound: nextRound + 5, targetPos: 4 },
    }];
  })();

  const pressaoTorcida = (() => {
    const fixtures = gameData.fixtures || [];
    let defeats = 0;
    for (let round = gameData.round - 1; round >= 0 && defeats < 3; round--) {
      const match = (fixtures[round] || []).find(item => item.home?.isPlayer || item.away?.isPlayer);
      if (!match || !match.played || !match.result) break;
      const [homeGoals, awayGoals] = (match.result || '0-0').split('-').map(value => parseInt(value) || 0);
      const myGoals = match.home?.isPlayer ? homeGoals : awayGoals;
      const oppGoals = match.home?.isPlayer ? awayGoals : homeGoals;
      if (myGoals < oppGoals) defeats++;
      else break;
    }
    if (defeats < 3) return [];

    const msgId = `torcida_press_r${nextRound}`;
    if ((gameData.inbox || []).some(message => message.id === msgId)) return [];

    return [{
      id: msgId,
      icon: '😤',
      type: 'TORCIDA',
      from: 'Movimento da Torcida',
      subject: '😤 Torcida pressiona após 3 derrotas seguidas',
      body: `A torcida do ${gameData.club?.name} está revoltada com a sequência de derrotas.\n\nO time perdeu os últimos 3 jogos e a pressão é grande.\n\nO clube precisa de uma reação urgente!`,
      round: nextRound,
      read: false,
    }];
  })();

  const lesaoTreino = (() => {
    if (Math.random() > 0.01) return { players: null, msg: null };
    const healthy = (gameData.players || []).filter(player => !player.injury && !player.isStarting);
    if (!healthy.length) return { players: null, msg: null };

    const victim = healthy[Math.floor(Math.random() * healthy.length)];
    return {
      playerId: victim.id,
      msg: {
        id: `treino_lesao_r${nextRound}`,
        icon: '🚑',
        type: 'DM',
        from: 'Departamento Médico',
        subject: `🚑 ${victim.name.split(' ').pop()} sofreu lesão leve no treino`,
        body: `O jogador ${victim.name} sofreu uma lesão leve durante o treinamento desta semana.\n\nPrevisão de retorno: 1-2 rodadas.\n\nO DM está acompanhando a evolução.`,
        round: nextRound,
        read: false,
      },
    };
  })();

  const academyNotifs = (() => {
    const academyPool = AcademyEngine.mergeProspectPools(gameData.academy, gameData.academyReady);
    if (!academyPool.length) return [];
    const promoteAge = AcademyEngine.PROMOTE_AGE || 18;
    const ready = academyPool.filter(player => (player.age || 0) >= promoteAge);
    if (!ready.length || nextRound % 10 !== 0) return [];

    const msgId = `academy_ready_r${nextRound}`;
    if ((gameData.inbox || []).some(message => message.id === msgId)) return [];

    return [{
      id: msgId,
      type: 'DIRETORIA',
      from: 'Coordenador de Base',
      subject: `⭐ ${ready.length} garoto(s) prontos para o profissional`,
      body: `Os seguintes garotos completaram 18 anos e estão aptos para promoção:\n\n${ready.map(player => `• ${player.name} — ${player.position} · OVR ${player.overall}`).join('\n')}\n\nAcesse a Categoria de Base para promovê-los.`,
      round: nextRound,
      read: false,
      actionData: { type: 'link', target: 'academy', label: 'VER CATEGORIA DE BASE' },
    }];
  })();

  const matchInjuryMsgs = updatedPlayers
    .filter(player => !!player.injury && !(gameData.players.find(old => old.id === player.id)?.injury))
    .map(player => ({
      id: `injury_r${nextRound}_${player.id}`,
      icon: '🚑',
      type: 'DM',
      from: 'Departamento Médico',
      subject: `🚑 ${player.name.split(' ').pop()} saiu lesionado`,
      body: `${player.name} saiu do jogo com ${player.injury?.type || 'lesão'} e está fora por aproximadamente ${player.injury?.roundsLeft ?? 1} rodada(s).\n\nJá removido da escalação titular. Ajuste o time.`,
      round: nextRound,
      read: false,
    }));

  const suspensionMsgs = updatedPlayers
    .filter(player => {
      const wasNotSuspended = !gameData.players.find(old => old.id === player.id)?.discipline?.suspendedUntilRound;
      const isNowSuspended = DisciplineEngine
        ? DisciplineEngine.isPlayerSuspended(player, nextRound)
        : player.discipline?.suspendedUntilRound != null && nextRound <= player.discipline.suspendedUntilRound;
      return wasNotSuspended && isNowSuspended;
    })
    .map(player => {
      const roundsLeft = player.discipline?.suspendedUntilRound
        ? player.discipline.suspendedUntilRound - nextRound + 1
        : 1;
      const isSecondYellow = allRawEvents.some(event => event.isPlayer && event.playerId === player.id && event.type === 'red_second_yellow');
      const isDirectRed = allRawEvents.some(event => event.isPlayer && event.playerId === player.id && event.type === 'red_direct');
      const reason = isDirectRed ? 'cartão vermelho direto'
        : isSecondYellow ? 'segundo amarelo'
          : '3 cartões amarelos acumulados';

      return {
        id: `susp_r${nextRound}_${player.id}`,
        icon: '🟥',
        type: 'DISCIPLINA',
        from: 'Comissão Disciplinar',
        subject: `🟥 ${player.name.split(' ').pop()} suspenso — ${roundsLeft} rodada(s)`,
        body: `${player.name} foi suspenso por ${reason}.\n\nFicará fora da próxima partida${roundsLeft > 1 ? ` e mais ${roundsLeft - 1}` : ''}.\n\nJá removido da escalação titular. Ajuste o time.`,
        round: nextRound,
        read: false,
      };
    });

  return {
    contractWarnings,
    jornal,
    rumores,
    objetivoDiretoria,
    pressaoTorcida,
    lesaoTreino,
    academyNotifs,
    matchInjuryMsgs,
    suspensionMsgs,
  };
}

export function preparePostMatchPlayers(prev, updatedPlayers, trainingInjury) {
  const nextRound = prev.round + 1;
  let players = trainingInjury.playerId
    ? updatedPlayers.map(player => player.id === trainingInjury.playerId
      ? {
          ...player,
          isStarting: false,
          injury: { type: 'Leve (Treino)', roundsLeft: 1 + Math.floor(Math.random() * 2) },
        }
      : player)
    : updatedPlayers;

  players = players.map(player => {
    if (!player.isStarting) return player;
    const isNowInjured = !!player.injury;
    const isNowSuspended = DisciplineEngine
      ? DisciplineEngine.isPlayerSuspended(player, nextRound)
      : player.discipline?.suspendedUntilRound !== null && nextRound <= player.discipline?.suspendedUntilRound;
    return isNowInjured || isNowSuspended ? { ...player, isStarting: false } : player;
  });

  return players;
}

export function refreshTransferMarket(prev) {
  const previousMarket = prev.market || [];
  const serie = prev.serie || 'A';
  const minOvr = serie === 'A' ? 68 : serie === 'B' ? 62 : serie === 'C' ? 55 : 48;
  const maxOvr = serie === 'A' ? 82 : serie === 'B' ? 74 : serie === 'C' ? 66 : 56;
  const newRound = prev.round + 1;

  const makePlayer = () => {
    const overall = minOvr + Math.floor(Math.random() * (maxOvr - minOvr));
    return generatePlayer ? generatePlayer(null, 'Livre', overall) : null;
  };

  let result = previousMarket
    .map(player => (!player || Math.random() < 0.35) ? makePlayer() : player)
    .filter(Boolean);

  if (newRound % 5 === 0) {
    const indices = [...Array(result.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    indices.forEach(index => {
      const player = makePlayer();
      if (player) result[index] = player;
    });
  }

  if (newRound % 8 === 0 && CpuAI?.getFreeAgentsFromExpiredContracts) {
    const freeAgents = CpuAI.getFreeAgentsFromExpiredContracts(prev.leagues, prev.teamRosters);
    freeAgents.forEach(freeAgent => {
      const worstIndex = result.reduce((best, player, index) =>
        (player?.overall || 99) < (result[best]?.overall || 99) ? index : best, 0);
      if ((freeAgent.overall || 0) > (result[worstIndex]?.overall || 0)) {
        result[worstIndex] = { ...freeAgent, teamName: 'Livre' };
      }
    });
  }

  return result;
}

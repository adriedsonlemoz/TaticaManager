import { AcademyEngine } from '../engine_academy.js';
import { CpuAI } from '../engine_cpu_ai.js';
import { DisciplineEngine } from '../engine_discipline.js';

const hasMessage = (gameData, id) => (gameData.inbox || []).some((message) => message?.id === id);
const lastName = (name = '') => String(name).trim().split(/\s+/).filter(Boolean).pop() || 'Jogador';
const clampIndex = (value, max) => Math.max(0, Math.min(max, value));

export function buildJournalNotification({ gameData, userMatchData, updatedTable, leagueRoundPlayed }) {
  if (!userMatchData) return [];
  const isHome = userMatchData.homeName === gameData.club?.name;
  const myGoals = isHome ? (userMatchData.homeGoals || 0) : (userMatchData.awayGoals || 0);
  const oppGoals = isHome ? (userMatchData.awayGoals || 0) : (userMatchData.homeGoals || 0);
  const opponent = isHome ? userMatchData.awayName : userMatchData.homeName;
  const myPos = (updatedTable || []).findIndex((team) => team.id === 'user') + 1;
  const leader = [...(updatedTable || [])].sort((a, b) => (b.pts || 0) - (a.pts || 0))[0];

  let headline = '';
  if (myGoals >= 4) headline = `🗞️ GOLEADA! ${gameData.club?.name} massacra ${opponent} com ${myGoals}x${oppGoals}`;
  else if (myGoals > oppGoals && oppGoals === 0) headline = `🗞️ De Portão Fechado! ${gameData.club?.name} vence sem sofrer gols`;
  else if (myGoals > oppGoals) headline = `🗞️ Vitória importante! ${gameData.club?.name} bate ${opponent} por ${myGoals}x${oppGoals}`;
  else if (myGoals === oppGoals) headline = `🗞️ Empate entre ${gameData.club?.name} e ${opponent}`;
  else if (oppGoals >= 4) headline = `🗞️ Noite difícil! ${gameData.club?.name} é goleado por ${opponent}`;
  else headline = `🗞️ Derrota! ${opponent} vence ${gameData.club?.name} por ${oppGoals}x${myGoals}`;

  const leaderLine = leader && leader.id !== 'user' ? `\n\nNa liderança: ${leader.name} com ${leader.pts} pts.` : '';
  const posLine = myPos > 0 ? `\n${gameData.club?.name} está em ${myPos}º lugar.` : '';
  return [{
    id: `jornal_r${leagueRoundPlayed}`,
    icon: '🗞️',
    type: 'IMPRENSA',
    from: 'Tática Manager Sports',
    subject: headline,
    body: `${headline}${posLine}${leaderLine}\n\nRodada ${leagueRoundPlayed} do Brasileirão Série ${gameData.serie}.`,
    round: leagueRoundPlayed,
    read: false,
  }];
}

export function buildRumorNotification({ gameData, leagueRoundPlayed, rng = Math.random }) {
  if (leagueRoundPlayed % 5 !== 0) return [];
  const stars = (gameData.players || []).filter((player) => player.overall >= 72 && !player.isListed);
  if (!stars.length) return [];

  const target = stars[clampIndex(Math.floor(rng() * stars.length), stars.length - 1)];
  const cpuClubs = ['Flamengo', 'Palmeiras', 'Grêmio', 'São Paulo', 'Corinthians', 'Atlético MG', 'Botafogo', 'Vasco', 'Internacional', 'Athletico PR'];
  const candidates = cpuClubs.filter((club) => club !== gameData.club?.name);
  if (!candidates.length) return [];
  const interested = candidates[clampIndex(Math.floor(rng() * candidates.length), candidates.length - 1)];
  const offerEst = Math.round(target.value * (1.1 + rng() * 0.5) / 100000) * 100000;
  const formatMoney = (value) => value >= 1e6 ? `R$ ${(value / 1e6).toFixed(1)}M` : `R$ ${(value / 1e3).toFixed(0)}K`;

  return [{
    id: `rumor_r${leagueRoundPlayed}_${target.id}`,
    icon: '🗞️', type: 'RUMOR', from: 'Tática Manager Sports',
    subject: `🗞️ Rumor: ${interested} teria interesse em ${lastName(target.name)}`,
    body: `Segundo fontes da imprensa, o ${interested} estaria monitorando ${target.name} (${target.position} · OVR ${target.overall}).\n\nValor estimado da proposta: ${formatMoney(offerEst)}.\n\nNenhuma oferta formal chegou até o momento.`,
    round: leagueRoundPlayed,
    read: false,
  }];
}

export function buildBoardObjectiveNotification({ gameData, updatedTable, leagueRoundPlayed, totalLeagueRounds }) {
  if (leagueRoundPlayed % 5 !== 0 || leagueRoundPlayed < 10) return [];
  const myPos = (updatedTable || []).findIndex((team) => team.id === 'user') + 1;
  const objective = gameData.seasonObjective || 'survive';
  if (totalLeagueRounds - leagueRoundPlayed < 5) return [];

  let msgId = null;
  let demand = null;
  let targetPos = null;
  if (objective === 'survive' && myPos >= 16) {
    msgId = `dir_survive_r${leagueRoundPlayed}`;
    demand = `Sair da zona de rebaixamento até a rodada ${leagueRoundPlayed + 5}`;
    targetPos = 16;
  } else if (objective === 'promotion' && myPos > 6) {
    msgId = `dir_promo_r${leagueRoundPlayed}`;
    demand = `Entrar no G4 até a rodada ${leagueRoundPlayed + 5}`;
    targetPos = 4;
  } else if (objective === 'champion' && myPos > 4) {
    msgId = `dir_champ_r${leagueRoundPlayed}`;
    demand = `Estar entre os 4 primeiros até a rodada ${leagueRoundPlayed + 5}`;
    targetPos = 4;
  }
  if (!msgId || hasMessage(gameData, msgId)) return [];

  return [{
    id: msgId,
    icon: '🤝', type: 'DIRETORIA', from: 'Diretoria Executiva',
    subject: '⚠️ Cobrança da diretoria — desempenho abaixo do esperado',
    body: `${gameData.club?.name} está em ${myPos}º lugar.\n\nA diretoria exige: ${demand}.\n\nSe o objetivo não for cumprido, o orçamento de transferências será reduzido em 10%.`,
    round: leagueRoundPlayed,
    read: false,
    actionData: { type: 'warning', targetRound: leagueRoundPlayed + 5, targetPos },
  }];
}

export function countConsecutiveLeagueDefeats(fixtures = [], leagueRoundPlayed = 0) {
  let defeats = 0;
  for (let index = Math.min(leagueRoundPlayed - 1, fixtures.length - 1); index >= 0 && defeats < 3; index -= 1) {
    const match = (fixtures[index] || []).find((item) => item?.home?.isPlayer || item?.away?.isPlayer);
    if (!match?.played || !match?.result) break;
    const [homeGoals, awayGoals] = String(match.result).split('-').map((value) => Number.parseInt(value, 10) || 0);
    const myGoals = match.home?.isPlayer ? homeGoals : awayGoals;
    const oppGoals = match.home?.isPlayer ? awayGoals : homeGoals;
    if (myGoals < oppGoals) defeats += 1;
    else break;
  }
  return defeats;
}

export function buildFanPressureNotification({ gameData, fixtures, leagueRoundPlayed }) {
  if (countConsecutiveLeagueDefeats(fixtures, leagueRoundPlayed) < 3) return [];
  const msgId = `torcida_press_r${leagueRoundPlayed}`;
  if (hasMessage(gameData, msgId)) return [];
  return [{
    id: msgId,
    icon: '😤', type: 'TORCIDA', from: 'Movimento da Torcida',
    subject: '😤 Torcida pressiona após 3 derrotas seguidas',
    body: `A torcida do ${gameData.club?.name} está revoltada com a sequência de derrotas.\n\nO time perdeu os últimos 3 jogos e a pressão é grande.\n\nO clube precisa de uma reação urgente!`,
    round: leagueRoundPlayed,
    read: false,
  }];
}

export function buildTrainingInjury({ updatedPlayers, leagueRoundPlayed, rng = Math.random }) {
  if (rng() > 0.01) return { playerId: null, msg: null };
  const healthyBench = (updatedPlayers || []).filter((player) => !player.injury && !player.isStarting);
  if (!healthyBench.length) return { playerId: null, msg: null };
  const victim = healthyBench[clampIndex(Math.floor(rng() * healthyBench.length), healthyBench.length - 1)];
  return {
    playerId: victim.id,
    msg: {
      id: `treino_lesao_r${leagueRoundPlayed}_${victim.id}`,
      icon: '🚑', type: 'DM', from: 'Departamento Médico',
      subject: `🚑 ${lastName(victim.name)} sofreu lesão leve no treino`,
      body: `O jogador ${victim.name} sofreu uma lesão leve durante o treinamento desta semana.\n\nPrevisão de retorno: 1-2 rodadas.\n\nO DM está acompanhando a evolução.`,
      round: leagueRoundPlayed,
      read: false,
    },
  };
}

export function buildAcademyNotifications({ gameData, leagueRoundPlayed }) {
  const academyPool = AcademyEngine.mergeProspectPools(gameData.academy, gameData.academyReady);
  if (!academyPool.length || leagueRoundPlayed % 10 !== 0) return [];
  const promoteAge = AcademyEngine.PROMOTE_AGE || 18;
  const ready = academyPool.filter((player) => (player.age || 0) >= promoteAge);
  if (!ready.length) return [];

  const msgId = `academy_ready_r${leagueRoundPlayed}`;
  if (hasMessage(gameData, msgId)) return [];
  return [{
    id: msgId,
    type: 'DIRETORIA', from: 'Coordenador de Base',
    subject: `⭐ ${ready.length} garoto(s) prontos para o profissional`,
    body: `Os seguintes garotos completaram 18 anos e estão aptos para promoção:\n\n${ready.map((player) => `• ${player.name} — ${player.position} · OVR ${player.overall}`).join('\n')}\n\nAcesse a Categoria de Base para promovê-los.`,
    round: leagueRoundPlayed,
    read: false,
    actionData: { type: 'link', target: 'academy', label: 'VER CATEGORIA DE BASE' },
  }];
}

export function buildMatchInjuryNotifications({ gameData, updatedPlayers, leagueRoundPlayed }) {
  const previousById = new Map((gameData.players || []).map((player) => [player.id, player]));
  return (updatedPlayers || [])
    .filter((player) => Boolean(player.injury) && !previousById.get(player.id)?.injury)
    .map((player) => ({
      id: `injury_r${leagueRoundPlayed}_${player.id}`,
      icon: '🚑', type: 'DM', from: 'Departamento Médico',
      subject: `🚑 ${lastName(player.name)} saiu lesionado`,
      body: `${player.name} saiu do jogo com ${player.injury?.type || 'lesão'} e está fora por aproximadamente ${player.injury?.roundsLeft ?? 1} rodada(s).\n\nJá removido da escalação titular. Ajuste o time.`,
      round: leagueRoundPlayed,
      read: false,
    }));
}

export function buildSuspensionNotifications({ gameData, updatedPlayers, allRawEvents, leagueRoundPlayed, nextCalendarRound }) {
  const previousById = new Map((gameData.players || []).map((player) => [player.id, player]));
  return (updatedPlayers || [])
    .filter((player) => {
      const previous = previousById.get(player.id);
      const wasSuspended = previous
        ? DisciplineEngine.isPlayerSuspended(previous, nextCalendarRound)
        : false;
      const isNowSuspended = DisciplineEngine.isPlayerSuspended(player, nextCalendarRound);
      return !wasSuspended && isNowSuspended;
    })
    .map((player) => {
      const roundsLeft = DisciplineEngine.getPlayerSuspensionRoundsLeft(player, nextCalendarRound) || 1;
      const playerEvents = (allRawEvents || []).filter((event) => event?.isPlayer && event?.playerId === player.id);
      const isSecondYellow = playerEvents.some((event) => event.type === 'red_second_yellow');
      const isDirectRed = playerEvents.some((event) => event.type === 'red_direct');
      const reason = isDirectRed ? 'cartão vermelho direto'
        : isSecondYellow ? 'segundo amarelo'
          : '3 cartões amarelos acumulados';
      return {
        id: `susp_r${leagueRoundPlayed}_${player.id}`,
        icon: '🟥', type: 'DISCIPLINA', from: 'Comissão Disciplinar',
        subject: `🟥 ${lastName(player.name)} suspenso — ${roundsLeft} rodada(s)`,
        body: `${player.name} foi suspenso por ${reason}.\n\nFicará fora da próxima partida${roundsLeft > 1 ? ` e mais ${roundsLeft - 1}` : ''}.\n\nJá removido da escalação titular. Ajuste o time.`,
        round: leagueRoundPlayed,
        read: false,
      };
    });
}

export function buildContractWarnings({ gameData, leagueRoundPlayed }) {
  return CpuAI?.getContractWarnings
    ? CpuAI.getContractWarnings(gameData.players || [], leagueRoundPlayed, gameData.inbox || [])
    : [];
}

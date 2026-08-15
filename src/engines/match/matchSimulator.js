import { FatigueEngine } from '../engine_fatigue.js';
import { CpuAI } from '../engine_cpu_ai.js';
import { calcCPUAvailableStrength, generateSquad } from '../engine.js';
import { diexDatabase } from '../../data/database.js';

// Motor puro de simulação de uma partida.
// Extraído de useMatchEngine para manter o hook focado em orquestração React.
export const simulateMatch = (gameData, match, tactics, starters, players) => {

  const _getRoster = (team, players) => {
    if (team.isPlayer) return players;
    // Prioridade: teamRosters (atualizado em tempo real) → squad do time → gera on-the-fly
    if (gameData.teamRosters?.[team.id]?.length) return gameData.teamRosters[team.id];
    if (team.squad?.length) return team.squad;
    // Fallback: gera squad mínimo com nomes reais para não usar "Jogador"
    if (generateSquad) {
      const serie = gameData.serie || 'A';
      return generateSquad(serie, team.name, team.strength || 70);
    }
    return [];
  };

  const _pickScorerFromRoster = (team, players, isPlayer) => {
    const roster = _getRoster(team, players);
    if (!roster.length) {
      // Último recurso: gera um jogador com nome real via database
      const db = diexDatabase;
      if (db) {
        const fn = db.firstNames[Math.floor(Math.random() * db.firstNames.length)];
        const ln = db.lastNames[Math.floor(Math.random() * db.lastNames.length)];
        return { id: `ghost_${team.id}`, name: `${fn} ${ln}`, position: 'ATA',
          overall: team.strength || 70, age: 24, value: 1500000, wage: 75000,
          teamId: team.id, teamName: team.name };
      }
      return { id: `ghost_${team.id}`, name: team.name, position: 'ATA',
        overall: team.strength || 70, teamId: team.id, teamName: team.name };
    }
    const attackers = roster.filter(p =>
      ['CA','PD','PE','MEI','ATA'].includes(p.position)
    );
    const pool = attackers.length > 0 ? attackers : roster;
    const scorer = pool[Math.floor(Math.random() * pool.length)];
    // Garante que o scorer tem teamId e teamName preenchidos
    return { ...scorer, teamId: scorer.teamId || team.id, teamName: scorer.teamName || team.name };
  };

  const home = match.home, away = match.away;
  let homeStr = home.strength || 70, awayStr = away.strength || 70;

  // #18 IA considera forma recente: aplica bônus/penalidade de ±4 OVR
  // baseado nos últimos 3 resultados do time (para times CPU com histórico)
  const _applyFormBonus = (team, baseStr) => {
    if (!team.recentForm || !team.recentForm.length) return baseStr;
    const wins = team.recentForm.filter(r => r === 'W').length;
    const losses = team.recentForm.filter(r => r === 'L').length;
    const bonus = (wins - losses) * 1.3; // ±1.3 por resultado, máx ±4
    return Math.max(40, Math.min(99, baseStr + Math.round(bonus)));
  };
  homeStr = _applyFormBonus(home, homeStr);
  awayStr = _applyFormBonus(away, awayStr);

  // FEATURE: bônus de estilo do técnico
  // Ofensivo → +3 ataque / -1 defesa | Defensivo → +3 defesa / -1 ataque | Equilibrado → neutro
  const _managerStyle = gameData.club?.managerProfile?.style || 'Equilibrado';
  const _styleAtk = _managerStyle === 'Ofensivo' ? 1.04 : _managerStyle === 'Defensivo' ? 0.97 : 1.0;
  const _styleDef = _managerStyle === 'Defensivo' ? 1.04 : _managerStyle === 'Ofensivo' ? 0.97 : 1.0;
  // ataque = governa a prob de gol do usuário; defesa = reduz prob do adversário
  // Aplicado como par (homeAtk, awayDef) ou (awayAtk, homeDef)

  // FEATURE 3: moraleMult calculado aqui mas aplicado DEPOIS do bloco de energia (abaixo)
  if (home.isPlayer) {
    const rawStr = FatigueEngine?.calcTeamStrength
      ? FatigueEngine.calcTeamStrength(starters, null, tactics.isValid)
      : Math.floor(starters.reduce((a, p) => a + Math.max(30, p.overall - (FatigueEngine?.getOverallPenalty(p.energy ?? 100) || 0)), 0) / Math.max(starters.length, 1)) - (tactics.isValid ? 0 : 8);
    homeStr = rawStr; // moraleMult aplicado abaixo
  } else if (away.isPlayer) {
    const rawStr = FatigueEngine?.calcTeamStrength
      ? FatigueEngine.calcTeamStrength(starters, null, tactics.isValid)
      : Math.floor(starters.reduce((a, p) => a + Math.max(30, p.overall - (FatigueEngine?.getOverallPenalty(p.energy ?? 100) || 0)), 0) / Math.max(starters.length, 1)) - (tactics.isValid ? 0 : 8);
    awayStr = rawStr; // moraleMult aplicado abaixo
  } else if (calcCPUAvailableStrength) {
    // #19 CPU vs CPU: ajustar por elenco indisponível
    homeStr = _applyFormBonus(home, calcCPUAvailableStrength(home, gameData.teamRosters, gameData.round));
    awayStr = _applyFormBonus(away, calcCPUAvailableStrength(away, gameData.teamRosters, gameData.round));
  }
  // #94 CPU fica mais forte com o passar das temporadas
  const _cpuBonus = gameData.difficultyMultipliers?.cpuStrengthBonus || 0;
  if (!home.isPlayer && _cpuBonus) homeStr = Math.min(99, homeStr + _cpuBonus);
  if (!away.isPlayer && _cpuBonus) awayStr = Math.min(99, awayStr + _cpuBonus);

  // #88 Energia afeta força real + FEATURE 3: moral aplicado AQUI (corrige bug de sobrescrita)
  // O bloco anterior calculava homeStr/awayStr com moraleMult mas este bloco sobrescrevia.
  // Agora moraleMult (via CpuAI.getMoraleMultiplier) é aplicado DEPOIS do cálculo de energia.
  // Também aplica _styleAtk/_styleDef do técnico.
  const _moraleMult = CpuAI?.getMoraleMultiplier
    ? CpuAI.getMoraleMultiplier(gameData.morale)
    : (1 + ((gameData.morale || 60) - 60) / 400);

  // Moral individual: média do moralIndividual dos titulares (0-100 → mult 0.95-1.05)
  const _individualMoraleMult = (() => {
    if (!starters.length) return 1.0;
    const avgIndividual = starters.reduce((s, p) => s + (p.moralIndividual ?? 60), 0) / starters.length;
    return 0.95 + (avgIndividual / 100) * 0.10; // range: 0.95 a 1.05
  })();

  if (home.isPlayer) {
    const rawStr = FatigueEngine?.calcTeamStrength
      ? FatigueEngine.calcTeamStrength(starters, null, tactics.isValid)
      : Math.floor(starters.reduce((a, p) => a + Math.max(30, p.overall - (FatigueEngine?.getOverallPenalty(p.energy ?? 100) || 0)), 0) / Math.max(starters.length, 1)) - (tactics.isValid ? 0 : 8);
    homeStr = Math.round(rawStr * _moraleMult * _individualMoraleMult * _styleAtk);
    awayStr = Math.round(awayStr * _styleDef);
  } else if (away.isPlayer) {
    const rawStr = FatigueEngine?.calcTeamStrength
      ? FatigueEngine.calcTeamStrength(starters, null, tactics.isValid)
      : Math.floor(starters.reduce((a, p) => a + Math.max(30, p.overall - (FatigueEngine?.getOverallPenalty(p.energy ?? 100) || 0)), 0) / Math.max(starters.length, 1)) - (tactics.isValid ? 0 : 8);
    awayStr = Math.round(rawStr * _moraleMult * _individualMoraleMult * _styleAtk);
    homeStr = Math.round(homeStr * _styleDef);
  }

  const total = homeStr + awayStr || 1;

  // Vantagem do mandante dinâmica:
  // Base 1.10, aumenta com a fanBase do clube mandante (pressão da torcida)
  // e diminui levemente quando o adversário tem grande torcida (barulho da visita)
  const _clubFanBase   = gameData.club?.fanLoyalty ? gameData.club.fanLoyalty / 100 : 0.5;
  const _oppFanBase    = (() => {
    const userIsHome = home.isPlayer;
    const oppTeamName = userIsHome ? away.name : home.name;
    const db = diexDatabase;
    const allTeams = [...(db?.serieATeams||[]),...(db?.serieBTeams||[]),...(db?.serieCTeams||[]),...(db?.serieDTeams||[])];
    const opp = allTeams.find(t => t.name === oppTeamName);
    return opp?.fanBase ?? 0.5;
  })();
  // HOME_ADV: 1.08 (base) + até 0.10 pela fidelidade da torcida mandante - 0.04 pela fanBase visitante
  const HOME_ADV = Math.min(1.25, 1.08 + (_clubFanBase * 0.10) - (_oppFanBase * 0.04));
  const adjHomeStr = homeStr * HOME_ADV;
  const adjAwayStr = awayStr;
  const adjTotal   = adjHomeStr + adjAwayStr || 1;

  // Média real Brasileirão 2024: 2.6 gols/jogo = 0.0144/min por time (total 0.0289)
  // Cada time recebe sua fração proporcional à força
  const homeGoalProb = (adjHomeStr / adjTotal) * 0.029;
  const awayGoalProb = (adjAwayStr / adjTotal) * 0.029;

  // Média real Brasileirão: ~3.5 amarelos/jogo TOTAL (ambos os times) = 0.0194/min TOTAL
  // Cada time recebe metade → 0.0097/min por time
  const yellowProb  = 0.0097;
  const redProb     = 0.00156; // ~0.28/jogo real (dois times juntos → ok)
  const penaltyProb = 0.003;   // ~0.27 pênaltis/jogo real (0.003 × 90 = 0.27)

  let homeGoals = 0, awayGoals = 0; const events = [], rawEvents = [];
  let _curHomeGoalProb = homeGoalProb;
  let _curAwayGoalProb = awayGoalProb;
  let _homeRed = 0, _awayRed = 0;
  let _homeYellowCount = 0, _awayYellowCount = 0; // #11 segundo amarelo
  let _halfTimeRecalcDone = false;
  // #10 IA tática CPU: rastrear placar para ajustar intensidade
  let _liveHomeGoals = 0, _liveAwayGoals = 0;
  // #4 Subs CPU: flag para fazer subs no 60-75
  let _cpuSubsDone = false;

  const goalPhrases    = ['⚽ GOL do','⚽ GOL! Que pintura do','⚽ GOL! Jogada ensaiada do','⚽ GOL! De cabeça para o','⚽ GOL! Um chutaço do'];
  const yellowPhrases  = ['🟨 Amarelo para','🟨 Falta tática de','🟨 Juiz marca falta dura e dá amarelo para'];
  const penaltyPhrases = ['🚨 PÊNALTI! Falta dentro da área marcada pelo árbitro','🚨 PÊNALTI! VAR confirmou a infração','🚨 PÊNALTI! Derrubado dentro da área'];
  const neutralPhrases = ['Boa troca de passes no meio-campo','Falta cobrada, nada de perigo','Lateral cobrado rapidamente','Goleiro segura com tranquilidade','Pressão alta da equipe visitante','Contra-ataque travado pela defesa','Tentativa de longe, por cima','VAR checando possível falta','Árbitro marca falta no campo de defesa','Escanteio afastado pela zaga'];

  for (let min = 1; min <= 90; min++) {
    // #10 IA tática CPU: no 2T, CPU que está perdendo "abre o jogo", ganhando "fecha"
    if (min === 60) {
      const userIsHome = home.isPlayer;
      const cpuDiff = userIsHome ? (_liveHomeGoals - _liveAwayGoals) : (_liveAwayGoals - _liveHomeGoals);
      if (cpuDiff <= -2) {
        // CPU perdendo por 2+: aumenta ataque +25%
        if (userIsHome) _curAwayGoalProb = _curAwayGoalProb * 1.25;
        else            _curHomeGoalProb = _curHomeGoalProb * 1.25;
      } else if (cpuDiff >= 2) {
        // CPU ganhando por 2+: fecha o jogo -15%
        if (userIsHome) _curAwayGoalProb = _curAwayGoalProb * 0.85;
        else            _curHomeGoalProb = _curHomeGoalProb * 0.85;
      }
    }

    // #4 Subs CPU: entre min 60-75, faz 1-2 subs do banco
    if (min >= 60 && min <= 75 && !_cpuSubsDone && Math.random() < 0.12) {
      _cpuSubsDone = true;
      const cpuTeam = home.isPlayer ? away : (away.isPlayer ? home : null);
      if (cpuTeam) {
        const cpuRoster = gameData.teamRosters?.[cpuTeam.id] || cpuTeam.squad || [];
        const cpuBench  = cpuRoster.filter(p => !p.isStarting).sort((a,b) => (b.overall||0)-(a.overall||0));
        const numSubs   = Math.random() < 0.5 ? 1 : 2;
        if (cpuBench.length > 0) {
          events.push(`${min}' 🔄 ${cpuTeam.name} faz ${numSubs === 1 ? 'uma substituição' : 'duas substituições'}.`);
          // Leve boost de força para o CPU (sub fresca)
          const boostMult = 1 + (numSubs * 0.02);
          if (cpuTeam.id === home.id) _curHomeGoalProb = Math.min(_curHomeGoalProb * boostMult, 0.08);
          else                         _curAwayGoalProb = Math.min(_curAwayGoalProb * boostMult, 0.08);
        }
      }
    }

    const r = Math.random();

    // GOL — casa
    if (r < _curHomeGoalProb) {
      const scorer = _pickScorerFromRoster(home, players, home.isPlayer);
      scorer.teamId = scorer.teamId || home.id; scorer.teamName = scorer.teamName || home.name;
      // #2 Gol contra: 3% dos gols são contra
      const isOwnGoal = Math.random() < 0.03;
      if (isOwnGoal) {
        awayGoals++; _liveAwayGoals++;
        events.push(`${min}' 😬 GOL CONTRA! ${scorer.name} manda para dentro do próprio gol! (${home.name})`);
        // Bug #3 fix: ownGoal=true, nenhum scorerObj (não creditar artilheiro)
        rawEvents.push({ min, type: 'own_goal', teamId: away.id, teamName: away.name, isPlayer: away.isPlayer, ownGoal: true, ownGoalBy: scorer.name, ownGoalTeamId: home.id });
      } else {
        homeGoals++; _liveHomeGoals++;
        events.push(`${min}' ${goalPhrases[Math.floor(Math.random() * goalPhrases.length)]} ${home.name}! (${scorer.name})`);
        rawEvents.push({ min, type: 'goal', teamId: home.id, teamName: home.name, isPlayer: home.isPlayer, scorer: scorer.name, scorerObj: scorer });
      }

    // GOL — fora
    } else if (r < _curHomeGoalProb + _curAwayGoalProb) {
      const scorer = _pickScorerFromRoster(away, players, away.isPlayer);
      scorer.teamId = scorer.teamId || away.id; scorer.teamName = scorer.teamName || away.name;
      const isOwnGoal = Math.random() < 0.03;
      if (isOwnGoal) {
        homeGoals++; _liveHomeGoals++;
        events.push(`${min}' 😬 GOL CONTRA! ${scorer.name} manda para dentro do próprio gol! (${away.name})`);
        // Bug #3 fix: ownGoal=true, nenhum scorerObj (não creditar artilheiro)
        rawEvents.push({ min, type: 'own_goal', teamId: home.id, teamName: home.name, isPlayer: home.isPlayer, ownGoal: true, ownGoalBy: scorer.name, ownGoalTeamId: away.id });
      } else {
        awayGoals++; _liveAwayGoals++;
        events.push(`${min}' ${goalPhrases[Math.floor(Math.random() * goalPhrases.length)]} ${away.name}! (${scorer.name})`);
        rawEvents.push({ min, type: 'goal', teamId: away.id, teamName: away.name, isPlayer: away.isPlayer, scorer: scorer.name, scorerObj: scorer });
      }

    // AMARELO — casa  (#11 segundo amarelo → vermelho)
    } else if (r < _curHomeGoalProb + _curAwayGoalProb + yellowProb) {
      const roster = _getRoster(home, players);
      const pl = roster.length ? roster[Math.floor(Math.random() * roster.length)] : { name: home.name, id: null };
      _homeYellowCount++;
      // Segundo amarelo: o jogador JÁ tinha 2 amarelos acumulados de partidas anteriores
      // (2 amarelos → este é o 3º → suspensão no Brasileirão)
      const prevYellows = pl.id
        ? (players.find(p => p.id === pl.id)?.discipline?.yellowCards || 0)
        : 0;
      const isSecondYellow = prevYellows >= 2 && Math.random() < 0.45;
      if (isSecondYellow) {
        events.push(`${min}' 🟨🟥 SEGUNDO AMARELO! ${pl.name} está EXPULSO! (${home.name})`);
        rawEvents.push({ min, type: 'red_second_yellow', teamId: home.id, isPlayer: home.isPlayer, playerName: pl.name, playerId: pl.id || null });
        _homeRed++;
        _curHomeGoalProb = homeGoalProb * Math.pow(0.88, _homeRed);
        _curAwayGoalProb = awayGoalProb * (1 + 0.08 * _homeRed);
      } else {
        events.push(`${min}' ${yellowPhrases[Math.floor(Math.random() * yellowPhrases.length)]} ${pl.name} (${home.name})`);
        rawEvents.push({ min, type: 'yellow', teamId: home.id, isPlayer: home.isPlayer, playerName: pl.name, playerId: pl.id || null });
      }

    // AMARELO — fora
    } else if (r < _curHomeGoalProb + _curAwayGoalProb + yellowProb * 2) {
      const roster = _getRoster(away, players);
      const pl = roster.length ? roster[Math.floor(Math.random() * roster.length)] : { name: away.name, id: null };
      _awayYellowCount++;
      const prevYellows = pl.id
        ? (players.find(p => p.id === pl.id)?.discipline?.yellowCards || 0)
        : 0;
      const isSecondYellow = prevYellows >= 2 && Math.random() < 0.45;
      if (isSecondYellow) {
        events.push(`${min}' 🟨🟥 SEGUNDO AMARELO! ${pl.name} está EXPULSO! (${away.name})`);
        rawEvents.push({ min, type: 'red_second_yellow', teamId: away.id, isPlayer: away.isPlayer, playerName: pl.name, playerId: pl.id || null });
        _awayRed++;
        _curAwayGoalProb = awayGoalProb * Math.pow(0.88, _awayRed);
        _curHomeGoalProb = homeGoalProb * (1 + 0.08 * _awayRed);
      } else {
        events.push(`${min}' ${yellowPhrases[Math.floor(Math.random() * yellowPhrases.length)]} ${pl.name} (${away.name})`);
        rawEvents.push({ min, type: 'yellow', teamId: away.id, isPlayer: away.isPlayer, playerName: pl.name, playerId: pl.id || null });
      }

    // VERMELHO DIRETO
    } else if (r > 1 - redProb) {
      const redForHome = Math.random() < 0.5;
      const redTeam = redForHome ? home : away;
      const roster  = _getRoster(redTeam, players);
      const pl = roster.length ? roster[Math.floor(Math.random() * roster.length)] : { name: redTeam.name, id: null };
      events.push(`${min}' 🟥 EXPULSO! Vermelho direto para ${pl.name} (${redTeam.name})`);
      rawEvents.push({ min, type: 'red_direct', teamId: redTeam.id, isPlayer: redTeam.isPlayer, playerName: pl.name, playerId: pl.id || null });
      if (redForHome) {
        _homeRed++;
        _curHomeGoalProb = homeGoalProb * Math.pow(0.88, _homeRed);
        _curAwayGoalProb = awayGoalProb * (1 + 0.08 * _homeRed);
      } else {
        _awayRed++;
        _curAwayGoalProb = awayGoalProb * Math.pow(0.88, _awayRed);
        _curHomeGoalProb = homeGoalProb * (1 + 0.08 * _awayRed);
      }

    // #1 PÊNALTI
    } else if (r > 1 - redProb - penaltyProb && r <= 1 - redProb) {
      const penForHome = Math.random() < (_curHomeGoalProb / (_curHomeGoalProb + _curAwayGoalProb + 0.001));
      const penTeam  = penForHome ? home : away;
      const penStr   = penForHome ? homeStr : awayStr;
      const convRate = Math.min(0.92, Math.max(0.60, 0.75 + (penStr - 70) / 100));
      const converted = Math.random() < convRate;
      const penPhrase = penaltyPhrases[Math.floor(Math.random() * penaltyPhrases.length)];
      if (converted) {
        const scorer = _pickScorerFromRoster(penTeam, players, penTeam.isPlayer);
        events.push(`${min}' ${penPhrase} — ⚽ CONVERTIDO por ${scorer.name}! (${penTeam.name})`);
        if (penForHome) { homeGoals++; _liveHomeGoals++; rawEvents.push({ min, type: 'penalty_goal', teamId: home.id, teamName: home.name, isPlayer: home.isPlayer, scorer: scorer.name, scorerObj: scorer }); }
        else            { awayGoals++; _liveAwayGoals++; rawEvents.push({ min, type: 'penalty_goal', teamId: away.id, teamName: away.name, isPlayer: away.isPlayer, scorer: scorer.name, scorerObj: scorer }); }
      } else {
        events.push(`${min}' ${penPhrase} — 🧤 DEFENDIDO! Goleiro salva! (${penTeam.name})`);
        rawEvents.push({ min, type: 'penalty_saved', teamId: penTeam.id, isPlayer: penTeam.isPlayer });
      }

    // LANCE NEUTRO
    } else if (Math.random() < 0.35) {
      const phrase = neutralPhrases[Math.floor(Math.random() * neutralPhrases.length)];
      const team   = Math.random() < 0.5 ? home : away;
      events.push(`${min}' ${phrase} (${team.name})`);
    }

    // Recalcular força no início do 2T (min 46) com subs do intervalo
    if (min === 46 && !_halfTimeRecalcDone) {
      _halfTimeRecalcDone = true;
      const userIsHome = home.isPlayer, userIsAway = away.isPlayer;
      if (userIsHome || userIsAway) {
        const currentStarters = (gameData.players || []).filter(p => p.isStarting);
        if (currentStarters.length > 0) {
          const newUserStr = FatigueEngine?.calcTeamStrength
            ? FatigueEngine.calcTeamStrength(currentStarters, null, tactics.isValid)
            : Math.round(currentStarters.reduce((s,p) => s + Math.max(30, p.overall - (FatigueEngine?.getOverallPenalty(p.energy ?? 100) || 0)), 0) / currentStarters.length);
          if (userIsHome) {
            const aH = Math.round(newUserStr * _moraleMult * _individualMoraleMult * _styleAtk);
            const aA = Math.round(awayStr * _styleDef * Math.pow(0.88, _awayRed));
            const nA = aH * HOME_ADV, nT = nA + aA || 1;
            _curHomeGoalProb = (nA / nT) * 0.029 * Math.pow(1 + 0.08 * _awayRed, 1);
            _curAwayGoalProb = (aA / nT) * 0.029 * Math.pow(0.88, _awayRed);
          } else {
            const aA = Math.round(newUserStr * _moraleMult * _individualMoraleMult * _styleAtk);
            const aH = Math.round(homeStr * _styleDef * Math.pow(0.88, _homeRed));
            const nA = aH * HOME_ADV, nT = nA + aA || 1;
            _curHomeGoalProb = (nA / nT) * 0.029 * Math.pow(0.88, _homeRed);
            _curAwayGoalProb = (aA / nT) * 0.029 * Math.pow(1 + 0.08 * _homeRed, 1);
          }
        }
      }
    }
  }
  events.push(`90'+ FIM DE JOGO: ${home.name} ${homeGoals} x ${awayGoals} ${away.name}`);

  // Posse dinâmica: proporcional à força efetiva dos times (não mais 50/50)
  const totalStr = adjHomeStr + adjAwayStr || 1;
  const homePoss = Math.round((adjHomeStr / totalStr) * 100);
  const awayPoss = 100 - homePoss;

  // Finalizações reais: ~5 chutes por gol + tentativas sem gol baseadas na posse
  const baseShots = 4 + Math.floor(Math.random() * 4); // 4-7 chutes não convertidos por time
  const homeShots = homeGoals + baseShots + Math.floor((homePoss - 50) / 10);
  const awayShots = awayGoals + baseShots + Math.floor((awayPoss - 50) / 10);
  const homeOnTarget = homeGoals + Math.floor(Math.random() * Math.max(1, Math.floor(homeShots * 0.35)));
  const awayOnTarget = awayGoals + Math.floor(Math.random() * Math.max(1, Math.floor(awayShots * 0.35)));

  return {
    homeGoals, awayGoals, events, rawEvents,
    homeShots: Math.max(homeGoals, homeShots),
    awayShots: Math.max(awayGoals, awayShots),
    homeOnTarget: Math.max(homeGoals, homeOnTarget),
    awayOnTarget: Math.max(awayGoals, awayOnTarget),
    homePoss, awayPoss,
  };
};


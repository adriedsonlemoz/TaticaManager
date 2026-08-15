// @migrated to ES module
import React from 'react';
import { FatigueEngine } from './engines/engine_fatigue.js';
import { InjuryEngine } from './engines/engine_injuries.js';


import { FORMATION_SLOTS, POSITION_COMPAT, canPlayAs, getLineupValidation } from './engines/lineup/lineupRules.js';
export { FORMATION_SLOTS, POSITION_COMPAT, canPlayAs, getLineupValidation };

// helpers.js — Funções auxiliares compartilhadas entre todos os componentes
// Evita duplicação de posColor/ovrColor em 4+ arquivos

export const posColor = (pos) => {
  if (pos === 'GOL') return { bg: '#c8920f', text: '#000' };
  if (pos === 'ZAG') return { bg: '#1565c0', text: '#fff' };
  if (pos === 'LD'  || pos === 'LE')  return { bg: '#0288d1', text: '#fff' };
  if (pos === 'VOL') return { bg: '#1b5e20', text: '#fff' };
  if (pos === 'MC')  return { bg: '#2e7d32', text: '#fff' };
  if (pos === 'MEI') return { bg: '#558b2f', text: '#fff' };
  if (pos === 'PD'  || pos === 'PE')  return { bg: '#bf360c', text: '#fff' };
  if (pos === 'CA')  return { bg: '#8b1212', text: '#fff' };
  // Compat com saves antigos
  if (pos === 'LAT') return { bg: '#0288d1', text: '#fff' };
  if (pos === 'ATA') return { bg: '#8b1212', text: '#fff' };
  return { bg: '#555', text: '#fff' };
};

export const ovrColor = (ovr) =>
  ovr >= 80 ? '#32a852' : ovr >= 70 ? '#b87a00' : '#941818';

export const getAgeColor = (age) => {
  if (age <= 21) return 'success';
  if (age >= 30) return 'warning';
  return 'primary';
};

// ── calculateMorale ───────────────────────────────────────
// FIX 10.1: decay aplicado SOMENTE quando ha resultados recentes (form.length > 0).
// Antes, o decay de -2 por "rodada sem dados" era aplicado mesmo em pré-temporada
// ou em saves sem histórico de partidas, fazendo o moral cair de 60 para 10 em
// poucos ciclos sem que o usuário tivesse jogado nenhuma partida ainda.
// Agora: sem resultados → mantém moral atual (queda simbólica de -1 apenas).
//        com resultados → decay proporcional ao número de jogos sem dados recentes.
export const calculateMorale = (gameData) => {
  if (!gameData) return 60;
  const fixtures = gameData.fixtures || [];
  const round    = gameData.round || 0;
  const form     = [];

  for (let r = round - 1; r >= 0 && form.length < 5; r--) {
    const rnd = fixtures[r];
    if (!rnd) continue;
    const m = rnd.find(mx => mx.home?.isPlayer || mx.away?.isPlayer);
    if (!m || !m.played || !m.result) continue;
    const [hg, ag] = (m.result || '0-0').split('-').map(n => parseInt(n) || 0);
    const myG  = m.home?.isPlayer ? hg : ag;
    const oppG = m.home?.isPlayer ? ag : hg;
    form.push(myG > oppG ? 3 : myG === oppG ? 1 : 0);
  }

  // FIX 10.1: sem nenhum resultado, aplica queda minima (-1) em vez de -2.
  // Preserva moral em pré-temporada e no início de saves novos.
  if (form.length === 0) return Math.max(10, (gameData.morale ?? 60) - 1);

  const pts  = form.reduce((s, v) => s + v, 0);
  const max  = form.length * 3;
  const base = 40;
  // FIX 10.1: decay proporcional só é aplicado quando há pelo menos 1 resultado.
  // Máximo de -4 (2 rodadas sem dados) em vez de -8 anterior (4 rodadas).
  const decay  = Math.max(0, 5 - form.length) * 1;
  const morale = Math.round(base + (pts / max) * 60) - decay;
  return Math.max(10, Math.min(100, morale));
};

// ── processFatigueAndInjuries ─────────────────────────────
// Aplica desgaste e verifica lesões após cada partida
// #26 #27 #28 #29 #30 #31 #66 #68 #69 #71 #84 #85
// FIX 3.1 + FIX 4: usa imports ES Module diretos; sem dependência de globals do navegador.
// Passa context como 4o param para rollForInjury para afinar gravidade da lesao.
export const processFatigueAndInjuries = (players, events, opts = {}) => {
  if (!players) return players;
  const { difficultyMult = 1.0, isCupMatch = false } = opts;

  const _InjuryEngine = InjuryEngine;
  const _FatigueEngine = FatigueEngine;

  return players.map(p => {
    // 1. Processar recuperacao de lesao
    let injury = p.injury;
    if (injury) {
      const recovered = _InjuryEngine
        ? _InjuryEngine.processRecovery(injury)
        : (injury.roundsLeft > 1 ? { ...injury, roundsLeft: injury.roundsLeft - 1 } : null);

      if (!recovered && _InjuryEngine?.rollRecaida) {
        const recaida = _InjuryEngine.rollRecaida(injury);
        injury = recaida || null;
      } else {
        injury = recovered;
      }
    }

    // 2. Calcular nova energia
    const newEnergy = _FatigueEngine
      ? _FatigueEngine.calculateNewEnergy(p, { difficultyMult, isCupMatch })
      : Math.min(100, Math.max(0, (p.energy ?? 100) + (p.isStarting ? -15 : 12)));

    // 3. Rolar lesao para titulares saudaveis
    if (!injury && p.isStarting) {
      const minutes = p.minutesPlayed || 0;
      const tookFoul = events && Array.isArray(events) && events.some(ev =>
        typeof ev === 'string' && ev.includes(p.name.split(' ').pop()) && ev.includes('🟨')
      );
      // FIX 3.1: context passado como 4o argumento — antes era omitido.
      const context = newEnergy < 35 ? 'fatigue' : tookFoul ? 'falta' : 'normal';

      const rolledInjury = _InjuryEngine
        ? _InjuryEngine.rollForInjury(newEnergy, difficultyMult, minutes, context)
        : null;

      if (rolledInjury) {
        injury = rolledInjury;
        if (_InjuryEngine?.addToHistory) {
          return _InjuryEngine.addToHistory(
            { ...p, energy: newEnergy, injury },
            rolledInjury,
            p._currentRound || 0
          );
        }
      }
    }

    return { ...p, energy: newEnergy, injury };
  });
};

// ── JerseyBadge — Camisa SVG ──────────────────────────────
// Camisa de futebol com silhueta real, gradiente da posição,
// número e tag de posição impressos no corpo.
// Usado em: ScreenSquad, ScreenLineup, ScreenMatchResult,
//           PlayerModal, ScreenMedical, ScreenNextMatch, ScreenAcademy
export const JerseyBadge = ({ pos, num, size = 44, showPos = true }) => {
  const POS_COLOR = {
    GOL: '#c8920f',
    ZAG: '#1d4ed8',
    LD:  '#0369a1', LE: '#0369a1',
    VOL: '#14532d', MC: '#15803d', MEI: '#15803d',
    PD:  '#9a3412', PE: '#9a3412', CA: '#b91c1c',
    // compat saves antigos
    LAT: '#0369a1', ATA: '#b91c1c',
  };
  const color = POS_COLOR[pos] || '#374151';

  // ViewBox fixo 48×52 — escalonado via width/height do SVG
  const W = 48, H = 52;
  // Camisa: corpo largo, mangas curtas, gola em V
  const shirtPath = 'M 0,12 L 13,5 L 19,11 L 24,9 L 29,11 L 35,5 L 48,12 L 48,22 L 38,19 L 38,49 L 10,49 L 10,19 L 0,22 Z';
  const uid = `jb_${pos}_${num}`;
  const numY   = 36;
  const posY   = 23;
  const numFs  = 15;
  const posFs  = 6.2;
  const shirtH = size * (H / W); // mantém proporção

  return React.createElement('svg', {
    viewBox: `0 0 ${W} ${H}`,
    width: size,
    height: shirtH,
    style: { flexShrink: 0, display: 'block', overflow: 'visible' },
  },
    // Gradiente
    React.createElement('defs', null,
      React.createElement('linearGradient', {
        id: `${uid}_g`, x1: '10%', y1: '0%', x2: '90%', y2: '100%',
      },
        React.createElement('stop', { offset: '0%',   stopColor: color, stopOpacity: '1' }),
        React.createElement('stop', { offset: '100%', stopColor: color, stopOpacity: '0.72' }),
      ),
      React.createElement('filter', { id: `${uid}_s`, x: '-12%', y: '-8%', width: '124%', height: '130%' },
        React.createElement('feDropShadow', {
          dx: '0', dy: '2', stdDeviation: '2',
          floodColor: color, floodOpacity: '0.38',
        }),
      ),
    ),
    // Corpo da camisa
    React.createElement('path', {
      d: shirtPath,
      fill: `url(#${uid}_g)`,
      filter: `url(#${uid}_s)`,
    }),
    // Brilho superior (reflexo)
    React.createElement('path', {
      d: 'M 0,12 L 13,5 L 19,11 L 24,9 L 29,11 L 35,5 L 48,12 L 48,22 L 38,19 L 38,28 L 10,28 L 10,19 L 0,22 Z',
      fill: 'rgba(255,255,255,0.13)',
    }),
    // Sombra interna das mangas (esq)
    React.createElement('line', { x1: '0', y1: '12', x2: '10', y2: '19', stroke: 'rgba(0,0,0,0.13)', strokeWidth: '1.8' }),
    // Sombra interna das mangas (dir)
    React.createElement('line', { x1: '48', y1: '12', x2: '38', y2: '19', stroke: 'rgba(0,0,0,0.13)', strokeWidth: '1.8' }),
    // Gola V
    React.createElement('path', {
      d: 'M 19,11 L 24,17 L 29,11',
      fill: 'none',
      stroke: 'rgba(0,0,0,0.22)',
      strokeWidth: '1.5',
      strokeLinejoin: 'round',
    }),
    // Tag de posição (acima do número)
    React.createElement('text', {
      x: W / 2, y: posY,
      textAnchor: 'middle', dominantBaseline: 'middle',
      fontSize: posFs, fontWeight: '900',
      fill: 'rgba(255,255,255,0.80)',
      fontFamily: 'Nunito, sans-serif',
      letterSpacing: '1.2',
    }, pos),
    // Número
    React.createElement('text', {
      x: W / 2, y: numY,
      textAnchor: 'middle', dominantBaseline: 'middle',
      fontSize: numFs, fontWeight: '900',
      fill: '#ffffff',
      fontFamily: 'Nunito, monospace',
    }, num ?? '?'),
  );
};

// ── SMR_parseEvent ────────────────────────────────────────
// Parser central de eventos de partida — carregado aqui (Helpers.js)
// para estar disponível antes de ScreenMatches.js e ScreenMatchResult.js.
export const SMR_parseEvent = (str) => {
  if (!str) return { type: 'neutral', player: null, minute: null, raw: str };
  const minute = str.match(/^(\d+)'/)?.[1] ? parseInt(str.match(/^(\d+)'/)[1]) : null;
  let type   = 'neutral';
  let player = null;

  if (str.includes('GOL') || str.includes('⚽')) {
    type   = 'goal';
    player = str.match(/\(([^)]+)\)/)?.[1] || null;
  } else if (str.includes('🟥') || str.includes('EXPULSO')) {
    type   = 'red';
    player = str.match(/para (.+?) \(/)?.[1]
           || str.match(/de (.+?) \(/)?.[1]
           || str.match(/EXPULSO! (?:Vermelho direto para )?(.+?) \(/)?.[1]
           || null;
  } else if (str.includes('🟨')) {
    type   = 'yellow';
    player = str.match(/para (.+?) \(/)?.[1]
           || str.match(/de (.+?) \(/)?.[1]
           || null;
  } else if (str.includes('FIM DE JOGO')) {
    type = 'end';
  } else if (str.includes('SUBSTITUIÇÃO') || str.includes('🔄')) {
    type = 'sub';
  }

  return { type, player, minute, raw: str };
};

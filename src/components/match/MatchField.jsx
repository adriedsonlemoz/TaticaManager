import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { JerseyBadge } from '../../helpers.js';

const C = THEME || {};

const MatchField = ({ gameData, isUserH, homeName, awayName, isLive, fieldEvent, ballPos, possession }) => {
  // Formação do usuário
  const userStarters  = (gameData?.players || []).filter(p => p.isStarting);
  const userFormation = gameData?.club?.formation || '4-4-2';

  // Layouts por formação: cada entrada tem { pos, x, y }
  // Campo 160×100: x=0..160 (comprimento), y=0..100 (largura)
  // Lado esquerdo = defesa do usuário (GOL x≈6), lado direito = ataque
  // Cada formação define exatamente 11 slots com a posição correta.
  // LAYOUTS: cada time ocupa SUA METADE do campo (viewBox 160×100)
  // Usuário: metade ESQUERDA (x: 5–74) atacando para direita
  // Adversário: metade DIREITA (x: 86–155) espelhado — GOL à direita
  const LAYOUTS = {
    '4-4-2': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'LD',  x:20, y:12 }, { pos:'ZAG', x:20, y:36 },
      { pos:'ZAG', x:20, y:64 }, { pos:'LE',  x:20, y:88 },
      { pos:'PD',  x:44, y:20 }, { pos:'VOL', x:44, y:40 },
      { pos:'VOL', x:44, y:60 }, { pos:'PE',  x:44, y:80 },
      { pos:'CA',  x:66, y:36 }, { pos:'CA',  x:66, y:64 },
    ],
    '4-3-3': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'LD',  x:20, y:12 }, { pos:'ZAG', x:20, y:36 },
      { pos:'ZAG', x:20, y:64 }, { pos:'LE',  x:20, y:88 },
      { pos:'VOL', x:42, y:24 }, { pos:'MC',  x:42, y:50 }, { pos:'MEI', x:42, y:76 },
      { pos:'PD',  x:66, y:16 }, { pos:'CA',  x:66, y:50 }, { pos:'PE',  x:66, y:84 },
    ],
    '4-2-3-1': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'LD',  x:18, y:12 }, { pos:'ZAG', x:18, y:36 },
      { pos:'ZAG', x:18, y:64 }, { pos:'LE',  x:18, y:88 },
      { pos:'VOL', x:36, y:36 }, { pos:'VOL', x:36, y:64 },
      { pos:'PD',  x:54, y:16 }, { pos:'MEI', x:54, y:50 }, { pos:'PE',  x:54, y:84 },
      { pos:'CA',  x:70, y:50 },
    ],
    '3-5-2': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'ZAG', x:20, y:22 }, { pos:'ZAG', x:20, y:50 }, { pos:'ZAG', x:20, y:78 },
      { pos:'LD',  x:42, y:8  }, { pos:'VOL', x:42, y:30 },
      { pos:'MC',  x:42, y:50 }, { pos:'VOL', x:42, y:70 }, { pos:'LE',  x:42, y:92 },
      { pos:'CA',  x:66, y:36 }, { pos:'CA',  x:66, y:64 },
    ],
    '5-3-2': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'LD',  x:18, y:8  }, { pos:'ZAG', x:18, y:28 },
      { pos:'ZAG', x:18, y:50 }, { pos:'ZAG', x:18, y:72 }, { pos:'LE',  x:18, y:92 },
      { pos:'VOL', x:44, y:26 }, { pos:'MC',  x:44, y:50 }, { pos:'VOL', x:44, y:74 },
      { pos:'CA',  x:66, y:36 }, { pos:'CA',  x:66, y:64 },
    ],
    '3-4-3': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'ZAG', x:18, y:22 }, { pos:'ZAG', x:18, y:50 }, { pos:'ZAG', x:18, y:78 },
      { pos:'LD',  x:40, y:12 }, { pos:'VOL', x:40, y:38 },
      { pos:'VOL', x:40, y:62 }, { pos:'LE',  x:40, y:88 },
      { pos:'PD',  x:66, y:16 }, { pos:'CA',  x:66, y:50 }, { pos:'PE',  x:66, y:84 },
    ],
    '4-1-4-1': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'LD',  x:18, y:12 }, { pos:'ZAG', x:18, y:36 },
      { pos:'ZAG', x:18, y:64 }, { pos:'LE',  x:18, y:88 },
      { pos:'VOL', x:36, y:50 },
      { pos:'PD',  x:54, y:12 }, { pos:'MC',  x:54, y:38 },
      { pos:'MC',  x:54, y:62 }, { pos:'PE',  x:54, y:88 },
      { pos:'CA',  x:70, y:50 },
    ],
    '4-5-1': [
      { pos:'GOL', x:5,  y:50 },
      { pos:'LD',  x:18, y:12 }, { pos:'ZAG', x:18, y:36 },
      { pos:'ZAG', x:18, y:64 }, { pos:'LE',  x:18, y:88 },
      { pos:'PD',  x:42, y:8  }, { pos:'VOL', x:42, y:30 },
      { pos:'MC',  x:42, y:50 }, { pos:'VOL', x:42, y:70 }, { pos:'PE',  x:42, y:92 },
      { pos:'CA',  x:66, y:50 },
    ],
  };

  // Mapeamento de jogador → slot: para cada slot, pega o jogador com
  // a posição correspondente que ainda não foi alocado.
  const layout = LAYOUTS[userFormation] || LAYOUTS['4-4-2'];
  const playersByPos = {};
  userStarters.forEach(p => {
    if (!playersByPos[p.position]) playersByPos[p.position] = [];
    playersByPos[p.position].push(p);
  });
  const usedIds = new Set();

  const userDots = layout.map((slot, slotIndex) => {
    const candidates = (playersByPos[slot.pos] || []).filter(p => !usedIds.has(p.id));
    // Fallback: qualquer jogador disponível
    const pool = candidates.length > 0
      ? candidates
      : userStarters.filter(p => !usedIds.has(p.id));
    if (!pool.length) return null;
    const p = pool[0];
    usedIds.add(p.id);
    return { x: slot.x, y: slot.y, name: p.name.split(' ').pop().slice(0,7), pos: p.position, shirt: p.shirt ?? (slotIndex + 1) };
  }).filter(Boolean);

  // Adversário: espelhado em relação à linha do meio (x=80)
  const mirrorX = (x) => 160 - x;
  const oppLayout = LAYOUTS['4-4-2'];

  const oppName    = isUserH ? awayName : homeName;
  const oppTeam    = gameData?.teams?.find(t => t.name === oppName)
                  || gameData?.leagues?.A?.find(t => t.name === oppName)
                  || gameData?.leagues?.B?.find(t => t.name === oppName)
                  || gameData?.leagues?.C?.find(t => t.name === oppName)
                  || gameData?.leagues?.D?.find(t => t.name === oppName);
  const oppSquadRaw = gameData?.teamRosters?.[oppTeam?.id] || oppTeam?.squad || [];
  const oppStartersRaw = oppSquadRaw.filter(p => p.isStarting).length > 0
    ? oppSquadRaw.filter(p => p.isStarting)
    : oppSquadRaw.sort((a,b) => (b.overall||0)-(a.overall||0)).slice(0,11);

  const oppByPos = {};
  oppStartersRaw.forEach(p => {
    if (!oppByPos[p.position]) oppByPos[p.position] = []
    oppByPos[p.position].push(p);
  });
  const usedOppIds = new Set();

  const oppDots = oppLayout.map((slot, slotIndex) => {
    const candidates = (oppByPos[slot.pos] || []).filter(p => !usedOppIds.has(p.id));
    const pool = candidates.length > 0
      ? candidates
      : oppStartersRaw.filter(p => !usedOppIds.has(p.id));
    if (!pool.length) return null;
    const p = pool[0];
    usedOppIds.add(p.id);
    // opp sempre na direita (espelhado) — depois aplicamos swap se user for visitante
    return { x: mirrorX(slot.x), y: slot.y, name: p.name.split(' ').pop().slice(0,7), pos: p.position, shirt: p.shirt ?? (slotIndex + 1) };
  }).filter(Boolean);

  // ── CORREÇÃO DE LADO: mandante à esquerda, visitante à direita ──
  // Se o user é VISITANTE (isUserH=false), ele deve ficar na DIREITA do campo,
  // e o adversário (que é o mandante) fica na ESQUERDA.
  const userDotsPositioned = userDots.map(d => ({
    ...d, x: isUserH ? d.x : mirrorX(d.x),
  }));
  const oppDotsPositioned = oppDots.map(d => ({
    ...d, x: isUserH ? d.x : (160 - d.x), // 160 - mirrorX(orig) = orig → volta para esquerda
  }));

  // Formações para exibir abaixo do campo
  const homeFormation = isUserH ? userFormation : '4-4-2';
  const awayFormation = isUserH ? '4-4-2'        : userFormation;
  const homeLabel     = isUserH ? homeName        : homeName;
  const awayLabel     = isUserH ? awayName         : awayName;

  return (
    <Box sx={{ borderRadius:'10px', overflow:'hidden', border:`1px solid rgba(255,255,255,0.07)`, mb:1 }}>
      <Box sx={{ position:'relative', width:'100%' }}>
        {/* viewBox 160×100 = proporção 1.6:1 de campo de futebol real */}
        <svg viewBox="0 0 160 100" style={{ width:'100%', display:'block' }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="smrfg2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1b6b1b"/>
              <stop offset="100%" stopColor="#0f4010"/>
            </linearGradient>
          </defs>
          <rect width="160" height="100" fill="url(#smrfg2)"/>
          {/* Listras verticais de grama */}
          {[0,1,2,3,4,5,6,7].map(i=>(
            <rect key={i} x={i*20} y="0" width="20" height="100" fill={i%2===0?'rgba(255,255,255,0.018)':'transparent'}/>
          ))}
          {/* Borda do campo */}
          <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" rx="1"/>
          {/* Linha do meio */}
          <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
          {/* Círculo central */}
          <circle cx="80" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
          <circle cx="80" cy="50" r="1.2" fill="rgba(255,255,255,0.65)"/>
          {/* Área grande esquerda */}
          <rect x="2" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
          {/* Área pequena esquerda */}
          <rect x="2" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
          {/* Pênalti esq */}
          <circle cx="14" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
          {/* Arco da área esq */}
          <path d="M 20 38 A 14 14 0 0 1 20 62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
          {/* Área grande direita */}
          <rect x="140" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
          {/* Área pequena direita */}
          <rect x="150" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
          {/* Pênalti dir */}
          <circle cx="146" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
          {/* Arco da área dir */}
          <path d="M 140 38 A 14 14 0 0 0 140 62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
          {/* Goleiras */}
          <rect x="2" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
          <rect x="154" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
          {/* Bola ao vivo */}
          {isLive && !fieldEvent && (
            <circle cx={(ballPos.x/300)*160} cy={(ballPos.y/110)*100} r="2.8" fill="white" opacity="0.92">
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1s" repeatCount="indefinite"/>
            </circle>
          )}
          {/* Evento de campo */}
          {fieldEvent && (() => {
            const cfg = {goal:{c:'#16a34a',icon:'⚽'},red:{c:'#f85149',icon:'🟥'},yellow:{c:'#f0a500',icon:'🟨'}}[fieldEvent.type];
            const fx = (fieldEvent.x/300)*160, fy = (fieldEvent.y/110)*100;
            return (
              <g>
                <circle cx={fx} cy={fy} r="5" fill={cfg.c} opacity="0.88">
                  <animate attributeName="r" values="3;7;3" dur="0.5s" repeatCount="4"/>
                  <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.5s" repeatCount="4"/>
                </circle>
                <text x={fx} y={fy+1} textAnchor="middle" dominantBaseline="middle" fontSize="5">{cfg.icon}</text>
              </g>
            );
          })()}
        </svg>

        {/* ── HTML overlay: camisas SVG dos jogadores ── */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {userDotsPositioned.map((d, i) => {
            const JB = JerseyBadge;
            return (
              <Box key={`u${i}`} sx={{
                position: 'absolute',
                left: `${(d.x / 160) * 100}%`,
                top:  `${(d.y / 100) * 100}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                {JB && React.createElement(JB, { pos: d.pos, num: d.shirt, size: 20 })}
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '3px', px: '2.5px', py: '1px', mt: '1px', backdropFilter: 'blur(2px)' }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.3rem', fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {d.name}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          {oppDotsPositioned.map((d, i) => {
            const JB = JerseyBadge;
            return (
              <Box key={`o${i}`} sx={{
                position: 'absolute',
                left: `${(d.x / 160) * 100}%`,
                top:  `${(d.y / 100) * 100}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                {JB && React.createElement(JB, { pos: d.pos, num: d.shirt, size: 20 })}
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '3px', px: '2.5px', py: '1px', mt: '1px', backdropFilter: 'blur(2px)' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.3rem', fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
                    {d.name}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
      {/* ── Formações dos times ── */}
      <Box sx={{ px:1.2, py:0.55, bgcolor:'rgba(0,0,0,0.35)', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
          <Typography sx={{ color: isUserH ? C.green : C.txt3, fontWeight:900, fontSize:'0.5rem', maxWidth:60, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
            {homeLabel.substring(0,12)}
          </Typography>
          <Box sx={{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:'4px', px:0.6, py:0.15 }}>
            <Typography sx={{ color:'rgba(255,255,255,0.85)', fontWeight:900, fontSize:'0.5rem', letterSpacing:0.3 }}>
              {homeFormation}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ color:'rgba(255,255,255,0.25)', fontSize:'0.42rem', fontWeight:700 }}>FORMAÇÕES</Typography>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
          <Box sx={{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:'4px', px:0.6, py:0.15 }}>
            <Typography sx={{ color:'rgba(255,255,255,0.85)', fontWeight:900, fontSize:'0.5rem', letterSpacing:0.3 }}>
              {awayFormation}
            </Typography>
          </Box>
          <Typography sx={{ color: !isUserH ? C.green : C.txt3, fontWeight:900, fontSize:'0.5rem', maxWidth:60, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
            {awayLabel.substring(0,12)}
          </Typography>
        </Box>
      </Box>
      {/* Barra de posse */}
      <Box sx={{ px:1.5, py:0.6, bgcolor:C.possessionBg, display:'flex', flexDirection:'column', gap:0.3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Typography sx={{ color:C.green, fontWeight:900, fontSize:'0.6rem' }}>{homeName.substring(0,14)} {possession.home}%</Typography>
          <Typography sx={{ color:C.txt3, fontWeight:700, fontSize:'0.5rem', letterSpacing:1 }}>POSSE</Typography>
          <Typography sx={{ color:C.blue, fontWeight:900, fontSize:'0.6rem' }}>{possession.away}% {awayName.substring(0,14)}</Typography>
        </Box>
        <Box sx={{ height:4, bgcolor:C.cardAlt, borderRadius:2, overflow:'hidden' }}>
          <Box sx={{ height:'100%', width:`${possession.home}%`, bgcolor:C.green, transition:'width 0.9s ease', borderRadius:2 }}/>
        </Box>
      </Box>
    </Box>
  );
};

export default MatchField;

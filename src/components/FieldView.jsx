/**
 * FieldView.jsx — Componente compartilhado de campo tático (portrait)
 * Extraído de ScreenSquad e ScreenLineup para eliminar duplicação (~150 linhas).
 *
 * Props:
 *   starters       — array de jogadores titulares
 *   formation      — string de formação (ex: '4-4-2')
 *   teamOvr        — OVR médio do time (number)
 *   gameData       — objeto gameData (para verificação de rodada)
 *   onPlayerClick  — (player) => void  — callback ao clicar num jogador
 *   C              — objeto de tema (cores)
 *   DisciplineEngine — engine importado de engine_discipline
 *   JerseyBadge    — componente badge de camisa
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

export const FIELD_LAYOUTS = {
  '4-4-2': [
    { role: 'GOL', x: 50, y: 126 },
    { role: 'LD',  x: 8,  y: 102 }, { role: 'ZAG', x: 31, y: 100 },
    { role: 'ZAG', x: 69, y: 100 }, { role: 'LE',  x: 92, y: 102 },
    { role: 'PD',  x: 8,  y: 73  }, { role: 'VOL', x: 33, y: 72  },
    { role: 'VOL', x: 67, y: 72  }, { role: 'PE',  x: 92, y: 73  },
    { role: 'CA',  x: 34, y: 36  }, { role: 'CA',  x: 66, y: 36  },
  ],
  '4-3-3': [
    { role: 'GOL', x: 50, y: 126 },
    { role: 'LD',  x: 8,  y: 102 }, { role: 'ZAG', x: 31, y: 100 },
    { role: 'ZAG', x: 69, y: 100 }, { role: 'LE',  x: 92, y: 102 },
    { role: 'VOL', x: 20, y: 72  }, { role: 'MC',  x: 50, y: 70  }, { role: 'MEI', x: 80, y: 72 },
    { role: 'PD',  x: 14, y: 32  }, { role: 'CA',  x: 50, y: 28  }, { role: 'PE',  x: 86, y: 32 },
  ],
  '4-2-3-1': [
    { role: 'GOL', x: 50, y: 126 },
    { role: 'LD',  x: 8,  y: 102 }, { role: 'ZAG', x: 31, y: 100 },
    { role: 'ZAG', x: 69, y: 100 }, { role: 'LE',  x: 92, y: 102 },
    { role: 'VOL', x: 33, y: 78  }, { role: 'VOL', x: 67, y: 78  },
    { role: 'PD',  x: 12, y: 55  }, { role: 'MEI', x: 50, y: 53  }, { role: 'PE',  x: 88, y: 55 },
    { role: 'CA',  x: 50, y: 26  },
  ],
  '3-5-2': [
    { role: 'GOL', x: 50, y: 126 },
    { role: 'ZAG', x: 22, y: 102 }, { role: 'ZAG', x: 50, y: 100 }, { role: 'ZAG', x: 78, y: 102 },
    { role: 'LD',  x: 5,  y: 74  }, { role: 'VOL', x: 28, y: 73  },
    { role: 'MC',  x: 50, y: 72  }, { role: 'VOL', x: 72, y: 73  }, { role: 'LE',  x: 95, y: 74 },
    { role: 'CA',  x: 33, y: 36  }, { role: 'CA',  x: 67, y: 36  },
  ],
  '3-4-3': [
    { role: 'GOL', x: 50, y: 126 },
    { role: 'ZAG', x: 22, y: 102 }, { role: 'ZAG', x: 50, y: 100 }, { role: 'ZAG', x: 78, y: 102 },
    { role: 'LD',  x: 8,  y: 74  }, { role: 'VOL', x: 34, y: 72  },
    { role: 'VOL', x: 66, y: 72  }, { role: 'LE',  x: 92, y: 74  },
    { role: 'PD',  x: 16, y: 34  }, { role: 'CA',  x: 50, y: 28  }, { role: 'PE',  x: 84, y: 34 },
  ],
  '5-3-2': [
    { role: 'GOL', x: 50, y: 126 },
    { role: 'LD',  x: 5,  y: 104 }, { role: 'ZAG', x: 24, y: 101 },
    { role: 'ZAG', x: 50, y: 100 }, { role: 'ZAG', x: 76, y: 101 }, { role: 'LE', x: 95, y: 104 },
    { role: 'VOL', x: 22, y: 72  }, { role: 'MC',  x: 50, y: 70  }, { role: 'VOL', x: 78, y: 72 },
    { role: 'CA',  x: 34, y: 36  }, { role: 'CA',  x: 66, y: 36  },
  ],
};

export const POSITION_LEGEND = [
  { pos: 'GOL', label: 'Goleiro',    color: '#c8920f' },
  { pos: 'ZAG', label: 'Zagueiro',   color: '#1d4ed8' },
  { pos: 'LD',  label: 'Lat. Dir.',  color: '#0369a1' },
  { pos: 'LE',  label: 'Lat. Esq.',  color: '#0369a1' },
  { pos: 'VOL', label: 'Volante',    color: '#14532d' },
  { pos: 'MC',  label: 'Meio Cent.', color: '#15803d' },
  { pos: 'MEI', label: 'Meia Of.',   color: '#166534' },
  { pos: 'PD',  label: 'Ponta Dir.', color: '#9a3412' },
  { pos: 'PE',  label: 'Ponta Esq.', color: '#9a3412' },
  { pos: 'CA',  label: 'Centroav.',  color: '#b91c1c' },
];

/**
 * FieldPitch — apenas o SVG do gramado (reutilizável isoladamente)
 */
export const FieldPitch = ({ VW = 100, VH = 140, gradientId = 'fv_field_g' }) => (
  <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', display: 'block' }}>
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#1b6b1b"/>
        <stop offset="50%"  stopColor="#155215"/>
        <stop offset="100%" stopColor="#0e3d0e"/>
      </linearGradient>
    </defs>
    <rect width={VW} height={VH} fill={`url(#${gradientId})`}/>
    {[0,1,2,3,4,5,6].map(i => (
      <rect key={i} x="0" y={i*20} width={VW} height="20"
        fill={i%2===0 ? 'rgba(255,255,255,0.018)' : 'transparent'}/>
    ))}
    <rect x="2" y="3" width="96" height="134" fill="none"
      stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" rx="1"/>
    <line x1="2" y1="70" x2="98" y2="70"
      stroke="rgba(255,255,255,0.38)" strokeWidth="0.55"/>
    <circle cx="50" cy="70" r="12" fill="none"
      stroke="rgba(255,255,255,0.38)" strokeWidth="0.55"/>
    <circle cx="50" cy="70" r="1" fill="rgba(255,255,255,0.6)"/>
    {/* Área grande — defesa */}
    <rect x="22" y="118" width="56" height="19" fill="none"
      stroke="rgba(255,255,255,0.35)" strokeWidth="0.55"/>
    <rect x="34" y="128" width="32" height="9" fill="none"
      stroke="rgba(255,255,255,0.25)" strokeWidth="0.45"/>
    <rect x="40" y="136" width="20" height="4" fill="none"
      stroke="rgba(255,255,255,0.5)" strokeWidth="0.7"/>
    <circle cx="50" cy="124" r="1" fill="rgba(255,255,255,0.4)"/>
    <path d="M 22 118 A 12 12 0 0 0 78 118" fill="none"
      stroke="rgba(255,255,255,0.22)" strokeWidth="0.45"/>
    {/* Área grande — ataque */}
    <rect x="22" y="3" width="56" height="19" fill="none"
      stroke="rgba(255,255,255,0.25)" strokeWidth="0.45"/>
    <rect x="40" y="0" width="20" height="4" fill="none"
      stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
  </svg>
);

/**
 * FieldPitchHorizontal — gramado SVG orientação paisagem (usado em ScreenLineup)
 * VW=160, VH=100 — defesa à esquerda, ataque à direita
 */
export const FieldPitchHorizontal = ({ VW = 160, VH = 100, gradientId = 'fv_h_field_g' }) => (
  <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', display: 'block' }}>
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#1b6b1b"/>
        <stop offset="50%"  stopColor="#155215"/>
        <stop offset="100%" stopColor="#1a6519"/>
      </linearGradient>
    </defs>
    <rect width={VW} height={VH} fill={`url(#${gradientId})`}/>
    {[0,1,2,3,4,5,6,7].map(i => (
      <rect key={i} x={i*20} y="0" width="20" height={VH}
        fill={i%2===0 ? 'rgba(255,255,255,0.022)' : 'transparent'}/>
    ))}
    {/* Borda */}
    <rect x="2" y="2" width="156" height="96" fill="none"
      stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" rx="1"/>
    {/* Linha do meio */}
    <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
    {/* Círculo central */}
    <circle cx="80" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
    <circle cx="80" cy="50" r="1.2" fill="rgba(255,255,255,0.65)"/>
    {/* Área grande — defesa (esq) */}
    <rect x="2"   y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.6"/>
    <rect x="2"   y="37" width="8"  height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
    <rect x="2"   y="41" width="4"  height="18" fill="none" stroke="rgba(255,255,255,0.5)"  strokeWidth="0.8"/>
    <circle cx="14" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
    <path d="M 20 38 A 14 14 0 0 1 20 62" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5"/>
    {/* Área grande — ataque (dir) */}
    <rect x="140" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.3)"  strokeWidth="0.5"/>
    <rect x="152" y="37" width="8"  height="26" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.45"/>
    <rect x="154" y="41" width="4"  height="18" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.7"/>
    <circle cx="146" cy="50" r="1.2" fill="rgba(255,255,255,0.35)"/>
    <path d="M 140 38 A 14 14 0 0 0 140 62" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.45"/>
    {/* Labels */}
    <text x="12"  y="7" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="rgba(255,255,255,0.25)" letterSpacing="1.5">DEF</text>
    <text x="148" y="7" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="rgba(255,255,255,0.25)" letterSpacing="1.5">ATK</text>
  </svg>
);

/**
 * FieldView — campo completo com jogadores, header de formação e legenda
 */
const FieldView = ({
  starters = [],
  formation = '4-4-2',
  teamOvr = 0,
  gameData,
  onPlayerClick,
  C,
  DisciplineEngine,
  JerseyBadge,
  showLegend = true,
}) => {
  const VW = 100, VH = 140;
  const layout = FIELD_LAYOUTS[formation] || FIELD_LAYOUTS['4-4-2'];

  // Mapear titulares nos slots por posição
  const byPos = {};
  starters.forEach(p => {
    if (!byPos[p.position]) byPos[p.position] = [];
    byPos[p.position].push(p);
  });
  const usedIds = new Set();
  const dots = layout.map(slot => {
    const pool     = (byPos[slot.role] || []).filter(p => !usedIds.has(p.id));
    const fallback = starters.filter(p => !usedIds.has(p.id));
    const p        = pool[0] || fallback[0];
    if (!p) return null;
    usedIds.add(p.id);
    return { x: slot.x, y: slot.y, p };
  }).filter(Boolean);

  return (
    <Box sx={{ px: 1.5, pt: 1, pb: 1.5 }}>
      {/* Header — formação + OVR */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography sx={{ color: C.txt1, fontWeight: 900, fontSize: '0.88rem' }}>
            {formation}
          </Typography>
          <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>
            {starters.length} titulares · OVR médio {teamOvr}
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: `${C.green}18`, border: `1.5px solid ${C.green}40`,
          borderRadius: '10px', px: 1.2, py: 0.5, textAlign: 'center',
        }}>
          <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>
            {teamOvr}
          </Typography>
          <Typography sx={{ color: C.txt3, fontSize: '0.44rem', fontWeight: 900, letterSpacing: 0.5 }}>
            OVR
          </Typography>
        </Box>
      </Box>

      {/* Campo */}
      <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
        <FieldPitch VW={VW} VH={VH} />

        {/* Overlay — jogadores */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
          {dots.map(({ x, y, p }, i) => {
            const isInjured   = !!p.injury;
            const isSuspended = DisciplineEngine?.isPlayerSuspended(p, gameData?.round);
            const energy      = p.energy ?? 100;
            const eColor      = energy < 50 ? C.red : energy < 75 ? C.yellow : C.green;
            return (
              <Box
                key={p.id || i}
                onClick={() => onPlayerClick?.(p)}
                sx={{
                  position: 'absolute',
                  left: `${(x / VW) * 100}%`,
                  top:  `${(y / VH) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer', gap: '1px',
                  '&:active': { transform: 'translate(-50%, -50%) scale(0.92)' },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  {JerseyBadge && React.createElement(JerseyBadge, { pos: p.position, num: p.shirt ?? (i + 1), size: 28 })}
                  {(isInjured || isSuspended) && (
                    <Box sx={{
                      position: 'absolute', top: -3, right: -4,
                      width: 12, height: 12, borderRadius: '50%',
                      bgcolor: isInjured ? C.red : C.yellow,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.35rem', border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}>
                      {isInjured ? '🚑' : '🟥'}
                    </Box>
                  )}
                  {/* Barra de energia */}
                  <Box sx={{
                    position: 'absolute', bottom: -2, left: '5%',
                    width: '90%', height: '2.5px',
                    bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1, overflow: 'hidden',
                  }}>
                    <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: eColor, borderRadius: 1 }}/>
                  </Box>
                </Box>
                {/* Nome */}
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.62)', borderRadius: '3px', px: '3px', py: '1.5px', backdropFilter: 'blur(3px)' }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.35rem', fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: 0.2 }}>
                    {p.name.split(' ').pop().slice(0, 8)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Labels ATAQUE / DEFESA */}
        <Box sx={{ position: 'absolute', left: '50%', top: '7px', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.32rem', fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap' }}>ATAQUE</Typography>
        </Box>
        <Box sx={{ position: 'absolute', left: '50%', bottom: '7px', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.32rem', fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap' }}>DEFESA</Typography>
        </Box>
      </Box>

      {/* Legenda de posições */}
      {showLegend && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 1 }}>
          {POSITION_LEGEND.map(({ pos, label, color }) => (
            <Box key={pos} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: color, flexShrink: 0 }}/>
              <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700 }}>{pos} · {label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FieldView;

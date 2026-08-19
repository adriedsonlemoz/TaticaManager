import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const norm = (value) => String(value || '').trim().toLowerCase();
const unique = (values) => values.filter(Boolean).filter((value, index, list) => list.findIndex((item) => norm(item) === norm(value)) === index);
const opponentOf = (tie) => {
  if (!tie?.home || !tie?.away) return null;
  if (tie.home.isPlayer) return tie.away?.name || null;
  if (tie.away.isPlayer) return tie.home?.name || null;
  return null;
};

export default function CupPhasePath({ cup, color, theme = THEME }) {
  if (!cup) return null;
  const history = Array.isArray(cup.history) ? cup.history : [];
  const currentTie = cup.currentTie || cup.knockoutTie || null;
  const planned = Array.isArray(cup.phases) ? cup.phases : [];
  const calendarPhases = (cup.calendarEvents || []).map((event) => event?.phase);
  const historyPhases = history.map((item) => item?.phase || item?.label);
  const phases = unique([...planned, ...calendarPhases, ...historyPhases, currentTie?.phase, cup.phaseLabel])
    .filter((phase) => !/^classificat[oó]ria\s+\d+$/i.test(phase));
  if (!phases.length) return null;

  const completed = new Map(history.map((item) => [norm(item?.phase || item?.label), item]));
  const currentName = norm(currentTie?.phase || cup.phaseLabel);
  return (
    <Box sx={{ bgcolor:theme.card, border:`1px solid ${theme.border}`, borderRadius:'11px', overflow:'hidden', mb:1 }}>
      <Box sx={{ px:1.3, py:.75, bgcolor:`${color}10`, borderBottom:`1px solid ${color}28`, display:'flex', justifyContent:'space-between', gap:1 }}>
        <Typography sx={{ color, fontWeight:900, fontSize:'.68rem', letterSpacing:.4 }}>🧩 CHAVE DO CLUBE · FASES</Typography>
        <Typography sx={{ color:theme.txt3, fontWeight:800, fontSize:'.54rem' }}>deslize para ver →</Typography>
      </Box>
      <Box sx={{ display:'flex', gap:.6, p:.8, overflowX:'auto', scrollbarWidth:'none', '&::-webkit-scrollbar':{ display:'none' } }}>
        {phases.map((phase, index) => {
          const done = completed.get(norm(phase));
          const current = norm(phase) === currentName && cup.status === 'active';
          const eliminatedHere = done?.winner && !done.winner.isPlayer;
          const opponent = current ? opponentOf(currentTie) : opponentOf(done);
          const status = eliminatedHere ? '✗' : done ? '✓' : current ? '●' : '○';
          return (
            <React.Fragment key={`${phase}-${index}`}>
              {index > 0 && <Box sx={{ width:15, height:2, bgcolor:done || current ? `${color}70` : theme.border, alignSelf:'center', flexShrink:0 }} />}
              <Box sx={{ minWidth:126, maxWidth:150, border:`1.5px solid ${current ? color : eliminatedHere ? theme.red : done ? `${color}55` : theme.border}`, bgcolor:current ? `${color}0d` : theme.cardAlt, borderRadius:'9px', px:.8, py:.7, flexShrink:0 }}>
                <Typography sx={{ color:current ? color : eliminatedHere ? theme.red : done ? theme.txt1 : theme.txt3, fontWeight:900, fontSize:'.64rem', lineHeight:1.1 }}>{status} {phase}</Typography>
                <Typography sx={{ color:theme.txt3, fontWeight:700, fontSize:'.53rem', lineHeight:1.2, mt:.35, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {opponent ? `vs ${opponent}` : current ? 'fase atual' : done ? (eliminatedHere ? 'eliminado' : 'classificado') : 'a disputar'}
                </Typography>
              </Box>
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}

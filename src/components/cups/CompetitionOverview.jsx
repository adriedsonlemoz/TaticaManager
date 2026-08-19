import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { getSerieCPhaseLabel } from '../../engines/serieC/serieCCompetition.js';
import { getSerieDPhaseLabel } from '../../engines/serieD/serieDCompetition.js';

const STATUS = {
  active:{ label:'EM ANDAMENTO', icon:'●' },
  champion:{ label:'CAMPEÃO', icon:'🏆' },
  eliminated:{ label:'ELIMINADO', icon:'✗' },
};
const cupPosition = (cup) => {
  const row = (cup?.group || []).findIndex((team) => team?.isPlayer || team?.id === 'user');
  return row >= 0 ? row + 1 : 0;
};
const cupRows = (cups = {}) => [
  ['estadual', cups.estadual, '🏟️'], ['copa', cups.copaBrasil, '🏆'], ['liberta', cups.libertadores, '🌟'],
  ['sulam', cups.sulAmericana, '🌎'], ['regional', cups.regional, '🧭'],
].filter(([,cup]) => cup);

export default function CompetitionOverview({ gameData, onOpenCup, onOpenLeague, onOpenCalendar, theme = THEME }) {
  const table = gameData?.table || [];
  const posIndex = table.findIndex((row) => row?.id === 'user' || row?.isPlayer);
  const row = posIndex >= 0 ? table[posIndex] : null;
  const serie = gameData?.serie || 'A';
  const phase = serie === 'C' && gameData?.serieCCompetition
    ? getSerieCPhaseLabel(gameData, gameData.leagueRound || 0)
    : serie === 'D' && gameData?.serieDCompetition
      ? getSerieDPhaseLabel(gameData, gameData.leagueRound || 0)
      : `Rodada ${Math.min((Number(gameData?.leagueRound) || 0) + 1, gameData?.fixtures?.length || 0)} de ${gameData?.fixtures?.length || 0}`;

  return (
    <Box sx={{ px:1.25, pt:1.1 }}>
      <Typography sx={{ color:theme.txt2, fontWeight:900, fontSize:'.7rem', letterSpacing:1.1, mb:.65 }}>CAMPEONATO NACIONAL</Typography>
      <Box component="button" type="button" onClick={onOpenLeague} sx={{ width:'100%', border:`1.5px solid ${theme.clubBorder || theme.border}`, bgcolor:theme.card, borderRadius:'13px', p:1.05, textAlign:'left', font:'inherit', cursor:'pointer', display:'grid', gridTemplateColumns:'44px 1fr auto', alignItems:'center', gap:.9, boxShadow:`0 3px 14px ${theme.shadow}` }}>
        <Box sx={{ width:44, height:44, borderRadius:'11px', bgcolor:theme.clubTint || theme.bgCardAlt, display:'flex', alignItems:'center', justifyContent:'center' }}><Typography sx={{ fontSize:'1.35rem' }}>📊</Typography></Box>
        <Box sx={{ minWidth:0 }}>
          <Typography sx={{ color:theme.txt1, fontWeight:900, fontSize:'.92rem' }}>Brasileirão Série {serie}</Typography>
          <Typography sx={{ color:theme.txt2, fontWeight:700, fontSize:'.65rem', mt:.2 }}>{phase}</Typography>
          <Typography sx={{ color:theme.primary, fontWeight:900, fontSize:'.63rem', mt:.25 }}>Abrir classificação completa →</Typography>
        </Box>
        <Box sx={{ textAlign:'center', minWidth:52 }}>
          <Typography sx={{ color:theme.primary, fontWeight:900, fontSize:'1.35rem', lineHeight:1 }}>{posIndex >= 0 ? `${posIndex + 1}º` : '—'}</Typography>
          <Typography sx={{ color:theme.txt3, fontWeight:800, fontSize:'.5rem', mt:.25 }}>{row ? `${row.pts || 0} PTS` : 'POSIÇÃO'}</Typography>
        </Box>
      </Box>

      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mt:1.25, mb:.65 }}>
        <Typography sx={{ color:theme.txt2, fontWeight:900, fontSize:'.7rem', letterSpacing:1.1 }}>OUTRAS COMPETIÇÕES</Typography>
        <Box component="button" type="button" onClick={onOpenCalendar} sx={{ border:0, bgcolor:'transparent', color:theme.primary, fontWeight:900, fontSize:'.64rem', cursor:'pointer' }}>📅 Calendário</Box>
      </Box>
      <Box sx={{ display:'flex', flexDirection:'column', gap:.65 }}>
        {cupRows(gameData?.cups).map(([id,cup,icon]) => {
          const status=STATUS[cup.status] || { label:String(cup.status || '—').toUpperCase(), icon:'•' };
          const position=cupPosition(cup);
          return (
            <Box key={id} component="button" type="button" onClick={() => onOpenCup(id)} sx={{ width:'100%', border:`1px solid ${theme.border}`, bgcolor:theme.card, borderRadius:'11px', px:1, py:.85, display:'grid', gridTemplateColumns:'36px 1fr auto', alignItems:'center', gap:.8, textAlign:'left', font:'inherit', cursor:'pointer' }}>
              <Box sx={{ width:36, height:36, borderRadius:'9px', bgcolor:`${cup.color || theme.primary}12`, display:'flex', alignItems:'center', justifyContent:'center' }}><Typography sx={{ fontSize:'1.15rem' }}>{icon}</Typography></Box>
              <Box sx={{ minWidth:0 }}>
                <Typography sx={{ color:theme.txt1, fontWeight:900, fontSize:'.8rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cup.label || 'Competição'}</Typography>
                <Typography sx={{ color:theme.txt2, fontWeight:700, fontSize:'.61rem', mt:.15 }}>{cup.phaseLabel || cup.phase || '—'}{position ? ` · ${position}º na classificação` : ''}</Typography>
              </Box>
              <Box sx={{ textAlign:'right' }}>
                <Typography sx={{ color:cup.status === 'eliminated' ? theme.red : cup.status === 'champion' ? theme.gold : (cup.color || theme.primary), fontWeight:900, fontSize:'.58rem' }}>{status.icon} {status.label}</Typography>
                <Typography sx={{ color:theme.txt3, fontWeight:800, fontSize:'.53rem', mt:.3 }}>Ver detalhes →</Typography>
              </Box>
            </Box>
          );
        })}
        {cupRows(gameData?.cups).length === 0 && <Typography sx={{ color:theme.txt3, fontSize:'.7rem', p:1 }}>Nenhuma copa ou estadual ativo nesta temporada.</Typography>}
      </Box>
    </Box>
  );
}

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { TeamIcon } from '../../data/database_branding.js';
import { getTeamBranding } from '../../data/teamBranding.js';
import BootRoundBar from './BootRoundBar.jsx';

const getToneColor = (tone, C) => {
  if (tone === 'greenLight') return C.green;
  if (tone === 'orangeDark') return '#b05a10';
  if (tone === 'red') return C.red;
  return C.gold;
};

const getSerieColor = (serie, C) => ({ A:C.green, B:C.gold, C:C.blue, D:'#7c3aed' }[serie] || C.ink3);

const CareerHistory = ({ save, theme }) => {
  const C = theme;
  const { career } = save;
  return (
    <Box sx={{ px:1.25, pb:1.25, pt:.25, bgcolor:C.bgCardAlt, borderTop:`1px solid ${C.border}` }}>
      <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'.84rem', mb:.75 }}>Resumo da carreira</Typography>
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:.7, mb:.8 }}>
        {[
          { icon:'📅', label:'Temporadas', value:career.seasons, color:C.ink },
          { icon:'✅', label:'Vitórias', value:career.wins, color:C.green },
          { icon:'🤝', label:'Empates', value:career.draws, color:C.gold },
          { icon:'❌', label:'Derrotas', value:career.losses, color:C.red },
        ].map((item) => (
          <Box key={item.label} sx={{ bgcolor:C.bgCard, borderRadius:'10px', p:.8, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:.7 }}>
            <Typography sx={{ fontSize:'1.05rem' }}>{item.icon}</Typography>
            <Box>
              <Typography sx={{ color:item.color, fontWeight:900, fontSize:'1rem', lineHeight:1 }}>{item.value}</Typography>
              <Typography sx={{ color:C.ink2, fontSize:'.7rem', fontWeight:700, mt:.2 }}>{item.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {career.total > 0 && (
        <Box sx={{ mb:.9 }}>
          <Box sx={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', bgcolor:C.border }}>
            <Box sx={{ width:`${career.winPct}%`, bgcolor:C.green }} />
            <Box sx={{ width:`${career.drawPct}%`, bgcolor:C.gold }} />
            <Box sx={{ width:`${career.lossPct}%`, bgcolor:C.red }} />
          </Box>
          <Typography sx={{ color:C.ink2, fontWeight:700, fontSize:'.7rem', mt:.4 }}>{career.winPct}% vitórias · {career.drawPct}% empates · {career.lossPct}% derrotas</Typography>
        </Box>
      )}

      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:.7 }}>
        <Box sx={{ bgcolor:C.bgCard, borderRadius:'10px', p:.8, border:`1px solid ${C.border}` }}>
          <Typography sx={{ color:C.ink2, fontSize:'.68rem', fontWeight:800 }}>CAIXA</Typography>
          <Typography sx={{ color:C.green, fontWeight:900, fontSize:'.92rem', mt:.2 }}>{save.moneyLabel}</Typography>
        </Box>
        <Box sx={{ bgcolor:C.bgCard, borderRadius:'10px', p:.8, border:`1px solid ${C.border}` }}>
          <Typography sx={{ color:C.ink2, fontSize:'.68rem', fontWeight:800 }}>TROFÉUS</Typography>
          <Typography sx={{ color:C.gold, fontWeight:900, fontSize:'.92rem', mt:.2 }}>🏆 {career.trophies}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const BootSaveCard = ({ save, featured, expanded, loading, onToggle, onLoad, onDelete, theme }) => {
  const C = theme;
  const branding = getTeamBranding(save.clubName);
  const serieColor = getSerieColor(save.serie, C);
  const difficultyColor = getToneColor(save.difficultyStyle.tone, C);
  const isLoading = loading === save.name;
  const incompatible = save.incompatible === true;

  return (
    <Box sx={{ bgcolor:featured ? '#fffdf7' : C.bgCard, border:`1.5px solid ${featured ? C.borderAcc : C.border}`, borderRadius:'15px', overflow:'hidden', boxShadow:featured ? `0 5px 22px ${C.shadow}` : `0 2px 10px ${C.shadow}` }}>
      {branding && <Box sx={{ height:5, background:`linear-gradient(90deg,${branding.primary},${branding.secondary})` }} />}

      <Box sx={{ p:1.2 }}>
        <Box sx={{ display:'flex', gap:1, alignItems:'flex-start' }}>
          <Box sx={{ width:64, height:64, borderRadius:'14px', bgcolor:C.bgCardAlt, border:`1.5px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <TeamIcon name={save.clubName} size={48} />
          </Box>

          <Box sx={{ flex:1, minWidth:0 }}>
            <Box sx={{ display:'flex', alignItems:'flex-start', gap:.6 }}>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'1.08rem', lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{save.name || 'Carreira'}</Typography>
                <Typography sx={{ color:C.ink2, fontWeight:800, fontSize:'.82rem', mt:.25, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{save.clubName}</Typography>
              </Box>
              {featured && (
                <Box sx={{ bgcolor:`${C.green}14`, border:`1px solid ${C.green}35`, borderRadius:'8px', px:.65, py:.3, flexShrink:0 }}>
                  <Typography sx={{ color:C.green, fontWeight:900, fontSize:'.62rem' }}>ÚLTIMA</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:.55, mt:.65 }}>
              <Box sx={{ bgcolor:`${serieColor}16`, border:`1px solid ${serieColor}35`, borderRadius:'7px', px:.65, py:.25 }}>
                <Typography sx={{ color:serieColor, fontWeight:900, fontSize:'.7rem' }}>SÉRIE {save.serie}</Typography>
              </Box>
              <Typography sx={{ color:C.ink2, fontSize:'.76rem', fontWeight:800 }}>Temporada {save.season}</Typography>
              {save.difficulty && <Typography sx={{ color:difficultyColor, fontSize:'.74rem', fontWeight:900 }}>{save.difficultyStyle.icon} {save.difficulty}</Typography>}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7, mt:1 }}>
          <Box sx={{ bgcolor:C.bgCardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:.7 }}>
            <Typography sx={{ color:C.ink2, fontSize:'.65rem', fontWeight:800 }}>POSIÇÃO</Typography>
            <Typography sx={{ color:save.position <= 4 ? C.green : save.position >= 17 ? C.red : C.ink, fontWeight:900, fontSize:'1.05rem', mt:.15 }}>{save.positionLabel}</Typography>
          </Box>
          <Box sx={{ bgcolor:C.bgCardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:.7 }}>
            <Typography sx={{ color:C.ink2, fontSize:'.65rem', fontWeight:800 }}>PONTOS</Typography>
            <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'1.05rem', mt:.15 }}>{save.pts ?? '—'}</Typography>
          </Box>
          <Box sx={{ bgcolor:C.bgCardAlt, border:`1px solid ${C.border}`, borderRadius:'10px', p:.7, minWidth:0 }}>
            <Typography sx={{ color:C.ink2, fontSize:'.65rem', fontWeight:800 }}>TÉCNICO</Typography>
            <Typography sx={{ color:C.ink, fontWeight:900, fontSize:'.78rem', mt:.25, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{save.manager || '—'}</Typography>
          </Box>
        </Box>

        {save.objectiveInfo && (
          <Box sx={{ display:'flex', alignItems:'center', gap:.55, mt:.85, bgcolor:C.bgCardAlt, border:`1px solid ${C.border}`, borderRadius:'9px', px:.8, py:.55 }}>
            <Typography sx={{ fontSize:'.9rem' }}>{save.objectiveInfo.icon}</Typography>
            <Typography sx={{ color:C.ink2, fontSize:'.74rem', fontWeight:800 }}>Meta:</Typography>
            <Typography sx={{ color:C.ink, fontSize:'.76rem', fontWeight:900 }}>{save.objectiveInfo.label}</Typography>
          </Box>
        )}

        {save.stadiumConstruction > 0 && (
          <Typography sx={{ color:C.gold, bgcolor:`${C.gold}12`, border:`1px solid ${C.gold}35`, borderRadius:'9px', px:.8, py:.55, fontWeight:800, fontSize:'.72rem', mt:.75 }}>
            🏗️ Obras no estádio · {save.stadiumConstruction} rodada{save.stadiumConstruction > 1 ? 's' : ''} restante{save.stadiumConstruction > 1 ? 's' : ''}
          </Typography>
        )}

        {incompatible && (
          <Typography sx={{ color:C.red, bgcolor:`${C.red}10`, border:`1px solid ${C.red}35`, borderRadius:'9px', px:.8, py:.55, fontWeight:900, fontSize:'.72rem', mt:.75 }}>
            ⚠ Este save foi criado por uma versão mais nova.
          </Typography>
        )}

        <Box sx={{ mt:.85 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:.4 }}>
            <Typography sx={{ color:C.ink2, fontSize:'.7rem', fontWeight:700 }}>🕐 {save.savedAtLabel}</Typography>
            <Typography sx={{ color:C.ink2, fontSize:'.7rem', fontWeight:800 }}>Rodada {save.progress.round}/{save.progress.total || '—'}</Typography>
          </Box>
          <BootRoundBar progress={save.progress} theme={C} />
        </Box>
      </Box>

      {expanded && <CareerHistory save={save} theme={C} />}

      <Box sx={{ px:1.1, pb:1.05, pt:.9, borderTop:`1px solid ${C.border}`, display:'grid', gridTemplateColumns:'1fr auto', gap:.65 }}>
        <Button onClick={onLoad} disabled={Boolean(loading) || incompatible} sx={{ minHeight:46, borderRadius:'11px', bgcolor:isLoading ? C.primaryDim : C.green, color:'#fff', fontWeight:900, fontSize:'.92rem', '&:hover':{ bgcolor:C.primaryDim }, '&:disabled':{ bgcolor:C.bgDark, color:C.ink3 } }}>
          {incompatible ? '⚠ ATUALIZE O JOGO' : isLoading ? '⏳ Carregando...' : '▶ CONTINUAR'}
        </Button>
        <Button onClick={onToggle} sx={{ minWidth:92, minHeight:46, borderRadius:'11px', bgcolor:C.bgCardAlt, color:C.ink2, border:`1px solid ${C.border}`, fontWeight:900, fontSize:'.76rem' }}>
          {expanded ? 'Menos' : 'Detalhes'} {expanded ? '▴' : '▾'}
        </Button>
        <Button onClick={onDelete} disabled={Boolean(loading)} sx={{ gridColumn:'1 / -1', minHeight:38, borderRadius:'10px', color:C.red, bgcolor:'transparent', border:`1px solid ${C.red}25`, fontWeight:900, fontSize:'.72rem', '&:hover':{ bgcolor:`${C.red}0D` } }}>
          🗑 Excluir carreira
        </Button>
      </Box>
    </Box>
  );
};

export default BootSaveCard;

import React from 'react';
import { Box, Typography } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel } from '../SetupUi.jsx';
import { DIFFICULTY_PROFILES } from '../../../engines/core/careerCreation.js';
import { getCareerObjectivesForSerie, isCareerObjectiveAllowed } from '../../../engines/core/careerObjectives.js';

const DIFFICULTIES = [
  { id:'Fácil', icon:'🟢', short:'Mais recursos' },
  { id:'Normal', icon:'🟡', short:'Equilibrado' },
  { id:'Difícil', icon:'🟠', short:'Rivais mais fortes' },
  { id:'Lendário', icon:'🔴', short:'Desafio máximo' },
];

const PRESSURE_COLOR = { Alta:P.red, Média:P.gold, Baixa:P.green };
const PRESSURE_LIGHT = { Alta:P.redLight, Média:P.goldLight, Baixa:P.greenLight };

const SetupCareerStep = ({ setupData, up, goCard, isCardValid }) => {
  const serie = setupData.serie || 'A';
  const objectives = React.useMemo(() => getCareerObjectivesForSerie(serie), [serie]);

  React.useEffect(() => {
    const patch = {};
    if (!setupData.saveName && setupData.teamName) patch.saveName = setupData.teamName;
    if (!setupData.difficulty || !DIFFICULTY_PROFILES[setupData.difficulty]) {
      patch.difficulty = 'Normal';
      patch.difficultyMultipliers = { ...DIFFICULTY_PROFILES.Normal };
    }
    if (setupData.seasonObjective && !isCareerObjectiveAllowed(setupData.seasonObjective, serie)) patch.seasonObjective = null;
    if (Object.keys(patch).length) up(patch);
  }, [serie, setupData.saveName, setupData.teamName, setupData.difficulty, setupData.seasonObjective, up]);

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
      <SetupCardHeader icon="🎯" step={2} title="Carreira e meta" sub={`SÉRIE ${serie} · ${setupData.teamName || 'CLUBE'}`} />

      <Box sx={{ flex:1, minHeight:0, overflowY:'auto', overscrollBehavior:'contain', WebkitOverflowScrolling:'touch', pr:.15, pb:.8, '&::-webkit-scrollbar':{ width:'4px' }, '&::-webkit-scrollbar-thumb':{ bgcolor:P.border, borderRadius:'4px' } }}>
        <Box sx={{ bgcolor:P.surface, border:`1px solid ${P.border}`, borderRadius:'14px', p:1.05, mb:1.05 }}>
          <SetupSectionLabel label="DIFICULDADE" />
          <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:.65 }}>
            {DIFFICULTIES.map((item) => {
              const active = (setupData.difficulty || 'Normal') === item.id;
              return (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => up({ difficulty:item.id, difficultyMultipliers:{ ...DIFFICULTY_PROFILES[item.id] } })}
                  sx={{
                    minHeight:58, bgcolor:active ? P.greenLight : P.bg,
                    border:`1.5px solid ${active ? P.green : P.border}`, borderRadius:'11px', px:.9, py:.65,
                    cursor:'pointer', textAlign:'left', display:'flex', gap:.65, alignItems:'center', font:'inherit',
                    boxShadow:active ? `0 3px 12px ${P.shadow}` : 'none', '&:active':{ transform:'scale(.985)' },
                  }}
                >
                  <Typography aria-hidden="true" sx={{ fontSize:'1.05rem', lineHeight:1 }}>{item.icon}</Typography>
                  <Box sx={{ minWidth:0 }}>
                    <Typography sx={{ color:active ? P.greenDark : P.txt1, fontWeight:900, fontSize:'.86rem', lineHeight:1.05 }}>{item.id}</Typography>
                    <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.64rem', lineHeight:1.15, mt:.25 }}>{item.short}</Typography>
                  </Box>
                  <Box sx={{ ml:'auto', width:19, height:19, borderRadius:'50%', border:`1.5px solid ${active ? P.green : P.border}`, bgcolor:active ? P.green : P.surface, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {active && <Typography sx={{ color:'#fff', fontSize:'.65rem', fontWeight:900 }}>✓</Typography>}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ height:1, bgcolor:P.border, my:.9 }} />
          <SetupSectionLabel label="NOME DA CARREIRA" />
          <input
            className="setup-input"
            value={setupData.saveName || ''}
            onChange={(event) => up({ saveName:event.target.value })}
            placeholder="Ex.: Rumo ao Acesso"
            style={{ ...inputStyle, padding:'10px 12px', fontSize:'.92rem' }}
          />
        </Box>

        <SetupSectionLabel label="META DA TEMPORADA" />
        <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.77rem', mb:.75, lineHeight:1.3 }}>
          Escolha o resultado que a diretoria vai cobrar nesta temporada.
        </Typography>

        <Box sx={{ display:'flex', flexDirection:'column', gap:.65 }}>
          {objectives.map((objective) => {
            const active = setupData.seasonObjective === objective.id;
            const color = PRESSURE_COLOR[objective.pressure];
            return (
              <Box
                key={objective.id}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() => up({ seasonObjective:objective.id })}
                sx={{
                  width:'100%', display:'flex', alignItems:'center', gap:.85,
                  bgcolor:active ? `${color}0D` : P.surface,
                  border:`1.5px solid ${active ? color : P.border}`, borderRadius:'13px', px:.9, py:.78,
                  cursor:'pointer', textAlign:'left', transition:'all .15s', font:'inherit',
                  boxShadow:active ? `0 4px 14px ${color}16` : 'none', '&:active':{ transform:'scale(.99)' },
                }}
              >
                <Box sx={{ width:38, height:38, borderRadius:'10px', bgcolor:active ? `${color}18` : P.bg, border:`1px solid ${active ? `${color}40` : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Typography sx={{ fontSize:'1.15rem' }}>{objective.icon}</Typography>
                </Box>
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography sx={{ color:active ? color : P.txt1, fontWeight:900, fontSize:'.9rem', lineHeight:1.08 }}>{objective.label}</Typography>
                  <Typography sx={{ color:P.txt2, fontSize:'.69rem', fontWeight:700, mt:.25, lineHeight:1.2 }}>{objective.description}</Typography>
                </Box>
                <Box sx={{ bgcolor:PRESSURE_LIGHT[objective.pressure], border:`1px solid ${color}30`, borderRadius:'8px', px:.55, py:.38, textAlign:'center', flexShrink:0 }}>
                  <Typography sx={{ color, fontWeight:900, fontSize:'.61rem' }}>{objective.pressure}</Typography>
                  <Typography sx={{ color:P.txt2, fontSize:'.46rem', fontWeight:800 }}>PRESSÃO</Typography>
                </Box>
                <Box sx={{ width:23, height:23, borderRadius:'50%', bgcolor:active ? color : P.bg, border:`1.5px solid ${active ? color : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Typography sx={{ color:active ? '#fff' : P.txt3, fontWeight:900, fontSize:'.72rem' }}>{active ? '✓' : ''}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {!setupData.seasonObjective && (
          <Typography sx={{ color:P.gold, bgcolor:P.goldLight, border:`1px solid ${P.gold}35`, borderRadius:'10px', px:1, py:.65, fontWeight:800, fontSize:'.72rem', mt:.8 }}>
            ⚠ Escolha uma meta para liberar o próximo passo.
          </Typography>
        )}
      </Box>

      <SetupNavRow onBack={() => goCard(1)} onNext={() => goCard(3)} disabled={!isCardValid(2)} nextLabel="PERFIL DO TÉCNICO" />
    </Box>
  );
};

export default SetupCareerStep;

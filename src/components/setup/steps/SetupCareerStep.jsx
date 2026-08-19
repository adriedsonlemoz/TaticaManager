import React from 'react';
import { Box, Typography } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel } from '../SetupUi.jsx';
import { DIFFICULTY_PROFILES } from '../../../engines/core/careerCreation.js';
import { getCareerObjectivesForSerie, isCareerObjectiveAllowed } from '../../../engines/core/careerObjectives.js';

const DIFFICULTIES = [
  { id:'Fácil', icon:'🟢', description:'Mais recursos e adversários menos agressivos.' },
  { id:'Normal', icon:'🟡', description:'Experiência equilibrada para a carreira.' },
  { id:'Difícil', icon:'🟠', description:'Menos margem para erros e rivais mais fortes.' },
  { id:'Lendário', icon:'🔴', description:'Desafio máximo, com pressão constante.' },
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
    if (setupData.seasonObjective && !isCareerObjectiveAllowed(setupData.seasonObjective, serie)) {
      patch.seasonObjective = null;
    }
    if (Object.keys(patch).length) up(patch);
  }, [serie, setupData.saveName, setupData.teamName, setupData.difficulty, setupData.seasonObjective, up]);

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <SetupCardHeader icon="🎯" step={2} title="Carreira e meta" sub={`SÉRIE ${serie} · ${setupData.teamName || 'CLUBE'}`} />

      <Box sx={{ flex:1, minHeight:0, overflowY:'auto', pr:.15, pb:.7, '&::-webkit-scrollbar':{ width:'4px' }, '&::-webkit-scrollbar-thumb':{ bgcolor:P.border, borderRadius:'4px' } }}>
        <Box sx={{ mb:1.5 }}>
          <SetupSectionLabel label="NOME DA CARREIRA" />
          <input
            className="setup-input"
            value={setupData.saveName || ''}
            onChange={(event) => up({ saveName:event.target.value })}
            placeholder="Ex.: Rumo ao Acesso"
            style={inputStyle}
          />
        </Box>

        <SetupSectionLabel label="DIFICULDADE" />
        <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:.75, mb:1.6 }}>
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
                  minHeight:82, bgcolor:active ? P.greenLight : P.surface,
                  border:`1.5px solid ${active ? P.green : P.border}`, borderRadius:'13px', p:1,
                  cursor:'pointer', textAlign:'left', display:'flex', gap:.8, alignItems:'flex-start', transition:'all .15s',
                  '&:active':{ transform:'scale(.985)' },
                }}
              >
                <Typography sx={{ fontSize:'1.2rem', lineHeight:1.1 }}>{item.icon}</Typography>
                <Box>
                  <Typography sx={{ color:active ? P.greenDark : P.txt1, fontWeight:900, fontSize:'.9rem', lineHeight:1.1 }}>{item.id}</Typography>
                  <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.7rem', lineHeight:1.3, mt:.35 }}>{item.description}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ height:1, bgcolor:P.border, mb:1.3 }} />
        <SetupSectionLabel label="META DA TEMPORADA" />
        <Typography sx={{ color:P.txt2, fontWeight:700, fontSize:'.8rem', mb:.8 }}>
          Escolha o resultado que a diretoria vai cobrar nesta temporada.
        </Typography>

        <Box sx={{ display:'flex', flexDirection:'column', gap:.7 }}>
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
                  width:'100%', display:'flex', alignItems:'center', gap:1,
                  bgcolor:active ? `${color}0D` : P.surface,
                  border:`2px solid ${active ? color : P.border}`, borderRadius:'14px', px:1, py:.9,
                  cursor:'pointer', textAlign:'left', transition:'all .15s',
                  boxShadow:active ? `0 4px 16px ${color}18` : 'none', '&:active':{ transform:'scale(.99)' },
                }}
              >
                <Box sx={{ width:42, height:42, borderRadius:'11px', bgcolor:active ? `${color}18` : P.bg, border:`1px solid ${active ? `${color}40` : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Typography sx={{ fontSize:'1.3rem' }}>{objective.icon}</Typography>
                </Box>
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography sx={{ color:active ? color : P.txt1, fontWeight:900, fontSize:'.95rem', lineHeight:1.1 }}>{objective.label}</Typography>
                  <Typography sx={{ color:P.txt2, fontSize:'.74rem', fontWeight:700, mt:.3, lineHeight:1.25 }}>{objective.description}</Typography>
                </Box>
                <Box sx={{ bgcolor:PRESSURE_LIGHT[objective.pressure], border:`1px solid ${color}30`, borderRadius:'9px', px:.65, py:.45, textAlign:'center', flexShrink:0 }}>
                  <Typography sx={{ color, fontWeight:900, fontSize:'.66rem' }}>{objective.pressure}</Typography>
                  <Typography sx={{ color:P.txt2, fontSize:'.52rem', fontWeight:800 }}>PRESSÃO</Typography>
                </Box>
                <Box sx={{ width:25, height:25, borderRadius:'50%', bgcolor:active ? color : P.bg, border:`1.5px solid ${active ? color : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Typography sx={{ color:active ? '#fff' : P.txt3, fontWeight:900, fontSize:'.78rem' }}>{active ? '✓' : ''}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {!setupData.seasonObjective && (
          <Typography sx={{ color:P.gold, bgcolor:P.goldLight, border:`1px solid ${P.gold}35`, borderRadius:'10px', px:1, py:.7, fontWeight:800, fontSize:'.74rem', mt:.9 }}>
            ⚠ Escolha uma meta para liberar o próximo passo.
          </Typography>
        )}
      </Box>

      <SetupNavRow onBack={() => goCard(1)} onNext={() => goCard(3)} disabled={!isCardValid(2)} nextLabel="PERFIL DO TÉCNICO" />
    </Box>
  );
};

export default SetupCareerStep;

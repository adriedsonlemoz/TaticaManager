import React from 'react';
import { Box, Typography } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel } from '../SetupUi.jsx';

const SetupCareerStep = ({ setupData, up, goCard, isCardValid }) => {
  const serie = setupData.serie || 'A';
  const DIFFS = [
    { id:'Fácil', icon:'🟢', mult:{ injuryChance:0.4, rivalStrength:0.88, moneyBonus:1.3, fatigueLoss:0.7 } },
    { id:'Normal', icon:'🟡', mult:{ injuryChance:1.0, rivalStrength:1.0, moneyBonus:1.0, fatigueLoss:1.0 } },
    { id:'Difícil', icon:'🟠', mult:{ injuryChance:1.8, rivalStrength:1.1, moneyBonus:0.85, fatigueLoss:1.3 } },
    { id:'Lendário', icon:'🔴', mult:{ injuryChance:2.8, rivalStrength:1.2, moneyBonus:0.7, fatigueLoss:1.6 } },
  ];
  const OBJECTIVES = [
    { id:'champion', icon:'🏆', label:'Ser Campeão', desc:'1º lugar na competição', pressure:'Alta', available:['A','B','C','D'] },
    { id:'promotion', icon:'⬆️', label:'Subir de Divisão', desc:'Conquistar o acesso', pressure:'Média', available:['B','C','D'] },
    { id:'libertadores', icon:'🌎', label:'Libertadores', desc:'Top 6 na Série A', pressure:'Média', available:['A'] },
    { id:'sulamericana', icon:'🌐', label:'Sul-Americana', desc:'Entre 7º e 12º na Série A', pressure:'Baixa', available:['A'] },
    { id:'survive', icon:'🛡️', label:'Não Rebaixar', desc:'Fora da zona de rebaixamento', pressure:'Baixa', available:['A','B','C'] },
    { id:'midtable', icon:'📊', label:'Meio da Tabela', desc:'Campanha segura e estável', pressure:'Baixa', available:['A','B','C','D'] },
  ].filter((objective) => objective.available.includes(serie));
  const pressColor = { Alta:P.red, Média:P.gold, Baixa:P.green };
  const pressLight = { Alta:P.redLight, Média:P.goldLight, Baixa:P.greenLight };

  React.useEffect(() => {
    const patch = {};
    if (!setupData.saveName && setupData.teamName) patch.saveName = setupData.teamName;
    if (!setupData.difficulty) {
      patch.difficulty = 'Normal';
      patch.difficultyMultipliers = DIFFS.find((item) => item.id === 'Normal').mult;
    }
    if (setupData.seasonObjective && !OBJECTIVES.some((item) => item.id === setupData.seasonObjective)) patch.seasonObjective = null;
    if (Object.keys(patch).length) up(patch);
  }, [serie, setupData.saveName, setupData.teamName, setupData.difficulty, setupData.seasonObjective, up]);

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <SetupCardHeader icon="📋" step={2} title="Carreira & Objetivos" sub={`SÉRIE ${serie} · ${setupData.teamName || 'CLUBE'}`} />

      <Box sx={{ mb:1.4 }}>
        <SetupSectionLabel label="NOME DO SAVE" />
        <input className="setup-input" value={setupData.saveName || ''} onChange={(event) => up({ saveName:event.target.value })} placeholder="Ex: Rumo ao Acesso, Glória Eterna..." style={inputStyle} />
        <Box sx={{ display:'flex', flexWrap:'wrap', gap:.5, mt:.65 }}>
          {[setupData.teamName, `${setupData.teamName} — Glória`, 'Rumo ao Topo', 'A Grande Virada'].filter(Boolean).map((name) => (
            <Box key={name} onClick={() => up({ saveName:name })} sx={{ bgcolor:setupData.saveName === name ? P.greenLight : P.bg, border:`1px solid ${setupData.saveName === name ? P.green : P.border}`, borderRadius:'8px', px:.85, py:.32, cursor:'pointer' }}>
              <Typography sx={{ color:setupData.saveName === name ? P.greenDark : P.txt3, fontWeight:900, fontSize:'.58rem' }}>{name}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <SetupSectionLabel label="DIFICULDADE" />
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:.55, mb:1.35 }}>
        {DIFFS.map((item) => {
          const active = (setupData.difficulty || 'Normal') === item.id;
          return (
            <Box key={item.id} onClick={() => up({ difficulty:item.id, difficultyMultipliers:item.mult })} sx={{ bgcolor:active ? P.greenLight : P.surface, border:`1.5px solid ${active ? P.green : P.border}`, borderRadius:'11px', py:.75, px:.35, cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
              <Typography sx={{ fontSize:'1rem', lineHeight:1, mb:.3 }}>{item.icon}</Typography>
              <Typography sx={{ color:active ? P.greenDark : P.txt2, fontWeight:900, fontSize:'.48rem' }}>{item.id.toUpperCase()}</Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ height:1, bgcolor:P.border, mb:1.1 }} />
      <SetupSectionLabel label="OBJETIVO DA TEMPORADA" />
      <Box sx={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:.6, mb:1, '&::-webkit-scrollbar':{ width:'3px' }, '&::-webkit-scrollbar-thumb':{ bgcolor:P.border, borderRadius:'4px' } }}>
        {OBJECTIVES.map((objective) => {
          const active = setupData.seasonObjective === objective.id;
          const color = pressColor[objective.pressure];
          return (
            <Box key={objective.id} onClick={() => up({ seasonObjective:objective.id })} sx={{ display:'flex', alignItems:'center', gap:1, bgcolor:active ? `${color}08` : P.surface, border:`1.5px solid ${active ? color : P.border}`, borderRadius:'13px', px:1.1, py:.85, cursor:'pointer', transition:'all .15s' }}>
              <Box sx={{ width:36, height:36, borderRadius:'10px', bgcolor:active ? `${color}15` : P.bg, border:`1px solid ${active ? `${color}40` : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Typography sx={{ fontSize:'1.1rem' }}>{objective.icon}</Typography></Box>
              <Box sx={{ flex:1 }}><Typography sx={{ color:active ? color : P.txt1, fontWeight:900, fontSize:'.82rem', lineHeight:1 }}>{objective.label}</Typography><Typography sx={{ color:P.txt3, fontSize:'.56rem', fontWeight:700, mt:.18 }}>{objective.desc}</Typography></Box>
              <Box sx={{ bgcolor:pressLight[objective.pressure], border:`1px solid ${color}30`, borderRadius:'8px', px:.65, py:.36, textAlign:'center' }}><Typography sx={{ color, fontWeight:900, fontSize:'.48rem' }}>{objective.pressure}</Typography><Typography sx={{ color:P.txt3, fontSize:'.36rem', fontWeight:700 }}>PRESSÃO</Typography></Box>
              {active && <Typography sx={{ color, fontWeight:900 }}>✓</Typography>}
            </Box>
          );
        })}
      </Box>

      <SetupNavRow onBack={() => goCard(1)} onNext={() => goCard(3)} disabled={!isCardValid(2)} nextLabel="PERFIL DO TÉCNICO" />
    </Box>
  );
};

export default SetupCareerStep;

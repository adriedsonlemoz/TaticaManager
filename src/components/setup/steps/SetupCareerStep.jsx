import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel, SetupShirt } from '../SetupUi.jsx';

const SetupCareerStep = ({
  setupData, up, goCard, isCardValid, availableTeams, brand,
  useExistingTeam, setUseExistingTeam, teamSearch, setTeamSearch,
  signing, setSigning, signed, setSigned, handleStartNewGame, savesList, setScreen,
}) => {
    const serie = setupData.serie || 'A';
    const OBJECTIVES = [
      { id: 'champion',     icon: '🏆', label: 'Ser Campeão',      desc: '1º lugar na tabela',           pressure: 'Alta',  available: ['A','B','C','D'] },
      { id: 'promotion',    icon: '⬆️', label: 'Subir de Divisão', desc: 'Terminar no Top 4',             pressure: 'Média', available: ['B','C','D'] },
      { id: 'libertadores', icon: '🌎', label: 'Libertadores',     desc: 'Top 6 na Série A',              pressure: 'Média', available: ['A'] },
      { id: 'sulamericana', icon: '🌐', label: 'Sul-Americana',    desc: 'Entre 7º e 12º na Série A',     pressure: 'Baixa', available: ['A'] },
      { id: 'survive',      icon: '🛡️', label: 'Não Rebaixar',     desc: 'Fora da zona de rebaixamento',  pressure: 'Baixa', available: ['A','B','C','D'] },
      { id: 'midtable',     icon: '📊', label: 'Meio da Tabela',   desc: 'Entre 7º e 14º lugar',          pressure: 'Baixa', available: ['A','B','C','D'] },
    ].filter(o => o.available.includes(serie));

    const pressColor = { 'Alta': P.red,  'Média': P.gold,     'Baixa': P.green       };
    const pressLight = { 'Alta': P.redLight, 'Média': P.goldLight, 'Baixa': P.greenLight };
    const sel = setupData.seasonObjective;

    React.useEffect(() => {
      if (!setupData.saveName && setupData.teamName) up({ saveName: setupData.teamName });
    }, []);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SetupCardHeader icon="📋" step={3} title="Save & Objetivos" />

        <Box sx={{ mb: 2 }}>
          <SetupSectionLabel label="NOME DO SAVE" />
          <input className="setup-input" value={setupData.saveName || ''} onChange={e => up({ saveName: e.target.value })} placeholder="Ex: Rumo ao Acesso, Glória Eterna..." style={inputStyle} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.7 }}>
            {[setupData.teamName, `${setupData.teamName} — Glória`, 'Rumo ao Topo', 'A Grande Virada'].filter(Boolean).map(s => (
              <Box key={s} onClick={() => up({ saveName: s })} sx={{
                bgcolor: setupData.saveName === s ? P.greenLight : P.bg,
                border: `1px solid ${setupData.saveName === s ? P.green : P.border}`,
                borderRadius: '8px', px: 0.9, py: 0.35, cursor: 'pointer',
              }}>
                <Typography sx={{ color: setupData.saveName === s ? P.greenDark : P.txt3, fontWeight: 900, fontSize: '0.6rem' }}>{s}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ height: 1, bgcolor: P.border, mb: 1.5 }} />
        <SetupSectionLabel label="OBJETIVO DA TEMPORADA" />

        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.7, mb: 1, '&::-webkit-scrollbar': { width: '3px' }, '&::-webkit-scrollbar-thumb': { bgcolor: P.border, borderRadius: '4px' } }}>
          {OBJECTIVES.map(obj => {
            const active = sel === obj.id;
            const pClr   = pressColor[obj.pressure];
            const pLt    = pressLight[obj.pressure];
            return (
              <Box key={obj.id} onClick={() => up({ seasonObjective: obj.id })} sx={{
                display: 'flex', alignItems: 'center', gap: 1.2,
                bgcolor: active ? `${pClr}08` : P.surface,
                border: `1.5px solid ${active ? pClr : P.border}`,
                borderRadius: '14px', px: 1.3, py: 1, cursor: 'pointer',
                transition: 'all 0.15s', boxShadow: active ? `0 2px 14px ${pClr}15` : '0 1px 3px rgba(0,0,0,0.04)',
                '&:active': { transform: 'scale(0.99)' },
              }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', flexShrink: 0, bgcolor: active ? `${pClr}15` : P.bg, border: `1.5px solid ${active ? pClr + '40' : P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>{obj.icon}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: active ? pClr : P.txt1, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>{obj.label}</Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>{obj.desc}</Typography>
                </Box>
                <Box sx={{ bgcolor: pLt, border: `1px solid ${pClr}30`, borderRadius: '8px', px: 0.7, py: 0.4, flexShrink: 0, textAlign: 'center' }}>
                  <Typography sx={{ color: pClr, fontWeight: 900, fontSize: '0.52rem' }}>{obj.pressure}</Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.4rem', fontWeight: 700 }}>PRESSÃO</Typography>
                </Box>
                {active && (
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: pClr, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>✓</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <SetupNavRow onBack={() => goCard(2)} onNext={() => goCard(4)} disabled={!isCardValid(3)} nextLabel="PERFIL DO TÉCNICO" />
      </Box>
    );
  };

export default SetupCareerStep;

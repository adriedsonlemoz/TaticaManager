import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel, SetupShirt } from '../SetupUi.jsx';

const SetupDivisionStep = ({
  setupData, up, goCard, isCardValid, availableTeams, brand,
  useExistingTeam, setUseExistingTeam, teamSearch, setTeamSearch,
  signing, setSigning, signed, setSigned, handleStartNewGame, savesList, setScreen,
}) => {
    const LEAGUES = [
      { id: 'A', label: 'Série A', sub: 'G4 Libertadores · Z4 Rebaixamento',    money: 'R$ 18M', color: P.green,  light: P.greenLight,  badge: 'A' },
      { id: 'B', label: 'Série B', sub: 'G4 Acesso à Série A · Z4 Rebaixamento', money: 'R$ 8M',  color: P.gold,   light: P.goldLight,   badge: 'B' },
      { id: 'C', label: 'Série C', sub: 'G4 Acesso à Série B · Z4 Rebaixamento', money: 'R$ 3M',  color: P.blue,   light: P.blueLight,   badge: 'C' },
      { id: 'D', label: 'Série D', sub: 'G4 Acesso à Série C · Criar clube',     money: 'R$ 1M',  color: P.purple, light: P.purpleLight, badge: 'D' },
    ];
    const DIFFS = [
      { id: 'Fácil',    icon: '🟢', mult: { injuryChance: 0.4, rivalStrength: 0.88, moneyBonus: 1.3,  fatigueLoss: 0.7 } },
      { id: 'Normal',   icon: '🟡', mult: { injuryChance: 1.0, rivalStrength: 1.0,  moneyBonus: 1.0,  fatigueLoss: 1.0 } },
      { id: 'Difícil',  icon: '🟠', mult: { injuryChance: 1.8, rivalStrength: 1.1,  moneyBonus: 0.85, fatigueLoss: 1.3 } },
      { id: 'Lendário', icon: '🔴', mult: { injuryChance: 2.8, rivalStrength: 1.2,  moneyBonus: 0.7,  fatigueLoss: 1.6 } },
    ];
    const selSerie = setupData.serie;
    const selDiff  = setupData.difficulty || 'Normal';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SetupCardHeader icon="🌎" step={1} title="Escolha a Divisão" />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.9, mb: 2 }}>
          {LEAGUES.map(lg => {
            const active = selSerie === lg.id;
            return (
              <Box key={lg.id}
                onClick={() => { up({ serie: lg.id }); setUseExistingTeam(lg.id !== 'D'); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  bgcolor: active ? lg.light : P.surface,
                  border: `1.5px solid ${active ? lg.color : P.border}`,
                  borderRadius: '14px', px: 1.5, py: 1.1, cursor: 'pointer',
                  transition: 'all 0.15s', '&:active': { transform: 'scale(0.985)' },
                  boxShadow: active ? `0 2px 16px ${lg.color}18` : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <Box sx={{
                  width: 48, height: 48, borderRadius: '12px',
                  bgcolor: active ? lg.color : P.bg,
                  border: `1.5px solid ${active ? lg.color : P.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  <Typography sx={{ color: active ? '#fff' : P.txt3, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, fontFamily: '"Nunito",sans-serif' }}>
                    {lg.badge}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: active ? lg.color : P.txt1, fontWeight: 900, fontSize: '0.97rem', lineHeight: 1 }}>
                    {lg.label}
                  </Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.62rem', fontWeight: 700, mt: 0.25 }}>{lg.sub}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ color: active ? lg.color : P.txt3, fontWeight: 900, fontSize: '0.78rem' }}>
                    💰 {lg.money}
                  </Typography>
                  {active && (
                    <Box sx={{ mt: 0.4, bgcolor: lg.color, borderRadius: '20px', px: 0.7, py: 0.15, display: 'inline-block' }}>
                      <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.45rem' }}>SELECIONADO</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {selSerie && (
          <>
            <Box sx={{ height: 1, bgcolor: P.border, mb: 1.8 }} />
            <SetupSectionLabel label="DIFICULDADE" />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.7, mb: 2 }}>
              {DIFFS.map(d => {
                const active = selDiff === d.id;
                return (
                  <Box key={d.id}
                    onClick={() => up({ difficulty: d.id, difficultyMultipliers: d.mult })}
                    sx={{
                      bgcolor: P.surface, border: `1.5px solid ${active ? P.green : P.border}`,
                      borderRadius: '12px', py: 1, px: 0.5, cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.15s', boxShadow: active ? `0 2px 12px ${P.shadow}` : 'none',
                      '&:active': { transform: 'scale(0.94)' },
                    }}
                  >
                    <Typography sx={{ fontSize: '1.2rem', lineHeight: 1, mb: 0.4 }}>{d.icon}</Typography>
                    <Typography sx={{ color: active ? P.green : P.txt2, fontWeight: 900, fontSize: '0.52rem', letterSpacing: 0.3 }}>
                      {d.id.toUpperCase()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        <SetupNavRow
          onBack={savesList.length > 0 ? () => setScreen('boot') : undefined}
          onNext={() => goCard(2)}
          nextLabel="ESCOLHER CLUBE"
          disabled={!selSerie}
        />
      </Box>
    );
  };

export default SetupDivisionStep;

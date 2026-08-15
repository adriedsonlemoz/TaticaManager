import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel, SetupShirt } from '../SetupUi.jsx';

const SetupKitStep = ({
  setupData, up, goCard, isCardValid, availableTeams, brand,
  useExistingTeam, setUseExistingTeam, teamSearch, setTeamSearch,
  signing, setSigning, signed, setSigned, handleStartNewGame, savesList, setScreen,
}) => {
    const b   = brand;
    const pri = setupData.colorPrimary   || b?.primary   || '#10b981';
    const sec = setupData.colorSecondary || b?.secondary || '#ffffff';
    const PALETTES = [
      { name: 'Rubro-Negro',  p: '#cc0000', s: '#1a1a1a' },
      { name: 'Alviverde',    p: '#006600', s: '#ffffff'  },
      { name: 'Tricolor',     p: '#cc0000', s: '#ffffff'  },
      { name: 'Alviceleste',  p: '#0044cc', s: '#ffffff'  },
      { name: 'Azul-Preto',   p: '#001a66', s: '#1a1a1a'  },
      { name: 'Alvinegro',    p: '#1a1a1a', s: '#ffffff'  },
      { name: 'Dourado',      p: '#c8920f', s: '#1a1a1a'  },
      { name: 'Roxo',         p: '#7b2d8b', s: '#ffffff'  },
      { name: 'Laranja',      p: '#d14f00', s: '#ffffff'  },
      { name: 'Marinho',      p: '#003580', s: '#ffffff'  },
    ];
    const UNIFORMS = [
      { primary: pri, secondary: sec,       number: '10', label: 'TITULAR'  },
      { primary: sec, secondary: pri,       number: '1',  label: 'RESERVA'  },
      { primary: '#1e2430', secondary: pri, number: '7',  label: '3º UNIF.' },
    ];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SetupCardHeader icon="👕" step={5} title="Uniforme do Clube" sub="AS CORES QUE REPRESENTAM SEU TIME" />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mb: 2.5, bgcolor: P.surface, borderRadius: '16px', py: 2.5, px: 1.5, border: `1.5px solid ${P.border}`, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          {UNIFORMS.map((sh, i) => (
            <Box key={i} sx={{ textAlign: 'center', opacity: i === 2 ? 0.5 : 1 }}>
              <SetupShirt primary={sh.primary} secondary={sh.secondary} number={sh.number} size={80} />
              <Typography sx={{ color: P.txt3, fontSize: '0.55rem', fontWeight: 900, mt: 0.7, letterSpacing: 1 }}>{sh.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '14px', p: 1.4, mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.2, mb: 1.2 }}>
            {[{ label: 'COR PRINCIPAL', key: 'colorPrimary', val: pri }, { label: 'COR SECUNDÁRIA', key: 'colorSecondary', val: sec }].map(c => (
              <Box key={c.key} sx={{ flex: 1 }}>
                <SetupSectionLabel label={c.label} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '9px', flexShrink: 0, bgcolor: c.val, border: `2px solid ${P.border}`, boxShadow: `0 2px 8px ${c.val}30` }} />
                  <input type="color" value={c.val} onChange={e => up({ [c.key]: e.target.value })} style={{ flex: 1, height: 36, borderRadius: '9px', border: `1.5px solid ${P.border}`, cursor: 'pointer', background: 'transparent', padding: 2 }} />
                </Box>
              </Box>
            ))}
          </Box>
          <SetupSectionLabel label="PALETAS RÁPIDAS" />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {PALETTES.map(pr => {
              const isActive = setupData.colorPrimary === pr.p && setupData.colorSecondary === pr.s;
              return (
                <Box key={pr.name} onClick={() => up({ colorPrimary: pr.p, colorSecondary: pr.s })} title={pr.name}
                  sx={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${isActive ? P.green : P.border}`, cursor: 'pointer', transition: 'transform 0.12s, border-color 0.12s', '&:hover': { transform: 'scale(1.1)', borderColor: P.green } }}>
                  <Box sx={{ width: 22, height: 22, bgcolor: pr.p }} />
                  <Box sx={{ width: 22, height: 22, bgcolor: pr.s }} />
                </Box>
              );
            })}
          </Box>
        </Box>

        <SetupNavRow onBack={() => goCard(4)} onNext={() => goCard(6)} nextLabel="VER CONTRATO" />
      </Box>
    );
  };

export default SetupKitStep;

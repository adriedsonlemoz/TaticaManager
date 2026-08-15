import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupNavRow, SetupSectionLabel, SetupShirt } from '../SetupUi.jsx';

const SetupManagerStep = ({
  setupData, up, goCard, isCardValid, availableTeams, brand,
  useExistingTeam, setUseExistingTeam, teamSearch, setTeamSearch,
  signing, setSigning, signed, setSigned, handleStartNewGame, savesList, setScreen,
}) => {
    const NATS = ['Brasileiro','Argentino','Português','Espanhol','Italiano','Alemão','Francês','Inglês','Uruguaio','Colombiano','Chileno','Paraguaio','Holandês','Belga','Croata','Japonês'];
    const STLS = [
      { id: 'Defensivo',   icon: '🛡️', desc: 'Solidez defensiva' },
      { id: 'Equilibrado', icon: '⚖️', desc: 'Equilíbrio tático'  },
      { id: 'Ofensivo',    icon: '⚔️', desc: 'Alta pressão'        },
      { id: 'Direto',      icon: '🎯', desc: 'Bola direta'         },
    ];
    const FMTS = ['4-4-2','4-3-3','4-2-3-1','3-5-2','3-4-3','5-3-2'];
    const AVST = [
      { id: 'suit',    emoji: '🤵', label: 'Terno'   },
      { id: 'jacket',  emoji: '🧥', label: 'Jaqueta' },
      { id: 'glasses', emoji: '🕶️', label: 'Óculos'  },
      { id: 'cap',     emoji: '🧢', label: 'Boné'    },
      { id: 'beard',   emoji: '🧔', label: 'Barba'   },
      { id: 'headset', emoji: '🎧', label: 'Fone'    },
    ];
    const selSt = setupData.avatarStyle || 'suit';
    const emoji = AVST.find(s => s.id === selSt)?.emoji || '🤵';
    const name  = setupData.managerName || '';
    const inits = name.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '??';
    const natColors = { 'Brasileiro': '#009c3b', 'Argentino': '#74acdf', 'Português': '#006600', 'Espanhol': '#c60b1e', 'Italiano': '#009246', 'Alemão': '#4a4a4a', 'Francês': '#0055a4', 'Inglês': '#cf142b' };
    const avBg = natColors[setupData.managerNationality] || '#1a3a5f';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SetupCardHeader icon="👔" step={4} title="Perfil do Técnico" sub="PERSONALIZE O TREINADOR" />

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ width: 76, height: 76, borderRadius: '22px', background: `linear-gradient(135deg,${avBg},${avBg}aa)`, border: `2.5px solid ${P.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 24px ${P.shadow}` }}>
              <Typography sx={{ fontSize: '2.8rem', lineHeight: 1 }}>{emoji}</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: P.green, borderRadius: '10px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${P.bg}`, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.6rem' }}>{inits}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.6, mb: 1.5 }}>
          {AVST.map(s => {
            const active = selSt === s.id;
            return (
              <Box key={s.id} onClick={() => up({ avatarStyle: s.id })} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
                bgcolor: active ? P.greenLight : P.surface,
                border: `1.5px solid ${active ? P.green : P.border}`,
                borderRadius: '10px', px: 0.7, py: 0.6, cursor: 'pointer',
                boxShadow: active ? `0 2px 10px ${P.shadow}` : 'none', transition: 'all 0.15s',
              }}>
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{s.emoji}</Typography>
                <Typography sx={{ color: active ? P.greenDark : P.txt3, fontWeight: 900, fontSize: '0.46rem' }}>{s.label.toUpperCase()}</Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ height: 1, bgcolor: P.border, mb: 1.5 }} />

        <Box sx={{ mb: 1.2 }}>
          <SetupSectionLabel label="NOME DO TREINADOR" />
          <input className="setup-input" value={setupData.managerName || ''} onChange={e => up({ managerName: e.target.value })} placeholder="Ex: José Mourinho" style={inputStyle} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.2 }}>
          <Box>
            <SetupSectionLabel label="IDADE" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '10px', px: 1, py: 0.6 }}>
              <Button onClick={() => up({ managerAge: Math.max(25, (setupData.managerAge || 40) - 1) })} sx={{ minWidth: 0, p: 0, color: P.green, fontWeight: 900, fontSize: '1.2rem' }}>−</Button>
              <Typography sx={{ flex: 1, textAlign: 'center', color: P.txt1, fontWeight: 900, fontSize: '1.15rem' }}>{setupData.managerAge || 40}</Typography>
              <Button onClick={() => up({ managerAge: Math.min(75, (setupData.managerAge || 40) + 1) })} sx={{ minWidth: 0, p: 0, color: P.green, fontWeight: 900, fontSize: '1.2rem' }}>+</Button>
            </Box>
          </Box>
          <Box>
            <SetupSectionLabel label="NACIONALIDADE" />
            <select value={setupData.managerNationality || 'Brasileiro'} onChange={e => up({ managerNationality: e.target.value })} style={{ ...inputStyle, padding: '9px 10px', appearance: 'none', cursor: 'pointer' }}>
              {NATS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Box>
        </Box>

        <Box sx={{ mb: 1.2 }}>
          <SetupSectionLabel label="ESTILO DE JOGO" />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.6 }}>
            {STLS.map(s => {
              const active = setupData.managerStyle === s.id;
              return (
                <Box key={s.id} onClick={() => up({ managerStyle: s.id })} sx={{
                  bgcolor: active ? P.greenLight : P.surface,
                  border: `1.5px solid ${active ? P.green : P.border}`,
                  borderRadius: '10px', p: 0.9, cursor: 'pointer', textAlign: 'center',
                  boxShadow: active ? `0 2px 10px ${P.shadow}` : 'none', transition: 'all 0.15s',
                }}>
                  <Typography sx={{ fontSize: '1.15rem', lineHeight: 1, mb: 0.3 }}>{s.icon}</Typography>
                  <Typography sx={{ color: active ? P.greenDark : P.txt2, fontWeight: 900, fontSize: '0.6rem' }}>{s.id}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <SetupSectionLabel label="FORMAÇÃO PREFERIDA" />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {FMTS.map(f => {
              const active = setupData.managerFormation === f;
              return (
                <Box key={f} onClick={() => up({ managerFormation: f })} sx={{
                  bgcolor: active ? P.green : P.surface,
                  border: `1.5px solid ${active ? P.green : P.border}`,
                  borderRadius: '8px', px: 1.1, py: 0.5, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <Typography sx={{ color: active ? '#fff' : P.txt2, fontWeight: 900, fontSize: '0.8rem' }}>{f}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <SetupNavRow onBack={() => goCard(3)} onNext={() => goCard(5)} disabled={!isCardValid(4)} nextLabel="VER UNIFORME" />
      </Box>
    );
  };

export default SetupManagerStep;

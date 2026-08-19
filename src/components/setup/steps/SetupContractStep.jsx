import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_INPUT_STYLE as inputStyle, formatSetupMoney as fmt } from '../setupTheme.js';
import { SetupCardHeader, SetupShirt } from '../SetupUi.jsx';
import { getCareerObjective } from '../../../engines/core/careerObjectives.js';

const SetupContractStep = ({
  setupData, up, goCard, isCardValid, brand,
  signing, setSigning, signed, setSigned, handleStartNewGame, savesList, setScreen,
}) => {
    const b   = brand;
    const pri = setupData.colorPrimary   || b?.primary   || P.green;
    const sec = setupData.colorSecondary || b?.secondary || '#ffffff';
    const objective = getCareerObjective(setupData.seasonObjective);
    const STLS = [{ id: 'Defensivo', icon: '🛡️' }, { id: 'Equilibrado', icon: '⚖️' }, { id: 'Ofensivo', icon: '⚔️' }, { id: 'Direto', icon: '🎯' }];

    const handleSign = () => {
      setSigning(true);
      setTimeout(() => setSigned(true), 1600);
      setTimeout(() => handleStartNewGame(setupData), 3100);
    };

    if (signed) return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
        <Box sx={{ fontSize: '4.5rem', mb: 1.5, animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', '@keyframes popIn': { '0%': { transform: 'scale(0)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } } }}>🎉</Box>
        <Typography sx={{ color: P.green, fontWeight: 900, fontSize: '1.5rem', fontFamily: '"Nunito",sans-serif', mb: 0.5 }}>CONTRATO ASSINADO!</Typography>
        <Typography sx={{ color: P.txt3, fontSize: '0.88rem', mb: 2.5 }}>Iniciando em {setupData.teamName}...</Typography>
        <Box sx={{ width: 200, height: 5, bgcolor: P.border, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', bgcolor: P.green, borderRadius: 3, animation: 'barFill 1.5s ease forwards', '@keyframes barFill': { from: { width: '0%' }, to: { width: '100%' } } }} />
        </Box>
      </Box>
    );

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SetupCardHeader icon="✍️" step={5} title="Assinar Contrato" sub="REVISE TODOS OS DETALHES" />

        <Box sx={{ flex: 1, overflowY: 'auto', mb: 1 }}>
          <Box sx={{ bgcolor: P.surface, border: `1.5px solid ${P.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg,${pri},${sec})` }} />

            <Box sx={{ px: 1.6, py: 1.3, bgcolor: `${pri}08`, borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box>
                <Typography sx={{ color: P.txt3, fontSize: '0.48rem', fontWeight: 700, letterSpacing: 1.5, mb: 0.2 }}>CONTRATO DE TRABALHO — TÉCNICO DE FUTEBOL</Typography>
                <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.2rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1 }}>{setupData.teamName}</Typography>
                <Typography sx={{ color: P.txt3, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }}>Série {setupData.serie} · Temporada 2026</Typography>
              </Box>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                <SetupShirt primary={pri} secondary={sec} accent={setupData.kitAccent} pattern={setupData.kitPattern} number="10" size={42} />
                <SetupShirt primary={sec} secondary={pri} accent={setupData.kitAccent} pattern="solid" number="1" size={42} />
              </Box>
            </Box>

            <Box sx={{ px: 1.6, py: 1.2 }}>
              {[
                { icon: '🎯', label: 'OBJETIVO',    value: objective ? `${objective.icon} ${objective.label}` : '—' },
                { icon: '⚙️', label: 'DIFICULDADE', value: setupData.difficulty || 'Normal' },
                { icon: '🎮', label: 'ESTILO',       value: `${STLS.find(s => s.id === setupData.managerStyle)?.icon || ''} ${setupData.managerStyle || 'Equilibrado'}` },
                { icon: '📐', label: 'FORMAÇÃO',     value: setupData.managerFormation || '4-4-2' },
                { icon: '🏟️', label: 'ESTÁDIO',      value: setupData.stadiumName || 'Não cadastrado' },
                { icon: '💰', label: 'CAIXA INICIAL', value: fmt(setupData.initialMoney) },
                { icon: '💾', label: 'SAVE',         value: `"${setupData.saveName}"` },
              ].map((row, i, arr) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.7, borderBottom: i < arr.length - 1 ? `1px solid ${P.bg}` : 'none' }}>
                  <Typography sx={{ fontSize: '0.85rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{row.icon}</Typography>
                  <Typography sx={{ color: P.txt3, fontSize: '0.58rem', fontWeight: 900, width: 76, flexShrink: 0, letterSpacing: 0.5 }}>{row.label}</Typography>
                  <Typography sx={{ color: P.txt1, fontSize: '0.72rem', fontWeight: 900 }}>{row.value}</Typography>
                </Box>
              ))}

              <Box sx={{ mt: 1.8, pt: 1.2, borderTop: `1.5px dashed ${P.border}` }}>
                {signing ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: P.green, fontSize: '0.7rem', fontWeight: 700, mb: 0.8 }}>✍️ Registrando assinatura...</Typography>
                    <Box sx={{ height: 4, bgcolor: P.bg, borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', bgcolor: P.green, borderRadius: 2, animation: 'signAnim 1.6s ease forwards', '@keyframes signAnim': { from: { width: '0%' }, to: { width: '100%' } } }} />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.05rem', fontStyle: 'italic', fontFamily: '"Nunito",sans-serif', borderBottom: `2px solid ${P.border}`, pb: 0.3, mb: 0.3 }}>
                        {setupData.managerName || '_________________'}
                      </Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.48rem', fontWeight: 900, letterSpacing: 1 }}>TÉCNICO</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.05rem', fontStyle: 'italic', fontFamily: '"Nunito",sans-serif', borderBottom: `2px solid ${P.border}`, pb: 0.3, mb: 0.3 }}>
                        {setupData.teamName || '_________________'}
                      </Typography>
                      <Typography sx={{ color: P.txt3, fontSize: '0.48rem', fontWeight: 900, letterSpacing: 1 }}>CLUBE</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => goCard(4)} disabled={signing} sx={{ color: P.txt3, border: `1.5px solid ${P.border}`, borderRadius: '12px', fontWeight: 900, px: 2.5, minWidth: 80, bgcolor: 'transparent', '&:hover': { borderColor: P.green, color: P.green } }}>← Voltar</Button>
          <Button fullWidth disabled={signing} onClick={handleSign} sx={{ py: 1.5, fontWeight: 900, fontSize: '1.05rem', borderRadius: '12px', bgcolor: signing ? P.bg : P.green, color: signing ? P.txt3 : '#fff', boxShadow: signing ? 'none' : `0 4px 20px ${P.shadow}`, border: `1.5px solid ${signing ? P.border : P.green}`, '&:hover': { bgcolor: signing ? P.bg : P.greenDark }, transition: 'all 0.2s' }}>
            {signing ? '⌛ Assinando...' : '✍️ ASSINAR CONTRATO'}
          </Button>
        </Box>
      </Box>
    );
  };

export default SetupContractStep;

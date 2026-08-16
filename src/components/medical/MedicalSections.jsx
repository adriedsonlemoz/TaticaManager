import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import MedicalSectionHeader from './MedicalSectionHeader.jsx';
import { FatigueCard, InjuryCard, SuspensionCard } from './MedicalPlayerCards.jsx';
import MedicalLegend from './MedicalLegend.jsx';

export default function MedicalSections({ viewModel, onTreat, onRecover, treatmentLabel, recoveryLabel }) {
  const C = THEME;
  const { injured, suspended, criticalFatigue, lowEnergy } = viewModel;

  return (
    <>
      {viewModel.allHealthy && (
        <Paper sx={{ textAlign:'center', py:4, px:2, bgcolor:C.card, border:`2px dashed ${C.green}60`, borderRadius:'14px', mb:2 }}>
          <Typography sx={{ fontSize:'2.5rem', mb:1 }}>💪</Typography>
          <Typography sx={{ color:C.green, fontWeight:900, fontSize:'1.1rem' }}>Elenco em plena forma!</Typography>
          <Typography sx={{ color:C.txt2, fontSize:'0.8rem', mt:0.5 }}>Nenhum jogador lesionado, suspenso ou com cansaço crítico.</Typography>
        </Paper>
      )}

      {injured.length > 0 && <Box sx={{ mb:2 }}><MedicalSectionHeader icon="🚑" title="DEPARTAMENTO MÉDICO" count={injured.length} color={C.red}/>{injured.map((row) => <InjuryCard key={row.player.id} row={row} onTreat={onTreat} treatmentLabel={treatmentLabel}/>)}</Box>}
      {suspended.length > 0 && <Box sx={{ mb:2 }}><MedicalSectionHeader icon="🚫" title="SUSPENSOS" count={suspended.length} color={C.yellow}/>{suspended.map((row) => <SuspensionCard key={row.player.id} row={row}/>)}</Box>}
      {criticalFatigue.length > 0 && <Box sx={{ mb:2, mt:injured.length || suspended.length ? 2 : 0 }}><MedicalSectionHeader icon="😓" title="CANSAÇO CRÍTICO (< 50%)" count={criticalFatigue.length} color={C.red}/>{criticalFatigue.map((row) => <FatigueCard key={row.player.id} row={row} onRecover={onRecover} recoveryLabel={recoveryLabel}/>)}</Box>}
      {lowEnergy.length > 0 && <Box sx={{ mb:2, mt:1.5, pt:1.5, borderTop:`1px dashed ${C.border}` }}><MedicalSectionHeader icon="⚡" title="ATENÇÃO — ENERGIA BAIXA (50–79%)" count={lowEnergy.length} color={C.yellow}/>{lowEnergy.map((row) => <FatigueCard key={row.player.id} row={row} onRecover={onRecover} recoveryLabel={recoveryLabel}/>)}</Box>}
      <MedicalLegend />
    </>
  );
}

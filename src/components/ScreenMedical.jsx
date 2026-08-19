import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import MedicalHeader from './medical/MedicalHeader.jsx';
import MedicalSections from './medical/MedicalSections.jsx';
import {
  MEDICAL_COSTS,
  buildMedicalViewModel,
  recoverPlayerEnergyState,
  runPhysioSessionState,
  treatInjuryState,
} from '../engines/medical/medicalViewModel.js';

const ScreenMedical = ({ gameData, setGameData, showToast, formatMoney }) => {
  const C = THEME;
  const viewModel = React.useMemo(() => buildMedicalViewModel(gameData), [gameData]);
  const fmt = React.useCallback((value) => formatMoney ? formatMoney(value) : `R$${(value / 1000).toFixed(0)}K`, [formatMoney]);

  const commit = React.useCallback((result) => {
    if (result.error) {
      showToast(result.error, 'error');
      return false;
    }
    setGameData(result.state);
    if (result.message) showToast(result.message, 'success');
    return true;
  }, [setGameData, showToast]);

  const handleTreat = React.useCallback((player) => commit(treatInjuryState(gameData, player.id)), [commit, gameData]);
  const handleRecover = React.useCallback((player) => commit(recoverPlayerEnergyState(gameData, player.id)), [commit, gameData]);
  const handlePhysio = React.useCallback(() => commit(runPhysioSessionState(gameData)), [commit, gameData]);

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100dvh', pb:5.5 }}>
      <MedicalHeader viewModel={viewModel} />
      <Box sx={{ px:1.5, pt:1.5 }}>
        <Button fullWidth onClick={handlePhysio} variant="outlined" sx={{ mb:2, py:1.2, borderColor:C.primary, color:C.primary, fontWeight:900, fontSize:'0.82rem', borderRadius:'10px', '&:hover':{ bgcolor:'rgba(17,138,139,0.08)', borderColor:C.prim2 } }}>
          🧘 FISIOTERAPIA COLETIVA · {fmt(MEDICAL_COSTS.PHYSIO_SESSION)}<br/>
          <Typography component="span" sx={{ fontSize:'0.6rem', color:C.txt3, fontWeight:700 }}>+15% energia para todo o elenco</Typography>
        </Button>
        <MedicalSections
          viewModel={viewModel}
          onTreat={handleTreat}
          onRecover={handleRecover}
          treatmentLabel={`-${fmt(MEDICAL_COSTS.TREAT_INJURY)}`}
          recoveryLabel={`-${fmt(MEDICAL_COSTS.RECOVER_ENERGY)}`}
        />
      </Box>
    </Box>
  );
};

export default ScreenMedical;

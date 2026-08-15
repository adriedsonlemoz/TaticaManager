import React from 'react';
import { Box, Typography } from '@mui/material';
import SetupSteps from './setup/SetupSteps.jsx';
import { SetupProgressBar } from './setup/SetupUi.jsx';
import { SETUP_PALETTE as P, SETUP_TOTAL_STEPS } from './setup/setupTheme.js';
import { getAvailableSetupTeams, getSetupTeamBrand, getSetupTeamDefaults, isSetupStepValid } from './setup/setupService.js';

const ScreenSetup = ({ setupData, setSetupData, handleStartNewGame, savesList, setScreen }) => {
  const [card, setCard] = React.useState(1);
  const [useExistingTeam, setUseExistingTeam] = React.useState(false);
  const [signing, setSigning] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const [entering, setEntering] = React.useState(false);
  const [teamSearch, setTeamSearch] = React.useState('');

  const up = React.useCallback(fields => setSetupData(prev => ({ ...prev, ...fields })), [setSetupData]);
  const goCard = React.useCallback(nextCard => { setEntering(true); setTimeout(() => { setCard(nextCard); setEntering(false); }, 170); }, []);

  React.useEffect(() => {
    if (card !== 5) return;
    const patch = getSetupTeamDefaults(setupData);
    if (Object.keys(patch).length) up(patch);
  }, [card, setupData, up]);

  const availableTeams = React.useMemo(() => getAvailableSetupTeams(setupData.serie || 'A'), [setupData.serie]);
  const brand = React.useMemo(() => getSetupTeamBrand(setupData.teamName), [setupData.teamName]);
  const isCardValid = React.useCallback(step => isSetupStepValid(step, setupData), [setupData]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: P.bg, background: `radial-gradient(ellipse at 60% 0%, rgba(16,185,129,0.07) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(16,185,129,0.04) 0%, transparent 40%), ${P.bg}`, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
      <style>{`.setup-input:focus { border-color: #10b981 !important; } .setup-input::placeholder { color: #b5d4c2; } select option { background: #fff; color: #0d1f17; }`}</style>
      <Box sx={{ width: '100%', maxWidth: 440, px: 2, pt: 4, pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: P.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${P.shadow}` }}><Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>⚽</Typography></Box>
            <Box><Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1.0rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1 }}>TÁTICA MANAGER</Typography><Typography sx={{ color: P.green, fontWeight: 900, fontSize: '0.46rem', letterSpacing: 3, lineHeight: 1 }}>MANAGER · NOVA CARREIRA</Typography></Box>
          </Box>
          <Box sx={{ bgcolor: P.surface, border: `1px solid ${P.border}`, borderRadius: '8px', px: 1.1, py: 0.5, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><Typography sx={{ color: P.green, fontWeight: 900, fontSize: '0.68rem' }}>{card}/{SETUP_TOTAL_STEPS}</Typography></Box>
        </Box>
        <SetupProgressBar step={card} />
      </Box>
      <Box sx={{ width: '100%', maxWidth: 440, px: 2, pb: 3, flex: 1, display: 'flex', flexDirection: 'column', opacity: entering ? 0 : 1, transform: entering ? 'translateY(10px)' : 'translateY(0px)', transition: 'opacity 0.17s ease, transform 0.17s ease' }}>
        <SetupSteps card={card} setupData={setupData} up={up} goCard={goCard} isCardValid={isCardValid} availableTeams={availableTeams} brand={brand} useExistingTeam={useExistingTeam} setUseExistingTeam={setUseExistingTeam} teamSearch={teamSearch} setTeamSearch={setTeamSearch} signing={signing} setSigning={setSigning} signed={signed} setSigned={setSigned} handleStartNewGame={handleStartNewGame} savesList={savesList} setScreen={setScreen} />
      </Box>
    </Box>
  );
};
export default ScreenSetup;

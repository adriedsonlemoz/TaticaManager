import React from 'react';
import { Box, Button } from '@mui/material';
import { THEME } from '../theme.js';
import CupCard from './cups/CupCard.jsx';
import { CUP_TABS, CupScreenHeader, CupTabs } from './cups/CupNavigation.jsx';
import { getCupByTab } from './cups/cupPresentation.js';

const ScreenCopas = ({ gameData, setScreen, formatMoney }) => {
  const [tab, setTab] = React.useState('copa');
  const C = THEME;
  const cups = gameData?.cups || {};
  const activeTab = CUP_TABS.find((item) => item.id === tab) || CUP_TABS[0];
  const cup = getCupByTab(cups, activeTab.id);
  const color = C[activeTab.colorKey];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10, background: `linear-gradient(180deg, ${C.bgCardAlt}, ${C.bg})` }}>
      <CupScreenHeader />
      <CupTabs tab={activeTab.id} onChange={setTab} />

      <Box sx={{ px: 1.5, pt: 1.5 }}>
        <CupCard cup={cup} label={activeTab.title} color={color} formatMoney={formatMoney} />
        <Button fullWidth onClick={() => setScreen('matches')} sx={{
          bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
          color: C.txt2, fontWeight: 900, py: 1.2, mt: 0.5,
          '&:hover': { borderColor: C.primary, color: C.primary },
        }}>
          📅 Ver no Calendário de Partidas
        </Button>
      </Box>
    </Box>
  );
};

export default ScreenCopas;

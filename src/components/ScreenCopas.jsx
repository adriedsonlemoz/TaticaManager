import React from 'react';
import { Box, Button } from '@mui/material';
import { THEME } from '../theme.js';
import { getClubAccentTheme } from '../utils/clubTheme.js';
import CupCard from './cups/CupCard.jsx';
import CompetitionOverview from './cups/CompetitionOverview.jsx';
import { CUP_TABS, CupScreenHeader, CupTabs } from './cups/CupNavigation.jsx';
import { getCupByTab } from './cups/cupPresentation.js';

const ScreenCopas = ({ gameData, setScreen, formatMoney }) => {
  const [tab, setTab] = React.useState('overview');
  const C = React.useMemo(() => getClubAccentTheme(THEME, gameData?.club?.name), [gameData?.club?.name]);
  const cups = gameData?.cups || {};
  const activeTab = CUP_TABS.find((item) => item.id === tab) || CUP_TABS[0];
  const cup = getCupByTab(cups, activeTab.id);
  const color = cup?.color || C[activeTab.colorKey] || C.primary;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', pb: 6.5, background: `linear-gradient(180deg, ${C.clubTint || C.bgCardAlt}, ${C.bg} 24%)` }}>
      <CupScreenHeader theme={C} />
      <CupTabs tab={activeTab.id} onChange={setTab} theme={C} />

      {activeTab.id === 'overview' ? (
        <CompetitionOverview
          gameData={gameData}
          theme={C}
          onOpenLeague={() => setScreen('table')}
          onOpenCalendar={() => setScreen('matches')}
          onOpenCup={setTab}
        />
      ) : (
        <Box sx={{ px: 1.25, pt: 1.15 }}>
          <CupCard cup={cup} label={cup?.label || activeTab.title} color={color} formatMoney={formatMoney} />
          <Button fullWidth onClick={() => setScreen('matches')} sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.txt2, fontWeight: 900, py: 1.1, mt: 0.3, '&:hover': { borderColor: C.primary, color: C.primary } }}>
            📅 Ver no Calendário de Partidas
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ScreenCopas;

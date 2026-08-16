import React from 'react';
import { Box } from '@mui/material';
import { DARK_THEME as D } from '../theme.js';
import { buildSeasonEndViewModel } from '../engines/season/seasonEndViewModel.js';
import SeasonEndHero from './seasonEnd/SeasonEndHero.jsx';
import SeasonEndTabs from './seasonEnd/SeasonEndTabs.jsx';
import SeasonEndSeasonTab from './seasonEnd/SeasonEndSeasonTab.jsx';
import SeasonEndSquadTab from './seasonEnd/SeasonEndSquadTab.jsx';
import SeasonEndFinanceTab from './seasonEnd/SeasonEndFinanceTab.jsx';
import SeasonEndFinalTable from './seasonEnd/SeasonEndFinalTable.jsx';
import SeasonEndActions from './seasonEnd/SeasonEndActions.jsx';

const COLOR_BY_TONE = {
  success: D.green,
  danger: D.red,
  gold: D.gold,
};

const ScreenSeasonEnd = ({ gameData, setScreen, formatMoney, saveGame }) => {
  const [tab, setTab] = React.useState(0);
  const vm = React.useMemo(() => buildSeasonEndViewModel(gameData || {}), [gameData]);
  const color = COLOR_BY_TONE[vm.tone] || D.gold;
  const money = React.useCallback((value) => (
    formatMoney ? formatMoney(value) : `R$ ${Number(value || 0).toLocaleString('pt-BR')}`
  ), [formatMoney]);

  return (
    <Box sx={{ bgcolor: D.bg, minHeight: '100vh', pb: 10, background: `radial-gradient(ellipse at 50% 0%, ${color}15 0%, transparent 50%), ${D.bg}` }}>
      <SeasonEndHero vm={vm} color={color} />
      <SeasonEndTabs tab={tab} onChange={setTab} />
      <Box sx={{ px: 1.5 }}>
        {tab === 0 && <SeasonEndSeasonTab vm={vm} color={color} formatMoney={money} />}
        {tab === 1 && <SeasonEndSquadTab vm={vm} formatMoney={money} />}
        {tab === 2 && <SeasonEndFinanceTab vm={vm} formatMoney={money} />}
        {tab === 3 && <SeasonEndFinalTable vm={vm} />}
      </Box>
      <SeasonEndActions
        color={color}
        nextSeason={vm.nextSeason.season}
        onStart={() => { saveGame?.(); setScreen('home'); }}
        onTable={() => setTab(3)}
      />
    </Box>
  );
};

export default ScreenSeasonEnd;

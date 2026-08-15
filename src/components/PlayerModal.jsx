import React from 'react';
import { Dialog } from '@mui/material';
import { THEME } from '../theme.js';
import { getTakenShirts } from '../engines/player/playerProfileService.js';
import PlayerModalHeader from './player/PlayerModalHeader.jsx';
import PlayerModalTabs from './player/PlayerModalTabs.jsx';
import PlayerProfileTab from './player/PlayerProfileTab.jsx';
import PlayerSeasonTab from './player/PlayerSeasonTab.jsx';
import PlayerShirtTab from './player/PlayerShirtTab.jsx';
import PlayerWageTab from './player/PlayerWageTab.jsx';
import PlayerDisciplineTab from './player/PlayerDisciplineTab.jsx';

const PlayerModal = ({
  player,
  allPlayers = [],
  onClose,
  onSell,
  onUpdateShirt,
  onUpdateWage,
  formatMoney,
  showToast,
  currentRound,
  onSetGameData,
}) => {
  const [tab, setTab] = React.useState('info');
  const takenShirts = React.useMemo(
    () => getTakenShirts(allPlayers, player.id),
    [allPlayers, player.id],
  );

  const commonPaper = {
    m: 1,
    borderRadius: '16px',
    bgcolor: THEME.bgCard,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    backgroundImage: 'none',
    border: `1px solid ${THEME.border}`,
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: commonPaper }}>
      <PlayerModalHeader player={player} />
      <PlayerModalTabs tab={tab} onChange={setTab} />

      {tab === 'info' && (
        <PlayerProfileTab
          player={player}
          formatMoney={formatMoney}
          onClose={onClose}
          onSell={onSell}
          onSetGameData={onSetGameData}
          showToast={showToast}
        />
      )}

      {tab === 'season' && (
        <PlayerSeasonTab player={player} formatMoney={formatMoney} onRenew={() => setTab('wage')} />
      )}

      {tab === 'shirt' && (
        <PlayerShirtTab player={player} takenShirts={takenShirts} onUpdateShirt={onUpdateShirt} />
      )}

      {tab === 'wage' && (
        <PlayerWageTab
          player={player}
          allPlayers={allPlayers}
          formatMoney={formatMoney}
          onUpdateWage={onUpdateWage}
          onClose={onClose}
          onSaved={() => setTab('info')}
        />
      )}

      {tab === 'discipline' && (
        <PlayerDisciplineTab player={player} currentRound={currentRound} onClose={onClose} />
      )}
    </Dialog>
  );
};

export default PlayerModal;

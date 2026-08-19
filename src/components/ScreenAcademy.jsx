import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import AcademyHeader from './academy/AcademyHeader.jsx';
import AcademySquadTab from './academy/AcademySquadTab.jsx';
import AcademyInvestTab from './academy/AcademyInvestTab.jsx';
import { AcademyDispenseDialog, AcademyPromoteDialog } from './academy/AcademyDialogs.jsx';
import {
  buildAcademyViewModel,
  dispenseProspectState,
  ensureAcademyState,
  investAcademyState,
  promoteProspectState,
} from '../engines/academy/academyViewModel.js';

const ScreenAcademy = ({ gameData, setGameData, showToast, formatMoney }) => {
  const C = THEME;
  const [tab, setTab] = React.useState('squad');
  const [filter, setFilter] = React.useState('all');
  const [selectedProspectId, setSelectedProspectId] = React.useState(null);
  const [confirmPromote, setConfirmPromote] = React.useState(null);
  const [confirmDispense, setConfirmDispense] = React.useState(null);

  React.useEffect(() => {
    if (!Array.isArray(gameData?.academy)) setGameData((previous) => ensureAcademyState(previous));
  }, [gameData?.academy, setGameData]);

  const viewModel = React.useMemo(() => buildAcademyViewModel(gameData, filter), [gameData, filter]);
  const money = gameData.club?.money || 0;
  const fmt = React.useCallback(
    (value) => formatMoney ? formatMoney(value) : `R$${((Number(value) || 0) / 1e6).toFixed(1)}M`,
    [formatMoney],
  );

  React.useEffect(() => {
    if (selectedProspectId && !viewModel.prospects.some((prospect) => prospect.id === selectedProspectId)) {
      setSelectedProspectId(null);
    }
  }, [selectedProspectId, viewModel.prospects]);

  const handleToggleProspect = React.useCallback((prospect) => {
    setSelectedProspectId((current) => current === prospect.id ? null : prospect.id);
  }, []);

  const handlePromote = React.useCallback((prospect) => {
    setGameData((previous) => promoteProspectState(previous, prospect));
    showToast(`🌟 ${prospect.name} promovido ao profissional!`, 'success');
    setConfirmPromote(null);
    setSelectedProspectId(null);
  }, [setGameData, showToast]);

  const handleDispense = React.useCallback((prospect) => {
    setGameData((previous) => dispenseProspectState(previous, prospect.id));
    showToast(`${prospect.name} dispensado da base.`, 'info');
    setConfirmDispense(null);
    setSelectedProspectId(null);
  }, [setGameData, showToast]);

  const handleInvest = React.useCallback((level) => {
    const preview = investAcademyState(gameData, level);
    if (preview.error) {
      showToast(preview.error, 'error');
      return;
    }
    setGameData((previous) => investAcademyState(previous, level).state);
    showToast(`✅ Academia atualizada: ${preview.label || level}!`, 'success');
    setTab('squad');
  }, [gameData, setGameData, showToast]);

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', pb: 5.5 }}>
      <AcademyHeader
        clubName={gameData.club?.name}
        viewModel={viewModel}
        tab={tab}
        onTabChange={setTab}
      />

      <Box sx={{ px: 1.5, pt: 1.5 }}>
        {tab === 'squad' ? (
          <AcademySquadTab
            viewModel={viewModel}
            filter={filter}
            onFilterChange={setFilter}
            selectedProspectId={selectedProspectId}
            onToggleProspect={handleToggleProspect}
            onRequestPromote={setConfirmPromote}
            onRequestDispense={setConfirmDispense}
            formatMoney={fmt}
          />
        ) : (
          <AcademyInvestTab
            viewModel={viewModel}
            money={money}
            formatMoney={fmt}
            onInvest={handleInvest}
          />
        )}
      </Box>

      <AcademyPromoteDialog prospect={confirmPromote} formatMoney={fmt} onClose={() => setConfirmPromote(null)} onConfirm={handlePromote} />
      <AcademyDispenseDialog prospect={confirmDispense} onClose={() => setConfirmDispense(null)} onConfirm={handleDispense} />
    </Box>
  );
};

export default ScreenAcademy;

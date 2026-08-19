import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import ScreenAbout from './ScreenAbout.jsx';
import BootEmptyState from './boot/BootEmptyState.jsx';
import BootFooter from './boot/BootFooter.jsx';
import BootHeader from './boot/BootHeader.jsx';
import BootLoadingOverlay from './boot/BootLoadingOverlay.jsx';
import BootSaveCard from './boot/BootSaveCard.jsx';
import { buildSaveViewModel, getBootStats, sortSavesByRecent } from '../engines/boot/bootViewModel.js';

const ScreenBoot = ({ savesList = [], loadSpecificGame, setScreen, setDeleteSaveModal }) => {
  const [loading, setLoading] = React.useState(null);
  const [expandedSave, setExpandedSave] = React.useState(null);
  const [showAbout, setShowAbout] = React.useState(false);

  const sortedSaves = React.useMemo(() => sortSavesByRecent(savesList), [savesList]);
  const stats = React.useMemo(() => getBootStats(sortedSaves), [sortedSaves]);
  const saveModels = React.useMemo(() => {
    const now = Date.now();
    return sortedSaves.map((meta) => buildSaveViewModel(meta, now));
  }, [sortedSaves]);

  const handleLoad = React.useCallback(async (meta) => {
    try {
      setLoading(meta.name);
      await loadSpecificGame(meta);
    } catch (error) {
      console.error('Erro ao carregar save:', error);
      setLoading(null);
    }
  }, [loadSpecificGame]);

  if (showAbout) return <ScreenAbout onBack={() => setShowAbout(false)} />;

  const C = THEME;
  return (
    <Box sx={{ height: '100dvh', minHeight: 0, background: `radial-gradient(ellipse at 50% 0%, rgba(160,120,32,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 100%, rgba(26,107,53,0.05) 0%, transparent 40%), ${C.bg}`, display: 'flex', flexDirection: 'column' }}>
      <BootLoadingOverlay saveName={loading} theme={C} />
      <BootHeader stats={stats} theme={C} />

      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 1, sm: 1.5 }, pt: 0.8, pb: 0.6, minHeight: 0 }}>
        {saveModels.length === 0 ? (
          <BootEmptyState onNewCareer={() => setScreen('setup')} theme={C} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.25 }}>
            <Typography sx={{ color: C.ink3, fontWeight: 900, fontSize: '0.7rem', letterSpacing: 2, textAlign: 'center' }}>SUAS CARREIRAS</Typography>
            {saveModels.map((save, index) => (
              <BootSaveCard
                key={save.name}
                save={save}
                featured={index === 0}
                expanded={expandedSave === save.name}
                loading={loading}
                onToggle={() => setExpandedSave((current) => current === save.name ? null : save.name)}
                onLoad={() => handleLoad(save)}
                onDelete={() => setDeleteSaveModal(save)}
                theme={C}
              />
            ))}
          </Box>
        )}
      </Box>

      <BootFooter onNewCareer={() => setScreen('setup')} onAbout={() => setShowAbout(true)} theme={C} />
    </Box>
  );
};

export default ScreenBoot;

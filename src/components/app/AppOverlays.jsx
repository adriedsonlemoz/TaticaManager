import React from 'react';
import { Box, Button, Dialog, Typography } from '@mui/material';
import PlayerModal from '../PlayerModal.jsx';

const toastBorder = severity => (
  severity === 'error' ? '#941818'
    : severity === 'warning' ? '#b87a00'
      : severity === 'info' ? '#22c55e'
        : '#32a852'
);

const toastIcon = severity => (
  severity === 'error' ? '❌'
    : severity === 'warning' ? '⚠️'
      : severity === 'info' ? 'ℹ️'
        : '✅'
);

export default function AppOverlays({ controller }) {
  const {
    gameData, setGameData, playerModalData, setPlayerModalData, playerModalRound,
    sellPlayer, updateShirt, updateWage, renewPlayerContract, formatMoney, showToast,
    toast, setToast, lineupDialog, setLineupDialog,
    deleteSaveModal, setDeleteSaveModal, handleConfirmDelete,
    dirtyNavTarget, setDirtyNavTarget, setIsDirtyLineup, setScreen,
  } = controller;

  return (
    <>
      {playerModalData && gameData && (
        <PlayerModal
          player={playerModalData}
          allPlayers={gameData.players || []}
          onClose={() => setPlayerModalData(null)}
          currentRound={playerModalRound}
          onSell={playerOrId => {
            const id = typeof playerOrId === 'string' ? playerOrId : playerOrId?.id;
            const fresh = (gameData.players || []).find(player => player.id === id) || playerOrId;
            if (!fresh) return;
            sellPlayer(fresh, Math.floor(Math.max(50000, fresh.value || 0) * 0.8));
            setPlayerModalData(null);
          }}
          onUpdateShirt={(id, shirt) => updateShirt(id, shirt, 'Camisa atualizada!')}
          onUpdateWage={updateWage}
          onRenewContract={renewPlayerContract}
          formatMoney={formatMoney}
          showToast={showToast}
          onSetGameData={setGameData}
        />
      )}

      <Dialog open={toast.open} onClose={() => setToast(current => ({ ...current, open: false }))} PaperProps={{ sx: { bgcolor: '#0f2214', border: `3px solid ${toastBorder(toast.severity)}`, borderRadius: '16px', p: 3, textAlign: 'center', minWidth: '280px', maxWidth: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' } }}>
        <Typography sx={{ fontSize: '3rem', mb: 1, lineHeight: 1 }}>{toastIcon(toast.severity)}</Typography>
        <Typography sx={{ color: '#e6edf3', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.3 }}>{toast.message}</Typography>
        {toast.detail && <Typography sx={{ color: '#8b949e', fontSize: '0.75rem', mt: 1.2, lineHeight: 1.5 }}>{toast.detail}</Typography>}
      </Dialog>

      <Dialog open={lineupDialog.open} onClose={() => setLineupDialog({ open: false, n: 0 })}>
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#0f2214', borderRadius: '12px' }}>
          <Typography sx={{ mb: 2, color: '#e6edf3', fontWeight: 700 }}>⚠️ Você precisa de exatamente <strong>11 titulares</strong>.<br />Atual: <strong>{lineupDialog.n}</strong> jogadores.</Typography>
          <Button variant="contained" onClick={() => setLineupDialog({ open: false, n: 0 })} sx={{ bgcolor: '#22c55e', fontWeight: 900 }}>OK</Button>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteSaveModal)} onClose={() => setDeleteSaveModal(null)}>
        <Box sx={{ p: 3, textAlign: 'center', minWidth: 280, bgcolor: '#0d1117', border: '2px solid #f85149', borderRadius: '12px' }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>🗑️</Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#e6edf3' }}>Deletar carreira?</Typography>
          <Typography sx={{ color: '#8b949e', fontSize: '0.9rem', mb: 3 }}>
            "{typeof deleteSaveModal === 'object' ? deleteSaveModal?.name : deleteSaveModal}" será deletada permanentemente.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => setDeleteSaveModal(null)} sx={{ borderColor: '#30363d', color: '#8b949e', fontWeight: 900 }}>Cancelar</Button>
            <Button variant="contained" onClick={handleConfirmDelete} sx={{ bgcolor: '#f85149', fontWeight: 900, '&:hover': { bgcolor: '#da3633' } }}>Deletar</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={Boolean(dirtyNavTarget)} onClose={() => setDirtyNavTarget(null)}>
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#0f2214', borderRadius: '12px', minWidth: 280 }}>
          <Typography sx={{ mb: 2, color: '#e6edf3', fontWeight: 700 }}>⚠️ Alterações táticas não salvas.<br />Sair mesmo assim?</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => setDirtyNavTarget(null)} sx={{ color: '#94a3b8', borderColor: '#94a3b8' }}>Cancelar</Button>
            <Button variant="contained" onClick={() => {
              setIsDirtyLineup(false);
              setScreen(dirtyNavTarget);
              setDirtyNavTarget(null);
            }} sx={{ bgcolor: '#941818', fontWeight: 900, '&:hover': { bgcolor: '#b91c1c' } }}>
              Sair sem salvar
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

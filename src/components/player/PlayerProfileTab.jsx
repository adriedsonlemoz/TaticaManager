import React from 'react';
import { Box, Button, Divider, Paper, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { getPotentialRange, setTransferListing } from '../../engines/player/playerProfileService.js';

export default function PlayerProfileTab({
  player,
  formatMoney,
  onClose,
  onSell,
  onSetGameData,
  showToast,
}) {
  const C = THEME;
  const energy = player.energy ?? 100;
  const energyColor = energy < 50 ? C.red : energy < 75 ? C.orange : C.green;
  const injured = Boolean(player.injury);
  const potential = getPotentialRange(player);
  const sellValue = Math.floor(Math.max(50000, player.value || 0) * 0.8);

  const handleListing = (listPlayer) => {
    if (onSetGameData) {
      onSetGameData((previous) => setTransferListing(previous, player, listPlayer));
    } else if (listPlayer && onSell) {
      onSell({ ...player, _listOnly: true });
    }

    if (listPlayer) {
      showToast?.(`📋 ${player.name.split(' ').pop()} na lista! Propostas chegarão no inbox.`, 'success');
    } else {
      showToast?.(`${player.name.split(' ').pop()} removido da lista.`, 'info');
    }
    onClose();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 1.5, mb: 1.5, bgcolor: C.bgCard, border: `1px solid ${C.bord2}`, borderRadius: '10px', display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 900 }}>CONDIÇÃO FÍSICA</Typography>
            <Typography sx={{ color: energyColor, fontSize: '0.7rem', fontWeight: 900 }}>{energy}%</Typography>
          </Box>
          <Box sx={{ height: 6, bgcolor: 'rgba(54,36,20,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${energy}%`, bgcolor: energyColor, transition: 'width 0.5s' }} />
          </Box>
        </Box>
        <Box sx={{ width: 1, height: 30, bgcolor: C.bord2, opacity: 0.5 }} />
        <Box sx={{ textAlign: 'center', minWidth: 60 }}>
          {injured ? (
            <>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>🚑</Typography>
              <Typography sx={{ color: C.red, fontSize: '0.6rem', fontWeight: 900 }}>{player.injury.roundsLeft} JOGOS</Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>🏃</Typography>
              <Typography sx={{ color: C.green, fontSize: '0.6rem', fontWeight: 900 }}>SAUDÁVEL</Typography>
            </>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: potential ? 1 : 2 }}>
        <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '8px', p: 1, textAlign: 'center' }}>
          <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 900 }}>VALOR DE MERCADO</Typography>
          <Typography sx={{ color: C.txt1, fontSize: '0.9rem', fontWeight: 900 }}>{formatMoney(player.value)}</Typography>
        </Box>
        <Box sx={{ bgcolor: C.cardAlt, border: `1px solid ${C.bord2}`, borderRadius: '8px', p: 1, textAlign: 'center' }}>
          <Typography sx={{ color: C.txt3, fontSize: '0.6rem', fontWeight: 900 }}>SALÁRIO POR JOGO</Typography>
          <Typography sx={{ color: C.txt1, fontSize: '0.9rem', fontWeight: 900 }}>{formatMoney(player.wage || 0)}</Typography>
        </Box>
      </Box>

      {potential && (
        <Box sx={{ bgcolor: '#7c3aed12', border: '1.5px solid #7c3aed40', borderRadius: '10px', p: 1.2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
            <Typography sx={{ color: '#7c3aed', fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>⭐ JOVEM PROMESSA</Typography>
            <Typography sx={{ color: '#7c3aed', fontWeight: 900, fontSize: '0.75rem' }}>{potential.min}–{potential.max} potencial</Typography>
          </Box>
          <Box sx={{ height: 6, bgcolor: 'rgba(124,58,237,0.12)', borderRadius: 3, overflow: 'hidden', mb: 0.5 }}>
            <Box sx={{ height: '100%', width: `${potential.progress}%`, bgcolor: '#7c3aed', borderRadius: 3 }} />
          </Box>
          <Typography sx={{ color: '#7c3aed', fontSize: '0.56rem', fontWeight: 700 }}>
            Treinos intensivos têm maior chance de evolução. OVR atual: {player.overall}
          </Typography>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(166,131,77,0.3)', mb: 1.5 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={onClose} sx={{ color: C.txt2, borderColor: C.border, fontWeight: 900, borderRadius: '8px', '&:hover': { borderColor: C.primary, color: C.primary } }}>
          FECHAR
        </Button>
        {player.isListed ? (
          <Button fullWidth variant="contained" onClick={() => handleListing(false)} sx={{ bgcolor: C.orange || '#f97316', color: '#fff', fontWeight: 900, borderRadius: '8px', '&:hover': { bgcolor: '#c2410c' } }}>
            📋 RETIRAR DA LISTA
          </Button>
        ) : (
          <Button fullWidth variant="contained" onClick={() => handleListing(true)} sx={{ bgcolor: C.bgCard, color: C.red, border: `1px solid ${C.red}`, fontWeight: 900, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(148,24,24,0.1)' } }}>
            📋 LISTAR P/ VENDA
          </Button>
        )}
      </Box>
      <Typography sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 700, textAlign: 'center', mt: 0.7 }}>
        Propostas chegam via inbox após ser listado · Valor estimado: {formatMoney(sellValue)}
      </Typography>
    </Box>
  );
}

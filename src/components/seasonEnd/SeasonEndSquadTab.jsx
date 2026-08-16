import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';
import { ovrColor } from '../../utils/playerVisuals.js';
import { SeasonEndSectionTitle, SeasonEndStatCard } from './SeasonEndPrimitives.jsx';

export default function SeasonEndSquadTab({ vm, formatMoney }) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0.7, mb: 1.2 }}>
        <SeasonEndStatCard label="OVR MÉDIO" value={vm.squad.avgOverall} color={ovrColor(vm.squad.avgOverall)} />
        <SeasonEndStatCard label="JOGADORES" value={vm.squad.count} color={D.txt1} />
        <SeasonEndStatCard label="VALOR ELENCO" value={formatMoney(vm.squad.totalValue)} color={D.teal} />
      </Box>

      <Box sx={{ bgcolor: D.card, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1.2 }}>
        <Box sx={{ px: 1.4, py: 0.8, borderBottom: `1px solid ${D.border}` }}>
          <SeasonEndSectionTitle>TOP JOGADORES DA TEMPORADA ENCERRADA</SeasonEndSectionTitle>
        </Box>
        {vm.squad.topPlayers.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}><Typography sx={{ color: D.txt3, fontSize: '0.7rem' }}>Sem dados do elenco encerrado</Typography></Box>
        ) : vm.squad.topPlayers.map((player, index) => (
          <Box key={player.id || `${player.name}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.2, py: 0.6, borderBottom: `1px solid ${D.border}40` }}>
            <Typography sx={{ color: D.txt3, fontWeight: 900, fontSize: '0.6rem', minWidth: 14 }}>{index + 1}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: D.txt1, fontWeight: 800, fontSize: '0.72rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{player.name}</Typography>
              <Typography sx={{ color: D.txt3, fontSize: '0.52rem', fontWeight: 700 }}>{player.position} · {player.age} anos</Typography>
            </Box>
            <Typography sx={{ color: ovrColor(player.overall), fontWeight: 900, fontSize: '0.88rem' }}>{player.overall}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import CupStatusBadge from './CupStatusBadge.jsx';
import CupTieCard from './CupTieCard.jsx';
import CupGroupTable from './CupGroupTable.jsx';
import CupGroupMatches from './CupGroupMatches.jsx';
import CupHistory from './CupHistory.jsx';

const CupCard = ({ cup, label, color, formatMoney }) => {
  const C = THEME;
  if (!cup) {
    return (
      <Box sx={{ bgcolor: C.card, border: `1px dashed ${C.border}`, borderRadius: '10px', p: 2, textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ color: C.txt3, fontSize: '0.75rem', fontStyle: 'italic' }}>Não disponível esta temporada</Typography>
      </Box>
    );
  }

  const currentTie = cup.currentTie || cup.knockoutTie || null;
  const isGroup = cup.phase === 'group';

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{
        bgcolor: `${color}15`, border: `1.5px solid ${color}40`,
        borderRadius: '10px', px: 1.5, py: 1, mb: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box>
          <Typography sx={{ color, fontWeight: 900, fontSize: '0.82rem' }}>{label}</Typography>
          <Typography sx={{ color: C.txt2, fontSize: '0.65rem', fontWeight: 700, mt: 0.2 }}>{cup.phaseLabel || cup.phase || '—'}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <CupStatusBadge status={cup.status} />
          {(cup.totalPrize || 0) > 0 && (
            <Typography sx={{ color: C.primary, fontSize: '0.58rem', fontWeight: 700, mt: 0.4 }}>
              {formatMoney ? formatMoney(cup.totalPrize) : ''} arrecadados
            </Typography>
          )}
        </Box>
      </Box>

      {currentTie && <CupTieCard tie={currentTie} cupColor={color} label={label} formatMoney={formatMoney} />}
      {isGroup && <CupGroupTable group={cup.group || []} color={color} qualifyCount={cup.qualifyCount || 2} tableLabel={cup.tableLabel} qualificationNote={cup.qualificationNote} />}
      {isGroup && <CupGroupMatches matches={cup.groupMatches || []} color={color} />}
      <CupHistory history={cup.history || []} />
    </Box>
  );
};

export default CupCard;

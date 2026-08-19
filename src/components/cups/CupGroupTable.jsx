import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';

const CupGroupTable = ({ group = [], color, qualifyCount = 2, tableLabel = 'TABELA DO GRUPO', qualificationNote = null }) => {
  const C = THEME;
  if (!group.length) return null;

  return (
    <Box sx={{ bgcolor: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', mb: 1 }}>
      <Box sx={{ px: 1.5, py: 0.8, bgcolor: `${color}15`, borderBottom: `1px solid ${color}40` }}>
        <Typography sx={{ color, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 0.5 }}>{tableLabel}</Typography>
      </Box>
      <Box sx={{ px: 0.8, py: 0.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 28px 28px 28px 28px', px: 0.5, mb: 0.3 }}>
          {['TIME', 'J', 'SG', 'G', 'PTS'].map((heading, index) => (
            <Typography key={heading} sx={{ color: C.txt3, fontSize: '0.5rem', fontWeight: 900, textAlign: index > 0 ? 'center' : 'left' }}>
              {heading}
            </Typography>
          ))}
        </Box>
        {group.map((team, index) => (
          <Box key={team.id || index} sx={{
            display: 'grid', gridTemplateColumns: '1fr 28px 28px 28px 28px',
            alignItems: 'center', px: 0.5, py: 0.35, borderRadius: '4px',
            bgcolor: team.isPlayer ? 'rgba(34,197,94,0.08)' : index < qualifyCount ? 'rgba(34,197,94,0.03)' : 'transparent',
            borderLeft: `3px solid ${team.isPlayer ? C.primary : index < qualifyCount ? C.borderG : 'transparent'}`,
          }}>
            <Typography sx={{ color: team.isPlayer ? C.primary : C.txt1, fontWeight: team.isPlayer ? 900 : 600, fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {team.name}
            </Typography>
            {[team.p || 0, (team.gf || 0) - (team.ga || 0), team.gf || 0, team.pts || 0].map((value, statIndex) => (
              <Typography key={statIndex} sx={{ textAlign: 'center', color: statIndex === 3 ? (team.isPlayer ? C.primary : C.txt1) : C.txt2, fontWeight: statIndex === 3 ? 900 : 600, fontSize: '0.65rem' }}>
                {value}
              </Typography>
            ))}
          </Box>
        ))}
        <Typography sx={{ color: C.txt3, fontSize: '0.5rem', px: 0.5, py: 0.4 }}>{qualificationNote || `🟢 Top ${qualifyCount} avançam`}</Typography>
      </Box>
    </Box>
  );
};

export default CupGroupTable;

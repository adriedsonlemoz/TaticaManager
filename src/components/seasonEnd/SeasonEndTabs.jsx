import React from 'react';
import { Box, Typography } from '@mui/material';
import { DARK_THEME as D } from '../../theme.js';

const TABS = ['Temporada', 'Elenco', 'Financeiro', 'Tabela'];

export default function SeasonEndTabs({ tab, onChange }) {
  return (
    <Box role="tablist" aria-label="Resumo da temporada" sx={{ display: 'flex', mx: 1.5, mb: 1.2, bgcolor: D.card, borderRadius: '10px', p: 0.4, border: `1px solid ${D.border}` }}>
      {TABS.map((label, index) => (
        <Box
          key={label}
          component="button"
          type="button"
          role="tab"
          aria-selected={tab === index}
          onClick={() => onChange(index)}
          sx={{ flex: 1, py: 0.8, border: 0, textAlign: 'center', borderRadius: '7px', cursor: 'pointer', bgcolor: tab === index ? D.teal : 'transparent', transition: 'all 0.15s' }}
        >
          <Typography sx={{ color: tab === index ? '#000' : D.txt3, fontWeight: 900, fontSize: '0.65rem' }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { THEME } from '../theme.js';
import { buildAboutChangelog } from '../data/aboutChangelog.js';
import AboutChangelog from './about/AboutChangelog.jsx';
import AboutHero from './about/AboutHero.jsx';
import AboutSupportCard from './about/AboutSupportCard.jsx';

const ScreenAbout = ({ onBack }) => {
  const entries = React.useMemo(() => buildAboutChangelog(THEME), []);
  const C = THEME;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100vh', pb: 10 }}>
      {onBack && (
        <Button onClick={onBack} aria-label="Voltar para a lista de carreiras" sx={{ color: C.green, fontWeight: 900, fontSize: '0.7rem', ml: 0.7, mt: 2.1, mb: 0.4, px: 0.8, minWidth: 0 }}>
          <Typography component="span" sx={{ fontSize: '1rem', lineHeight: 1, mr: 0.7 }}>←</Typography>
          VOLTAR
        </Button>
      )}

      <AboutHero theme={C} currentSummary={entries[0]?.title} />
      <Box sx={{ px: 1.5 }}>
        <AboutSupportCard theme={C} />
        <AboutChangelog entries={entries} theme={C} />
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography sx={{ color: C.txt3, fontSize: '0.62rem', fontWeight: 700 }}>Feito com ⚽ e muito café</Typography>
          <Typography sx={{ color: C.border, fontSize: '0.52rem', mt: 0.3 }}>TÁTICA MANAGER · 2026</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ScreenAbout;

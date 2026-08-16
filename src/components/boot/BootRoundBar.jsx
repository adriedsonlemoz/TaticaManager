import React from 'react';
import { Box, Typography } from '@mui/material';

const BootRoundBar = ({ progress, theme }) => {
  const C = theme;
  return (
    <Box sx={{ mt: 0.5 }}>
      <Box sx={{ height: 4, bgcolor: C.border, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', borderRadius: 3, width: `${progress.percentage}%`, bgcolor: progress.percentage >= 80 ? C.gold : C.green, transition: 'width 0.6s ease' }} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
        <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>Rod. {progress.round}/{progress.total}</Typography>
        <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{progress.percentage}%</Typography>
      </Box>
    </Box>
  );
};

export default BootRoundBar;

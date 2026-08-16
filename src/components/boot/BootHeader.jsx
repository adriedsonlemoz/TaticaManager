import React from 'react';
import { Box, Typography } from '@mui/material';
import { APP_NAME, APP_VERSION_LABEL } from '../../config/appMeta.js';

const Stat = ({ icon, label, value, theme }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{icon}</Typography>
    <Typography sx={{ color: theme.ink, fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.2 }}>{value}</Typography>
    <Typography sx={{ color: theme.ink3, fontSize: '0.5rem', fontWeight: 700 }}>{label}</Typography>
  </Box>
);

const BootHeader = ({ stats, theme }) => {
  const C = theme;
  return (
    <Box sx={{ background: `linear-gradient(180deg, #ede4d4 0%, ${C.bg} 100%)`, borderBottom: `1.5px solid ${C.border}`, px: 2, pt: 4, pb: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: `linear-gradient(135deg, ${C.green} 0%, #0f4a22 100%)`, border: `2px solid ${C.borderAcc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${C.shadow}` }}>
          <Typography sx={{ fontSize: '2.2rem', lineHeight: 1 }}>⚽</Typography>
        </Box>
        <Box>
          <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '1.65rem', lineHeight: 1, fontFamily: '"Nunito",sans-serif', letterSpacing: 0.5 }}>
            {APP_NAME.toUpperCase()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.35 }}>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.68rem', letterSpacing: 2.1, lineHeight: 1.2 }}>MANAGER DE FUTEBOL</Typography>
            <Box sx={{ bgcolor: `${C.green}18`, border: `1px solid ${C.green}40`, borderRadius: '4px', px: 0.5, py: 0.05 }}>
              <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.44rem', letterSpacing: 0.5 }}>{APP_VERSION_LABEL}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {stats.saves > 0 && (
        <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
          <Stat icon="📁" label="SAVES" value={stats.saves} theme={C} />
          <Stat icon="📅" label="TEMPORADAS" value={stats.seasons} theme={C} />
          <Stat icon="✅" label="VITÓRIAS" value={stats.wins} theme={C} />
          <Stat icon="🏆" label="TROFÉUS" value={stats.trophies} theme={C} />
        </Box>
      )}
    </Box>
  );
};

export default BootHeader;

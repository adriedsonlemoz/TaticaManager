import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { APP_NAME, APP_VERSION_LABEL } from '../../config/appMeta.js';

const AboutHero = ({ theme }) => {
  const C = theme;
  const stats = [
    { value: '4', label: 'DIVISÕES' },
    { value: '80', label: 'TIMES' },
    { value: '38', label: 'ROD. LIGA' },
    { value: 'BETA', label: 'STATUS' },
  ];

  return (
    <Paper sx={{ p: 3, textAlign: 'center', mb: 2, borderRadius: 0, background: 'linear-gradient(160deg, #f8fafc 0%, #ffffff 60%, #f4f7f6 100%)', borderBottom: `2px solid ${C.border}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        <svg width="88" height="88" viewBox="0 0 96 96" fill="none" aria-label="Logo do Tática Manager" role="img">
          <defs>
            <radialGradient id="about-bg" cx="38%" cy="35%" r="65%"><stop offset="0%" stopColor="#2e7d32"/><stop offset="55%" stopColor="#1b5e20"/><stop offset="100%" stopColor="#0a2e0c"/></radialGradient>
            <radialGradient id="about-shine" cx="35%" cy="30%" r="60%"><stop offset="0%" stopColor="rgba(255,255,255,0.32)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/></radialGradient>
          </defs>
          <ellipse cx="48" cy="90" rx="26" ry="5" fill="rgba(0,0,0,0.18)"/>
          <circle cx="48" cy="47" r="43" fill="url(#about-bg)" stroke="#1a3a22" strokeWidth="2.5"/>
          <polygon points="48,22 66,33 66,55 48,66 30,55 30,33" fill="#081a09" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
          {["48,6 59,14 56,27 40,27 37,14", "76,24 85,35 79,47 66,43 65,30", "77,70 66,76 55,68 59,55 72,52", "48,88 37,80 40,67 56,67 59,80", "19,70 24,57 37,55 41,68 30,76", "11,35 20,24 33,30 32,43 19,47"].map((points) => <polygon key={points} points={points} fill="#0d2e0f" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>)}
          <circle cx="48" cy="47" r="43" fill="url(#about-shine)"/>
          <text x="48" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="900" fill="rgba(255,255,255,0.88)" fontFamily="Cinzel, serif" letterSpacing="2">TM</text>
        </svg>
      </Box>
      <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 900, fontSize: '2rem', letterSpacing: 3, color: C.green, lineHeight: 1 }}>{APP_NAME.toUpperCase()}</Typography>
      <Typography sx={{ color: C.txt3, fontWeight: 900, fontSize: '0.6rem', letterSpacing: 4, mt: 0.3 }}>WEB · {APP_VERSION_LABEL}</Typography>
      <Typography sx={{ color: C.txt2, fontSize: '0.78rem', mt: 0.8 }}>Seu manager de futebol de bolso</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0.8, mt: 2 }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: 'rgba(34,197,94,0.08)', border: `1px solid ${C.border}`, borderRadius: '8px', py: 0.8 }}>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{stat.value}</Typography>
            <Typography sx={{ color: C.txt3, fontSize: '0.42rem', fontWeight: 700, letterSpacing: 0.5 }}>{stat.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 1.5, bgcolor: `${C.green}10`, border: `1px solid ${C.green}40`, borderRadius: '10px', px: 1.2, py: 0.9 }}>
        <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.62rem', letterSpacing: 0.5 }}>🧩 {APP_VERSION_LABEL} — inicialização e tela Sobre reorganizadas para facilitar manutenção e testes</Typography>
      </Box>
    </Paper>
  );
};

export default AboutHero;

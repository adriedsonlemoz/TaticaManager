import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_TOTAL_STEPS } from './setupTheme.js';

export const SetupShirt = ({ primary = '#10b981', secondary = '#ffffff', number = '10', size = 64 }) => {
  const uid = `ss_${(primary + secondary + number + size).replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox="0 0 80 80" style={{ width: size, height: size, filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.18))' }}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.82" />
        </linearGradient>
        <clipPath id={`c${uid}`}><path d="M20 15 L10 30 L22 35 L22 65 L58 65 L58 35 L70 30 L60 15 L50 22 Q40 28 30 22 Z" /></clipPath>
      </defs>
      <path d="M20 15 L10 30 L22 35 L22 65 L58 65 L58 35 L70 30 L60 15 L50 22 Q40 28 30 22 Z" fill={`url(#g${uid})`} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <rect x="28" y="14" width="10" height="52" fill={secondary} opacity="0.10" transform="rotate(-5 40 40)" clipPath={`url(#c${uid})`} />
      <path d="M32 23 Q40 29 48 23 Q46 17 40 16 Q34 17 32 23 Z" fill={secondary} opacity="0.55" />
      <text x="40" y="48" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="900" fill={secondary} fontFamily='"Nunito",sans-serif'>{number}</text>
    </svg>
  );
};

export const SetupProgressBar = ({ step }) => (
  <Box sx={{ display: 'flex', gap: 0.4, mb: 1.05 }}>
    {Array.from({ length: SETUP_TOTAL_STEPS }).map((_, index) => {
      const number = index + 1; const done = step > number; const active = step === number;
      return <Box key={number} sx={{ flex: active ? 2.5 : 1, height: 4, borderRadius: 2, bgcolor: done || active ? P.green : P.border, opacity: done ? 0.55 : 1, transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: active ? `0 0 8px ${P.green}60` : 'none' }} />;
    })}
  </Box>
);

export const SetupCardHeader = ({ icon, step, title, sub }) => (
  <Box sx={{ mb: 1.05 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: '10px', bgcolor: P.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</Typography></Box>
      <Box>
        <Typography sx={{ color: P.txt3, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 2, lineHeight: 1 }}>PASSO {step} DE {SETUP_TOTAL_STEPS}</Typography>
        <Typography sx={{ color: P.txt1, fontWeight: 900, fontSize: '1rem', fontFamily: '"Nunito",sans-serif', lineHeight: 1.1, mt: 0.15 }}>{title}</Typography>
      </Box>
    </Box>
    {sub && <Typography sx={{ color: P.txt3, fontSize: '0.65rem', fontWeight: 700 }}>{sub}</Typography>}
    <Box sx={{ height: 1, bgcolor: P.border, mt: 0.7 }} />
  </Box>
);

export const SetupNavRow = ({ onBack, onNext, nextLabel = 'CONTINUAR', disabled = false }) => (
  <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 0.7 }}>
    {onBack && <Button onClick={onBack} sx={{ color: P.txt3, border: `1.5px solid ${P.border}`, borderRadius: '10px', fontWeight: 900, px: 1.7, minWidth: 72, bgcolor: 'transparent', fontSize: '0.85rem', '&:hover': { borderColor: P.green, color: P.green } }}>← Voltar</Button>}
    <Button fullWidth disabled={disabled} onClick={onNext} sx={{ py: 0.85, fontWeight: 900, fontSize: '0.95rem', borderRadius: '10px', letterSpacing: 0.5, bgcolor: disabled ? P.bg : P.green, color: disabled ? P.txt4 : '#fff', boxShadow: disabled ? 'none' : `0 4px 20px ${P.shadow}`, border: `1.5px solid ${disabled ? P.border : P.green}`, '&:hover': { bgcolor: disabled ? P.bg : P.greenDark }, transition: 'all 0.2s' }}>{disabled ? nextLabel : `${nextLabel} →`}</Button>
  </Box>
);

export const SetupSectionLabel = ({ label }) => <Typography sx={{ color: P.txt3, fontWeight: 900, fontSize: '0.5rem', letterSpacing: 2, mb: 0.8, mt: 0.5 }}>{label}</Typography>;

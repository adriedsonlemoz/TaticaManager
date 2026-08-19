import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SETUP_PALETTE as P, SETUP_TOTAL_STEPS } from './setupTheme.js';

const ShirtPattern = ({ pattern, primary, secondary, clipId }) => {
  if (pattern === 'vertical-stripes') {
    return <>
      {[16, 28, 40, 52, 64].map((x, index) => <rect key={x} x={x} y="10" width="7" height="58" fill={index % 2 === 0 ? secondary : primary} clipPath={`url(#${clipId})`} />)}
    </>;
  }
  if (pattern === 'horizontal-stripes') {
    return <>
      {[22, 34, 46, 58].map((y, index) => <rect key={y} x="8" y={y} width="64" height="7" fill={index % 2 === 0 ? secondary : primary} clipPath={`url(#${clipId})`} />)}
    </>;
  }
  if (pattern === 'diagonal-sash') {
    return <path d="M9 23 L18 14 L67 58 L58 68 Z" fill={secondary} clipPath={`url(#${clipId})`} />;
  }
  if (pattern === 'chest-band') {
    return <rect x="9" y="31" width="62" height="12" fill={secondary} clipPath={`url(#${clipId})`} />;
  }
  if (pattern === 'half') {
    return <rect x="40" y="8" width="34" height="62" fill={secondary} clipPath={`url(#${clipId})`} />;
  }
  if (pattern === 'center-stripe') {
    return <rect x="31" y="10" width="18" height="58" fill={secondary} clipPath={`url(#${clipId})`} />;
  }
  return null;
};

export const SetupShirt = ({
  primary = '#10b981', secondary = '#ffffff', accent = '#ffffff',
  pattern = 'solid', number = '10', size = 64,
}) => {
  const reactId = React.useId().replace(/:/g, '');
  const gradId = `shirt_grad_${reactId}`;
  const clipId = `shirt_clip_${reactId}`;
  return (
    <svg viewBox="0 0 80 80" style={{ width:size, height:size, filter:'drop-shadow(0 4px 14px rgba(0,0,0,0.18))' }} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.86" />
        </linearGradient>
        <clipPath id={clipId}><path d="M20 15 L10 30 L22 35 L22 65 L58 65 L58 35 L70 30 L60 15 L50 22 Q40 28 30 22 Z" /></clipPath>
      </defs>
      <path d="M20 15 L10 30 L22 35 L22 65 L58 65 L58 35 L70 30 L60 15 L50 22 Q40 28 30 22 Z" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
      <ShirtPattern pattern={pattern} primary={primary} secondary={secondary} clipId={clipId} />
      <path d="M32 22 Q40 29 48 22 Q46 16 40 16 Q34 16 32 22 Z" fill={accent} stroke="rgba(0,0,0,.08)" strokeWidth=".7" />
      <path d="M11 29 L19 17 L24 20 L18 34 Z" fill={accent} opacity="0.75" clipPath={`url(#${clipId})`} />
      <path d="M69 29 L61 17 L56 20 L62 34 Z" fill={accent} opacity="0.75" clipPath={`url(#${clipId})`} />
      <circle cx="29" cy="31" r="3.2" fill={accent} opacity="0.88" />
      <text x="40" y="51" textAnchor="middle" dominantBaseline="middle" fontSize="17" fontWeight="900" fill={accent} stroke="rgba(0,0,0,.22)" strokeWidth=".45" paintOrder="stroke" fontFamily='"Nunito",sans-serif'>{number}</text>
    </svg>
  );
};

export const SetupProgressBar = ({ step }) => (
  <Box sx={{ display:'flex', gap:.45, mb:1.1 }}>
    {Array.from({ length:SETUP_TOTAL_STEPS }).map((_, index) => {
      const number = index + 1;
      const done = step > number;
      const active = step === number;
      return <Box key={number} sx={{ flex:active ? 2.5 : 1, height:5, borderRadius:3, bgcolor:done || active ? P.green : P.border, opacity:done ? .55 : 1, transition:'all .35s cubic-bezier(.34,1.56,.64,1)', boxShadow:active ? `0 0 8px ${P.green}60` : 'none' }} />;
    })}
  </Box>
);

export const SetupCardHeader = ({ icon, step, title, sub }) => (
  <Box sx={{ mb:1.15 }}>
    <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:.65 }}>
      <Box sx={{ width:38, height:38, borderRadius:'11px', bgcolor:P.greenLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Typography sx={{ fontSize:'1.2rem', lineHeight:1 }}>{icon}</Typography>
      </Box>
      <Box sx={{ minWidth:0 }}>
        <Typography sx={{ color:P.txt2, fontWeight:900, fontSize:'.68rem', letterSpacing:1.4, lineHeight:1 }}>PASSO {step} DE {SETUP_TOTAL_STEPS}</Typography>
        <Typography sx={{ color:P.txt1, fontWeight:900, fontSize:'1.15rem', fontFamily:'"Nunito",sans-serif', lineHeight:1.12, mt:.25 }}>{title}</Typography>
      </Box>
    </Box>
    {sub && <Typography sx={{ color:P.txt2, fontSize:'.76rem', fontWeight:800, lineHeight:1.3 }}>{sub}</Typography>}
    <Box sx={{ height:1, bgcolor:P.border, mt:.8 }} />
  </Box>
);

export const SetupNavRow = ({ onBack, onNext, nextLabel = 'CONTINUAR', disabled = false }) => (
  <Box sx={{ display:'flex', gap:1, mt:'auto', pt:.75 }}>
    {onBack && <Button onClick={onBack} sx={{ color:P.txt2, border:`1.5px solid ${P.border}`, borderRadius:'11px', fontWeight:900, px:1.6, minWidth:82, bgcolor:'transparent', fontSize:'.9rem', minHeight:44, '&:hover':{ borderColor:P.green, color:P.green } }}>← Voltar</Button>}
    <Button fullWidth disabled={disabled} onClick={onNext} sx={{ py:1, minHeight:44, fontWeight:900, fontSize:'.94rem', borderRadius:'11px', letterSpacing:.25, bgcolor:disabled ? P.bg : P.green, color:disabled ? P.txt3 : '#fff', boxShadow:disabled ? 'none' : `0 4px 20px ${P.shadow}`, border:`1.5px solid ${disabled ? P.border : P.green}`, '&:hover':{ bgcolor:disabled ? P.bg : P.greenDark }, transition:'all .2s' }}>{disabled ? nextLabel : `${nextLabel} →`}</Button>
  </Box>
);

export const SetupSectionLabel = ({ label }) => (
  <Typography sx={{ color:P.txt2, fontWeight:900, fontSize:'.72rem', letterSpacing:1.4, mb:.7, mt:.45 }}>{label}</Typography>
);

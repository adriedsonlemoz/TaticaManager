import React from 'react';

export function FieldPitch({ VW = 100, VH = 140, gradientId = 'fv_field_g' }) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width:'100%', display:'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1b6b1b" />
          <stop offset="50%" stopColor="#155215" />
          <stop offset="100%" stopColor="#0e3d0e" />
        </linearGradient>
      </defs>
      <rect width={VW} height={VH} fill={`url(#${gradientId})`} />
      {[0,1,2,3,4,5,6].map((i) => <rect key={i} x="0" y={i * 20} width={VW} height="20" fill={i % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'transparent'} />)}
      <rect x="2" y="3" width="96" height="134" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" rx="1" />
      <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.38)" strokeWidth="0.55" />
      <circle cx="50" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.55" />
      <circle cx="50" cy="70" r="1" fill="rgba(255,255,255,0.6)" />
      <rect x="22" y="118" width="56" height="19" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.55" />
      <rect x="34" y="128" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.45" />
      <rect x="40" y="136" width="20" height="4" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" />
      <circle cx="50" cy="124" r="1" fill="rgba(255,255,255,0.4)" />
      <path d="M 22 118 A 12 12 0 0 0 78 118" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.45" />
      <rect x="22" y="3" width="56" height="19" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.45" />
      <rect x="40" y="0" width="20" height="4" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
    </svg>
  );
}

export function FieldPitchHorizontal({ VW = 160, VH = 100, gradientId = 'fv_h_field_g' }) {
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width:'100%', display:'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1b6b1b" />
          <stop offset="50%" stopColor="#155215" />
          <stop offset="100%" stopColor="#1a6519" />
        </linearGradient>
      </defs>
      <rect width={VW} height={VH} fill={`url(#${gradientId})`} />
      {[0,1,2,3,4,5,6,7].map((i) => <rect key={i} x={i * 20} y="0" width="20" height={VH} fill={i % 2 === 0 ? 'rgba(255,255,255,0.022)' : 'transparent'} />)}
      <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" rx="1" />
      <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      <circle cx="80" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      <circle cx="80" cy="50" r="1.2" fill="rgba(255,255,255,0.65)" />
      <rect x="2" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.6" />
      <rect x="2" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <rect x="2" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <circle cx="14" cy="50" r="1.2" fill="rgba(255,255,255,0.4)" />
      <path d="M 20 38 A 14 14 0 0 1 20 62" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
      <rect x="140" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      <rect x="152" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.45" />
      <rect x="154" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="0.7" />
      <circle cx="146" cy="50" r="1.2" fill="rgba(255,255,255,0.35)" />
      <path d="M 140 38 A 14 14 0 0 0 140 62" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.45" />
      <text x="12" y="7" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="rgba(255,255,255,0.25)" letterSpacing="1.5">DEF</text>
      <text x="148" y="7" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="rgba(255,255,255,0.25)" letterSpacing="1.5">ATK</text>
    </svg>
  );
}

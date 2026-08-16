import React from 'react';
import { getPositionColor } from '../../utils/playerVisuals.js';

const SHIRT_PATH = 'M 0,12 L 13,5 L 19,11 L 24,9 L 29,11 L 35,5 L 48,12 L 48,22 L 38,19 L 38,49 L 10,49 L 10,19 L 0,22 Z';
const SHIRT_HIGHLIGHT_PATH = 'M 0,12 L 13,5 L 19,11 L 24,9 L 29,11 L 35,5 L 48,12 L 48,22 L 38,19 L 38,28 L 10,28 L 10,19 L 0,22 Z';

export default function JerseyBadge({ pos, num, size = 44, showPos = true }) {
  const reactId = React.useId().replace(/:/g, '');
  const uid = `jersey_${reactId}`;
  const color = getPositionColor(pos);
  const shirtHeight = size * (52 / 48);

  return (
    <svg
      viewBox="0 0 48 52"
      width={size}
      height={shirtHeight}
      style={{ flexShrink: 0, display: 'block', overflow: 'visible' }}
      aria-label={`Camisa ${num ?? '?'}${pos ? `, posição ${pos}` : ''}`}
      role="img"
    >
      <defs>
        <linearGradient id={`${uid}_g`} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.72" />
        </linearGradient>
        <filter id={`${uid}_s`} x="-12%" y="-8%" width="124%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.38" />
        </filter>
      </defs>
      <path d={SHIRT_PATH} fill={`url(#${uid}_g)`} filter={`url(#${uid}_s)`} />
      <path d={SHIRT_HIGHLIGHT_PATH} fill="rgba(255,255,255,0.13)" />
      <line x1="0" y1="12" x2="10" y2="19" stroke="rgba(0,0,0,0.13)" strokeWidth="1.8" />
      <line x1="48" y1="12" x2="38" y2="19" stroke="rgba(0,0,0,0.13)" strokeWidth="1.8" />
      <path d="M 19,11 L 24,17 L 29,11" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" strokeLinejoin="round" />
      {showPos && (
        <text x="24" y="23" textAnchor="middle" dominantBaseline="middle" fontSize="6.2" fontWeight="900" fill="rgba(255,255,255,0.80)" fontFamily="Nunito, sans-serif" letterSpacing="1.2">
          {pos}
        </text>
      )}
      <text x="24" y={showPos ? 36 : 31} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="900" fill="#ffffff" fontFamily="Nunito, monospace">
        {num ?? '?'}
      </text>
    </svg>
  );
}

export { JerseyBadge };

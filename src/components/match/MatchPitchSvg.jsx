import React from 'react';

const EVENT_CONFIG = {
  goal: { color:'#16a34a', icon:'⚽' },
  red: { color:'#f85149', icon:'🟥' },
  yellow: { color:'#f0a500', icon:'🟨' },
};

const toFieldX = (value) => (Number(value || 0) / 300) * 160;
const toFieldY = (value) => (Number(value || 0) / 110) * 100;

const MatchPitchSvg = ({ isLive, fieldEvent, ballPos = { x:150, y:55 } }) => {
  const cfg = fieldEvent ? EVENT_CONFIG[fieldEvent.type] : null;
  return (
    <svg viewBox="0 0 160 100" style={{ width:'100%', display:'block' }} preserveAspectRatio="xMidYMid meet" aria-label="Campo da partida">
      <defs>
        <linearGradient id="match-live-field-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1b6b1b"/>
          <stop offset="100%" stopColor="#0f4010"/>
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill="url(#match-live-field-gradient)"/>
      {[0,1,2,3,4,5,6,7].map((index) => (
        <rect key={index} x={index*20} y="0" width="20" height="100" fill={index%2===0?'rgba(255,255,255,0.018)':'transparent'}/>
      ))}
      <rect x="2" y="2" width="156" height="96" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" rx="1"/>
      <line x1="80" y1="2" x2="80" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
      <circle cx="80" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
      <circle cx="80" cy="50" r="1.2" fill="rgba(255,255,255,0.65)"/>
      <rect x="2" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
      <rect x="2" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <circle cx="14" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
      <path d="M 20 38 A 14 14 0 0 1 20 62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <rect x="140" y="26" width="18" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
      <rect x="150" y="37" width="8" height="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <circle cx="146" cy="50" r="1.2" fill="rgba(255,255,255,0.4)"/>
      <path d="M 140 38 A 14 14 0 0 0 140 62" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
      <rect x="2" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      <rect x="154" y="41" width="4" height="18" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
      {isLive && !fieldEvent && (
        <circle cx={toFieldX(ballPos.x)} cy={toFieldY(ballPos.y)} r="2.8" fill="white" opacity="0.92">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1s" repeatCount="indefinite"/>
        </circle>
      )}
      {fieldEvent && cfg && (
        <g>
          <circle cx={toFieldX(fieldEvent.x)} cy={toFieldY(fieldEvent.y)} r="5" fill={cfg.color} opacity="0.88">
            <animate attributeName="r" values="3;7;3" dur="0.5s" repeatCount="4"/>
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.5s" repeatCount="4"/>
          </circle>
          <text x={toFieldX(fieldEvent.x)} y={toFieldY(fieldEvent.y)+1} textAnchor="middle" dominantBaseline="middle" fontSize="5">{cfg.icon}</text>
        </g>
      )}
    </svg>
  );
};

export default MatchPitchSvg;

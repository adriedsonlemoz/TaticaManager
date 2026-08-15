import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TeamIcon } from '../../data/database_branding.js';
import { sortLeagueTable } from '../../engines/engine.js';

const C = THEME;

const getZoneColor = (serie, index) => {
  if (serie === 'A') {
    if (index < 4) return C.green;
    if (index < 6) return C.blue;
    if (index >= 16) return C.red;
  } else {
    if (index < 4) return C.green;
    if (index >= 16) return C.red;
  }
  return 'transparent';
};

const getZoneLabel = (serie, index) => {
  if (serie === 'A') {
    if (index < 4) return { label: 'Libertadores', color: C.green };
    if (index < 6) return { label: 'Pré-Libert.', color: C.blue };
    if (index < 12) return { label: 'Sul-Americana', color: C.purple };
    if (index >= 16) return { label: 'Rebaixamento', color: C.red };
  } else {
    if (index < 4) return { label: 'Acesso', color: C.green };
    if (index >= 16) return { label: 'Rebaixamento', color: C.red };
  }
  return null;
};

const PositionPopup = ({ positionChange }) => {
  if (!positionChange) return null;
  const { posBefore, posAfter, delta } = positionChange;
  const accent = delta > 0 ? C.green : delta < 0 ? C.red : C.border;

  return (
    <Box sx={{ mb: 1.2, '@keyframes popIn': { '0%': { opacity: 0, transform: 'scale(0.85)' }, '100%': { opacity: 1, transform: 'scale(1)' } }, animation: 'popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards' }}>
      <Box sx={{ bgcolor: C.bgCard, border: `2.5px solid ${accent}`, borderRadius: '18px', overflow: 'hidden', boxShadow: `0 8px 32px ${delta > 0 ? C.green : delta < 0 ? C.red : '#000'}40` }}>
        <Box sx={{ bgcolor: delta > 0 ? C.green : delta < 0 ? C.red : C.bgCardAlt, px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{delta > 0 ? '🚀' : delta < 0 ? '😰' : '➡️'}</Typography>
          <Typography sx={{ color: delta !== 0 ? '#000' : C.ink, fontWeight: 900, fontSize: '0.95rem' }}>
            {delta > 0
              ? `Subimos ${delta} posição${delta > 1 ? 'ões' : ''}!`
              : delta < 0
                ? `Caímos ${Math.abs(delta)} posição${Math.abs(delta) > 1 ? 'ões' : ''}`
                : 'Mantivemos a posição'}
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.2, display: 'flex', justifyContent: 'center', gap: 3 }}>
          {[{ label: 'ANTES', value: posBefore, color: C.ink }, { label: 'AGORA', value: posAfter, color: delta > 0 ? C.green : delta < 0 ? C.red : C.ink }].map((item, index) => (
            <React.Fragment key={item.label}>
              {index === 1 && <Typography sx={{ color: C.ink3, fontSize: '1.5rem', alignSelf: 'center' }}>→</Typography>}
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>{item.label}</Typography>
                <Typography sx={{ color: item.color, fontWeight: 900, fontSize: '1.8rem', lineHeight: 1 }}>{item.value}º</Typography>
              </Box>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const PostMatchTableTab = ({ gameData, positionChange, showPositionPopup }) => {
  const sorted = sortLeagueTable ? sortLeagueTable(gameData?.table || []) : (gameData?.table || []);
  const serie = gameData?.serie || 'A';
  const userPosition = sorted.findIndex(team => team.id === 'user') + 1;
  const userInTop10 = userPosition > 0 && userPosition <= 10;
  const displayRows = userInTop10
    ? sorted.slice(0, 10)
    : [...sorted.slice(0, 9), sorted.find(team => team.id === 'user')].filter(Boolean);

  return (
    <>
      {showPositionPopup && <PositionPopup positionChange={positionChange} />}

      <Box sx={{ bgcolor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', mb: 1.2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '34px 18px 1fr 26px 24px 28px 34px', px: 1, py: 0.7, bgcolor: C.bgCardAlt, borderBottom: `1px solid ${C.border}` }}>
          {['#', '', 'TIME', 'V', 'D', 'SG', 'PTS'].map((header, index) => (
            <Typography key={header || index} sx={{ color: C.ink3, fontSize: '0.52rem', fontWeight: 900, textAlign: index <= 2 ? 'left' : 'center', pl: index === 2 ? 0.5 : 0 }}>{header}</Typography>
          ))}
        </Box>

        {displayRows.map((team, rowIndex) => {
          const index = sorted.findIndex(row => row.id === team.id);
          const isUser = team.id === 'user';
          const zoneColor = getZoneColor(serie, index);
          const goalDifference = (team.gf || 0) - (team.ga || 0);
          const zone = getZoneLabel(serie, index);
          const isLast = rowIndex === displayRows.length - 1;
          const gapBefore = !userInTop10 && rowIndex === 9;
          const movement = isUser && positionChange
            ? (positionChange.delta > 0 ? { icon: '↑', color: C.green } : positionChange.delta < 0 ? { icon: '↓', color: C.red } : { icon: '–', color: C.ink3 })
            : null;

          return (
            <React.Fragment key={team.id}>
              {gapBefore && (
                <Box sx={{ px: 1, py: 0.25, bgcolor: C.bgCardAlt, borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
                  <Typography sx={{ color: C.ink3, fontSize: '0.5rem', fontWeight: 700 }}>· · · · ·</Typography>
                </Box>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: '34px 18px 1fr 26px 24px 28px 34px', px: 1, py: 0.65, alignItems: 'center', borderBottom: isLast ? 'none' : `1px solid ${C.border}`, bgcolor: isUser ? `${C.green}08` : 'transparent', borderLeft: `3px solid ${zoneColor !== 'transparent' ? zoneColor : 'transparent'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: zoneColor !== 'transparent' ? zoneColor : C.bgCardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: zoneColor !== 'transparent' ? '#fff' : C.ink2, fontWeight: 900, fontSize: '0.65rem' }}>{index + 1}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {TeamIcon ? React.createElement(TeamIcon, { name: team.name, size: 14 }) : null}
                </Box>
                <Typography sx={{ color: isUser ? C.green : C.ink, fontWeight: isUser ? 900 : 600, fontSize: '0.68rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', pl: 0.5 }}>{team.name}</Typography>
                <Typography sx={{ textAlign: 'center', color: C.green, fontSize: '0.62rem', fontWeight: 900 }}>{team.w}</Typography>
                <Typography sx={{ textAlign: 'center', color: C.red, fontSize: '0.62rem', fontWeight: 700 }}>{team.l}</Typography>
                <Typography sx={{ textAlign: 'center', color: goalDifference >= 0 ? C.ink2 : C.red, fontSize: '0.62rem', fontWeight: 700 }}>{goalDifference >= 0 ? `+${goalDifference}` : goalDifference}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.3 }}>
                  {movement && <Typography sx={{ color: movement.color, fontWeight: 900, fontSize: '0.62rem', lineHeight: 1 }}>{movement.icon}</Typography>}
                  <Box sx={{ bgcolor: isUser ? C.green : C.bgCardAlt, borderRadius: '5px', px: 0.5, py: 0.1, minWidth: 22, textAlign: 'center' }}>
                    <Typography sx={{ color: isUser ? '#000' : C.ink, fontWeight: 900, fontSize: '0.68rem' }}>{team.pts}</Typography>
                  </Box>
                </Box>
              </Box>
              {isUser && zone && (
                <Box sx={{ px: 1, py: 0.3, bgcolor: `${zone.color}10`, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: zone.color }} />
                  <Typography sx={{ color: zone.color, fontSize: '0.48rem', fontWeight: 900 }}>{zone.label}</Typography>
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
        {(serie === 'A'
          ? [{ color: C.green, label: 'Libertadores G4' }, { color: C.blue, label: 'Pré-Libert. G6' }, { color: C.purple, label: 'Sul-Am. G12' }, { color: C.red, label: 'Rebaixamento Z4' }]
          : [{ color: C.green, label: 'Acesso G4' }, { color: C.red, label: 'Rebaixamento Z4' }]
        ).map(zone => (
          <Box key={zone.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: zone.color }} />
            <Typography sx={{ color: C.ink3, fontSize: '0.52rem', fontWeight: 700 }}>{zone.label}</Typography>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default PostMatchTableTab;

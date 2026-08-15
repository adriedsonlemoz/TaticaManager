import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TeamIcon } from '../../data/database_branding.js';

const C = THEME;
const GRID_COLUMNS = '38px 1fr 34px 28px 28px 28px 34px 34px';

const resolveZoneColor = (zone) => zone?.colorKey ? (C[zone.colorKey] || 'transparent') : 'transparent';

const getPositionBadge = (zone) => {
  const color = resolveZoneColor(zone);
  return color === 'transparent'
    ? { bg: '#94a3b8', text: '#fff' }
    : { bg: color, text: '#fff' };
};

const SeasonEndBanner = () => (
  <Box sx={{ mx: 1, mb: 1, bgcolor: `${C.gold}18`, border: `1.5px solid ${C.gold}50`, borderRadius: '10px', px: 1.5, py: 0.9, display: 'flex', alignItems: 'center', gap: 0.8 }}>
    <Typography sx={{ fontSize: '1.1rem' }}>🏁</Typography>
    <Box>
      <Typography sx={{ color: C.gold, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>TEMPORADA ENCERRADA</Typography>
      <Typography sx={{ color: C.txt3, fontSize: '0.58rem', fontWeight: 700 }}>As setas indicam subidas e rebaixamentos</Typography>
    </Box>
  </Box>
);

const StandingsHeader = () => (
  <Box sx={{
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS,
    bgcolor: C.headerBg,
    px: 1, py: 0.9,
    borderBottom: `2px solid ${C.border}`,
  }}>
    {['#', 'TIME', 'J', 'V', 'E', 'D', 'SG', 'PTS'].map((heading, index) => (
      <Typography key={heading} sx={{
        color: 'rgba(255,255,255,0.85)', fontWeight: 900,
        fontSize: index === 1 ? '0.62rem' : '0.58rem',
        textAlign: index <= 1 ? 'left' : 'center',
        pl: index === 1 ? 0.5 : 0,
        letterSpacing: 0.3,
      }}>
        {heading}
      </Typography>
    ))}
  </Box>
);

const StandingRow = ({ team }) => {
  const badge = getPositionBadge(team.zone);
  const zoneColor = resolveZoneColor(team.zone);
  const rowBg = team.isUser
    ? C.rowUser
    : team.zone?.background || (team.index % 2 === 0 ? C.rowEven : C.rowOdd);

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: GRID_COLUMNS,
      bgcolor: rowBg,
      px: 1, py: 0.55,
      borderBottom: `1px solid ${C.border}`,
      alignItems: 'center',
      borderLeft: `4px solid ${zoneColor}`,
      position: 'relative',
      '&:active': { filter: 'brightness(0.95)' },
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
        <Box sx={{
          width: 22, height: 22, borderRadius: '6px',
          bgcolor: badge.bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}>
          <Typography sx={{ color: badge.text, fontWeight: 900, fontSize: '0.7rem', lineHeight: 1 }}>
            {team.position}
          </Typography>
        </Box>
        {team.movement && (
          <Typography sx={{ fontSize: '0.6rem', lineHeight: 1 }} title={team.movement.label} aria-label={team.movement.label}>
            {team.movement.icon}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, minWidth: 0, pl: 0.5 }}>
        <TeamIcon name={team.name} size={26} />
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Typography sx={{
              fontWeight: 900, fontSize: '0.80rem',
              color: team.isUser ? C.pts : C.txtDark,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              lineHeight: 1.1,
            }}>
              {team.name}
            </Typography>
            {team.isUser && <Typography sx={{ fontSize: '0.6rem', lineHeight: 1 }}>⭐</Typography>}
            {team.zone?.icon && <Typography sx={{ fontSize: '0.55rem', lineHeight: 1, opacity: 0.8 }}>{team.zone.icon}</Typography>}
          </Box>
          <Typography sx={{
            fontSize: '0.52rem', color: C.txtMid, fontWeight: 700, lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {team.coach}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.ink3 }}>{team.p}</Typography>
      <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: C.green }}>{team.w}</Typography>
      <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.ink3 }}>{team.d}</Typography>
      <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: C.red }}>{team.l}</Typography>
      <Typography sx={{
        textAlign: 'center', fontSize: '0.7rem', fontWeight: 900,
        color: team.goalDifference > 0 ? C.green : team.goalDifference < 0 ? C.red : '#607d8b',
      }}>
        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{
          minWidth: 28, px: 0.5, py: 0.25,
          bgcolor: team.isUser ? C.gold : C.pts,
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.75rem', lineHeight: 1 }}>
            {team.pts}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const LeagueLegend = ({ entries }) => (
  <Box sx={{ mx: 1, mt: 1, mb: 0.5, bgcolor: C.headerBg, borderRadius: '10px', px: 1.5, py: 1 }}>
    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.55rem', fontWeight: 900, letterSpacing: 1, mb: 0.8, textAlign: 'center' }}>
      ZONAS DE CLASSIFICAÇÃO
    </Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.6 }}>
      {entries.map(entry => (
        <Box key={entry.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: C[entry.colorKey], flexShrink: 0 }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.58rem', fontWeight: 700 }}>
            {entry.label}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const StandingsView = ({ standings, legend, isSeasonEnd }) => (
  <Box sx={{ flex: 1, overflow: 'hidden' }}>
    {isSeasonEnd && <SeasonEndBanner />}
    <StandingsHeader />
    <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 210px)' }}>
      {standings.map(team => <StandingRow key={team.id || team.name} team={team} />)}
    </Box>
    <LeagueLegend entries={legend} />
  </Box>
);

export default StandingsView;

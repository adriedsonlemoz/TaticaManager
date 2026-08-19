import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { TABLE_TABS } from '../../engines/table/tableViewModel.js';

const LeagueTableHeader = ({ serie, currentRound, totalRounds, phaseLabel, currentTab, onTabChange, theme = THEME }) => {
  const C = theme;
  return (
    <Box sx={{
      background: `linear-gradient(180deg, ${C.primaryDim || C.headerBg} 0%, ${C.primary || C.fieldDark} 100%)`,
      px: 2, pt: 2.5, pb: 1.5,
      borderBottom: `1px solid ${C.border}`,
    }}>
      <Typography sx={{
        textAlign: 'center', color: '#fff',
        fontWeight: 900, fontSize: '1.3rem',
        fontFamily: '"Nunito", sans-serif',
        textShadow: '0 2px 6px rgba(0,0,0,0.5)',
        letterSpacing: 1, lineHeight: 1,
      }}>
        CLASSIFICAÇÃO DA LIGA
      </Typography>
      <Typography sx={{
        textAlign: 'center', color: '#ffffff',
        fontWeight: 900, fontSize: '0.7rem', mt: 0.4,
        letterSpacing: 0.5,
      }}>
        {['C','D'].includes(serie) && phaseLabel ? `Brasileirão Série ${serie} · ${phaseLabel}` : `Brasileirão Série ${serie} · Rodada ${currentRound} / ${totalRounds}`}
      </Typography>

      <Box role="tablist" aria-label="Seções da classificação" sx={{ display: 'flex', mt: 1.5, bgcolor: C.bgCardAlt, borderRadius: '8px', p: 0.4, gap: 0.4 }}>
        {TABLE_TABS.map((label, index) => {
          const selected = currentTab === index;
          return (
            <ButtonBase
              key={label}
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(index)}
              sx={{
                flex: 1, py: 0.8, textAlign: 'center', borderRadius: '6px',
                bgcolor: selected ? C.primary : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <Typography sx={{
                color: selected ? '#fff' : C.txtMid,
                fontWeight: 900, fontSize: '0.7rem', letterSpacing: 0.5,
              }}>
                {label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};

export default LeagueTableHeader;

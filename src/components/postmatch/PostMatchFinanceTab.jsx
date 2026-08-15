import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { PostMatchCard, PostMatchCardHead } from './PostMatchUi.jsx';

const C = THEME;

const PostMatchFinanceTab = ({ gameData, matchResultData, roundSummary, formatMoney }) => {
  const { attendance = 0, income = 0, cupEvents = [] } = matchResultData;
  const financeEntry = gameData?.financialHistory?.find(entry => entry.round === gameData?.round)
    || gameData?.financialHistory?.[0];
  const detail = financeEntry?.detail || {};
  const ticketIncome = detail.ticket ?? income;
  const tvIncome = detail.tv ?? (matchResultData?.isCupMatch ? 0 : (gameData?.serie === 'A' ? 500000 : 150000));
  const sponsorIncome = detail.sponsor ?? (matchResultData?.isCupMatch ? 0 : ((gameData?.club?.sponsors?.master?.roundValue || 0)
    + (gameData?.club?.sponsors?.stadium?.roundValue || 0)));
  const cupIncome = detail.cup ?? cupEvents.reduce((sum, event) => sum + (event.earned || 0), 0);
  const totalIncome = financeEntry?.income ?? (ticketIncome + tvIncome + sponsorIncome + cupIncome);

  return (
    <>
      <PostMatchCard accent={`${C.green}50`}>
        <PostMatchCardHead label="BILHETERIA & PÚBLICO" icon="🏟️" color={C.green} />
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '10px', p: 1.2, mb: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: C.ink3, fontSize: '0.54rem', fontWeight: 700, letterSpacing: 0.5 }}>TOTAL DE TORCEDORES</Typography>
              <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '1.35rem', lineHeight: 1.1, fontFamily: 'monospace' }}>{attendance.toLocaleString('pt-BR')}</Typography>
            </Box>
            <Typography sx={{ fontSize: '2.2rem', opacity: 0.5 }}>👥</Typography>
          </Box>

          {[
            { icon: '🎟', label: 'Bilheteria', value: ticketIncome, color: C.green },
            { icon: '📺', label: 'Cota de TV', value: tvIncome, color: C.blue },
            ...(sponsorIncome > 0 ? [{ icon: '🤝', label: 'Patrocinador', value: sponsorIncome, color: C.purple }] : []),
            ...(cupIncome > 0 ? [{ icon: '🏆', label: 'Premiação de copa', value: cupIncome, color: C.gold }] : []),
          ].map((row, index, rows) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: index < rows.length - 1 ? 0.75 : 0, mb: index < rows.length - 1 ? 0.75 : 0, borderBottom: index < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography sx={{ fontSize: '1rem' }}>{row.icon}</Typography>
                <Typography sx={{ color: C.ink2, fontWeight: 700, fontSize: '0.75rem' }}>{row.label}</Typography>
              </Box>
              <Typography sx={{ color: row.color, fontWeight: 900, fontSize: '0.9rem' }}>{formatMoney(row.value)}</Typography>
            </Box>
          ))}

          <Box sx={{ height: 1, bgcolor: C.border, my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.85rem' }}>TOTAL ARRECADADO</Typography>
            <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '1.1rem' }}>{formatMoney(totalIncome)}</Typography>
          </Box>
        </Box>
      </PostMatchCard>

      {cupEvents.length > 0 && (
        <PostMatchCard accent={`${C.gold}50`}>
          <PostMatchCardHead label="PRÊMIOS DE COPA" icon="🏆" color={C.gold} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {cupEvents.map((event, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.6 }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography sx={{ color: C.ink, fontWeight: 900, fontSize: '0.72rem' }}>{event.cup}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700, mt: 0.15 }}>{event.msg}</Typography>
                </Box>
                {(event.earned || 0) > 0 && <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.82rem', flexShrink: 0 }}>+{formatMoney(event.earned)}</Typography>}
              </Box>
            ))}
          </Box>
        </PostMatchCard>
      )}

      <PostMatchCard>
        <PostMatchCardHead label={`RESULTADOS · ROD ${gameData?.round}`} icon="📋" />
        {(roundSummary || []).map((match, index) => {
          const isUser = match.home.id === 'user' || match.away.id === 'user';
          return (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', px: 1.2, py: 0.6, borderBottom: index < (roundSummary?.length || 0) - 1 ? `1px solid ${C.border}` : 'none', bgcolor: isUser ? 'rgba(22,163,74,0.04)' : 'transparent' }}>
              <Typography sx={{ flex: 1, textAlign: 'right', color: match.home.id === 'user' ? C.green : C.ink2, fontSize: '0.66rem', fontWeight: match.home.id === 'user' ? 900 : 600, mr: 0.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{match.home.name}</Typography>
              <Typography sx={{ color: isUser ? C.ink : C.ink3, fontWeight: 900, fontSize: '0.72rem', fontFamily: 'monospace', minWidth: 40, textAlign: 'center', bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.5, py: 0.2, flexShrink: 0 }}>{match.result || 'vs'}</Typography>
              <Typography sx={{ flex: 1, color: match.away.id === 'user' ? C.green : C.ink2, fontSize: '0.66rem', fontWeight: match.away.id === 'user' ? 900 : 600, ml: 0.5, overflow: 'hidden', whiteSpace: 'nowrap' }}>{match.away.name}</Typography>
            </Box>
          );
        })}
      </PostMatchCard>
    </>
  );
};

export default PostMatchFinanceTab;

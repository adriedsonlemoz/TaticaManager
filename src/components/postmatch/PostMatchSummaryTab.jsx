import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../../theme.js';
import { PostMatchCard, PostMatchCardHead, PostMatchStatRow } from './PostMatchUi.jsx';
import { parsePostMatchGoal, parsePostMatchCard } from './postMatchViewModel.js';
import { getUserMatchSide } from '../../engines/match/matchPresentationViewModel.js';

const C = THEME;

const PostMatchSummaryTab = ({
  gameData,
  matchResultData,
  liveScore,
  resultLabel,
  resultColor,
  matchDateStr,
  subsDone = [],
  eventGroups = { goals:[], yellows:[], reds:[] },
  stats = {},
}) => {
  const {
    homeName,
    awayName,
    isCupMatch,
    cupLeg,
    cupKey,
    cupLabel,
  } = matchResultData;
  const userSide = getUserMatchSide(gameData, matchResultData);
  const groups = eventGroups && typeof eventGroups === 'object' ? eventGroups : {};
  const goals = Array.isArray(groups.goals) ? groups.goals : [];
  const yellows = Array.isArray(groups.yellows) ? groups.yellows : [];
  const reds = Array.isArray(groups.reds) ? groups.reds : [];
  const substitutions = Array.isArray(subsDone) ? subsDone : [];
  const safeStats = stats && typeof stats === 'object' ? stats : {};
  const possessionStats = safeStats.possession && typeof safeStats.possession === 'object'
    ? safeStats.possession
    : { home: 50, away: 50 };

  return (
    <>
      <Box sx={{ bgcolor: `${resultColor}0e`, border: `2px solid ${resultColor}50`, borderRadius: '16px', p: 1.8, mb: 1.2, textAlign: 'center', boxShadow: `0 0 24px ${resultColor}18` }}>
        <Typography sx={{ color: resultColor, fontWeight: 900, fontSize: '1.05rem', letterSpacing: 3 }}>{resultLabel}</Typography>
        <Typography sx={{ color: C.ink3, fontSize: '0.65rem', fontWeight: 700, mt: 0.3, whiteSpace: 'pre-line' }}>
          {isCupMatch
            ? `${cupLabel || '🏆 Copa'} · ${cupLeg === 'leg1' ? 'Jogo de Ida' : cupLeg === 'leg2' ? 'Jogo de Volta' : 'Jogo Único'}`
            : `${homeName} × ${awayName} · Rod ${matchResultData?.leagueRound || gameData?.leagueRound || 1}`}
          {matchDateStr ? `\n${matchDateStr}` : ''}
        </Typography>
      </Box>

      {isCupMatch && cupLeg === 'leg2' && (() => {
        const cup = gameData?.cups?.[cupKey];
        if (!cup?.currentTie?.decided) return null;
        const tie = cup.currentTie;
        const userWon = tie.winner?.isPlayer;
        const homeAggregate = tie.homeAggr ?? 0;
        const awayAggregate = tie.awayAggr ?? 0;
        return (
          <Box sx={{ bgcolor: userWon ? `${C.green}10` : `${C.red}08`, border: `2px solid ${userWon ? C.green : C.red}60`, borderRadius: '14px', overflow: 'hidden', mb: 1.2, boxShadow: `0 0 20px ${userWon ? C.green : C.red}25` }}>
            <Box sx={{ bgcolor: userWon ? C.green : C.red, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{userWon ? '🎉' : '😞'}</Typography>
              <Typography sx={{ color: '#000', fontWeight: 900, fontSize: '0.88rem' }}>{userWon ? 'CLASSIFICADO!' : 'ELIMINADO'}</Typography>
              <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{userWon ? '🎉' : '😞'}</Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
              <Typography sx={{ flex: 1, textAlign: 'right', color: tie.home?.isPlayer ? (userWon ? C.green : C.red) : C.ink2, fontWeight: 900, fontSize: '0.75rem' }}>{tie.home?.name || homeName}</Typography>
              <Box sx={{ bgcolor: C.bgCardAlt, border: `2px solid ${userWon ? C.green : C.red}40`, borderRadius: '10px', px: 1.5, py: 0.6, textAlign: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, fontFamily: 'monospace', color: homeAggregate > awayAggregate ? (tie.home?.isPlayer ? C.green : C.red) : awayAggregate > homeAggregate ? (tie.away?.isPlayer ? C.green : C.red) : C.gold }}>
                  {homeAggregate} – {awayAggregate}
                </Typography>
                {tie.penalties && <Typography sx={{ color: C.ink3, fontSize: '0.48rem', fontWeight: 700 }}>Pênaltis: {tie.penalties.home}×{tie.penalties.away}</Typography>}
              </Box>
              <Typography sx={{ flex: 1, color: tie.away?.isPlayer ? (userWon ? C.green : C.red) : C.ink2, fontWeight: 900, fontSize: '0.75rem' }}>{tie.away?.name || awayName}</Typography>
            </Box>
          </Box>
        );
      })()}

      <PostMatchCard accent={`${C.green}50`}>
        <PostMatchCardHead label="GOLS DA PARTIDA" icon="⚽" color={C.green} />
        <Box sx={{ px: 1.5, py: 1 }}>
          {goals.length === 0 ? (
            <Typography sx={{ color: C.ink3, fontSize: '0.72rem', fontStyle: 'italic' }}>Nenhum gol marcado</Typography>
          ) : goals.map((event, index) => {
            const { min, scorer, isHome } = parsePostMatchGoal(event, homeName, awayName);
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                  <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{min}'</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.9rem' }}>⚽</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: isHome ? C.green : C.blue, fontWeight: 900, fontSize: '0.78rem', lineHeight: 1 }}>{scorer || '—'}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{isHome ? homeName : awayName}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </PostMatchCard>

      {substitutions.length > 0 && (
        <PostMatchCard>
          <PostMatchCardHead label="SUBSTITUIÇÕES" icon="🔄" color={C.gold} />
          <Box sx={{ px: 1.5, py: 1 }}>
            {substitutions.map((sub, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                  <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{sub.min === 'HT' ? 'HT' : `${String(sub.min).replace(/'$/, '')}'`}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.85rem' }}>🔄</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: C.red, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>↓ {sub.out}</Typography>
                  <Typography sx={{ color: C.green, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1 }}>↑ {sub.in}</Typography>
                </Box>
                <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{gameData?.club?.name}</Typography>
              </Box>
            ))}
          </Box>
        </PostMatchCard>
      )}

      {(yellows.length > 0 || reds.length > 0) && (
        <PostMatchCard>
          <PostMatchCardHead label="CARTÕES" icon="🟨" />
          <Box sx={{ px: 1.5, py: 1 }}>
            {[...yellows.slice(0, 6).map(event => ({ event, color: C.gold, key: 'y' })), ...reds.map(event => ({ event, color: C.red, key: 'r' }))].map((item, index) => {
              const { min, player, team } = parsePostMatchCard(item.event, homeName, awayName);
              return (
                <Box key={`${item.key}${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                  <Box sx={{ bgcolor: C.bgCardAlt, borderRadius: '5px', px: 0.6, py: 0.2, minWidth: 28, textAlign: 'center' }}>
                    <Typography sx={{ color: C.ink3, fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700 }}>{min}'</Typography>
                  </Box>
                  <Box sx={{ width: 9, height: 13, bgcolor: item.color, borderRadius: '2px', flexShrink: 0 }} />
                  <Typography sx={{ flex: 1, color: C.ink, fontWeight: 900, fontSize: '0.72rem' }}>{player}</Typography>
                  <Typography sx={{ color: C.ink3, fontSize: '0.6rem', fontWeight: 700 }}>{team}</Typography>
                </Box>
              );
            })}
          </Box>
        </PostMatchCard>
      )}

      <PostMatchCard>
        <PostMatchCardHead label="ESTATÍSTICAS" icon="📊" />
        <Box sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ color: userSide === 'home' ? C.green : C.ink2, fontWeight: 900, fontSize: '0.68rem' }}>{homeName}</Typography>
            <Typography sx={{ color: userSide === 'away' ? C.green : C.ink2, fontWeight: 900, fontSize: '0.68rem' }}>{awayName}</Typography>
          </Box>
          <PostMatchStatRow label="POSSE (%)" h={possessionStats.home} a={possessionStats.away} />
          <PostMatchStatRow label="FINALIZAÇÕES" h={safeStats.homeShots} a={safeStats.awayShots} />
          <PostMatchStatRow label="NO ALVO" h={safeStats.homeOnTarget} a={safeStats.awayOnTarget} />
          <PostMatchStatRow label="ESCANTEIOS" h={safeStats.homeCorners} a={safeStats.awayCorners} />
          <PostMatchStatRow label="FALTAS" h={safeStats.homeFouls} a={safeStats.awayFouls} lower />
          <PostMatchStatRow label="AMARELOS" h={safeStats.homeYellows || 0} a={safeStats.awayYellows || 0} lower />
        </Box>
      </PostMatchCard>
    </>
  );
};

export default PostMatchSummaryTab;

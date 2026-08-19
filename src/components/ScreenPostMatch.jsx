import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { THEME } from '../theme.js';
import { sortLeagueTable } from '../engines/engine.js';
import { PostMatchAgent } from '../engines/PostMatchAgent.js';
import { resolveMatchInfo } from '../utils/matchDateUtils.js';
import PostMatchHeader from './postmatch/PostMatchHeader.jsx';
import PostMatchSummaryTab from './postmatch/PostMatchSummaryTab.jsx';
import PostMatchFinanceTab from './postmatch/PostMatchFinanceTab.jsx';
import PostMatchTableTab from './postmatch/PostMatchTableTab.jsx';
import PostMatchAbsencesTab from './postmatch/PostMatchAbsencesTab.jsx';
import {
  buildPostMatchEventGroups,
  buildPostMatchStats,
  getLeaguePositionChange,
  getPostMatchResultMeta,
  getPostMatchRoundContext,
} from './postmatch/postMatchViewModel.js';

const C = THEME;

const ScreenPostMatch = ({
  gameData,
  matchResultData,
  liveScore,
  possession,
  subsDone,
  roundSummary,
  setScreen,
  formatMoney,
  playersBefore = [],
  rawEvents = [],
}) => {
  const [tab, setTab] = React.useState(0);
  const [showPositionPopup, setShowPositionPopup] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const beforePlayers = Array.isArray(playersBefore) ? playersBefore : [];
  const afterPlayers = Array.isArray(gameData?.players) ? gameData.players : [];
  const postRawEvents = Array.isArray(rawEvents) ? rawEvents : [];

  const { matchCalendarIndex, nextCalendarRound } = getPostMatchRoundContext({
    gameData,
    matchResultData,
  });

  const playedMatchInfo = React.useMemo(
    () => resolveMatchInfo(gameData, matchCalendarIndex),
    [gameData, matchCalendarIndex],
  );

  const desfalques = React.useMemo(() => {
    if (!beforePlayers.length || !afterPlayers.length) {
      return { suspensions: [], injuries: [], hasBlockers: false };
    }
    return PostMatchAgent.analyzeDesfalques(beforePlayers, afterPlayers, postRawEvents, nextCalendarRound);
  }, [beforePlayers, afterPlayers, postRawEvents, nextCalendarRound]);

  const sortedTable = React.useMemo(
    () => (sortLeagueTable ? sortLeagueTable(gameData?.table || []) : (gameData?.table || [])),
    [gameData?.table],
  );

  const positionChange = React.useMemo(
    () => getLeaguePositionChange({
      gameData,
      sortedTable,
      isCupMatch: Boolean(matchResultData?.isCupMatch),
    }),
    [gameData, sortedTable, matchResultData?.isCupMatch],
  );

  React.useEffect(() => {
    if (!positionChange) {
      setShowPositionPopup(false);
      return undefined;
    }
    setShowPositionPopup(true);
    const timer = setTimeout(() => setShowPositionPopup(false), 4000);
    return () => clearTimeout(timer);
  }, [positionChange]);

  if (!matchResultData) return null;

  const { resultLabel, resultKind, score } = getPostMatchResultMeta({ gameData, matchResultData, liveScore });
  const resultColor = resultKind === 'win' ? C.green : resultKind === 'loss' ? C.red : C.gold;
  const matchEvents = Array.isArray(matchResultData.events) ? matchResultData.events : [];
  const eventGroups = buildPostMatchEventGroups(matchEvents);
  const stats = buildPostMatchStats({ matchResultData, liveScore:score, possession, events:matchEvents });
  const hasDesfalques = desfalques.suspensions.length > 0 || desfalques.injuries.length > 0;
  const isBlocked = desfalques.hasBlockers && !acknowledged;

  const tabs = [
    '⚽ Súmula',
    '💰 Finanças',
    '🏆 Tabela',
    ...(hasDesfalques ? [`🚨 Desfalques${desfalques.hasBlockers ? ' !' : ''}`] : []),
  ];

  const handleAcknowledge = () => {
    setAcknowledged(true);
    setScreen('lineup');
  };

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', pb: 5.5 }}>
      <PostMatchHeader
        gameData={gameData}
        matchResultData={matchResultData}
        liveScore={score}
        resultLabel={resultLabel}
        resultColor={resultColor}
        matchDateStr={playedMatchInfo.fullStrWithYear}
      />

      <Box sx={{ display: 'flex', mx: 1.5, mt: 1.2, mb: 0.8, bgcolor: C.bgCard, borderRadius: '10px', p: 0.4, border: `1px solid ${C.border}` }}>
        {tabs.map((label, index) => (
          <Box
            key={label}
            onClick={() => setTab(index)}
            sx={{ flex: 1, py: 0.8, textAlign: 'center', borderRadius: '7px', cursor: 'pointer', bgcolor: tab === index ? C.green : 'transparent', transition: 'all 0.15s' }}
          >
            <Typography sx={{ color: tab === index ? '#000' : C.ink3, fontWeight: 900, fontSize: '0.6rem' }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 1.5, pt: 0.5 }}>
        {tab === 0 && (
          <PostMatchSummaryTab
            gameData={gameData}
            matchResultData={matchResultData}
            liveScore={score}
            resultLabel={resultLabel}
            resultColor={resultColor}
            matchDateStr={playedMatchInfo.fullStrWithYear}
            subsDone={subsDone}
            eventGroups={eventGroups}
            stats={stats}
          />
        )}
        {tab === 1 && (
          <PostMatchFinanceTab
            gameData={gameData}
            matchResultData={matchResultData}
            roundSummary={roundSummary}
            formatMoney={formatMoney}
          />
        )}
        {tab === 2 && (
          <PostMatchTableTab
            gameData={gameData}
            positionChange={positionChange}
            showPositionPopup={showPositionPopup}
          />
        )}
        {tab === 3 && hasDesfalques && (
          <PostMatchAbsencesTab
            desfalques={desfalques}
            acknowledged={acknowledged}
            onAcknowledge={handleAcknowledge}
          />
        )}
      </Box>

      <Box sx={{ px: 1.5, pb: 2 }}>
        {isBlocked ? (
          <Button
            fullWidth
            onClick={() => setTab(3)}
            sx={{
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.9rem',
              bgcolor: C.red,
              color: '#fff',
              boxShadow: `0 4px 16px ${C.red}40`,
              '&:hover': { bgcolor: '#b91c1c' },
              animation: 'pulse-red 1.8s infinite',
              '@keyframes pulse-red': {
                '0%, 100%': { boxShadow: `0 4px 16px ${C.red}40` },
                '50%': { boxShadow: `0 4px 28px ${C.red}80` },
              },
            }}
          >
            🚨 VER DESFALQUES ANTES DE SAIR
          </Button>
        ) : (
          <Button
            fullWidth
            onClick={() => setScreen('home')}
            sx={{ py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem', bgcolor: C.green, color: '#000', boxShadow: `0 4px 16px ${C.green}40`, '&:hover': { bgcolor: C.primaryDim } }}
          >
            🏠 VOLTAR AO PAINEL
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ScreenPostMatch;

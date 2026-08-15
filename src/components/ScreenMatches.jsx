import React from 'react';
import { Box } from '@mui/material';
import MatchesHeader from './matches/MatchesHeader.jsx';
import MatchesCalendar from './matches/MatchesCalendar.jsx';
import SelectedDayMatches from './matches/SelectedDayMatches.jsx';
import UpcomingMatches from './matches/UpcomingMatches.jsx';
import RecentResults from './matches/RecentResults.jsx';
import MatchSummaryDialog from './matches/MatchSummaryDialog.jsx';
import { N } from './matches/matchesTheme.js';
import {
  buildRoundDates,
  buildDayRoundsMap,
  buildUpcomingEvents,
  buildRecentResults,
  getMatchesForDay,
  getCalendarWindow,
} from '../engines/matches/matchesViewModel.js';

// Tela de calendário e histórico de partidas.
// A lógica de datas/competições fica no view-model; esta tela coordena estado visual.
const ScreenMatches = ({ gameData, setScreen }) => {
  const [calMonth, setCalMonth] = React.useState(0);
  const [selectedDay, setSelectedDay] = React.useState(null);
  const [summaryMatch, setSummaryMatch] = React.useState(null);
  const [compFilter, setCompFilter] = React.useState('TODOS');

  const currentRound = gameData.round ?? 0;
  const maxRounds = gameData.fixtures?.length || 0;
  const roundDates = React.useMemo(() => buildRoundDates(maxRounds), [maxRounds]);

  const dayRoundsMap = React.useMemo(() => buildDayRoundsMap({
    gameData,
    currentRound,
    roundDates,
  }), [gameData, currentRound, roundDates]);

  const upcomingEvents = React.useMemo(() => buildUpcomingEvents({
    gameData,
    currentRound,
    roundDates,
  }), [gameData, currentRound, roundDates]);

  const recentResults = React.useMemo(() => buildRecentResults({
    gameData,
    currentRound,
    roundDates,
  }), [gameData, currentRound, roundDates]);

  const calendarWindow = React.useMemo(
    () => getCalendarWindow(roundDates, calMonth),
    [roundDates, calMonth],
  );

  const getDayEvents = React.useCallback((year, month, day) => (
    getMatchesForDay(dayRoundsMap, year, month, day, compFilter)
  ), [dayRoundsMap, compFilter]);

  const selectedEvents = React.useMemo(() => {
    if (!selectedDay) return [];
    return getDayEvents(calendarWindow.realYear, calendarWindow.realMonth, selectedDay);
  }, [selectedDay, calendarWindow.realYear, calendarWindow.realMonth, getDayEvents]);

  React.useEffect(() => {
    const focusDate = upcomingEvents[0]?.date || roundDates[Math.max(0, roundDates.length - 1)];
    const firstDate = roundDates[0];
    if (!focusDate || !firstDate) return;
    const monthOffset = (focusDate.getFullYear() - firstDate.getFullYear()) * 12
      + (focusDate.getMonth() - firstDate.getMonth());
    setCalMonth(Math.max(0, monthOffset));
    if (currentRound > 0) setSelectedDay(focusDate.getDate());
  }, [currentRound, roundDates, upcomingEvents]);

  return (
    <Box sx={{ bgcolor: N.bg, minHeight: '100vh', pb: 10 }}>
      <MatchesHeader gameData={gameData} setScreen={setScreen} />

      <MatchesCalendar
        calendarWindow={calendarWindow}
        calMonth={calMonth}
        setCalMonth={setCalMonth}
        compFilter={compFilter}
        setCompFilter={setCompFilter}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        getDayEvents={getDayEvents}
        currentRound={currentRound}
      />

      <SelectedDayMatches
        events={selectedEvents}
        gameData={gameData}
        onOpenSummary={setSummaryMatch}
      />

      <UpcomingMatches
        events={upcomingEvents}
        gameData={gameData}
        currentRound={currentRound}
      />

      <RecentResults
        results={recentResults}
        gameData={gameData}
        onOpenSummary={setSummaryMatch}
      />

      <MatchSummaryDialog match={summaryMatch} onClose={() => setSummaryMatch(null)} />
    </Box>
  );
};

export default ScreenMatches;

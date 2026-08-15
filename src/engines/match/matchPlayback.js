// Centraliza a reprodução visual da narração de uma partida.
// Mantém o motor de simulação separado do temporizador/UI de playback.
export function startMatchPlayback({
  matchData,
  intervalRef,
  matchControlsRef,
  setSimulating,
  setVisibleEvents,
  setLiveScore,
  intervalMs = 2000,
}) {
  setSimulating(true);
  setVisibleEvents([]);
  setLiveScore({ home: 0, away: 0 });

  const controls = matchControlsRef.current;
  controls.addEvent = evt => setVisibleEvents(prev => [...prev, evt]);
  controls.setLiveScore = score => setLiveScore(score);
  controls.setVisibleEvents = evts => setVisibleEvents(evts);
  controls.isPaused = false;

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSimulating(false);
    controls.isPaused = false;
  };
  controls.forceEnd = stop;

  if (!matchData?.events?.length) {
    stop();
    return;
  }

  let index = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  let halfTimePaused = false;

  const fireNextEvent = () => {
    if (index >= matchData.events.length) {
      stop();
      controls.resumeSecondHalf = null;
      return;
    }

    const event = matchData.events[index];
    const minute = parseInt((event.match(/^(\d+)'/) || [])[1] || 0);

    if (!halfTimePaused && minute > 45 && !event.includes('FIM DE JOGO')) {
      halfTimePaused = true;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setSimulating(false);
      controls.resumeSecondHalf = () => {
        controls.resumeSecondHalf = null;
        setSimulating(true);
        intervalRef.current = setInterval(fireNextEvent, intervalMs);
      };
      return;
    }

    const isOwnGoal = event.includes('GOL CONTRA');
    const isGoal = event.includes('⚽') || isOwnGoal;
    if (isGoal) {
      if (!isOwnGoal) {
        if (event.includes(matchData.homeName)) homeGoals++;
        else if (event.includes(matchData.awayName)) awayGoals++;
      } else {
        if (event.includes(matchData.homeName)) awayGoals++;
        else if (event.includes(matchData.awayName)) homeGoals++;
      }
    }

    setLiveScore({ home: homeGoals, away: awayGoals });
    setVisibleEvents(prev => [...prev, event]);
    index++;
  };

  intervalRef.current = setInterval(fireNextEvent, intervalMs);
  controls.pauseMatch = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    controls.isPaused = true;
  };
  controls.resumeMatch = () => {
    if (intervalRef.current) return;
    controls.isPaused = false;
    intervalRef.current = setInterval(fireNextEvent, intervalMs);
  };
  controls.forceEnd = stop;
}

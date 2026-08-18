import {
  getMatchEventBaseMinute,
  getMatchEventKind,
} from './matchEventViewModel.js';
import { createLiveMatchTimeline } from './matchLiveTimeline.js';

const asRef = (ref, fallback = null) => (
  ref && typeof ref === 'object' ? ref : { current: fallback }
);

// Centraliza a reprodução visual da narração de uma partida.
// A timeline é a fonte única de verdade; React apenas recebe snapshots publicados.
export function startMatchPlayback({
  matchData,
  intervalRef,
  matchControlsRef,
  setSimulating,
  setVisibleEvents,
  setLiveScore,
  intervalMs = 2000,
  autoStart = false,
  onResolvedMatchData = null,
}) {
  const timerRef = asRef(intervalRef, null);
  const controlsRef = asRef(matchControlsRef, {});
  if (!controlsRef.current || typeof controlsRef.current !== 'object') controlsRef.current = {};
  const controls = controlsRef.current;
  const sessionId = (Number(controls.playbackSessionId) || 0) + 1;
  controls.playbackSessionId = sessionId;
  const isCurrentSession = () => controls.playbackSessionId === sessionId;
  const scheduledEvents = Array.isArray(matchData?.events)
    ? matchData.events
      .map((event, sourceIndex) => ({ event, sourceIndex }))
      .filter(({ event }) => typeof event === 'string' && event.trim())
    : [];
  const rawEvents = Array.isArray(matchData?.rawEvents) ? matchData.rawEvents : [];
  const liveTimeline = createLiveMatchTimeline(matchData || {});
  const tickMs = Number.isFinite(Number(intervalMs)) ? Math.max(1, Number(intervalMs)) : 2000;

  // Evita que um timer órfão da partida anterior continue escrevendo no estado
  // depois que os controles forem reutilizados para uma nova partida.
  if (timerRef.current) clearInterval(timerRef.current);
  timerRef.current = null;

  const publishLiveState = (snapshot = liveTimeline.getLiveState()) => {
    if (!isCurrentSession()) return snapshot;
    controls.liveState = snapshot;
    controls.liveActiveLineups = snapshot.activeLineups;
    setLiveScore?.(snapshot.score);
    setVisibleEvents?.(snapshot.events);
    return snapshot;
  };

  setSimulating?.(false);
  publishLiveState();

  controls.addEvent = (evt) => {
    const registered = liveTimeline.registerExternalNarration?.(evt);
    if (!registered?.applied) return false;
    controls.lastResolvedRawEvent = registered.rawEvent || null;
    publishLiveState(registered.liveState);
    return true;
  };
  controls.registerLiveSubstitution = (payload = {}) => {
    const registered = liveTimeline.registerManualSubstitution(payload);
    if (!registered?.applied) return false;
    controls.lastResolvedRawEvent = registered.rawEvent || null;
    publishLiveState(registered.liveState);
    return true;
  };
  controls.getResolvedMatchData = () => liveTimeline.getResolvedMatchData();
  controls.getLiveMatchState = () => liveTimeline.getLiveState();
  controls.syncLiveState = () => publishLiveState();
  controls.lastResolvedRawEvent = null;
  controls.isPaused = false;
  controls.matchStarted = false;
  controls.resumeSecondHalf = null;
  if (!Array.isArray(controls.liveSubstitutions)) controls.liveSubstitutions = [];

  let index = 0;
  let halfTimePaused = false;
  let awaitingSecondHalf = false;
  let ended = false;

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stop = ({ commit = false, status = 'finished' } = {}) => {
    if (ended || !isCurrentSession()) return;
    clearTimer();
    ended = true;
    awaitingSecondHalf = false;
    controls.resumeSecondHalf = null;
    controls.isPaused = false;
    controls.matchStarted = false;
    setSimulating?.(false);
    liveTimeline.setLiveStatus(status, status === 'finished' ? 90 : null);
    publishLiveState();
    if (commit) {
      const resolvedMatchData = liveTimeline.getResolvedMatchData();
      onResolvedMatchData?.(resolvedMatchData);
      controls.commitMatchState?.();
    }
  };

  const startTimer = () => {
    if (ended || !isCurrentSession() || timerRef.current) return false;
    setSimulating?.(true);
    timerRef.current = setInterval(fireNextEvent, tickMs);
    return true;
  };

  const pauseForHalfTime = () => {
    if (ended || !isCurrentSession() || halfTimePaused) return;
    halfTimePaused = true;
    awaitingSecondHalf = true;
    clearTimer();
    setSimulating?.(false);
    controls.isPaused = false;
    liveTimeline.setLiveStatus('halftime', 45);
    publishLiveState();
    controls.resumeSecondHalf = () => {
      if (ended || !awaitingSecondHalf) return false;
      controls.resumeSecondHalf = null;
      awaitingSecondHalf = false;
      controls.isPaused = false;
      liveTimeline.setLiveStatus('second-half', 45);
      publishLiveState();
      return startTimer();
    };
  };

  function fireNextEvent() {
    if (ended || !isCurrentSession()) return;

    if (index >= scheduledEvents.length) {
      if (!halfTimePaused) {
        pauseForHalfTime();
        return;
      }
      stop({ commit: true });
      return;
    }

    const scheduled = scheduledEvents[index];
    const sourceEvent = scheduled.event;
    const sourceRawEvent = rawEvents[scheduled.sourceIndex];
    const baseMinute = getMatchEventBaseMinute(sourceEvent);

    // Acréscimos de 45+N pertencem ao primeiro tempo. O intervalo só é aberto
    // quando o próximo evento já pertence ao segundo tempo (minuto-base > 45).
    if (!halfTimePaused && baseMinute != null && baseMinute > 45) {
      pauseForHalfTime();
      return;
    }

    const resolved = liveTimeline.resolveScheduledEvent({
      narration: sourceEvent,
      rawEvent: sourceRawEvent,
      sourceIndex: scheduled.sourceIndex,
    });
    const event = resolved.narration;
    controls.lastResolvedRawEvent = resolved.rawEvent || null;
    publishLiveState(resolved.liveState);
    index += 1;

    if (getMatchEventKind(event) === 'end') {
      stop({ commit: true });
      return;
    }

    if (index >= scheduledEvents.length && !halfTimePaused) pauseForHalfTime();
    else if (index >= scheduledEvents.length) stop({ commit: true });
  }

  const start = () => {
    if (ended || !isCurrentSession() || timerRef.current || !scheduledEvents.length || controls.matchStarted) return false;
    controls.matchStarted = true;
    controls.isPaused = false;
    liveTimeline.setLiveStatus('first-half', 0);
    publishLiveState();
    if (!startTimer()) {
      controls.matchStarted = false;
      liveTimeline.setLiveStatus('prepared', 0);
      publishLiveState();
      return false;
    }
    return true;
  };

  controls.startMatch = start;
  controls.pauseMatch = () => {
    if (ended || awaitingSecondHalf || !controls.matchStarted || !timerRef.current) return false;
    clearTimer();
    controls.isPaused = true;
    liveTimeline.setLiveStatus('paused');
    publishLiveState();
    return true;
  };
  controls.resumeMatch = () => {
    if (ended || awaitingSecondHalf || timerRef.current || !controls.matchStarted || !controls.isPaused) return false;
    controls.isPaused = false;
    liveTimeline.setLiveStatus(halfTimePaused ? 'second-half' : 'first-half');
    publishLiveState();
    if (!startTimer()) {
      controls.isPaused = true;
      liveTimeline.setLiveStatus('paused');
      publishLiveState();
      return false;
    }
    return true;
  };

  const resolveRemainingEvents = () => {
    while (index < scheduledEvents.length) {
      const scheduled = scheduledEvents[index];
      const resolved = liveTimeline.resolveScheduledEvent({
        narration: scheduled.event,
        rawEvent: rawEvents[scheduled.sourceIndex],
        sourceIndex: scheduled.sourceIndex,
      });
      controls.lastResolvedRawEvent = resolved.rawEvent || null;
      index += 1;
    }
    publishLiveState();
  };

  controls.forceEnd = () => {
    const shouldCommit = Boolean(controls.matchStarted);
    if (shouldCommit) resolveRemainingEvents();
    stop({ commit: shouldCommit, status: shouldCommit ? 'finished' : 'cancelled' });
    if (!shouldCommit) {
      controls.cancelMatchState?.();
      controls.commitMatchState = null;
    }
  };

  if (!scheduledEvents.length) {
    stop({ commit: false, status:'cancelled' });
    controls.cancelMatchState?.();
    controls.commitMatchState = null;
    return;
  }
  if (autoStart) start();
}

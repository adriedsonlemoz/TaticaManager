import {
  getMatchEventBaseMinute,
  getMatchEventKind,
  getMatchEventMinute,
} from './matchEventViewModel.js';
import { createLiveMatchTimeline } from './matchLiveTimeline.js';

const asRef = (ref, fallback = null) => (
  ref && typeof ref === 'object' ? ref : { current: fallback }
);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const nowMs = () => Date.now();

function getHalfBounds(scheduledEvents = []) {
  let firstEnd = 45;
  let secondEnd = 90;
  scheduledEvents.forEach(({ event }) => {
    const base = getMatchEventBaseMinute(event);
    const minute = getMatchEventMinute(event);
    if (minute == null) return;
    if (base != null && base <= 45) firstEnd = Math.max(firstEnd, minute);
    else secondEnd = Math.max(secondEnd, minute);
  });
  return { firstEnd:Math.min(firstEnd, 55), secondEnd:Math.min(secondEnd, 105) };
}

// Centraliza a reprodução visual da narração de uma partida.
// A timeline e este playhead são as únicas fontes de verdade para eventos e relógio.
// Eventos só são publicados quando o minuto canônico da simulação é alcançado.
export function startMatchPlayback({
  matchData,
  intervalRef,
  matchControlsRef,
  setSimulating,
  setVisibleEvents,
  setLiveScore,
  setLiveMinute,
  intervalMs = 100,
  halfDurationMs = null,
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
      .map((event, sourceIndex) => ({
        event,
        sourceIndex,
        minute:getMatchEventMinute(event),
        baseMinute:getMatchEventBaseMinute(event),
      }))
      .filter(({ event }) => typeof event === 'string' && event.trim())
    : [];
  const rawEvents = Array.isArray(matchData?.rawEvents) ? matchData.rawEvents : [];
  const liveTimeline = createLiveMatchTimeline(matchData || {});
  const tickMs = Number.isFinite(Number(intervalMs)) ? Math.max(1, Number(intervalMs)) : 100;
  // Smoke tests historicamente usam intervalMs=5. Mantemos um modo acelerado
  // sem deixar esse detalhe comandar a cadência de eventos no jogo real.
  const durationMs = Number.isFinite(Number(halfDurationMs))
    ? Math.max(10, Number(halfDurationMs))
    : (tickMs < 50 ? 12 : 30000);
  const { firstEnd, secondEnd } = getHalfBounds(scheduledEvents);

  if (timerRef.current) clearInterval(timerRef.current);
  timerRef.current = null;

  const publishLiveState = (snapshot = liveTimeline.getLiveState()) => {
    if (!isCurrentSession()) return snapshot;
    controls.liveState = snapshot;
    controls.liveActiveLineups = snapshot.activeLineups;
    setLiveScore?.(snapshot.score);
    setVisibleEvents?.(snapshot.events);
    if (Number.isFinite(Number(snapshot.minute))) setLiveMinute?.(Number(snapshot.minute));
    return snapshot;
  };

  const publishClock = (minute, status = null) => {
    if (!isCurrentSession()) return;
    const safeMinute = Math.max(0, Number(minute) || 0);
    controls.liveMinute = safeMinute;
    if (status) liveTimeline.setLiveStatus(status, safeMinute);
    else liveTimeline.setLiveStatus(liveTimeline.getLiveState()?.status || 'first-half', safeMinute);
    controls.liveState = liveTimeline.getLiveState();
    controls.liveActiveLineups = controls.liveState.activeLineups;
    setLiveMinute?.(safeMinute);
  };

  setSimulating?.(false);
  setLiveMinute?.(0);
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
  controls.liveMinute = 0;
  if (!Array.isArray(controls.liveSubstitutions)) controls.liveSubstitutions = [];

  let index = 0;
  let halfTimePaused = false;
  let awaitingSecondHalf = false;
  let ended = false;
  let segment = 'first';
  let segmentElapsed = 0;
  let lastTickAt = null;

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    lastTickAt = null;
  };

  const resolveEvent = (scheduled) => {
    const resolved = liveTimeline.resolveScheduledEvent({
      narration: scheduled.event,
      rawEvent: rawEvents[scheduled.sourceIndex],
      sourceIndex: scheduled.sourceIndex,
    });
    controls.lastResolvedRawEvent = resolved.rawEvent || null;
    publishLiveState(resolved.liveState);
    index += 1;
    return resolved.narration;
  };

  const eventBelongsToCurrentSegment = (scheduled) => {
    const base = scheduled?.baseMinute;
    if (segment === 'first') return base == null || base <= 45;
    return base == null || base > 45;
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
    const finalMinute = status === 'finished' ? Math.max(90, controls.liveMinute || 0) : controls.liveMinute || 0;
    liveTimeline.setLiveStatus(status, finalMinute);
    setLiveMinute?.(finalMinute);
    publishLiveState();
    if (commit) {
      const resolvedMatchData = liveTimeline.getResolvedMatchData();
      onResolvedMatchData?.(resolvedMatchData);
      controls.commitMatchState?.();
    }
  };

  const startTimer = () => {
    if (ended || !isCurrentSession() || timerRef.current) return false;
    lastTickAt = nowMs();
    setSimulating?.(true);
    timerRef.current = setInterval(tickPlayback, tickMs);
    // Primeiro tick imediato evita sensação de atraso sem antecipar eventos futuros.
    tickPlayback();
    return true;
  };

  const pauseForHalfTime = () => {
    if (ended || !isCurrentSession() || halfTimePaused) return;
    halfTimePaused = true;
    awaitingSecondHalf = true;
    clearTimer();
    setSimulating?.(false);
    controls.isPaused = false;
    publishClock(firstEnd, 'halftime');
    publishLiveState();
    controls.resumeSecondHalf = () => {
      if (ended || !awaitingSecondHalf) return false;
      controls.resumeSecondHalf = null;
      awaitingSecondHalf = false;
      controls.isPaused = false;
      segment = 'second';
      segmentElapsed = 0;
      publishClock(45, 'second-half');
      publishLiveState();
      return startTimer();
    };
  };

  function tickPlayback() {
    if (ended || !isCurrentSession()) return;
    const now = nowMs();
    if (lastTickAt != null) segmentElapsed += Math.max(0, now - lastTickAt);
    lastTickAt = now;

    const startMinute = segment === 'first' ? 0 : 45;
    const endMinute = segment === 'first' ? firstEnd : secondEnd;
    const progress = clamp(segmentElapsed / durationMs, 0, 1);
    const playhead = startMinute + ((endMinute - startMinute) * progress);
    publishClock(playhead, segment === 'first' ? 'first-half' : 'second-half');

    while (index < scheduledEvents.length) {
      const scheduled = scheduledEvents[index];
      if (!eventBelongsToCurrentSegment(scheduled)) break;
      const targetMinute = scheduled.minute == null ? startMinute : scheduled.minute;
      if (targetMinute > playhead && progress < 1) break;
      const event = resolveEvent(scheduled);
      if (getMatchEventKind(event) === 'end') {
        stop({ commit:true });
        return;
      }
    }

    if (progress < 1) return;
    if (segment === 'first') {
      pauseForHalfTime();
      return;
    }

    // Qualquer evento sem minuto que tenha sobrado é resolvido no apito final.
    while (index < scheduledEvents.length) {
      const event = resolveEvent(scheduledEvents[index]);
      if (getMatchEventKind(event) === 'end') break;
    }
    stop({ commit:true });
  }

  const start = () => {
    if (ended || !isCurrentSession() || timerRef.current || !scheduledEvents.length || controls.matchStarted) return false;
    controls.matchStarted = true;
    controls.isPaused = false;
    segment = 'first';
    segmentElapsed = 0;
    publishClock(0, 'first-half');
    publishLiveState();
    if (!startTimer()) {
      controls.matchStarted = false;
      publishClock(0, 'prepared');
      publishLiveState();
      return false;
    }
    return true;
  };

  controls.startMatch = start;
  controls.pauseMatch = () => {
    if (ended || awaitingSecondHalf || !controls.matchStarted || !timerRef.current) return false;
    // Captura o delta desde o último tick para retomar do mesmo instante.
    if (lastTickAt != null) segmentElapsed += Math.max(0, nowMs() - lastTickAt);
    clearTimer();
    controls.isPaused = true;
    liveTimeline.setLiveStatus('paused', controls.liveMinute || 0);
    publishLiveState();
    return true;
  };
  controls.resumeMatch = () => {
    if (ended || awaitingSecondHalf || timerRef.current || !controls.matchStarted || !controls.isPaused) return false;
    controls.isPaused = false;
    liveTimeline.setLiveStatus(segment === 'second' ? 'second-half' : 'first-half', controls.liveMinute || 0);
    publishLiveState();
    if (!startTimer()) {
      controls.isPaused = true;
      liveTimeline.setLiveStatus('paused', controls.liveMinute || 0);
      publishLiveState();
      return false;
    }
    return true;
  };

  const resolveRemainingEvents = () => {
    while (index < scheduledEvents.length) resolveEvent(scheduledEvents[index]);
    controls.liveMinute = 90;
    setLiveMinute?.(90);
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

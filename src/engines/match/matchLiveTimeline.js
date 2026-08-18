import { getMatchEventTeam } from './matchEventViewModel.js';
import { createCanonicalLiveMatchState } from './matchLiveState.js';

const ATTACK_POSITIONS = new Set(['CA', 'PD', 'PE', 'MEI', 'ATA']);
const RED_TYPES = new Set(['red_direct', 'red_second_yellow', 'red']);
const PLAYER_EVENT_TYPES = new Set(['goal', 'penalty_goal', 'own_goal', 'yellow', 'red_direct', 'red_second_yellow', 'red']);

const idKey = (value) => value == null ? null : String(value);
const nameKey = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const hasId = (value) => value != null && String(value).trim() !== '';

const clonePlayer = (player) => player && typeof player === 'object' ? { ...player } : player;
const cloneRawEvent = (event) => {
  if (!event || typeof event !== 'object') return event;
  return {
    ...event,
    scorerObj: event.scorerObj ? { ...event.scorerObj } : event.scorerObj,
    ownGoalByObj: event.ownGoalByObj ? { ...event.ownGoalByObj } : event.ownGoalByObj,
    changes: Array.isArray(event.changes) ? event.changes.map((change) => ({ ...change })) : event.changes,
  };
};

const safeRoster = (value) => Array.isArray(value) ? value.filter(Boolean).map(clonePlayer) : [];
const initialIds = (roster, ids) => {
  const requested = Array.isArray(ids) ? ids.map(idKey).filter((key) => key != null) : [];
  if (requested.length) return requested;
  return roster.filter((player) => player?.isStarting).map((player) => idKey(player?.id)).filter((key) => key != null);
};

const getUserSide = (matchData = {}) => {
  if (matchData?.userSide === 'home' || matchData?.userSide === 'away') return matchData.userSide;
  if (typeof matchData?.userIsHome === 'boolean') return matchData.userIsHome ? 'home' : 'away';
  if (matchData?.homeIsPlayer === true && matchData?.awayIsPlayer !== true) return 'home';
  if (matchData?.awayIsPlayer === true && matchData?.homeIsPlayer !== true) return 'away';
  return null;
};

const sideFromTeamIdentity = (matchData, teamId, teamName) => {
  const key = idKey(teamId);
  const homeId = idKey(matchData?.homeId);
  const awayId = idKey(matchData?.awayId);
  if (key != null && homeId != null && key === homeId) return 'home';
  if (key != null && awayId != null && key === awayId) return 'away';

  const name = nameKey(teamName);
  if (name && name === nameKey(matchData?.homeName)) return 'home';
  if (name && name === nameKey(matchData?.awayName)) return 'away';
  return null;
};

const getRawActorSide = (matchData, rawEvent, narration) => {
  if (!rawEvent || typeof rawEvent !== 'object') {
    return getMatchEventTeam(narration, matchData?.homeName, matchData?.awayName);
  }

  if (rawEvent.type === 'own_goal') {
    const ownSide = sideFromTeamIdentity(matchData, rawEvent.ownGoalTeamId, rawEvent.ownGoalTeamName);
    if (ownSide) return ownSide;
    const scoringSide = sideFromTeamIdentity(matchData, rawEvent.teamId, rawEvent.teamName);
    return scoringSide === 'home' ? 'away' : scoringSide === 'away' ? 'home' : null;
  }

  const byIdentity = sideFromTeamIdentity(matchData, rawEvent.teamId, rawEvent.teamName);
  if (byIdentity) return byIdentity;

  const userSide = getUserSide(matchData);
  if (typeof rawEvent.isPlayer === 'boolean' && userSide) {
    return rawEvent.isPlayer ? userSide : (userSide === 'home' ? 'away' : 'home');
  }
  return getMatchEventTeam(narration, matchData?.homeName, matchData?.awayName);
};

const getRawActor = (rawEvent) => {
  if (!rawEvent || typeof rawEvent !== 'object') return { id:null, name:'', player:null };
  if (rawEvent.type === 'goal' || rawEvent.type === 'penalty_goal') {
    return {
      id: rawEvent.scorerObj?.id ?? null,
      name: rawEvent.scorerObj?.name ?? rawEvent.scorer ?? '',
      player: rawEvent.scorerObj || null,
    };
  }
  if (rawEvent.type === 'own_goal') {
    return {
      id: rawEvent.ownGoalByObj?.id ?? rawEvent.ownGoalById ?? null,
      name: rawEvent.ownGoalByObj?.name ?? rawEvent.ownGoalBy ?? '',
      player: rawEvent.ownGoalByObj || null,
    };
  }
  if (rawEvent.type === 'yellow' || RED_TYPES.has(rawEvent.type)) {
    return {
      id: rawEvent.playerId ?? null,
      name: rawEvent.playerName ?? '',
      player: null,
    };
  }
  return { id:null, name:'', player:null };
};

const deterministicIndex = (seed, length) => {
  if (length <= 1) return 0;
  const text = String(seed ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const replaceActorName = (narration, previousName, nextName) => {
  const text = String(narration ?? '');
  const from = String(previousName ?? '').trim();
  const to = String(nextName ?? '').trim();
  if (!from || !to || from === to) return text;
  return text.replace(new RegExp(escapeRegExp(from), 'g'), to);
};

const normalizeMinute = (value) => {
  if (value === 'HT') return 45;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(120, Math.trunc(parsed))) : null;
};

export function createLiveMatchTimeline(matchData = {}) {
  const rosters = {
    home: safeRoster(matchData?.rosters?.home),
    away: safeRoster(matchData?.rosters?.away),
  };
  const playerById = {
    home: new Map(rosters.home.map((player) => [idKey(player?.id), player]).filter(([key]) => key != null)),
    away: new Map(rosters.away.map((player) => [idKey(player?.id), player]).filter(([key]) => key != null)),
  };
  const playerByName = {
    home: new Map(rosters.home.map((player) => [nameKey(player?.name), player]).filter(([key]) => key)),
    away: new Map(rosters.away.map((player) => [nameKey(player?.name), player]).filter(([key]) => key)),
  };
  const active = {
    home: initialIds(rosters.home, matchData?.activeLineups?.home),
    away: initialIds(rosters.away, matchData?.activeLineups?.away),
  };
  const liveState = createCanonicalLiveMatchState(matchData, active);
  const yellowCounts = { home:new Map(), away:new Map() };
  const resolvedBySourceIndex = new Map();
  const userSide = getUserSide(matchData);

  const getPlayer = (side, { id, name } = {}) => {
    const key = idKey(id);
    if (key != null && playerById[side]?.has(key)) return playerById[side].get(key);
    const nKey = nameKey(name);
    if (nKey && playerByName[side]?.has(nKey)) return playerByName[side].get(nKey);
    return null;
  };

  const isActive = (side, actor = {}) => {
    const player = getPlayer(side, actor);
    const key = idKey(player?.id ?? actor?.id);
    if (key != null) return active[side].includes(key);
    const targetName = nameKey(player?.name ?? actor?.name);
    if (!targetName) return false;
    return active[side].some((candidateId) => nameKey(playerById[side]?.get(candidateId)?.name) === targetName);
  };

  const chooseActivePlayer = (side, rawEvent, sourceIndex) => {
    let candidates = active[side]
      .map((key) => playerById[side]?.get(key))
      .filter(Boolean);
    if (!candidates.length) return null;
    if (rawEvent?.type === 'goal' || rawEvent?.type === 'penalty_goal') {
      const attackers = candidates.filter((player) => ATTACK_POSITIONS.has(player?.position));
      if (attackers.length) candidates = attackers;
    }
    const actor = getRawActor(rawEvent);
    const seed = `${sourceIndex}|${rawEvent?.type || ''}|${actor.id ?? actor.name ?? ''}`;
    return candidates[deterministicIndex(seed, candidates.length)] || candidates[0] || null;
  };

  const rewriteActor = (rawEvent, narration, player) => {
    const nextRaw = cloneRawEvent(rawEvent);
    const actor = getRawActor(rawEvent);
    let nextNarration = replaceActorName(narration, actor.name, player?.name);
    if (!nextRaw || !player) return { rawEvent:nextRaw, narration:nextNarration, replaced:false, actor:player || null };

    if (nextRaw.type === 'goal' || nextRaw.type === 'penalty_goal') {
      nextRaw.scorer = player.name;
      nextRaw.scorerObj = {
        ...player,
        teamId: player.teamId ?? nextRaw.teamId,
        teamName: player.teamName ?? nextRaw.teamName,
      };
    } else if (nextRaw.type === 'own_goal') {
      nextRaw.ownGoalBy = player.name;
      nextRaw.ownGoalById = player.id ?? null;
      nextRaw.ownGoalByObj = { ...player };
    } else if (nextRaw.type === 'yellow' || RED_TYPES.has(nextRaw.type)) {
      nextRaw.playerName = player.name;
      nextRaw.playerId = player.id ?? null;
    }
    return { rawEvent:nextRaw, narration:nextNarration, replaced:true, actor:player };
  };

  const removeActive = (side, player) => {
    const key = idKey(player?.id);
    if (key != null) {
      active[side] = active[side].filter((candidate) => candidate !== key);
      return;
    }
    const targetName = nameKey(player?.name);
    if (!targetName) return;
    active[side] = active[side].filter((candidate) => nameKey(playerById[side]?.get(candidate)?.name) !== targetName);
  };

  const applyStructuredSubstitution = (side, rawEvent) => {
    const changes = Array.isArray(rawEvent?.changes) ? rawEvent.changes : [];
    changes.forEach((change) => {
      const outKey = idKey(change?.outgoingId);
      const inKey = idKey(change?.incomingId);
      if (outKey == null || inKey == null || outKey === inKey) return;
      const at = active[side].indexOf(outKey);
      if (at < 0 || active[side].includes(inKey) || !playerById[side]?.has(inKey)) return;
      active[side] = active[side].map((candidate, index) => index === at ? inKey : candidate);
    });
  };

  const playerCardKey = (player) => idKey(player?.id) ?? (nameKey(player?.name) || null);
  const yellowCountFor = (side, player) => {
    const key = playerCardKey(player);
    return key == null ? 0 : (yellowCounts[side].get(key) || 0);
  };
  const addYellowFor = (side, player) => {
    const key = playerCardKey(player);
    if (key == null) return;
    yellowCounts[side].set(key, yellowCountFor(side, player) + 1);
  };
  const chooseActiveWithYellow = (side, sourceIndex) => {
    const candidates = active[side]
      .map((key) => playerById[side]?.get(key))
      .filter((player) => player && yellowCountFor(side, player) > 0);
    if (!candidates.length) return null;
    return candidates[deterministicIndex(`second-yellow|${sourceIndex}`, candidates.length)] || candidates[0];
  };
  const chooseActiveWithoutYellow = (side, sourceIndex) => {
    const candidates = active[side]
      .map((key) => playerById[side]?.get(key))
      .filter((player) => player && yellowCountFor(side, player) === 0);
    if (!candidates.length) return null;
    return candidates[deterministicIndex(`yellow|${sourceIndex}`, candidates.length)] || candidates[0];
  };
  const eventClockPrefix = (rawEvent, narration) => (
    String(narration ?? '').trimStart().match(/^(\d+(?:\+\d+)?'?)\s*/)?.[1]
    || `${Number(rawEvent?.min) || 0}'`
  );
  const convertSecondYellowToDirectRed = (rawEvent, narration, player, side) => {
    const teamName = side === 'home' ? matchData?.homeName : matchData?.awayName;
    const prefix = eventClockPrefix(rawEvent, narration);
    const nextRaw = cloneRawEvent(rawEvent) || {};
    nextRaw.type = 'red_direct';
    nextRaw.playerId = player?.id ?? null;
    nextRaw.playerName = player?.name || 'Jogador';
    return {
      rawEvent: nextRaw,
      narration: `${prefix} 🟥 EXPULSO! Vermelho direto para ${player?.name || 'Jogador'} (${teamName || ''})`,
      actor: player,
    };
  };
  const convertYellowToSecondYellow = (rawEvent, narration, player, side) => {
    const teamName = side === 'home' ? matchData?.homeName : matchData?.awayName;
    const prefix = eventClockPrefix(rawEvent, narration);
    const nextRaw = cloneRawEvent(rawEvent) || {};
    nextRaw.type = 'red_second_yellow';
    nextRaw.playerId = player?.id ?? null;
    nextRaw.playerName = player?.name || 'Jogador';
    return {
      rawEvent: nextRaw,
      narration: `${prefix} 🟨🟥 SEGUNDO AMARELO! ${player?.name || 'Jogador'} está EXPULSO! (${teamName || ''})`,
      actor: player,
    };
  };

  const resolveScheduledEvent = ({ narration, rawEvent, sourceIndex = 0 } = {}) => {
    const sourceKey = sourceIndex == null ? null : String(sourceIndex);
    if (sourceKey != null && resolvedBySourceIndex.has(sourceKey)) {
      const previous = resolvedBySourceIndex.get(sourceKey);
      const stateSnapshot = liveState.getSnapshot();
      return {
        ...previous,
        duplicate:true,
        activeLineups:stateSnapshot.activeLineups,
        liveState:stateSnapshot,
      };
    }
    const originalNarration = String(narration ?? '');
    let nextRaw = cloneRawEvent(rawEvent);
    let nextNarration = originalNarration;
    const side = getRawActorSide(matchData, nextRaw, nextNarration);
    let resolvedActor = null;
    let actorReplaced = false;

    if (nextRaw?.type === 'sub' && (side === 'home' || side === 'away')) {
      applyStructuredSubstitution(side, nextRaw);
    } else if (PLAYER_EVENT_TYPES.has(nextRaw?.type) && (side === 'home' || side === 'away')) {
      const actor = getRawActor(nextRaw);
      resolvedActor = getPlayer(side, actor);

      if (nextRaw?.type === 'red_second_yellow') {
        const originalIsValid = resolvedActor && isActive(side, actor) && yellowCountFor(side, resolvedActor) > 0;
        if (!originalIsValid) {
          const bookedReplacement = chooseActiveWithYellow(side, sourceIndex);
          if (bookedReplacement) {
            const rewritten = rewriteActor(nextRaw, nextNarration, bookedReplacement);
            nextRaw = rewritten.rawEvent;
            nextNarration = rewritten.narration;
            resolvedActor = bookedReplacement;
            actorReplaced = true;
          } else {
            const replacement = chooseActivePlayer(side, nextRaw, sourceIndex);
            if (replacement) {
              const converted = convertSecondYellowToDirectRed(nextRaw, nextNarration, replacement, side);
              nextRaw = converted.rawEvent;
              nextNarration = converted.narration;
              resolvedActor = converted.actor;
              actorReplaced = true;
            }
          }
        }
      } else if (!isActive(side, actor)) {
        const replacement = nextRaw?.type === 'yellow'
          ? (chooseActiveWithoutYellow(side, sourceIndex) || chooseActivePlayer(side, nextRaw, sourceIndex))
          : chooseActivePlayer(side, nextRaw, sourceIndex);
        if (replacement) {
          const rewritten = rewriteActor(nextRaw, nextNarration, replacement);
          nextRaw = rewritten.rawEvent;
          nextNarration = rewritten.narration;
          resolvedActor = replacement;
          actorReplaced = true;
        }
      }

      if (nextRaw?.type === 'yellow' && resolvedActor) {
        if (yellowCountFor(side, resolvedActor) > 0) {
          const converted = convertYellowToSecondYellow(nextRaw, nextNarration, resolvedActor, side);
          nextRaw = converted.rawEvent;
          nextNarration = converted.narration;
          addYellowFor(side, resolvedActor);
        } else {
          addYellowFor(side, resolvedActor);
        }
      }
      if (RED_TYPES.has(nextRaw?.type)) {
        const finalActor = getRawActor(nextRaw);
        resolvedActor = resolvedActor || getPlayer(side, finalActor);
        if (resolvedActor) removeActive(side, resolvedActor);
      }
    }

    const stateSnapshot = liveState.appendResolvedEvent({
      narration: nextNarration,
      rawEvent: nextRaw,
      nextActiveLineups: getActiveLineups(),
    });

    const resolvedResult = {
      narration: stateSnapshot.events.at(-1) ?? nextNarration,
      rawEvent: stateSnapshot.rawEvents.at(-1) ?? nextRaw,
      side,
      actor: resolvedActor,
      actorReplaced,
      duplicate:false,
      activeLineups: stateSnapshot.activeLineups,
      liveState: stateSnapshot,
    };
    if (sourceKey != null) resolvedBySourceIndex.set(sourceKey, resolvedResult);
    return resolvedResult;
  };

  const registerExternalNarration = (narration) => {
    const text = String(narration ?? '').trim();
    if (!text) return { applied:false, reason:'empty' };
    const stateSnapshot = liveState.appendResolvedEvent({
      narration:text,
      rawEvent:null,
      nextActiveLineups:getActiveLineups(),
    });
    return {
      applied:true,
      rawEvent:stateSnapshot.rawEvents.at(-1) || null,
      narration:stateSnapshot.events.at(-1) ?? text,
      activeLineups:stateSnapshot.activeLineups,
      liveState:stateSnapshot,
    };
  };

  const registerManualSubstitution = ({ record, narration, outgoing, incoming } = {}) => {
    if (userSide !== 'home' && userSide !== 'away') return { applied:false, reason:'identity' };
    const outKey = idKey(outgoing?.id ?? record?.outId);
    const inKey = idKey(incoming?.id ?? record?.inId);
    if (outKey == null || inKey == null || outKey === inKey) return { applied:false, reason:'ids' };
    const at = active[userSide].indexOf(outKey);
    if (at < 0 || active[userSide].includes(inKey) || !playerById[userSide]?.has(inKey)) {
      return { applied:false, reason:'lineup' };
    }

    active[userSide] = active[userSide].map((candidate, index) => index === at ? inKey : candidate);
    const minute = normalizeMinute(record?.min);
    const teamId = userSide === 'home' ? matchData?.homeId : matchData?.awayId;
    const teamName = userSide === 'home' ? matchData?.homeName : matchData?.awayName;
    const structured = {
      min: minute ?? record?.min ?? 0,
      type: 'sub',
      teamId,
      teamName,
      isPlayer: true,
      manual: true,
      changes: [{
        outgoingId: outgoing?.id ?? record?.outId ?? null,
        outgoingName: outgoing?.name ?? record?.out ?? '',
        incomingId: incoming?.id ?? record?.inId ?? null,
        incomingName: incoming?.name ?? record?.in ?? '',
      }],
    };
    const text = String(narration ?? '').trim();
    const stateSnapshot = liveState.appendResolvedEvent({
      narration: text,
      rawEvent: structured,
      nextActiveLineups: getActiveLineups(),
    });
    return {
      applied:true,
      rawEvent:stateSnapshot.rawEvents.at(-1) ?? structured,
      narration:stateSnapshot.events.at(-1) ?? text,
      activeLineups:stateSnapshot.activeLineups,
      liveState:stateSnapshot,
    };
  };

  function getActiveLineups() {
    return { home:[...active.home], away:[...active.away] };
  }

  const getResolvedMatchData = () => liveState.getResolvedMatchData();
  const getLiveState = () => liveState.getSnapshot();
  const setLiveStatus = (status, minute = null) => liveState.setStatus(status, minute);

  return {
    get userSide() { return userSide; },
    getActiveLineups,
    getResolvedMatchData,
    getLiveState,
    setLiveStatus,
    resolveScheduledEvent,
    registerExternalNarration,
    registerManualSubstitution,
  };
}

export const isLiveMatchPlayerActive = (activeLineups = {}, side, playerId) => {
  const key = idKey(playerId);
  if (key == null || (side !== 'home' && side !== 'away')) return false;
  return (Array.isArray(activeLineups?.[side]) ? activeLineups[side] : []).some((id) => idKey(id) === key);
};

export const hasLivePlayerId = hasId;

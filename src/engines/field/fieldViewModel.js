import { getPlayerAvailability, getUpcomingRound } from '../core/playerStatus.js';

export const FIELD_LAYOUTS = Object.freeze({
  '4-4-2': [
    { role:'GOL', x:50, y:126 },
    { role:'LD', x:8, y:102 }, { role:'ZAG', x:31, y:100 }, { role:'ZAG', x:69, y:100 }, { role:'LE', x:92, y:102 },
    { role:'PD', x:8, y:73 }, { role:'VOL', x:33, y:72 }, { role:'VOL', x:67, y:72 }, { role:'PE', x:92, y:73 },
    { role:'CA', x:34, y:36 }, { role:'CA', x:66, y:36 },
  ],
  '4-3-3': [
    { role:'GOL', x:50, y:126 },
    { role:'LD', x:8, y:102 }, { role:'ZAG', x:31, y:100 }, { role:'ZAG', x:69, y:100 }, { role:'LE', x:92, y:102 },
    { role:'VOL', x:20, y:72 }, { role:'MC', x:50, y:70 }, { role:'MEI', x:80, y:72 },
    { role:'PD', x:14, y:32 }, { role:'CA', x:50, y:28 }, { role:'PE', x:86, y:32 },
  ],
  '4-2-3-1': [
    { role:'GOL', x:50, y:126 },
    { role:'LD', x:8, y:102 }, { role:'ZAG', x:31, y:100 }, { role:'ZAG', x:69, y:100 }, { role:'LE', x:92, y:102 },
    { role:'VOL', x:33, y:78 }, { role:'VOL', x:67, y:78 },
    { role:'PD', x:12, y:55 }, { role:'MEI', x:50, y:53 }, { role:'PE', x:88, y:55 },
    { role:'CA', x:50, y:26 },
  ],
  '3-5-2': [
    { role:'GOL', x:50, y:126 },
    { role:'ZAG', x:22, y:102 }, { role:'ZAG', x:50, y:100 }, { role:'ZAG', x:78, y:102 },
    { role:'LD', x:5, y:74 }, { role:'VOL', x:28, y:73 }, { role:'MC', x:50, y:72 }, { role:'VOL', x:72, y:73 }, { role:'LE', x:95, y:74 },
    { role:'CA', x:33, y:36 }, { role:'CA', x:67, y:36 },
  ],
  '3-4-3': [
    { role:'GOL', x:50, y:126 },
    { role:'ZAG', x:22, y:102 }, { role:'ZAG', x:50, y:100 }, { role:'ZAG', x:78, y:102 },
    { role:'LD', x:8, y:74 }, { role:'VOL', x:34, y:72 }, { role:'VOL', x:66, y:72 }, { role:'LE', x:92, y:74 },
    { role:'PD', x:16, y:34 }, { role:'CA', x:50, y:28 }, { role:'PE', x:84, y:34 },
  ],
  '5-3-2': [
    { role:'GOL', x:50, y:126 },
    { role:'LD', x:5, y:104 }, { role:'ZAG', x:24, y:101 }, { role:'ZAG', x:50, y:100 }, { role:'ZAG', x:76, y:101 }, { role:'LE', x:95, y:104 },
    { role:'VOL', x:22, y:72 }, { role:'MC', x:50, y:70 }, { role:'VOL', x:78, y:72 },
    { role:'CA', x:34, y:36 }, { role:'CA', x:66, y:36 },
  ],
  '4-1-4-1': [
    { role:'GOL', x:50, y:126 },
    { role:'LD', x:8, y:102 }, { role:'ZAG', x:31, y:100 }, { role:'ZAG', x:69, y:100 }, { role:'LE', x:92, y:102 },
    { role:'VOL', x:50, y:80 },
    { role:'PD', x:10, y:57 }, { role:'MC', x:36, y:58 }, { role:'MC', x:64, y:58 }, { role:'PE', x:90, y:57 },
    { role:'CA', x:50, y:27 },
  ],
  '4-5-1': [
    { role:'GOL', x:50, y:126 },
    { role:'LD', x:8, y:102 }, { role:'ZAG', x:31, y:100 }, { role:'ZAG', x:69, y:100 }, { role:'LE', x:92, y:102 },
    { role:'PD', x:8, y:68 }, { role:'VOL', x:30, y:72 }, { role:'MC', x:50, y:68 }, { role:'VOL', x:70, y:72 }, { role:'PE', x:92, y:68 },
    { role:'CA', x:50, y:28 },
  ],
});

export const POSITION_LEGEND = Object.freeze([
  { pos:'GOL', label:'Goleiro', color:'#c8920f' },
  { pos:'ZAG', label:'Zagueiro', color:'#1d4ed8' },
  { pos:'LD', label:'Lat. Dir.', color:'#0369a1' },
  { pos:'LE', label:'Lat. Esq.', color:'#0369a1' },
  { pos:'VOL', label:'Volante', color:'#14532d' },
  { pos:'MC', label:'Meio Cent.', color:'#15803d' },
  { pos:'MEI', label:'Meia Of.', color:'#166534' },
  { pos:'PD', label:'Ponta Dir.', color:'#9a3412' },
  { pos:'PE', label:'Ponta Esq.', color:'#9a3412' },
  { pos:'CA', label:'Centroav.', color:'#b91c1c' },
]);

const number = (value) => Number(value) || 0;

export const getFieldLayout = (formation) => FIELD_LAYOUTS[formation] || FIELD_LAYOUTS['4-4-2'];
export function getFieldPlayerName(player, maxLength = 8) {
  const lastName = String(player?.name || 'Jogador').trim().split(/\s+/).filter(Boolean).pop() || 'Jogador';
  return lastName.slice(0, maxLength);
}

export function assignStartersToField(starters = [], formation = '4-4-2') {
  const layout = getFieldLayout(formation);
  const remaining = [...starters];

  return layout.map((slot) => {
    const exactIndex = remaining.findIndex((player) => (player.adaptedPosition || player.position) === slot.role);
    const playerIndex = exactIndex >= 0 ? exactIndex : (remaining.length ? 0 : -1);
    if (playerIndex < 0) return null;
    const [player] = remaining.splice(playerIndex, 1);
    return { ...slot, player, improvised: exactIndex < 0 };
  }).filter(Boolean);
}

export function buildFieldViewModel({ starters = [], formation = '4-4-2', teamOvr = 0, gameData = {} } = {}) {
  const currentRound = getUpcomingRound(gameData);
  return {
    formation: FIELD_LAYOUTS[formation] ? formation : '4-4-2',
    requestedFormation: formation,
    teamOvr: number(teamOvr),
    startersCount: starters.length,
    currentRound,
    markers: assignStartersToField(starters, formation).map((marker, index) => ({
      ...marker,
      index,
      status: getPlayerAvailability(marker.player, currentRound),
      displayName: getFieldPlayerName(marker.player),
    })),
  };
}

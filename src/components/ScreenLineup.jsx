import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../theme.js';
import {
  autoLineupState,
  buildLineupViewModel,
  changeFormationState,
  getAvailableForRole,
  selectPlayerForRoleState,
  toggleStarterState,
} from '../engines/lineup/lineupService.js';
import LineupHeader from './lineup/LineupHeader.jsx';
import LineupField from './lineup/LineupField.jsx';
import LineupRoster from './lineup/LineupRoster.jsx';
import { PlayerPickerDialog, ShirtEditor } from './lineup/LineupDialogs.jsx';

const ScreenLineup = ({
  gameData,
  setGameData,
  showToast,
  updateShirt,
  saveGame,
  setIsDirtyLineup,
}) => {
  const C = THEME;
  const [pickerSlot, setPickerSlot] = React.useState(null);
  const [shirtEdit, setShirtEdit] = React.useState(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const pressTimer = React.useRef(null);
  const suppressNextClick = React.useRef(false);

  const vm = React.useMemo(() => buildLineupViewModel(gameData), [gameData]);
  const availableForPicker = React.useMemo(
    () => getAvailableForRole(vm.bench, pickerSlot?.role),
    [vm.bench, pickerSlot?.role]
  );

  const markDirty = React.useCallback(() => {
    setIsDirty(true);
    setIsDirtyLineup?.(true);
  }, [setIsDirtyLineup]);

  const applyResult = React.useCallback((result, successMessage) => {
    if (result?.error) {
      showToast(result.error, 'warning');
      return false;
    }
    if (result?.gameData) setGameData(result.gameData);
    markDirty();
    if (successMessage) showToast(successMessage, 'success');
    return true;
  }, [markDirty, setGameData, showToast]);

  const handleFormation = React.useCallback((formation) => {
    setGameData(prev => changeFormationState(prev, formation));
    markDirty();
  }, [markDirty, setGameData]);

  const handleToggle = React.useCallback((player) => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    applyResult(toggleStarterState(gameData, player.id));
  }, [applyResult, gameData]);

  const handleAutoLineup = React.useCallback(() => {
    const result = autoLineupState(gameData);
    setGameData(result.gameData);
    markDirty();
    if (result.starterCount < 11) {
      showToast(`⚠️ Só há ${result.starterCount} jogadores disponíveis para escalar.`, 'warning');
    } else if (result.improvisedCount > 0) {
      showToast(`Escalação automática aplicada com ${result.improvisedCount} improviso(s).`, 'warning');
    } else {
      showToast('Escalação automática aplicada! ✅', 'success');
    }
  }, [gameData, markDirty, setGameData, showToast]);

  const handlePickerSelect = React.useCallback((player) => {
    const result = selectPlayerForRoleState(gameData, player.id, pickerSlot?.role);
    if (applyResult(result)) setPickerSlot(null);
  }, [applyResult, gameData, pickerSlot?.role]);

  const handlePressStart = React.useCallback((player) => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      suppressNextClick.current = true;
      setShirtEdit({ playerId:player.id, value:String(player.shirt ?? '') });
      setPickerSlot(null);
    }, 500);
  }, []);

  const handlePressEnd = React.useCallback(() => {
    clearTimeout(pressTimer.current);
  }, []);

  React.useEffect(() => () => clearTimeout(pressTimer.current), []);

  const handleSaveShirt = React.useCallback(() => {
    if (!shirtEdit) return;
    const number = Number(shirtEdit.value);
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      showToast('Use um número de camisa entre 1 e 99.', 'warning');
      return;
    }
    updateShirt(shirtEdit.playerId, number);
    setShirtEdit(null);
    markDirty();
  }, [markDirty, shirtEdit, showToast, updateShirt]);

  const handleSave = React.useCallback(() => {
    saveGame();
    setIsDirty(false);
    setIsDirtyLineup?.(false);
  }, [saveGame, setIsDirtyLineup]);

  return (
    <Box sx={{ bgcolor:C.bg, minHeight:'100vh', pb:12 }}>
      <LineupHeader
        club={vm.club}
        currentRound={vm.currentRound}
        avgOvr={vm.avgOvr}
        startersCount={vm.starters.length}
        energyPenaltyTotal={vm.energyPenaltyTotal}
        formation={vm.formation}
        isDirty={isDirty}
        onFormation={handleFormation}
        onAuto={handleAutoLineup}
        onSave={handleSave}
        C={C}
      />

      <LineupField
        slotPlayers={vm.slotPlayers}
        currentRound={vm.currentRound}
        onEmptySlot={setPickerSlot}
        onPlayer={handleToggle}
        onPressStart={handlePressStart}
        onPressEnd={handlePressEnd}
        C={C}
      />

      <LineupRoster
        bench={vm.bench}
        unavailable={vm.unavailable}
        currentRound={vm.currentRound}
        onToggle={handleToggle}
        C={C}
      />

      <Box sx={{ position:'sticky', bottom:62, left:0, right:0, height:32, background:`linear-gradient(transparent,${C.bg}F2)`, pointerEvents:'none' }}/>

      <ShirtEditor edit={shirtEdit} setEdit={setShirtEdit} onSave={handleSaveShirt} C={C}/>
      <PlayerPickerDialog
        pickerSlot={pickerSlot}
        setPickerSlot={setPickerSlot}
        available={availableForPicker}
        currentRound={vm.currentRound}
        onSelect={handlePickerSelect}
        C={C}
      />
    </Box>
  );
};

export default ScreenLineup;

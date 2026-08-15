import React from 'react';
import BottomNavigationBar from './navigation/BottomNavigationBar.jsx';
import TeamNavigationDialog from './navigation/TeamNavigationDialog.jsx';
import ClubNavigationDialog from './navigation/ClubNavigationDialog.jsx';
import OptionsNavigationDialog from './navigation/OptionsNavigationDialog.jsx';
import {
  NAV_MENU,
  buildBottomNavItems,
  buildBottomNavViewModel,
  getBackupFilename,
} from '../engines/navigation/bottomNavViewModel.js';

const BottomNav = ({ screen, setScreen, simulating, saveGame, gameData }) => {
  const [openMenu, setOpenMenu] = React.useState(null);
  const viewModel = React.useMemo(() => buildBottomNavViewModel(gameData), [gameData]);
  const items = React.useMemo(() => buildBottomNavItems({
    screen,
    openMenu,
    simulating,
    badges: viewModel.badges,
  }), [screen, openMenu, simulating, viewModel.badges]);

  const closeMenu = React.useCallback(() => setOpenMenu(null), []);

  const navigate = React.useCallback((target) => {
    closeMenu();
    setScreen(target);
  }, [closeMenu, setScreen]);

  const handleItemClick = React.useCallback((item) => {
    if (item.disabled) return;
    if (item.menu) {
      setOpenMenu((current) => current === item.menu ? null : item.menu);
      return;
    }
    navigate(item.target);
  }, [navigate]);

  const handleSave = React.useCallback(() => {
    saveGame?.();
    closeMenu();
  }, [saveGame, closeMenu]);

  const handleBackup = React.useCallback(() => {
    if (!gameData) return;
    let url = null;
    try {
      const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = getBackupFilename(gameData);
      anchor.click();
    } catch {
      alert('Erro ao exportar backup.');
    } finally {
      if (url) URL.revokeObjectURL(url);
      closeMenu();
    }
  }, [gameData, closeMenu]);

  return (
    <>
      <BottomNavigationBar items={items} onItemClick={handleItemClick} />
      <TeamNavigationDialog
        open={openMenu === NAV_MENU.TEAM}
        onClose={closeMenu}
        onNavigate={navigate}
        squad={viewModel.squad}
        academy={viewModel.academy}
      />
      <ClubNavigationDialog
        open={openMenu === NAV_MENU.CLUB}
        onClose={closeMenu}
        onNavigate={navigate}
        club={viewModel.club}
        unread={viewModel.unread}
      />
      <OptionsNavigationDialog
        open={openMenu === NAV_MENU.OPTIONS}
        onClose={closeMenu}
        onNavigate={navigate}
        onSave={handleSave}
        onBackup={handleBackup}
      />
    </>
  );
};

export default BottomNav;

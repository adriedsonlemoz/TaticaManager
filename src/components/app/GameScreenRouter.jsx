import React from 'react';
import MenuPrincipal from '../MenuPrincipal.jsx';
import ScreenBoot from '../ScreenBoot.jsx';
import ScreenSetup from '../ScreenSetup.jsx';
import ScreenLineup from '../ScreenLineup.jsx';
import ScreenSquad from '../ScreenSquad.jsx';
import ScreenTable from '../ScreenTable.jsx';
import ScreenMatches from '../ScreenMatches.jsx';
import ScreenCareer from '../ScreenCareer.jsx';
import ScreenMarket from '../ScreenMarket.jsx';
import ScreenStadium from '../ScreenStadium.jsx';
import ScreenFinances from '../ScreenFinances.jsx';
import ScreenAbout from '../ScreenAbout.jsx';
import ScreenNextMatch from '../ScreenNextMatch.jsx';
import ScreenMatchResult from '../ScreenMatchResult.jsx';
import ScreenMedical from '../ScreenMedical.jsx';
import ScreenCopas from '../ScreenCopas.jsx';
import ScreenInbox from '../ScreenInbox.jsx';
import ScreenAcademy from '../ScreenAcademy.jsx';
import ScreenGameOver from '../ScreenGameOver.jsx';
import ScreenSeasonEnd from '../ScreenSeasonEnd.jsx';
import ScreenNews from '../ScreenNews.jsx';

export default function GameScreenRouter({ controller }) {
  const {
    screen, setScreen, gameData, setGameData, setupData, setSetupData,
    persistence, handleLoadGame, setDeleteSaveModal, startNewGame,
    sharedProps, updateShirt, handleNav,
  } = controller;

  switch (screen) {
    case 'boot':
      return <ScreenBoot savesList={persistence.savesList} loadSpecificGame={handleLoadGame} setScreen={setScreen} setDeleteSaveModal={setDeleteSaveModal} />;
    case 'setup':
      return <ScreenSetup setupData={setupData} setSetupData={setSetupData} setScreen={setScreen} savesList={persistence.savesList} handleStartNewGame={startNewGame} />;
    case 'home': return <MenuPrincipal {...sharedProps} />;
    case 'lineup': return <ScreenLineup {...sharedProps} updateShirt={(id, shirt) => updateShirt(id, shirt, 'Camisa definida!')} />;
    case 'squad': return <ScreenSquad {...sharedProps} />;
    case 'medical': return <ScreenMedical {...sharedProps} />;
    case 'table': return <ScreenTable {...sharedProps} />;
    case 'match_result': return <ScreenMatchResult {...sharedProps} />;
    case 'next_match': return <ScreenNextMatch {...sharedProps} />;
    case 'season_end': return <ScreenSeasonEnd {...sharedProps} />;
    case 'matches': return <ScreenMatches {...sharedProps} />;
    case 'finances': return <ScreenFinances {...sharedProps} />;
    case 'market': return <ScreenMarket {...sharedProps} />;
    case 'stadium': return <ScreenStadium {...sharedProps} />;
    case 'copas': return <ScreenCopas {...sharedProps} />;
    case 'academy': return <ScreenAcademy {...sharedProps} />;
    case 'inbox': return <ScreenInbox {...sharedProps} />;
    case 'career': return <ScreenCareer {...sharedProps} />;
    case 'news': return <ScreenNews {...sharedProps} />;
    case 'about': return <ScreenAbout />;
    case 'game_over':
      return <ScreenGameOver gameData={gameData} setScreen={handleNav} setGameData={setGameData} persistence={persistence} />;
    default:
      return null;
  }
}

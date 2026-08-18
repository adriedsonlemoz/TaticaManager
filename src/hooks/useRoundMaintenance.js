import React from 'react';
import { buildRoundMaintenance } from '../engines/app/gameControllerService.js';

export default function useRoundMaintenance({ gameData, setGameData, showToast, formatMoney, persistGameState = null }) {
  const prevRoundRef = React.useRef(null);

  React.useEffect(() => {
    if (!gameData) {
      prevRoundRef.current = null;
      return;
    }
    const currentRound = Number(gameData.round) || 0;
    const previousRound = prevRoundRef.current;
    prevRoundRef.current = currentRound;
    if (previousRound === null || currentRound <= previousRound) return;

    const result = buildRoundMaintenance(gameData, { formatMoney, allowTransferOffers: false });
    if (result.changed) {
      setGameData(result.state);
      if (typeof persistGameState === 'function') void persistGameState(result.state);
    }
    result.toasts.forEach(effect => {
      setTimeout(() => showToast(effect.message, effect.severity), effect.delay || 0);
    });
  }, [gameData?.round]);
}

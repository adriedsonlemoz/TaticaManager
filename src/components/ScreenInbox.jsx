import React from 'react';
import { THEME } from '../theme.js';
import { CpuAI } from '../engines/engine_cpu_ai.js';
import InboxMailbox from './inbox/InboxMailbox.jsx';
import InboxMessageReader from './inbox/InboxMessageReader.jsx';
import {
  acceptManagerOfferState,
  buildGeneratedMessages,
  combineAndSortMessages,
  countUnreadByType,
  emptyTrashState,
  filterMessages,
  isMessageRead,
  markMessageReadState,
  moveMessageToTrashState,
  partitionMessages,
  permanentlyDeleteMessageState,
  restoreMessageState,
} from '../engines/inbox/inboxService.js';

const ScreenInbox = ({ gameData, setGameData, setScreen, formatMoney, showToast, sellPlayer }) => {
  const [tab, setTab] = React.useState('inbox');
  const [selected, setSelected] = React.useState(null);
  const [confirmDialog, setConfirmDialog] = React.useState(null);
  const [search, setSearch] = React.useState('');

  const readIds = React.useMemo(() => new Set(gameData.readMsgIds || []), [gameData.readMsgIds]);
  const trashIds = React.useMemo(() => new Set(gameData.trashMsgIds || []), [gameData.trashMsgIds]);
  const erasedIds = React.useMemo(() => new Set(gameData.erasedMsgIds || []), [gameData.erasedMsgIds]);

  const generatedMessages = React.useMemo(
    () => buildGeneratedMessages(gameData, formatMoney),
    [gameData.round, gameData.serie, gameData.club, gameData.players, gameData.table, formatMoney],
  );

  const allMessages = React.useMemo(
    () => combineAndSortMessages(gameData.inbox, generatedMessages, readIds),
    [gameData.inbox, generatedMessages, readIds],
  );

  const { inboxMessages, trashMessages } = React.useMemo(
    () => partitionMessages(allMessages, trashIds, erasedIds),
    [allMessages, trashIds, erasedIds],
  );

  const unreadCount = React.useMemo(
    () => inboxMessages.filter(message => !isMessageRead(message, readIds)).length,
    [inboxMessages, readIds],
  );

  const typeCounts = React.useMemo(
    () => countUnreadByType(inboxMessages, readIds),
    [inboxMessages, readIds],
  );

  const visibleMessages = React.useMemo(
    () => filterMessages(tab === 'inbox' ? inboxMessages : trashMessages, search),
    [tab, inboxMessages, trashMessages, search],
  );

  const handleMarkRead = React.useCallback((id) => {
    setGameData(prev => markMessageReadState(prev, id));
  }, [setGameData]);

  const handleOpenMessage = React.useCallback((message) => {
    setSelected(message);
    handleMarkRead(message.id);
  }, [handleMarkRead]);

  const handleTrash = React.useCallback((id, toast = true) => {
    setGameData(prev => moveMessageToTrashState(prev, id));
    setSelected(null);
    if (toast) showToast('Mensagem enviada para a Lixeira.', 'info');
  }, [setGameData, showToast]);

  const handleRestore = React.useCallback((id) => {
    setGameData(prev => restoreMessageState(prev, id));
    setSelected(null);
    showToast('Mensagem restaurada.', 'success');
  }, [setGameData, showToast]);

  const handlePermanentDelete = React.useCallback((payload) => {
    setGameData(prev => permanentlyDeleteMessageState(prev, payload));
    setConfirmDialog(null);
    setSelected(null);
    showToast('Mensagem excluída permanentemente.', 'success');
  }, [setGameData, showToast]);

  const handleEmptyTrash = React.useCallback(() => {
    setGameData(prev => emptyTrashState(prev, trashMessages));
    setConfirmDialog(null);
    setSelected(null);
    showToast('Lixeira esvaziada.', 'success');
  }, [setGameData, showToast, trashMessages]);

  const handleRejectAction = React.useCallback((message) => {
    handleTrash(message.id, false);
    showToast(message.actionData?.type === 'managerOffer' ? 'Proposta de clube recusada.' : 'Proposta recusada.', 'info');
  }, [handleTrash, showToast]);

  const handleTakeAction = React.useCallback((message) => {
    const action = message.actionData;
    if (!action) return;

    if (action.type === 'link') {
      setScreen(action.target);
      return;
    }

    if (action.type === 'sell') {
      const player = gameData.players.find(item => item.id === action.player?.id);
      if (!player) {
        showToast('Esta proposta expirou ou o jogador já saiu do clube.', 'error');
        handleTrash(message.id);
        return;
      }
      sellPlayer(player, action.value);
      setGameData(prev => moveMessageToTrashState(prev, message.id));
      setSelected(null);
      showToast(`✅ NEGÓCIO FECHADO! ${player.name} vendido por ${formatMoney(action.value)}.`, 'success');
      return;
    }

    if (action.type === 'managerOffer') {
      setGameData(prev => acceptManagerOfferState(prev, message));
      setSelected(null);
      showToast(`✅ Proposta aceita! Você assumirá o ${action.offeringClub.name} na próxima temporada.`, 'success');
      return;
    }

    if (action.type === 'renew_contract') {
      const result = CpuAI.applyContractRenewal(gameData.players, gameData.club, action.playerId, action.cost || 0);
      if (result.error) {
        showToast(result.error, 'error');
        return;
      }
      const renewed = result.players.find(player => player.id === action.playerId);
      setGameData(prev => ({
        ...prev,
        players: result.players,
        club: result.club,
        trashMsgIds: [...new Set([...(prev.trashMsgIds || []), message.id])],
      }));
      setSelected(null);
      showToast(`✅ Contrato de ${renewed?.name || 'jogador'} renovado por mais 2 temporadas.`, 'success');
    }
  }, [formatMoney, gameData.club, gameData.players, handleTrash, sellPlayer, setGameData, setScreen, showToast]);

  if (selected) {
    const action = selected.actionData;
    const livePlayer = action?.type === 'sell'
      ? gameData.players.find(player => player.id === action.player?.id)
      : null;

    return (
      <InboxMessageReader
        message={selected}
        isInTrash={trashIds.has(selected.id)}
        livePlayer={livePlayer}
        formatMoney={formatMoney}
        theme={THEME}
        onBack={() => setSelected(null)}
        onRestore={handleRestore}
        onTrash={handleTrash}
        onTakeAction={handleTakeAction}
        onRejectAction={handleRejectAction}
      />
    );
  }

  return (
    <InboxMailbox
      clubName={gameData.club?.name}
      tab={tab}
      search={search}
      messages={visibleMessages}
      unreadCount={unreadCount}
      trashCount={trashMessages.length}
      typeCounts={typeCounts}
      readIds={readIds}
      confirmDialog={confirmDialog}
      theme={THEME}
      onTabChange={(nextTab) => { setTab(nextTab); setSearch(''); }}
      onSearchChange={setSearch}
      onOpenMessage={handleOpenMessage}
      onRestore={handleRestore}
      onRequestDelete={(message) => setConfirmDialog({ type: 'single', id: message.id, isDynamic: message.isDynamic })}
      onRequestEmptyTrash={() => setConfirmDialog({ type: 'emptyTrash' })}
      onCloseConfirm={() => setConfirmDialog(null)}
      onConfirmDelete={() => {
        if (confirmDialog?.type === 'emptyTrash') handleEmptyTrash();
        else if (confirmDialog) handlePermanentDelete(confirmDialog);
      }}
    />
  );
};

export default ScreenInbox;

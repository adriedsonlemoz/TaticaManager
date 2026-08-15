const addUniqueId = (ids = [], id) => id == null ? [...ids] : [...new Set([...ids, id])];

export const findPendingManagerOffer = (gameData = {}) => {
  const trashIds = new Set(gameData.trashMsgIds || []);
  return (gameData.inbox || []).find(message =>
    message?.actionData?.type === 'managerOffer' && !trashIds.has(message.id)
  ) || null;
};

export const acceptManagerOfferState = (state, message) => {
  const action = message?.actionData;
  if (!action?.offeringClub) return state;
  return {
    ...state,
    pendingManagerTransfer: {
      accepted: true,
      offeringClub: action.offeringClub,
      offeredSalary: action.offeredSalary,
      acceptedAtRound: state.round,
    },
    trashMsgIds: addUniqueId(state.trashMsgIds, message.id),
  };
};

export const declineManagerOfferState = (state, messageId) => ({
  ...state,
  trashMsgIds: addUniqueId(state.trashMsgIds, messageId),
});

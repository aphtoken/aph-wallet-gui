/* eslint-disable no-use-before-define */
export {
  clearActiveRecentTransaction,
  clearActiveTransactionHash,
  clearActiveTransactionToken,
  clearRecentTransactions,
  setActiveRecentTransaction,
  setActiveTransactionHash,
  setActiveTransactionToken,
  setHoldings,
  setRecentTransactions,
  setShowAddTokenModal,
  setShowSendAddressModal,
  setStatsToken,
};

function clearActiveRecentTransaction(state) {
  state.activeRecentTransaction = null;
}

function clearActiveTransactionHash(state) {
  state.activeTransactionHash = null;
}

function clearActiveTransactionToken(state) {
  state.activeTransactionToken = null;
}

function clearRecentTransactions(state) {
  state.recentTransactions = [];
}

function setActiveRecentTransaction(state, transaction) {
  state.activeRecentTransaction = transaction;
}

function setActiveTransactionHash(state, hash) {
  state.activeTransactionHash = hash;
  state.showPriceTile = false;
}

function setActiveTransactionToken(state, token) {
  state.activeTransactionToken = token;
  state.showPriceTile = false;
}

function setHoldings(state, holdings) {
  state.holdings = holdings;

  if (!state.statsToken && holdings.length) {
    state.statsToken = holdings[0];
  }
}

function setRecentTransactions(state, transactions) {
  state.recentTransactions = transactions;
}

function setShowAddTokenModal(state, value) {
  state.showAddTokenModal = value;
}

function setShowSendAddressModal(state, value) {
  state.showSendAddressModal = value;
}

function setStatsToken(state, token) {
  state.statsToken = token;
  state.showPriceTile = true;
}

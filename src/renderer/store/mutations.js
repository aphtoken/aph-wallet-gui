/* eslint-disable no-use-before-define */
export {
  clearActiveTransaction,
  clearActiveTransactionToken,
  clearRecentTransactions,
  setActiveTransaction,
  setActiveTransactionToken,
  setHoldings,
  setPortfolio,
  setRecentTransactions,
  setShowAddTokenModal,
  setShowSendAddressModal,
  setStatsToken,
};

function clearActiveTransaction(state) {
  state.activeTransactionHash = null;
  state.showPriceTile = true;
}

function clearActiveTransactionToken(state) {
  state.activeTransactionToken = null;
}

function clearRecentTransactions(state) {
  state.recentTransactions = [];
}

function setActiveTransaction(state, transaction) {
  state.activeTransaction = transaction;
  state.showPriceTile = false;
  this.dispatch('fetchActiveTransactionDetails');
}

function setActiveTransactionToken(state, token) {
  state.activeTransactionToken = token;
  state.showPriceTile = false;
  this.dispatch('fetchActiveTransactionDetails');
}

function setHoldings(state, holdings) {
  state.holdings = holdings;

  if (!state.statsToken && holdings.length) {
    state.statsToken = holdings[0];
  }
}

function setPortfolio(state, data) {
  state.portfolio = data;
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

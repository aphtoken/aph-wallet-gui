/* eslint-disable no-use-before-define */
export {
  clearActiveTransaction,
  clearRecentTransactions,
  clearSearchTransactions,
  setActiveTransaction,
  setCurrency,
  setCurrencySymbol,
  setHoldings,
  setPortfolio,
  setRecentTransactions,
  setSearchTransactionFromDate,
  setSearchTransactionToDate,
  setSearchTransactions,
  setShowAddTokenModal,
  setShowAddContactModal,
  setShowSendAddressModal,
  setStatsToken,
};

function clearActiveTransaction(state) {
  state.activeTransactionHash = null;
  state.showPriceTile = true;
}

function clearRecentTransactions(state) {
  state.recentTransactions = [];
}

function clearSearchTransactions(state) {
  state.searchTransactions = [];
}

function setActiveTransaction(state, transaction) {
  state.activeTransaction = transaction;
  state.showPriceTile = false;
}

function setCurrency(state, currency) {
  state.currency = currency;
}

function setCurrencySymbol(state, currencySymbol) {
  state.currencySymbol = currencySymbol;
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

function setSearchTransactionFromDate(state, fromDate) {
  state.searchTransactionFromDate = fromDate;
}

function setSearchTransactionToDate(state, toDate) {
  state.searchTransactionToDate = toDate;
}

function setSearchTransactions(state, transactions) {
  state.searchTransactions = transactions;
}

function setShowAddTokenModal(state, value) {
  state.showAddTokenModal = value;
}

function setShowAddContactModal(state, value) {
  state.showAddContactModal = value;
}

function setShowSendAddressModal(state, value) {
  state.showSendAddressModal = value;
}

function setStatsToken(state, token) {
  state.statsToken = token;
  state.showPriceTile = true;
}

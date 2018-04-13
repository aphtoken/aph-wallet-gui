/* eslint-disable no-use-before-define */
import Vue from 'vue';
import lockr from 'lockr';

import { requests } from '../constants';
import alerts from '../services/alerts';

export {
  clearActiveTransaction,
  clearRecentTransactions,
  clearSearchTransactions,
  endRequest,
  failRequest,
  setActiveTransaction,
  setContacts,
  setCurrency,
  setCurrencySymbol,
  setCurrentNetwork,
  setCurrentWallet,
  setHoldings,
  setPortfolio,
  setRecentTransactions,
  setSearchTransactionFromDate,
  setSearchTransactionToDate,
  setSearchTransactions,
  setShowAddContactModal,
  setShowAddTokenModal,
  setShowEditContactModal,
  setShowImportAWalletModal,
  setShowLoginToWalletModal,
  setShowSendAddressModal,
  setStatsToken,
  setWallets,
  startRequest,
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

function endRequest(state, payload) {
  updateRequest(state, payload, requests.SUCCESS);
}

function failRequest(state, payload) {
  updateRequest(state, payload, requests.FAILED);
}

function setActiveTransaction(state, transaction) {
  state.activeTransaction = transaction;
  state.showPriceTile = false;
}

function setContacts(state, contacts) {
  state.contacts = contacts;
}

function setCurrency(state, currency) {
  state.currency = currency;
}

function setCurrencySymbol(state, currencySymbol) {
  state.currencySymbol = currencySymbol;
}

function setCurrentWallet(state, currentWallet) {
  state.holdings = [];
  state.statsToken = null;
  state.portfolio = {};
  state.recentTransactions = [];

  state.currentWallet = currentWallet;
}
function setCurrentNetwork(state, network) {
  if (state.currentNetwork
      && state.currentNetwork.net === network.net) {
    return;
  }

  if (state.currentNetwork) {
    clearLocalNetworkState(state, network);
  }

  state.currentNetwork = network;
}

function setHoldings(state, holdings) {
  if (holdings && holdings.length > 0) {
    state.holdings = holdings;
  }

  if (!state.statsToken && state.holdings.length) {
    state.statsToken = state.holdings[0];
  }

  if (!state.currentWallet || !state.currentNetwork) {
    return;
  }

  const holdingsStorageKey = `aph.holdings.${state.currentWallet.address}.${state.currentNetwork.net}`;
  lockr.set(holdingsStorageKey, state.holdings);
}

function setPortfolio(state, data) {
  if (data) {
    state.portfolio = data;
  }

  if (!state.currentWallet || !state.currentNetwork) {
    return;
  }

  const portfolioStorageKey = `aph.portfolio.${state.currentWallet.address}.${state.currentNetwork.net}`;
  lockr.set(portfolioStorageKey, state.portfolio);
}

function setRecentTransactions(state, transactions) {
  const existingIsEmpty = !state.recentTransactions || state.recentTransactions.length === 0;
  _.sortBy(transactions, 'block_index').forEach((t) => {
    const existingTransaction = _.find(state.recentTransactions, (o) => {
      return o.hash === t.hash && o.symbol === t.symbol;
    });
    if (existingTransaction) {
      return;
    }
    state.recentTransactions.unshift(t);
    if (existingIsEmpty === false) {
      alerts.success(`New Transaction Found. TX: ${t.hash}`);
    }
  });

  if (!state.currentWallet || !state.currentNetwork) {
    return;
  }

  const transactionsStorageKey = `aph.transactions.${state.currentWallet.address}.${state.currentNetwork.net}`;
  lockr.set(transactionsStorageKey, state.recentTransactions);
}

function clearLocalNetworkState(state, newNetwork) {
  state.holdings = [];
  state.statsToken = null;
  state.portfolio = {};
  state.recentTransactions = [];

  const holdingsStorageKey = `aph.holdings.${state.currentWallet.address}.${newNetwork.net}`;
  lockr.set(holdingsStorageKey, null);

  const portfolioStorageKey = `aph.portfolio.${state.currentWallet.address}.${newNetwork.net}`;
  lockr.set(portfolioStorageKey, null);

  const transactionsStorageKey = `aph.transactions.${state.currentWallet.address}.${newNetwork.net}`;
  lockr.set(transactionsStorageKey, null);
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

function setShowAddContactModal(state, value) {
  state.showAddContactModal = value;
  state.currentEditContact = null;
}

function setShowAddTokenModal(state, value) {
  state.showAddTokenModal = value;
}

function setShowEditContactModal(state, contact) {
  state.showAddContactModal = true;
  state.currentEditContact = contact;
}

function setShowSendAddressModal(state, value) {
  state.showSendAddressModal = value;
}

function setShowLoginToWalletModal(state, wallet) {
  const show = wallet !== null;
  state.showLoginToWalletModal = show;
  state.currentLoginToWallet = wallet;
}
function setShowImportAWalletModal(state, value) {
  state.showImportAWalletModal = value;
}

function setStatsToken(state, token) {
  state.statsToken = token;
  state.showPriceTile = true;
}

function setWallets(state, wallets) {
  state.wallets = wallets;
}

function startRequest(state, payload) {
  updateRequest(state, payload, requests.PENDING);
}

function updateRequest(state, { identifier, message }, status) {
  Vue.set(state.requests, identifier, { status, message });
}

/* eslint-disable no-use-before-define */
// import Vue from 'vue';
// import { store } from './index';

export {
  clearActiveRecentTransaction,
  clearActiveTransactionHash,
  clearRecentTransactions,
  setActiveRecentTransaction,
  setActiveTransactionHash,
  setHoldings,
  setRecentTransactions,
  setStatsToken,
};

function clearActiveRecentTransaction(state) {
  state.activeRecentTransaction = null;
}

function clearActiveTransactionHash(state) {
  state.activeTransactionHash = null;
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

function setHoldings(state, holdings) {
  state.holdings = holdings;

  if (!state.statsToken && holdings.length) {
    state.statsToken = holdings[0];
  }
}

function setRecentTransactions(state, transactions) {
  state.recentTransactions = transactions;
}

function setStatsToken(state, token) {
  state.statsToken = token;
  state.showPriceTile = true;
}

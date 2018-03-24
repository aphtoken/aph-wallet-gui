/* eslint-disable no-use-before-define */
// import Vue from 'vue';
// import { store } from './index';

export {
  clearActiveRecentTransaction,
  clearRecentTransactions,
  setActiveRecentTransaction,
  setHoldings,
  setRecentTransactions,
};

function clearActiveRecentTransaction(state) {
  state.recentTransactions = null;
}

function clearRecentTransactions(state) {
  state.recentTransactions = [];
}

function setActiveRecentTransaction(state, transaction) {
  state.recentTransactions = transaction;
}

function setHoldings(state, holdings) {
  state.holdings = holdings;
}

function setRecentTransactions(state, transactions) {
  state.recentTransactions = transactions;
}

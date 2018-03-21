/* eslint-disable no-use-before-define */
// import Vue from 'vue';
// import { store } from './index';

export {
  clearActiveRecentTransaction,
  clearRecentTransactions,
  setActiveRecentTransaction,
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

function setRecentTransactions(state, transactions) {
  state.recentTransactions = transactions;
}

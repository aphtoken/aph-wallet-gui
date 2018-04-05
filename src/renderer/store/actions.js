/* eslint-disable no-use-before-define */
import moment from 'moment';
import { neo, wallets } from '../services';
import alerts from '../services/alerts';

export {
  fetchHoldings,
  fetchPortfolio,
  fetchRecentTransactions,
  fetchSearchTransactions,
};

function fetchHoldings({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  neo
    .fetchHoldings(currentWallet.address)
    .then((data) => {
      commit('setHoldings', data.holdings);
    })
    .catch((e) => {
      alerts.exception(e);
    });
}

function fetchPortfolio({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  neo
    .fetchHoldings(currentWallet.address)
    .then((data) => {
      commit('setPortfolio', {
        balance: data.totalBalance,
        changePercent: data.change24hrPercent,
        changeValue: data.change24hrValue.toFixed(2),
      });
    })
    .catch((e) => {
      console.log(e);
    });
}

function fetchRecentTransactions({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  neo
    .fetchRecentTransactions(currentWallet.address, false,
      moment().subtract(30, 'days'), null)
    .then((data) => {
      commit('setRecentTransactions', data);
    })
    .catch((e) => {
      alerts.exception(e);
    });
}

function fetchSearchTransactions({ state, commit }) {
  const currentWallet = wallets.getCurrentWallet();
  if (!currentWallet) {
    return;
  }

  neo
    .fetchRecentTransactions(currentWallet.address, true,
      state.searchTransactionFromDate,
      state.searchTransactionToDate ? moment(state.searchTransactionToDate).add(1, 'days') : null)
    .then((data) => {
      commit('setSearchTransactions', data);
    })
    .catch((e) => {
      alerts.exception(e);
    });
}
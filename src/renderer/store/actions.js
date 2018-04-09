/* eslint-disable no-use-before-define */
import moment from 'moment';
import { alerts, neo, tokens, wallets } from '../services';
import { timeouts } from '../constants';
import router from '../router';
import network from '../services/network';

export {
  addToken,
  changeWallet,
  claimGas,
  createWallet,
  fetchHoldings,
  fetchPortfolio,
  fetchRecentTransactions,
  findTransactions,
  openSavedWallet,
};

function addToken({ dispatch }, { assetId, done, isCustom, symbol }) {
  tokens.add(symbol, {
    symbol,
    assetId: assetId.replace('0x', ''),
    isCustom,
    network: network.getSelectedNetwork().net,
  });

  dispatch('fetchHoldings');

  done();
}

function changeWallet({ dispatch }, wallet) {
  wallets.setCurrentWallet(wallet).sync();
  dispatch('fetchHoldings');
  dispatch('fetchPortfolio');
  dispatch('fetchRecentTransactions');
}

function claimGas({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'claimGas' });

  setTimeout(() => {
    neo.claimGas()
      .then(() => {
        commit('endRequest', { identifier: 'claimGas' });
      })
      .catch((message) => {
        alerts.exception(message);
        commit('failRequest', { identifier: 'claimGas', message });
      });
  }, timeouts.NEO_API_CALL);
}

function createWallet({ commit }, { name, passphrase, passphraseConfirm }) {
  commit('startRequest', { identifier: 'createWallet' });

  setTimeout(() => {
    neo
      .createWallet(name, passphrase, passphraseConfirm)
      .then((walletName) => {
        router.push({
          path: '/login/wallet-created',
          query: { walletName },
        });
        commit('endRequest', { identifier: 'createWallet' });
      })
      .catch((message) => {
        alerts.exception(message);
        commit('failRequest', { identifier: 'createWallet', message });
      });
  }, timeouts.NEO_API_CALL);
}

function fetchHoldings({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'fetchHoldings' });

  neo
    .fetchHoldings(currentWallet.address)
    .then((data) => {
      commit('setHoldings', data.holdings);
      commit('endRequest', { identifier: 'fetchHoldings' });
    })
    .catch((message) => {
      alerts.exception(message);
      commit('failRequest', { identifier: 'fetchHoldings', message });
    });
}

function fetchPortfolio({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'fetchPortfolio' });

  neo
    .fetchHoldings(currentWallet.address)
    .then((data) => {
      commit('setPortfolio', {
        balance: data.totalBalance,
        changePercent: data.change24hrPercent,
        changeValue: data.change24hrValue.toFixed(2),
      });
      commit('endRequest', { identifier: 'fetchPortfolio' });
    })
    .catch((e) => {
      commit('failRequest', { identifier: 'fetchPortfolio', message: e });
    });
}

function fetchRecentTransactions({ commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'fetchRecentTransactions' });

  neo
    .fetchRecentTransactions(currentWallet.address, false,
      moment().subtract(30, 'days'), null)
    .then((data) => {
      if (data && data.length > 0) {
        commit('setRecentTransactions', data);
      }
      commit('endRequest', { identifier: 'fetchRecentTransactions' });
    })
    .catch((message) => {
      alerts.exception(message);
      commit('failRequest', { identifier: 'fetchRecentTransactions', message });
    });
}

function findTransactions({ state, commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'findTransactions' });

  neo
    .fetchRecentTransactions(currentWallet.address, true,
      state.searchTransactionFromDate,
      state.searchTransactionToDate ? moment(state.searchTransactionToDate).add(1, 'days') : null)
    .then((data) => {
      commit('setSearchTransactions', data);
      commit('endRequest', { identifier: 'findTransactions' });
    })
    .catch((message) => {
      console.log(message);
      commit('failRequest', { identifier: 'findTransactions', message });
    });
}

function openSavedWallet({ commit }, { name, passphrase, done }) {
  commit('startRequest', { identifier: 'openSavedWallet' });

  setTimeout(() => {
    wallets.openSavedWallet(name, passphrase)
      .then(() => {
        done();
        commit('endRequest', { identifier: 'openSavedWallet' });
      })
      .catch(({ message }) => {
        commit('failRequest', { identifier: 'openSavedWallet', message });
      });
  }, timeouts.NEO_API_CALL);
}

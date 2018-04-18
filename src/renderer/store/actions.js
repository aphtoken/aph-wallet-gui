/* eslint-disable no-use-before-define */
import moment from 'moment';
import lockr from 'lockr';
import { alerts, neo, tokens, wallets, ledger } from '../services';
import { timeouts } from '../constants';
import router from '../router';
import network from '../services/network';

export {
  addToken,
  changeWallet,
  claimGas,
  createWallet,
  deleteWallet,
  fetchHoldings,
  fetchLatestVersion,
  fetchPortfolio,
  fetchRecentTransactions,
  findTransactions,
  importWallet,
  openEncryptedKey,
  verifyLedgerConnection,
  openLedger,
  openPrivateKey,
  openSavedWallet,
};

function addToken({ commit, dispatch, state }, { done, hashOrSymbol }) {
  const allTokens = tokens.getAllAsArray();
  let token;

  commit('startRequest', { identifier: 'addToken' });

  hashOrSymbol = hashOrSymbol.replace('0x', '');

  token = _.find(allTokens, (o) => {
    return o.symbol === hashOrSymbol && o.network === state.currentNetwork.net;
  });

  if (!token) {
    token = _.find(allTokens, (o) => {
      return o.assetId === hashOrSymbol && o.network === state.currentNetwork.net;
    });
  }

  if (!token) {
    /* eslint-disable max-len */
    return commit('failRequest', { identifier: 'addToken', message: `Unable to find a token with the symbol or script hash of '${hashOrSymbol}' on ${state.currentNetwork.net}` });
    /* eslint-enable max-len */
  }

  if (token.isCustom) {
    /* eslint-disable max-len */
    return commit('failRequest', { identifier: 'addToken', message: `'${hashOrSymbol}' is already in your token list ${state.currentNetwork.net}` });
    /* eslint-enable max-len */
  }

  tokens.add({
    symbol: token.symbol,
    assetId: token.assetId.replace('0x', ''),
    isCustom: true,
    network: network.getSelectedNetwork().net,
  });

  dispatch('fetchHoldings');

  done();

  return commit('endRequest', { identifier: 'addToken' });
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
        commit('failRequest', { identifier: 'createWallet', message });
      });
  }, timeouts.NEO_API_CALL);
}

function fetchHoldings({ state, commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'fetchHoldings' });

  const holdingsStorageKey = `aph.holdings.${currentWallet.address}.${state.currentNetwork.net}`;
  const localHoldings = lockr.get(holdingsStorageKey);
  if (localHoldings) {
    state.holdings = localHoldings;

    if (!state.statsToken && state.holdings.length) {
      state.statsToken = state.holdings[0];
    }
  }

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

function fetchPortfolio({ state, commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'fetchPortfolio' });

  const portfolioStorageKey = `aph.portfolio.${currentWallet.address}.${state.currentNetwork.net}`;
  const localPortfolio = lockr.get(portfolioStorageKey);
  if (localPortfolio) {
    state.portfolio = localPortfolio;
  }

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

function fetchRecentTransactions({ state, commit }) {
  const currentWallet = wallets.getCurrentWallet();

  if (!currentWallet) {
    return;
  }

  commit('startRequest', { identifier: 'fetchRecentTransactions' });

  const transactionsStorageKey = `aph.txs.${currentWallet.address}.${state.currentNetwork.net}`;
  const localTransactions = lockr.get(transactionsStorageKey);

  let lastBlockIndex = 0;
  if (localTransactions && localTransactions.length > 0) {
    lastBlockIndex = localTransactions[0].block_index;
    state.recentTransactions = localTransactions;
  }

  neo
    .fetchRecentTransactions(currentWallet.address, false,
      moment().subtract(30, 'days'), null, lastBlockIndex + 1, null)
    .then((data) => {
      commit('setRecentTransactions', data);
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

function openEncryptedKey({ commit }, { encryptedKey, passphrase, done }) {
  commit('startRequest', { identifier: 'openEncryptedKey' });

  setTimeout(() => {
    wallets.openEncryptedKey(encryptedKey, passphrase)
      .then(() => {
        done();
        commit('endRequest', { identifier: 'openEncryptedKey' });
      })
      .catch((e) => {
        commit('failRequest', { identifier: 'openEncryptedKey', message: e });
      });
  }, timeouts.NEO_API_CALL);
}

function verifyLedgerConnection({ commit }, { done, failed }) {
  commit('startRequest', { identifier: 'verifyLedgerConnection' });

  ledger.open()
    .then(() => {
      done();
      commit('endRequest', { identifier: 'verifyLedgerConnection' });
    })
    .catch((e) => {
      failed(e);
      commit('failRequest', { identifier: 'verifyLedgerConnection', message: e });
    });
}

function openLedger({ commit }, { done, failed }) {
  commit('startRequest', { identifier: 'openLedger' });

  ledger.open()
    .then(() => {
      ledger.getPublicKey()
        .then((publicKey) => {
          wallets.openLedger(publicKey)
            .then(() => {
              done();
              commit('endRequest', { identifier: 'openLedger' });
            })
            .catch((e) => {
              failed(e);
              commit('failRequest', { identifier: 'openLedger', message: e });
            });
        })
        .catch((e) => {
          failed(e);
          commit('failRequest', { identifier: 'openLedger', message: e });
        });
    })
    .catch((e) => {
      failed(e);
      commit('failRequest', { identifier: 'openLedger', message: e });
    });
}

function openPrivateKey({ commit }, { wif, done }) {
  commit('startRequest', { identifier: 'openPrivateKey' });

  setTimeout(() => {
    wallets.openWIF(wif)
      .then(() => {
        done();
        commit('endRequest', { identifier: 'openPrivateKey' });
      })
      .catch((e) => {
        commit('failRequest', { identifier: 'openPrivateKey', message: e });
      });
  }, timeouts.NEO_API_CALL);
}

function openSavedWallet({ commit }, { name, passphrase, done }) {
  commit('startRequest', { identifier: 'openSavedWallet' });

  setTimeout(() => {
    wallets.openSavedWallet(name, passphrase)
      .then(() => {
        done();
        commit('endRequest', { identifier: 'openSavedWallet' });
      })
      .catch((e) => {
        commit('failRequest', { identifier: 'openSavedWallet', message: e });
      });
  }, timeouts.NEO_API_CALL);
}

function importWallet({ commit }, { name, wif, passphrase, done }) {
  commit('startRequest', { identifier: 'importWallet' });

  setTimeout(() => {
    wallets.importWIF(name, wif, passphrase)
      .then(() => {
        wallets.sync();
        done();
        commit('endRequest', { identifier: 'importWallet' });
      })
      .catch((e) => {
        commit('failRequest', { identifier: 'importWallet', message: e });
      });
  }, timeouts.NEO_API_CALL);
}

function deleteWallet({ commit }, { name, done }) {
  commit('startRequest', { identifier: 'deleteWallet' });

  setTimeout(() => {
    wallets.remove(name)
      .then(() => {
        wallets.sync();
        done();
        commit('endRequest', { identifier: 'deleteWallet' });
      })
      .catch((e) => {
        alerts.exception(e);
        commit('failRequest', { identifier: 'deleteWallet', message: e });
      });
  }, timeouts.NEO_API_CALL);
}

function fetchLatestVersion({ commit }) {
  commit('startRequest', { identifier: 'fetchLatestVersion' });

  return axios.get(`${network.getSelectedNetwork().aph}/LatestWalletInfo`)
    .then(({ data }) => {
      commit('setLatestVersion', data.version);
      commit('endRequest', { identifier: 'fetchLatestVersion' });
    })
    .catch((e) => {
      console.log(e);
      commit('failRequest', { identifier: 'fetchLatestVersion', message: e });
    });
}

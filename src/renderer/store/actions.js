/* eslint-disable no-use-before-define */
import moment from 'moment';
import { BigNumber } from 'bignumber.js';

import { alerts, db, neo, network, tokens, wallets, ledger } from '../services';
import { timeouts } from '../constants';
import router from '../router';

export {
  addToken,
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
  openLedger,
  openPrivateKey,
  openSavedWallet,
  verifyLedgerConnection,
};

function addToken({ commit, dispatch }, { done, hashOrSymbol }) {
  const allTokens = tokens.getAllAsArray();
  const currentNetwork = network.getSelectedNetwork();
  let token;

  commit('startRequest', { identifier: 'addToken' });

  hashOrSymbol = hashOrSymbol.replace('0x', '');

  token = _.find(allTokens, (o) => {
    return o.symbol === hashOrSymbol && o.network === currentNetwork.net;
  });

  if (!token) {
    token = _.find(allTokens, (o) => {
      return o.assetId === hashOrSymbol && o.network === currentNetwork.net;
    });
  }

  if (!token) {
    /* eslint-disable max-len */
    return commit('failRequest', { identifier: 'addToken', message: `Unable to find a token with the symbol or script hash of '${hashOrSymbol}' on ${currentNetwork.net}` });
    /* eslint-enable max-len */
  }

  if (token.isCustom) {
    /* eslint-disable max-len */
    return commit('failRequest', { identifier: 'addToken', message: `'${hashOrSymbol}' is already in your token list ${currentNetwork.net}` });
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

function claimGas({ commit }) {
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

async function fetchCachedData(id, defaultValue) {
  const result = await db.get(id, defaultValue);

  return result;
}

async function fetchHoldings({ commit }) {
  const currentNetwork = network.getSelectedNetwork();
  const currentWallet = wallets.getCurrentWallet();
  let holdings;

  commit('startRequest', { identifier: 'fetchHoldings' });

  const holdingsStorageKey = `holdings.${currentWallet.address}.${currentNetwork.net}`;

  try {
    holdings = await fetchCachedData(holdingsStorageKey);
    commit('setHoldings', holdings);
  } catch (holdings) {
    commit('setHoldings', holdings);
  }

  try {
    holdings = await neo.fetchHoldings(currentWallet.address);
    commit('setHoldings', holdings.holdings);
    commit('endRequest', { identifier: 'fetchHoldings' });
  } catch (message) {
    alerts.exception(message);
    commit('failRequest', { identifier: 'fetchHoldings', message });
  }
}

async function fetchPortfolio({ commit }) {
  const currentNetwork = network.getSelectedNetwork();
  const currentWallet = wallets.getCurrentWallet();
  let portfolio;

  commit('startRequest', { identifier: 'fetchPortfolio' });

  const portfolioStorageKey = `portfolios.${currentWallet.address}.${currentNetwork.net}`;

  try {
    portfolio = await fetchCachedData(portfolioStorageKey);
    commit('setPortfolio', portfolio);
  } catch (portfolio) {
    commit('setPortfolio', portfolio);
  }

  try {
    const holdings = await neo.fetchHoldings(currentWallet.address);
    commit('setPortfolio', {
      balance: holdings.totalBalance,
      changePercent: holdings.change24hrPercent,
      changeValue: holdings.change24hrValue.toFixed(2),
    });
    commit('endRequest', { identifier: 'fetchPortfolio' });
  } catch (message) {
    alerts.exception(message);
    commit('failRequest', { identifier: 'fetchPortfolio', message });
  }
}

async function fetchRecentTransactions({ commit }) {
  const currentNetwork = network.getSelectedNetwork();
  const currentWallet = wallets.getCurrentWallet();
  let lastBlockIndex = 0;
  let recentTransactions;

  commit('startRequest', { identifier: 'fetchRecentTransactions' });

  const transactionsStorageKey = `txs.${currentWallet.address}.${currentNetwork.net}`;

  try {
    recentTransactions = await fetchCachedData(transactionsStorageKey);

    if (!_.isEmpty(recentTransactions)) {
      lastBlockIndex = recentTransactions[0].block_index;
    }

    commit('setRecentTransactions', normalizeRecentTransactions(recentTransactions));
  } catch (recentTransactions) {
    commit('setRecentTransactions', recentTransactions);
  }

  try {
    recentTransactions = await neo.fetchRecentTransactions(currentWallet.address, false, moment().subtract(30, 'days'), null, lastBlockIndex + 1); // eslint-disable-line
    commit('setRecentTransactions', recentTransactions);
    commit('endRequest', { identifier: 'fetchRecentTransactions' });
  } catch (message) {
    alerts.exception(message);
    commit('failRequest', { identifier: 'fetchRecentTransactions', message });
  }
}

function findTransactions({ state, commit }) {
  const currentWallet = wallets.getCurrentWallet();

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

  ledger.close()
    .then(() => {
      ledger.open()
        .then(() => {
          ledger.getPublicKey()
            .then((publicKey) => {
              wallets.openLedger(publicKey)
                .then(() => {
                  done();

                  setTimeout(() => {
                    ledger.close();
                  }, 5 * 1000);

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
        commit('clearActiveTransaction');
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
      commit('setLatestVersion', data);
      commit('endRequest', { identifier: 'fetchLatestVersion' });
    })
    .catch((e) => {
      console.log(e);
      commit('failRequest', { identifier: 'fetchLatestVersion', message: e });
    });
}


// Local functions
function normalizeRecentTransactions(transactions) {
  return transactions.map((transaction) => {
    const changes = {
      value: new BigNumber(transaction.value),
      details: {
        vin: transaction.details.vin.map((i) => {
          return {
            value: new BigNumber(i.value),
          };
        }),
        vout: transaction.details.vout.map((o) => {
          return {
            value: new BigNumber(o.value),
          };
        }),
      },
    };

    return _.merge(transaction, changes);
  });
}

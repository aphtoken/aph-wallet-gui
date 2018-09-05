/* eslint-disable no-use-before-define */
import moment from 'moment';
import { BigNumber } from 'bignumber.js';

import { alerts, assets, db, neo, network, wallets, ledger, dex } from '../services';
import { timeouts } from '../constants';
import router from '../router';

export {
  addToken,
  claimGas,
  createWallet,
  deleteWallet,
  fetchCommitState,
  fetchHoldings,
  fetchLatestVersion,
  fetchRecentTransactions,
  fetchBlockHeaderByHash,
  findTransactions,
  importWallet,
  openEncryptedKey,
  openLedger,
  openPrivateKey,
  openSavedWallet,
  verifyLedgerConnection,
  fetchMarkets,
  fetchTradeHistory,
  fetchOrderHistory,
  formOrder,
  placeOrder,
  pingSocket,
  subscribeToMarket,
  unsubscribeFromMarket,
};

function addToken({ commit, dispatch }, { done, hashOrSymbol }) {
  const networkAssets = assets.getNetworkAssets();
  const userAssets = assets.getUserAssets();
  const currentNetwork = network.getSelectedNetwork();
  let token;

  commit('startRequest', { identifier: 'addToken' });

  hashOrSymbol = hashOrSymbol.replace('0x', '');

  token = _.find(_.values(networkAssets), (o) => {
    return o.symbol === hashOrSymbol;
  });

  if (!token) {
    token = _.get(networkAssets, hashOrSymbol);
  }

  if (!token) {
    /* eslint-disable max-len */
    return commit('failRequest', { identifier: 'addToken', message: `Unable to find a token with the symbol or script hash of '${hashOrSymbol}' on ${currentNetwork.net}` });
    /* eslint-enable max-len */
  }

  if (_.has(userAssets, token.assetId)) {
    /* eslint-disable max-len */
    return commit('failRequest', { identifier: 'addToken', message: `'${hashOrSymbol}' is already in your token list ${currentNetwork.net}` });
    /* eslint-enable max-len */
  }

  assets.addUserAsset(token.assetId);

  dispatch('fetchHoldings', { done });

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

// Returns if a value is a string
function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

async function fetchCachedData(id, defaultValue) {
  let result = await db.get(id, defaultValue);

  if (isString(result)) {
    result = JSON.parse(result);
  }
  return result;
}

async function fetchBlockHeaderByHash({ state, commit }, { blockHash, done, failed }) {
  commit('startRequest', { identifier: 'fetchBlockHeaderByHash' });

  // Check if the block is in memory
  let blockHeader = _.get(state.blockDetails, blockHash);

  if (!blockHeader || typeof blockHeader === 'function') {
    const currentNetwork = network.getSelectedNetwork();

    // Check if the block is in the pouchdb cache
    const blockHeaderStorageKey = `blockheaders.${currentNetwork.net}.${blockHash}`;
    try {
      blockHeader = await fetchCachedData(blockHeaderStorageKey);
    } catch (defaultVal) {
      blockHeader = null;
    }

    if (!blockHeader) {
      try {
        blockHeader = await new Promise((resolve, reject) => {
          const rpcClient = network.getRpcClient();
          rpcClient.query({
            method: 'getblockheader',
            params: [blockHash, true],
          })
            .then((res) => {
              db.upsert(blockHeaderStorageKey, JSON.stringify(res.result));
              resolve(res.result);
            })
            .catch(e => reject(e));
        });
      } catch (e) {
        console.log(e);
        if (failed) {
          failed(e);
          const message = e.toString();
          commit('failRequest', { identifier: 'fetchBlockHeaderByHash', message });
        }
        return;
      }
    }
    // Make call to get the block
    commit('putBlockDetails', blockHeader);
  }

  if (done) {
    done(blockHeader);
  }
  commit('endRequest', { identifier: 'fetchBlockHeaderByHash' });
}

async function fetchCommitState({ commit }) {
  const currentNetwork = network.getSelectedNetwork();
  const currentWallet = wallets.getCurrentWallet();
  let commitState;

  commit('startRequest', { identifier: 'fetchCommitState' });

  const commitStorageKey = `commit.${currentWallet.address}.${currentNetwork.net}`;

  try {
    commitState = await fetchCachedData(commitStorageKey);
    commit('setCommitState', commitState);
  } catch (commitState) {
    commit('setCommitState', commitState);
  }

  try {
    commitState = await dex.fetchCommitState(currentWallet.address);
    commit('setCommitState', commitState);
    commit('endRequest', { identifier: 'fetchCommitState' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchCommitState', message });
  }
}

async function fetchHoldings({ commit }, { done, isRequestSilent }) {
  const currentNetwork = network.getSelectedNetwork();
  const currentWallet = wallets.getCurrentWallet();
  let portfolio;
  let holdings;

  commit(isRequestSilent ? 'startSilentRequest' : 'startRequest',
    { identifier: 'fetchHoldings' });

  const holdingsStorageKey = `holdings.${currentWallet.address}.${currentNetwork.net}`;

  // TODO: isn't this only useful if current state of holdings is empty? This should be optimized.
  try {
    holdings = await fetchCachedData(holdingsStorageKey);
    commit('setHoldings', holdings);
  } catch (holdings) {
    commit('setHoldings', holdings);
  }

  const portfolioStorageKey = `portfolios.${currentWallet.address}.${currentNetwork.net}`;
  try {
    portfolio = await fetchCachedData(portfolioStorageKey);
    commit('setPortfolio', portfolio);
  } catch (portfolio) {
    commit('setPortfolio', portfolio);
  }

  try {
    holdings = await neo.fetchHoldings(currentWallet.address);

    commit('setHoldings', holdings.holdings);
    commit('setPortfolio', {
      balance: holdings.totalBalance,
      changePercent: holdings.change24hrPercent,
      changeValue: holdings.change24hrValue.toFixed(2),
    });
    if (done) {
      done();
    }
    commit('endRequest', { identifier: 'fetchHoldings' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchHoldings', message });
  }

  return holdings;
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

  const fromDate = state.searchTransactionFromDate;
  const toDate = state.searchTransactionToDate ? moment(state.searchTransactionToDate).add(1, 'days') : null;
  neo
    .fetchRecentTransactions(currentWallet.address, true,
      fromDate, toDate)
    .then((data) => {
      commit('setSearchTransactions', data);
      commit('endRequest', { identifier: 'findTransactions' });
    })
    .catch((message) => {
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
      network.setExplorer(data.useAphExplorer);
      commit('setLatestVersion', data);
      commit('endRequest', { identifier: 'fetchLatestVersion' });
    })
    .catch((e) => {
      commit('failRequest', { identifier: 'fetchLatestVersion', message: e });
    });
}

async function fetchMarkets({ commit }, { done }) {
  let markets;
  commit('startRequest', { identifier: 'fetchMarkets' });

  try {
    markets = await dex.fetchMarkets();
    commit('setMarkets', markets);
    done();
    commit('endRequest', { identifier: 'fetchMarkets' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchMarkets', message });
  }
}

async function fetchTradeHistory({ state, commit }, { marketName, isRequestSilent }) {
  let history;
  commit(isRequestSilent ? 'startSilentRequest' : 'startRequest',
    { identifier: 'fetchTradeHistory' });

  try {
    history = await dex.fetchTradeHistory(marketName);
    if (state.tradeHistory && state.tradeHistory.apiBuckets && state.tradeHistory.marketName === marketName) {
      history.apiBuckets = state.tradeHistory.apiBuckets;
    } else {
      history.apiBuckets = await dex.fetchTradesBucketed(marketName);
    }
    commit('setTradeHistory', history);
    commit('endRequest', { identifier: 'fetchTradeHistory' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchTradeHistory', message });
  }
}

async function fetchOrderHistory({ commit }, { isRequestSilent }) {
  let orders;
  commit(isRequestSilent ? 'startSilentRequest' : 'startRequest',
    { identifier: 'fetchOrderHistory' });

  try {
    orders = await dex.fetchOrderHistory();
    commit('setOrderHistory', orders);
    commit('endRequest', { identifier: 'fetchOrderHistory' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchOrderHistory', message });
  }
}

async function formOrder({ commit }, { order }) {
  commit('startRequest', { identifier: 'placeOrder' });

  try {
    const res = await dex.formOrder(order);
    commit('setOrderToConfirm', res);
    commit('endRequest', { identifier: 'placeOrder' });
  } catch (message) {
    alerts.exception(message);
    commit('failRequest', { identifier: 'placeOrder', message });
  }
}

async function placeOrder({ commit }, { order, done }) {
  commit('startRequest', { identifier: 'placeOrder' });

  try {
    await dex.placeOrder(order);
    done();
    commit('setOrderToConfirm', null);
    commit('endRequest', { identifier: 'placeOrder' });
  } catch (message) {
    alerts.exception(message);
    commit('failRequest', { identifier: 'placeOrder', message });
  }
}


async function pingSocket({ state, commit }) {
  commit('startRequest', { identifier: 'pingSocket' });

  try {
    if (!state.socket || state.socket.isConnected !== true) {
      return;
    }

    state.socket.client.sendObj({ op: 'ping' });
    commit('endRequest', { identifier: 'pingSocket' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'pingSocket', message });
  }
}

async function subscribeToMarket({ state, commit }, { market, isRequestSilent }) {
  if (!market) {
    return;
  }
  commit(isRequestSilent ? 'startSilentRequest' : 'startRequest',
    { identifier: 'subscribeToMarket' });

  try {
    state.socket.client.sendObj({ op: 'subscribe', args: `orderBook:${market.marketName}` });

    const currentWallet = wallets.getCurrentWallet();
    state.socket.client.sendObj({
      op: 'subscribe',
      args: `orderUpdates:${market.marketName}:${currentWallet.address}`,
    });

    commit('endRequest', { identifier: 'subscribeToMarket' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'subscribeToMarket', message });
  }
}
async function unsubscribeFromMarket({ state, commit }, { market }) {
  if (!market) {
    return;
  }

  commit('startRequest', { identifier: 'unsubscribeFromMarket' });

  try {
    state.socket.client.sendObj({ op: 'unsubscribe', args: `orderBook:${market.marketName}` });

    const currentWallet = wallets.getCurrentWallet();
    state.socket.client.sendObj({
      op: 'unsubscribe',
      args: `orderUpdates:${market.marketName}:${currentWallet.address}`,
    });

    commit('endRequest', { identifier: 'unsubscribeFromMarket' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'unsubscribeFromMarket', message });
  }
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

/* eslint-disable no-use-before-define */
import moment from 'moment';
import { wallet } from '@cityofzion/neon-js';

import { alerts, assets, db, dex, neo, network, wallets, ledger } from '../services';
import ethclient from '../services/ethclient';
import storageNew from '../services/storageNew';
import { timeouts } from '../constants';
import router from '../router';
const Web3 = require('web3');

export {
  addToken,
  claimGas,
  createWallet,
  deleteWallet,
  fetchBlockHeaderByHash,
  fetchCommitState,
  fetchHoldings,
  fetchLatestVersion,
  fetchMarkets,
  fetchRecentTransactions,
  fetchTradesBucketed,
  fetchTradeHistory,
  findTransactions,
  importWallet,
  openEncryptedKey,
  openLedger,
  openPrivateKey,
  openPrivateKeySeedWords,
  openSavedWallet,
  fetchOrderHistory,
  fetchSystemAssetBalances,
  formOrder,
  placeOrder,
  pingSocket,
  subscribeToMarket,
  unsubscribeFromMarket,
  verifyLedgerConnection,
};

async function addToken({ commit, dispatch }, { done, hashOrSymbol, currency }) {
  const networkAssets = assets.getNetworkAssets();
  const userAssets = assets.getUserAssets();
  const currentNetwork = network.getSelectedNetwork();
  let token;

  commit('startRequest', { identifier: 'addToken' });

  if (currency === 'NEO') {
    hashOrSymbol = hashOrSymbol.replace('0x', '');

    token = _.find(_.values(networkAssets), { symbol: hashOrSymbol });

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
  }

  if (currency === 'ETH') {
    const web3 = new Web3(new Web3.providers.HttpProvider(network.getSelectedNetwork().infuraApi));
    let cAddress;

    try {
      cAddress = web3.utils.toChecksumAddress(hashOrSymbol);

      const tCheck = await web3.eth.getCode(cAddress);

      if (tCheck === '0x') {
        return commit('failRequest', { identifier: 'addToken', message: `'${hashOrSymbol}' is not a token contract!` });
      }

      if (_.has(userAssets, cAddress)) {
        /* eslint-disable max-len */
        return commit('failRequest', { identifier: 'addToken', message: `'${hashOrSymbol}' is already in your token list ${currentNetwork.net}` });
        /* eslint-enable max-len */
      }

      let abiCheck;

      try {
        abiCheck = await ethclient.getAbiByAddress(network.getSelectedNetwork().etherscanApi, cAddress);
      } catch (err) {
        return commit('failRequest', { identifier: 'addToken', message: `${err}` });
      }

      if (abiCheck.length === 0) {
        /* eslint-disable max-len */
        return commit('failRequest', { identifier: 'addToken', message: `Unable to find a token with the symbol or script hash of '${hashOrSymbol}' on ${currentNetwork.net}` });
        /* eslint-enable max-len */
      }

      const tokenContract = new web3.eth.Contract(JSON.parse(abiCheck), cAddress);
      let decimal;
      let tokenName;
      let tokenSymbol;

      try {
        tokenContract.methods.transfer(cAddress, 0);
        tokenContract.methods.balanceOf(cAddress);
      } catch (e) {
        return commit('failRequest', { identifier: 'addToken', message: 'Insufficiant data found for token!' });
      }

      if (currentNetwork.net === 'MainNet') {
        let tokenInfo;
        try {
          tokenInfo = await ethclient.getTokenInfo(cAddress);
          decimal = tokenInfo.decimals === 0 ||
            tokenInfo.decimals === '0' || tokenInfo.decimals === '' ? 1 : tokenInfo.decimals;
          tokenName = tokenInfo.name;
          tokenSymbol = tokenInfo.symbol === '' ? tokenInfo.name : tokenInfo.symbol;
        } catch (err) {
          return commit('failRequest', { identifier: 'addToken', message: `${err}` });
        }
      } else {
        try {
          decimal = await tokenContract.methods.decimals().call();
          decimal = decimal === '0' || decimal === 0 ? 1 : decimal;
          tokenName = await tokenContract.methods.name().call();
          tokenName = web3.utils.isHex(tokenName) ? web3.utils.hexToUtf8(tokenName) : tokenName;
          tokenSymbol = await tokenContract.methods.symbol().call();
          tokenSymbol = web3.utils.isHex(tokenSymbol) ? web3.utils.hexToUtf8(tokenSymbol) : tokenSymbol;
        } catch (err) {
          return commit('failRequest', { identifier: 'addToken', message: 'Insufficiant data found for token!' });
        }
      }

      const asset = {
        assetId: cAddress,
        canPull: true,
        decimals: parseInt(decimal, 10),
        name: tokenName,
        symbol: tokenSymbol,
        isETHBased: true,
        abi: abiCheck,
      };

      assets.addUserETHAsset(asset);
    } catch (error) {
      return commit('failRequest', { identifier: 'addToken',
        message: `${error}` });
    }
  }

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

function deleteWallet({ commit }, { name, passphrase, done }) {
  commit('startRequest', { identifier: 'deleteWallet' });
  const walletToOpen = wallets.getOne(name);
  let wif;

  try {
    wif = wallet.decrypt(walletToOpen.encryptedWIF, passphrase);
    setTimeout(() => {
      wallets.remove(name)
        .then(() => {
          wallets.sync();
          done();
          storageNew.remove(wif)
            .then(() => {
              storageNew.sync();
            });
          commit('endRequest', { identifier: 'deleteWallet' });
        })
        .catch((e) => {
          alerts.exception(e);
          commit('failRequest', { identifier: 'deleteWallet', message: e });
        });
    }, timeouts.NEO_API_CALL);
  } catch (e) {
    alerts.exception(e);
    commit('failRequest', { identifier: 'deleteWallet', message: e });
  }
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

async function fetchHoldings({ commit }, { done, isRequestSilent } = {}) {
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
    holdings = await neo.fetchHoldings(currentWallet.address, false);

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

async function fetchOrderHistory({ state, commit }, { isRequestSilent }) {
  const orderHistory = state.orderHistory;
  commit(isRequestSilent ? 'startSilentRequest' : 'startRequest',
    { identifier: 'fetchOrderHistory' });

  try {
    if (orderHistory && orderHistory.length > 0
      && orderHistory[0].updated) {
      const newOrders = await dex.fetchOrderHistory(0, orderHistory[0].updated, 'ASC');
      commit('addToOrderHistory', newOrders);
    } else {
      const orders = await dex.fetchOrderHistory();
      commit('setOrderHistory', orders);
    }

    commit('endRequest', { identifier: 'fetchOrderHistory' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchOrderHistory', message });
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

    commit('setRecentTransactions', neo.normalizeRecentTransactions(recentTransactions));
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

async function fetchTradesBucketed({ commit }, { marketName, interval, from, to }) {
  try {
    commit('startRequest', { identifier: 'fetchTradesBucketed' });

    const apiBuckets = await dex.fetchTradesBucketed(marketName, interval, from, to);

    commit('setTradesBucketed', apiBuckets);
    commit('endRequest', { identifier: 'fetchTradesBucketed' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchTradesBucketed', message });
  }
}

async function fetchTradeHistory({ commit, state }, { marketName, isRequestSilent }) {
  let history;
  commit(isRequestSilent ? 'startSilentRequest' : 'startRequest',
    { identifier: 'fetchTradeHistory' });

  try {
    const tradeHistoryPromise = dex.fetchTradeHistory(marketName);
    let tradesBucketPromise;

    if (!isRequestSilent) {
      tradesBucketPromise = dex.fetchTradesBucketed(marketName);
    }

    history = await tradeHistoryPromise;

    history.apiBuckets = tradesBucketPromise ?
      await tradesBucketPromise : state.tradeHistory.apiBuckets;

    commit('setTradeHistory', history);
    commit('endRequest', { identifier: 'fetchTradeHistory' });
  } catch (message) {
    alerts.networkException(message);
    commit('failRequest', { identifier: 'fetchTradeHistory', message });
  }
}

async function fetchSystemAssetBalances({ commit }, { forAddress, intents }) {
  commit('startRequest', { identifier: 'fetchSystemAssetBalances' });
  let balances;
  try {
    balances = await neo.fetchSystemAssetBalance(forAddress, intents);
  } catch (message) {
    commit('failRequest', { identifier: 'fetchSystemAssetBalances', message });
    throw message;
  }

  return balances;
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

function importWallet({ commit }, { name, wif, passphrase, mnemonic, done }) {
  commit('startRequest', { identifier: 'importWallet' });

  setTimeout(() => {
    wallets.importWIF(name, wif, passphrase, mnemonic)
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

async function openLedger({ commit }, { done, failed }) {
  commit('startRequest', { identifier: 'openLedger' });

  try {
    await ledger.close();
    await ledger.open();
    const publicKey = await ledger.getPublicKey();
    await wallets.openLedger(publicKey);
    await ledger.close();
    done();
    commit('endRequest', { identifier: 'openLedger' });
  } catch (e) {
    failed(e);
    commit('failRequest', { identifier: 'openLedger', message: e });
  }
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

function openPrivateKeySeedWords({ commit }, { wif, seedwords, done }) {
  commit('startRequest', { identifier: 'openPrivateKeySeedWords' });

  setTimeout(() => {
    wallets.openWIFseedWords(wif, seedwords)
      .then(() => {
        done();
        commit('endRequest', { identifier: 'openPrivateKeySeedWords' });
      })
      .catch((e) => {
        commit('failRequest', { identifier: 'openPrivateKeySeedWords', message: e });
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

async function placeOrder({ commit }, { order, done }) {
  commit('startRequest', { identifier: 'placeOrder' });

  try {
    await dex.placeOrder(order);
    done();
    commit('setOrderToConfirm', null);
    commit('endRequest', { identifier: 'placeOrder' });
  } catch (message) {
    alerts.exception(message);
    commit('setOrderToConfirm', null);
    commit('failRequest', { identifier: 'placeOrder', message });
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

async function verifyLedgerConnection({ commit }, { done, failed }) {
  commit('startRequest', { identifier: 'verifyLedgerConnection' });

  try {
    await ledger.open();
    done();
    commit('endRequest', { identifier: 'verifyLedgerConnection' });
  } catch (e) {
    failed(e);
    commit('failRequest', { identifier: 'verifyLedgerConnection', message: e });
  }
}

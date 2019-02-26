import {
  wallet,
  api,
  u,
  tx,
} from '@cityofzion/neon-js';
import _ from 'lodash';
import { BigNumber } from 'bignumber.js';

import alerts from './alerts';
import assets from './assets';
import network from './network';
import settings from './settings';
import valuation from './valuation';
import wallets from './wallets';
import ledger from './ledger';
import dex from './dex';
import { store } from '../store';
import { timeouts, intervals } from '../constants';
import { toBigNumber } from './formatting.js';

const { Transaction } = tx;
const DBG_LOG = false;

const GAS_ASSET_ID = '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';
const NEO_ASSET_ID = 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';

let lastClaimSent;
let lastGasFractureNotification;
const addressBalances = {};

const calculateHoldingTotalBalance = (holding) => {
  return toBigNumber(_.get(holding, 'balance', toBigNumber(0)))
    .plus(_.get(holding, 'contractBalance', toBigNumber(0)))
    .plus(_.get(holding, 'openOrdersBalance', toBigNumber(0)));
};
const calculateHoldingAvailableBalance = (holding) => {
  return toBigNumber(_.get(holding, 'balance', toBigNumber(0)))
    .plus(_.get(holding, 'contractBalance', toBigNumber(0)));
};

export default {
  createWallet(name, passphrase, passphraseConfirm) {
    return new Promise((resolve, reject) => {
      // TODO: abstract validation
      if (wallets.walletExists(name)) {
        return reject(`Wallet with name '${name}' already exists!`);
      }

      if (passphrase !== passphraseConfirm) {
        return reject('Passphrases do not match');
      } else if (passphrase.length < 4) {
        return reject('Please choose a longer passphrase');
      }

      try {
        const account = new wallet.Account(wallet.generatePrivateKey());
        const encryptedWIF = wallet.encrypt(account.WIF, passphrase);

        account.label = name;
        wallets
          .add(name, {
            label: name,
            encryptedWIF,
            address: account.address,
            scriptHash: account.scriptHash,
          })
          .sync();

        wallets.openSavedWallet(name, passphrase);
        return resolve(_.merge(account, { encryptedWIF, passphrase }));
      } catch (e) {
        return reject('An error occured while trying to generate a new wallet.');
      }
    });
  },

  fetchRecentTransactions(address, forSearch, fromDate, toDate, fromBlock, toBlock) {
    return new Promise((resolve, reject) => {
      try {
        return this.fetchSystemTransactions(address)
          .then((fetchedTransactions) => {
            this.fetchNEP5Transfers(address, fromDate, toDate, fromBlock, toBlock)
              .then((nep5) => {
                const splitTransactions = [];

                nep5.data.transfers.forEach((nep5Transfer) => {
                  // TODO: Fix this for vin and vout received and sent values.
                  fetchedTransactions.push({
                    txid: nep5Transfer.transactionHash.replace('0x', ''),
                    symbol: nep5Transfer.symbol,
                    value: toBigNumber(nep5Transfer.received - nep5Transfer.sent),
                    block_index: nep5Transfer.blockIndex,
                    blockHeight: nep5Transfer.blockIndex,
                    block_time: nep5Transfer.blockTime,
                    isNep5: true,
                    from: nep5Transfer.fromAddress,
                    to: nep5Transfer.toAddress,
                    vin: [{
                      address: nep5Transfer.fromAddress,
                      symbol: nep5Transfer.symbol,
                      value: toBigNumber(Math.abs(nep5Transfer.received - nep5Transfer.sent)),
                    }],
                    vout: [{
                      address: nep5Transfer.toAddress,
                      symbol: nep5Transfer.symbol,
                      value: toBigNumber(Math.abs(nep5Transfer.received - nep5Transfer.sent)),
                    }],
                  });
                });

                const promises = [];
                fetchedTransactions.forEach((fetchedTransaction) => {
                  if (fromBlock && fetchedTransaction.blockHeight < fromBlock) {
                    return;
                  }
                  if (toBlock && fetchedTransaction.blockHeight > toBlock) {
                    return;
                  }
                  promises.push(this.fetchTransactionDetails(fetchedTransaction.txid)
                    .then((transactionDetails) => {
                      if (!transactionDetails) {
                        if (DBG_LOG) console.log(`failed fetching details for ${fetchedTransaction.txid}`);
                        return;
                      }

                      if (fromDate
                        && transactionDetails.blocktime < fromDate.unix()) {
                        return;
                      }
                      if (toDate
                        && transactionDetails.blocktime > toDate.unix()) {
                        return;
                      }

                      if (fetchedTransaction.isNep5 !== true) {
                        let movedNEO = false;
                        let movedGAS = false;
                        let outNEO = toBigNumber(0);
                        let outGAS = toBigNumber(0);

                        transactionDetails.vin.forEach((input) => {
                          if (input.address === address && input.symbol === 'NEO') {
                            outNEO = outNEO.plus(input.value);
                            movedNEO = true;
                          }
                          if (input.address === address && input.symbol === 'GAS') {
                            outGAS = outGAS.plus(input.value);
                            movedGAS = true;
                          }
                        });

                        let inNEO = toBigNumber(0);
                        let inGAS = toBigNumber(0);
                        transactionDetails.vout.forEach((output) => {
                          if (output.address === address && output.symbol === 'NEO') {
                            inNEO = inNEO.plus(output.value);
                            movedNEO = true;
                          }
                          if (output.address === address && output.symbol === 'GAS') {
                            inGAS = inGAS.plus(output.value);
                            movedGAS = true;
                          }
                        });

                        const neoChange = inNEO.minus(outNEO);
                        const gasChange = inGAS.minus(outGAS);

                        if (transactionDetails.type === 'InvocationTransaction' && neoChange.isZero()) {
                          movedNEO = false;
                        }
                        if (transactionDetails.type === 'InvocationTransaction' && gasChange.isZero()) {
                          movedGAS = false;
                        }

                        if (movedNEO === true) {
                          transactionDetails.symbol = 'NEO';

                          transactionDetails.vin.forEach((input) => {
                            if (input.symbol === 'NEO') {
                              if (neoChange.isGreaterThan(0)) {
                                if (input.address !== address) {
                                  fetchedTransaction.from = input.address;
                                }
                              } else if (input.address === address) {
                                fetchedTransaction.from = input.address;
                              }
                            }
                          });

                          transactionDetails.vout.forEach((output) => {
                            if (output.symbol === 'NEO') {
                              if (neoChange.isGreaterThan(0)) {
                                if (output.address === address) {
                                  fetchedTransaction.to = output.address;
                                }
                              } else if (output.address !== address) {
                                fetchedTransaction.to = output.address;
                              }
                            }
                          });

                          splitTransactions.push({
                            hash: fetchedTransaction.txid,
                            block_index: transactionDetails.block,
                            symbol: transactionDetails.symbol,
                            value: toBigNumber(neoChange),
                            block_time: transactionDetails.blocktime,
                            details: transactionDetails,
                            isNep5: false,
                            from: fetchedTransaction.from,
                            to: fetchedTransaction.to,
                          });
                        }

                        if (movedGAS === true) {
                          transactionDetails.symbol = 'GAS';

                          transactionDetails.vin.forEach((input) => {
                            if (input.symbol === 'GAS') {
                              if (gasChange.isGreaterThan(0)) {
                                if (input.address !== address) {
                                  fetchedTransaction.from = input.address;
                                }
                              } else if (input.address === address) {
                                fetchedTransaction.from = input.address;
                              }
                            }
                          });

                          transactionDetails.vout.forEach((output) => {
                            if (output.symbol === 'GAS') {
                              if (gasChange.isGreaterThan(0)) {
                                if (output.address === address) {
                                  fetchedTransaction.to = output.address;
                                }
                              } else if (output.address !== address) {
                                fetchedTransaction.to = output.address;
                              }
                            }
                          });

                          splitTransactions.push({
                            hash: fetchedTransaction.txid,
                            block_index: transactionDetails.block,
                            symbol: transactionDetails.symbol,
                            value: toBigNumber(gasChange),
                            block_time: transactionDetails.blocktime,
                            details: transactionDetails,
                            isNep5: false,
                            from: fetchedTransaction.from,
                            to: fetchedTransaction.to,
                          });
                        }
                      } else {
                        transactionDetails.vout = fetchedTransaction.vout;
                        transactionDetails.vin = fetchedTransaction.vin;
                        transactionDetails.symbol = fetchedTransaction.symbol;
                        splitTransactions.push({
                          hash: fetchedTransaction.txid,
                          block_index: transactionDetails.block,
                          symbol: fetchedTransaction.symbol,
                          value: toBigNumber(fetchedTransaction.value),
                          block_time: transactionDetails.blocktime,
                          details: transactionDetails,
                          from: fetchedTransaction.from,
                          to: fetchedTransaction.to,
                        });
                      }
                    }));
                });

                Promise.all(promises)
                  .then(() => {
                    resolve(_.sortBy(splitTransactions, 'block_time').reverse());
                  })
                  .catch(e => reject(e));
              })
              .catch((e) => {
                alerts.networkException(e);
              });
          })
          .catch((e) => {
            if (DBG_LOG) console.log(e);
            resolve([]);
            if (e.message === 'Cannot read property \'length\' of null') {
              // absorb this error from neoscan,
              // happens with a new wallet without any transactions yet
              return;
            }
            alerts.networkException(e);
          });
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  fetchSystemTransactions(address) {
    const currentNetwork = network.getSelectedNetwork();

    return new Promise((resolve, reject) => {
      try {
        return api.getTransactionHistoryFrom({
          address,
          net: currentNetwork.net,
          url: currentNetwork.rpc,
        }, api.neoscan)
          .then((res) => {
            resolve(res);
          })
          .catch((e) => {
            if (DBG_LOG) console.log(e);
            resolve([]);
            if (e.message === 'Cannot read property \'length\' of null') {
              // absorb this error from neoscan,
              // happens with a new wallet without any transactions yet
              return;
            }
            alerts.exception(e);
          });
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  fetchTransactionDetails(hash) {
    const rpcClient = network.getRpcClient();

    return new Promise((resolve, reject) => {
      try {
        const inMemory = _.get(store.state.transactionDetails, hash.replace('0x', ''));
        if (inMemory && inMemory.confirmed) {
          if (network.getSelectedNetwork().bestBlock) {
            inMemory.currentBlockHeight = network.getSelectedNetwork().bestBlock.index;
            inMemory.confirmations = inMemory.currentBlockHeight - inMemory.block;
          }
          return resolve(inMemory);
        }

        return rpcClient.getRawTransaction(hash, 1)
          .then(async (transaction) => {
            const transactionPromises = [];

            if (transaction.confirmations > 0) {
              // Look up the block from the blockhash
              transactionPromises.push(new Promise((resolve, reject) => {
                store.dispatch('fetchBlockHeaderByHash', {
                  blockHash: transaction.blockhash,
                  done: ((data) => {
                    resolve(data);
                  }),
                  failed: e => reject(e),
                });
              }).then((blockHeader) => {
                transaction.confirmed = true;
                transaction.block = blockHeader.index;
                transaction.currentBlockHeight = transaction.confirmations + blockHeader.index;
              }).catch((e) => {
                if (DBG_LOG) console.log(`Error fetching block header when fetching tx details: ${e}`);
                // leave transaction unconfirmed so it will try to determine the block later.
                transaction.confirmed = false;
              }));
            } else {
              transaction.confirmed = false;
            }

            // set output symbols based on asset ids
            transaction.vout.forEach((output) => {
              if (output.asset === NEO_ASSET_ID || output.asset === `0x${NEO_ASSET_ID}`) {
                output.symbol = 'NEO';
              } else if (output.asset === GAS_ASSET_ID || output.asset === `0x${GAS_ASSET_ID}`) {
                output.symbol = 'GAS';
              }
            });

            const setInputTxDetails = ((input, inputTx) => {
              const inputSource = inputTx.vout[input.vout];
              if (inputSource.asset === NEO_ASSET_ID || inputSource.asset === `0x${NEO_ASSET_ID}`) {
                input.symbol = 'NEO';
              } else if (inputSource.asset === GAS_ASSET_ID || inputSource.asset === `0x${GAS_ASSET_ID}`) {
                input.symbol = 'GAS';
              }
              input.address = inputSource.address;
              input.value = inputSource.value;
            });

            // pull information for inputs from their previous outputs
            transaction.vin.forEach((input) => {
              const inMemory = _.get(store.state.transactionDetails, input.txid.replace('0x', ''));
              if (inMemory) {
                setInputTxDetails(input, inMemory);
                return;
              }
              transactionPromises.push(rpcClient
                .getRawTransaction(input.txid, 1)
                .then((inputTransaction) => {
                  store.commit('putTransactionDetail', inputTransaction);
                  setInputTxDetails(input, inputTransaction);
                })
                .catch(e => reject(e)));
            });

            await Promise.all(transactionPromises)
              .then(() => {
                store.commit('putTransactionDetail', transaction);
                resolve(transaction);
              })
              .catch(e => reject(e));
          })
          .catch((e) => {
            reject(`NEO RPC Network Error: ${e}`);
          });
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  fetchHoldings(address, restrictToSymbol) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();
    const rpcClient = network.getRpcClient();

    return new Promise(async (resolve, reject) => {
      try {
        const networkAssets = assets.getNetworkAssets();
        const userAssets = assets.getUserAssets();
        const holdings = [];
        const promises = [];

        if (!_.has(userAssets, store.state.currentNetwork.aph_hash)) {
          assets.addUserAsset(store.state.currentNetwork.aph_hash);
        }

        const pushSystemAssetHolding = (assetId, symbol, balance) => {
          const systemAssetHolding = {
            assetId,
            balance: new BigNumber(balance),
            symbol,
            name: symbol,
            isNep5: false,
            contractBalance: new BigNumber(0),
            totalBalance: new BigNumber(0),
            decimals: assetId === NEO_ASSET_ID ? 0 : 8,
            isUserAsset: true,
          };
          holdings.push(systemAssetHolding);
        };

        await rpcClient.query({ method: 'getaccountstate', params: [address] })
          .then(async (res) => {
            res.result.balances.forEach((fetchedBalance) => {
              fetchedBalance.assetId = fetchedBalance.asset.replace('0x', '');
              fetchedBalance.symbol = fetchedBalance.assetId === NEO_ASSET_ID ? 'NEO' : 'GAS';

              if (restrictToSymbol && fetchedBalance.symbol !== restrictToSymbol) {
                return;
              }

              pushSystemAssetHolding(fetchedBalance.assetId, fetchedBalance.symbol, fetchedBalance.value);
            });
          })
          .catch((e) => {
            const existingNeoHolding = this.getHolding(NEO_ASSET_ID);
            if (existingNeoHolding && (!restrictToSymbol || restrictToSymbol === NEO_ASSET_ID)) {
              holdings.push(existingNeoHolding);
            }

            const existingGasHolding = this.getHolding(GAS_ASSET_ID);
            if (existingGasHolding && (!restrictToSymbol || restrictToSymbol === GAS_ASSET_ID)) {
              holdings.push(existingGasHolding);
            }

            // TODO: don't surface unless happening multiple times in a row
            alerts.networkException(`NEO RPC Network Error: ${e}`);
          });

        // Ensure we have NEO and GAS
        if ((!restrictToSymbol || restrictToSymbol === NEO_ASSET_ID) && !_.find(holdings, { assetId: NEO_ASSET_ID })) {
          pushSystemAssetHolding(NEO_ASSET_ID, 'NEO', 0);
        }
        if ((!restrictToSymbol || restrictToSymbol === GAS_ASSET_ID) && !_.find(holdings, { assetId: GAS_ASSET_ID })) {
          pushSystemAssetHolding(GAS_ASSET_ID, 'GAS', 0);
        }

        const assetToHolding = (asset, isUserAsset) => {
          const assetId = asset.assetId.replace('0x', '');
          return {
            assetId,
            balance: new BigNumber(0),
            symbol: asset.symbol,
            name: asset.name,
            isNep5: assetId.length === 40,
            contractBalance: new BigNumber(0),
            totalBalance: new BigNumber(0),
            canPull: asset.canPull,
            isUserAsset,
            /* eslint-disable no-nested-ternary */
            decimals: asset.decimals ?
              asset.decimals : (asset.symbol === 'NEO' ? 0 : 8),
            /* eslint-enable no-nested-ternary */
          };
        };

        await this.fetchNEP5Balances(address)
          .then((balances) => {
            Object.keys(balances).forEach((assetId) => {
              const networkAsset = _.get(networkAssets, assetId);
              if (!networkAsset) {
                return; // token not found
              }
              if (restrictToSymbol && networkAsset.symbol !== restrictToSymbol) {
                return;
              }

              const holding = assetToHolding(networkAsset, _.has(userAssets, assetId));
              holding.balance = balances[assetId].walletBalance;
              holdings.push(holding);
            });
          })
          .catch((e) => {
            // If we fail to fetch balances, use previous balances.
            // TODO: might want to have a couple retries.
            _.values(userAssets).forEach((nep5Asset) => {
              if (restrictToSymbol && nep5Asset.symbol !== restrictToSymbol) {
                return;
              }
              const existingHolding = this.getHolding(nep5Asset.assetId);
              if (!existingHolding || !existingHolding.isNep5) return;

              holdings.push(existingHolding);
            });
            alerts.networkException(`APH API Network Error: ${e}`);
          });

        _.values(userAssets).forEach((nep5Asset) => {
          if (restrictToSymbol && nep5Asset.symbol !== restrictToSymbol) {
            return;
          }

          if (!_.find(holdings, { assetId: nep5Asset.assetId })) {
            const holding = assetToHolding(nep5Asset, true);
            holdings.push(holding);
          }
        });

        const resp = (await rpcClient.query({ method: 'getcontractbalances',
          params: [
            currentNetwork.dex_hash,
            wallet.getScriptHashFromAddress(currentWallet.address)],
        })).result;

        if (resp) {
          const contractBalances = {};
          resp.balance.forEach((asset) => {
            contractBalances[asset.asset_hash] = asset.amount;
            if (!_.has(userAssets, asset.asset_hash)) {
              // Add any missing assets that have contract balance.
              assets.addUserAsset(asset.asset_hash);
            }
          });

          holdings.forEach((holding) => {
            holding.contractBalance = toBigNumber(contractBalances[holding.assetId] || 0);
          });
        }

        const fetchHoldingBalanceComponent = (fetchFunc, memberBeingFetched, holding) => {
          return fetchFunc.call(dex, holding.assetId)
            .then((res) => {
              holding[memberBeingFetched] = toBigNumber(res);
              holding.availableBalance = calculateHoldingAvailableBalance(holding);
              holding.totalBalance = calculateHoldingTotalBalance(holding);
            })
            .catch((e) => {
              const existingHolding = this.getHolding(holding.assetId);
              if (existingHolding) {
                holding[memberBeingFetched] = existingHolding[memberBeingFetched];
                holding.availableBalance = calculateHoldingAvailableBalance(holding);
                holding.totalBalance = calculateHoldingTotalBalance(holding);
              }
              alerts.networkException(e);
            });
        };

        const valuationSymbols = [];
        holdings.forEach((holding) => {
          // promises.push(fetchHoldingBalanceComponent(dex.fetchContractBalance, 'contractBalance', holding));
          promises.push(fetchHoldingBalanceComponent(dex.fetchOpenOrderBalance, 'openOrdersBalance', holding));

          if (holding.symbol === 'NEO') {
            promises.push(api.getMaxClaimAmountFrom({
              net: currentNetwork.net,
              url: currentNetwork.rpc,
              address: currentWallet.address,
              privateKey: currentWallet.privateKey,
            }, api.neoscan)
              .then((res) => {
                holding.availableToClaim = toBigNumber(res);
              })
              .catch((e) => {
                const msg = `Couldn't get available to claim for ${holding.symbol}: ${e.message}`;
                alerts.networkException(msg);
                if (DBG_LOG) console.log(msg);
              }));
          }
          valuationSymbols.push(holding.symbol);
        });
        let valuations;
        try {
          valuations = await valuation.getValuations(valuationSymbols);
        } catch (e) {
          alerts.networkException(e);
        }

        return await Promise.all(promises)
          .then(() => {
            const lowercaseCurrency = settings.getCurrency().toLowerCase();

            holdings.forEach((holding) => {
              if (holding.balance.isGreaterThan(0)
                || (holding.totalBalance && holding.totalBalance.isGreaterThan(0))
                || holding.isUserAsset === true) {
                if (holding.isUserAsset !== true) {
                  // Saw a balance > 0 on this token but we haven't explicitly added to user assets.
                  // Add to user's assets so it will stay there until explicitly removed.
                  holding.isUserAsset = true;
                  assets.addUserAsset(holding.assetId);
                  // console.log(`adding user asset ${holding.symbol} ${holding.assetId} balance: ${holding.balance}`);
                }
              }

              const val = valuations[holding.symbol];
              if (val) {
                holding.totalSupply = val.total_supply;
                holding.availableSupply = val.available_supply;
                holding.marketCap = val[`market_cap_${lowercaseCurrency}`];
                holding.change24hrPercent = val.percent_change_24h;
                holding.unitValue = val[`price_${lowercaseCurrency}`]
                  ? parseFloat(val[`price_${lowercaseCurrency}`]) : 0;
                holding.unitValue24hrAgo = holding.unitValue
                  / (1 + (holding.change24hrPercent / 100.0));
                holding.change24hrValue = (holding.unitValue * holding.balance)
                  - (holding.unitValue24hrAgo * holding.balance);
                holding.totalValue = holding.unitValue * holding.balance;
                if (holding.unitValue === null || isNaN(holding.unitValue)) {
                  holding.totalValue = null;
                  holding.change24hrPercent = null;
                  holding.change24hrValue = null;
                }
              }
            });

            const res = {};
            res.holdings = _.sortBy(holdings, [holding => holding.symbol.toLowerCase()], ['symbol']);
            res.totalBalance = _.sumBy(holdings, 'totalValue');
            res.change24hrValue = _.sumBy(holdings, 'change24hrValue');
            res.change24hrPercent = Math.round(10000 * (res.change24hrValue
              / (res.totalBalance - res.change24hrValue))) / 100.0;

            return resolve(res);
          })
          .catch(e => reject(e));
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  getHolding(assetId) {
    const holding = _.find(store.state.holdings, { assetId });

    if (holding) {
      if (holding.balance !== null) {
        holding.balance = toBigNumber(holding.balance);
      }
      if (holding.contractBalance !== null) {
        holding.contractBalance = toBigNumber(holding.contractBalance);
      }
      if (!holding.totalBalance) {
        holding.totalBalance = calculateHoldingTotalBalance(holding);
      }
      if (holding.totalBalance !== null) {
        holding.totalBalance = toBigNumber(holding.totalBalance);
      }
    }

    return holding;
  },

  fetchNEP5Tokens(done) {
    const currentNetwork = network.getSelectedNetwork();

    return new Promise((resolve, reject) => {
      try {
        const assetsMap = {};
        try {
          return axios.get(`${currentNetwork.aph}/tokens`)
            .then((res) => {
              res.data.tokens.forEach((fetchedToken) => {
                const token = {
                  symbol: fetchedToken.symbol,
                  assetId: fetchedToken.scriptHash.replace('0x', ''),
                  name: fetchedToken.name,
                  decimals: fetchedToken.decimals,
                  canPull: fetchedToken.canPull,
                  sale: fetchedToken.sale,
                };
                _.set(assetsMap, token.assetId, token);
              });

              assets.updateNetworkAssets(assetsMap);
              if (done) {
                done();
              }
            })
            .catch((e) => {
              alerts.exception(`APH API Error: ${e}`);
            });
        } catch (e) {
          return reject(e);
        }
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  fetchNEP5Balances(address) {
    const currentNetwork = network.getSelectedNetwork();

    return new Promise((resolve, reject) => {
      try {
        const assetsMap = {};
        try {
          return axios.get(`${currentNetwork.aph}/balances?address=${address}`)
            .then((res) => {
              res.data.balances.forEach((fetchedBalance) => {
                _.set(assetsMap, fetchedBalance.scriptHash.replace('0x', ''), {
                  walletBalance: new BigNumber(fetchedBalance.balance),
                });
              });

              resolve(assetsMap);
            })
            .catch((e) => {
              alerts.exception(`APH API Error: ${e}`);
            });
        } catch (e) {
          return reject(e);
        }
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  fetchNEP5Transfers(address, fromDate, toDate, fromBlock, toBlock) {
    const currentNetwork = network.getSelectedNetwork();

    return new Promise((resolve) => {
      try {
        /* eslint-disable max-len */
        const requestUrl = `${currentNetwork.aph}/transfers/${address}?fromTimestamp=${fromDate ? fromDate.unix() : ''}&toTimestamp=${toDate ? toDate.unix() : ''}&fromBlock=${fromBlock ? fromBlock.toString() : ''}&toBlock=${toBlock ? toBlock.toString() : ''}`;
        /* eslint-enable max-len */
        return axios.get(requestUrl)
          .then((res) => {
            store.commit('setLastSuccessfulRequest');
            resolve(res);
          })
          .catch((e) => {
            alerts.exception(`APH API Error: ${e}`);
            resolve({
              data: {
                transfers: [],
              },
            });
          });
      } catch (e) {
        alerts.exception(e);
        return resolve({
          data: {
            transfers: [],
          },
        });
      }
    });
  },

  /**
   * @return Promise
   */
  sendFunds(toAddress, assetId, amount, isNep5, callback, checkRpcForDetails) {
    return new Promise((resolve, reject) => {
      let sendPromise = null;
      try {
        toAddress = toAddress.trim();
        if (wallet.isAddress(toAddress) === false) {
          return reject(`Invalid to address. ${toAddress}`);
        }

        if (isNep5 === false) {
          if (assetId === NEO_ASSET_ID) {
            sendPromise = this.sendSystemAsset(toAddress, amount, 0);
          } else if (assetId === GAS_ASSET_ID) {
            sendPromise = this.sendSystemAsset(toAddress, 0, amount);
          } else {
            return reject('Invalid system asset id');
          }
        } else if (isNep5 === true) {
          sendPromise = this.sendNep5Transfer(toAddress, assetId, amount);
        }

        if (!sendPromise) {
          return reject('Unable to send transaction.');
        }
      } catch (e) {
        if (DBG_LOG) console.log(e);
        return reject('Unable to send transaction.');
      }

      try {
        store.commit('setSendInProgress', true);
        sendPromise
          .then((res) => {
            if (!res || !res.tx || !res.response) {
              store.commit('setSendInProgress', false);
              return reject('Failed to create transaction.');
            }

            if (res.response.result !== true) {
              store.commit('setSendInProgress', false);
              return reject('Transaction rejected by NEO network.');
            }

            alerts.success(`Transaction Hash: ${res.tx.hash} Successfully Sent, waiting for confirmation.`);

            if (callback) {
              setTimeout(() => callback(), timeouts.NEO_API_CALL);
            }

            let allowSendAgain;
            if (isNep5) {
              allowSendAgain = true;
            } /* else {
              allowSendAgain = true;
              const existingBalance = _.get(addressBalances, wallets.getCurrentWallet().address);
              if (existingBalance) {
                if (existingBalance.balance.balance.assets.GAS.unspent.length === 0
                  || (assetId === GAS_ASSET_ID && existingBalance.balance.balance.assets.NEO.unspent.length === 0)) {
                  allowSendAgain = false;
                }
              }
            } */
            // TODO: We could enable the above for sending GAS and NEO again without waiting on the explorer now,
            // TODO: but in that case we need to support waiting for unconfirmed balance to confirm upon initiating a
            // TODO: new send that doesn't have enough unspent balance available.

            if (allowSendAgain) {
              // don't wait for confirmation to be able to send again
              store.commit('setSendInProgress', false);
            }

            res.tx.lastBroadcasted = moment().utc();
            return this.monitorTransactionConfirmation(res.tx, checkRpcForDetails)
              .then(() => {
                if (isNep5 === false) {
                  // TODO: verify this only makes the change available to spend and doesn't try to add the other
                  // TODO: utxo outputs too
                  // this.applyTxToAddressSystemAssetBalance(store.state.currentWallet.address, res.tx, true);
                  // Make change immediately available to spend
                }
                return resolve(res.tx);
              })
              .catch((e) => {
                alerts.error(e);
              });
          })
          .catch((e) => {
            store.commit('setSendInProgress', false);
            alerts.exception(e);
          });
        return sendPromise;
      } catch (e) {
        store.commit('setSendInProgress', false);
        return reject(e.message);
      }
    });
  },

  sendSystemAsset(toAddress, neoAmount, gasAmount) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();
    const intentAmounts = {};

    if (neoAmount > 0) {
      intentAmounts.NEO = neoAmount;
    }
    if (gasAmount > 0) {
      intentAmounts.GAS = gasAmount;
    }

    return store.dispatch('fetchSystemAssetBalances', { forAddress: currentWallet.address })
      .then((balance) => {
        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          address: currentWallet.address,
          privateKey: currentWallet.privateKey,
          balance,
          intents: api.makeIntent(intentAmounts, toAddress),
          fees: currentNetwork.fee,
        };

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
        }

        // TODO: this probably should happen as an action to update the balance without chance of race condition
        return api.sendAsset(config)
          .then((res) => {
            // api.sendAsset already applies the transaction to the balance, but if a block has passed and
            // fetchSystemAssetBalances() retrieved balance again the cached object changes, so we need to apply again.
            this.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx);
            return res;
          })
          .catch((e) => {
            alerts.exception(e);
          });
      })
      .catch((e) => {
        alerts.exception(e);
      });
  },

  sendNep5Transfer(toAddress, assetId, amount) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    const token = assets.getNetworkAsset(assetId);
    if (token.decimals >= 0 && token.decimals < 8) {
      // Adjust for the token's number of decimals.
      amount = toBigNumber(amount).dividedBy(10 ** (8 - token.decimals));
    }

    const config = {
      net: currentNetwork.net,
      url: currentNetwork.rpc,
      script: {
        scriptHash: assetId,
        operation: 'transfer',
        args: [
          u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address)),
          u.reverseHex(wallet.getScriptHashFromAddress(toAddress)),
          new u.Fixed8(amount).toReverseHex(),
        ],
      },
      fees: currentNetwork.fee,
      gas: 0,
    };

    if (currentWallet.isLedger === true) {
      config.signingFunction = ledger.signWithLedger;
      config.address = currentWallet.address;

      return api.doInvoke(config)
        .then((res) => {
          // api.doInvoke already applies the transaction to the balance, but if a block has passed and
          // fetchSystemAssetBalances() retrieved balance again the cached object changes, so we need to apply again.
          this.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx, false);
          return res;
        })
        .catch((e) => {
          alerts.exception(e);
        });
    }

    const account = new wallet.Account(currentWallet.wif);
    config.account = account;

    return api.doInvoke(config)
      .then((res) => {
        this.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx, false);
        return res;
      })
      .catch((e) => {
        alerts.exception(e);
      });
  },

  // TODO: maybe unify code some with sendNep5Transfer
  approveNep5Deposit(scriptHashToAllow, assetId, amount) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    const token = assets.getNetworkAsset(assetId);
    if (token.decimals >= 0 && token.decimals < 8) {
      // Adjust for the token's number of decimals.
      amount = toBigNumber(amount).dividedBy(10 ** (8 - token.decimals));
    }

    const config = {
      net: currentNetwork.net,
      url: currentNetwork.rpc,
      script: {
        scriptHash: assetId,
        operation: 'approve',
        args: [
          u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address)),
          u.reverseHex(scriptHashToAllow),
          new u.Fixed8(amount).toReverseHex(),
        ],
      },
      fees: currentNetwork.fee,
      gas: 0,
    };

    if (currentWallet.isLedger === true) {
      config.signingFunction = ledger.signWithLedger;
      config.address = currentWallet.address;

      return api.doInvoke(config)
        .then((res) => {
          this.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx, false);
          return res;
        })
        .catch((e) => {
          alerts.exception(e);
        });
    }

    const account = new wallet.Account(currentWallet.wif);
    config.account = account;

    return api.doInvoke(config)
      .then((res) => {
        this.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx, false);
        return res;
      })
      .catch((e) => {
        alerts.exception(e);
      });
  },

  fetchSystemAssetBalance(forAddress, intents) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentNetwork = network.getSelectedNetwork();

        if (!forAddress) {
          const currentWallet = wallets.getCurrentWallet();
          forAddress = currentWallet.address;
        }

        // Get the current balances for this address
        const existingBalance = _.get(addressBalances, forAddress);

        if (existingBalance && intents && existingBalance.pulled
          && moment().utc().diff(existingBalance.pulled, 'milliseconds') < timeouts.BALANCE_PERSIST_FOR) {
          // ensure that we have valid unspent UTXOs in the in memory balance to use
          // if not pull from block explorer again
          let unspentNEOTotal = new BigNumber(0);
          let unspentGASTotal = new BigNumber(0);
          let requiredNEO = new BigNumber(0);
          let requiredGAS = new BigNumber(0);

          if (existingBalance.balance.balance.assets.NEO) {
            existingBalance.balance.balance.assets.NEO.unspent.forEach((unspent) => {
              unspentNEOTotal = unspentNEOTotal.plus(unspent.value);
            });
          }

          if (existingBalance.balance.balance.assets.GAS) {
            existingBalance.balance.balance.assets.GAS.unspent.forEach((unspent) => {
              unspentGASTotal = unspentGASTotal.plus(unspent.value);
            });
          }

          if (intents && intents.length > 0) {
            intents.forEach((intent) => {
              if (intent.assetId === assets.NEO) {
                requiredNEO = requiredNEO.plus(intent.value);
              } else if (intent.assetId === assets.GAS) {
                requiredGAS = requiredGAS.plus(intent.value);
              }
            });
          }
          requiredGAS = requiredGAS.plus(currentNetwork.fee);

          let intentsHaveUnspents = true;
          if (requiredNEO && requiredNEO.isGreaterThan(unspentNEOTotal)) {
            intentsHaveUnspents = false;
          }
          if (requiredGAS && requiredGAS.isGreaterThan(unspentGASTotal)) {
            intentsHaveUnspents = false;
          }

          if (intentsHaveUnspents) {
            resolve(existingBalance.balance.balance);
            return;
          }
        }

        let bestBlockIndex;
        if (store.state.currentNetwork.bestBlock) {
          bestBlockIndex = store.state.currentNetwork.bestBlock.index;
        } else {
          bestBlockIndex = 0;
        }
        if (existingBalance && (existingBalance.lastBlockForFetchSystemAssetBalance
          && existingBalance.lastBlockForFetchSystemAssetBalance === bestBlockIndex)) {
          // Don't fetch information about unspent system balances if on the same block, just use the current cached.
          resolve(existingBalance.balance.balance);
          return;
        }

        const rpcClient = network.getRpcClient();
        const scriptHash = wallet.getScriptHashFromAddress(forAddress);

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          address: forAddress,
        };

        const resp = (await rpcClient.query({ method: 'getunspents', params: [scriptHash] })).result;

        if (!resp.address || resp.address !== forAddress) {
          reject('Unable to read address balance from block explorer.');
          return;
        }

        const parseUnspent = (unspentArr) => {
          return unspentArr.map((coin) => {
            return {
              index: coin.n,
              txid: coin.txid,
              value: coin.value,
            };
          });
        };

        const bal = new wallet.Balance({ address: resp.address, net: config.net });
        resp.balance.map((respBalance) => {
          if (respBalance.unspent.length > 0) {
            bal.addAsset(respBalance.asset, {
              balance: respBalance.amount,
              unspent: parseUnspent(respBalance.unspent),
            });
          }
        });

        const balance = Object.assign(config, { balance: bal });

        currentNetwork = network.getSelectedNetwork();

        if (balance.net !== currentNetwork.net) {
          reject('Network changed while reading address balance, aborting.');
        }

        if (balance.address === 'not found') {
          reject('Unable to read address balance from block explorer.');
          return;
        }

        const newBalance = balance.balance;
        // need to merge into balance
        if (existingBalance && existingBalance.balance.balance.assetSymbols) {
          const prevBalance = existingBalance.balance.balance;
          const symbols = prevBalance.assetSymbols;
          for (let symIndex = 0; symIndex < symbols.length; symIndex += 1) {
            const sym = symbols[symIndex];
            const prevAssetBalance = prevBalance.assets[sym];
            let newAssetBalance = newBalance.assets[sym];
            if (!newAssetBalance) {
              newBalance.addAsset(sym);
              newAssetBalance = newBalance.assets[sym];
            }
            if (newAssetBalance) {
              if (DBG_LOG) console.log(`Address '${forAddress}' Merging old balance for asset ${sym}`);

              const doMigration = (migrationType, utxo, blocksToDrop, migrationLambda) => {
                const migratedKey = `${migrationType}:${utxo.txid}:${utxo.index}`;
                let migratedBlock = existingBalance.migrated[migratedKey];
                if (!migratedBlock) {
                  // Store block index we first move a UTXO, so if something fails to confirm we
                  // won't keep the UTXO tied up until the wallet is restarted.
                  migratedBlock = bestBlockIndex;
                  existingBalance.migrated[migratedKey] = migratedBlock;
                }
                if (migratedBlock + blocksToDrop > bestBlockIndex) {
                  migrationLambda();
                } else {
                  delete existingBalance.migrated[migratedKey];
                }
              };

              // Carry across unconfirmed balances that are not yet unspent into our new balance, so they can be
              // moved directly to unspent once confirmed instead of needing another call to the explorer.
              for (let prevUnconfirmedIndex = 0; prevUnconfirmedIndex <
                prevAssetBalance.unconfirmed.length; prevUnconfirmedIndex += 1) {
                const prevUnconfirmed = prevAssetBalance.unconfirmed[prevUnconfirmedIndex];
                const index = newAssetBalance.unspent.findIndex(
                  newUnspent => prevUnconfirmed.txid === newUnspent.txid
                    && prevUnconfirmed.index === newUnspent.index);
                if (index < 0) {
                  const existingIndex = newAssetBalance.unconfirmed.findIndex(
                    newUnconfirmed => prevUnconfirmed.txid === newUnconfirmed.txid
                      && prevUnconfirmed.index === newUnconfirmed.index);
                  // Verify it isn't already in our unconfirmed array.
                  if (existingIndex < 0) {
                    doMigration('unconfirmed', prevUnconfirmed, 10, () => {
                      if (DBG_LOG) {
                        console.log(` Adding unconfirmed balance for asset ${sym}: ${prevUnconfirmed.value}`
                          + ` txid: ${prevUnconfirmed.txid} index: ${prevUnconfirmed.index}`);
                      }
                      newAssetBalance.balance.add(prevUnconfirmed.value);
                      newAssetBalance.unconfirmed.push(prevUnconfirmed);
                    });
                  }
                }
              }

              // Carry across unspent balances that are not yet unspent from explorer's view into our new balance.
              for (let prevUnspentIndex = 0; prevUnspentIndex <
                prevAssetBalance.unspent.length; prevUnspentIndex += 1) {
                const prevUnspent = prevAssetBalance.unspent[prevUnspentIndex];
                const index = newAssetBalance.unspent.findIndex(
                  newUnspent => prevUnspent.txid === newUnspent.txid
                    && prevUnspent.index === newUnspent.index);
                if (index < 0) {
                  doMigration('unspent', prevUnspent, 10, () => {
                    console.log(` Adding unspent balance for asset ${sym}: ${prevUnspent.value}`
                      + ` txid: ${prevUnspent.txid} index: ${prevUnspent.index}`);
                    newAssetBalance.balance.add(prevUnspent.value);
                    newAssetBalance.unspent.push(prevUnspent);
                  });
                }
              }

              // Move spent inputs from prevBalance that are unspent in newBalance to spent in newBalance
              for (let prevSpentIndex = 0; prevSpentIndex < prevAssetBalance.spent.length; prevSpentIndex += 1) {
                const prevSpent = prevAssetBalance.spent[prevSpentIndex];
                const index = newAssetBalance.unspent.findIndex(
                  newUnspent => prevSpent.txid === newUnspent.txid && prevSpent.index === newUnspent.index);
                if (index >= 0) {
                  // Allow dropping off spent utxos, since the explorer should not have them after some blocks.
                  doMigration('spent', prevSpent, 20, () => {
                    const spentCoin = newAssetBalance.unspent.splice(index, 1);
                    newAssetBalance.balance.sub(prevSpent.value);
                    newAssetBalance.spent = newAssetBalance.spent.concat(spentCoin);
                    if (DBG_LOG) {
                      console.log(
                        ` Moved spent tx across to new balance ${spentCoin[0].txid} ${spentCoin[0].index}`);
                    }
                  });
                }
              }
            }
          }
        } else if (DBG_LOG) {
          console.log(`Address '${forAddress}' Initial balance fetch`);
        }

        // Need to ensure we have GAS and NEO both in place in case new balance needs to be added.
        if (!newBalance.assets.GAS) newBalance.addAsset('GAS');

        if (!newBalance.assets.NEO) newBalance.addAsset('NEO');

        const symbols = newBalance.assetSymbols;
        if (symbols && DBG_LOG) {
          for (let symIndex = 0; symIndex < symbols.length; symIndex += 1) {
            const sym = symbols[symIndex];
            const newAssetBalance = newBalance.assets[sym];
            console.log(` New Balance for asset ${sym}: ${newAssetBalance.balance}`
              + ` unspentCount: ${newBalance.assets[sym].unspent.length}`);
            // TODO: if the number of unspent GAS inputs here is low perhaps detect the scenario and notify user.
            console.log(` ${sym} unspent after new fetch: ${newBalance.assets[sym].unspent.length}`);
            newBalance.assets[sym].unspent.forEach((input) => {
              console.log(` txid: ${input.txid} index: ${input.index} value: ${input.value}`);
            });
          }
        }

        _.set(addressBalances, forAddress, {
          balance,
          migrated: (existingBalance && existingBalance.migrated) || {},
          isExpired: false,
          pulled: moment().utc(),
          lastBlockForFetchSystemAssetBalance: bestBlockIndex,
        });

        resolve(balance.balance);
      } catch (e) {
        if (DBG_LOG) console.log(`Unable to fetch system asset balances. Error: ${e}`);
        reject(`Unable to fetch system asset balances. Error: ${e.message}`);
      }
    });
  },

  applyTxToAddressSystemAssetBalance(address, tx, confirmed) {
    tx = tx instanceof Transaction ? tx : Transaction.deserialize(tx);
    if (_.has(addressBalances, address)) {
      const existingBalance = _.get(addressBalances, address);
      existingBalance.balance.balance.applyTx(tx, confirmed);
      if (DBG_LOG) {
        if (!confirmed) {
          tx.inputs.forEach((input) => {
            console.log(`Applying tx inputs to move balances to spent: ${input.prevHash} ${input.prevIndex}`);
          });
        } else {
          let index = 0;
          tx.outputs.forEach(() => {
            console.log(`Moving outputs from tx back to unspent: ${tx.hash} ${index}`);
            index += 1;
          });
        }
      }
    }
  },

  // There should be no need to reset this.
  // resetSystemAssetBalanceCache() {
  //   addressBalances = {};
  // },

  promptGASFractureIfNecessary() {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    let recommendedUTXOs = 10;
    let checkUTXOs = 6;
    if (currentWallet.isLedger === true) {
      // ledger has limitations on tx size
      recommendedUTXOs = 5;
      checkUTXOs = 3;
    }

    if (!currentNetwork || currentNetwork.fee <= 0) {
      return;
    }

    if (store.state.gasFracture === false) {
      return;
    }

    if (new Date() - lastGasFractureNotification < intervals.GAS_FRACTURE_NOTIFICATION) {
      return;
    }

    store.dispatch('fetchSystemAssetBalances', { forAddress: currentWallet.address })
      .then((balance) => {
        if (!balance
          || !balance.assets.GAS
          || !balance.assets.GAS.unspent
          || balance.assets.GAS.unspent.length <= 0
          || balance.assets.GAS.balance.toNumber() <= currentNetwork.fee) {
          return;
        }

        let outputsAboveFee = 0;
        balance.assets.GAS.unspent.forEach((unspent) => {
          if (unspent.value.toNumber() >= currentNetwork.fee) {
            outputsAboveFee += 1;
          }
        });

        if (outputsAboveFee < checkUTXOs) {
          store.commit('setFractureGasModalModel', {
            walletBalance: balance.assets.GAS.balance.toString(),
            currentOutputsAboveFee: outputsAboveFee,
            recommendedUTXOs,
            fee: currentNetwork.fee,
          });

          lastGasFractureNotification = new Date();
        }
      })
      .catch((e) => {
        alerts.error(`Failed to fetch address balance. ${e}`);
      });
  },

  fractureGAS(targetNumberOfOutputs, minimumSize) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        store.dispatch('fetchSystemAssetBalances', { forAddress: currentWallet.address })
          .then((balance) => {
            const config = {
              net: currentNetwork.net,
              url: currentNetwork.rpc,
              gas: 0,
              intents: [],
              balance,
            };

            if (currentWallet.isLedger === true) {
              config.signingFunction = ledger.signWithLedger;
              config.address = currentWallet.address;
            } else {
              config.account = new wallet.Account(currentWallet.wif);
            }

            // Transactions are now big; requires .002 fee to split if splitting to a lot of pieces.
            // We default to 10 though, so it won't require a large fee for now.
            let feeForSplit;
            if (targetNumberOfOutputs > 10 && currentNetwork.fee < 0.002) {
              feeForSplit = 0.002;
            } else {
              feeForSplit = currentNetwork.fee;
            }

            api.fillKeys(config)
              .then((config) => {
                return api.createTx(config, 'contract');
              })
              .then((config) => {
                BigNumber.config({ DECIMAL_PLACES: 8, ROUNDING_MODE: 3 });

                const gas = balance.assets.GAS;
                const sortedUnspents = _.sortBy(gas.unspent, [unspent => unspent.value.toNumber()]).reverse();
                let totalInputs = new BigNumber(0);
                config.tx.inputs = [];
                config.tx.outputs = [];
                config.fees = feeForSplit;

                sortedUnspents.forEach((unspent) => {
                  totalInputs = totalInputs.plus(unspent.value);
                  config.tx.inputs.push({
                    prevHash: unspent.txid,
                    prevIndex: unspent.index,
                  });
                });
                if (DBG_LOG) console.log(`input total: ${totalInputs.toString()}`);

                let usedInputs = new BigNumber(0);
                let outputSize = totalInputs.minus(config.fees)
                  .dividedBy(targetNumberOfOutputs - 1).dividedBy(targetNumberOfOutputs - 1);
                if (outputSize.isLessThan(minimumSize)) {
                  outputSize = toBigNumber(minimumSize);
                }

                for (let i = 0; i < targetNumberOfOutputs; i += 1) {
                  let thisOutputSize = outputSize;
                  if (usedInputs.plus(thisOutputSize).isGreaterThanOrEqualTo(totalInputs)) {
                    thisOutputSize = new BigNumber(totalInputs).minus(usedInputs);
                  }

                  if (thisOutputSize.isGreaterThan(0)) {
                    config.tx.outputs.push({
                      assetId: assets.GAS,
                      scriptHash: wallet.getScriptHashFromAddress(currentWallet.address),
                      value: outputSize,
                    });
                    usedInputs = usedInputs.plus(outputSize);
                    if (DBG_LOG) {
                      console.log(`output: ${outputSize.toString()} usedInputTotal: ${usedInputs.toString()}`);
                    }
                  }
                }

                const change = totalInputs.minus(usedInputs).minus(config.fees);
                config.tx.outputs.push({
                  assetId: assets.GAS,
                  scriptHash: wallet.getScriptHashFromAddress(currentWallet.address),
                  value: change,
                });
                // console.log(`change output: ${change.toString()}`);
                return api.signTx(config);
              })
              .then((config) => {
                return api.sendTx(config);
              })
              .then((config) => {
                this.applyTxToAddressSystemAssetBalance(currentWallet.address, config.tx, false);
                this.monitorTransactionConfirmation(config.tx, true)
                  .then(() => {
                    this.applyTxToAddressSystemAssetBalance(currentWallet.address, config.tx, true);
                    resolve({
                      success: config.response.result,
                      tx: config.tx,
                    });
                  });
              })
              .catch((e) => {
                reject(`Failed to send GAS fracture transaction. ${e}`);
              });
          })
          .catch((e) => {
            reject(`Failed to send GAS fracture transaction. ${e}`);
          });
      } catch (e) {
        reject(`Failed to send GAS fracture transaction. ${e.message}`);
      }
    });
  },

  monitorTransactionConfirmation(tx, checkRpcForDetails, initialDelay = 5 * 1000) {
    return new Promise((resolve, reject) => {
      try {
        const startedMonitoring = moment().utc();
        setTimeout(() => {
          const interval = setInterval(async () => {
            if (moment().utc().diff(startedMonitoring, 'milliseconds') > timeouts.MONITOR_TRANSACTIONS
                && checkRpcForDetails !== true) {
              clearInterval(interval);
              reject('Timed out waiting for transaction to be returned from block explorer');
              return;
            }

            if (DBG_LOG) console.log(`Checking for tx ${tx.hash} to complete`);

            const txInHistory = _.find(store.state.recentTransactions, { hash: tx.hash });
            if (txInHistory) {
              alerts.success(`TX: ${tx.hash} CONFIRMED`);
              clearInterval(interval);
              if (DBG_LOG) console.log(`Found tx ${tx.hash} in recent transactions, resolving.`);
              resolve(txInHistory);
              return;
            }

            if (checkRpcForDetails === true) {
              await this.fetchTransactionDetails(tx.hash)
                .then((transactionDetails) => {
                  if (transactionDetails && transactionDetails.confirmed) {
                    alerts.success(`TX: ${transactionDetails.txid} CONFIRMED`);
                    clearInterval(interval);
                    resolve(transactionDetails);
                  }
                })
                .catch(() => {
                  if (moment().utc().diff(startedMonitoring, 'milliseconds') >= intervals.BLOCK * 20) {
                    if (DBG_LOG) console.log(`Failing monitoring for tx ${tx.hash} to complete.`);
                    reject('Transaction confirmation failed.');
                  }
                });
              return;
            }

            if (moment().utc().diff(tx.lastBroadcasted, 'milliseconds') > intervals.REBROADCAST_TRANSACTIONS) {
              if (DBG_LOG) console.log(`Rebroadcasting tx ${tx.hash} in case it was lost.`);
              tx.lastBroadcasted = moment().utc();
              api.sendTx({
                tx,
                url: network.getSelectedNetwork().rpc,
              }).catch((e) => {
                if (e.message.indexOf('transaction already exists') !== -1) {
                  // already in the mem_pool
                  alerts.info(`Transaction TX: ${tx.hash} still awaiting verification`);
                } else {
                  alerts.exception(e);
                }
              });
            }
          }, 5000);
        }, initialDelay); // wait a block for propagation
        return null;
      } catch (e) {
        return reject(e.message);
      }
    });
  },

  claimGas() {
    const currentWallet = wallets.getCurrentWallet();

    if (new Date() - lastClaimSent < 5 * 60 * 1000) { // 5 minutes ago
      return new Promise((reject) => {
        alerts.error('May only claim GAS once every 5 minutes.');
        reject('May only claim GAS once every 5 minutes.');
      });
    }

    const gasClaim = {
      step: 0,
    };
    store.commit('setGasClaim', gasClaim);
    store.commit('setShowClaimGasModal', true);

    lastClaimSent = new Date();
    return this.fetchHoldings(currentWallet.address, 'NEO')
      .then((holding) => {
        const neoAmount = holding.holdings[0].balance;
        const callback = () => {
          gasClaim.step = 2;
        };
        gasClaim.neoTransferAmount = neoAmount;
        gasClaim.step = 1;


        if (holding.holdings.length === 0 || holding.holdings[0].balance <= 0) {
          this.sendClaimGas(gasClaim);
        } else {
          // send neo to ourself to make all gas available for claim
          this.sendFunds(currentWallet.address, NEO_ASSET_ID, neoAmount, false, callback)
            .then(() => {
              setTimeout(() => {
                // send the claim gas
                this.sendClaimGas(gasClaim);
              }, 10 * 1000);
            })
            .catch((e) => {
              gasClaim.error = e;
              alerts.exception(e);
              lastClaimSent = null;
              store.commit('setGasClaim', gasClaim);
              store.commit('setShowClaimGasModal', false);
            });
        }
      })
      .catch((e) => {
        gasClaim.error = e;
        alerts.networkException(e);
        lastClaimSent = null;
        store.commit('setGasClaim', gasClaim);
        store.commit('setShowClaimGasModal', false);
      });
  },

  sendClaimGas(gasClaim) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    const config = {
      net: currentNetwork.net,
      url: currentNetwork.rpc,
      address: currentWallet.address,
      privateKey: currentWallet.privateKey,
    };

    if (currentWallet.isLedger === true) {
      config.signingFunction = ledger.signWithLedger;
    }

    api.getMaxClaimAmountFrom({
      net: network.getSelectedNetwork().net,
      url: currentNetwork.rpc,
      address: wallets.getCurrentWallet().address,
      privateKey: wallets.getCurrentWallet().privateKey,
    }, api.neoscan)
      .then((res) => {
        gasClaim.gasClaimAmount = toBigNumber(res);
        gasClaim.step = 3;

        api.claimGas(config)
          .then((res) => {
            gasClaim.step = 4;

            res.tx.lastBroadcasted = moment().utc();
            this.monitorTransactionConfirmation(res.tx)
              .then(() => {
                store.dispatch('fetchRecentTransactions');
                gasClaim.step = 5;
              })
              .catch((e) => {
                gasClaim.error = e;
                alerts.error(e);
              });
          })
          .catch((e) => {
            gasClaim.error = e;
            alerts.exception(e);
          });
      })
      .catch((e) => {
        gasClaim.error = e;
        alerts.exception(e);
      });
  },

  participateInTokenSale(scriptHash, assetId, amount, callback) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash,
            operation: 'mintTokens',
            args: [],
          },
          gas: 0,
        };

        const scriptHashAddress = wallet.getAddressFromScriptHash(scriptHash);

        if (assetId === NEO_ASSET_ID) {
          config.intents = api.makeIntent({ NEO: amount }, scriptHashAddress);
        } else if (assetId === GAS_ASSET_ID) {
          config.intents = api.makeIntent({ GAS: amount }, scriptHashAddress);
        } else {
          reject('Invalid asset used to participate in token sale. Must use NEO or GAS.');
          return;
        }

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        alerts.success('Sending Transaction');
        api.doInvoke(config)
          .then((res) => {
            if (res.response.result === false) {
              return reject('Token sale participation failed.');
            }

            alerts.success(`Transaction Hash: ${res.tx.hash} Sent, waiting for confirmation.`);
            if (callback) {
              setTimeout(() => callback(), timeouts.NEO_API_CALL);
            }

            return api.nep5.getToken(currentNetwork.rpc, scriptHash, currentWallet.address)
              .then((token) => {
                if (assets.tokenExists(scriptHash.replace('0x', ''), currentNetwork.net) !== true) {
                  assets.addNetworkAsset.add({
                    symbol: token.symbol,
                    assetId: scriptHash.replace('0x', ''),
                    name: token.name,
                    network: currentNetwork.net,
                  });
                }

                this.monitorTransactionConfirmation(res.tx)
                  .then(() => {
                    api.nep5.getToken(currentNetwork.rpc, scriptHash, currentWallet.address)
                      .then((token) => {
                        resolve({
                          name: token.name,
                          symbol: token.symbol,
                          decimals: token.decimals,
                          totalSupply: token.totalSupply,
                          balance: token.balance,
                        });
                      })
                      .catch((e) => {
                        reject(e);
                      });
                  })
                  .catch((e) => {
                    reject(e);
                  });
              })
              .catch(() => {
                resolve({ balance: 0 });
              });
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e.message);
      }
    });
  },

  normalizeRecentTransactions(transactions) {
    return transactions.map((transaction) => {
      return _.merge(transaction, {
        value: toBigNumber(transaction.value).toString(),
        details: {
          vin: transaction.details.vin.map((i) => {
            const val = i.value || 0;
            return {
              value: toBigNumber(val).toString(),
            };
          }),
          vout: transaction.details.vout.map(({ value }) => {
            return {
              value: toBigNumber(value).toString(),
            };
          }),
        },
      });
    });
  },
};

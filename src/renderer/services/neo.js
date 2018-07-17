import {
  wallet,
  api,
  u,
} from '@cityofzion/neon-js';
import { BigNumber } from 'bignumber.js';
import Async from 'async';

import alerts from './alerts';
import network from './network';
import settings from './settings';
import tokens from './tokens';
import valuation from './valuation';
import wallets from './wallets';
import ledger from './ledger';
import dex from './dex';
import { store } from '../store';
import { timeouts, intervals } from '../constants';

const toBigNumber = (value) => {
  let bigNumber = value;
  if (!bigNumber.isNegative) {
    if (bigNumber.c && bigNumber.e && bigNumber.s) {
      bigNumber = new BigNumber(0);
      bigNumber.c = value.c;
      bigNumber.e = value.e;
      bigNumber.s = value.s;
    }
  }

  return new BigNumber(String(bigNumber));
};
const isBigNumber = (value) => {
  return value.isNegative;
};

const GAS_ASSET_ID = '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';
const NEO_ASSET_ID = 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';

let lastClaimSent;

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
                        console.log(`failed fetching details for ${fetchedTransaction.txid}`);
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

                        const inMemoryHolding = _.get(store.state.nep5Balances, fetchedTransaction.scriptHash);
                        if (inMemoryHolding) {
                          // set in memory holding balance to null so it will pick up the new balance
                          // if it was skipping it before because we didn't hold any
                          inMemoryHolding.balance = null;
                        }
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
            console.log(e);
            resolve([]);
            if (e.message === 'Cannot read property \'length\' of null') {
              // absorb this error from neoscan,
              // happens with a new wallet without any transactions yet
              return;
            }
            alerts.networkException(e);
          });
      } catch (e) {
        return reject(e);
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
            console.log(e);
            resolve([]);
            if (e.message === 'Cannot read property \'length\' of null') {
              // absorb this error from neoscan,
              // happens with a new wallet without any transactions yet
              return;
            }
            alerts.exception(e);
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

  fetchTransactionDetails(hash) {
    const rpcClient = network.getRpcClient();

    return new Promise((resolve, reject) => {
      try {
        const inMemory = _.get(store.state.transactionDetails, hash);
        if (inMemory) {
          inMemory.currentBlockHeight = network.getSelectedNetwork().bestBlock.index;
          inMemory.confirmations = inMemory.currentBlockHeight - inMemory.block;
          return resolve(inMemory);
        }

        return rpcClient.getRawTransaction(hash, 1)
          .then((transaction) => {
            transaction.currentBlockHeight = network.getSelectedNetwork().bestBlock.index;
            if (transaction.confirmations > 0) {
              transaction.confirmed = true;
              transaction.block = transaction.currentBlockHeight - transaction.confirmations;
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

            // pull information for inputs from their previous outputs
            const inputPromises = [];
            transaction.vin.forEach((input) => {
              inputPromises.push(rpcClient
                .getRawTransaction(input.txid, 1)
                .then((inputTransaction) => {
                  const inputSource = inputTransaction.vout[input.vout];
                  if (inputSource.asset === NEO_ASSET_ID || inputSource.asset === `0x${NEO_ASSET_ID}`) {
                    input.symbol = 'NEO';
                  } else if (inputSource.asset === GAS_ASSET_ID || inputSource.asset === `0x${GAS_ASSET_ID}`) {
                    input.symbol = 'GAS';
                  }
                  input.address = inputSource.address;
                  input.value = inputSource.value;
                })
                .catch(e => reject(e)));
            });

            Promise.all(inputPromises)
              .then(() => {
                store.commit('putTransactionDetail', transaction);
                resolve(transaction);
              })
              .catch(e => reject(e));
          })
          .catch((e) => {
            reject(new Error(`NEO RPC Network Error: ${e.message}`));
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

  fetchHoldings(address, restrictToSymbol) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();
    const rpcClient = network.getRpcClient();

    return new Promise((resolve, reject) => {
      try {
        return rpcClient.query({ method: 'getaccountstate', params: [address] })
          .then((res) => {
            const localNep5Balances = [];
            const holdings = [];
            const promises = [];

            if (!_.find(res.result.balances, (o) => {
              return o.asset.replace('0x', '') === NEO_ASSET_ID;
            })) {
              res.result.balances.push({
                asset: NEO_ASSET_ID,
                value: 0,
              });
            }

            if (!_.find(res.result.balances, (o) => {
              return o.asset.replace('0x', '') === GAS_ASSET_ID;
            })) {
              res.result.balances.push({
                asset: GAS_ASSET_ID,
                value: 0,
              });
            }

            res.result.balances.forEach((fetchedBalance) => {
              const holdingBalance = {
                asset: fetchedBalance.asset.replace('0x', ''),
                balance: fetchedBalance.value,
                symbol: fetchedBalance.asset.replace('0x', '') === NEO_ASSET_ID ? 'NEO' : 'GAS',
                name: fetchedBalance.asset.replace('0x', '') === NEO_ASSET_ID ? 'NEO' : 'GAS',
                isNep5: false,
                contractBalance: new BigNumber(0),
                totalBalance: new BigNumber(0),
              };
              if (restrictToSymbol && holdingBalance.symbol !== restrictToSymbol) {
                return;
              }
              if (holdingBalance.symbol === 'NEO') {
                promises.push(api.getMaxClaimAmountFrom({
                  net: currentNetwork.net,
                  url: currentNetwork.rpc,
                  address: currentWallet.address,
                  privateKey: currentWallet.privateKey,
                }, api.neoscan)
                  .then((res) => {
                    holdingBalance.availableToClaim = toBigNumber(res);
                  })
                  .catch((e) => {
                    alerts.networkException(e);
                  }));
              }

              promises.push(dex.fetchContractBalance(holdingBalance.asset)
                .then((res) => {
                  holdingBalance.contractBalance = toBigNumber(res);
                  holdingBalance.totalBalance = toBigNumber(holdingBalance.balance)
                    .plus(holdingBalance.contractBalance).plus(holdingBalance.openOrdersBalance);
                })
                .catch((e) => {
                  alerts.networkException(e);
                }));
              promises.push(dex.fetchOpenOrderBalance(holdingBalance.asset)
                .then((res) => {
                  holdingBalance.openOrdersBalance = toBigNumber(res);
                  holdingBalance.totalBalance = toBigNumber(holdingBalance.balance)
                    .plus(holdingBalance.contractBalance).plus(holdingBalance.openOrdersBalance);
                })
                .catch((e) => {
                  alerts.networkException(e);
                }));
              holdings.push(holdingBalance);
            });

            tokens.getAllAsArray().forEach((nep5) => {
              if (nep5.network !== currentNetwork.net) {
                return;
              }

              const inMemory = _.get(store.state.nep5Balances, nep5.assetId);

              if (restrictToSymbol && nep5.symbol !== restrictToSymbol) {
                return;
              }

              if (inMemory && inMemory.balance === 0) {
                if (inMemory.balance > 0 || nep5.isCustom === true) {
                  holdings.push(inMemory);
                }
                return;
              }

              const nep5balance = {
                asset: nep5.assetId.replace('0x', ''),
                balance: new BigNumber(0),
                symbol: '',
                name: '',
                isNep5: true,
                isCustom: nep5.isCustom,
                contractBalance: new BigNumber(0),
                totalBalance: new BigNumber(0),
              };
              localNep5Balances.push(nep5balance);

              promises.push(this.fetchNEP5Balance(address, nep5.assetId)
                .then((val) => {
                  if (!val.symbol) {
                    return; // token not found on this network
                  }

                  nep5balance.balance = val.balance;
                  nep5balance.symbol = val.symbol;
                  nep5balance.name = val.name;
                  nep5balance.totalBalance = toBigNumber(nep5balance.balance).plus(nep5balance.contractBalance);

                  if (val.balance > 0 || nep5.isCustom === true) {
                    if (nep5.isCustom !== true && nep5balance.totalBalance.isGreaterThan(0)) {
                      // saw a balance > 0 on this token but we haven't explicitly added to our tokens we hold,
                      // mark isCustom = true so it will stay there until explicitly removed
                      nep5.isCustom = true;
                      tokens.add(nep5);
                    }

                    holdings.push(nep5balance);
                  }
                })
                .catch((e) => {
                  if (e.message.indexOf('Expected a hexstring but got') > -1) {
                    tokens.remove(nep5.assetId, currentNetwork.net);
                  }
                  alerts.networkException(e);
                  reject(e);
                }));

              promises.push(dex.fetchContractBalance(nep5balance.asset)
                .then((res) => {
                  nep5balance.contractBalance = toBigNumber(res);
                  nep5balance.totalBalance = toBigNumber(nep5balance.balance)
                    .plus(nep5balance.contractBalance).plus(nep5balance.openOrdersBalance);
                })
                .catch((e) => {
                  alerts.networkException(e);
                }));
              promises.push(dex.fetchOpenOrderBalance(nep5balance.asset)
                .then((res) => {
                  nep5balance.openOrdersBalance = toBigNumber(res);
                  nep5balance.totalBalance = toBigNumber(nep5balance.balance)
                    .plus(nep5balance.contractBalance).plus(nep5balance.openOrdersBalance);
                })
                .catch((e) => {
                  alerts.networkException(e);
                }));
            });

            return Promise.all(promises)
              .then(() => {
                const valuationsPromises = [];
                const lowercaseCurrency = settings.getCurrency().toLowerCase();

                holdings.forEach((holdingBalance) => {
                  valuationsPromises.push((done) => {
                    valuation.getValuation(holdingBalance.symbol)
                      .then((val) => {
                        holdingBalance.totalSupply = val.total_supply;
                        holdingBalance.marketCap = val[`market_cap_${lowercaseCurrency}`];
                        holdingBalance.change24hrPercent = val.percent_change_24h;
                        holdingBalance.unitValue = val[`price_${lowercaseCurrency}`];
                        holdingBalance.unitValue24hrAgo = holdingBalance.unitValue
                          / (1 + (holdingBalance.change24hrPercent / 100.0));
                        holdingBalance.change24hrValue = (holdingBalance.unitValue * holdingBalance.balance)
                          - (holdingBalance.unitValue24hrAgo * holdingBalance.balance);
                        holdingBalance.totalValue = holdingBalance.unitValue * holdingBalance.balance;
                        if (holdingBalance.unitValue === null) {
                          holdingBalance.totalValue = null;
                          holdingBalance.change24hrPercent = null;
                          holdingBalance.change24hrValue = null;
                        }

                        store.commit('putAllNep5Balances', localNep5Balances);
                        done();
                      })
                      .catch((e) => {
                        alerts.networkException(e);
                        done(e);
                      });
                  });
                });

                return Async.series(valuationsPromises, (e) => {
                  if (e) {
                    return reject(e);
                  }
                  const res = { };

                  res.holdings = _.sortBy(holdings, [holding => holding.symbol.toLowerCase()], ['symbol']);
                  res.totalBalance = _.sumBy(holdings, 'totalValue');
                  res.change24hrValue = _.sumBy(holdings, 'change24hrValue');
                  res.change24hrPercent = Math.round(10000 * (res.change24hrValue
                    / (res.totalBalance - res.change24hrValue))) / 100.0;

                  return resolve(res);
                });
              })
              .catch(e => reject(e));
          })
          .catch((e) => {
            reject(new Error(`NEO RPC Network Error: ${e.message}`));
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

  getHolding(assetId) {
    const holding = _.find(store.state.holdings, (o) => {
      return o.asset === assetId;
    });

    if (holding) {
      if (holding.balance && !isBigNumber(holding.balance)) {
        holding.balance = toBigNumber(holding.balance);
      }
      if (holding.contractBalance && !isBigNumber(holding.contractBalance)) {
        holding.contractBalance = toBigNumber(holding.contractBalance);
      }
      if (!holding.totalBalance) {
        holding.totalBalance = holding.balance.plus(holding.contractBalance);
      }
      if (holding.totalBalance && !isBigNumber(holding.totalBalance)) {
        holding.totalBalance = toBigNumber(holding.totalBalance);
      }
    }

    return holding;
  },

  fetchNEP5Tokens() {
    const currentNetwork = network.getSelectedNetwork();

    return new Promise((resolve, reject) => {
      try {
        const defaultList = [{
          symbol: 'APH',
          assetId: '591eedcd379a8981edeefe04ef26207e1391904a',
          isCustom: true, // always show even if 0 balance
          name: 'Aphelion',
          network: 'TestNet',
        }, {
          symbol: 'APH',
          assetId: 'a0777c3ce2b169d4a23bcba4565e3225a0122d95',
          isCustom: true, // always show even if 0 balance,
          name: 'Aphelion',
          network: 'MainNet',
        },
        ];
        const localTokens = [];

        defaultList.forEach((token) => {
          localTokens.push(token);
        });
        try {
          return axios.get(`${currentNetwork.aph}/tokens`)
            .then((res) => {
              res.data.tokens.forEach((fetchedToken) => {
                const token = {
                  symbol: fetchedToken.symbol,
                  assetId: fetchedToken.scriptHash.replace('0x', ''),
                  isCustom: false,
                  name: fetchedToken.name,
                  network: currentNetwork.net,
                };
                let isDefaultToken = false;
                defaultList.forEach((defaultToken) => {
                  if (defaultToken.assetId === token.assetId && defaultToken.network === token.network) {
                    isDefaultToken = true;
                  }
                });
                if (fetchedToken.sale) {
                  token.sale = fetchedToken.sale;
                }
                if (!isDefaultToken) {
                  localTokens.push(token);
                }
              });

              tokens.putAll(localTokens);
            })
            .catch((e) => {
              alerts.exception(new Error(`APH API Error: ${e.message}`));
            });
        } catch (e) {
          return reject(e);
        }
      } catch (e) {
        return reject(e);
      }
    });
  },

  fetchNEP5Balance(address, assetId) {
    const currentNetwork = network.getSelectedNetwork();

    return new Promise((resolve) => {
      return api.nep5.getToken(currentNetwork.rpc, assetId, address)
        .then((token) => {
          resolve({
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            totalSupply: token.totalSupply,
            balance: token.balance,
          });
        })
        .catch(() => {
          resolve({ balance: 0 });
        });
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
            alerts.exception(new Error(`APH API Error: ${e.message}`));
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
  sendFunds(toAddress, assetId, amount, isNep5, callback) {
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
        console.log(e);
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

            if (isNep5) {
              // don't wait for confirmation to be able to send again
              store.commit('setSendInProgress', false);
            }

            res.tx.lastBroadcasted = moment().utc();
            return this.monitorTransactionConfirmation(res.tx)
              .then(() => {
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
        return reject(e);
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

    return api.getBalanceFrom({
      net: currentNetwork.net,
      url: currentNetwork.rpc,
      address: currentWallet.address,
    }, api.neoscan)
    // maybe we should stand up our own version ?
      .then((balance) => {
        if (balance.net !== currentNetwork.net) {
          alerts.error('Unable to read address balance from neonDB or neoscan api. Please try again later.');
          return null;
        }
        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          address: currentWallet.address,
          privateKey: currentWallet.privateKey,
          balance: balance.balance,
          intents: api.makeIntent(intentAmounts, toAddress),
        };

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
        }

        return api.sendAsset(config)
          .then(res => res)
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
      gas: 0,
    };

    if (currentWallet.isLedger === true) {
      config.signingFunction = ledger.signWithLedger;
      config.address = currentWallet.address;

      return api.doInvoke(config)
        .then(res => res)
        .catch((e) => {
          alerts.exception(e);
        });
    }

    const account = new wallet.Account(currentWallet.wif);
    config.account = account;

    return api.doInvoke(config)
      .then(res => res)
      .catch((e) => {
        alerts.exception(e);
      });
  },

  monitorTransactionConfirmation(tx, checkRpcForDetails) {
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          const startedMonitoring = moment().utc();
          const interval = setInterval(() => {
            if (moment().utc().diff(startedMonitoring, 'milliseconds') > timeouts.MONITOR_TRANSACTIONS
                && checkRpcForDetails !== true) {
              clearInterval(interval);
              reject('Timed out waiting for transaction to be returned from block explorer');
              return;
            }

            if (moment().utc().diff(tx.lastBroadcasted, 'milliseconds') > intervals.REBROADCAST_TRANSACTIONS) {
              tx.lastBroadcasted = moment().utc();
              api.sendTx({
                tx,
                url: network.getSelectedNetwork().rpc,
              });
              return;
            }

            const txInHistory = _.find(store.state.recentTransactions, { hash: tx.hash });

            if (!txInHistory && checkRpcForDetails === true
              && moment().utc().diff(startedMonitoring, 'milliseconds') >= intervals.BLOCK) {
              this.fetchTransactionDetails(tx.hash)
                .then((transactionDetails) => {
                  if (transactionDetails && transactionDetails.confirmed) {
                    alerts.success(`TX: ${transactionDetails.txid} CONFIRMED`);
                    clearInterval(interval);
                    resolve(transactionDetails);
                  }
                })
                .catch(() => {
                  if (moment().utc().diff(startedMonitoring, 'milliseconds') >= intervals.BLOCK * 2) {
                    reject('Transaction confirmation failed.');
                  }
                });
            }

            if (txInHistory) {
              alerts.success(`TX: ${tx.hash} CONFIRMED`);
              clearInterval(interval);
              resolve(txInHistory);
            }
          }, 1000);
        }, 15 * 1000); // wait a block for propagation
        return null;
      } catch (e) {
        return reject(e);
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
      .then((h) => {
        const neoAmount = h.holdings[0].balance;
        const callback = () => {
          gasClaim.step = 2;
        };
        gasClaim.neoTransferAmount = neoAmount;
        gasClaim.step = 1;


        if (h.holdings.length === 0 || h.holdings[0].balance <= 0) {
          this.sendClaimGas(gasClaim);
        } else {
          // send neo to ourself to make all gas available for claim
          this.sendFunds(currentWallet.address, NEO_ASSET_ID, neoAmount, false, callback)
            .then(() => {
              setTimeout(() => {
                // send the claim gas
                this.sendClaimGas(gasClaim);
              }, 30 * 1000);
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
                if (tokens.tokenExists(scriptHash.replace('0x', ''), currentNetwork.net) !== true) {
                  tokens.add({
                    symbol: token.symbol,
                    assetId: scriptHash.replace('0x', ''),
                    isCustom: true,
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
        reject(e);
      }
    });
  },

};

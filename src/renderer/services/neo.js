import {
  wallet,
  api,
  u,
} from '@cityofzion/neon-js';
import { BigNumber } from 'bignumber.js';

import alerts from './alerts';
import network from './network';
import settings from './settings';
import tokens from './tokens';
import valuation from './valuation';
import wallets from './wallets';
import ledger from './ledger';
import { store } from '../store';
import { timeouts, intervals } from '../constants';

const toBigNumber = value => new BigNumber(String(value));
const GAS_ASSET_ID = '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';
const NEO_ASSET_ID = '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';

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
          .then((res) => {
            this.fetchNEP5Transfers(address, fromDate, toDate, fromBlock, toBlock)
              .then((nep5) => {
                const splitTransactions = [];

                nep5.data.transfers.forEach((t) => {
                  res.push({
                    txid: t.transactionHash.replace('0x', ''),
                    symbol: t.symbol,
                    value: toBigNumber(t.received - t.sent),
                    block_index: t.blockIndex,
                    blockHeight: t.blockIndex,
                    block_time: t.blockTime,
                    isNep5: true,
                    from: t.fromAddress,
                    to: t.toAddress,
                    vin: [{
                      address: t.fromAddress,
                      symbol: t.symbol,
                      value: toBigNumber(Math.abs(t.received - t.sent)),
                    }],
                    vout: [{
                      address: t.toAddress,
                      symbol: t.symbol,
                      value: toBigNumber(Math.abs(t.received - t.sent)),
                    }],
                  });
                });

                const promises = [];
                res.forEach((t) => {
                  if (fromBlock && t.blockHeight < fromBlock) {
                    return;
                  }
                  if (toBlock && t.blockHeight > toBlock) {
                    return;
                  }
                  promises.push(this.fetchTransactionDetails(t.txid)
                    .then((transactionDetails) => {
                      if (!transactionDetails) {
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

                      if (t.isNep5 !== true) {
                        let movedNEO = false;
                        let movedGAS = false;
                        let outNEO = toBigNumber(0);
                        let outGAS = toBigNumber(0);

                        transactionDetails.vin.forEach((i) => {
                          if (i.address === address && i.symbol === 'NEO') {
                            outNEO = outNEO.plus(i.value);
                            movedNEO = true;
                          }
                          if (i.address === address && i.symbol === 'GAS') {
                            outGAS = outGAS.plus(i.value);
                            movedGAS = true;
                          }
                        });

                        let inNEO = toBigNumber(0);
                        let inGAS = toBigNumber(0);
                        transactionDetails.vout.forEach((o) => {
                          if (o.address === address && o.symbol === 'NEO') {
                            inNEO = inNEO.plus(o.value);
                            movedNEO = true;
                          }
                          if (o.address === address && o.symbol === 'GAS') {
                            inGAS = inGAS.plus(o.value);
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

                          transactionDetails.vin.forEach((i) => {
                            if (i.symbol === 'NEO') {
                              if (neoChange.isGreaterThan(0)) {
                                if (i.address !== address) {
                                  t.from = i.address;
                                }
                              } else if (i.address === address) {
                                t.from = i.address;
                              }
                            }
                          });

                          transactionDetails.vout.forEach((o) => {
                            if (o.symbol === 'NEO') {
                              if (neoChange.isGreaterThan(0)) {
                                if (o.address === address) {
                                  t.to = o.address;
                                }
                              } else if (o.address !== address) {
                                t.to = o.address;
                              }
                            }
                          });

                          splitTransactions.push({
                            hash: t.txid,
                            block_index: transactionDetails.block,
                            symbol: transactionDetails.symbol,
                            value: toBigNumber(neoChange),
                            block_time: transactionDetails.blocktime,
                            details: transactionDetails,
                            isNep5: false,
                            from: t.from,
                            to: t.to,
                          });
                        }

                        if (movedGAS === true) {
                          transactionDetails.symbol = 'GAS';

                          transactionDetails.vin.forEach((i) => {
                            if (i.symbol === 'GAS') {
                              if (gasChange.isGreaterThan(0)) {
                                if (i.address !== address) {
                                  t.from = i.address;
                                }
                              } else if (i.address === address) {
                                t.from = i.address;
                              }
                            }
                          });

                          transactionDetails.vout.forEach((o) => {
                            if (o.symbol === 'GAS') {
                              if (gasChange.isGreaterThan(0)) {
                                if (o.address === address) {
                                  t.to = o.address;
                                }
                              } else if (o.address !== address) {
                                t.to = o.address;
                              }
                            }
                          });

                          splitTransactions.push({
                            hash: t.txid,
                            block_index: transactionDetails.block,
                            symbol: transactionDetails.symbol,
                            value: toBigNumber(gasChange),
                            block_time: transactionDetails.blocktime,
                            details: transactionDetails,
                            isNep5: false,
                            from: t.from,
                            to: t.to,
                          });
                        }
                      } else {
                        transactionDetails.vout = t.vout;
                        transactionDetails.vin = t.vin;
                        transactionDetails.symbol = t.symbol;
                        splitTransactions.push({
                          hash: t.txid,
                          block_index: transactionDetails.block,
                          symbol: t.symbol,
                          value: toBigNumber(t.value),
                          block_time: transactionDetails.blocktime,
                          details: transactionDetails,
                          from: t.from,
                          to: t.to,
                        });

                        const inMemoryHolding = _.find(store.state.nep5Balances, (o) => {
                          return o.symbol === t.symbol;
                        });
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
        return api.loadBalance(api.getTransactionHistoryFrom, {
          address,
          net: currentNetwork.net,
        })
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
        const inMemory = _.find(store.state.transactionDetails, (o) => {
          return o.txid.indexOf(hash) > -1;
        });
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
              if (output.asset === NEO_ASSET_ID) {
                output.symbol = 'NEO';
              } else if (output.asset === GAS_ASSET_ID) {
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
                  if (inputSource.asset === NEO_ASSET_ID) {
                    input.symbol = 'NEO';
                  } else if (inputSource.asset === GAS_ASSET_ID) {
                    input.symbol = 'GAS';
                  }
                  input.address = inputSource.address;
                  input.value = inputSource.value;
                })
                .catch(e => reject(e)));
            });

            Promise.all(inputPromises)
              .then(() => {
                store.state.transactionDetails.push(transaction);
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
            const holdings = [];
            const promises = [];

            if (!_.find(res.result.balances, (o) => {
              return o.asset === NEO_ASSET_ID;
            })) {
              res.result.balances.push({
                asset: NEO_ASSET_ID,
                value: 0,
              });
            }

            if (!_.find(res.result.balances, (o) => {
              return o.asset === GAS_ASSET_ID;
            })) {
              res.result.balances.push({
                asset: GAS_ASSET_ID,
                value: 0,
              });
            }

            res.result.balances.forEach((b) => {
              const h = {
                asset: b.asset,
                balance: b.value,
                symbol: b.asset === NEO_ASSET_ID ? 'NEO' : 'GAS',
                name: b.asset === NEO_ASSET_ID ? 'NEO' : 'GAS',
                isNep5: false,
              };
              if (restrictToSymbol && h.symbol !== restrictToSymbol) {
                return;
              }
              if (h.symbol === 'NEO') {
                promises.push(api.loadBalance(api.getMaxClaimAmountFrom, {
                  net: currentNetwork.net,
                  address: currentWallet.address,
                  privateKey: currentWallet.privateKey,
                })
                  .then((res) => {
                    h.availableToClaim = toBigNumber(res);
                  })
                  .catch((e) => {
                    alerts.networkException(e);
                  }));
              }
              holdings.push(h);
            });

            tokens.getAllAsArray().forEach((nep5) => {
              if (nep5.network !== currentNetwork.net) {
                return;
              }
              const inMemory = _.find(store.state.nep5Balances, (o) => {
                return o.asset === nep5.assetId;
              });
              if (inMemory && inMemory.balance === 0) {
                if (inMemory.balance > 0 || nep5.isCustom === true) {
                  if (restrictToSymbol && inMemory.symbol !== restrictToSymbol) {
                    return;
                  }

                  holdings.push(inMemory);
                }
                return;
              }

              promises.push(this.fetchNEP5Balance(address, nep5.assetId)
                .then((val) => {
                  if (!val.symbol) {
                    return; // token not found on this network
                  }

                  const h = {
                    asset: nep5.assetId,
                    balance: val.balance,
                    symbol: val.symbol,
                    name: val.name,
                    isNep5: true,
                    isCustom: nep5.isCustom,
                  };
                  store.state.nep5Balances.push(h);

                  if (val.balance > 0 || nep5.isCustom === true) {
                    if (restrictToSymbol && h.symbol !== restrictToSymbol) {
                      return;
                    }

                    holdings.push(h);
                  }
                })
                .catch((e) => {
                  if (e.message.indexOf('Expected a hexstring but got') > -1) {
                    tokens.remove(nep5.assetId, currentNetwork.net);
                  }
                  alerts.networkException(e);
                  reject(e);
                }));
            });

            return Promise.all(promises)
              .then(() => {
                const valuationsPromises = [];
                const lowercaseCurrency = settings.getCurrency().toLowerCase();

                holdings.forEach((h) => {
                  valuationsPromises.push(valuation.getValuation(h.symbol)
                    .then((val) => {
                      h.totalSupply = val.total_supply;
                      h.marketCap = val[`market_cap_${lowercaseCurrency}`];
                      h.change24hrPercent = val.percent_change_24h;
                      h.unitValue = val[`price_${lowercaseCurrency}`];
                      h.unitValue24hrAgo = h.unitValue / (1 + (h.change24hrPercent / 100.0));
                      h.change24hrValue = (h.unitValue * h.balance)
                        - (h.unitValue24hrAgo * h.balance);
                      h.totalValue = h.unitValue * h.balance;
                      if (h.unitValue === null) {
                        h.totalValue = null;
                        h.change24hrPercent = null;
                        h.change24hrValue = null;
                      }
                    })
                    .catch((e) => {
                      alerts.networkException(e);
                    }));
                });

                return Promise.all(valuationsPromises)
                  .then(() => {
                    const res = { };

                    res.holdings = _.sortBy(holdings, [holding => holding.symbol.toLowerCase()], ['symbol']);

                    res.totalBalance = 0;
                    res.change24hrValue = 0;
                    holdings.forEach((h) => {
                      res.totalBalance += h.totalValue;
                      res.change24hrValue += h.change24hrValue;
                    });
                    res.change24hrPercent = Math.round(10000 * (res.change24hrValue
                      / (res.totalBalance - res.change24hrValue))) / 100.0;
                    resolve(res);
                  })
                  .catch(e => reject(e));
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

        defaultList.forEach((t) => {
          tokens.add(t);
        });
        try {
          return axios.get(`${currentNetwork.aph}/tokens`)
            .then((res) => {
              res.data.tokens.forEach((t) => {
                const token = {
                  symbol: t.symbol,
                  assetId: t.scriptHash.replace('0x', ''),
                  isCustom: false,
                  name: t.name,
                  network: currentNetwork.net,
                };
                let isDefaultToken = false;
                defaultList.forEach((defaultToken) => {
                  if (defaultToken.assetId === token.assetId) {
                    isDefaultToken = true;
                  }
                });
                if (t.sale) {
                  token.sale = t.sale;
                }
                if (!isDefaultToken) {
                  tokens.add(token);
                }
              });
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

    return api.loadBalance(api.getBalanceFrom, {
      net: currentNetwork.net,
      address: currentWallet.address,
    })
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

  monitorTransactionConfirmation(tx) {
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          const startedMonitoring = moment().utc();
          const interval = setInterval(() => {
            if (moment().utc().diff(startedMonitoring, 'milliseconds') > timeouts.MONITOR_TRANSACTIONS) {
              clearInterval(interval);
              reject('Timed out waiting for transaction to be returned from third party block explorer');
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

    api.loadBalance(api.getMaxClaimAmountFrom, {
      net: network.getSelectedNetwork().net,
      address: wallets.getCurrentWallet().address,
      privateKey: wallets.getCurrentWallet().privateKey,
    })
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
                tokens.add({
                  symbol: token.symbol,
                  assetId: scriptHash.replace('0x', ''),
                  isCustom: true,
                  network: currentNetwork.net,
                });

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

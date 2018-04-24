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

const toBigNumber = value => new BigNumber(String(value));
const neoAssetId = '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
const gasAssetId = '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';

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
                    value: new BigNumber(t.received - t.sent).toFormat(8),
                    block_index: t.blockIndex,
                    blockHeight: t.blockIndex,
                    block_time: t.blockTime,
                    isNep5: true,
                    from: t.fromAddress,
                    to: t.toAddress,
                    vin: [{
                      address: t.fromAddress,
                      symbol: t.symbol,
                      value: new BigNumber(Math.abs(t.received - t.sent)).toFormat(8),
                    }],
                    vout: [{
                      address: t.toAddress,
                      symbol: t.symbol,
                      value: new BigNumber(Math.abs(t.received - t.sent)).toFormat(8),
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
                        let outNEO = new BigNumber(0);
                        let outGAS = new BigNumber(0);

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

                        let inNEO = new BigNumber(0);
                        let inGAS = new BigNumber(0);
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
                            value: neoChange,
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
                            value: gasChange,
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
                          value: t.value,
                          block_time: transactionDetails.blocktime,
                          details: transactionDetails,
                          from: t.from,
                          to: t.to,
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
                alerts.exception(e);
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
            alerts.exception(e);
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

  fetchSystemTransactions(address) {
    return new Promise((resolve, reject) => {
      try {
        return api.neonDB.getTransactionHistory(network.getSelectedNetwork().net, address)
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
    return new Promise((resolve, reject) => {
      try {
        return network.getSelectedNetwork().rpcClient.getBlockCount()
          .then((blockCount) => {
            network.getSelectedNetwork().rpcClient.getRawTransaction(hash, 1)
              .then((transaction) => {
                transaction.currentBlockHeight = blockCount;
                if (transaction.confirmations > 0) {
                  transaction.confirmed = true;
                  transaction.block = blockCount - transaction.confirmations;
                } else {
                  transaction.confirmed = false;
                }


                // set output symbols based on asset ids
                transaction.vout.forEach((output) => {
                  if (output.asset === neoAssetId) {
                    output.symbol = 'NEO';
                  } else if (output.asset === gasAssetId) {
                    output.symbol = 'GAS';
                  }
                });

                // pull information for inputs from their previous outputs
                const inputPromises = [];
                transaction.vin.forEach((input) => {
                  inputPromises.push(network.getSelectedNetwork().rpcClient
                    .getRawTransaction(input.txid, 1)
                    .then((inputTransaction) => {
                      const inputSource = inputTransaction.vout[input.vout];
                      if (inputSource.asset === neoAssetId) {
                        input.symbol = 'NEO';
                      } else if (inputSource.asset === gasAssetId) {
                        input.symbol = 'GAS';
                      }
                      input.address = inputSource.address;
                      input.value = inputSource.value;
                    })
                    .catch(e => reject(e)));
                });

                Promise.all(inputPromises)
                  .then(() => resolve(transaction))
                  .catch(e => reject(e));
              })
              .catch(e => reject(e));
          })
          .catch(() => resolve(null));
      } catch (e) {
        return reject(e);
      }
    });
  },

  fetchHoldings(address, restrictToSymbol) {
    return new Promise((resolve, reject) => {
      try {
        return network.getSelectedNetwork().rpcClient.query({ method: 'getaccountstate', params: [address] })
          .then((res) => {
            const holdings = [];
            const promises = [];

            if (!_.find(res.result.balances, (o) => {
              return o.asset === neoAssetId;
            })) {
              res.result.balances.push({
                asset: neoAssetId,
                value: 0,
              });
            }

            if (!_.find(res.result.balances, (o) => {
              return o.asset === gasAssetId;
            })) {
              res.result.balances.push({
                asset: gasAssetId,
                value: 0,
              });
            }

            res.result.balances.forEach((b) => {
              const h = {
                asset: b.asset,
                balance: b.value,
                symbol: b.asset === neoAssetId ? 'NEO' : 'GAS',
                name: b.asset === neoAssetId ? 'NEO' : 'GAS',
                isNep5: false,
              };
              if (restrictToSymbol && h.symbol !== restrictToSymbol) {
                return;
              }
              if (h.symbol === 'NEO') {
                promises.push(api.getMaxClaimAmountFrom({
                  net: network.getSelectedNetwork().net,
                  address: wallets.getCurrentWallet().address,
                  privateKey: wallets.getCurrentWallet().privateKey,
                }, api.neonDB)
                  .then((res) => {
                    h.availableToClaim = toBigNumber(res).toNumber();
                  })
                  .catch((e) => {
                    alerts.exception(e);
                  }));
              }
              holdings.push(h);
            });

            tokens.getAllAsArray().forEach((nep5) => {
              if (nep5.network !== network.getSelectedNetwork().net) {
                return;
              }
              promises.push(this.fetchNEP5Balance(address, nep5.assetId)
                .then((val) => {
                  if (!val.symbol) {
                    return; // token not found on this network
                  }

                  if (val.balance > 0 || nep5.isCustom === true) {
                    const h = {
                      asset: nep5.assetId,
                      balance: val.balance,
                      symbol: val.symbol,
                      name: val.name,
                      isNep5: true,
                      isCustom: nep5.isCustom,
                    };

                    if (restrictToSymbol && h.symbol !== restrictToSymbol) {
                      return;
                    }

                    holdings.push(h);
                  }
                })
                .catch((e) => {
                  if (e.message.indexOf('Expected a hexstring but got') > -1) {
                    tokens.remove(nep5.assetId, network.getSelectedNetwork().net);
                  }
                  alerts.exception(e);
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
                      alerts.exception(e);
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
          .catch(e => reject(e));
      } catch (e) {
        return reject(e);
      }
    });
  },

  fetchNEP5Tokens() {
    return new Promise((resolve, reject) => {
      try {
        const defaultList = [{
          symbol: 'APH',
          assetId: '591eedcd379a8981edeefe04ef26207e1391904a',
          isCustom: true, // always show even if 0 balance
          network: 'TestNet',
        }, {
          symbol: 'APH',
          assetId: 'a0777c3ce2b169d4a23bcba4565e3225a0122d95',
          isCustom: true, // always show even if 0 balance
          network: 'MainNet',
        },
        ];

        defaultList.forEach((t) => {
          tokens.add(t);
        });
        try {
          return axios.get(`${network.getSelectedNetwork().aph}/tokens`)
            .then((res) => {
              res.data.tokens.forEach((t) => {
                tokens.add({
                  symbol: t.symbol,
                  assetId: t.scriptHash.replace('0x', ''),
                  isCustom: false,
                  network: network.getSelectedNetwork().net,
                });
              });
            })
            .catch(() => {
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
    return new Promise((resolve) => {
      return api.nep5.getToken(network.getSelectedNetwork().rpc, assetId, address)
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
    return new Promise((resolve) => {
      try {
        /* eslint-disable max-len */
        const requestUrl = `${network.getSelectedNetwork().aph}/transfers/${address}?fromTimestamp=${fromDate ? fromDate.unix() : null}&toTimestamp=${toDate ? toDate.unix() : null}&fromBlock=${fromBlock}&toBlock=${toBlock}`;
        /* eslint-enable max-len */
        return axios.get(requestUrl)
          .then((res) => {
            network.getSelectedNetwork().lastSuccessfulRequest = moment.utc();
            resolve(res);
          })
          .catch(() => {
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
  sendFunds(toAddress, assetId, amount, isNep5) {
    return new Promise((resolve, reject) => {
      let sendPromise = null;
      try {
        toAddress = toAddress.trim();
        if (wallet.isAddress(toAddress) === false) {
          return reject(`Invalid to address. ${toAddress}`);
        }

        if (isNep5 === false) {
          if (assetId === neoAssetId) {
            sendPromise = this.sendSystemAsset(toAddress, amount, 0);
          } else if (assetId === gasAssetId) {
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
        sendPromise
          .then((res) => {
            if (!res || !res.tx) {
              return reject('Failed to create transaction.');
            }
            alerts.success(`Transaction Hash: ${res.tx.hash} Sent, waiting for confirmation.`);
            return this.monitorTransactionConfirmation(res.tx.hash)
              .then(() => {
                return resolve(res.tx);
              })
              .catch((e) => {
                alerts.error(e);
              });
          })
          .catch((e) => {
            alerts.exception(e);
          });
        return sendPromise;
      } catch (e) {
        return reject(e);
      }
    });
  },

  sendSystemAsset(toAddress, neoAmount, gasAmount) {
    const intentAmounts = {};
    if (neoAmount > 0) {
      intentAmounts.NEO = neoAmount;
    }
    if (gasAmount > 0) {
      intentAmounts.GAS = gasAmount;
    }

    const currentWallet = wallets.getCurrentWallet();
    return api.getBalanceFrom({
      net: network.getSelectedNetwork().net,
      address: currentWallet.address,
    }, api.neonDB)
    // or api.neoscan? sometimes these apis go down or are unreliable
    // maybe we should stand up our own version ?
      .then((balance) => {
        if (balance.net !== network.getSelectedNetwork().net) {
          alerts.error('Unable to read address balance from neonDB. Please try again later.');
          return null;
        }
        const config = {
          net: network.getSelectedNetwork().net,
          address: wallets.getCurrentWallet().address,
          privateKey: wallets.getCurrentWallet().privateKey,
          balance: balance.balance,
          intents: api.makeIntent(intentAmounts, toAddress),
        };

        if (wallets.getCurrentWallet().isLedger === true) {
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
    const gasAmount = _.find(store.state.holdings, (o) => {
      return o.asset === gasAssetId;
    }).balance;

    if (gasAmount < 0.00000001) {
      return new Promise((reject) => {
        alerts.error('At least one drop of GAS is required to send NEP5 transfers.');
        reject('At least one drop of GAS is required to send NEP5 transfers.');
      });
    }

    const config = {
      net: network.getSelectedNetwork().net,
      script: {
        scriptHash: assetId,
        operation: 'transfer',
        args: [
          u.reverseHex(wallet.getScriptHashFromAddress(wallets.getCurrentWallet().address)),
          u.reverseHex(wallet.getScriptHashFromAddress(toAddress)),
          new u.Fixed8(amount).toReverseHex(),
        ],
      },
      gas: 0,
    };

    if (wallets.getCurrentWallet().isLedger === true) {
      config.signingFunction = ledger.signWithLedger;
      config.address = wallets.getCurrentWallet().address;
      const intents = api.makeIntent({ GAS: 0.00000001 }, config.address);
      config.intents = intents;

      return api.doInvoke(config)
        .then(res => res)
        .catch((e) => {
          alerts.exception(e);
        });
    }

    const account = new wallet.Account(wallets.getCurrentWallet().wif);
    config.account = account;
    const intents = api.makeIntent({ GAS: 0.00000001 }, wallets.getCurrentWallet().address);
    config.intents = intents;

    return api.doInvoke(config)
      .then(res => res)
      .catch((e) => {
        alerts.exception(e);
      });
  },

  monitorTransactionConfirmation(hash) {
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          const interval = setInterval(() => {
            this.fetchTransactionDetails(hash)
              .then((res) => {
                if (res && res.confirmed === true) {
                  alerts.success(`TX: ${hash} CONFIRMED`);
                  clearInterval(interval);
                  resolve(res);
                }
                return res;
              })
              .catch((e) => {
                if (e.message === 'Unknown transaction') {
                  return reject('Transaction failed. Please wait several blocks for balance to update and try again.');
                }
                return alerts.exception(e);
              });
          }, 5000);
        }, 15 * 1000); // wait a block for propagation
        return null;
      } catch (e) {
        return reject(e);
      }
    });
  },

  claimGas() {
    if (new Date() - lastClaimSent < 5 * 60 * 1000) { // 5 minutes ago
      return new Promise((reject) => {
        alerts.error('May only claim GAS once every 5 minutes.');
        reject('May only claim GAS once every 5 minutes.');
      });
    }

    // force neonDB for these, neoscan seems to be unreliable
    api.setApiSwitch(1);
    api.setSwitchFreeze(true);

    lastClaimSent = new Date();
    return this.fetchHoldings(wallets.getCurrentWallet().address, 'NEO')
      .then((h) => {
        if (h.holdings.length === 0 || h.holdings[0].balance <= 0) {
          alerts.error('No NEO to claim from.');
          api.setSwitchFreeze(false);
          return;
        }

        const neoAmount = h.holdings[0].balance;
        alerts.success(`Transfering ${neoAmount} NEO to self.`);
        // send neo to ourself to make all gas available for claim
        this.sendFunds(wallets.getCurrentWallet().address, neoAssetId, neoAmount, false)
          .then(() => {
            const config = {
              net: network.getSelectedNetwork().net,
              address: wallets.getCurrentWallet().address,
              privateKey: wallets.getCurrentWallet().privateKey,
            };

            // send the claim gas
            setTimeout(() => {
              if (wallets.getCurrentWallet().isLedger === true) {
                config.signingFunction = ledger.signWithLedger;
                alerts.success('Creating Gas Claim Transaction.');
              }

              api.claimGas(config)
                .then((res) => {
                  alerts.success('Gas Claim Sent.');
                  h.availableToClaim = 0;
                  api.setSwitchFreeze(false);
                  return res;
                })
                .catch((e) => {
                  alerts.exception(e);
                  api.setSwitchFreeze(false);
                });
            }, 30 * 1000);
          })
          .catch((e) => {
            alerts.exception(e);
            api.setSwitchFreeze(false);
          });
      })
      .catch((e) => {
        alerts.exception(e);
        api.setSwitchFreeze(false);
      });
  },

};

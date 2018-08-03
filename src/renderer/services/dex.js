import {
  wallet,
  sc,
  api,
  u,
  tx,
} from '@cityofzion/neon-js';
import Vue from 'vue';
import { BigNumber } from 'bignumber.js';
import tokens from './tokens';
import alerts from './alerts';
import neo from './neo';
import network from './network';
import wallets from './wallets';
import ledger from './ledger';
import { store } from '../store';
import { toBigNumber } from './formatting.js';

import { assets, claiming, intervals } from '../constants';

const TX_ATTR_USAGE_SENDER = 0xfa;
const TX_ATTR_USAGE_SCRIPT = 0x20;
const TX_ATTR_USAGE_HEIGHT = 0xf0;

const TX_ATTR_USAGE_WITHDRAW_STEP = 0xF1;
const TX_ATTR_USAGE_WITHDRAW_ADDRESS = 0xF2;
const TX_ATTR_USAGE_WITHDRAW_ASSET_ID = 0xF3;
const TX_ATTR_USAGE_WITHDRAW_AMOUNT = 0xF4;
const TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL = 0xF5;
const WITHDRAW_STEP_MARK = '91';
const WITHDRAW_STEP_WITHDRAW = '92';

let lastUTXOWithdrawn;

export default {
  fetchMarkets() {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/markets`)
          .then((res) => {
            resolve(res.data.markets);
          })
          .catch((e) => {
            alerts.exception(new Error(`APH API Error: ${e.message}`));
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  formOrderBook(asks, bids) {
    const book = {
      asks: [],
      bids: [],
    };

    asks.forEach((l) => {
      l.price = toBigNumber(l[0]);
      l.quantity = toBigNumber(l[1]);
      book.asks.push(l);
    });
    bids.forEach((l) => {
      l.price = toBigNumber(l[0]);
      l.quantity = toBigNumber(l[1]);
      book.bids.push(l);
    });

    this.setOrderBookMeta(book);
    return book;
  },

  setOrderBookMeta(book) {
    let totalAsk = new BigNumber(0);

    book.asks = _.sortBy(book.asks, [level => level.price.toNumber()]);
    book.bids = _.sortBy(book.bids, [level => level.price.toNumber()]).reverse();

    book.asks.forEach((l) => {
      totalAsk = totalAsk.plus(l.quantity);
    });
    let totalBid = new BigNumber(0);
    book.bids.forEach((l) => {
      totalBid = totalBid.plus(l.quantity);
    });

    if (book.asks.length > 0 && book.bids.length > 0) {
      book.spread = book.asks[0].price - book.bids[0].price;
      book.spreadPercentage = Math.round((book.spread / book.asks[0].price) * 10000) / 100;
    }

    let runningAsks = new BigNumber(0);
    book.asks.forEach((l) => {
      runningAsks = runningAsks.plus(l.quantity);
      l.quantityTotalRatio = runningAsks.dividedBy(totalAsk);
      l.quantityRatio = l.quantity.dividedBy(totalAsk);
    });
    let runningBids = new BigNumber(0);
    book.bids.forEach((l) => {
      runningBids = runningBids.plus(l.quantity);
      l.quantityTotalRatio = runningBids.dividedBy(totalBid);
      l.quantityRatio = l.quantity.dividedBy(totalBid);
    });

    return book;
  },

  updateOrderBook(book, side, changes) {
    const sideLevels = side === 'ask' ? book.asks : book.bids;
    changes.forEach((c) => {
      const price = toBigNumber(c[0]);
      const remainingQuantity = toBigNumber(c[1]);
      const pendingQuantity = toBigNumber(c[2]);

      const availableQuantity = remainingQuantity.minus(pendingQuantity);
      let quantity;
      if (availableQuantity.isLessThan(0)) {
        quantity = new BigNumber(0);
      } else {
        quantity = availableQuantity;
      }

      const level = _.find(sideLevels, (o) => {
        return o.price.isEqualTo(price);
      });

      if (!level) {
        if (quantity.isGreaterThan(0)) {
          sideLevels.push({
            price,
            quantity,
          });
        }
      } else if (quantity.isLessThanOrEqualTo(0)) {
        sideLevels.splice(sideLevels.indexOf(level), 1);
      } else {
        level.price = price;
        level.quantity = quantity;
      }
    });

    this.setOrderBookMeta(book);
    return book;
  },

  fetchTradeHistory(marketName) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/trades/${marketName}?contractScriptHash=${assets.DEX_SCRIPT_HASH}`)
          .then((res) => {
            if (!res || !res.data || !res.data.trades) {
              resolve({
                date: moment().unix(),
                trades: [],
                getBars: () => {
                },
              });
              return;
            }

            const history = {
              date: res.data.timestamp,
              trades: res.data.trades,
              getBars: this.getTradeHistoryBars,
            };
            const todayCutoff = moment().startOf('day').unix();
            const todayTrades = _.filter(history.trades, (trade) => {
              return trade.tradeTime >= todayCutoff;
            });
            if (todayTrades.length > 0) {
              history.close24Hour = todayTrades[0].price;
              history.open24Hour = todayTrades[todayTrades.length - 1].price;
              history.low24Hour = _.minBy(todayTrades, (t) => { return t.price; }).price;
              history.high24Hour = _.maxBy(todayTrades, (t) => { return t.price; }).price;
              history.volume24Hour = _.sumBy(todayTrades, (t) => { return t.quantity; });
              history.change24HourPercent = Math.round(((history.close24Hour - history.open24Hour)
                / history.open24Hour) * 10000) / 100;
              history.change24Hour = history.close24Hour - history.open24Hour;
            } else {
              if (history.trades.length > 0) {
                history.close24Hour = history.trades[0].price;
                history.open24Hour = history.trades[0].price;
                history.low24Hour = history.trades[0].price;
                history.high24Hour = history.trades[0].price;
              }
              history.volume24Hour = 0;
              history.change24Hour = 0;
              history.change24HourPercent = 0;
            }
            resolve(history);
          })
          .catch((e) => {
            alerts.exception(new Error(`APH API Error: ${e.message}`));
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  getTradeHistoryBars(trades, resolution, from, to) {
    const bars = [];
    resolution = parseFloat(resolution) * 60 * 1000;
    let currentBar = {
      open: 0,
      close: trades.length > 0 ? trades[0].price : 0,
      high: 0,
      low: trades.length > 0 ? 99999999 : 0,
      volume: 0,
      time: (to * 1000) - resolution,
    };

    for (let i = 0; i < trades.length; i += 1) {
      const t = trades[i];

      if (t.tradeTime >= from && t.tradeTime <= to) {
        if ((t.tradeTime * 1000) < currentBar.time) {
          bars.unshift(currentBar);
          currentBar = {
            open: 0,
            close: t.price,
            high: 0,
            low: 99999999,
            volume: 0,
            time: currentBar.time - resolution,
          };
        }

        while ((t.tradeTime * 1000) < currentBar.time) {
          currentBar.open = t.price;
          currentBar.close = t.price;
          currentBar.high = t.price;
          currentBar.low = t.price;
          bars.unshift(currentBar);

          currentBar = {
            open: 0,
            close: t.price,
            high: 0,
            low: 99999999,
            volume: 0,
            time: currentBar.time - resolution,
          };
        }

        currentBar.volume += t.quantity;
        currentBar.open = t.price;
        if (t.price > currentBar.high) {
          currentBar.high = t.price;
        }
        if (t.price < currentBar.low) {
          currentBar.low = t.price;
        }
      } else {
        while ((t.tradeTime * 1000) < currentBar.time) {
          currentBar.open = t.price;
          currentBar.close = t.price;
          currentBar.high = t.price;
          currentBar.low = t.price;
          bars.unshift(currentBar);

          currentBar = {
            open: 0,
            close: t.price,
            high: 0,
            low: 99999999,
            volume: 0,
            time: currentBar.time - resolution,
          };
        }
      }
    }
    return bars;
  },

  fetchOrderHistory() {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();
        axios.get(`${currentNetwork.aph}/orders/${currentWallet.address}?contractScriptHash=${assets.DEX_SCRIPT_HASH}`)
          .then((res) => {
            const orders = res.data.orders;
            orders.forEach((order) => {
              const marketForOrder = _.filter(store.state.markets, (market) => {
                return market.marketName === order.marketName;
              });

              if (!marketForOrder || marketForOrder.length === 0) {
                return;
              }

              if (order.side === 'Buy') {
                order.assetIdToGive = marketForOrder[0].baseAssetId;
                order.quantityToGive = order.price * order.quantity;
              } else {
                order.assetIdToGive = marketForOrder[0].quoteAssetId;
                order.quantityToGive = order.quantity;
              }
            });
            resolve(orders);
          })
          .catch((e) => {
            alerts.exception(new Error(`APH API Error: ${e.message}`));
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  fetchContractBalance(assetId) {
    return new Promise((resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();
        const addressScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);

        this.executeReadOnlyContractOperation('getBalance', [
          u.reverseHex(assetId.replace('0x', '')),
          u.reverseHex(addressScriptHash),
        ])
          .then((res) => {
            if (res.success && res.result.length >= 1) {
              resolve(u.fixed82num(res.result));
            } else if (res.success && res.result === '0') {
              resolve(0);
            } else {
              resolve(0);
            }
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  fetchOpenOrderBalance(assetId) {
    return new Promise((resolve, reject) => {
      try {
        const openOrdersForAsset = _.filter(store.state.orderHistory, (order) => {
          return order.assetIdToGive === assetId && (order.status === 'Open' || order.status === 'PartiallyFilled');
        });

        resolve(_.sumBy(openOrdersForAsset, (order) => {
          return order.quantity === order.quantityToGive
            ? order.quantityRemaining : order.quantityRemaining * order.price;
        }));
      } catch (e) {
        reject(`Error fetching open order balance for ${assetId}. Error: ${e.message}`);
      }
    });
  },

  formOrder(order) {
    return new Promise((resolve, reject) => {
      try {
        if (!order.quantity) {
          reject('Invalid quantity.');
          return;
        }

        if (order.quantity.isLessThan(new BigNumber(order.market.minimumSize))) {
        /* eslint-disable max-len */
          reject(`Quantity less than Minimum Size for ${order.market.marketName}. (${order.market.minimumSize} ${order.market.quoteCurrency})`);
          return;
        }

        if (order.price && order.price.mod(new BigNumber(order.market.minimumTickSize)).isEqualTo(0) === false) {
        /* eslint-disable max-len */
          reject(`Price must be a multiple of the Minimum Tick Size for ${order.market.marketName} (${order.market.minimumTickSize} ${order.market.baseCurrency})`);
          return;
        }

        // sell
        order.assetIdToBuy = order.market.baseAssetId;
        if (order.price) {
          order.quantityToBuy = order.quantity.multipliedBy(order.price).toString();
        }
        order.assetIdToSell = order.market.quoteAssetId;
        order.quantityToSell = order.quantity.toString();

        if (order.side === 'Buy') {
          order.assetIdToBuy = order.market.quoteAssetId;
          order.quantityToBuy = order.quantity.toString();
          order.assetIdToSell = order.market.baseAssetId;
          if (order.price) {
            order.quantityToSell = order.quantity.multipliedBy(order.price).toString();
          }
        }

        const currentNetwork = network.getSelectedNetwork();
        // call API to get offers to take
        /* eslint-disable max-len */
        axios.get(`${currentNetwork.aph}/book/match/${order.market.marketName}?side=${order.side}&quantity=${order.quantity.toString()}&limit=${order.price ? order.price.toString() : ''}`)
          .then((res) => {
            if (!res.data) {
              reject(new Error('APH API Invalid Response'));
              return;
            }

            order.offersToTake = res.data.offersToTake;

            order.quantityToTake = new BigNumber(res.data.quantityToTake);
            order.quantityToMake = order.quantity.minus(order.quantityToTake);
            order.minTakerFees = new BigNumber(res.data.minTakerFees);
            order.maxTakerFees = new BigNumber(res.data.maxTakerFees);
            if (order.price !== null) {
              order.expectedQuantityToGive = order.side === 'Buy' ? order.quantityToMake.multipliedBy(order.price) : order.quantityToMake;
              order.expectedQuantityToReceive = order.side === 'Buy' ? order.quantityToMake : order.quantityToMake.multipliedBy(order.price);
            } else {
              order.expectedQuantityToGive = new BigNumber(0);
              order.expectedQuantityToReceive = new BigNumber(0);
            }

            order.offersToTake.forEach((offer) => {
              offer.quantity = new BigNumber(offer.quantity);
              offer.price = new BigNumber(offer.price);
              if (offer.isBackupOffer !== true) {
                order.expectedQuantityToGive = order.expectedQuantityToGive.plus(order.side === 'Buy' ? offer.quantity.multipliedBy(offer.price) : offer.quantity);
                order.expectedQuantityToReceive = order.expectedQuantityToReceive.plus(order.side === 'Buy' ? offer.quantity : offer.quantity.multipliedBy(offer.price));
              }
            });

            if (!order.price) {
              let quantityToGive = new BigNumber(0);
              order.offersToTake.forEach((o) => {
                quantityToGive = quantityToGive.plus(o.quantity.multipliedBy(o.price));
              });
              if (order.side === 'Sell') {
                order.quantityToBuy = quantityToGive.toNumber();
              } else {
                order.quantityToSell = quantityToGive.toNumber();
              }
            }

            const sellAssetHolding = neo.getHolding(order.assetIdToSell);
            if (sellAssetHolding === null) {
              reject(`Order requires ${order.quantityToSell} to be placed. Your current Balance is 0`);
              return;
            } else if (sellAssetHolding.totalBalance.isLessThan(new BigNumber(order.quantityToSell))) {
              /* eslint-disable max-len */
              reject(`Order requires ${order.quantityToSell} ${sellAssetHolding.symbol} to be placed. Your current ${sellAssetHolding.symbol} Balance is ${sellAssetHolding.totalBalance}`);
              return;
            }

            if (order.maxTakerFees > 0) {
              const aphHolding = neo.getHolding(assets.APH);
              if (aphHolding.totalBalance.isLessThan(order.maxTakerFees)) {
                reject(`Order may require up to ${order.maxTakerFees} APH to be processed. Your current APH Balance is ${aphHolding.totalBalance}`);
                return;
              }
            }

            if (!order.price) {
              if (order.offersToTake.length === 0) {
                reject('No offers available to match Market Order.');
                return;
              }
              if (order.quantityToTake.isLessThan(order.quantity)) {
                // market order, but didn't match enough order quantity to take, adjust the quantity
                order.quantity = order.quantityToTake;
                order.changedQuantity = true;
              }
            }

            this.formDepositsForOrder(order);
            resolve(order);
          })
          .catch((e) => {
            reject(new Error(`APH API Error: ${e.message}`));
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  placeOrder(order, waitForDeposits) {
    return new Promise((resolve, reject) => {
      try {
        if (order.postOnly && order.offersToTake.length > 0) {
          reject('Post Only order would take open offers.');
          return;
        }

        this.formDepositsForOrder(order);

        if (order.deposits.length > 0) {
          if (waitForDeposits) {
            // we have deposits pending, wait for our balance to reflect
            setTimeout(() => {
              this.placeOrder(order, true);
            }, 5000);
            return;
          }

          this.makeOrderDeposits(order)
            .then((o) => {
              this.placeOrder(o, true);
            })
            .catch(() => {
              reject('Failed to make automatic deposits');
            });

          Vue.set(order, 'status', 'Depositing');
          return;
        }

        Vue.set(order, 'status', 'Submitting');

        // build all the order transactions
        const buildPromises = [];
        order.offersToTake.forEach((o) => {
          buildPromises.push(this.buildAcceptOffer((order.side === 'Buy' ? 'Sell' : 'Buy'), order.market, o));
        });

        if (order.quantityToTake < order.quantity) {
          order.quantity = order.quantity.minus(new BigNumber(order.quantityToTake));
          buildPromises.push(this.buildAddOffer(order));
        }

        Promise.all(buildPromises)
          .then(() => {
            // send the signed transactions to the api for relay
            const currentNetwork = network.getSelectedNetwork();
            axios.post(`${currentNetwork.aph}/order`, JSON.stringify({
              market: order.market.marketName,
              postOnly: order.postOnly,
              side: order.side,
              orderType: order.orderType,
              offersToTake: order.offersToTake,
              quantityToTake: order.quantityToTake,
              makerTx: order.makerTx,
              quantityToMake: order.quantity,
            }), {
              headers: {
                'Content-Type': 'application/json',
              },
            })
              .then((res) => {
                if (res.data.result && res.data.quantityToTake === res.data.quantityTaken) {
                  resolve(res.data.transactionsSent.length);
                  // for some reason this resolve isn't getting sent back to actions, temp fix here
                  alerts.success(`${res.data.transactionsSent.length} orders relayed.`);
                  store.commit('setOrderToConfirm', null);
                  store.commit('endRequest', { identifier: 'placeOrder' });
                } else if (res.data.result && res.data.quantityTaken > 0) {
                  // didn't match enough quantity, try to form a new order and place it again
                  order.quantity = new BigNumber(res.data.quantityToTake - res.data.quantityTaken);
                  this.formOrder(order)
                    .then((f) => {
                      this.placeOrder(f)
                        .then((o2) => {
                          resolve(o2);
                        });
                    })
                    .catch((e) => {
                      reject(e);
                    });
                  return;
                } else if (res.data.result.error) {
                  reject(`Order failed. Error: ${res.data.result.error}`);
                } else {
                  reject('Order failed.');
                }

                store.commit('setAssetHoldingsNeedRefresh', [order.assetIdToBuy, order.assetIdToSell]);
              })
              .catch((e) => {
                // console.log(e);
                reject(new Error(`APH API Error: ${e.message}`));
              });
          })
          .catch(e => reject(e));
      } catch (e) {
        reject(e);
      }
    });
  },

  formDepositsForOrder(order) {
    let totalQuantityToSell = new BigNumber(0);
    let totalFees = new BigNumber(0);
    const sellAssetHolding = neo.getHolding(order.assetIdToSell);

    if (order.price) {
      // limit order
      if (sellAssetHolding.canPull === false && order.quantity.isGreaterThan(0)) {
        // this is an MCT based token that can not be pulled from our DEX contract, have to send a deposit first
        totalQuantityToSell = order.side === 'Buy' ? order.quantity.multipliedBy(order.price) : order.quantity;
      } else if (sellAssetHolding.decimals < 8) {
        // this is a token with < 8 decimals, NEO for example, make the deposit of the minimum amount needed to make the order
        totalQuantityToSell = order.side === 'Buy' ? order.quantity.multipliedBy(order.price) : order.quantity;
      }

      // back out portion of order that will be matched as taker trades
      totalQuantityToSell = totalQuantityToSell.minus(order.side === 'Buy' ? order.quantityToTake.multipliedBy(order.price) : order.quantityToTake);
    }

    order.offersToTake.forEach((offer) => {
      if (offer.isBackupOffer !== true) {
        totalQuantityToSell = totalQuantityToSell.plus(order.side === 'Buy' ? offer.quantity.multipliedBy(offer.price) : offer.quantity);
        totalFees = totalFees.plus(order.side === 'Buy' ? order.market.buyFee : order.market.sellFee);
      }
    });

    order.deposits = [];

    if (totalFees.isGreaterThan(0)) {
      const aphAssetHolding = neo.getHolding(assets.APH);
      if (order.assetIdToSell === assets.APH) {
        totalQuantityToSell = totalQuantityToSell.plus(totalFees);
      } else if (aphAssetHolding.contractBalance.isLessThan(new BigNumber(totalFees))) {
        order.deposits.push({
          symbol: aphAssetHolding.symbol,
          assetId: assets.APH,
          currentQuantity: new BigNumber(aphAssetHolding.contractBalance),
          quantityRequired: new BigNumber(totalFees),
          quantityToDeposit: new BigNumber(totalFees).minus(aphAssetHolding.contractBalance),
        });
      }
    }

    if (sellAssetHolding.contractBalance.isLessThan(new BigNumber(totalQuantityToSell))) {
      let quantityToDeposit = new BigNumber(totalQuantityToSell).minus(sellAssetHolding.contractBalance);
      if (sellAssetHolding.decimals < 8) {
        const toDepositTruncated = new BigNumber(quantityToDeposit.toFixed(sellAssetHolding.decimals));
        if (toDepositTruncated.isGreaterThanOrEqualTo(quantityToDeposit)) {
          quantityToDeposit = toDepositTruncated;
        } else {
          quantityToDeposit = toDepositTruncated.plus(1 / (10 ** sellAssetHolding.decimals));
        }
      }

      order.deposits.push({
        symbol: sellAssetHolding.symbol,
        assetId: order.assetIdToSell,
        currentQuantity: new BigNumber(sellAssetHolding.contractBalance),
        quantityRequired: new BigNumber(totalQuantityToSell),
        quantityToDeposit,
      });
    }
  },

  makeOrderDeposits(order) {
    return new Promise((resolve, reject) => {
      try {
        const depositPromises = [];
        order.deposits.forEach((d) => {
          depositPromises.push(this.depositAsset(d.assetId, d.quantityToDeposit.toNumber()));
        });

        const watchInterval = setInterval(() => {
          let waiting = false;
          order.deposits.forEach((deposit) => {
            const holding = neo.getHolding(deposit.assetId);
            if (holding.contractBalance.isLessThan(deposit.quantityRequired)) {
              waiting = true;
            }
          });

          if (waiting === false) {
            clearInterval(watchInterval);
            resolve(order);
          }
        }, intervals.BLOCK);

        Promise.all(depositPromises)
          .then(() => {
            store.dispatch('fetchHoldings', {
              done: () => {
                clearInterval(watchInterval);
                setTimeout(() => {
                  resolve(order);
                }, 5000);
              },
            });
          })
          .catch(e => reject(e));
      } catch (e) {
        reject(e);
      }
    });
  },

  buildAddOffer(order) {
    return new Promise((resolve, reject) => {
      try {
        order.assetIdToBuy = order.market.baseAssetId;
        order.quantityToBuy = order.quantity.multipliedBy(order.price).toString();
        order.assetIdToSell = order.market.quoteAssetId;
        order.quantityToSell = order.quantity.toString();

        if (order.side === 'Buy') {
          order.assetIdToBuy = order.market.quoteAssetId;
          order.quantityToBuy = order.quantity.toString();
          order.assetIdToSell = order.market.baseAssetId;
          order.quantityToSell = order.quantity.multipliedBy(order.price).toString();
        }

        let neoToSend = 0;
        let gasToSend = 0;

        if (order.assetIdToSell === assets.NEO) {
          const neoHolding = neo.getHolding(assets.NEO);
          if (neoHolding.contractBalance < order.quantityToSell) {
            neoToSend = order.quantityToSell - neoHolding.contractBalance;
            if (neoToSend > neoHolding.balance) {
              reject('Insufficient NEO.');
              return;
            }
          }
        }

        if (order.assetIdToSell === assets.GAS) {
          const gasHolding = neo.getHolding(assets.GAS);
          if (gasHolding.contractBalance < order.quantityToSell) {
            gasToSend = order.quantityToSell - gasHolding.contractBalance;
            if (gasToSend > gasHolding.balance) {
              reject('Insufficient GAS.');
              return;
            }
          }
        }

        this.buildContractTransaction('addOffer',
          [
            u.reverseHex(order.assetIdToBuy),
            u.num2fixed8(parseFloat(order.quantityToBuy)),
            u.reverseHex(order.assetIdToSell),
            u.num2fixed8(parseFloat(order.quantityToSell)),
            u.num2fixed8(new Date().getTime() * 0.00000001),
          ], neoToSend, gasToSend)
          .then((t) => {
            order.makerTx = tx.serializeTransaction(t.tx, true);
            resolve(order);
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  buildAcceptOffer(side, market, offer) {
    return new Promise((resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();

        // offer is a sell offer
        let quantityToGive = offer.quantity.multipliedBy(offer.price);
        let assetIdToGive = market.baseAssetId;
        let quantityToReceive = offer.quantity;
        let assetIdToReceive = market.quoteAssetId;

        if (side === 'Buy') {
          quantityToGive = offer.quantity;
          assetIdToGive = market.quoteAssetId;
          quantityToReceive = offer.quantity.multipliedBy(offer.price);
          assetIdToReceive = market.baseAssetId;
        }

        this.buildContractTransaction('acceptOffer',
          [
            offer.offerId.replace('0x', ''),
            u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address)),
            u.reverseHex(assetIdToGive),
            u.num2fixed8(quantityToGive.toNumber()),
            u.reverseHex(assetIdToReceive),
            u.num2fixed8(quantityToReceive.toNumber()),
            1,
            u.num2fixed8(new Date().getTime() * 0.00000001),
          ])
          .then((t) => {
            offer.tx = tx.serializeTransaction(t.tx, true);
            resolve(offer);
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  cancelOrder(order) {
    return new Promise((resolve, reject) => {
      try {
        this.buildContractTransaction('cancelOffer',
          [
            order.offerId.replace('0x', ''),
          ])
          .then((t) => {
            // send the signed transactions to the api for relay
            const currentNetwork = network.getSelectedNetwork();
            axios.delete(`${currentNetwork.aph}/order/${order.marketName}/${order.offerId}/${tx.serializeTransaction(t.tx, true)}`)
              .then((res) => {
                if (res.data.result) {
                  resolve('Order Cancelled');
                } else {
                  reject('Cancel failed');
                }

                store.commit('setAssetHoldingsNeedRefresh', [order.assetIdToBuy, order.assetIdToSell]);
              })
              .catch((e) => {
                reject(new Error(`APH API Error: ${e.message}`));
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

  depositAsset(assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        let neoToSend = 0;
        let gasToSend = 0;
        let holding = null;

        if (assetId === assets.NEO) {
          holding = neo.getHolding(assets.NEO);
          neoToSend = quantity;
          if (neoToSend > holding.balance) {
            reject('Insufficient NEO.');
            return;
          }
        } else if (assetId === assets.GAS) {
          holding = neo.getHolding(assets.GAS);
          gasToSend = quantity;
          if (gasToSend > holding.balance) {
            reject('Insufficient GAS.');
            return;
          }
        } else {
          holding = neo.getHolding(assetId);
          const holdingAsset = holding != null ? holding.symbol : assetId;
          if (holding == null || holding.balance === null || holding.balance.isLessThan(quantity)) {
            reject(`Insufficient balance of asset '${holdingAsset}'.`);
            return;
          }
          if (holding.needsRefresh === true) {
            reject(`Balance of asset '${holdingAsset}' is currently refreshing. Please try again.`);
            return;
          }
        }

        if (holding.canPull !== false) {
          this.executeContractTransaction('deposit',
            [
              u.reverseHex(assetId),
              u.num2fixed8(quantity),
            ], neoToSend, gasToSend)
            .then((res) => {
              if (res.success) {
                alerts.success('Deposit relayed, waiting for confirmation...');
                neo.monitorTransactionConfirmation(res.tx, true)
                  .then(() => {
                    store.commit('setAssetHoldingsNeedRefresh', [assetId]);

                    resolve(res.tx);
                  })
                  .catch((e) => {
                    reject(`Deposit Failed. ${e.message}`);
                  });
              } else {
                reject('Transaction rejected');
              }

              // Set in memory holding needsRefresh flag to cause retrieving balances again
              store.commit('setAssetHoldingsNeedRefresh', [assetId]);
            })
            .catch((e) => {
              reject(`Deposit Failed. ${e.message}`);
            });
        } else {
          const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
          neo.sendFunds(dexAddress, assetId, quantity, true, () => {
            alerts.success('Deposit relayed, waiting for confirmation...');
          })
            .then((tx) => {
              resolve(tx);

              // Set in memory holding needsRefresh flag to cause retrieving balances again
              store.commit('setAssetHoldingsNeedRefresh', [assetId]);
            })
            .catch((e) => {
              reject(`Deposit Failed. ${e.message}`);
            });
        }
      } catch (e) {
        reject(`Deposit Failed. ${e.message}`);
      }
    });
  },

  withdrawAsset(assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        if (assetId === assets.NEO || assetId === assets.GAS) {
          this.markWithdraw(assetId, quantity)
            .then((res) => {
              if (res.success !== true) {
                reject('Withdraw Mark Step rejected');
                return;
              }

              alerts.success('Withdraw Mark Step Relayed. Waiting for confirmation.');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  setTimeout(() => {
                    this.withdrawSystemAsset(assetId, quantity, res.tx.hash, res.utxoIndex)
                      .then((res) => {
                        if (res.success) {
                          resolve(res.tx);
                        } else {
                          reject('Withdraw rejected');
                        }
                      })
                      .catch((e) => {
                        reject(e);
                      });
                  }, 10000);
                })
                .catch((e) => {
                  reject(e);
                });
            })
            .catch((e) => {
              reject(e);
            });

          return;
        }

        this.withdrawNEP5(assetId, quantity)
          .then((res) => {
            if (res.success) {
              resolve(res.tx);
            } else {
              reject('Withdraw rejected');
            }
          })
          .catch((e) => {
            reject(`Withdraw Failed. ${e.message}`);
          });
      } catch (e) {
        reject(`Withdraw Failed. ${e.message}`);
      }
    });
  },

  markWithdraw(assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: assets.DEX_SCRIPT_HASH,
            operation: 'withdraw',
            args: [
            ],
          },
          fees: currentNetwork.fee,
          gas: 0,
        };

        const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
        if (assetId === assets.NEO) {
          config.intents = api.makeIntent({ NEO: quantity }, assets.DEX_SCRIPT_HASH);
        } else if (assetId === assets.GAS) {
          config.intents = api.makeIntent({ GAS: quantity }, assets.DEX_SCRIPT_HASH);
        }

        quantity = toBigNumber(quantity);

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        let utxoIndex = -1;

        alerts.success('Processing withdraw request...');
        api.fillKeys(config)
          .then((c) => {
            return new Promise((resolveBalance) => {
              api.neoscan.getBalance(c.net, dexAddress)
                .then((balance) => {
                  c.balance = balance;
                  resolveBalance(c);
                })
                .catch((e) => {
                  reject(e);
                });
            });
          })
          .then((c) => {
            return api.createTx(c, 'invocation');
          })
          .then((c) => {
            return new Promise((resolveTx) => {
              this.calculateWithdrawInputsAndOutputs(c, assetId, quantity)
                .then(() => {
                  const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
                  c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_STEP, WITHDRAW_STEP_MARK);
                  c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash);
                  c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ASSET_ID, u.reverseHex(assetId));
                  c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity.toNumber()));
                  c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
                    u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index + 20 : 0));

                  c.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
                  c.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
                    u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0));
                  resolveTx(c);
                })
                .catch(() => {
                  reject('Failed to calculate withdraw inputs and outputs');
                });
            });
          })
          .then((c) => {
            return api.signTx(c);
          })
          .then((c) => {
            const attachInvokedContract = {
              invocationScript: ('00').repeat(2),
              verificationScript: '',
            };

            // We need to order this for the VM.
            const acct = c.privateKey ? new wallet.Account(c.privateKey) : new wallet.Account(c.publicKey);
            if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
              c.tx.scripts.push(attachInvokedContract);
            } else {
              c.tx.scripts.unshift(attachInvokedContract);
            }

            let i = 0;

            c.tx.outputs.forEach((o) => {
              if (utxoIndex === -1 && quantity.isEqualTo(o.value)) {
                utxoIndex = i;
              }
              i += 1;
            });

            if (utxoIndex === -1) {
              throw new Error('Unable to generate valid UTXO');
            }
            return c;
          })
          .then((c) => {
            return api.sendTx(c);
          })
          .then((c) => {
            resolve({
              success: c.response.result,
              tx: c.tx,
              utxoIndex,
            });
          })
          .catch((e) => {
            const dump = {
              net: config.net,
              address: config.address,
              intents: config.intents,
              balance: config.balance,
              script: config.script,
              gas: config.gas,
              tx: config.tx,
            };
            console.log(dump);
            reject(`Failed to Mark Withdraw. ${e.message}`);
          });
      } catch (e) {
        reject(`Failed to Mark Withdraw. ${e.message}`);
      }
    });
  },

  calculateWithdrawInputsAndOutputs(config, assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();
        const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);

        const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
        api.neoscan.getBalance(config.net, dexAddress)
          .then((balance) => {
            config.balance = balance;
            const unspents = assetId === assets.GAS ? config.balance.assets.GAS.unspent : config.balance.assets.NEO.unspent;

            config.tx.inputs = [];
            config.tx.outputs = [];

            const promises = [];
            unspents.forEach((u) => {
              promises.push(this.fetchSystemAssetUTXOReserved(u));
            });

            Promise.all(promises)
              .then(() => {
                let inputTotal = new BigNumber(0);
                _.sortBy(unspents, [unspent => Math.abs(unspent.value.minus(quantity).toNumber())]).reverse().forEach((u) => {
                  if (inputTotal.isGreaterThanOrEqualTo(quantity)) {
                    return;
                  }
                  if (u.reservedFor === currentWalletScriptHash) {
                    this.completeSystemAssetWithdrawals();
                    reject('Already have a UTXO reserved for your address. Completing open withdraw.');
                    return;
                  }
                  if (u.reservedFor && u.reservedFor.length > 0) {
                    // reserved for someone else
                    return;
                  }

                  inputTotal = inputTotal.plus(u.value);
                  config.tx.inputs.push({
                    prevHash: u.txid,
                    prevIndex: u.index,
                  });
                });

                if (inputTotal.isLessThan(quantity)) {
                  reject('Contract does not have enough balance for withdraw.');
                  return;
                }

                config.tx.outputs.push({
                  assetId,
                  scriptHash: assets.DEX_SCRIPT_HASH,
                  value: quantity,
                });

                if (inputTotal.isGreaterThan(quantity)) {
                  // change output
                  config.tx.outputs.push({
                    assetId,
                    scriptHash: assets.DEX_SCRIPT_HASH,
                    value: inputTotal.minus(quantity),
                  });
                }

                resolve(config);
              })
              .catch((e) => {
                reject(`Failed to Calculate Inputs and Outputs for Withdraw. ${e.message}`);
              });
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(`Failed to Calculate Inputs and Outputs for Withdraw. ${e.message}`);
      }
    });
  },

  withdrawNEP5(assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: assets.DEX_SCRIPT_HASH,
            operation: 'withdraw',
            args: [
            ],
          },
          fees: currentNetwork.fee,
          gas: 0,
        };

        config.intents = [];

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        const token = tokens.getOne(assetId, currentNetwork.net);

        api.fillKeys(config)
          .then(() => {
            return api.getBalanceFrom({
              net: currentNetwork.net,
              url: currentNetwork.rpc,
              address: wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH),
            }, api.neoscan);
          })
          .then((c) => {
            config.balance = c.balance;
            config.sendingFromSmartContract = true;
            return api.createTx(config, 'invocation');
          })
          .then((c) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_STEP, WITHDRAW_STEP_WITHDRAW);
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ASSET_ID, u.reverseHex(assetId));
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity));
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index + 20 : 0));

            c.tx.addAttribute(TX_ATTR_USAGE_SENDER, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);

            if (token.canPull !== false) {
              c.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, u.reverseHex(assets.DEX_SCRIPT_HASH));
            }

            c.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0));
            return api.signTx(c);
          })
          .then((c) => {
            if (token.canPull !== false) {
              const attachInvokedContract = {
                invocationScript: ('00').repeat(2),
                verificationScript: '',
              };
              // We need to order this for the VM.
              const acct = c.privateKey ? new wallet.Account(c.privateKey) : new wallet.Account(c.publicKey);
              if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
                c.tx.scripts.push(attachInvokedContract);
              } else {
                c.tx.scripts.unshift(attachInvokedContract);
              }
            }

            return api.sendTx(c);
          })
          .then((c) => {
            resolve({
              success: c.response.result,
              tx: c.tx,
            });
          })
          .catch((e) => {
            const dump = {
              net: config.net,
              address: config.address,
              intents: config.intents,
              balance: config.balance,
              script: config.script,
              gas: config.gas,
              tx: config.tx,
            };
            console.log(dump);
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount) {
    return new Promise((resolve, reject) => {
      try {
        if (!tryCount) {
          tryCount = 1;
        }

        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: assets.DEX_SCRIPT_HASH,
            operation: 'withdraw',
            args: [
            ],
          },
          fees: currentNetwork.fee,
          gas: 0,
        };

        const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
        if (assetId === assets.NEO) {
          config.intents = api.makeIntent({ NEO: quantity }, currentWallet.address);
        } else if (assetId === assets.GAS) {
          config.intents = api.makeIntent({ GAS: quantity }, currentWallet.address);
        }

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        api.fillKeys(config)
          .then((c) => {
            return new Promise((resolveBalance) => {
              api.neoscan.getBalance(c.net, dexAddress)
                .then((balance) => {
                  c.balance = balance;
                  resolveBalance(c);
                })
                .catch((e) => {
                  reject(e);
                });
            });
          })
          .then((c) => {
            return api.createTx(c, 'invocation');
          })
          .then((c) => {
            return new Promise((resolveInputs) => {
              api.neoscan.getBalance(c.net, dexAddress)
                .then((balance) => {
                  const unspents = assetId === assets.GAS ? balance.assets.GAS.unspent : balance.assets.NEO.unspent;
                  const input = _.find(unspents, (o) => {
                    return o.txid === utxoTxHash && o.index === utxoIndex;
                  });

                  if (!input) {
                    // skip displaying this error if we've already relayed this withdraw utxo, retry in case the explorer hasn't picked up the utxo yet
                    if (lastUTXOWithdrawn !== `${utxoTxHash}${utxoIndex}`) {
                      if (tryCount < 3) {
                        setTimeout(() => {
                          this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
                        }, 10000);
                        return;
                      }
                      reject('Unable to find marked input.');
                    }
                    return;
                  }

                  c.tx.inputs = [{
                    prevHash: input.txid,
                    prevIndex: input.index,
                  }];

                  c.tx.outputs = [{
                    assetId,
                    scriptHash: wallet.getScriptHashFromAddress(currentWallet.address),
                    value: input.value,
                  }];

                  resolveInputs(c);
                })
                .catch((e) => {
                  reject(e);
                });
            });
          })
          .then((c) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_STEP, WITHDRAW_STEP_WITHDRAW);
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ASSET_ID, u.reverseHex(assetId));
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity));
            c.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index + 20 : 0));

            c.tx.addAttribute(TX_ATTR_USAGE_SENDER, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0));
            return api.signTx(c);
          })
          .then((c) => {
            const attachInvokedContract = {
              invocationScript: ('00').repeat(2),
              verificationScript: '',
            };

            // We need to order this for the VM.
            const acct = c.privateKey ? new wallet.Account(c.privateKey) : new wallet.Account(c.publicKey);
            if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
              c.tx.scripts.push(attachInvokedContract);
            } else {
              c.tx.scripts.unshift(attachInvokedContract);
            }

            return c;
          })
          .then((c) => {
            return api.sendTx(c);
          })
          .then((c) => {
            if (c.response.result !== true && tryCount < 3) {
              alerts.error('Withdraw rejected by the network. Retrying...');
              setTimeout(() => {
                this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
              }, 10000);
              return;
            }

            if (c.response.result === true) {
              alerts.success('Withdraw relayed, waiting for confirmation...');
              lastUTXOWithdrawn = `${utxoTxHash}${utxoIndex}`;
            }

            resolve({
              success: c.response.result,
              tx: c.tx,
            });
          })
          .catch((e) => {
            if (tryCount < 3) {
              alerts.error('Withdraw failed. Retrying...');
              setTimeout(() => {
                this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
              }, 10000);
              return;
            }

            const dump = {
              net: config.net,
              address: config.address,
              intents: config.intents,
              balance: config.balance,
              script: config.script,
              gas: config.gas,
              tx: config.tx,
            };
            console.log(dump);
            reject(e);
          });
      } catch (e) {
        if (tryCount < 3) {
          alerts.error(`Withdraw failed. Error: ${e.message} Retrying...`);
          setTimeout(() => {
            this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
          }, 10000);
          return;
        }

        reject(e);
      }
    });
  },

  completeSystemAssetWithdrawals() {
    return new Promise((resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();
        const currentNetwork = network.getSelectedNetwork();
        const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
        const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);

        api.neoscan.getBalance(currentNetwork.net, dexAddress)
          .then((balance) => {
            if (balance.assets.GAS) {
              balance.assets.GAS.unspent.forEach((u) => {
                this.fetchSystemAssetUTXOReserved(u)
                  .then(() => {
                    if (u.reservedFor === currentWalletScriptHash) {
                      this.withdrawSystemAsset(assets.GAS, u.value.toNumber(), u.txid, u.index);
                    }
                  })
                  .catch((e) => {
                    reject(e);
                  });
              });
            }
            if (balance.assets.NEO) {
              balance.assets.NEO.unspent.forEach((u) => {
                this.fetchSystemAssetUTXOReserved(u)
                  .then(() => {
                    if (u.reservedFor === currentWalletScriptHash) {
                      this.withdrawSystemAsset(assets.NEO, u.value.toNumber(), u.txid, u.index);
                    }
                  })
                  .catch((e) => {
                    reject(e);
                  });
              });
            }
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  fetchSystemAssetUTXOReserved(input) {
    return new Promise((resolve, reject) => {
      try {
        const prevTxHash = input.prevHash ? input.prevHash : input.txid;
        const prevTxIndex = input.prevIndex ? input.prevIndex : input.index;

        let utxoParam = u.reverseHex(prevTxHash);
        if (prevTxIndex > 0) {
          utxoParam = `${utxoParam}${u.num2hexstring(prevTxIndex)}`; // todo: support > 8bit indexes
        }

        const rpcClient = network.getRpcClient();
        rpcClient.query({
          method: 'getstorage',
          params: [assets.DEX_SCRIPT_HASH, utxoParam],
        })
          .then((res) => {
            if (!!res.result && res.result.length > 0) {
              input.reservedFor = u.reverseHex(res.result);
            }
            resolve(input);
          })
          .catch((e) => {
            reject(`Failed to fetch UTXO Reserved Status from contract storage. ${e.message}`);
          });
      } catch (e) {
        reject(`Failed to fetch UTXO Reserved Status from contract storage. ${e.message}`);
      }
    });
  },

  fetchCommitState(address) {
    return new Promise((resolve, reject) => {
      try {
        this.fetchCommitUserState(address)
          .then((commitState) => {
            this.fetchCommitDEXState()
              .then((dexState) => {
                commitState.totalUnitsContributed = dexState.totalUnitsContributed;
                commitState.lastAppliedFeeSnapshot = dexState.lastAppliedFeeSnapshot;
                commitState.totalFeeUnits = dexState.totalFeeUnits;
                commitState.totalFeesCollected = dexState.totalFeesCollected;

                // Apply the fees not yet applied into the totalFeeUnits to get an accurate calculation.
                if (commitState.lastAppliedFeeSnapshot < commitState.totalFeesCollected) {
                  const feesCollectedSinceSnapshot = commitState.totalFeesCollected - commitState.lastAppliedFeeSnapshot;
                  commitState.totalFeeUnits += feesCollectedSinceSnapshot * commitState.totalUnitsContributed;
                  commitState.lastAppliedFeeSnapshot = commitState.totalFeesCollected;
                }
                commitState.networkWeight = Math.round(commitState.totalFeeUnits - commitState.feeUnitsSnapshot);

                if (commitState.contributionHeight > 0) {
                  commitState.ableToClaimHeight = commitState.contributionHeight + claiming.CLAIM_BLOCKS;
                  commitState.ableToCompoundHeight = commitState.compoundHeight + claiming.COMPOUND_BLOCKS;

                  commitState.feesCollectedSinceCommit = commitState.totalFeesCollected - commitState.feesCollectedSnapshot;
                  commitState.userWeight = commitState.feesCollectedSinceCommit * commitState.quantityCommitted * 100000000;
                  commitState.weightFraction = commitState.networkWeight > 0 ? commitState.userWeight / commitState.networkWeight : 0;
                  commitState.weightPercentage = Math.round(commitState.weightFraction * 100 * 10000) / 10000;

                  commitState.availableToClaim = commitState.feesCollectedSinceCommit * commitState.weightFraction;
                  commitState.availableToClaim = Math.floor(commitState.availableToClaim * 100000000) / 100000000;
                }
                resolve(commitState);
              })
              .catch((e) => {
                reject(`Failed to fetch commit state. ${e.message}`);
              });
          })
          .catch((e) => {
            reject(`Failed to fetch commit state. ${e.message}`);
          });
      } catch (e) {
        reject(`Failed to fetch commit state. ${e.message}`);
      }
    });
  },

  fetchCommitUserState(address) {
    return new Promise((resolve, reject) => {
      try {
        const contributionKey = `${u.reverseHex(wallet.getScriptHashFromAddress(address))}${u.reverseHex(assets.APH)}d0`;

        const rpcClient = network.getRpcClient();
        rpcClient.query({
          method: 'getstorage',
          params: [assets.DEX_SCRIPT_HASH, contributionKey],
        })
          .then((res) => {
            const commitState = {
              userScriptHash: wallet.getScriptHashFromAddress(address),
              quantityCommitted: 0,
              contributionHeight: null,
              contributionTimestamp: null,
              compoundHeight: null,
              feesCollectedSnapshot: 0,
              feeUnitsSnapshot: 0,
            };

            if (!res || !res.result || res.result.length < 120) {
              resolve(commitState);
              return;
            }

            commitState.quantityCommitted = u.fixed82num(res.result.substr(40, 16));
            commitState.contributionHeight = Math.round(u.fixed82num(res.result.substr(56, 16)) * 100000000);
            commitState.compoundHeight = Math.round(u.fixed82num(res.result.substr(72, 16)) * 100000000);
            commitState.feesCollectedSnapshot = u.fixed82num(res.result.substr(88, 16));
            commitState.feeUnitsSnapshot = u.fixed82num(res.result.substr(104, 32));
            // console.log(`got commitState.feeUnitsSnapshot: ${commitState.feeUnitsSnapshot}`);

            rpcClient.getBlock(commitState.contributionHeight)
              .then((data) => {
                commitState.contributionTimestamp = data.time;
                resolve(commitState);
              });
          })
          .catch((e) => {
            reject(`Failed to fetch commit state. ${e.message}`);
          });
      } catch (e) {
        reject(`Failed to fetch commit state. ${e.message}`);
      }
    });
  },

  fetchCommitDEXState() {
    return new Promise((resolve, reject) => {
      try {
        const rpcClient = network.getRpcClient();
        rpcClient.query({
          method: 'getstorage',
          params: [assets.DEX_SCRIPT_HASH, `${u.reverseHex(assets.APH)}fa`],
        })
          .then((res) => {
            const dexState = {
              totalUnitsContributed: 0,
              lastAppliedFeeSnapshot: 0,
              totalFeeUnits: 0,
            };

            if (res.result && res.result.length >= 48) {
              dexState.totalUnitsContributed = u.fixed82num(res.result.substr(0, 16)) * 100000000;
              dexState.lastAppliedFeeSnapshot = u.fixed82num(res.result.substr(16, 32));
              dexState.totalFeeUnits = u.fixed82num(res.result.substr(48, 32));
            }

            rpcClient.query({
              method: 'getstorage',
              params: [assets.DEX_SCRIPT_HASH, `${u.reverseHex(assets.APH)}fc`],
            })
              .then((res) => {
                if (!res || !res.result || res.result.length < 32) {
                  dexState.totalFeesCollected = 0;
                  resolve(dexState);
                  return;
                }

                dexState.totalFeesCollected = u.fixed82num(res.result.substr(0, 16));
                // console.log(`dexState.totalFeesCollected: ${dexState.totalFeesCollected}`);
                resolve(dexState);
              })
              .catch((e) => {
                reject(`Failed to fetch commit state. ${e.message}`);
              });
          })
          .catch((e) => {
            reject(`Failed to fetch commit state. ${e.message}`);
          });
      } catch (e) {
        reject(`Failed to fetch commit state. ${e.message}`);
      }
    });
  },

  commitAPH(quantity) {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('commit',
          [
            u.num2fixed8(quantity),
          ])
          .then((res) => {
            if (res.success) {
              alerts.success('Commit relayed, waiting for confirmation...');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  store.commit('setAssetHoldingsNeedRefresh', [assets.APH]);

                  resolve(res.tx);
                })
                .catch((e) => {
                  reject(e);
                });
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(`Commit Failed. ${e.message}`);
          });
      } catch (e) {
        reject(`Commit Failed. ${e.message}`);
      }
    });
  },

  claimAPH() {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('claim',
          [])
          .then((res) => {
            if (res.success) {
              alerts.success('Claim relayed, waiting for confirmation...');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  store.commit('setAssetHoldingsNeedRefresh', [assets.APH]);

                  resolve(res.tx);
                })
                .catch((e) => {
                  reject(e);
                });
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(`Claim Failed. ${e.message}`);
          });
      } catch (e) {
        reject(`Claim Failed. ${e.message}`);
      }
    });
  },

  compoundAPH() {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('compound',
          [])
          .then((res) => {
            if (res.success) {
              alerts.success('Compound relayed, waiting for confirmation...');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  // Note: Compound doesn't change wallet nep5 balance; no need to require refresh of APH balance here.

                  resolve(res.tx);
                })
                .catch((e) => {
                  reject(e);
                });
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(`Compound Failed. ${e.message}`);
          });
      } catch (e) {
        reject(`Compound Failed. ${e.message}`);
      }
    });
  },

  setMarket(quoteAssetId, baseAssetId, minimumSize, minimumTickSize, buyFee, sellFee) {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('setMarket',
          [
            u.reverseHex(quoteAssetId),
            u.reverseHex(baseAssetId),
            u.num2fixed8(minimumSize),
            u.num2fixed8(minimumTickSize),
            u.num2fixed8(buyFee),
            u.num2fixed8(sellFee),
          ])
          .then((res) => {
            if (res.success) {
              resolve(res.tx);
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  executeReadOnlyContractOperation(operation, parameters) {
    return new Promise((resolve, reject) => {
      try {
        const rpcClient = network.getRpcClient();

        const sb = new sc.ScriptBuilder();
        sb.emitAppCall(assets.DEX_SCRIPT_HASH, operation, parameters);
        const script = sb.str;

        rpcClient.query({
          method: 'invokescript',
          params: [script],
        })
          .then((res) => {
            resolve({
              success: res.result.state && res.result.state.indexOf('FAULT') === -1,
              result: res.result.stack.length > 0 ? res.result.stack[res.result.stack.length - 1].value : '',
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

  buildContractTransaction(operation, parameters, neoToSend, gasToSend) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: assets.DEX_SCRIPT_HASH,
            operation,
            args: parameters,
          },
          fees: currentNetwork.fee,
          gas: 0,
        };

        if (neoToSend > 0 || gasToSend > 0) {
          const assetsForIntent = {};
          if (neoToSend > 0) {
            assetsForIntent.NEO = neoToSend;
          }
          if (gasToSend > 0) {
            assetsForIntent.GAS = gasToSend;
          }
          config.intents = api.makeIntent(assetsForIntent, assets.DEX_SCRIPT_HASH);
        }

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        api.fillKeys(config)
          .then((c) => {
            if (!c.intents) {
              return new Promise((balanceResolve) => {
                c.balance = new wallet.Balance({ address: c.address, net: c.net });
                balanceResolve(c);
              });
            }

            return api.getBalanceFrom(c, api.neoscan);
          })
          .then((c) => {
            return api.createTx(c, 'invocation');
          })
          .then((c) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            c.tx.addAttribute(TX_ATTR_USAGE_SENDER, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
            c.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0));
            return api.signTx(c);
          })
          .then((c) => {
            resolve(c);
          })
          .catch((e) => {
            const dump = {
              net: config.net,
              url: config.url,
              address: config.address,
              intents: config.intents,
              balance: config.balance,
              script: config.script,
              gas: config.gas,
              tx: config.tx,
            };
            console.log(dump);
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

  executeContractTransaction(operation, parameters, neoToSend, gasToSend) {
    return new Promise((resolve, reject) => {
      try {
        this.buildContractTransaction(operation, parameters, neoToSend, gasToSend)
          .then(c => api.sendTx(c))
          .then((c) => {
            resolve({
              success: c.response.result,
              tx: c.tx,
            });
          })
          .catch((e) => {
            console.log(e);
            reject(e);
          });
      } catch (e) {
        reject(e);
      }
    });
  },

};

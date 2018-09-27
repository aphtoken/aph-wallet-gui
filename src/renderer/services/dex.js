import {
  wallet,
  sc,
  api,
  u,
  tx,
} from '@cityofzion/neon-js';
import Vue from 'vue';
import { BigNumber } from 'bignumber.js';
import assets from './assets';
import alerts from './alerts';
import neo from './neo';
import network from './network';
import wallets from './wallets';
import ledger from './ledger';
import { store } from '../store';
import { toBigNumber } from './formatting.js';
import { claiming, intervals } from '../constants';

const TX_ATTR_USAGE_SCRIPT = 0x20;
const TX_ATTR_USAGE_HEIGHT = 0xf0;
const TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE = 0xA1;
const TX_ATTR_USAGE_WITHDRAW_ADDRESS = 0xA2;
const TX_ATTR_USAGE_WITHDRAW_SYSTEM_ASSET_ID = 0xA3;
const TX_ATTR_USAGE_WITHDRAW_NEP5_ASSET_ID = 0xA4;
const TX_ATTR_USAGE_WITHDRAW_AMOUNT = 0xA5;
const TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL = 0xA6;
const SIGNATUREREQUESTTYPE_WITHDRAWSTEP_MARK = '91';
const SIGNATUREREQUESTTYPE_WITHDRAWSTEP_WITHDRAW = '92';
const SIGNATUREREQUESTTYPE_CLAIM_GAS = '94';

let lastUTXOWithdrawn;
const assetUTXOsToIgnore = {};
const contractUTXOsReservedFor = {};

export default {
  fetchMarkets() {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/markets?contractScriptHash=${assets.DEX_SCRIPT_HASH}`)
          .then((res) => {
            resolve(res.data.markets);
          })
          .catch((e) => {
            alerts.exception(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to fetch markets. ${e.message}`);
      }
    });
  },

  formOrderBook(asks, bids) {
    const book = {
      asks: [],
      bids: [],
    };

    asks.forEach((ask) => {
      ask.price = toBigNumber(ask[0]);
      ask.quantity = toBigNumber(ask[1]);
      book.asks.push(ask);
    });
    bids.forEach((bid) => {
      bid.price = toBigNumber(bid[0]);
      bid.quantity = toBigNumber(bid[1]);
      book.bids.push(bid);
    });

    this.setOrderBookMeta(book);
    return book;
  },

  setOrderBookMeta(book) {
    let totalAsk = new BigNumber(0);

    book.asks = _.sortBy(book.asks, [level => level.price.toNumber()]);
    book.bids = _.sortBy(book.bids, [level => level.price.toNumber()]).reverse();

    book.asks.forEach(({ quantity }) => {
      totalAsk = totalAsk.plus(quantity);
    });
    let totalBid = new BigNumber(0);
    book.bids.forEach(({ quantity }) => {
      totalBid = totalBid.plus(quantity);
    });

    if (book.asks.length > 0 && book.bids.length > 0) {
      book.spread = book.asks[0].price - book.bids[0].price;
      book.spreadPercentage = Math.round((book.spread / book.asks[0].price) * 10000) / 100;
    }

    let runningAsks = new BigNumber(0);
    book.asks.forEach((ask) => {
      runningAsks = runningAsks.plus(ask.quantity);
      ask.quantityTotalRatio = runningAsks.dividedBy(totalAsk);
      ask.quantityRatio = ask.quantity.dividedBy(totalAsk);
    });
    let runningBids = new BigNumber(0);
    book.bids.forEach((bid) => {
      runningBids = runningBids.plus(bid.quantity);
      bid.quantityTotalRatio = runningBids.dividedBy(totalBid);
      bid.quantityRatio = bid.quantity.dividedBy(totalBid);
    });

    return book;
  },

  updateOrderBook(book, side, changes) {
    const sideLevels = side === 'ask' ? book.asks : book.bids;
    changes.forEach((change) => {
      const price = toBigNumber(change[0]);
      const remainingQuantity = toBigNumber(change[1]);
      const pendingQuantity = toBigNumber(change[2]);

      const availableQuantity = remainingQuantity.minus(pendingQuantity);
      let quantity;
      if (availableQuantity.isLessThan(0)) {
        quantity = new BigNumber(0);
      } else {
        quantity = availableQuantity;
      }

      const level = _.find(sideLevels, (sideLevel) => {
        return sideLevel.price.isEqualTo(price);
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
              marketName,
              trades: res.data.trades,
              getBars: this.getTradeHistoryBars,
            };

            resolve(history);
          })
          .catch((e) => {
            alerts.exception(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to fetch trade history. ${e.message}`);
      }
    });
  },

  getTradeHistoryBars(tradeHistory, resolution, from, to, last) {
    const bars = [];
    const trades = tradeHistory.trades.slice(0);
    trades.reverse();

    // convert resolution to seconds
    resolution = parseFloat(resolution) * 60;

    // round to even interval
    from = Math.round(from / resolution) * resolution;
    to = Math.round(to / resolution) * resolution;

    // convert resolution to milliseconds
    resolution *= 1000;

    let currentBar = {
      open: last,
      close: last,
      high: last,
      low: last,
      volume: 0,
    };

    let apiBucketsIndex = tradeHistory.apiBuckets ? tradeHistory.apiBuckets.length - 1 : 0;
    let tradesIndex = 0;
    const barFrom = (from * 1000) + resolution;
    const barTo = (to * 1000);
    let barPointer = barFrom;
    let bucket = null;
    let trade = null;


    while (barPointer < barTo) {
      currentBar = {
        open: currentBar.close,
        close: currentBar.close,
        high: currentBar.close,
        low: currentBar.close,
        volume: 0,
        time: barPointer,
      };

      bucket = apiBucketsIndex < tradeHistory.apiBuckets.length ? tradeHistory.apiBuckets[apiBucketsIndex] : null;
      trade = tradesIndex < trades.length ? trades[tradesIndex] : null;
      while (trade && trade.tradeTime < from) {
        tradesIndex += 1;
        trade = tradesIndex < trades.length ? trades[tradesIndex] : null;
      }

      if (bucket && bucket.time * 1000 === barPointer) {
        currentBar = {
          open: bucket.open,
          close: bucket.close,
          high: bucket.high,
          low: bucket.low,
          volume: bucket.volume,
          time: barPointer,
        };
        bars.push(bucket);
        apiBucketsIndex += 1;
      } else {
        while (trade
          && trade.tradeTime * 1000 >= barPointer
          && trade.tradeTime * 1000 < barPointer + resolution) {
          currentBar.volume += trade.quantity;
          currentBar.close = trade.price;

          if (currentBar.open === 0) currentBar.open = trade.price;
          if (currentBar.low === 0 || currentBar.low > trade.price) currentBar.low = trade.price;
          if (currentBar.high < trade.price) currentBar.high = trade.price;
          tradesIndex += 1;
          trade = tradesIndex < trades.length ? trades[tradesIndex] : null;
        }

        bars.push(currentBar);
      }

      barPointer += resolution;
    }
    return bars;
  },

  fetchTradesBucketed(marketName, binSize = 1) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/trades/bucketed/${marketName}
?binSize=${binSize}`)
          .then((res) => {
            resolve(res.data.buckets);
          })
          .catch(() => {
            resolve([]);
          });
      } catch (e) {
        reject(`Failed to fetch trade buckets. ${e.message}`);
      }
    });
  },

  fetchOrderHistory(before = 0, after = 0, sort = 'DESC') {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();
        const ordersPageSize = 100;

        axios.get(`${currentNetwork.aph}/orders/${currentWallet.address}
?contractScriptHash=${assets.DEX_SCRIPT_HASH}&pageSize=${ordersPageSize}&before=${before}&after=${after}&sort=${sort}`)
          .then((res) => {
            const orders = res.data.orders;

            // backwards compatible api support
            const totalOrders = res.data.totalCount ? res.data.totalCount : orders.length;

            orders.forEach((order) => {
              const marketForOrder = _.find(store.state.markets, (market) => {
                return market.marketName === order.marketName;
              });

              if (!marketForOrder) {
                return;
              }

              if (order.side === 'Buy') {
                order.assetIdToGive = marketForOrder.baseAssetId;
                order.quantityToGive = order.price * order.quantity;
              } else {
                order.assetIdToGive = marketForOrder.quoteAssetId;
                order.quantityToGive = order.quantity;
              }
            });

            // are we at the last page or we got all of the orders in the first page?
            if (orders.length < ordersPageSize
                || orders.length >= totalOrders) {
              resolve(orders);
            } else {
              const lastOrder = orders[orders.length - 1];
              const nextBefore = (before > 0 || sort === 'DESC') ? lastOrder.created : before;
              const nextAfter = after > 0 ? lastOrder.updated : after;
              // get the next page
              this.fetchOrderHistory(nextBefore, nextAfter, sort)
                .then((nextOrders) => {
                  orders.push(...nextOrders);
                  resolve(orders);
                })
                .catch((e) => {
                  alerts.exception(`APH API Error: ${e}`);
                });
            }
          })
          .catch((e) => {
            alerts.exception(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to fetch order history. ${e.message}`);
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
            reject(`Failed to fetch contract balance. ${e}`);
          });
      } catch (e) {
        reject(`Failed to fetch contract balance. ${e.message}`);
      }
    });
  },

  fetchOpenOrderBalance(assetId) {
    return new Promise((resolve, reject) => {
      try {
        if (!store.state.orderHistory) {
          resolve(0);
          return;
        }

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
        const currentWallet = wallets.getCurrentWallet();
        // call API to get offers to take
        /* eslint-disable max-len */
        axios.get(`${currentNetwork.aph}/book/match/${order.market.marketName}?side=${order.side}&quantity=${order.quantity.toString()}&limit=${order.price ? order.price.toString() : ''}`)
          .then((res) => {
            if (!res.data) {
              reject('APH API Invalid Response');
              return;
            }

            if (res.data.offersToTake.length > 0
              && currentWallet.isLedger === true) {
              reject('Unable to place taker orders with a Ledger');
              return;
            }

            order.offersToTake = res.data.offersToTake;

            order.quantityToTake = new BigNumber(res.data.quantityToTake);
            order.quantityToMake = order.quantity.minus(order.quantityToTake);

            if (order.quantityToTake.isGreaterThan(0)
              && order.quantityToMake.isGreaterThan(0)
              && order.quantityToMake.isLessThan(order.market.minimumSize)) {
              order.quantity = order.quantityToTake;
              order.quantityToMake = new BigNumber(0);
            }

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
              order.offersToTake.forEach(({ quantity, price }) => {
                quantityToGive = quantityToGive.plus(quantity.multipliedBy(price));
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
            reject(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to form order. ${e.message}`);
      }
    });
  },

  placeOrder(order, waitForDeposits) {
    return new Promise(async (resolve, reject) => {
      try {
        if (order.postOnly && order.offersToTake.length > 0) {
          reject('Post Only order would take open offers.');
          return;
        }

        this.formDepositsForOrder(order);

        if (order.deposits.length > 0) {
          if (waitForDeposits) {
            // We have deposits pending, wait for our balance to reflect
            setTimeout(() => {
              this.placeOrder(order, true)
                .then((innerOrder) => {
                  resolve(innerOrder);
                })
                .catch((error) => {
                  reject(`Error sending order. Error: ${error}`);
                });
            }, 5000);
            return;
          }

          this.makeOrderDeposits(order)
            .then(() => {
              setTimeout(() => {
                this.placeOrder(order, true)
                  .then((innerOrder) => {
                    resolve(innerOrder);
                  })
                  .catch((error) => {
                    reject(`Error sending order. Error: ${error}`);
                  });
              }, 500);
            })
            .catch((error) => {
              reject(`Failed to make automatic deposits. Error: ${error}`);
            });

          Vue.set(order, 'status', 'Depositing');
          return;
        }

        Vue.set(order, 'status', 'Submitting');

        // build all the order transactions
        for (let i = 0; i < order.offersToTake.length; i += 1) {
          const offer = order.offersToTake[i];
          /* eslint-disable no-await-in-loop */
          // need to ignore this rule, each of these build operations has to happen in order
          // that way they'll each select the right UTXO inputs
          await this.buildAcceptOffer((order.side === 'Buy' ? 'Sell' : 'Buy'), order.orderType, order.market, offer);
          /* eslint-enable no-await-in-loop */
        }

        if (order.quantityToTake < order.quantity) {
          // there is an amount remaining after taking all available open offers
          // add a new maker offer to the book (if it meets minimum size requirements)
          order.quantity = order.quantity.minus(new BigNumber(order.quantityToTake));
          if (order.quantity.isGreaterThanOrEqualTo(new BigNumber(order.market.minimumSize))) {
            await this.buildAddOffer(order);
          } else {
            order.quantity = new BigNumber();
          }
        }

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
            if (!res.data || !res.data.result) {
              reject('Order failed.');
            } else if (res.data.result.error) {
              reject(`Order failed. Error: ${res.data.result.error}`);
            } else {
              const responseQuantityToTake = new BigNumber(res.data.quantityToTake);
              const responseQuantityTaken = new BigNumber(res.data.quantityTaken);

              if (responseQuantityToTake.isEqualTo(res.data.quantityTaken)) {
                resolve(res.data.transactionsSent.length);
                // for some reason this resolve isn't getting sent back to actions, temp fix here
                alerts.success(`${res.data.transactionsSent.length} orders relayed.`);
                store.commit('setOrderToConfirm', null);
                store.commit('endRequest', { identifier: 'placeOrder' });
              } else if (responseQuantityToTake.isGreaterThan(0)) {
                // didn't match enough quantity, try to form a new order and place it again
                order.quantity = responseQuantityToTake.minus(responseQuantityTaken);
                this.formOrder(order)
                  .then((secondaryFormedOrder) => {
                    this.placeOrder(secondaryFormedOrder)
                      .then((secondaryOrder) => {
                        resolve(secondaryOrder);
                      })
                      .catch((error) => {
                        reject(`Error sending order retry. Error: ${error}`);
                      });
                  })
                  .catch((error) => {
                    reject(`Error sending order retry. Error: ${error}`);
                  });
              }
            }
          })
          .catch((e) => {
            // console.log(e);
            reject(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to place order. ${e}`);
      }
    });
  },

  // Expects a BigNumber
  flooredLogBase2(number) {
    let power = new BigNumber(0);
    for (; number.isGreaterThan(0); number = number.dividedBy(2).decimalPlaces(0, BigNumber.ROUND_DOWN)) {
      power = power.plus(1);
    }
    return power.minus(1);
  },

  calculateFeeAmount(quoteQuantity, minimumTradeSize, baseFee) {
    if (quoteQuantity < minimumTradeSize) {
      return baseFee;
    }
    // Earlier checks guarantee that quoteQuantity > 0
    return this.flooredLogBase2(
      quoteQuantity
        .multipliedBy(2)
        .dividedBy(minimumTradeSize)
        .decimalPlaces(0, BigNumber.ROUND_DOWN))
      .multipliedBy(baseFee);
  },

  formDepositsForOrder(order) {
    let totalQuantityToSell = new BigNumber(0);
    let totalFees = new BigNumber(0);
    const sellAssetHolding = neo.getHolding(order.assetIdToSell);

    if (order.price) {
      // limit order
      let depositMakerQuantity = false;

      if (sellAssetHolding.canPull === false && order.quantity.isGreaterThan(0)) {
        // this is an MCT based token that can not be pulled from our DEX contract, have to send a deposit first
        depositMakerQuantity = true;
      } else if (order.offersToTake.length > 0 && order.quantityToMake.isGreaterThan(0)) {
        // we have maker and taker quantities, need to deposit the maker quanity first because we don't know the order they will be confirmed
        depositMakerQuantity = true;
      }

      if (depositMakerQuantity) {
        totalQuantityToSell = order.side === 'Buy' ? order.quantityToMake.multipliedBy(order.price) : order.quantityToMake;
      }
    }

    order.offersToTake.forEach((offer) => {
      if (offer.isBackupOffer !== true) {
        totalQuantityToSell = totalQuantityToSell.plus(order.side === 'Buy' ? offer.quantity.multipliedBy(offer.price) : offer.quantity);
        const baseFee = order.side === 'Buy' ? order.market.buyFee : order.market.sellFee;
        const fee = this.calculateFeeAmount(offer.quantity, order.market.minimumSize, baseFee);
        totalFees = totalFees.plus(fee);
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
    return new Promise(async (resolve, reject) => {
      try {
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

        for (let i = 0; i < order.deposits.length; i += 1) {
          const deposit = order.deposits[i];
          /* eslint-disable no-await-in-loop */
          // need to ignore this rule, each of these build operations has to happen in order
          // that way they'll each select the right UTXO inputs
          await this.depositAsset(deposit.assetId, deposit.quantityToDeposit.toNumber());
          /* eslint-enable no-await-in-loop */
        }

        store.dispatch('fetchHoldings', {
          done: () => {
            clearInterval(watchInterval);
            setTimeout(() => {
              neo.resetSystemAssetBalanceCache();
              resolve(order);
            }, 5000);
          },
        });
      } catch (e) {
        reject(`Failed to make order deposits. ${e.message ? e.message : e}`);
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
            neoToSend = new BigNumber(order.quantityToSell - neoHolding.contractBalance);

            const toDepositTruncated = new BigNumber(neoToSend.toFixed(0));
            if (toDepositTruncated.isGreaterThanOrEqualTo(neoToSend)) {
              neoToSend = toDepositTruncated;
            } else {
              neoToSend = toDepositTruncated.plus(1);
            }

            if (neoToSend.isGreaterThan(neoHolding.balance)) {
              reject('Insufficient NEO.');
              return;
            }
          }
        }

        if (order.assetIdToSell === assets.GAS) {
          const gasHolding = neo.getHolding(assets.GAS);
          if (gasHolding.contractBalance < order.quantityToSell) {
            gasToSend = new BigNumber(order.quantityToSell - gasHolding.contractBalance);
            if (gasToSend.isGreaterThan(gasHolding.balance)) {
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
          .then((transaction) => {
            order.makerTx = tx.serializeTransaction(transaction.tx, true);
            resolve(order);
          })
          .catch((e) => {
            reject(`Failed to build add offer contract transaction. ${e}`);
          });
      } catch (e) {
        reject(`Failed to build add offer transaction. ${e.message}`);
      }
    });
  },

  buildAcceptOffer(side, orderType, market, offer) {
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
            orderType === 'Market' ? 0 : 1, // whether or not to create a taker offer if this is no longer available
            u.num2fixed8(new Date().getTime() * 0.00000001),
          ])
          .then((transaction) => {
            offer.tx = tx.serializeTransaction(transaction.tx, true);
            resolve(offer);
          })
          .catch((e) => {
            reject(`Failed to build accept offer contract transaction. ${e}`);
          });
      } catch (e) {
        reject(`Failed to build accept offer. ${e.message}`);
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
          .then((transaction) => {
            // send the signed transactions to the api for relay
            const currentNetwork = network.getSelectedNetwork();
            axios.delete(`${currentNetwork.aph}/order/${order.marketName}/${order.offerId}/${tx.serializeTransaction(transaction.tx, true)}`)
              .then((res) => {
                if (res.data.result) {
                  resolve('Order Cancelled');
                } else {
                  reject('Cancel failed');
                }
              })
              .catch((e) => {
                reject(`APH API Error: ${e}`);
              });
          })
          .catch((e) => {
            reject(`Failed to build cancel order contract transaction. ${e}`);
          });
      } catch (e) {
        reject(`Failed to build cancel order transaction. ${e.message}`);
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
                    neo.resetSystemAssetBalanceCache();
                    resolve(res.tx);
                  })
                  .catch((e) => {
                    reject(`Deposit Failed. ${e}`);
                  });
              } else {
                reject('Transaction rejected');
              }
            })
            .catch((e) => {
              reject(`Deposit Failed. ${e}`);
            });
        } else {
          const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
          neo.sendFunds(dexAddress, assetId, quantity, true, () => {
            alerts.success('Deposit relayed, waiting for confirmation...');
          })
            .then((tx) => {
              resolve(tx);
            })
            .catch((e) => {
              reject(`Deposit Failed. ${e}`);
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
                        reject(`Failed to withdraw system asset. ${e}`);
                      });
                  }, 10000);
                })
                .catch((e) => {
                  reject(`Failed to monitor transaction for confirmation. ${e}`);
                  this.completeSystemAssetWithdrawals();
                });
            })
            .catch((e) => {
              reject(`Failed to mark system asset for withdrawal. ${e}`);
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
            reject(`Withdraw Failed. ${e}`);
          });
      } catch (e) {
        reject(`Withdraw Failed. ${e.message}`);
      }
    });
  },

  markWithdraw(assetId, quantity, tryCount = 1) {
    return new Promise((resolve, reject) => {
      const currentNetwork = network.getSelectedNetwork();
      const currentWallet = wallets.getCurrentWallet();
      // console.log(`markWithdraw assetId ${assetId} quantity ${quantity} tryCount ${tryCount}`);
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

      try {
        quantity = toBigNumber(quantity);

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        let utxoIndex = -1;

        const assetHolding = neo.getHolding(assetId);
        if (tryCount > 1) {
          alerts.success(`Processing withdraw request for ${quantity.toString()} ${assetHolding.symbol}... Retry attempt ${tryCount}`);
        } else {
          alerts.success(`Processing withdraw request for ${quantity.toString()} ${assetHolding.symbol}...`);
        }

        api.fillKeys(config)
          .then((configResponse) => {
            return new Promise((resolveBalance) => {
              neo.fetchSystemAssetBalance(currentWallet.address, null, false)
                .then((balance) => {
                  configResponse.balance = balance;
                  resolveBalance(configResponse);
                })
                .catch((e) => {
                  reject(`Failed to fetch address balance. ${e}`);
                });
            });
          })
          .then((configResponse) => {
            return api.createTx(configResponse, 'invocation');
          })
          .then((configResponse) => {
            return new Promise((resolveTx) => {
              this.calculateWithdrawInputsAndOutputs(configResponse, assetId, quantity)
                .then(() => {
                  const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
                  configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_WITHDRAWSTEP_MARK.padEnd(64, '0'));
                  configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
                  configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_SYSTEM_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
                  configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity.toNumber()).padEnd(64, '0'));
                  configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
                    u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index + 20 : 0).padEnd(64, '0'));

                  configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
                  configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
                    u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0).padEnd(64, '0'));
                  resolveTx(configResponse);
                })
                .catch((e) => {
                  if (tryCount <= 1) {
                    // console.log(`Failed to calculate withdraw inputs and outputs. ${e.message || e}`);
                    reject(`Failed to calculate withdraw inputs and outputs. ${e.message || e}`);
                  } else {
                    // console.log('Failed to Mark Withdraw.');
                    reject('Failed to Mark Withdraw.');
                  }
                });
            });
          })
          .then((configResponse) => {
            return api.signTx(configResponse);
          })
          .then((configResponse) => {
            const attachInvokedContract = {
              invocationScript: ('00').repeat(2),
              verificationScript: '',
            };

            // We need to order this for the VM.
            const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
            if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
              configResponse.tx.scripts.push(attachInvokedContract);
            } else {
              configResponse.tx.scripts.unshift(attachInvokedContract);
            }

            let i = 0;

            configResponse.tx.outputs.forEach(({ value }) => {
              if (utxoIndex === -1 && quantity.isEqualTo(value)) {
                utxoIndex = i;
              }
              i += 1;
            });

            if (utxoIndex === -1) {
              // console.log('Unable to generate valid UTXO');
              throw new Error('Unable to generate valid UTXO');
            }
            return configResponse;
          })
          .then((configResponse) => {
            // console.log(`sendTx to mark withdraw ${JSON.stringify(configResponse)}`);
            return api.sendTx(configResponse);
          })
          .then((configResponse) => {
            if (!configResponse.response.result && tryCount < 3) {
              setTimeout(() => {
                this.ignoreWithdrawInputs(config);
                neo.resetSystemAssetBalanceCache();
                this.markWithdraw(assetId, quantity, tryCount + 1)
                  .then((res) => {
                    resolve(res);
                  })
                  .catch((e) => {
                    reject(e);
                  });
              }, 10000);
            } else {
              resolve({
                success: configResponse.response.result,
                tx: configResponse.tx,
                utxoIndex,
              });
            }
          })
          .catch((e) => {
            // console.log(`failure to mark returned from sendTx ${e}`);
            if (tryCount < 3) {
              setTimeout(() => {
                this.ignoreWithdrawInputs(config);
                neo.resetSystemAssetBalanceCache();
                this.markWithdraw(assetId, quantity, tryCount + 1)
                  .then((res) => {
                    resolve(res);
                  })
                  .catch((e) => {
                    reject(e);
                  });
              }, 10000);
            } else {
              reject(`Failed to Mark Withdraw. ${e}`);
            }
          });
      } catch (e) {
        if (tryCount < 3) {
          setTimeout(() => {
            this.ignoreWithdrawInputs(config);
            neo.resetSystemAssetBalanceCache();
            this.markWithdraw(assetId, quantity, tryCount + 1)
              .then((res) => {
                resolve(res);
              })
              .catch((e) => {
                reject(e);
              });
          }, 10000);
        } else {
          reject(`Failed to Mark Withdraw. ${e.message}`);
        }
      }
    });
  },

  ignoreWithdrawInputs(config) {
    if (!config || !config.tx) {
      return;
    }

    config.tx.inputs.forEach((input) => {
      _.set(assetUTXOsToIgnore, input.prevHash, input.prevIndex);
    });
  },

  calculateWithdrawInputsAndOutputs(config, assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();
        const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);

        const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);
        neo.fetchSystemAssetBalance(dexAddress, null, false)
          .then(async (balance) => {
            // console.log(`calculateWithdrawInputsAndOutputs fetched system asset balance to calculate withdraw inputs / outputs. ${JSON.stringify(balance)}`);
            config.balance = balance;
            const unspents = assetId === assets.GAS ? config.balance.assets.GAS.unspent : config.balance.assets.NEO.unspent;
            await this.checkUnspentsReservedState(assetId, unspents);

            const pickedInputs = [];
            const pickedUnspents = [];
            let quantitySumOfPickedInputs = new BigNumber(0);
            _.orderBy(unspents, [unspent => parseFloat(unspent.value.toString())], ['desc']).some((currentUnspent) => {
              if (currentUnspent.reservedFor === currentWalletScriptHash) {
                this.completeSystemAssetWithdrawals();
                reject('Already have a UTXO reserved for your address. Completing open withdraw.');
                return false;
              }
              if (currentUnspent.reservedFor && currentUnspent.reservedFor.length >= 40) {
                // reserved for someone else
                return false;
              }
              if (_.has(assetUTXOsToIgnore, currentUnspent.txid)
                && _.get(assetUTXOsToIgnore, currentUnspent.txid) === currentUnspent.index) {
                // we've tried to use this UTXO before and failed, skip it
                return false;
              }

              if (quantitySumOfPickedInputs.isGreaterThanOrEqualTo(quantity)) {
                let isDonePicking = true;
                let i = 0;
                pickedUnspents.some((pickedUnspent) => {
                  if (quantitySumOfPickedInputs.minus(pickedUnspent.value).plus(currentUnspent.value)
                    .isGreaterThanOrEqualTo(quantity)) {
                    // remove pickedInput and use the current one.
                    pickedInputs.splice(i, 1);
                    /* const removedUnspent = */ pickedUnspents.splice(i, 1);
                    quantitySumOfPickedInputs = quantitySumOfPickedInputs.minus(pickedUnspent.value);
                    // console.log(`-$ removed input to use for withdraw total: ${quantitySumOfPickedInputs} unspent: ${JSON.stringify(removedUnspent)}`);
                    isDonePicking = false;
                    return true;
                  }
                  i += 1;
                  return false;
                });
                if (isDonePicking) {
                  return true;
                }
              }
              quantitySumOfPickedInputs = quantitySumOfPickedInputs.plus(currentUnspent.value);
              pickedUnspents.push(currentUnspent);
              pickedInputs.push({
                prevHash: currentUnspent.txid,
                prevIndex: currentUnspent.index,
              });
              // console.log(`$ added input to use for withdraw total: ${quantitySumOfPickedInputs} unspent: ${JSON.stringify(currentUnspent)}`);
              return false;
            });

            // console.log(`pickedInputs.length: ${pickedInputs.length} quantitySumOfPickedInputs: ${quantitySumOfPickedInputs}`);
            const inputTotal = quantitySumOfPickedInputs;
            config.tx.inputs = config.tx.inputs.concat(pickedInputs);

            if (inputTotal.isLessThan(quantity)) {
              // console.log('Contract does not have enough balance for withdraw.');
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
            reject(`Failed to fetch address balance. ${e}`);
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

        const token = assets.getNetworkAsset(assetId);

        api.fillKeys(config)
          .then((configResponse) => {
            return new Promise((resolveBalance) => {
              neo.fetchSystemAssetBalance(currentWallet.address)
                .then((balance) => {
                  configResponse.balance = balance;
                  resolveBalance(configResponse);
                })
                .catch((e) => {
                  reject(`Failed to fetch address balance. ${e}`);
                });
            });
          })
          .then((configResponse) => {
            configResponse.sendingFromSmartContract = true;
            return api.createTx(configResponse, 'invocation');
          })
          .then((configResponse) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_WITHDRAWSTEP_WITHDRAW.padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_NEP5_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index + 20 : 0).padEnd(64, '0'));

            configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);

            if (token.canPull !== false) {
              configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, u.reverseHex(assets.DEX_SCRIPT_HASH));
            }

            configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0).padEnd(64, '0'));
            return api.signTx(configResponse);
          })
          .then((configResponse) => {
            if (token.canPull !== false) {
              const attachInvokedContract = {
                invocationScript: ('00').repeat(2),
                verificationScript: '',
              };
              // We need to order this for the VM.
              const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
              if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
                configResponse.tx.scripts.push(attachInvokedContract);
              } else {
                configResponse.tx.scripts.unshift(attachInvokedContract);
              }
            }

            return api.sendTx(configResponse);
          })
          .then((configResponse) => {
            resolve({
              success: configResponse.response.result,
              tx: configResponse.tx,
            });
          })
          .catch((e) => {
            reject(`Failed to Withdraw NEP5 balance. Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to Withdraw NEP5 balance. Error: ${e.message}`);
      }
    });
  },

  withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount = 1) {
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
          config.intents = api.makeIntent({ NEO: quantity }, currentWallet.address);
        } else if (assetId === assets.GAS) {
          config.intents = api.makeIntent({ GAS: quantity }, currentWallet.address);
        }

        // console.log(`withdrawSystemAsset ${assetId} quantity: ${quantity} utxoTxHash ${utxoTxHash} utxoIndex ${utxoIndex} intents ${JSON.stringify(config.intents)}`);
        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        api.fillKeys(config)
          .then((configResponse) => {
            return new Promise((resolveBalance) => {
              neo.fetchSystemAssetBalance(dexAddress, config.intents, false)
                .then((balance) => {
                  configResponse.balance = balance;
                  resolveBalance(configResponse);
                })
                .catch((e) => {
                  reject(`Failed to fetch address balance. ${e}`);
                });
            });
          })
          .then((configResponse) => {
            return api.createTx(configResponse, 'invocation');
          })
          .then((configResponse) => {
            return new Promise((resolveInputs) => {
              neo.fetchSystemAssetBalance(dexAddress, config.intents, false)
                .then((balance) => {
                  const unspents = assetId === assets.GAS ? balance.assets.GAS.unspent : balance.assets.NEO.unspent;
                  const input = _.find(unspents, { txid: utxoTxHash, index: utxoIndex });

                  if (!input) {
                    // skip displaying this error if we've already relayed this withdraw utxo, retry in case the explorer hasn't picked up the utxo yet
                    if (lastUTXOWithdrawn !== `${utxoTxHash}${utxoIndex}`) {
                      if (tryCount < 3) {
                        setTimeout(() => {
                          this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
                        }, 10000);
                        return;
                      }
                      // console.log(`Unable to find marked input ${utxoTxHash} ${utxoIndex}`);
                      reject('Unable to find marked input.');
                    }
                    return;
                  }

                  configResponse.tx.inputs = [{
                    prevHash: input.txid,
                    prevIndex: input.index,
                  }];

                  configResponse.tx.outputs = [{
                    assetId,
                    scriptHash: wallet.getScriptHashFromAddress(currentWallet.address),
                    value: input.value,
                  }];

                  resolveInputs(configResponse);
                })
                .catch((e) => {
                  reject(`Failed to fetch address balance. ${e}`);
                });
            });
          })
          .then((configResponse) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_WITHDRAWSTEP_WITHDRAW.padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_SYSTEM_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index + 20 : 0).padEnd(64, '0'));

            configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
            configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0).padEnd(64, '0'));
            return api.signTx(configResponse);
          })
          .then((configResponse) => {
            const attachInvokedContract = {
              invocationScript: ('00').repeat(2),
              verificationScript: '',
            };

            // We need to order this for the VM.
            const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
            if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
              configResponse.tx.scripts.push(attachInvokedContract);
            } else {
              configResponse.tx.scripts.unshift(attachInvokedContract);
            }

            return configResponse;
          })
          .then((configResponse) => {
            // console.log(`sending withdraw for utxo ${utxoTxHash} ${utxoIndex}`);
            return api.sendTx(configResponse);
          })
          .then((configResponse) => {
            if (configResponse.response.result !== true && tryCount < 3) {
              alerts.error('Withdraw rejected by the network. Retrying...');
              setTimeout(() => {
                this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
              }, 10000);
              return;
            }

            if (configResponse.response.result === true) {
              alerts.success('Withdraw relayed, waiting for confirmation...');
              lastUTXOWithdrawn = `${utxoTxHash}${utxoIndex}`;
            }

            resolve({
              success: configResponse.response.result,
              tx: configResponse.tx,
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

            reject(`Failed to send asset withdraw transaction. ${e}`);
          });
      } catch (e) {
        if (tryCount < 3) {
          alerts.error(`Withdraw failed. Error: ${e.message} Retrying...`);
          setTimeout(() => {
            this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1);
          }, 10000);
          return;
        }

        reject(`Failed to send asset withdraw transaction. ${e.message}`);
      }
    });
  },

  completeSystemAssetWithdrawals() {
    return new Promise((resolve, reject) => {
      try {
        const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);

        neo.fetchSystemAssetBalance(dexAddress, null, false)
          .then((balance) => {
            if (balance.assets.GAS) {
              this.checkUnspentsReservedState(assets.GAS, balance.assets.GAS.unspent);
            }
            if (balance.assets.NEO) {
              this.checkUnspentsReservedState(assets.NEO, balance.assets.NEO.unspent);
            }
          })
          .catch((e) => {
            reject(`Failed to fetch address balance. ${e}`);
          });
      } catch (e) {
        reject(`Failed to fetch reserved UTXOs. ${e.message}`);
      }
    });
  },

  async checkUnspentsReservedState(assetId, unspents) {
    const currentWallet = wallets.getCurrentWallet();
    const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);

    for (let i = 0; i < unspents.length; i += 1) {
      const unspent = unspents[i];
      const utxoKey = `${unspent.txid}_${unspent.index}`;

      if (_.has(contractUTXOsReservedFor, utxoKey)) {
        unspent.reservedFor = _.get(contractUTXOsReservedFor);
      }

      /* eslint-disable no-await-in-loop */
      if (!unspent.reservedFor) {
        await this.fetchSystemAssetUTXOReserved(unspent);
      }

      if (unspent.reservedFor === currentWalletScriptHash) {
        // console.log(`unspent: ${JSON.stringify(unspent)}  is already reserved for us, attempting to withdraw.`);
        await this.withdrawSystemAsset(assetId, unspent.value.toNumber(), unspent.txid, unspent.index);
      }
      /* eslint-enable no-await-in-loop */

      if (unspent.reservedFor) {
        // if (unspent.reservedFor.length >= 40) {
        //   console.log(`Tracking reserved for someone else ${JSON.stringify(unspent)}`);
        // } else {
        //   console.log(`!! checkUnspentsReservedState found available UTXO ${JSON.stringify(unspent)}`);
        // }
        _.set(contractUTXOsReservedFor, utxoKey, unspent.reservedFor);
      }
    }
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
            } else {
              input.reservedFor = 'none';
            }
            resolve(input);
          })
          .catch((e) => {
            reject(`Failed to fetch UTXO Reserved Status from contract storage. ${e}`);
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
                commitState.minimumClaimBlocks = dexState.minimumClaimBlocks;

                // Apply the fees not yet applied into the totalFeeUnits to get an accurate calculation.
                if (commitState.lastAppliedFeeSnapshot < commitState.totalFeesCollected) {
                  const feesCollectedSinceSnapshot = commitState.totalFeesCollected - commitState.lastAppliedFeeSnapshot;
                  commitState.totalFeeUnits += feesCollectedSinceSnapshot * commitState.totalUnitsContributed;
                  commitState.lastAppliedFeeSnapshot = commitState.totalFeesCollected;
                }
                commitState.networkWeight = Math.round(commitState.totalFeeUnits - commitState.feeUnitsSnapshot);

                if (commitState.contributionHeight > 0) {
                  commitState.ableToClaimHeight = commitState.contributionHeight + commitState.minimumClaimBlocks;
                  commitState.ableToCompoundHeight = commitState.compoundHeight + commitState.minimumClaimBlocks;

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
                reject(`Failed to fetch commit state. ${e}`);
              });
          })
          .catch((e) => {
            reject(`Failed to fetch commit state. ${e}`);
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
            reject(`Failed to fetch commit state. ${e}`);
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
                dexState.totalFeesCollected = 0;

                if (res.result && res.result.length >= 32) {
                  dexState.totalFeesCollected = u.fixed82num(res.result.substr(0, 16));
                }


                rpcClient.query({
                  method: 'getstorage',
                  params: [assets.DEX_SCRIPT_HASH, u.str2hexstring('claimMinimumBlocks')],
                })
                  .then((res) => {
                    dexState.minimumClaimBlocks = claiming.DEFAULT_CLAIM_BLOCKS;

                    if (res.result) {
                      dexState.minimumClaimBlocks = u.fixed82num(res.result) * 100000000;
                    }

                    resolve(dexState);
                  })
                  .catch(() => {
                    dexState.minimumClaimBlocks = claiming.DEFAULT_CLAIM_BLOCKS;
                    resolve(dexState);
                  });
              })
              .catch((e) => {
                reject(`Failed to fetch DEX commit state, Total Fees Collected. ${e}`);
              });
          })
          .catch((e) => {
            reject(`Failed to fetch DEX commit state, Contribution Sums. ${e}`);
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
                  resolve(res.tx);
                })
                .catch((e) => {
                  reject(`Commit Failed. ${e}`);
                });
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(`Commit Failed. ${e}`);
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
                  resolve(res.tx);
                })
                .catch((e) => {
                  reject(`Failed to monitor transaction confirmation. ${e}`);
                });
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(`Claim Failed. ${e}`);
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
                  reject(`Failed to monitor transaction confirmation. ${e}`);
                });
            } else {
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            reject(`Compound Failed. ${e}`);
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
        reject(e.message);
      }
    });
  },

  setMinimumClaimBlocks(claimMinimumBlocks) {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('setClaimMinimumBlocks',
          [
            u.num2fixed8(claimMinimumBlocks / 100000000),
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

        const scriptBuilder = new sc.ScriptBuilder();
        scriptBuilder.emitAppCall(assets.DEX_SCRIPT_HASH, operation, parameters);
        const script = scriptBuilder.str;

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
          .then((configResponse) => {
            if (!configResponse.intents && currentNetwork.fee === 0) {
              return new Promise((balanceResolve) => {
                configResponse.balance = new wallet.Balance({ address: configResponse.address, net: configResponse.net });
                balanceResolve(configResponse);
              });
            }

            return new Promise((resolveBalance) => {
              neo.fetchSystemAssetBalance(currentWallet.address, config.intents)
                .then((balance) => {
                  configResponse.balance = balance;
                  resolveBalance(configResponse);
                })
                .catch((e) => {
                  reject(`Failed to fetch address balance. ${e}`);
                });
            });
          })
          .then((configResponse) => {
            return api.createTx(configResponse, 'invocation');
          })
          .then((configResponse) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
            configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
              u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0).padEnd(64, '0'));
            return api.signTx(configResponse);
          })
          .then((configResponse) => {
            neo.applyTxToAddressSystemAssetBalance(currentWallet.address, configResponse.tx);
            resolve(configResponse);
          })
          .catch((e) => {
            reject(`Failed to build contract transaction. ${e}`);
          });
      } catch (e) {
        reject(`Failed to build contract transaction. ${e.message}`);
      }
    });
  },

  executeContractTransaction(operation, parameters, neoToSend, gasToSend) {
    return new Promise((resolve, reject) => {
      try {
        this.buildContractTransaction(operation, parameters, neoToSend, gasToSend)
          .then(configResponse => api.sendTx(configResponse))
          .then((configResponse) => {
            resolve({
              success: configResponse.response.result,
              tx: configResponse.tx,
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

  claimGasForDexContract() {
    return new Promise((resolve, reject) => {
      const currentWallet = wallets.getCurrentWallet();
      const currentNetwork = network.getSelectedNetwork();
      const dexAddress = wallet.getAddressFromScriptHash(assets.DEX_SCRIPT_HASH);

      const config = {
        net: currentNetwork.net,
        url: currentNetwork.rpc,
        address: currentWallet.address,
        account: new wallet.Account(currentWallet.wif),
      };

      api.getClaimsFrom({
        net: network.getSelectedNetwork().net,
        url: currentNetwork.rpc,
        address: dexAddress,
      }, api.neoscan)
        .then((claimsResponse) => {
          api.fillKeys(config)
            .then((configResponse) => {
              return new Promise((resolveBalance) => {
                neo.fetchSystemAssetBalance()
                  .then((balance) => {
                    configResponse.balance = balance;
                    resolveBalance(configResponse);
                  })
                  .catch((e) => {
                    reject(`Failed to fetch address balance. ${e}`);
                  });
              });
            })
            .then((configResponse) => {
              configResponse.claims = claimsResponse.claims;
              return api.createTx(configResponse, 'claim');
            })
            .then((configResponse) => {
              const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
              configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_CLAIM_GAS.padEnd(64, '0'));
              configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
              configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
                u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0));

              configResponse.tx.outputs.forEach((output) => {
                output.scriptHash = assets.DEX_SCRIPT_HASH;
              });

              return api.signTx(configResponse);
            })
            .then((configResponse) => {
              const attachInvokedContract = {
                invocationScript: ('00').repeat(2),
                verificationScript: '',
              };

              // We need to order this for the VM.
              const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
              if (parseInt(assets.DEX_SCRIPT_HASH, 16) > parseInt(acct.scriptHash, 16)) {
                configResponse.tx.scripts.push(attachInvokedContract);
              } else {
                configResponse.tx.scripts.unshift(attachInvokedContract);
              }

              return configResponse;
            })
            .then((configResponse) => {
              return api.sendTx(configResponse);
            })
            .then((configResponse) => {
              resolve({
                success: configResponse.response.result,
                tx: configResponse.tx,
              });
            })
            .catch((e) => {
              reject(`Failed to Claim Contract GAS. Error: ${e}`);
            });
        })
        .catch((e) => {
          reject(`Failed to Claim Contract GAS. Error: ${e}`);
        });
    });
  },

};

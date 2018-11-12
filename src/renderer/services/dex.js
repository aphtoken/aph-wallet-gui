import {
  wallet,
  sc,
  api,
  u,
  tx,
} from '@cityofzion/neon-js';
import Vue from 'vue';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';
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
const POSTFIX_USER_ASSET_WITHDRAWING = 'b0';

const binSizeToBinCountMap = {
  1: 1440, //  1 Min ~ 1 day
  5: 1440, //  5 Min ~ 5 days
  15: 1440, // 15 Min ~ 15 days
  30: 1440, // 30 Min ~ 30 days
  60: 1440, // 1 Hrs ~ 60 days
  360: 1440, // 6 Hrs ~ 360 days
  1440: 1095, // 1 Day ~ 3 yrs
  4320: 1825, // 3 Days ~ 5 yrs
  10080: 520, // 1 Week ~ 10 yrs
};

const DBG_LOG = false;
const assetUTXOsToIgnore = {};
const contractUTXOsReservedFor = {};

/* eslint-disable max-len */
export default {
  async completeUnspentWithdraws(assetId, unspents) {
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < unspents.length; i += 1) {
      const unspent = unspents[i];
      const currentWallet = wallets.getCurrentWallet();
      const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);
      if (unspent.reservedFor === currentWalletScriptHash) {
        if (DBG_LOG) console.log(`Completing withdraw for ${JSON.stringify(unspent)}`);
        try {
          if (!store.state.systemWithdraw) {
            const systemWithdraw = {
              step: 0,
              asset: assetId === assets.NEO ? 'NEO' : 'GAS',
              amount: unspent.value.toString(),
            };
            store.commit('setSystemWithdraw', systemWithdraw);
            store.commit('setSystemWithdrawMergeState', { step: 3 });
            store.commit('setWithdrawInProgressModalModel', {});
          }

          const res = await this.withdrawSystemAsset(assetId, unspent.value.toNumber(), unspent.txid, unspent.index);
          store.commit('setSystemWithdrawMergeState', { step: 4 });
          await neo.monitorTransactionConfirmation(res.tx, true);
          neo.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx, true);
          store.commit('setSystemWithdrawMergeState', { step: 5 });
        } catch (e) {
          const errMsg = `Attempt to complete previous withdraw failed. ${e}`;
          store.commit('setSystemWithdrawMergeState', { error: errMsg });
          throw new Error(errMsg);
        }
      }
    }
    /* eslint-enable no-await-in-loop */
  },

  async decorateWithUnspentsReservedState(assetId, unspents, targetAmount) {
    for (let i = 0; i < unspents.length; i += 1) {
      const unspent = unspents[i];
      const utxoKey = `${unspent.txid}_${unspent.index}`;

      if (_.has(contractUTXOsReservedFor, utxoKey)) {
        unspent.reservedFor = _.get(contractUTXOsReservedFor);
      }

      if (!targetAmount || targetAmount.isEqualTo(unspent.value)) {
        /* eslint-disable no-await-in-loop */
        if (!unspent.reservedFor) {
          await this.fetchSystemAssetUTXOReserved(unspent);
        }
        /* eslint-enable no-await-in-loop */

        if (unspent.reservedFor) {
          if (DBG_LOG) {
            if (unspent.reservedFor.length >= 40) {
              console.log(`Tracking reserved utxo ${JSON.stringify(unspent)}`);
            } else {
              console.log(`!! decorateWithUnspentsReservedState found available UTXO ${JSON.stringify(unspent)}`);
            }
          }
          _.set(contractUTXOsReservedFor, utxoKey, unspent.reservedFor);
        }
        _.set(contractUTXOsReservedFor, utxoKey, unspent.reservedFor);
      }
    }
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
            neoToSend = toBigNumber(order.quantityToSell).minus(neoHolding.contractBalance);

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
            gasToSend = toBigNumber(order.quantityToSell).minus(gasHolding.contractBalance);
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

  buildContractTransaction(operation, parameters, neoToSend, gasToSend) {
    return new Promise(async (resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: currentNetwork.dex_hash,
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
          config.intents = api.makeIntent(assetsForIntent, currentNetwork.dex_hash);
        }

        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        let neededGasUtxos = (gasToSend && toBigNumber(gasToSend).isGreaterThan(0)) ? 1 : 0;
        let configResponse = await api.fillKeys(config);
        if (!configResponse.intents && currentNetwork.fee === 0 && !neoToSend && !gasToSend) {
          configResponse.balance = new wallet.Balance({ address: configResponse.address, net: configResponse.net });
        } else {
          try {
            configResponse.balance = await store.dispatch('fetchSystemAssetBalances',
              { forAddress: currentWallet.address, intents: config.intents });
          } catch (e) {
            reject(`Failed to fetch address balance. ${e}`);
          }
          if (currentNetwork.fee) {
            neededGasUtxos += 1;
            if (configResponse.balance.assets.GAS.unspent.length < neededGasUtxos) {
              throw new Error('No unspent GAS available to pay network fee.');
            }
          }
        }

        if (neededGasUtxos > 1 && gasToSend && BigNumber(gasToSend).isGreaterThanOrEqualTo(
          configResponse.balance.assets.GAS.balance)) {
          throw new Error('Cannot send max GAS with a fee set, try a smaller amount or remove GAS fee.');
        }

        try {
          configResponse = await api.createTx(configResponse, 'invocation');

          const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
          configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
          configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
            u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0).padEnd(64, '0'));

          configResponse = await api.signTx(configResponse);
        } catch (e) {
          if (DBG_LOG) console.log(`Failed creating or signing transaction. Error: ${e}`);
          // Rip off the actual exception message it is likely something werid we don't want users to see.
          throw new Error('Failed to create transaction.');
        }

        resolve(configResponse);
      } catch (e) {
        const errMsg = typeof e === 'string' ? e : e.message;
        reject(`Failed to build contract transaction. ${errMsg}`);
      }
    });
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

  calculateWithdrawInputsAndOutputs(config, assetId, quantity) {
    return new Promise(async (resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();
        const currentNetwork = network.getSelectedNetwork();
        const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);

        const dexAddress = wallet.getAddressFromScriptHash(currentNetwork.dex_hash);

        try {
          config.balance = await store.dispatch('fetchSystemAssetBalances', { forAddress: dexAddress });
        } catch (e) {
          reject(`Failed to fetch address balance. ${e}`);
          return;
        }

        const unspents = assetId === assets.GAS ? config.balance.assets.GAS.unspent : config.balance.assets.NEO.unspent;
        await this.decorateWithUnspentsReservedState(assetId, unspents);

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
          const utxoKey = `${currentUnspent.txid}-${currentUnspent.index}-${currentNetwork.net}`;
          if (_.has(assetUTXOsToIgnore, utxoKey)
            && _.get(assetUTXOsToIgnore, utxoKey) >= currentNetwork.bestBlock.index) {
            // we've tried to use this UTXO before and failed, skip it
            if (DBG_LOG) console.log(`We've tried to use this UTXO before and failed, skip it. unspent: ${JSON.stringify(currentUnspent)} `);
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
                pickedUnspents.splice(i, 1);
                quantitySumOfPickedInputs = quantitySumOfPickedInputs.minus(pickedUnspent.value);
                if (DBG_LOG) {
                  console.log(`-$ removed input to use for withdraw total: ${quantitySumOfPickedInputs} `
                    + `unspent: ${JSON.stringify(pickedUnspent)}`);
                }
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
          if (DBG_LOG) {
            console.log(`$ added input to use for withdraw total: ${quantitySumOfPickedInputs} `
              + `unspent: ${JSON.stringify(currentUnspent)}`);
          }
          return false;
        });

        if (DBG_LOG) console.log(`pickedInputs.length: ${pickedInputs.length} quantitySumOfPickedInputs: ${quantitySumOfPickedInputs}`);
        const inputTotal = quantitySumOfPickedInputs;
        config.tx.inputs = config.tx.inputs.concat(pickedInputs);

        if (inputTotal.isLessThan(quantity)) {
          // TODO: we should prompt the user possibly if they want to withdraw the inputTotal currently available instead
          reject(`Contract UTXOs busy, only ${quantity} available, wait a few blocks and retry your withdraw.`);
          return;
        }

        config.tx.outputs.push({
          assetId,
          scriptHash: currentNetwork.dex_hash,
          value: quantity,
        });

        if (inputTotal.isGreaterThan(quantity)) {
          // change output
          config.tx.outputs.push({
            assetId,
            scriptHash: currentNetwork.dex_hash,
            value: inputTotal.minus(quantity),
          });
        }

        resolve(config);
      } catch (e) {
        reject(`Failed to Calculate Inputs and Outputs for Withdraw. ${typeof e === 'string' ? e : e.message}`);
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

  claimAPH() {
    return new Promise(async (resolve, reject) => {
      try {
        const withdrawAmountAfterClaim = toBigNumber(store.state.commitState.quantityCommitted
          + store.state.commitState.availableToClaim)
          .decimalPlaces(8, BigNumber.ROUND_DOWN);

        store.commit('setCommitChangeInProgress', {});
        const res = await this.executeContractTransaction('claim', []);
        if (!res.success) {
          reject('Transaction rejected');
          return;
        }

        alerts.success('Claim relayed, waiting for confirmation...');
        neo.monitorTransactionConfirmation(res.tx, true)
          .then(async () => {
            alerts.success(`Claimed ${withdrawAmountAfterClaim.toString()} APH to Contract Balance.`);

            try {
              await this.withdrawAsset(store.state.currentNetwork.aph_hash, Number(withdrawAmountAfterClaim));

              alerts.success(`Submitted Withdraw of ${withdrawAmountAfterClaim.toString()} APH.`);
            } catch (e) {
              const errMsg = typeof e === 'string' ? e : e.message;
              const alertMsg = `Failed to withdraw claimed APH. It remains in contract balance. Error: ${errMsg}`;
              alerts.exception(alertMsg);
            }
            try {
              await store.dispatch('fetchCommitState');
            } catch (e) {
              const errMsg = typeof e === 'string' ? e : e.message;
              alerts.exception(errMsg);
            }
            store.commit('setCommitChangeInProgress', null);
            resolve(res.tx);
          })
          .catch((e) => {
            store.commit('setCommitChangeInProgress', null);
            reject(`Failed to monitor transaction confirmation. ${e}`);
          });
      } catch (e) {
        const errMsg = typeof e === 'string' ? e : e.message;
        reject(`Claim Failed. ${errMsg}`);
        store.commit('setCommitChangeInProgress', null);
      }
    });
  },

  commitAPH(quantity) {
    return new Promise((resolve, reject) => {
      try {
        store.commit('setCommitChangeInProgress', {});
        this.executeContractTransaction('commit',
          [
            u.num2fixed8(quantity),
          ])
          .then((res) => {
            if (res.success) {
              alerts.success('Commit relayed, waiting for confirmation...');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  setTimeout(async () => {
                    try {
                      await store.dispatch('fetchCommitState');
                    } catch (e) {
                      const errMsg = typeof e === 'string' ? e : e.message;
                      alerts.exception(errMsg);
                    }
                    store.commit('setCommitChangeInProgress', null);
                    resolve(res.tx);
                  }, 5000);
                })
                .catch((e) => {
                  store.commit('setCommitChangeInProgress', null);
                  reject(`Failed monitoring for commit complete transaction. ${e}`);
                });
            } else {
              store.commit('setCommitChangeInProgress', null);
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            store.commit('setCommitChangeInProgress', null);
            reject(`Commit Failed. ${e}`);
          });
      } catch (e) {
        store.commit('setCommitChangeInProgress', null);
        reject(`Commit Failed. ${e.message}`);
      }
    });
  },

  completeSystemAssetWithdrawals() {
    return new Promise(async (resolve, reject) => {
      try {
        // check if the wallet has an in progress GAS withdraw
        const markedGasBalance = toBigNumber(await this.getWithdrawInProgressBalance(assets.GAS));
        // check if the wallet has an in progress NEO withdraw
        const markedNeoBalance = toBigNumber(await this.getWithdrawInProgressBalance(assets.NEO));

        if (markedGasBalance.plus(markedNeoBalance).isEqualTo(0)) {
          // nothing in progress to withdraw.
          if (DBG_LOG) console.log('No NEO or GAS withdraws in progress.');
          if (!DBG_LOG) return;
        }

        if (DBG_LOG) console.log(`Detected marked amounts GAS: ${markedGasBalance} NEO: ${markedNeoBalance}`);

        const dexAddress = wallet.getAddressFromScriptHash(store.state.currentNetwork.dex_hash);

        let dexBalance;
        try {
          dexBalance = await store.dispatch('fetchSystemAssetBalances', { forAddress: dexAddress });
        } catch (e) {
          reject(`Failed to fetch address balance. ${e}`);
          return;
        }

        if (dexBalance.assets.GAS && markedGasBalance.isGreaterThan(0)) {
          await this.decorateWithUnspentsReservedState(assets.GAS, dexBalance.assets.GAS.unspent, markedGasBalance);
          if (DBG_LOG) console.log(`Checking for GAS unspents ${JSON.stringify(dexBalance.assets.GAS.unspent)}`);
          await this.completeUnspentWithdraws(assets.GAS, dexBalance.assets.GAS.unspent);
        }
        if (dexBalance.assets.NEO && markedNeoBalance.isGreaterThan(0)) {
          await this.decorateWithUnspentsReservedState(assets.NEO, dexBalance.assets.NEO.unspent, markedNeoBalance);
          if (DBG_LOG) console.log(`Checking for NEO unspents ${JSON.stringify(dexBalance.assets.NEO.unspent)}`);
          await this.completeUnspentWithdraws(assets.NEO, dexBalance.assets.NEO.unspent);
        }
      } catch (e) {
        alerts.error(`Failed to fetch reserved UTXOs. ${e.message}`);
      }
    });
  },

  compoundAPH() {
    return new Promise((resolve, reject) => {
      try {
        store.commit('setCommitChangeInProgress', {});
        this.executeContractTransaction('compound',
          [])
          .then((res) => {
            if (res.success) {
              alerts.success('Compound relayed, waiting for confirmation...');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  setTimeout(async () => {
                    try {
                      await store.dispatch('fetchCommitState');
                    } catch (e) {
                      const errMsg = typeof e === 'string' ? e : e.message;
                      alerts.exception(errMsg);
                    }
                    store.commit('setCommitChangeInProgress', null);
                    resolve(res.tx);
                  }, 5000);
                })
                .catch((e) => {
                  store.commit('setCommitChangeInProgress', null);
                  reject(`Failed to monitor transaction confirmation. ${e}`);
                });
            } else {
              store.commit('setCommitChangeInProgress', null);
              reject('Transaction rejected');
            }
          })
          .catch((e) => {
            store.commit('setCommitChangeInProgress', null);
            reject(`Compound Failed. ${e}`);
          });
      } catch (e) {
        store.commit('setCommitChangeInProgress', null);
        reject(`Compound Failed. ${e.message}`);
      }
    });
  },

  depositAsset(assetId, quantity) {
    return new Promise(async (resolve, reject) => {
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

          if (assetId === '3a4acd3647086e7c44398aac0349802e6a171129'
          /* || assetId === 'c9c0fc5a2b66a29d6b14601e752e6e1a445e088d' */) {
            const res = await neo.approveNep5Deposit(store.state.currentNetwork.dex_hash,
              assetId, quantity);
            if (DBG_LOG) console.log(`Attempting approval of ${assetId}`);
            await neo.monitorTransactionConfirmation(res.tx, true);
            alerts.info(`Confirmed approval of ${quantity} ${holding.symbol} for deposit.`);
            // TODO: wait a few seconds before issuing deposit for UTXOs to settle.
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
                    neo.applyTxToAddressSystemAssetBalance(wallets.getCurrentWallet().address, res.tx, true);
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
          const dexAddress = wallet.getAddressFromScriptHash(store.state.currentNetwork.dex_hash);
          neo.sendFunds(dexAddress, assetId, quantity, true, () => {
            alerts.success('Deposit relayed, waiting for confirmation...');
          }, true)
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

  executeContractTransaction(operation, parameters, neoToSend, gasToSend) {
    return new Promise((resolve, reject) => {
      try {
        this.buildContractTransaction(operation, parameters, neoToSend, gasToSend)
          .then((configResponse) => {
            if (DBG_LOG) console.log(`executeContractTransaction ${JSON.stringify(configResponse)}`);
            return api.sendTx(configResponse);
          })
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

  executeReadOnlyContractOperation(operation, parameters) {
    return new Promise((resolve, reject) => {
      try {
        const rpcClient = network.getRpcClient();

        const scriptBuilder = new sc.ScriptBuilder();
        scriptBuilder.emitAppCall(store.state.currentNetwork.dex_hash, operation, parameters);
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

  fetchCommitDEXState() {
    return new Promise((resolve, reject) => {
      try {
        const rpcClient = network.getRpcClient();
        rpcClient.query({
          method: 'getstorage',
          params: [store.state.currentNetwork.dex_hash, `${u.reverseHex(store.state.currentNetwork.aph_hash)}fa`],
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
              params: [store.state.currentNetwork.dex_hash, `${u.reverseHex(store.state.currentNetwork.aph_hash)}fc`],
            })
              .then((res) => {
                dexState.totalFeesCollected = 0;

                if (res.result && res.result.length >= 32) {
                  dexState.totalFeesCollected = u.fixed82num(res.result.substr(0, 16));
                }


                rpcClient.query({
                  method: 'getstorage',
                  params: [store.state.currentNetwork.dex_hash, u.str2hexstring('claimMinimumBlocks')],
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
        const contributionKey = `${u.reverseHex(wallet.getScriptHashFromAddress(address))}`
          + `${u.reverseHex(store.state.currentNetwork.aph_hash)}d0`;

        const rpcClient = network.getRpcClient();
        rpcClient.query({
          method: 'getstorage',
          params: [store.state.currentNetwork.dex_hash, contributionKey],
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

  fetchMarkets() {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/markets?contractScriptHash=${store.state.currentNetwork.dex_hash}`)
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

  fetchOrderHistory(before = 0, after = 0, sort = 'DESC') {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();
        const ordersPageSize = 100;

        axios.get(`${currentNetwork.aph}/orders/${currentWallet.address}
?contractScriptHash=${currentNetwork.dex_hash}&pageSize=${ordersPageSize}&before=${before}&after=${after}&sort=${sort}`)
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

  fetchSystemAssetUTXOReserved(input) {
    return new Promise((resolve, reject) => {
      try {
        const prevTxHash = input.prevHash ? input.prevHash : input.txid;
        const prevTxIndex = input.prevIndex ? input.prevIndex : input.index;

        const utxoParam = `${u.reverseHex(prevTxHash)}${u.num2hexstring(prevTxIndex, 2, true)}`;

        if (DBG_LOG) console.log(`utxoParam: ${utxoParam}`);

        const rpcClient = network.getRpcClient();
        rpcClient.query({
          method: 'getstorage',
          params: [store.state.currentNetwork.dex_hash, utxoParam],
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

  fetchTickerData() {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/ticker`)
          .then((res) => {
            resolve(res.data);
          })
          .catch((e) => {
            alerts.exception(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to fetch ticker data. ${e.message}`);
      }
    });
  },

  fetchTradeHistory(marketName) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        axios.get(`${currentNetwork.aph}/trades/${marketName}?contractScriptHash=${currentNetwork.dex_hash}`)
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
              getBars: this.getTradeHistoryBars,
              marketName,
              trades: res.data.trades,
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

  fetchTradesBucketed(marketName, binSize = 1, from, to) {
    return new Promise((resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const binCount = binSizeToBinCountMap[binSize];
        let url = `${currentNetwork.aph}/trades/bucketed/${marketName}?binSize=${binSize}&binCount=${binCount}`;

        if (from) {
          const fromDate = new Date(from * 1000);
          url = `${url}&startTime=${fromDate.toISOString()}`;
        }

        if (to) {
          const toDate = new Date(to * 1000);
          url = `${url}&endTime=${toDate.toISOString()}`;
        }

        axios.get(url)
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

  // Expects a BigNumber
  flooredLogBase2(number) {
    let power = new BigNumber(0);
    for (; number.isGreaterThan(0); number = number.dividedBy(2).decimalPlaces(0, BigNumber.ROUND_DOWN)) {
      power = power.plus(1);
    }
    return power.minus(1);
  },

  formDepositsForOrder(order) {
    let totalQuantityToSell = new BigNumber(0);
    let totalFees = new BigNumber(0);
    const sellAssetHolding = neo.getHolding(order.assetIdToSell);

    if (order.price) {
      // limit order
      let depositMakerQuantity = false;

      if ((sellAssetHolding.canPull === false || order.assetIdToSell === '3a4acd3647086e7c44398aac0349802e6a171129') && order.quantity.isGreaterThan(0)) {
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
      const aphAssetHolding = neo.getHolding(store.state.currentNetwork.aph_hash);
      if (order.assetIdToSell === store.state.currentNetwork.aph_hash) {
        totalQuantityToSell = totalQuantityToSell.plus(totalFees);
        order.totalFees = totalFees;
      } else if (aphAssetHolding.contractBalance.isLessThan(new BigNumber(totalFees))) {
        order.feeDeposit = {
          symbol: aphAssetHolding.symbol,
          assetId: store.state.currentNetwork.aph_hash,
          currentQuantity: new BigNumber(aphAssetHolding.contractBalance),
          quantityRequired: new BigNumber(totalFees),
          quantityToDeposit: new BigNumber(totalFees).minus(aphAssetHolding.contractBalance),
        };
        order.deposits.push(order.feeDeposit);
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

          // add token if not already a user asset
          const userAssets = assets.getUserAssets();
          if (!_.has(userAssets, order.assetIdToBuy)) {
            store.dispatch('addToken', {
              hashOrSymbol: order.assetIdToBuy,
            });
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
              const aphHolding = neo.getHolding(store.state.currentNetwork.aph_hash);
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

  getTradeHistoryBars(tradeHistory, resolution, from, to) {
    const bars = [];
    const trades = tradeHistory.trades.slice(0);
    const apiBuckets = tradeHistory.apiBuckets;

    trades.reverse();

    // convert resolution to seconds
    resolution = parseFloat(resolution) * 60;

    // round to even interval
    from = Math.round(from / resolution) * resolution;
    to = Math.round(to / resolution) * resolution;

    // convert resolution to milliseconds
    resolution *= 1000;

    let currentBar = {
      open: 0,
      close: 0,
      high: 0,
      low: 0,
      volume: 0,
    };

    let apiBucketsIndex = 0;
    let tradesIndex = 0;
    const barFrom = (from * 1000);
    const barTo = (to * 1000);
    let barPointer = barFrom;
    let bucket = null;
    let trade = null;

    let needCurrentBar = false;
    if (apiBuckets.length > 0) {
      bucket = apiBuckets[0];
      const bucketTime = bucket.time * 1000;
      // if 'from' is before the first bucket, set currentBar qualt to firstBucket,
      if (barFrom < bucketTime) {
        currentBar = {
          open: bucket.open,
          close: bucket.close,
          high: bucket.high,
          low: bucket.low,
          volume: bucket.volume,
          time: bucketTime,
        };
      } else {
        bucket = _.last(apiBuckets);
        if (from > bucket.time) {
          // else from is greater than the last bucket, so need to set it form teh trade array
          needCurrentBar = true;
        } else if (DBG_LOG) console.log('Not setting current bar price due to in middle of buckets');
        // else somewhere in the middle of the buckets, and will be set first time through the while loop.
      }

      bucket = apiBuckets[0];
      while (bucket) {
        if (bucket.time > from - (resolution * 3)) {
          if (currentBar.time === undefined) {
            if (DBG_LOG) console.log('Setting need current bar.');
            needCurrentBar = true;
          }
          break;
        }
        apiBucketsIndex += 1;
        bucket = (apiBucketsIndex < apiBuckets.length) ? apiBuckets[apiBucketsIndex] : null;
      }
      if (apiBucketsIndex >= apiBuckets.length && currentBar.time === undefined) {
        if (DBG_LOG) console.log('Setting needCurrentBar.');
        needCurrentBar = true;
      } else if (DBG_LOG) console.log(`last bucket has time ${bucket.time}`);

      if (DBG_LOG) console.log(`${from} apiBucketsIndex: ${apiBucketsIndex} ${currentBar.time}`);
    } else {
      needCurrentBar = true;
    }

    if (needCurrentBar && trades.length) {
      if (DBG_LOG) console.log('Setting current bar from trades');
      for (let tradeIndex = trades.length - 1; tradeIndex > 0; tradeIndex -= 1) {
        trade = trades[tradeIndex];
        currentBar = {
          open: trade.price,
          close: trade.price,
          high: trade.price,
          low: trade.price,
          volume: 0,
        };
        if (DBG_LOG) console.log(`set current bar price ${currentBar.close}`);
        if (trade.tradeTime <= from) {
          break;
        }
      }
    }

    while (barPointer < barTo) {
      currentBar = {
        open: currentBar.close,
        close: currentBar.close,
        high: currentBar.close,
        low: currentBar.close,
        volume: 0,
        time: barPointer,
      };

      bucket = apiBucketsIndex < apiBuckets.length ? apiBuckets[apiBucketsIndex] : null;
      trade = tradesIndex < trades.length ? trades[tradesIndex] : null;

      while (trade && trade.tradeTime < from) {
        tradesIndex += 1;
        trade = tradesIndex < trades.length ? trades[tradesIndex] : null;
      }

      const bucketTime = bucket ? bucket.time * 1000 : 0;
      const bucketDistanceToPointer = Math.abs(bucketTime - barPointer);

      if (bucketDistanceToPointer <= resolution) {
        currentBar = {
          open: bucket.open,
          close: bucket.close,
          high: bucket.high,
          low: bucket.low,
          volume: bucket.volume,
          time: bucketTime,
        };

        if (bucketDistanceToPointer > 0) {
          barPointer = bucketTime;
        }

        bars.push(currentBar);
        apiBucketsIndex += 1;
      } else {
        while (trade
          && trade.tradeTime * 1000 >= barPointer
          && trade.tradeTime * 1000 < barPointer + resolution) {
          currentBar.volume += Number(trade.quantity);
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

  async getWithdrawInProgressBalance(assetId) {
    const currentWallet = wallets.getCurrentWallet();
    const currentWalletScriptHash = wallet.getScriptHashFromAddress(currentWallet.address);
    const assetWithdrawingParam
      = `${u.reverseHex(currentWalletScriptHash)}${u.reverseHex(assetId)}${POSTFIX_USER_ASSET_WITHDRAWING}`;

    if (DBG_LOG) console.log(`assetWithdrawingParam: ${assetWithdrawingParam}`);

    const rpcClient = network.getRpcClient();
    const res = await rpcClient.query({
      method: 'getstorage',
      params: [store.state.currentNetwork.dex_hash, assetWithdrawingParam],
    });
    if (!!res.result && res.result.length > 0) {
      return u.fixed82num(res.result);
    }

    return 0;
  },

  ignoreWithdrawInputs(config) {
    if (!config || !config.tx) {
      return;
    }

    const currentNetwork = network.getSelectedNetwork();

    config.tx.inputs.forEach((input) => {
      _.set(assetUTXOsToIgnore, `${input.prevHash}-${input.prevIndex}-${currentNetwork.net}`, currentNetwork.bestBlock.index);
    });
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
              resolve(order);
            }, 5000);
          },
        });
      } catch (e) {
        reject(`Failed to make order deposits. ${e.message ? e.message : e}`);
      }
    });
  },

  markWithdraw(assetId, quantity, tryCount = 1) {
    return new Promise(async (resolve, reject) => {
      const currentNetwork = network.getSelectedNetwork();
      const currentWallet = wallets.getCurrentWallet();
      if (DBG_LOG) console.log(`markWithdraw assetId ${assetId} quantity ${quantity} tryCount ${tryCount}`);
      const config = {
        net: currentNetwork.net,
        url: currentNetwork.rpc,
        script: {
          scriptHash: currentNetwork.dex_hash,
          operation: 'withdraw',
          args: [
          ],
        },
        fees: currentNetwork.fee,
        gas: 0,
      };

      const handleRetry = () => {
        setTimeout(() => {
          this.ignoreWithdrawInputs(config);
          this.markWithdraw(assetId, quantity, tryCount + 1)
            .then((res) => {
              resolve(res);
            })
            .catch((e) => {
              reject(e);
            });
        }, 10000);
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

        let configResponse = await api.fillKeys(config);

        try {
          configResponse.balance = await store.dispatch('fetchSystemAssetBalances', { forAddress: currentWallet.address });
        } catch (e) {
          throw new Error(`Failed to fetch address balance. ${e}`);
        }

        if (!currentNetwork.bestBlock) {
          throw new Error('Wallet has not obtained a block number yet.');
        }

        // Valid until amount gets converted to BigInteger so the block number needs to be converted to smallest units.
        const blockIndex = currentNetwork.bestBlock.index;
        const validUntilValue = (blockIndex + 20) * 0.00000001;

        configResponse = await api.createTx(configResponse, 'invocation');

        const inputsFromGasFee = configResponse.tx.inputs.length;

        try {
          // This decorates the configResponse with the appropriate inputs
          await this.calculateWithdrawInputsAndOutputs(configResponse, assetId, quantity);
        } catch (e) {
          const errMsg = `Failed to calculate withdraw inputs and outputs. ${e.message || e}`;
          if (DBG_LOG) console.log(errMsg);
          throw new Error(errMsg);
        }

        store.commit('setSystemWithdrawMergeState', { utxoCount: configResponse.tx.inputs.length - inputsFromGasFee, step: 1 });
        const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_WITHDRAWSTEP_MARK.padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_SYSTEM_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity.toNumber()).padEnd(64, '0'));
        if (DBG_LOG) console.log(`*block index: ${blockIndex} Valid until: ${validUntilValue}`);
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
          u.num2fixed8(validUntilValue).padEnd(64, '0'));

        configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);

        configResponse = await api.signTx(configResponse);

        const attachInvokedContract = {
          invocationScript: ('00').repeat(2),
          verificationScript: '',
        };

        // We need to order this for the VM.
        const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
        if (parseInt(currentNetwork.dex_hash, 16) > parseInt(acct.scriptHash, 16)) {
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
          if (DBG_LOG) console.log('Unable to generate valid UTXO');
          throw new Error('Unable to generate valid UTXO');
        }

        if (DBG_LOG) console.log(`sendTx to mark withdraw ${JSON.stringify(configResponse)}`);
        configResponse = await api.sendTx(configResponse);

        if (!configResponse.response.result) {
          throw new Error('Failed to Mark Withdraw. Empty result from sendTX.');
        }

        resolve({
          success: configResponse.response.result,
          tx: configResponse.tx,
          utxoIndex,
        });
      } catch (e) {
        const errMsg = typeof e === 'string' ? e : e.message;
        if (tryCount < 3) {
          alerts.error(`Withdraw mark failed. Error: ${errMsg} Retrying...`);
          handleRetry();
        } else {
          reject(`Failed to Mark Withdraw. ${errMsg}`);
        }
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
            if (DBG_LOG) console.log(e);
            reject(`APH API Error: ${e}`);
          });
      } catch (e) {
        reject(`Failed to place order. ${e}`);
      }
    });
  },

  setMarket(quoteAssetId, baseAssetId, minimumSize, minimumTickSize, buyFee, sellFee, waitForTx) {
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
              if (waitForTx) {
                neo.monitorTransactionConfirmation(res.tx, true)
                  .then(() => {
                    resolve(res.tx);
                  });
              } else {
                resolve(res.tx);
              }
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

  withdrawAsset(assetId, quantity) {
    return new Promise((resolve, reject) => {
      try {
        if (assetId === assets.NEO || assetId === assets.GAS) {
          const systemWithdraw = {
            step: 0,
            asset: assetId === assets.NEO ? 'NEO' : 'GAS',
            amount: quantity.toString(),
          };

          store.commit('setSystemWithdraw', systemWithdraw);

          store.commit('setWithdrawInProgressModalModel', {
          });

          const rejectWithError = (errorMsg) => {
            store.commit('setSystemWithdrawMergeState', { error: errorMsg });
            reject(errorMsg);
          };
          // TODO: should pass this through the whole way instead of getting again in case they switch wallets somehow
          const currentWallet = wallets.getCurrentWallet();

          this.markWithdraw(assetId, quantity)
            .then((res) => {
              if (res.success !== true) {
                rejectWithError('Withdraw Mark Step rejected');
                return;
              }
              store.commit('setSystemWithdrawMergeState', { step: 2 });

              alerts.success('Withdraw Mark Step Relayed. Waiting for confirmation.');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  store.commit('setSystemWithdrawMergeState', { step: 3 });
                  const dexAddress = wallet.getAddressFromScriptHash(store.state.currentNetwork.dex_hash);
                  // Must allow funds to be sent again by moving tx outputs to unspent.
                  neo.applyTxToAddressSystemAssetBalance(dexAddress, res.tx, true);

                  setTimeout(() => {
                    this.withdrawSystemAsset(assetId, quantity, res.tx.hash, res.utxoIndex)
                      .then((res) => {
                        if (res.success) {
                          store.commit('setSystemWithdrawMergeState', { step: 4 });

                          neo.monitorTransactionConfirmation(res.tx, true)
                            .then(() => {
                              neo.applyTxToAddressSystemAssetBalance(currentWallet.address, res.tx, true);
                              store.commit('setSystemWithdrawMergeState', { step: 5 });
                              resolve(res.tx);
                            })
                            .catch(() => {
                              rejectWithError('Timed out waiting for withdraw to complete.');
                            });
                          resolve(res.tx);
                        } else {
                          rejectWithError('Withdraw rejected');
                        }
                      })
                      .catch((e) => {
                        rejectWithError(`Failed to withdraw system asset. ${e}`);
                      });
                  }, 1000);
                })
                .catch((e) => {
                  rejectWithError(`Failed to monitor transaction for confirmation. ${e}`);
                  this.completeSystemAssetWithdrawals();
                });
            })
            .catch((e) => {
              rejectWithError(`Failed to mark system asset for withdraw. ${e}`);
            });

          return;
        }

        this.withdrawNEP5(assetId, quantity)
          .then((res) => {
            if (res.success) {
              alerts.success('Withdraw Relayed.');
              neo.monitorTransactionConfirmation(res.tx, true)
                .then(() => {
                  resolve(res.tx);
                })
                .catch((e) => {
                  reject(`Failed to monitor transaction for confirmation. ${e}`);
                });
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

  withdrawNEP5(assetId, quantity) {
    return new Promise(async (resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: currentNetwork.dex_hash,
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

        const configResponse = await api.fillKeys(config);

        // Fetch system asset balances in order to have UTXOs for GAS.
        try {
          configResponse.balance = await store.dispatch('fetchSystemAssetBalances',
            { forAddress: currentWallet.address });
        } catch (e) {
          reject(`Failed to fetch address balance. ${e}`);
        }

        if (!currentNetwork.bestBlock) {
          reject('Wallet has not obtained a block number yet.');
          return;
        }
        // Valid until amount gets converted to BigInteger so the block number needs to be converted to smallest units.
        const blockIndex = currentNetwork.bestBlock.index;
        const validUntilValue = (blockIndex + 20) * 0.00000001;

        configResponse.sendingFromSmartContract = true;
        api.createTx(configResponse, 'invocation')
          .then((configResponse) => {
            const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_WITHDRAWSTEP_WITHDRAW.padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_NEP5_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL, u.num2fixed8(validUntilValue).padEnd(64, '0'));
            configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);

            if (token.canPull !== false) {
              configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, u.reverseHex(currentNetwork.dex_hash));
            }

            if (DBG_LOG) console.log(`block index; ${blockIndex} validUntil: ${validUntilValue}`);

            return api.signTx(configResponse);
          })
          .then((configResponse) => {
            if (token.canPull !== false) {
              const attachInvokedContract = {
                invocationScript: ('00').repeat(2),
                verificationScript: '',
              };
              const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
              // We need to order this for the VM.
              // TODO: Revisit this, it shouldn't be needed and if it is, is this correct?
              if (parseInt(currentNetwork.dex_hash, 16) > parseInt(acct.scriptHash, 16)) {
                configResponse.tx.scripts.push(attachInvokedContract);
              } else {
                configResponse.tx.scripts.unshift(attachInvokedContract);
              }
            }

            if (DBG_LOG) console.log(`withdraw NEP5 tx: ${JSON.stringify(configResponse)}`);
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
    return new Promise(async (resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: currentNetwork.dex_hash,
            operation: 'withdraw',
            args: [
            ],
          },
          fees: currentNetwork.fee,
          gas: 0,
        };

        if (DBG_LOG) console.log(`withdrawSystemAsset ${assetId} quantity: ${quantity} utxoTxHash ${utxoTxHash} utxoIndex ${utxoIndex} intents ${JSON.stringify(config.intents)}`);
        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        let configResponse = await api.fillKeys(config);
        try {
          configResponse.balance
            = await store.dispatch('fetchSystemAssetBalances', { forAddress: currentWallet.address });
        } catch (e) {
          throw new Error(`Failed to fetch address balance. ${e}`);
        }

        const dexAddress = wallet.getAddressFromScriptHash(currentNetwork.dex_hash);

        let dexIntents;
        if (assetId === assets.NEO) {
          dexIntents = api.makeIntent({ NEO: quantity }, currentWallet.address);
        } else if (assetId === assets.GAS) {
          dexIntents = api.makeIntent({ GAS: quantity }, currentWallet.address);
        }

        let dexBalance;
        try {
          dexBalance = await store.dispatch('fetchSystemAssetBalances',
            { forAddress: dexAddress, intents: dexIntents });
        } catch (e) {
          throw new Error(`Failed to fetch address balance. ${e}`);
        }

        const unspents = assetId === assets.GAS ? dexBalance.assets.GAS.unspent : dexBalance.assets.NEO.unspent;
        const input = _.find(unspents, { txid: utxoTxHash, index: utxoIndex });

        if (!input) {
          if (DBG_LOG) console.log(`Unable to find marked input ${utxoTxHash} ${utxoIndex}`);
          throw new Error('Unable to find marked input.');
        }

        // This is going to calculate inputs for gas fee and apply them moving them into spent
        configResponse = await api.createTx(configResponse, 'invocation');
        if (DBG_LOG) console.log(`withdraw inputs: ${JSON.stringify(configResponse.tx.inputs)} outputs: ${configResponse.tx.outputs}`);

        // Can't set this above because createTx would try to pick inputs for these from the wallet balance instead of
        // the dex balance.
        config.intents = dexIntents;

        // We push the additional input and output for the marked dex utxo to be withdrawn
        configResponse.tx.inputs.push({
          prevHash: input.txid,
          prevIndex: input.index,
        });

        configResponse.tx.outputs.push({
          assetId,
          scriptHash: wallet.getScriptHashFromAddress(currentWallet.address),
          value: input.value,
        });

        if (!currentNetwork.bestBlock) {
          throw new Error('Wallet has not obtained a block number yet.');
        }
        // Valid until amount gets converted to BigInteger so the block number needs to be converted to smallest units.
        const blockIndex = currentNetwork.bestBlock.index;
        const validUntilValue = (blockIndex + 20) * 0.00000001;

        const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_WITHDRAWSTEP_WITHDRAW.padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_SYSTEM_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_AMOUNT, u.num2fixed8(quantity).padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
          u.num2fixed8(validUntilValue).padEnd(64, '0'));

        configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);

        configResponse = await api.signTx(configResponse);

        const attachInvokedContract = {
          invocationScript: ('00').repeat(2),
          verificationScript: '',
        };

        // We need to order this for the VM.
        const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
        if (parseInt(currentNetwork.dex_hash, 16) > parseInt(acct.scriptHash, 16)) {
          configResponse.tx.scripts.push(attachInvokedContract);
        } else {
          configResponse.tx.scripts.unshift(attachInvokedContract);
        }

        if (DBG_LOG) console.log(`sending withdraw for utxo ${utxoTxHash} ${utxoIndex}`);
        configResponse = await api.sendTx(configResponse);

        if (!configResponse || !configResponse.response || (configResponse.response.result !== true && tryCount < 3)) {
          throw new Error('Withdraw rejected by the network. Retrying...');
        }

        // Apply this to the dex's balance so it won't get picked again for an immediate subsequent withdraw
        neo.applyTxToAddressSystemAssetBalance(dexAddress, configResponse.tx, false);

        if (configResponse.response.result === true) {
          alerts.success('Withdraw relayed, waiting for confirmation...');
        }

        resolve({
          success: configResponse.response.result,
          tx: configResponse.tx,
        });
      } catch (e) {
        const errMsg = typeof e === 'string' ? e : e.message;
        if (tryCount < 3) {
          alerts.error(`Withdraw failed. Error: ${errMsg} Retrying...`);
          setTimeout(() => {
            this.withdrawSystemAsset(assetId, quantity, utxoTxHash, utxoIndex, tryCount + 1)
              .then((res) => {
                resolve(res);
              })
              .catch((e) => {
                reject(e);
              });
          }, 10000);
          return;
        }
        reject(`Failed to send asset withdraw transaction. ${errMsg}`);
      }
    });
  },

  claimGasForDexContract() {
    return new Promise((resolve, reject) => {
      const currentWallet = wallets.getCurrentWallet();
      const currentNetwork = network.getSelectedNetwork();
      const dexAddress = wallet.getAddressFromScriptHash(store.state.currentNetwork.dex_hash);

      const config = {
        net: currentNetwork.net,
        url: currentNetwork.rpc,
        address: currentWallet.address,
      };

      if (currentWallet.isLedger === true) {
        config.signingFunction = ledger.signWithLedger;
      } else {
        config.account = new wallet.Account(currentWallet.wif);
      }

      api.getClaimsFrom({
        net: network.getSelectedNetwork().net,
        url: currentNetwork.rpc,
        address: dexAddress,
      }, api.neoscan)
        .then((claimsResponse) => {
          api.fillKeys(config)
            .then((configResponse) => {
              return new Promise(async (resolveBalance) => {
                try {
                  configResponse.balance = await store.dispatch('fetchSystemAssetBalances',
                    { forAddress: currentWallet.address, intents: config.intents });
                  resolveBalance(configResponse);
                } catch (e) {
                  reject(`Failed to fetch address balance. ${e}`);
                }
              });
            })
            .then((configResponse) => {
              configResponse.claims = claimsResponse.claims;
              // TODO: for now we just take the first 9, but we could do something better.
              configResponse.claims.ClaimItem = configResponse.claims.slice(0, 9);
              return api.createTx(configResponse, 'claim');
            })
            .then((configResponse) => {
              const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
              configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, SIGNATUREREQUESTTYPE_CLAIM_GAS.padEnd(64, '0'));
              configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);
              // TODO: may want to use a different attribute; ledger was having a singing issue and may be due to this attribute.
              configResponse.tx.addAttribute(TX_ATTR_USAGE_HEIGHT,
                u.num2fixed8(currentNetwork.bestBlock != null ? currentNetwork.bestBlock.index : 0));

              configResponse.tx.outputs.forEach((output) => {
                output.scriptHash = currentNetwork.dex_hash;
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
              if (parseInt(currentNetwork.dex_hash, 16) > parseInt(acct.scriptHash, 16)) {
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

  collapseSmallestContractUTXOs(assetId, numInputsToCollapse, startingAmount = 0, collapseIncrementally = false) {
    return new Promise(async (resolve, reject) => {
      try {
        const currentNetwork = network.getSelectedNetwork();
        const currentWallet = wallets.getCurrentWallet();

        const config = {
          net: currentNetwork.net,
          url: currentNetwork.rpc,
          script: {
            scriptHash: currentNetwork.dex_hash,
            operation: 'withdraw',
            args: [
            ],
          },
          fees: currentNetwork.fee,
          intents: [],
          gas: 0,
        };

        // Only contract owner will be able to collapse inputs
        if (currentWallet.isLedger === true) {
          config.signingFunction = ledger.signWithLedger;
          config.address = currentWallet.address;
        } else {
          config.account = new wallet.Account(currentWallet.wif);
        }

        let configResponse = await api.fillKeys(config);
        try {
          configResponse.balance
            = await store.dispatch('fetchSystemAssetBalances', { forAddress: currentWallet.address });
        } catch (e) {
          throw new Error(`Failed to fetch address balance. ${e}`);
        }

        const dexAddress = wallet.getAddressFromScriptHash(currentNetwork.dex_hash);

        // This is going to calculate inputs for gas fee and apply them moving them into spent
        configResponse = await api.createTx(configResponse, 'invocation');
        if (DBG_LOG) console.log(`collapse inputs: ${JSON.stringify(configResponse.tx.inputs)} outputs: ${JSON.stringify(configResponse.tx.outputs)}`);

        let dexBalance;
        try {
          dexBalance = await store.dispatch('fetchSystemAssetBalances',
            { forAddress: dexAddress });
        } catch (e) {
          throw new Error(`Failed to fetch address balance. ${e}`);
        }

        const dexAssets = dexBalance.assets;
        const unspents = _.cloneDeep(assetId === assets.GAS ? dexAssets.GAS.unspent : dexAssets.NEO.unspent);

        await this.decorateWithUnspentsReservedState(assetId, unspents);

        BigNumber.config({ DECIMAL_PLACES: 8, ROUNDING_MODE: 3 });
        let totalInputAmount = toBigNumber(0);

        // take the numInputsToCollapse smallest inputs and use them and sum their amounts
        let inputsCollapsed = 0;
        let lastCollapsedAmount = toBigNumber(0);
        _.orderBy(unspents, [unspent => parseFloat(unspent.value.toString())], ['asc']).some((unspent) => {
          // check if this utxo is marked for someone and if so just skip
          if (unspent.reservedFor.length >= 40) {
            return false;
          }

          if (toBigNumber(startingAmount).isGreaterThan(unspent.value)) {
            return false;
          }

          if (lastCollapsedAmount.plus(1).isGreaterThan(unspent.value) && collapseIncrementally === true) {
            return false;
          }

          totalInputAmount = totalInputAmount.plus(unspent.value);
          config.tx.inputs.push({
            prevHash: unspent.txid,
            prevIndex: unspent.index,
          });

          lastCollapsedAmount = toBigNumber(unspent.value);
          inputsCollapsed += 1;

          if (inputsCollapsed >= numInputsToCollapse) {
            return true;
          }
          return false;
        });

        console.log(`total collapsed input amount: ${totalInputAmount}`);
        // collapse to one output
        config.tx.outputs.push({
          assetId,
          scriptHash: currentNetwork.dex_hash,
          value: totalInputAmount,
        });

        if (DBG_LOG) console.log(`collapse inputs: ${JSON.stringify(configResponse.tx.inputs)} outputs: ${JSON.stringify(configResponse.tx.outputs)}`);

        if (!currentNetwork.bestBlock) {
          throw new Error('Wallet has not obtained a block number yet.');
        }
        // Valid until amount gets converted to BigInteger so the block number needs to be converted to smallest units.
        const blockIndex = currentNetwork.bestBlock.index;
        const validUntilValue = (blockIndex + 20) * 0.00000001;

        const senderScriptHash = u.reverseHex(wallet.getScriptHashFromAddress(currentWallet.address));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_SIGNATURE_REQUEST_TYPE, '93'.padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_ADDRESS, senderScriptHash.padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_SYSTEM_ASSET_ID, u.reverseHex(assetId).padEnd(64, '0'));
        configResponse.tx.addAttribute(TX_ATTR_USAGE_WITHDRAW_VALIDUNTIL,
          u.num2fixed8(validUntilValue).padEnd(64, '0'));

        configResponse.tx.addAttribute(TX_ATTR_USAGE_SCRIPT, senderScriptHash);

        configResponse = await api.signTx(configResponse);

        const attachInvokedContract = {
          invocationScript: ('00').repeat(2),
          verificationScript: '',
        };

        // We need to order this for the VM.
        const acct = configResponse.privateKey ? new wallet.Account(configResponse.privateKey) : new wallet.Account(configResponse.publicKey);
        if (parseInt(currentNetwork.dex_hash, 16) > parseInt(acct.scriptHash, 16)) {
          configResponse.tx.scripts.push(attachInvokedContract);
        } else {
          configResponse.tx.scripts.unshift(attachInvokedContract);
        }

        if (DBG_LOG) console.log('sending collapse utxos');
        configResponse = await api.sendTx(configResponse);

        if (!configResponse || !configResponse.response || (configResponse.response.result !== true)) {
          throw new Error('Collapse inputs rejected by network. Retrying...');
        }

        // Apply this to the dex's balance
        neo.applyTxToAddressSystemAssetBalance(dexAddress, configResponse.tx, false);

        if (configResponse.response.result === true) {
          alerts.success('Collapse inputs relayed, waiting for confirmation...');
        }

        resolve({
          success: configResponse.response.result,
          tx: configResponse.tx,
        });
      } catch (e) {
        const errMsg = typeof e === 'string' ? e : e.message;
        alerts.error(`Collapse failed. Error: ${errMsg}`);
        reject(`Failed to send collapse inputs transaction. ${errMsg}`);
      }
    });
  },

  reclaimOrphanFundsToOwner(assetId) {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('reclaimOrphanFunds',
          [
            u.reverseHex(assetId),
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

  setManager(managerScriptHash) {
    return new Promise((resolve, reject) => {
      try {
        this.executeContractTransaction('setManager',
          [
            u.reverseHex(managerScriptHash),
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

  setAssetSettings(assetId, fee, waitForTx, assetTxType = '00') {
    return new Promise((resolve, reject) => {
      try {
        const settingsData = `${assetTxType}${u.num2fixed8(fee)}`;
        this.executeContractTransaction('setAssetSettings',
          [
            u.reverseHex(assetId),
            settingsData,
          ])
          .then((res) => {
            if (res.success) {
              if (waitForTx) {
                neo.monitorTransactionConfirmation(res.tx, true)
                  .then(() => {
                    resolve(res.tx);
                  });
              } else {
                resolve(res.tx);
              }
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
  isSystemAssetWithdrawInProgress() {
    const systemWithdraw = store.state.systemWithdraw;
    return systemWithdraw && systemWithdraw.step >= 0 && systemWithdraw.step < 5 && !systemWithdraw.error;
  },
};

/* **************************************************************************************
 * Documentation About Bitcore-Wallet-Client is available at follwing link:
 * https://github.com/bitpay/bitcore/tree/master/packages/bitcore-wallet-client#class-api
 *
 ************************************************************************************** */
import wallets from './wallets';

export default {
  getBTCBalanceByAddress(walletClient) {
    return new Promise((resolve, reject) => {
      try {
        walletClient.getBalance({}, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
        return;
      } catch (e) {
        reject(e);
      }
    });
  },

  getEstimatedFeeByTx(toAddress, toAmount) {
    const currentWallet = wallets.getCurrentWallet();
    const walletClient = currentWallet.btcWalletClient;
    const toAmountSAT = parseInt((toAmount * 100000000).toFixed(0), 10);
    const txp = {
      outputs: [{
        toAddress,
        amount: toAmountSAT,
      }],
      feeLevel: 'normal',
      excludeUnconfirmedUtxos: true,
      dryRun: false,
    };
    return new Promise((resolve, reject) => {
      walletClient.createTxProposal(txp, (err, createdTxp) => {
        if (err) {
          reject({
            err,
          });
        } else {
          resolve({
            fee: (createdTxp.fee / 100000000),
          });
        }
      });
    });
  },

  createTxProposal(walletClient, txp) {
    return new Promise((resolve, reject) => {
      walletClient.createTxProposal(txp, (err, createdTxp) => {
        if (err) {
          reject({
            err,
          });
        } else {
          resolve({
            createdTxp,
          });
        }
      });
    });
  },

  publishTxProposal(walletClient, createdTxp1) {
    return new Promise((resolve, reject) => {
      walletClient.publishTxProposal({
        txp: createdTxp1,
      }, (err, publishedTxp) => {
        if (err) {
          reject({
            err,
          });
        } else {
          resolve({
            publishedTxp,
          });
        }
      });
    });
  },

  signTxProposal(walletClient, publishedTx, key) {
    const rootPath = walletClient.getRootPath();
    const signatures = key.sign(rootPath, publishedTx, '');
    return new Promise((resolve, reject) => {
      walletClient.pushSignatures(publishedTx, signatures, (err, signedTxp) => {
        if (err) {
          reject({
            err,
          });
        } else {
          resolve({
            signedTxp,
          });
        }
      });
    });
  },

  broadcastTxProposal(walletClient, signedTxp) {
    return new Promise((resolve, reject) => {
      walletClient.broadcastTxProposal(signedTxp, (err, broadcastedTxp, memo) => {
        if (err) {
          reject({
            err,
            memo,
          });
        } else {
          resolve({
            broadcastedTxp,
          });
        }
      });
    });
  },

  getPendingTxProposal(walletClient) {
    return new Promise((resolve, reject) => {
      walletClient.getTxProposals({
        doNotVerify: false,
        forAirGapped: false,
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  removeTxProposal(walletClient, txp) {
    return new Promise((resolve, reject) => {
      walletClient.removeTxProposal(txp, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  },

  getLast50TxByAddressNew(walletClient) {
    return new Promise((resolve, reject) => {
      walletClient.getTxHistory(
        {
          skip: 0,
          limit: 50,
        }, (err, txsFromServer) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log(txsFromServer);
            resolve(txsFromServer);
          }
        });
    });
  },
};

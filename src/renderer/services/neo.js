import {
  wallet,
  api,
  rpc,
} from '@cityofzion/neon-js';
import wallets from './wallets';
import valuation from './valuation';

const neoAssetId = '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b';
const gasAssetId = '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7';

// const network = 'MainNet';
// const rpcEndpoint = 'http://seed1.aphelion-neo.com:10332'; // todo, multiple options for rpc endpoints
/* const nep5TokenIds = [
  'a0777c3ce2b169d4a23bcba4565e3225a0122d95',
]; */

const network = 'TestNet';
const rpcEndpoint = 'http://test3.cityofzion.io:8880'; // todo, an app preference to move between test and main net
const nep5TokenIds = [
  '591eedcd379a8981edeefe04ef26207e1391904a',
];

export default {

  /**
   * @param {String} passphrase
   * @param {String} passphraseConfirm
   * @return Promise
   *
   * Response passed to Promise ideally looks like this:
   *  {String} encrypted_key
   *  {String} encrypted_private_key_qr
   *  {String} passhrase
   *  {String} private_key
   *  {String} public_address
   *  {String} public_address_qr
   */
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
        wallets.add(name, {
          label: name,
          encryptedWIF,
          address: account.address,
          scriptHash: account.scriptHash,
        });

        wallets.openSavedWallet(name, passphrase);
        return resolve(_.merge(account, { encryptedWIF, passphrase }));
      } catch (e) {
        return reject('An error occured while trying to generate a new wallet.');
      }
    });
  },

  /**
   * Fetch address's recent transactions.
   *
   * @param {String} address
   * @return Promise
   *
   *  {String} hash
   *  {String} block_index
   *  {String} symbol
   *  {String} amount
   *  {String} block_time
   */
  fetchRecentTransactions(address) {
    return new Promise((resolve, reject) => {
      try {
        return api.neonDB.getTransactionHistory(network, address)
          .then((res) => {
            const splitTransactions = [];
            res.forEach((t) => {
              const transactions = [];
              if (t.neo_sent === true) {
                transactions.push({
                  hash: t.txid,
                  block_index: t.block_index,
                  symbol: 'NEO',
                  amount: t.NEO,
                });
              }
              if (t.gas_sent === true) {
                transactions.push({
                  hash: t.txid,
                  block_index: t.block_index,
                  symbol: 'GAS',
                  amount: t.GAS,
                });
              }

              this.fetchTransactionDetails(t.txid)
                .then((transactionDetails) => {
                  transactions.forEach((t) => {
                    t.block_time = transactionDetails.blocktime;
                    splitTransactions.push(t);
                  });
                });
            });
            return resolve(splitTransactions);
          })
          .catch(e => reject(e));
      } catch (e) {
        return reject(e);
      }
    });
  },

  /**
   * Fetches transaction details for the given hash
   *
   * @param string hash
   * @return Promise
   *
   *  {String} txid
   *  {Float} net_fee
   *  {Float} sys_fee
   *  {Number} block
   *  {Number} size
   *  {Number} confirmations
   *  {Array} vin
   *  {Array} vout
   *  {Boolean} confirmed
   *  {Integer} blocktime
   */
  fetchTransactionDetails(hash) {
    return new Promise((resolve, reject) => {
      try {
        const client = rpc.default.create.rpcClient(rpcEndpoint);

        return client.getBlockCount()
          .then((blockCount) => {
            client.getRawTransaction(hash, 1)
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
                  inputPromises.push(client.getRawTransaction(input.txid, 1)
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
          .catch(e => reject(e));
      } catch (e) {
        return reject(e);
      }
    });
  },


  /**
   * Fetches holdings...
   *
   * @param {String} address
   * @return Promise
   *
   * Response passed to Promise ideally looks like this:
   *    {Float} value
   *    {String} icon_url
   *    {String} name
   *    {String} symbol
   */
  fetchHoldings(address) {
    return new Promise((resolve, reject) => {
      try {
        const client = rpc.default.create.rpcClient(rpcEndpoint);
        return client.query({ method: 'getaccountstate', params: [address] })
          .then((res) => {
            const holdings = [];

            res.result.balances.forEach((b) => {
              const h = {
                asset: b.asset,
                balance: b.value,
                symbol: b.asset === neoAssetId ? 'NEO' : 'GAS',
                name: b.asset === neoAssetId ? 'NEO' : 'GAS',
                isNep5: false,
              };

              holdings.push(h);
            });

            const nep5Promises = [];
            nep5TokenIds.forEach((nep5) => {
              nep5Promises.push(this.fetchNEP5Balance(address, nep5)
                .then((val) => {
                  if (val.balance > 0) {
                    const h = {
                      asset: nep5,
                      balance: val.balance,
                      symbol: val.symbol,
                      name: val.name,
                      isNep5: true,
                    };

                    holdings.push(h);
                  }
                })
                .catch((e) => {
                  reject(e);
                }));
            });

            return Promise.all(nep5Promises)
              .then(() => {
                const valuationsPromises = [];
                holdings.forEach((h) => {
                  valuationsPromises.push(valuation.getValuation(h.symbol)
                    .then((val) => {
                      h.change24hrPercent = val.percent_change_24h;
                      h.unitValue = val.price_usd;
                      h.unitValue24hrAgo = h.unitValue / (1 + (h.change24hrPercent / 100.0));
                      h.change24hrValue = (h.unitValue * h.balance)
                        - (h.unitValue24hrAgo * h.balance);
                      h.totalValue = h.unitValue * h.balance;
                    })
                    .catch((e) => {
                      console.log(e);
                    }));
                });

                return Promise.all(valuationsPromises)
                  .then(() => {
                    const res = { };

                    res.holdings = holdings.sort((a, b) => {
                      if (a.symbol > b.symbol) {
                        return 1;
                      }
                      return -1;
                    });

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

  fetchNEP5Balance(address, assetId) {
    return new Promise((resolve, reject) => {
      try {
        return api.nep5.getToken(rpcEndpoint, assetId, address)
          .then((token) => {
            resolve({
              name: token.name,
              symbol: token.symbol,
              decimals: token.decimals,
              totalSupply: token.totalSupply,
              balance: token.balance,
            });
          })
          .catch(e => reject(e));
      } catch (e) {
        return reject(e);
      }
    });
  },

  /**
   * @return Promise
   */
  sendFunds() {

  },

};

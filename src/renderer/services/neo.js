import {
  wallet,
  api,
} from '@cityofzion/neon-js';
import wallets from './wallets';

const network = 'TestNet';
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
   * Fetch wallet's recent transactions.
   *
   * @param {Object} wallet
   * @return Promise
   *
   * Response passed to Promise ideally looks like this:
   *  {Float} token_count
   *  {String} from_address
   *  {String} hash
   *  {String} timestamp
   *  {String} to_address
   */
  fetchRecentTransactions(address) {
    return new Promise((resolve, reject) => {
      try {
        return api.neonDB.getTransactionHistory(network, address)
          .then((res) => {
            const splitTransactions = [];
            res.forEach((t) => {
              if (t.neo_sent === true) {
                splitTransactions.push({
                  hash: t.txid,
                  block_index: t.block_index,
                  symbol: 'NEO',
                  amount: t.NEO,
                });
              }
              if (t.gas_sent === true) {
                splitTransactions.push({
                  hash: t.txid,
                  block_index: t.block_index,
                  symbol: 'GAS',
                  amount: t.GAS,
                });
              }
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
   * Fetches single wallet transaction.
   *
   * @param {Object} wallet
   * @return Promise
   *
   * Response passed to Promise ideally looks like this:
   *  {Boolean} comfirmed
   *  {Float} network_fee
   *  {Float} system_fee
   *  {Float} token_count
   *  {Float} value_usd
   *  {Number} block
   *  {Number} bytes
   *  {Number} confirmations
   *  {String} from_address
   *  {String} from_address
   *  {String} status
   *  {String} timestamp
   *  {String} to_address
   */
  fetchTransaction() {

  },

  /**
   * Fetches wallet contents...
   *
   * @param {Object} wallet
   * @return Promise
   *
   * Response passed to Promise ideally looks like this:
   *  {Array} holdings
   *    {Float} 24_hour_change_value
   *    {Float} token_count
   *    {String} icon_url
   *    {String} name
   *    {String} symbol
   *  {Float} 24_hour_change_usd
   *  {Float} value_usd
   *  {Number} 24_hour_change_percentage
   */
  fetchWalletContents() {

  },

  /**
   * Fetches locally stored wallets.
   *
   * @return Array
   */
  fetchWallets() {

  },

  /**
   * @return Promise
   */
  sendFunds() {

  },

};

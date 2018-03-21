/* eslint-disable */
import { wallet, Neon, rpc, tx, api } from '@cityofzion/neon-js';
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
            if(wallets.walletExists(name)) {
                return reject(`Wallet with name '${name}' already exists!`);
            }

            if (passphrase !== passphraseConfirm) {
                return reject('Passphrases do not match');
            }

            else if (passphrase.length < 4) {
                return reject('Please choose a longer passphrase');
            }

            try {
                let account = new wallet.Account(wallet.generatePrivateKey());
                const _encryptedWIF = wallet.encrypt(account.WIF, passphrase);

                account.label = name;   
                wallets.add(name, {
                    label: name,
                    encryptedWIF: _encryptedWIF,
                    address: account.address,
                    scriptHash: account.scriptHash
                });

                wallets.openSavedWallet(name, passphrase);
                resolve(_.merge(account, { _encryptedWIF, passphrase }));
            }
            catch (e) {
                return reject('An error occured while trying to generate a new wallet.')
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
    fetchRecentTransactions(name) {
        return new Promise((resolve, reject) => {

            try {
              if (_.isUndefined(wallets.currentWallet)) {
                return
              }
              
              api.neonDB.getTransactionHistory(network, wallets.currentWallet.address)
                .then(res => {
                    let splitTransactions = [];
                    for (let t of res) {
                        if (t.neo_sent === true) {
                          splitTransactions.push({
                            hash: t.txid,
                            block_index: t.block_index,
                            symbol: 'NEO',
                            value: t.NEO
                          });
                        }
                        if (t.gas_sent === true) {
                          splitTransactions.push({
                            hash: t.txid,
                            block_index: t.block_index,
                            symbol: 'GAS',
                            value: t.GAS
                          });
                        }
                    }
                    return resolve(splitTransactions);
                })
                .catch((e) => {
                  return reject(e);
                });
                
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
    fetchTransaction(wallet) {

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
    fetchWalletContents(wallet) {

    },

    /**
     * Fetches locally stored wallets.
     *
     * @return Array
     */
    fetchWallets() {

    },

    /**
     * Logs in with encrypted key.
     *
     * @param {String} passphrase
     * @param {String} encryptedKey
     * @return Promise
     */
    loginWithEncryptedKey(passphrase, encryptedKey) {

    },

    /**
     * Logs in with wallet.
     *
     * @param {Object} wallet
     * @param {String} passphrase
     * @return Promise
     */
    loginWithWallet(wallet, passphrase) {

    },

    /**
     * @return Promise
     */
    sendFunds() {

    },

    /**
     * Stores wallet locally.
     *
     * @param {String} name
     * @param {Object} wallet
     */
    storeWallet(name, wallet) {

    },

};

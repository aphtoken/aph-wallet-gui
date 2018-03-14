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
  createWallet(passphrase, passphraseConfirm) {

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
   *  {String} from_address
   *  {String} hash
   *  {String} timestamp
   *  {String} to_address
   */
  fetchRecentTransactions(wallet) {},

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
  fetchTransaction(wallet) {},

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
  fetchWalletContents(wallet) {},

  /**
   * Fetches locally stored wallets.
   *
   * @return Array
   */
  fetchWallets() {},

  /**
   * Logs in with encrypted key.
   *
   * @param {String} passphrase
   * @param {String} encryptedKey
   * @return Promise
   */
  loginWithEncryptedKey(passphrase, encryptedKey) {},

  /**
   * Logs in with wallet.
   *
   * @param {Object} wallet
   * @param {String} passphrase
   * @return Promise
   */
  loginWithWallet(wallet, passphrase) {},

  /**
   * @return Promise
   */
  sendFunds() {},

  /**
   * Stores wallet locally.
   *
   * @param {String} name
   * @param {Object} wallet
   */
  storeWallet(name, wallet) {},

};

import lockr from 'lockr';
import { wallet } from '@cityofzion/neon-js';

const WALLETS_STORAGE_KEY = 'aph.wallets';
let currentWallet = null;

export default {

  add(name, data) {
    const wallets = this.getAll();

    lockr.set(WALLETS_STORAGE_KEY, _.set(wallets, name.trim(), data));

    return this;
  },

  remove(name) {
    const wallets = this.getAll();
    lockr.set(WALLETS_STORAGE_KEY, _.omit(wallets, name.trim()));
    return this;
  },

  clearCurrentWallet() {
    this.setCurrentWallet(null);
  },

  getAll() {
    return lockr.get(WALLETS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.values(this.getAll()).sort((a, b) => {
      if (a.label.toUpperCase() > b.label.toUpperCase()) {
        return 1;
      } else if (a.label.toUpperCase() < b.label.toUpperCase()) {
        return -1;
      }
      return 0;
    });
  },

  getCurrentWallet() {
    return currentWallet;
  },

  getOne(name) {
    return _.get(this.getAll(), name.trim());
  },

  walletExists(name) {
    return !!this.getOne(name.trim());
  },

  openSavedWallet(name, passphrase) {
    return new Promise((resolve, reject) => {
      try {
        if (this.walletExists(name) === false) {
          return reject(`Wallet with name '${name}' not found.`);
        }
        const walletToOpen = this.getOne(name);
        const wif = wallet.decrypt(walletToOpen.encryptedWIF, passphrase);
        const account = new wallet.Account(wif);
        const currentWallet = {
          address: account.address,
          encryptedWIF: walletToOpen.encryptedWIF,
          label: walletToOpen.label,
          passphrase,
          privateKey: account.privateKey,
          wif,
        };

        this.setCurrentWallet(currentWallet);

        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  openEncryptedKey(encryptedKey, passphrase) {
    return new Promise((resolve, reject) => {
      try {
        const wif = wallet.decrypt(encryptedKey, passphrase);
        const account = new wallet.Account(wif);
        const currentWallet = {
          wif,
          encryptedWIF: encryptedKey,
          address: account.address,
          passphrase,
          privateKey: account.privateKey,
        };

        this.setCurrentWallet(currentWallet);

        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  openWIF(wif) {
    return new Promise((resolve, reject) => {
      try {
        const account = new wallet.Account(wif);
        const currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
        };

        this.setCurrentWallet(currentWallet);

        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  setCurrentWallet(wallet) {
    currentWallet = wallet;
  },

};

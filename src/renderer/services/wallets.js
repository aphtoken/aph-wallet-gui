import lockr from 'lockr';
import { wallet } from '@cityofzion/neon-js';

const STORAGE_KEY = 'aph.wallets';

export default {

  add(name, data) {
    const wallets = this.getAll();

    lockr.set(STORAGE_KEY, _.set(wallets, name, data));

    return this;
  },

  getAll() {
    return lockr.get(STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.values(this.getAll());
  },

  getOne(name) {
    return _.get(this.getAll(), name);
  },

  walletExists(name) {
    return !!this.getOne(name);
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

        this.currentWallet = {
          wif,
          encryptedWIF: walletToOpen.encryptedWIF,
          address: account.address,
          passphrase,
          privateKey: account.privateKey,
        };
        return resolve(this.currentWallet);
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

        this.currentWallet = {
          wif,
          encryptedWIF: encryptedKey,
          address: account.address,
          passphrase,
          privateKey: account.privateKey,
        };
        return resolve(this.currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  openWIF(wif) {
    return new Promise((resolve, reject) => {
      try {
        const account = new wallet.Account(wif);

        this.currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
        };
        return resolve(this.currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  getCurrent() {
    return this.currentWallet;
  },

};

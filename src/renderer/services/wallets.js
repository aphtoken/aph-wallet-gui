import lockr from 'lockr';
import { wallet } from '@cityofzion/neon-js';
import { store } from '../store';

const WALLETS_STORAGE_KEY = 'aph.wallets';
let currentWallet = null;

export default {

  add(name, data) {
    lockr.set(WALLETS_STORAGE_KEY, _.set(this.getAll(), name.trim(), data));

    return this;
  },

  remove(name) {
    return new Promise((resolve, reject) => {
      try {
        lockr.set(WALLETS_STORAGE_KEY, _.omit(this.getAll(), name.trim()));
        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  },

  clearCurrentWallet() {
    this.setCurrentWallet(null).sync();
  },

  getAll() {
    return lockr.get(WALLETS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), [wallet => wallet.label.toLowerCase()], ['label']);
  },

  getCurrentWallet() {
    return currentWallet;
  },

  getOne(name) {
    return _.find(this.getAllAsArray(), (o) => {
      return o.label === name;
    });
  },

  walletExists(name) {
    return !!this.getOne(name.trim());
  },

  openSavedWallet(name, passphrase) {
    return new Promise((resolve, reject) => {
      try {
        if (!name || name.length <= 0) {
          return reject('Empty Wallet Name');
        }
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

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  openEncryptedKey(encryptedKey, passphrase) {
    return new Promise((resolve, reject) => {
      try {
        if (!encryptedKey || encryptedKey.length <= 0) {
          return reject('Empty Encrypted Key');
        }
        if (!passphrase || passphrase.length <= 0) {
          return reject('Empty Passphrase');
        }
        const wif = wallet.decrypt(encryptedKey, passphrase);
        const account = new wallet.Account(wif);
        const currentWallet = {
          wif,
          encryptedWIF: encryptedKey,
          address: account.address,
          passphrase,
          privateKey: account.privateKey,
        };

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  openWIF(wif) {
    return new Promise((resolve, reject) => {
      try {
        if (!wif || wif.length <= 0) {
          return reject('Empty WIF');
        }
        const account = new wallet.Account(wif);
        const currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
        };

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },


  importWIF(name, wif, passphrase) {
    return new Promise((resolve, reject) => {
      try {
        if (this.walletExists(name) === true) {
          return reject(`Wallet with name '${name}' already exists.`);
        }
        const account = new wallet.Account(wif);
        const encryptedWIF = wallet.encrypt(account.WIF, passphrase);
        const currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
        };

        this.setCurrentWallet(currentWallet).sync();
        this.add(name, {
          label: name,
          encryptedWIF,
          address: account.address,
          scriptHash: account.scriptHash,
        })
          .sync();
        return resolve(currentWallet);
      } catch (e) {
        return reject(e);
      }
    });
  },

  setCurrentWallet(wallet) {
    currentWallet = wallet;

    return this;
  },

  sync() {
    store.commit('setCurrentWallet', currentWallet);
    store.commit('setWallets', this.getAllAsArray());
  },

};

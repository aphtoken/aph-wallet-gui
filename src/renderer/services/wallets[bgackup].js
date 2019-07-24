import { wallet } from '@cityofzion/neon-js';

import { store } from '../store';
import storage from './storage';
import storageNew from './storageNew';

const CryptoJS = require('crypto-js');
const bip32 = require('bip32');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const bitcoin = require('bitcoinjs-lib');
const TESTNET_BTC = bitcoin.networks.testnet;
// const MAINNET_BTC = bitcoin.networks.bitcoin;
const WALLETS_STORAGE_KEY = 'wallets';
const WALLETS_STORAGE_KEY_NEW = 'wallets_new';
let currentWallet = null;

export default {

  add(name, data) {
    storage.set(WALLETS_STORAGE_KEY, _.set(this.getAll(), this.cleanForKey(name), data));
    return this;
  },

  addNew(name, data) {
    storageNew.set(WALLETS_STORAGE_KEY_NEW, _.set(this.getAllNew(), this.cleanForKey(name), data));
    return this;
  },

  remove(name) {
    return new Promise((resolve, reject) => {
      try {
        storage.set(WALLETS_STORAGE_KEY, _.omit(this.getAll(), this.cleanForKey(name)));
        return resolve();
      } catch (e) {
        console.log(e);

        return reject('Unable to delete wallet');
      }
    });
  },

  clearCurrentWallet() {
    this.setCurrentWallet(null).sync();
  },

  getAll() {
    return storage.get(WALLETS_STORAGE_KEY, {});
  },

  getAllNew() {
    return storageNew.get(WALLETS_STORAGE_KEY_NEW, {});
  },

  getAllAsArray() {
    try {
      return _.sortBy(_.values(this.getAll()), [wallet => wallet.label.toLowerCase()], ['label']);
    } catch (e) {
      console.log(e);
      this.cleanBadWalletValues();
      return _.sortBy(_.values(this.getAll()), [wallet => wallet.label.toLowerCase()], ['label']);
    }
  },

  getAllAsArrayNew() {
    try {
      return _.sortBy(_.values(this.getAllNew()), [wallet => wallet.label.toLowerCase()], ['label']);
    } catch (e) {
      console.log(e);
      this.cleanBadWalletValuesNew();
      return _.sortBy(_.values(this.getAllNew()), [wallet => wallet.label.toLowerCase()], ['label']);
    }
  },

  cleanForKey(key) {
    return key.trim().replace('.', '_').replace('[', '').replace(']', '');
  },

  cleanBadWalletValues() {
    const wallets = this.getAll();
    const keys = Object.keys(wallets);
    const values = Object.values(wallets);
    for (let i = 0; i < keys.length; i += 1) {
      if (!values[i].label) {
        console.log(wallets);
        storage.set(WALLETS_STORAGE_KEY, _.omit(wallets, keys[i]));
      }
    }
  },

  cleanBadWalletValuesNew() {
    const wallets = this.getAllNew();
    const keys = Object.keys(wallets);
    const values = Object.values(wallets);
    for (let i = 0; i < keys.length; i += 1) {
      if (!values[i].label) {
        console.log(wallets);
        storageNew.set(WALLETS_STORAGE_KEY_NEW, _.omit(wallets, keys[i]));
      }
    }
  },

  getCurrentWallet() {
    return currentWallet;
  },

  getOne(label) {
    return _.find(this.getAllAsArray(), { label });
  },

  getOneNew(label) {
    return _.find(this.getAllAsArrayNew(), { label });
  },

  walletExists(name) {
    return !!this.getOne(name.trim());
  },

  walletExistsNew(name) {
    return !!this.getOneNew(name.trim());
  },

  openSavedWallet(name, passphrase) {
    return new Promise((resolve, reject) => {
      try {
        const walletToOpen = this.getOne(name);

        const wif = wallet.decrypt(walletToOpen.encryptedWIF, passphrase);
        const account = new wallet.Account(wif);

        const seedBytes = CryptoJS.AES.decrypt(walletToOpen.encryptedSeedString, passphrase);
        const seedString = seedBytes.toString(CryptoJS.enc.Utf8);

        const hdnode = hdkey.fromMasterSeed(Buffer.from(seedString, 'hex'));
        // setting for ethereum
        hdnode.derivePath("m/44'/60'/0'/0/0");
        // eth address
        const ethAddress = hdnode.getWallet().getAddressString();
        // eth key
        const ethPrivateKey = (hdnode.getWallet().getPrivateKeyString()).substring(2);
        const nodeBTC = bip32.fromSeed(Buffer.from(seedString, 'hex'), TESTNET_BTC);
        const nodeBTCString = nodeBTC.toBase58();
        const nodeBTCWif = bip32.fromBase58(nodeBTCString, TESTNET_BTC);
        // btc address
        const btcAddress = bitcoin.payments.p2pkh({ pubkey: nodeBTC.publicKey, network: TESTNET_BTC }).address;
        // btc key
        const btcWif = nodeBTCWif.toWIF();

        const currentWallet = {
          address: account.address,
          encryptedWIF: walletToOpen.encryptedWIF,
          label: walletToOpen.label,
          passphrase,
          privateKey: account.privateKey,
          wif,
          btcAddress,
          btcWif,
          ethAddress,
          ethPrivateKey,
        };

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        console.log(e);

        return reject('Wrong passphrase');
      }
    });
  },

  openLedger(publicKey) {
    return new Promise((resolve, reject) => {
      try {
        const scriptHash = wallet.getScriptHashFromPublicKey(publicKey);
        const address = wallet.getAddressFromScriptHash(scriptHash);
        const currentWallet = {
          isLedger: true,
          address,
          publicKey,
          publicKeyEncoded: wallet.getPublicKeyEncoded(publicKey),
        };

        this.setCurrentWallet(currentWallet).sync();
        return resolve(currentWallet);
      } catch (e) {
        console.log(e);
        return reject(e.message);
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

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        console.log(e);

        return reject('Wrong key or passphrase');
      }
    });
  },

  openWIF(wif) {
    return new Promise((resolve, reject) => {
      try {
        console.log(this.getOneNew(wif));
        console.log('hey bro');
        console.log(this.walletExistsNew(wif));
        console.log('hey bro');

        let encryptedSeedString;
        let seedString;

        if (this.walletExistsNew(wif)) {
          const walletToOpen = this.getOneNew(wif);
          const seedBytes = CryptoJS.AES.decrypt(walletToOpen.encryptedSeedString, wif);
          seedString = seedBytes.toString(CryptoJS.enc.Utf8);
        } else {
          this
            .addNew((new Date().getTime()).toString(), {
              label: wif,
              encryptedSeedString,
            })
            .sync();
          console.log(storageNew.get(WALLETS_STORAGE_KEY_NEW, {}));
          const mnemonic = bip39.generateMnemonic();
          seedString = bip39.mnemonicToSeedSync(mnemonic, wif).toString('hex');
        }

        const account = new wallet.Account(wif);

        const hdnode = hdkey.fromMasterSeed(Buffer.from(seedString, 'hex'));
        // setting for ethereum
        hdnode.derivePath("m/44'/60'/0'/0/0");
        // eth address
        const ethAddress = hdnode.getWallet().getAddressString();
        // eth key
        const ethPrivateKey = (hdnode.getWallet().getPrivateKeyString()).substring(2);
        const nodeBTC = bip32.fromSeed(Buffer.from(seedString, 'hex'), TESTNET_BTC);
        const nodeBTCString = nodeBTC.toBase58();
        const nodeBTCWif = bip32.fromBase58(nodeBTCString, TESTNET_BTC);
        // btc address
        const btcAddress = bitcoin.payments.p2pkh({ pubkey: nodeBTC.publicKey, network: TESTNET_BTC }).address;
        // btc key
        const btcWif = nodeBTCWif.toWIF();

        const currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
          btcAddress,
          btcWif,
          ethAddress,
          ethPrivateKey,
        };

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        console.log(e);

        return reject('Wrong private key');
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
        return reject('Wrong key or passphrase');
      }
    });
  },

  setCurrentWallet(wallet) {
    currentWallet = wallet;

    return this;
  },

  sync() {
    store.commit('setCurrentWallet', this.getCurrentWallet());
    store.commit('setWallets', this.getAllAsArray());
  },

};

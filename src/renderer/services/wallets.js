import { wallet } from '@cityofzion/neon-js';

import alerts from './alerts';
import { store } from '../store';
import storage from './storage';
import storageNew from './storageNew';
import network from './network';

const BWC = require('bitcore-wallet-client');
const CryptoJS = require('crypto-js');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const WALLETS_STORAGE_KEY = 'wallets';
let currentWallet = null;

export default {

  add(name, data) {
    storage.set(WALLETS_STORAGE_KEY, _.set(this.getAll(), this.cleanForKey(name), data));
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

  getAllAsArray() {
    try {
      return _.sortBy(_.values(this.getAll()), [wallet => wallet.label.toLowerCase()], ['label']);
    } catch (e) {
      console.log(e);
      this.cleanBadWalletValues();
      return _.sortBy(_.values(this.getAll()), [wallet => wallet.label.toLowerCase()], ['label']);
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
        storage.set(WALLETS_STORAGE_KEY, _.omit(wallets, keys[i]));
      }
    }
  },

  getCurrentWallet() {
    return currentWallet;
  },

  getOne(label) {
    return _.find(this.getAllAsArray(), { label });
  },

  walletExists(name) {
    return !!this.getOne(name.trim());
  },

  openSavedWallet(name, passphrase) {
    return new Promise(async (resolve, reject) => {
      try {
        const walletToOpen = this.getOne(name);
        const net = network.getSelectedNetwork().net;
        const bwsurl = network.getSelectedNetwork().bwsurl;

        const wif = wallet.decrypt(walletToOpen.encryptedWIF, passphrase);
        const account = new wallet.Account(wif);

        let walletToOpenNew = storageNew.getOne(wif);
        let mnemonic;
        let encryptedMnemonicString;
        let btcTestnetWalletClient;
        let btcMainnetWalletClient;
        let btcKey;

        if (walletToOpen.encryptedMnemonicString === undefined) {
          const dataBTCgen = await this.generateBTCETHWallet(name);
          if (dataBTCgen.err) {
            return reject('An error occured while trying to generate a new Bitcoin & Ethereum wallet.');
          }
          mnemonic = dataBTCgen.key.mnemonic;
          btcKey = dataBTCgen.key;
          btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
          btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;
          const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, account.WIF);
          encryptedMnemonicString = encryptedMnemonic.toString();

          this
            .add(name, {
              label: name,
              encryptedWIF: walletToOpen.encryptedWIF,
              address: walletToOpen.address,
              scriptHash: walletToOpen.scriptHash,
              encryptedMnemonicString,
            })
            .sync();

          storageNew
            .add(account.WIF, {
              label: account.WIF,
              encryptedMnemonicString,
              isNew: true,
            })
            .sync();
        } else {
          const mnemonicBytes = CryptoJS.AES.decrypt(walletToOpen.encryptedMnemonicString, wif);
          mnemonic = mnemonicBytes.toString(CryptoJS.enc.Utf8);

          if (walletToOpenNew.isNew) {
            const opts = {
              name,
              m: 1,
              n: 1,
              myName: 'me',
              bwsurl,
              singleAddress: false,
              coin: 'btc',
            };
            await this.createTestnetBTCWallet(walletToOpenNew.key, opts);
            await this.createMainnetBTCWallet(walletToOpenNew.key, opts);
          }

          const dataBTCgen = await this.getBTCWalletObjects(mnemonic);
          if (dataBTCgen.err) {
            return reject('An error occured while trying to login to Bitcoin wallet.');
          }
          btcKey = dataBTCgen.key;
          btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
          btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;
        }
        const seedString = bip39.mnemonicToSeedSync(mnemonic, wif).toString('hex');

        const hdnode = hdkey.fromMasterSeed(Buffer.from(seedString, 'hex'));
        // setting for ethereum
        hdnode.derivePath("m/44'/60'/0'/0/0");
        // eth address
        const ethAddress = hdnode.getWallet().getAddressString();
        // eth key
        const ethPrivateKey = (hdnode.getWallet().getPrivateKeyString()).substring(2);

        let btcTestnetAddress;
        let btcMainnetAddress;
        walletToOpenNew = storageNew.getOne(wif);

        if (walletToOpenNew.isNew) {
          const dataBTCadd1 = await this.createNewBTCAddress(btcTestnetWalletClient);
          const dataBTCadd2 = await this.createNewBTCAddress(btcMainnetWalletClient);

          if (dataBTCadd1.err || dataBTCadd2.err) {
            const dataTemp1 = await this.getMainAddress(btcTestnetWalletClient);
            const dataTemp2 = await this.getMainAddress(btcMainnetWalletClient);
            btcTestnetAddress = dataTemp1.address;
            btcMainnetAddress = dataTemp2.address;
            storageNew
              .add(account.WIF, {
                label: account.WIF,
                encryptedMnemonicString: walletToOpenNew.encryptedMnemonicString,
                btcTestnetAddress: dataTemp1.address,
                btcMainnetAddress: dataTemp2.address,
              })
              .sync();
          } else {
            btcTestnetAddress = dataBTCadd1.address;
            btcMainnetAddress = dataBTCadd2.address;
            storageNew
              .add(account.WIF, {
                label: account.WIF,
                encryptedMnemonicString: walletToOpenNew.encryptedMnemonicString,
                btcTestnetAddress: dataBTCadd1.address,
                btcMainnetAddress: dataBTCadd2.address,
              })
              .sync();
          }
          alerts.success('New addresses generated for Bitcoin & Ethereum.');
        } else {
          btcTestnetAddress = walletToOpenNew.btcTestnetAddress;
          btcMainnetAddress = walletToOpenNew.btcMainnetAddress;
        }

        const btcAddress = net === 'TestNet' ? btcTestnetAddress : btcMainnetAddress;
        const btcWalletClient = net === 'TestNet' ? btcTestnetWalletClient : btcMainnetWalletClient;

        const currentWallet = {
          address: account.address,
          encryptedWIF: walletToOpen.encryptedWIF,
          label: walletToOpen.label,
          passphrase,
          privateKey: account.privateKey,
          wif,
          btcAddress,
          btcTestnetAddress,
          btcMainnetAddress,
          btcWalletClient,
          btcTestnetWalletClient,
          btcMainnetWalletClient,
          btcKey,
          ethAddress,
          ethPrivateKey,
          mnemonic,
        };

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        console.log(e);
        return reject('Wrong passphrase');
      }
    });
  },

  changeBTCAddress() {
    const currentWallet = this.getCurrentWallet();

    if (currentWallet) {
      const net = network.getSelectedNetwork().net;
      currentWallet.btcAddress = net === 'TestNet' ? currentWallet.btcTestnetAddress : currentWallet.btcMainnetAddress; // eslint-disable-line max-len
      currentWallet.btcWalletClient = net === 'TestNet' ? currentWallet.btcTestnetWalletClient : currentWallet.btcMainnetWalletClient; // eslint-disable-line max-len
      this.setCurrentWallet(currentWallet).sync();
    }
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
    console.log('enc called');
    return new Promise(async (resolve, reject) => {
      try {
        const wif = wallet.decrypt(encryptedKey, passphrase);
        const account = new wallet.Account(wif);
        const net = network.getSelectedNetwork().net;

        let mnemonic;
        let btcTestnetAddress;
        let btcMainnetAddress;
        let btcTestnetWalletClient;
        let btcMainnetWalletClient;
        let btcKey;

        if (storageNew.walletExists(wif)) {
          const walletToOpen = storageNew.getOne(wif);
          const mnemonicBytes = CryptoJS.AES.decrypt(walletToOpen.encryptedMnemonicString, wif);
          mnemonic = mnemonicBytes.toString(CryptoJS.enc.Utf8);
          const dataBTCgen = await this.getBTCWalletObjects(mnemonic);
          if (dataBTCgen.err) {
            return reject('An error occured while trying to login to Bitcoin wallet.');
          }
          btcKey = dataBTCgen.key;
          btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
          btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;
          btcTestnetAddress = walletToOpen.btcTestnetAddress;
          btcMainnetAddress = walletToOpen.btcMainnetAddress;
        } else {
          const dataBTCgen = await this.generateBTCETHWallet('wall');
          if (dataBTCgen.err) {
            return reject('An error occured while trying to generate a new Bitcoin & Ethereum wallet.');
          }
          mnemonic = dataBTCgen.key.mnemonic;
          btcKey = dataBTCgen.key;
          btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
          btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;

          const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, wif);
          const encryptedMnemonicString = encryptedMnemonic.toString();

          const dataBTCadd1 = await this.createNewBTCAddress(btcTestnetWalletClient);
          const dataBTCadd2 = await this.createNewBTCAddress(btcMainnetWalletClient);

          if (dataBTCadd1.err || dataBTCadd2.err) {
            const dataTemp1 = await this.getMainAddress(btcTestnetWalletClient);
            const dataTemp2 = await this.getMainAddress(btcMainnetWalletClient);
            btcTestnetAddress = dataTemp1.address;
            btcMainnetAddress = dataTemp2.address;
            storageNew
              .add(wif, {
                label: wif,
                encryptedMnemonicString,
                btcTestnetAddress: dataTemp1.address,
                btcMainnetAddress: dataTemp2.address,
              })
              .sync();
          } else {
            btcTestnetAddress = dataBTCadd1.address;
            btcMainnetAddress = dataBTCadd2.address;
            storageNew
              .add(wif, {
                label: wif,
                encryptedMnemonicString,
                btcTestnetAddress: dataBTCadd1.address,
                btcMainnetAddress: dataBTCadd2.address,
              })
              .sync();
          }
          alerts.success('New addresses generated for Bitcoin & Ethereum.');
        }
        const seedString = bip39.mnemonicToSeedSync(mnemonic, wif).toString('hex');

        const hdnode = hdkey.fromMasterSeed(Buffer.from(seedString, 'hex'));
        // setting for ethereum
        hdnode.derivePath("m/44'/60'/0'/0/0");
        // eth address
        const ethAddress = hdnode.getWallet().getAddressString();
        // eth key
        const ethPrivateKey = (hdnode.getWallet().getPrivateKeyString()).substring(2);
        // btc address
        const btcAddress = net === 'TestNet' ? btcTestnetAddress : btcMainnetAddress;
        const btcWalletClient = net === 'TestNet' ? btcTestnetWalletClient : btcMainnetWalletClient;

        const currentWallet = {
          wif,
          encryptedWIF: encryptedKey,
          address: account.address,
          passphrase,
          privateKey: account.privateKey,
          btcAddress,
          btcTestnetAddress,
          btcMainnetAddress,
          btcWalletClient,
          btcTestnetWalletClient,
          btcMainnetWalletClient,
          btcKey,
          ethAddress,
          ethPrivateKey,
          mnemonic,
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
    return new Promise(async (resolve, reject) => {
      try {
        const net = network.getSelectedNetwork().net;
        const account = new wallet.Account(wif);

        let mnemonic;
        let btcTestnetAddress;
        let btcMainnetAddress;
        let btcTestnetWalletClient;
        let btcMainnetWalletClient;
        let btcKey;

        if (storageNew.walletExists(wif)) {
          const walletToOpen = storageNew.getOne(wif);
          const mnemonicBytes = CryptoJS.AES.decrypt(walletToOpen.encryptedMnemonicString, wif);
          mnemonic = mnemonicBytes.toString(CryptoJS.enc.Utf8);
          const dataBTCgen = await this.getBTCWalletObjects(mnemonic);
          if (dataBTCgen.err) {
            return reject('An error occured while trying to login to Bitcoin wallet.');
          }
          btcKey = dataBTCgen.key;
          btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
          btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;
          btcTestnetAddress = walletToOpen.btcTestnetAddress;
          btcMainnetAddress = walletToOpen.btcMainnetAddress;
        } else {
          const dataBTCgen = await this.generateBTCETHWallet('wall');
          if (dataBTCgen.err) {
            return reject('An error occured while trying to generate a new Bitcoin & Ethereum wallet.');
          }
          mnemonic = dataBTCgen.key.mnemonic;
          btcKey = dataBTCgen.key;
          btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
          btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;
          const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, wif);
          const encryptedMnemonicString = encryptedMnemonic.toString();

          const dataBTCadd1 = await this.createNewBTCAddress(btcTestnetWalletClient);
          const dataBTCadd2 = await this.createNewBTCAddress(btcMainnetWalletClient);

          if (dataBTCadd1.err || dataBTCadd2.err) {
            const dataTemp1 = await this.getMainAddress(btcTestnetWalletClient);
            const dataTemp2 = await this.getMainAddress(btcMainnetWalletClient);
            btcTestnetAddress = dataTemp1.address;
            btcMainnetAddress = dataTemp2.address;
            storageNew
              .add(wif, {
                label: wif,
                encryptedMnemonicString,
                btcTestnetAddress: dataTemp1.address,
                btcMainnetAddress: dataTemp2.address,
              })
              .sync();
          } else {
            btcTestnetAddress = dataBTCadd1.address;
            btcMainnetAddress = dataBTCadd2.address;
            storageNew
              .add(wif, {
                label: wif,
                encryptedMnemonicString,
                btcTestnetAddress: dataBTCadd1.address,
                btcMainnetAddress: dataBTCadd2.address,
              })
              .sync();
          }

          alerts.success('New addresses generated for Bitcoin & Ethereum.');
        }
        const seedString = bip39.mnemonicToSeedSync(mnemonic, wif).toString('hex');

        const hdnode = hdkey.fromMasterSeed(Buffer.from(seedString, 'hex'));
        // setting for ethereum
        hdnode.derivePath("m/44'/60'/0'/0/0");
        // eth address
        const ethAddress = hdnode.getWallet().getAddressString();
        // eth key
        const ethPrivateKey = (hdnode.getWallet().getPrivateKeyString()).substring(2);

        const btcAddress = net === 'TestNet' ? btcTestnetAddress : btcMainnetAddress;
        const btcWalletClient = net === 'TestNet' ? btcTestnetWalletClient : btcMainnetWalletClient;

        const currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
          ethAddress,
          ethPrivateKey,
          btcAddress,
          btcTestnetAddress,
          btcMainnetAddress,
          btcWalletClient,
          btcTestnetWalletClient,
          btcMainnetWalletClient,
          btcKey,
          mnemonic,
        };

        this.setCurrentWallet(currentWallet).sync();

        return resolve(currentWallet);
      } catch (e) {
        console.log(e);
        return reject('Wrong private key');
      }
    });
  },

  openWIFseedWords(wif, seedwords) {
    return new Promise(async (resolve, reject) => {
      try {
        const account = new wallet.Account(wif);
        seedwords = seedwords.trim();
        const seedwordsCount = seedwords.split(' ');
        if (seedwordsCount.length < 12) {
          return reject('Wrong number of seed words');
        }
        const net = network.getSelectedNetwork().net;

        const dataBTCgen = await this.getBTCWalletObjects(seedwords);
        if (dataBTCgen.err) {
          return reject('An error occured while trying to login to Bitcoin wallet.');
        }
        const btcKey = dataBTCgen.key;
        const btcTestnetWalletClient = dataBTCgen.btcTestnetWalletClient;
        const btcMainnetWalletClient = dataBTCgen.btcMainnetWalletClient;
        const seedString = bip39.mnemonicToSeedSync(seedwords, wif).toString('hex');

        const hdnode = hdkey.fromMasterSeed(Buffer.from(seedString, 'hex'));
        // setting for ethereum
        hdnode.derivePath("m/44'/60'/0'/0/0");
        // eth address
        const ethAddress = hdnode.getWallet().getAddressString();
        // eth key
        const ethPrivateKey = (hdnode.getWallet().getPrivateKeyString()).substring(2);

        const dataBTCadd1 = await this.getMainAddress(btcTestnetWalletClient);
        const dataBTCadd2 = await this.getMainAddress(btcMainnetWalletClient);

        if (dataBTCadd1.err || dataBTCadd2.err) {
          return reject('An error occured while trying to generate Bitcoin address.');
        }

        const btcTestnetAddress = dataBTCadd1.address;
        const btcMainnetAddress = dataBTCadd2.address;
        // btc address
        const btcAddress = net === 'TestNet' ? btcTestnetAddress : btcMainnetAddress;
        const btcWalletClient = net === 'TestNet' ? btcTestnetWalletClient : btcMainnetWalletClient;

        const currentWallet = {
          wif,
          address: account.address,
          privateKey: account.privateKey,
          ethAddress,
          ethPrivateKey,
          btcAddress,
          btcTestnetAddress,
          btcMainnetAddress,
          btcWalletClient,
          btcTestnetWalletClient,
          btcMainnetWalletClient,
          btcKey,
          mnemonic: seedwords,
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

  getClient() {
    // note: use `bwsurl` all lowercase;
    const bwsurl = network.getSelectedNetwork().bwsurl;
    const bwc = new BWC({
      baseUrl: bwsurl,
      verbose: false,
      timeout: 100000,
      transports: ['polling'],
    });

    return bwc;
  },

  getKey() {
    return BWC.Key;
  },

  generateBTCETHWallet(walletName) {
    return new Promise(async (resolve, reject) => {
      const bwsurl = network.getSelectedNetwork().bwsurl;
      const opts = {
        name: walletName,
        m: 1,
        n: 1,
        myName: 'me',
        bwsurl,
        singleAddress: false,
        coin: 'btc',
      };
      const Key = this.getKey();

      const lang = {
        name: 'English',
        isoCode: 'en',
      };

      // creating key

      const key = Key.create({
        lang,
      });

      const btcTestnet = await this.createTestnetBTCWallet(key, opts);
      const btcMainnet = await this.createMainnetBTCWallet(key, opts);

      if (btcTestnet.err || btcMainnet.err) {
        reject({
          err: true,
        });
      } else {
        resolve({
          key,
          btcTestnetWalletClient: btcTestnet.walletClient,
          btcMainnetWalletClient: btcMainnet.walletClient,
        });
      }
    });
  },

  generateBTCwalletKey() {
    const Key = this.getKey();

    const lang = {
      name: 'English',
      isoCode: 'en',
    };

    // creating key

    const key = Key.create({
      lang,
    });

    return ({
      key,
    });
  },

  createTestnetBTCWallet(key, opts) {
    return new Promise((resolve, reject) => {
      opts.networkName = 'testnet';
      const walletClient = this.getClient(null, opts);
      walletClient.fromString(
        key.createCredentials('', {
          coin: opts.coin,
          network: 'testnet',
          account: opts.account || 0,
          n: opts.n || 1,
        }),
      );

      walletClient.createWallet(
        opts.name,
        opts.myName,
        opts.m,
        opts.n,
        {
          network: 'testnet',
          singleAddress: opts.singleAddress,
          walletPrivKey: opts.walletPrivKey,
          coin: opts.coin,
        },
        (err) => {
          if (err) {
            console.log(err);
            reject({
              err: true,
            });
          } else {
            resolve({
              walletClient,
            });
          }
        },
      );
    });
  },

  createMainnetBTCWallet(key, opts) {
    return new Promise((resolve, reject) => {
      opts.networkName = 'livenet';
      const walletClient = this.getClient(null, opts);
      walletClient.fromString(
        key.createCredentials('', {
          coin: opts.coin,
          network: 'livenet',
          account: opts.account || 0,
          n: opts.n || 1,
        }),
      );

      walletClient.createWallet(
        opts.name,
        opts.myName,
        opts.m,
        opts.n,
        {
          network: 'livenet',
          singleAddress: opts.singleAddress,
          walletPrivKey: opts.walletPrivKey,
          coin: opts.coin,
        },
        (err) => {
          if (err) {
            console.log(err);
            reject({
              err: true,
            });
          } else {
            resolve({
              walletClient,
            });
          }
        },
      );
    });
  },

  getBTCWalletObjects(mnemonic) {
    return new Promise((resolve, reject) => {
      const bwsurl = network.getSelectedNetwork().bwsurl;
      const opts = {
        bwsurl,
        passphrase: null,
        words: mnemonic,
      };
      BWC.serverAssistedImport(
        opts,
        {
          baseUrl: opts.bwsurl,
        },
        (err, key, walletClients) => {
          // walletClients.length === 0 => WALLET_DOES_NOT_EXIST
          if (err) {
            reject({
              err: true,
            });
          } else {
            const btcTestnetWalletClient = walletClients[0].credentials.network === 'testnet' ?
              walletClients[0] : walletClients[1];
            const btcMainnetWalletClient = walletClients[0].credentials.network === 'livenet' ?
              walletClients[0] : walletClients[1];

            resolve({
              key,
              btcTestnetWalletClient,
              btcMainnetWalletClient,
            });
          }
        },
      );
    });
  },

  createNewBTCAddress(walletClient) {
    return new Promise((resolve, reject) => {
      walletClient.createAddress({}, (err, addr) => {
        if (err) {
          console.log(err);
          reject({
            err: true,
          });
        } else {
          resolve({
            address: addr.address,
          });
        }
      });
    });
  },

  getMainAddress(walletClient) {
    return new Promise((resolve, reject) => {
      walletClient.getMainAddresses(
        {
          reverse: true,
          limit: 1,
        },
        (err, addr) => {
          if (err) {
            reject({
              err: true,
            });
          } else {
            resolve({
              address: addr[0].address,
            });
          }
        },
      );
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

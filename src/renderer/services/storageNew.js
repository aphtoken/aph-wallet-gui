import { store } from '../store';
import storage from './storage';

const WALLETS_STORAGE_KEY_NEW = 'wallets_new';


export default {

  add(name, data) {
    storage.set(WALLETS_STORAGE_KEY_NEW, _.set(this.getAll(), this.cleanForKey(name), data));
    return this;
  },

  remove(name) {
    return new Promise((resolve, reject) => {
      try {
        storage.set(WALLETS_STORAGE_KEY_NEW, _.omit(this.getAll(), this.cleanForKey(name)));
        return resolve();
      } catch (e) {
        return reject('Unable to delete wallet');
      }
    });
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
        storage.set(WALLETS_STORAGE_KEY_NEW, _.omit(wallets, keys[i]));
      }
    }
  },

  getOne(label) {
    return _.find(this.getAllAsArray(), { label });
  },

  getAll() {
    return storage.get(WALLETS_STORAGE_KEY_NEW, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), 'label');
  },

  walletExists(name) {
    return !!this.getOne(name.trim());
  },

  sync() {
    store.commit('setWalletsNew', this.getAllAsArray());
  },

};

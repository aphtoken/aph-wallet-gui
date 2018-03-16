import lockr from 'lockr';

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

  getOne(name) {
    return _.get(this.getAll(), name);
  },

  walletExists(name) {
    return !!this.getOne(name);
  },

};

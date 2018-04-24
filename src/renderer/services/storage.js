import Store from 'electron-store';
import _ from 'lodash';
import { ipcRenderer } from 'electron';

const store = new Store();
const keysToRemove = [
  'holdings',
  'portfolios',
  'token',
  'txs',
];
let localStore = store.store;

const service = {
  delete(key) {
    localStore = _.omit(localStore, key);
    ipcRenderer.send('storage.delete', key);

    return this;
  },

  get(key, defaultValue = null) {
    return _.get(localStore, key, defaultValue);
  },

  has(key) {
    return _.has(localStore, key);
  },

  path() {
    return store.path;
  },

  set(key, value) {
    _.set(localStore, key, value);
    ipcRenderer.send('storage.set', key, value);

    return this;
  },
};

function clean() {
  console.log(`Cleaning deprecated storage keys: ${keysToRemove.join()}`);

  keysToRemove.forEach((key) => {
    service.delete(key);
  });
}

clean();

export default service;

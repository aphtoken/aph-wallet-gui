import Store from 'electron-store';
import { ipcRenderer } from 'electron';

const store = new Store();
const localStore = store.store;

export default {
  clear() {
    return store.clear();
  },

  delete(key) {
    return store.delete(key);
  },

  get(key, defaultValue = null) {
    return _.get(localStore, key, defaultValue);
  },

  has(key) {
    return _.has(localStore, key);
  },

  set(key, value) {
    _.set(localStore, key, value);
    ipcRenderer.send('storage.set', key, value);

    return this;
  },
};

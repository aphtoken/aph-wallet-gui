import Store from 'electron-store';
import _ from 'lodash';
import { ipcRenderer } from 'electron';

let store;
let localStore;

export default {
  clean() {
    localStore = ipcRenderer.sendSync('storage.clean');
  },

  delete(key) {
    localStore = _.omit(localStore, key);
    ipcRenderer.send('storage.delete', key);

    return this;
  },

  get(key, defaultValue = null) {
    return _.get(localStore, key, defaultValue);
  },

  has(key) {
    _.clear();
    return _.has(localStore, key);
  },

  init() {
    store = new Store();
    localStore = store.store;

    this.clean();
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

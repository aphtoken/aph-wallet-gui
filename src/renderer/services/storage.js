import Store from 'electron-store';

const store = new Store();

export default {
  clear() {
    return store.clear();
  },

  delete(key) {
    return store.delete(key);
  },

  get(key, defaultValue = null) {
    return store.get(key, defaultValue);
  },

  has(key) {
    return store.has(key);
  },

  path() {
    return store.path;
  },

  set(key, value) {
    return store.set(key, value);
  },
};

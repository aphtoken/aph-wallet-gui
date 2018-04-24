import { ipcRenderer } from 'electron';

export default {
  get(key, defaultValue = null) {
    return new Promise((resolve) => {
      ipcRenderer
        .sendSync('db.get', key)
        .then((response) => {
          resolve(response);
        })
        .catch(() => {
          resolve(defaultValue);
        });
    });
  },

  put(key, value) {
    return ipcRenderer.sendSync('db.put', key, value);
  },

  remove(key) {
    return ipcRenderer.sendSync('db.remove', key);
  },
};

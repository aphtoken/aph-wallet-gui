import ipcPromise from 'ipc-promise';
import _ from 'lodash';

function formatResponse(response, defaultValue) {
  return _.get(response, 'data', defaultValue);
}

export default {
  async get(id, defaultValue = null) {
    try {
      const response = await ipcPromise.send('db.get', id);
      return Promise.resolve(formatResponse(response, defaultValue));
    } catch (e) {
      return Promise.resolve(defaultValue);
    }
  },

  async remove(id) {
    try {
      await ipcPromise.send('db.remove', id);
    } catch (e) {
      console.log(e);
    }
  },

  async upsert(id, data) {
    try {
      await ipcPromise.send('db.upsert', { id, data });
    } catch (e) {
      console.log(e);
    }
  },
};

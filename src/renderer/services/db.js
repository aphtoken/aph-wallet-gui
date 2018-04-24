import ipcPromise from 'ipc-promise';
import _ from 'lodash';

function formatResponse(response) {
  return _.values(_.omit(
    response,
    ['_id', '_rev'],
  ));
}

export default {
  async get(id, defaultValue = null) {
    try {
      const response = await ipcPromise.send('db.get', id);

      return Promise.resolve(formatResponse(response));
    } catch (e) {
      return Promise.resolve(defaultValue);
    }
  },

  async put(id, value) {
    try {
      await ipcPromise.send('db.put', id, value);
    } catch (e) {
      console.log(e);
    }
  },

  async remove(id) {
    try {
      await ipcPromise.send('db.remove', id);
    } catch (e) {
      console.log(e);
    }
  },

  async upsert(id, value) {
    try {
      await ipcPromise.send('db.upsert', id, value);
    } catch (e) {
      console.log(e);
    }
  },
};

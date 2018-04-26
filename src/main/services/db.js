import PouchDB from 'pouchdb';
import PouchDBUpsert from 'pouchdb-upsert';
import ipcPromise from 'ipc-promise';
import path from 'path';
import { app } from 'electron';

import { database } from '../../renderer/constants';

// PouchDB config
if (process.env.NODE_ENV === 'development') {
  PouchDB.debug.enable('*');
}

// PouchDB plugins
PouchDB.plugin(PouchDBUpsert);

// Create database
const db = new PouchDB(path.join(app.getPath('userData'), database.NAME), { adapter: 'leveldb' });

const service = {
  get(id) {
    return db.get(id);
  },

  remove(id) {
    return db.remove(id);
  },

  upsert(id, data) {
    return new Promise((resolve, reject) => {
      db
        .upsert(id, () => {
          return { data };
        })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};

ipcPromise.on('db.get', id => service.get(id));
ipcPromise.on('db.remove', id => service.remove(id));
ipcPromise.on('db.upsert', ({ id, data }) => service.upsert(id, data));

export default service;

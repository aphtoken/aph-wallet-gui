import PouchDB from 'pouchdb';
import PouchDBUpsert from 'pouchdb-upsert';
import _ from 'lodash';
import ipcPromise from 'ipc-promise';
import path from 'path';
import { app } from 'electron';

import { database } from '../../renderer/constants';

// PouchDB plugins
PouchDB.plugin(PouchDBUpsert);

// Create database
const db = new PouchDB(path.join(app.getPath('userData'), database.NAME));

const service = {
  get(id) {
    return db.get(id);
  },

  put(_id, value) {
    return db.put(_.merge(
      { _id },
      value,
    ));
  },

  remove(id) {
    return db.remove(id);
  },

  upsert(id, value) {
    const promise = db.upsert(id, (doc) => {
      return _.merge({}, doc, value);
    });

    return promise;
  },
};

ipcPromise.on('db.get', (id) => {
  return service.get(id);
});

ipcPromise.on('db.put', (id, value) => {
  return service.put(id, value);
});

ipcPromise.on('db.remove', (id) => {
  return service.remove(id);
});

ipcPromise.on('db.upsert', (id) => {
  return service.upsert(id);
});

export default service;

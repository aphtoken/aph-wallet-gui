import path from 'path';
import PouchDB from 'pouchdb';
import { app, ipcMain } from 'electron';
import _ from 'lodash';

const db = new PouchDB(path.join(app.getPath('userData'), 'aphelion'));

db
  .allDocs()
  .then((result) => {
    console.log(result);
  })
  .catch((e) => {
    console.log(e);
  });

const service = {
  get(_id) {
    return db.get(_id);
  },

  put(_id, value) {
    return db.put(_.merge(
      { _id },
      value,
    ));
  },

  remove(_id) {
    return db.remove(_id);
  },
};

ipcMain.on('db.get', (event, key) => {
  event.returnValue = service.get(key);
});

ipcMain.on('db.put', (event, key, value) => {
  event.returnValue = service.put(key, value);
});

ipcMain.on('db.remove', (event, key) => {
  event.returnValue = service.remove(key);
});

export default service;

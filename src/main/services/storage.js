import Store from 'electron-store';
import _ from 'lodash';
import { ipcMain } from 'electron';

const store = new Store();
const keysToRemove = [
  'aph',
  'holdings',
  'portfolios',
  'token',
  'txs',
  'network.rpcClient',
];

ipcMain.on('storage.clean', (event) => {
  console.log(`Cleaning deprecated storage keys: ${keysToRemove.join()}`);

  event.returnValue = store.store = _.omit(store.store, keysToRemove);
});


ipcMain.on('storage.delete', (event, key) => {
  store.delete(key);
});

ipcMain.on('storage.set', (event, key, value) => {
  store.set(key, value);
});

import Store from 'electron-store';
import { ipcMain } from 'electron';

const store = new Store();

ipcMain.on('storage.set', (event, key, value) => {
  store.set(key, value);
});

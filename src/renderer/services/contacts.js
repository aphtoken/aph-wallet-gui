import { store } from '../store';
import storage from './storage';

const CONTACTS_STORAGE_KEY = 'contacts';

export default {

  add(address, data) {
    const contacts = this.getAll();
    storage.set(CONTACTS_STORAGE_KEY, _.set(contacts, this.cleanForKey(address), data));

    return this;
  },

  remove(address) {
    const contacts = this.getAll();
    storage.set(CONTACTS_STORAGE_KEY, _.omit(contacts, this.cleanForKey(address)));

    return this;
  },

  getAll() {
    return storage.get(CONTACTS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), 'name');
  },

  getOne(name) {
    return _.find(this.getAllAsArray(), { name });
  },

  cleanForKey(key) {
    return key.trim().replace('.', '_').replace('[', '').replace(']', '');
  },

  contactExists(name) {
    return !!this.getOne(name.trim());
  },

  findContactByAddress(address) {
    return _.find(this.getAllAsArray(), { address });
  },

  sync() {
    store.commit('setContacts', this.getAllAsArray());
  },

};

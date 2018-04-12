import lockr from 'lockr';

import { store } from '../store';

const CONTACTS_STORAGE_KEY = 'aph.contacts';

export default {

  add(address, data) {
    const contacts = this.getAll();
    lockr.set(CONTACTS_STORAGE_KEY, _.set(contacts, address.trim(), data));

    return this;
  },

  remove(address) {
    const contacts = this.getAll();
    lockr.set(CONTACTS_STORAGE_KEY, _.omit(contacts, address.trim()));

    return this;
  },

  getAll() {
    return lockr.get(CONTACTS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), 'name');
  },

  getOne(name) {
    return _.find(this.getAllAsArray(), (o) => {
      return o.name === name;
    });
  },

  contactExists(name) {
    return !!this.getOne(name.trim());
  },

  sync() {
    store.commit('setContacts', this.getAllAsArray());
  },

};

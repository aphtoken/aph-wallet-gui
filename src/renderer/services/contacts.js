import lockr from 'lockr';

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
    return _.values(this.getAll()).sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
  },

  getOne(name) {
    return _.get(this.getAll(), name);
  },

  contactExists(name) {
    return !!this.getOne(name.trim());
  },

};

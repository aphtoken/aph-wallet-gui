import storage from './storage';

const TOKENS_STORAGE_KEY = 'tokens';

export default {

  add(data) {
    if (this.tokenExists(data.assetId, data.network)) {
      const existing = this.getOne(data.assetId, data.network);
      if (existing) {
        let skipUpdate = false;
        if (existing.isCustom === data.isCustom
          || (existing.isCustom === true && data.isCustom === false)) {
          // skip updating if already in local db and isCustom is the same
          //   or isCustom is already true and this would set it back to false
          skipUpdate = true;
        }

        if (data.sale || existing.sale) {
          // if the existing token or the new token data has token sale info, update
          // (important for keeping sale information up to date with server)
          skipUpdate = false;
          data.isCustom = existing.isCustom;
        }

        if (skipUpdate === true) {
          return;
        }
      }
    }

    const tokens = this.getAll();
    storage.set(TOKENS_STORAGE_KEY, _.set(tokens, `${data.assetId}_${data.network}`, data));
  },

  remove(assetId, network) {
    const tokens = this.getAll();
    const token = this.getOne(assetId, network);
    if (!token) {
      return this;
    }
    token.isCustom = false;
    storage.set(TOKENS_STORAGE_KEY, _.set(tokens, `${assetId}_${network}`, token));

    return this;
  },

  getAll() {
    return storage.get(TOKENS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), [token => token.symbol.toLowerCase()], ['symbol']);
  },

  getOne(assetId, network) {
    return _.get(this.getAll(), `${assetId}_${network}`);
  },

  tokenExists(assetId, network) {
    return !!this.getOne(assetId, network);
  },

};

import lockr from 'lockr';

const TOKENS_STORAGE_KEY = 'aph.token';

export default {

  add(data) {
    if (this.tokenExists(data.assetId, data.network)) {
      const existing = this.getOne(data.assetId, data.network);
      if (existing) {
        if (existing.isCustom === data.isCustom
          || (existing.isCustom === true && data.isCustom === false)) {
          return this;
        }
      }
    }

    const tokens = this.getAll();
    lockr.set(TOKENS_STORAGE_KEY, _.set(tokens, `${data.assetId}_${data.network}`, data));
    return this;
  },

  remove(assetId, network) {
    const tokens = this.getAll();
    lockr.set(TOKENS_STORAGE_KEY, _.omit(tokens, `${assetId}_${network}`));
    return this;
  },

  getAll() {
    return lockr.get(TOKENS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), [token => token.symbol.toLowerCase()], ['symbol']);
  },

  getOne(assetId, network) {
    return _.get(this.getAll(), `${assetId}_${network}`);
  },

  tokenExists(assetId, network) {
    return !this.getOne(`${assetId}_${network}`);
  },

};

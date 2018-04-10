import lockr from 'lockr';

const TOKENS_STORAGE_KEY = 'aph.tokens';

export default {

  add(symbol, data) {
    if (this.tokenExists(symbol, data.network)) {
      const existing = this.getOne(symbol, data.network);
      if (existing) {
        if (existing.isCustom === data.isCustom
          || (existing.isCustom === true && data.isCustom === false)) {
          return this;
        }
      }
    }

    const tokens = this.getAll();
    lockr.set(TOKENS_STORAGE_KEY, _.set(tokens, `${symbol}_${data.network}`, data));
    return this;
  },

  remove(symbol, network) {
    const tokens = this.getAll();
    lockr.set(TOKENS_STORAGE_KEY, _.omit(tokens, `${symbol}_${network}`));
    return this;
  },

  getAll() {
    return lockr.get(TOKENS_STORAGE_KEY, {});
  },

  getAllAsArray() {
    return _.sortBy(_.values(this.getAll()), [token => token.symbol.toLowerCase()], ['symbol']);
  },

  getOne(symbol, network) {
    return _.get(this.getAll(), `${symbol}_${network}`);
  },

  tokenExists(symbol, network) {
    return !this.getOne(`${symbol}_${network}`);
  },

};

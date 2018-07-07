import storage from './storage';

const TOKENS_STORAGE_KEY = 'tokens';

export default {

  putInternal(existingTokens, token) {
    if (!token.isCustom) {
      const existingToken = _.get(existingTokens, `${token.assetId}_${token.network}`);
      if (existingToken && existingToken.isCustom === true) {
        token.isCustom = true;
      }
    }
    _.set(existingTokens, `${token.assetId}_${token.network}`, token);
  },

  add(token) {
    const existingTokens = this.getAll();

    this.putInternal(existingTokens, token);
    storage.set(TOKENS_STORAGE_KEY, existingTokens);
  },

  putAll(tokens) {
    const existingTokens = this.getAll();

    tokens.forEach((token) => {
      this.putInternal(existingTokens, token);
    });
    storage.set(TOKENS_STORAGE_KEY, existingTokens);
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

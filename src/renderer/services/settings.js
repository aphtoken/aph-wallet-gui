import lockr from 'lockr';

import { defaultSettings } from '../constants';

const CURRENCY_STORAGE_KEY = 'aph.settings.currency';

export default {

  getCurrency() {
    return lockr.get(CURRENCY_STORAGE_KEY, defaultSettings.CURRENCY);
  },

  setCurrency(currency) {
    lockr.set(CURRENCY_STORAGE_KEY, currency);

    return this;
  },

};

import _ from 'lodash';

import { defaultSettings } from '../constants';
import { store } from '../store';
import storage from './storage';

const SETTINGS_STORAGE_KEY = 'settings';
const CURRENCY_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}.currency`;
const CURRENCY_SYMBOL_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}.currencySymbol`;
const CURRENCIES = {
  USD: {
    label: 'USD',
    symbol: '$',
    centSymbol: '￠',
    value: 'USD',
  },
  EUR: {
    label: 'EUR',
    symbol: '€',
    centSymbol: 'c',
    value: 'EUR',
  },
  JPY: {
    label: 'JPY',
    symbol: '¥',
    centSymbol: 'sen',
    value: 'JPY',
  },
  GBP: {
    label: 'GBP',
    symbol: '£',
    centSymbol: 'p',
    value: 'GBP',
  },
  CHF: {
    label: 'CHF',
    symbol: null,
    centSymbol: null,
    value: 'CHF',
  },
  CAD: {
    label: 'CAD',
    symbol: '$',
    centSymbol: '￠',
    value: 'CAD',
  },
  AUD: {
    label: 'AUD',
    symbol: '$',
    centSymbol: 'c',
    value: 'AUD',
  },
};
const STYLE_MODE_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}.style`;

export default {

  getCurrencies() {
    return CURRENCIES;
  },

  getCurrenciesAsArray() {
    return _.sortBy(_.values(CURRENCIES), 'label');
  },

  getCurrency() {
    return storage.get(CURRENCY_STORAGE_KEY, defaultSettings.CURRENCY);
  },

  getCurrencySymbol(isCent = false) {
    return CURRENCIES[this.getCurrency()][isCent ? 'centSymbol' : 'symbol'];
  },

  setCurrency(currency) {
    storage.set(CURRENCY_STORAGE_KEY, currency);
    this.setCurrencySymbol(this.getCurrencySymbol());
    this.sync();

    return this;
  },

  setCurrencySymbol(currencySymbol) {
    storage.set(CURRENCY_SYMBOL_STORAGE_KEY, currencySymbol);

    return this;
  },

  sync() {
    store.commit('setCurrency', this.getCurrency());
    store.commit('setCurrencySymbol', this.getCurrencySymbol());
  },

  getStyleMode() {
    return storage.get(STYLE_MODE_STORAGE_KEY, defaultSettings.STYLE);
  },

  setStyleMode(style) {
    storage.set(STYLE_MODE_STORAGE_KEY, style);
    this.sync();

    return this;
  },

};

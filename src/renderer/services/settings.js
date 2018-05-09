import _ from 'lodash';
import { defaultSettings } from '../constants';
import storage from './storage';
import { store } from '../store';

const SETTINGS_STORAGE_KEY = 'settings';
const CURRENCY_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}.currency`;
const CURRENCY_SYMBOL_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}.currencySymbol`;
const CURRENCIES = {
  AUD: {
    label: 'AUD',
    symbol: '$',
    value: 'AUD',
  },
  CAD: {
    label: 'CAD',
    symbol: '$',
    value: 'CAD',
  },
  CHF: {
    label: 'CHF',
    symbol: null,
    value: 'CHF',
  },
  EUR: {
    label: 'EUR',
    symbol: '€',
    value: 'EUR',
  },
  GBP: {
    label: 'GBP',
    symbol: '£',
    value: 'GBP',
  },
  JPY: {
    label: 'JPY',
    symbol: '¥',
    value: 'JPY',
  },
  USD: {
    label: 'USD',
    symbol: '$',
    value: 'USD',
  },
};

export default {
  getCurrencies() {
    return CURRENCIES;
  },

  getCurrenciesAsArray() {
    return _.values(CURRENCIES);
  },

  getCurrency() {
    return storage.get(CURRENCY_STORAGE_KEY, defaultSettings.CURRENCY);
  },

  getCurrencySymbol() {
    return CURRENCIES[this.getCurrency()].symbol;
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
};

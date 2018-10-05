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
    value: 'USD',
  },
  EUR: {
    label: 'EUR',
    symbol: '€',
    value: 'EUR',
  },
  JPY: {
    label: 'JPY',
    symbol: '¥',
    value: 'JPY',
  },
  GBP: {
    label: 'GBP',
    symbol: '£',
    value: 'GBP',
  },
  CHF: {
    label: 'CHF',
    symbol: null,
    value: 'CHF',
  },
  CAD: {
    label: 'CAD',
    symbol: '$',
    value: 'CAD',
  },
  AUD: {
    label: 'AUD',
    symbol: '$',
    value: 'AUD',
  },
};
const GAS_FRACTURE_STORAGE_KEY = `${SETTINGS_STORAGE_KEY}.gasFracture`;
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
    store.commit('setStyleMode', this.getStyleMode());
    store.commit('setGasFracture', this.getGasFracture());
  },

  getStyleMode() {
    return storage.get(STYLE_MODE_STORAGE_KEY, defaultSettings.STYLE);
  },

  setStyleMode(style) {
    storage.set(STYLE_MODE_STORAGE_KEY, style);
    this.sync();

    return this;
  },

  getGasFracture() {
    return storage.get(GAS_FRACTURE_STORAGE_KEY, null);
  },

  setGasFracture(fracture) {
    storage.set(GAS_FRACTURE_STORAGE_KEY, fracture);
    this.sync();

    return this;
  },

  toggleGasFracture() {
    storage.set(GAS_FRACTURE_STORAGE_KEY, !this.getGasFracture());
    this.sync();

    return this;
  },

};

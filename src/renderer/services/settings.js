import _ from 'lodash';
import lockr from 'lockr';

import { defaultSettings } from '../constants';

const CURRENCY_STORAGE_KEY = 'aph.settings.currency';
const CURRENCY_SYMBOL_STORAGE_KEY = 'aph.settings.currencySymbol';
const CURRENCIES = [
  {
    label: 'USD',
    symbol: '$',
    value: 'USD',
  },
  {
    label: 'EUR',
    symbol: '€',
    value: 'EUR',
  },
  {
    label: 'JPY',
    symbol: '¥',
    value: 'JPY',
  },
  {
    label: 'GBP',
    symbol: '£',
    value: 'GBP',
  },
  {
    label: 'CHF',
    symbol: null,
    value: 'CHF',
  },
  {
    label: 'CAD',
    symbol: '$',
    value: 'CAD',
  },
];


export default {

  getCurrencies() {
    return CURRENCIES;
  },

  getCurrency() {
    return lockr.get(CURRENCY_STORAGE_KEY, defaultSettings.CURRENCY);
  },

  getCurrencySymbol() {
    return _.find(CURRENCIES, { value: this.getCurrency() }).symbol;
  },

  setCurrency(currency) {
    lockr.set(CURRENCY_STORAGE_KEY, currency);
    this.setCurrencySymbol(this.getCurrencySymbol());

    return this;
  },

  setCurrencySymbol(currencySymbol) {
    lockr.set(CURRENCY_SYMBOL_STORAGE_KEY, currencySymbol);

    return this;
  },

};

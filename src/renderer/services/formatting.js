import _ from 'lodash';
import accounting from 'accounting';
import moment from 'moment';
import numeral from 'numeral';
import { BigNumber } from 'bignumber.js';

import settings from './settings';
import { formats } from '../constants';

const nullOrUndefined = value => _.isNull(value) || _.isUndefined(value);
const toBigNumber = value => new BigNumber(String(value));

export default {
  formatDate(timestamp, defaultValue = '--') {
    if (nullOrUndefined(timestamp)) {
      return defaultValue;
    }

    return moment.unix(timestamp).format(formats.DATE);
  },

  formatDateShort(timestamp, defaultValue = '--') {
    if (nullOrUndefined(timestamp)) {
      return defaultValue;
    }

    return moment.unix(timestamp).format(formats.DATE_SHORT);
  },

  formatMoney(value, symbol, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }

    return accounting.formatMoney(toBigNumber(value), symbol || settings.getCurrencySymbol());
  },

  formatNumber(value, format = formats.NUMBER, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }
    const bigNumber = toBigNumber(value);
    if (bigNumber.e <= -6) {
      // seeing weird behavior from numeral.format on very small negative numbers, adding this hack for now
      return bigNumber.toFixed(8);
    }
    return numeral(bigNumber).format(format);
  },

  formatTime(timestamp, defaultValue = '--') {
    if (nullOrUndefined(timestamp)) {
      return defaultValue;
    }

    return moment.unix(timestamp).format(formats.TIME);
  },
};

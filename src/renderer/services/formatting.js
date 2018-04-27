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

  formatNumber(value,
    defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }
    let bigNumber = toBigNumber(value);
    const isNegative = bigNumber.isNegative();
    bigNumber = bigNumber.abs();
    let wholeNumber = bigNumber.integerValue(BigNumber.ROUND_FLOOR);
    const fractionalNumber = bigNumber.minus(wholeNumber);
    if (!wholeNumber.isZero()) {
      wholeNumber = isNegative ? wholeNumber.multipliedBy(-1) : wholeNumber;
      return `${numeral(wholeNumber).format(formats.WHOLE_NUMBER)}`
        + `${numeral(fractionalNumber).format(formats.FRACTIONAL_NUMBER)}`;
    }
    return (isNegative ? '-' : '') + numeral(fractionalNumber).format(formats.FRACTIONAL_NEGATIVE_NUMBER);
  },

  formatTime(timestamp, defaultValue = '--') {
    if (nullOrUndefined(timestamp)) {
      return defaultValue;
    }

    return moment.unix(timestamp).format(formats.TIME);
  },
};

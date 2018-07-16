import _ from 'lodash';
import accounting from 'accounting';
import moment from 'moment';
import numeral from 'numeral';
import { BigNumber } from 'bignumber.js';

import settings from './settings';
import { formats } from '../constants';

const nullOrUndefined = value => _.isNull(value) || _.isUndefined(value);

const toBigNumber = (value) => {
  let bigNumber = value;
  if (!bigNumber.isNegative) {
    if (bigNumber.c && bigNumber.e && bigNumber.s) {
      bigNumber = new BigNumber(0);
      bigNumber.c = value.c;
      bigNumber.e = value.e;
      bigNumber.s = value.s;
    }
  }

  return new BigNumber(String(bigNumber));
};

const formatNumberBase = (value, wholeNumberFormat) => {
  let bigNumber = toBigNumber(value);
  const isNegative = bigNumber.isNegative();
  bigNumber = bigNumber.abs();
  let wholeNumber = bigNumber.integerValue(BigNumber.ROUND_FLOOR);
  const fractionalNumber = bigNumber.minus(wholeNumber);
  if (!wholeNumber.isZero()) {
    wholeNumber = isNegative ? wholeNumber.multipliedBy(-1) : wholeNumber;
    return `${numeral(wholeNumber).format(wholeNumberFormat)}`
      + `${numeral(fractionalNumber).format(formats.FRACTIONAL_NUMBER)}`;
  }
  return (isNegative ? '-0' : '0') + numeral(fractionalNumber).format(formats.FRACTIONAL_NUMBER);
};

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

  formatMoneyWithoutCents(value, symbol, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }

    return accounting.formatMoney(toBigNumber(value), symbol || settings.getCurrencySymbol(), 0);
  },

  formatNumber(value, wholeNumberFormat = formats.WHOLE_NUMBER,
    defaultValue = 'N/A') {
    if (nullOrUndefined(value) || isNaN(value)) {
      return defaultValue;
    }

    return formatNumberBase(value, wholeNumberFormat);
  },

  formatTime(timestamp, defaultValue = '--') {
    if (nullOrUndefined(timestamp)) {
      return defaultValue;
    }

    return moment.unix(timestamp).format(formats.TIME);
  },

  formatWeekdayAndTime(timestamp, defaultValue = '--') {
    if (nullOrUndefined(timestamp)) {
      return defaultValue;
    }

    return moment.unix(timestamp).format(formats.WEEKDAY_AND_TIME);
  },

  formatTokenAmount(value, threshold = 0.1, defaultValue = 'N/A') {
    if (nullOrUndefined(value) || isNaN(value)) {
      return defaultValue;
    }
    return value > threshold || value === 0 ? accounting.formatMoney(toBigNumber(value)) :
      `${formatNumberBase(value * 100)}${settings.getCurrencySymbol(true)}`;
  },
};

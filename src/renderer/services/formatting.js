import _ from 'lodash';
import accounting from 'accounting';
import moment from 'moment';
import numeral from 'numeral';
import { BigNumber } from 'bignumber.js';

import settings from './settings';
import { formats } from '../constants';

const nullOrUndefined = value => _.isNull(value) || _.isUndefined(value);

export const toBigNumber = (value) => {
  if (BigNumber.isBigNumber(value)) {
    return value;
  }

  return new BigNumber(String(value));
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
  abbreviateNumber(value, wholeNumberFormat = formats.WHOLE_NUMBER, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }

    return numeral(formatNumberBase(value, wholeNumberFormat)).format('0.0a');
  },

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

  formatMoney(value, symbol, defaultValue = 'N/A', abbreviate = false) {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }
    const val = toBigNumber(value);

    let precision = 2;
    if (val.isLessThan(1) && !val.isZero()) {
      precision = 4;
    }

    const displaySymbol = symbol || settings.getCurrencySymbol();

    return abbreviate ?
      numeral(formatNumberBase(value, formats.WHOLE_NUMBER)).format(`${displaySymbol}0.0a`) :
      accounting.formatMoney(val, displaySymbol, precision);
  },

  formatMoneyWithoutCents(value, symbol, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }

    return accounting.formatMoney(toBigNumber(value), symbol || settings.getCurrencySymbol(), 0);
  },

  formatNumber(value, wholeNumberFormat = formats.WHOLE_NUMBER, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
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

  formatTokenAmount(value, threshold = 1000, defaultValue = 'N/A') {
    if (nullOrUndefined(value)) {
      return defaultValue;
    }

    return toBigNumber(value).isGreaterThan(threshold) ?
      accounting.formatMoney(toBigNumber(value), '', 0) : formatNumberBase(value);
  },

  cleanAmount(amount, currency) {
    if (nullOrUndefined(amount)) {
      return null;
    }

    let cleanAmount = amount.replace(/[^\d.]/g, '');

    const cleanSplit = _.split(cleanAmount, '.');
    if (cleanSplit.length > 2) {
      cleanAmount = `${cleanSplit[0]}.${cleanSplit[1]}`;
    }

    if (cleanAmount && cleanAmount.length > 0) {
      if (currency) {
        const fixed = 10 ** currency.decimals;
        const cleanNumber = new BigNumber(cleanAmount)
          .multipliedBy(fixed).decimalPlaces(0, BigNumber.ROUND_DOWN).dividedBy(fixed);
        cleanAmount = new BigNumber(cleanNumber).toFixed(currency.decimals);
      } else if (cleanAmount[cleanAmount.length - 1] !== '.'
        && cleanAmount[cleanAmount.length - 1] !== '0') {
        cleanAmount = formatNumberBase(BigNumber(cleanAmount), formats.WHOLE_NUMBER_NO_COMMAS);
      }
    }

    // remove trailing zeros if there is a decimal
    if (cleanAmount.indexOf('.') > -1) {
      cleanAmount = _.trimEnd(cleanAmount, '0');
    }

    // remove decimal point if it is the last character
    if (amount && amount.length > 0 && amount[amount.length - 1] !== '.') {
      cleanAmount = _.trimEnd(cleanAmount, '.');
    }

    return cleanAmount;
  },
};

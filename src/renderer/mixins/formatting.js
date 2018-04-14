// import accounting from 'accounting';
import moment from 'moment';
import numeral from 'numeral';
import { BigNumber } from 'bignumber.js';
import { formats } from '../constants';
import { settings } from '../services';

export default {
  methods: {
    $formatDate(timestamp) {
      return moment(timestamp, 'X').format(formats.DATE);
    },

    $formatDateShow(timestamp) {
      return moment(timestamp, 'X').format(formats.DATE_SHORT);
    },

    $formatMoney(value, symbol, defaultValue = 'N/A') {
      if (value === null) {
        return defaultValue;
      }
      return accounting.formatMoney(value, symbol || settings.getCurrencySymbol());
    },

    $formatNumber(value, format = formats.NUMBER, defaultValue = 'N/A') {
      if (value === null) {
        return defaultValue;
      }
      return numeral(value).format(format || formats);
    },

    $formatNumberShort(value) {
      return numeral(value).format(formats.NUMBER_SHORT);
    },
    $formatNumberBig(value) {
      return BigNumber(value.toString().replace(',', '')).toFormat(8);
    },

    $formatTime(timestamp) {
      return moment(timestamp, 'X').format(formats.TIME);
    },
  },
};

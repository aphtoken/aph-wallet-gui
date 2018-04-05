// import accounting from 'accounting';
import moment from 'moment';
import numeral from 'numeral';
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

    $formatMoney(value, symbol) {
      return accounting.formatMoney(value, symbol || settings.getCurrencySymbol());
    },

    $formatNumber(value, format = formats.NUMBER) {
      return numeral(value).format(format || formats);
    },

    $formatNumberShort(value) {
      return numeral(value).format(formats.NUMBER_SHORT);
    },

    $formatTime(timestamp) {
      return moment(timestamp, 'X').format(formats.TIME);
    },
  },
};

// import accounting from 'accounting';
import moment from 'moment';
import numeral from 'numeral';
import { formats } from '../constants';

export default {
  methods: {
    $formatDate(timestamp) {
      return moment(timestamp, 'X').format(formats.DATE);
    },

    $formatMoney(value) {
      return accounting.formatMoney(value);
    },

    $formatNumber(value) {
      return numeral(value).format(formats.NUMBER);
    },

    $formatNumberShort(value) {
      return numeral(value).format(formats.NUMBER_SHORT);
    },

    $formatTime(timestamp) {
      return moment(timestamp, 'X').format(formats.TIME);
    },
  },
};

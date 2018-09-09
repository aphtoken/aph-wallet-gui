import { formatting } from '../services';

export default {
  methods: {
    $abbreviateNumber(...args) {
      return formatting.abbreviateNumber.apply(null, args);
    },

    $formatDate(...args) {
      return formatting.formatDate.apply(null, args);
    },

    $formatDateShort(...args) {
      return formatting.formatDateShort.apply(null, args);
    },

    $formatMoney(...args) {
      return formatting.formatMoney.apply(null, args);
    },

    $formatMoneyWithoutCents(...args) {
      return formatting.formatMoneyWithoutCents.apply(null, args);
    },

    $formatNumber(...args) {
      return formatting.formatNumber.apply(null, args);
    },

    $formatTime(...args) {
      return formatting.formatTime.apply(null, args);
    },

    $formatWeekdayAndTime(...args) {
      return formatting.formatWeekdayAndTime.apply(null, args);
    },

    $formatTokenAmount(...args) {
      return formatting.formatTokenAmount.apply(null, args);
    },

    $cleanAmount(...args) {
      return formatting.cleanAmount.apply(null, args);
    },
  },
};

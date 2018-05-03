import { formatting } from '../services';

export default {
  methods: {
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
  },
};

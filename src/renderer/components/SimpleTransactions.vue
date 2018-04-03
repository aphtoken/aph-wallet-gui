<template>
  <table class="transactions-table" :class="{'is-clickable': isClickable}">
    <tr v-for="(transaction, index) in transactions" :key="index" @click="handleOnClick(transaction)" :class="[{active: transaction.active}]">
      <td width="40%" class="address">{{ transaction.address }}</td>
      <td v-if="transaction.block_time">{{ $formatDate(transaction.block_time) }}</td>
      <td class="currency">{{ transaction.symbol }}</td>
      <td width="25%" :class="['amount', {sent: transaction.value < 0, received: transaction.value > 0}]">{{ $formatNumber(transaction.value) }}</td>
    </tr>
  </table>
</template>

<script>
export default {
  computed: {
    isClickable() {
      return _.isFunction(this.onClick);
    },
  },

  methods: {
    handleOnClick(transaction) {
      if (this.onClick) {
        this.onClick(transaction);
      }
    },
  },

  props: {
    onClick: {
      type: Function,
    },

    transactions: {
      default() {
        return [];
      },
      type: Array,
    },
  },
};
</script>

<style lang="scss">
.transactions-table {
  border-collapse: collapse;
  font-family: GilroySemibold;
  font-size: toRem(12px);
  table-layout: fixed;
  width: 100%;

  .address {
    @include truncate();
  }

  .amount {
    text-align: right;

    &.received {
      color: $green;

      &:before {
        content: "+";
      }
    }

    &.sent {
      color: $red;
    }
  }

  .currency {
    text-align: center;
  }

  td {
    border-top: 1px solid $light-grey;
    padding: $space $space-sm;
    white-space: nowrap;

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }

  &.is-clickable {
    tr {
      cursor: pointer;

      td {
        background: transparent;
        transition: $transition;
      }

      &:hover, &.active {
        td {
          background: $light-grey;
          color: $purple;
        }
      }
    }
  }
}
</style>



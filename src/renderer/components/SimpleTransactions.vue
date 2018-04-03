<template>
  <table class="transactions-table" :class="{'is-clickable': isClickable}">
    <tr v-for="(transaction, index) in transactions" :key="index" @click="handleOnClick(transaction)" :class="[{active: transaction.active}]">
      <td>
        <div class="address">{{ transaction.address }}</div>
      </td>
      <td width="15%">
        <div class="currency">{{ transaction.symbol }}</div>
      </td>
      <td width="15%">
        <div :class="['amount', {sent: transaction.value < 0, received: transaction.value > 0}]">{{ $formatNumber(transaction.value) }}</div>
      </td>
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

  .currency {
    text-align: center;
    flex: 0 0 10%;
  }

  .amount {
    text-align: right;
    flex: 0 0 20%;

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

  td {
    border-top: 1px solid $light-grey;
    padding: $space $space-sm;
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



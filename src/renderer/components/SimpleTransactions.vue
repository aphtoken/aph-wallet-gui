<template>
  <table class="transactions-table">
    <tr v-for="(transaction, index) in transactions" :key="index" @click="onClick(transaction)">
      <td width="40%">
        <div class="address">{{ transaction.address }}</div>
      </td>
      <td>
        <div class="currency">{{ transaction.symbol }}</div>
      </td>
      <td>
        <div :class="['amount', {sent: transaction.amount < 0, received: transaction.amount > 0}]">{{ $formatNumber(transaction.amount) }}</div>
      </td>
    </tr>
  </table>
</template>

<script>
export default {
  props: {
    onClick: {
      default() {
        return _.noop;
      },
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

  tr {
    cursor: pointer;

    &:hover, &.active {
      background: #F9F9FD;
      color: $purple;
    }
  }
}
</style>



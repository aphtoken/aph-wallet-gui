<template>
  <div class="recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <router-link class="transaction" to="/dashboard/trx/${transaction.hash}" v-for="(transaction, index) in transactions" :key="index">
        <div class="address">{{ transaction.hash }}</div>
        <div class="currency">{{ transaction.symbol}}</div>
        <div class="date">{{ formatDate(transaction) }}</div>
        <div :class="['amount', {sent: transaction.amount < 0, received: transaction.amount > 0}]">{{ formatAmount(transaction) }}</div>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      transactions: [
        {
          address: 'd73b8e0a99f42ebcb02119',
          amount: 2458,
          hash: '0x357da56be0d70bdd44d73b8e0a99f42ebcb02119',
          symbol: 'APH',
          timestamp: 1521643932,
        },
        {
          address: 'd73b8e0a99f42ebcb02119',
          amount: -13,
          hash: '0x357da56be0d70bdd44d73b8e0a99f42ebcb02119',
          symbol: 'APH',
          timestamp: 1521643932,
        },
        {
          address: 'd73b8e0a99f42ebcb02119',
          amount: -25,
          hash: '0x357da56be0d70bdd44d73b8e0a99f42ebcb02119',
          symbol: 'NEO',
          timestamp: 1521643932,
        },
        {
          address: 'd73b8e0a99f42ebcb02119',
          amount: 101,
          hash: '0x357da56be0d70bdd44d73b8e0a99f42ebcb02119',
          symbol: 'GAS',
          timestamp: 1521643932,
        },
        {
          address: 'd73b8e0a99f42ebcb02119',
          amount: -1203,
          hash: '0x357da56be0d70bdd44d73b8e0a99f42ebcb02119',
          symbol: 'APH',
          timestamp: 1521643932,
        },
      ],
    };
  },

  methods: {
    formatAmount({ amount }) {
      return this.$accounting.formatNumber(amount, 2);
    },

    formatDate({ timestamp }) {
      return this.$moment(timestamp, 'X').format(this.$constants.formats.DATE);
    },
  },
};
</script>

<style lang="scss">
.recent-transactions {
  background: white;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;
  padding-bottom: $space;

  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    padding: 0 $space;
    overflow: auto;
  }

  .transaction {
      align-items: center;
      border-top: 1px solid $light-grey;
      color: $dark;
      cursor: pointer;
      display: flex;
      font-family: GilroySemibold;
      font-size: toRem(12px);
      justify-content: space-between;
      padding: $space $space-sm;

    > * {
      flex: 1;
      text-align: center;
      white-space: nowrap;
    }

    .address {
      flex: 1.5;
      overflow: hidden;
      text-align: left;
      text-overflow: ellipsis;
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

    &:hover, &.active {
      background: #F9F9FD;
      color: $purple;
    }
  }
}
</style>


<template>
  <div class="recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <table class="table">
        <tr @click="viewTransaction(transaction)" v-for="(transaction, index) in $store.state.recentTransactions" :key="index">
          <td width="40%">
            <div class="address">{{ transaction.hash }}</div>
          </td>
          <td>
            <div class="currency">{{ transaction.symbol }}</div>
          </td>
          <td>
            <div :class="['amount', {sent: transaction.amount < 0, received: transaction.amount > 0}]">{{ $formatNumber(transaction.amount) }}</div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    loadTransactions() {
      if (!this.$services.wallets.getCurrentWallet()) {
        return;
      }

      this.$services.neo
        .fetchRecentTransactions(this.$services.wallets.getCurrentWallet().address)
        .then((data) => {
          this.$store.commit('setRecentTransactions', data);
        })
        .catch(() => {
        });
    },

    viewTransaction({ hash }) {
      this.$router.push({ path: `/dashboard/trx/${hash}` });
    },
  },

  mounted() {
    this.loadTransactions();
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

  .table {
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
}
</style>


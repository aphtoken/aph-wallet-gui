<template>
  <div class="recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <router-link class="transaction" :to="`/dashboard/trx/${transaction.hash}`" v-for="(transaction, index) in $store.state.recentTransactions" :key="index">
        <div class="address">{{ transaction.hash }}</div>
        <div class="currency">{{ transaction.symbol }}</div>
        <div class="date">{{ $formatDate(transaction.block_time) }}</div>
        <div :class="['amount', {sent: transaction.amount < 0, received: transaction.amount > 0}]">{{ $formatNumber(transaction.amount) }}</div>
      </router-link>
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
        .catch((e) => {
          console.log(e);
        });
    },

    viewTransaction(hash) {
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
      flex-wrap: wrap;
      font-family: GilroySemibold;
      font-size: toRem(12px);
      padding: $space $space-sm;
      justify-content: space-between;

    > * {
      @include truncate();

      min-width: 0;
    }

    .address {
      text-align: left;
      flex: 0 0 40%;
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

    &:hover, &.active {
      background: #F9F9FD;
      color: $purple;
    }
  }
}
</style>


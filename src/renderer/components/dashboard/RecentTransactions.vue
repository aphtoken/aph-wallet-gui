<template>
  <div class="recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <aph-simple-transactions :transactions="transactions()" :onClick="viewTransaction"></aph-simple-transactions>
    </div>
  </div>
</template>

<script>
let loadTransactionsIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadTransactionsIntervalId);
  },

  beforeMount() {
    this.loadTransactions();

    loadTransactionsIntervalId = setInterval(() => {
      this.loadTransactions();
    }, this.$constants.intervals.POLLING);
  },

  methods: {
    transactions() {
      return this.$store.state.recentTransactions.map(transaction => _.set(transaction, 'address', transaction.hash));
    },

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

    viewTransaction({ hash }) {
      this.$router.push({ path: `/dashboard/trx/${hash}` });
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
}
</style>


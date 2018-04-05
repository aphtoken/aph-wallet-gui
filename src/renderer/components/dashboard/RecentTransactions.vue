<template>
  <section id="dashboard--recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <aph-simple-transactions :transactions="transactions" :onClick="viewTransaction"></aph-simple-transactions>
    </div>
  </section>
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

  computed: {
    transactions() {
      return this.$store.state.recentTransactions.map((transaction) => {
        const active = transaction.details.txid === _.get(this.$store.state.activeTransaction, 'txid')
          && transaction.symbol === _.get(this.$store.state.activeTransaction, 'symbol');

        return _.merge(transaction, {
          active,
          address: transaction.hash,
        });
      });
    },
  },

  methods: {
    loadTransactions() {
      this.$store.dispatch('fetchRecentTransactions');
    },

    viewTransaction({ details }) {
      console.log(details);
      this.$store.commit('setActiveTransaction', details);
    },
  },
};
</script>

<style lang="scss">
#dashboard--recent-transactions {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  padding-bottom: $space-lg;

  .header {
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    padding: 0 $space-lg;
    overflow: auto;
  }
}
</style>


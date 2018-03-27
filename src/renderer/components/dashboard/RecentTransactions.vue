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
export default {
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
          this.$store.commit('setRecentTransactions', data.sort((a, b) => {
            if (a.block_time > b.block_time) {
              return 1;
            } else if (a.block_time < b.block_time) {
              return -1;
            }
            return 0;
          }));
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

    setInterval(() => {
      this.loadTransactions();
    }, 15000);
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


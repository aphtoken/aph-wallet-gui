<template>
  <section id="dashboard--recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <div v-if="!transactions.length" class="zero-state">
        <aph-icon name="no-transactions"></aph-icon>
        <div class="label">No transactions</div>
      </div>
      <aph-simple-transactions v-else :transactions="transactions" :onClick="viewTransaction"></aph-simple-transactions>
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
      return this.$store.state.recentTransactions
        .map((transaction) => {
          return _.merge(transaction, {
            active: this.isActive(transaction),
            address: transaction.value >= 0 ? transaction.from : transaction.to,
          });
        });
    },
  },

  methods: {
    isActive({ details }) {
      return _.get(this.$store.state.activeTransaction, 'txid') === details.txid;
    },

    loadTransactions() {
      this.$store.dispatch('fetchRecentTransactions');
    },

    viewTransaction({ details }) {
      this.$router.replace('/authenticated/dashboard');
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
    flex: none;
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    flex: 1;
    overflow: auto;
    padding: 0 $space-lg;

    > .zero-state {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
      flex-direction: column;

      .aph-icon {
        svg {
          height: toRem(52px);

          .fill {
            fill: $purple;
          }
        }
      }

      .label {
        color: $purple;
        font-weight: GilroyMedium;
        margin-top: $space-lg;
      }
    }
  }
}
</style>


<template>
  <section id="dashboard--recent-transactions">
    <div class="header">
      <h2 class="underlined">{{$t('recentTransactions')}} ({{ $store.state.statsToken.symbol }})</h2>
    </div>
    <div class="body">
      <div v-if="!transactions.length" class="zero-state">
        <aph-icon name="no-transactions"></aph-icon>
        <div class="label">{{$t('noTransactions')}}</div>
      </div>
      <aph-simple-transactions v-else :transactions="transactions" :onClick="viewTransaction" :show-status="true"></aph-simple-transactions>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
let loadTransactionsIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadTransactionsIntervalId);
  },

  beforeMount() {
    this.loadTransactions();

    loadTransactionsIntervalId = setInterval(() => {
      this.loadTransactions();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);
  },

  computed: {
    transactions() {
      const tArr = this.$store.state.recentTransactions
        .map((transaction) => {
          return _.merge(transaction, {
            active: this.isActive(transaction),
            address: transaction.value >= 0 ? transaction.from : transaction.to,
          });
        });

      const txs = tArr.filter((tx) => {
        return tx.symbol === this.$store.state.statsToken.symbol;
      });

      return txs;
    },

    ...mapGetters([
      'sendInProgress',
    ]),
  },

  methods: {
    isActive({ details }) {
      return _.get(this.$store.state.activeTransaction, 'txid') === details.txid;
    },

    loadTransactions() {
      this.$store.dispatch('fetchRecentTransactions');
    },

    viewTransaction({ details }) {
      if (this.sendInProgress) {
        return;
      }
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
  margin: $space;
  padding-bottom: $space-lg;

  .header {
    flex: none;
    padding: $space $space-lg;
    font-size: toRem(10px);
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
        font-weight: ProximaMedium;
        margin-top: $space-lg;
      }
    }
  }
}
</style>

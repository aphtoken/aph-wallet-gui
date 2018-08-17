<template>
  <section id="transactions-sidebar" :class="[{open}]">
    <div class="toggle" @click="open = !open">
      <aph-icon :name="open ? 'double-arrow-right': 'history'"></aph-icon>
    </div>
    <div class="content">
      <div class="header">
        <h1 class="underlined">{{ $t('recentTransactions') }}</h1>
      </div>
      <div class="body">
        <aph-simple-transactions :transactions="transactions" :showStatus="true"></aph-simple-transactions>
      </div>
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
      return this.$store.state.recentTransactions
        .map((transaction) => {
          return _.merge(transaction, {
            address: transaction.value >= 0 ? transaction.from : transaction.to,
          });
        });
    },

    ...mapGetters([
      'sendInProgress',
    ]),
  },

  data() {
    return {
      open: false,
    };
  },

  methods: {
    loadTransactions() {
      this.$store.dispatch('fetchRecentTransactions');
    },
  },
};
</script>

<style lang="scss">
#transactions-sidebar {
  @extend %tile-light;

  position: fixed;
  right: 0;
  top: 0;
  display: flex;
  flex-direction: row;
  height: 100%;
  box-shadow: $box-shadow;

  > .toggle {
    @include transition(background);

    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    flex: none;
    height: 100%;
    justify-content: center;
    width: $right-sidebar-width-collapsed;
    border-right: $border-table-header;

    .aph-icon {
      svg {
        height: toRem(20px);
        width: toRem(20px);

        .fill {
          fill: $purple;
        }

        &.history {
          height: toRem(24px);
          width: toRem(24px);
        }
      }
    }

    &:hover {
      background: $light-grey;
    }
  }

  > .content {
    @extend %tile-light;

    display:none;
    width: $right-sidebar-width;
    flex-direction: column;

    > .header {
      flex: none;
      padding: $space;
      display: flex;
      flex-direction: row;
      align-items: center;

      h1.underlined {
        @extend %underlined-header;

        flex: 1;
        margin-bottom: 0;
      }
    }

    .body {
      flex: 1;
      padding: $space;
    }
  }

  &.open {
    > .content {
      display: flex;
    }
  }
}
</style>



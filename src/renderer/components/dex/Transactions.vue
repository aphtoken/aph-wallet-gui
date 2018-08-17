<template>
  <section id="dex--transactions" :class="[{open}]">
    <div class="toggle" @click="open = true">
      <span>{{ $t('recentTransactions') }}</span>
      <aph-icon name="arrow-left"></aph-icon>
    </div>
    <div class="sidebar">
      <div class="header">
        <h1 class="underlined">{{ $t('recentTransactions') }}</h1>
        <aph-icon name="arrow-right" @click="open = false"></aph-icon>
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
#dex--transactions {
  > .toggle {
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    flex: none;
    justify-content: flex-end;
    padding: $space 0;

    > * {
      flex: none;
    }

    > span {
      @include transition(color);

      color: $grey;
      font-family: GilroySemibold;
    }

    .aph-icon {
      margin: 0 $space;

      svg {
        height: toRem(17px);
      }
    }

    &:hover {
      > span {
        color: $purple;
      }

      > .aph-icon {
        .fill {
          fill: $purple !important;
        }
      }
    }
  }

  > .sidebar {
    @extend %tile-light;

    background: $background-night;
    border-radius: 0;
    position: fixed;
    right: 0;
    width: 40vw;
    height: 100%;
    top: 0;
    z-index: 100;
    display: none;
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

      .aph-icon {
        flex: none;
        cursor: pointer;
        padding: 0 $space;

        svg {
          height: toRem(17px);
        }
      }

      &:hover {
        .fill {
          fill: $purple !important;
        }
      }
    }

    .body {
      flex: 1;
      padding: $space;
    }
  }

  &.open {
    > .sidebar {
      display: flex;
    }
  }
}
</style>



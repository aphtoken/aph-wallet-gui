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

  box-shadow: $box-shadow;
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
  position: fixed;
  right: 0;
  top: 0;

  > .toggle {
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    flex: none;
    height: 100%;
    justify-content: center;
    width: $right-sidebar-width-collapsed;

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
    display: none;
    flex-direction: column;
    overflow: hidden;
    width: $right-sidebar-width;

    > .header {
      align-items: center;
      display: flex;
      flex-direction: row;
      flex: none;
      padding: $space;

      h1.underlined {
        @extend %underlined-header;

        flex: 1;
        margin-bottom: 0;
      }
    }

    .body {
      flex: 1;
      overflow: auto;
      padding: $space;
    }
  }

  &.open {
    > .toggle {
      border-right: solid $border-width-thin $light-grey;
    }

    > .content {
      display: flex;

      > .header {
        h1.underlined {
          color: $copy-night;
        }
      }
    }
  }
}

.Night {
  #transactions-sidebar {
    background: $background-night;

    > .toggle {
      border-right-color: lighten($background-night, 2%);

      &:hover {
        background: lighten($background-night, 2%);
      }
    }

    > .content {
      > .body {
        .transactions-table {
          tr {
            td {
              color: $grey;
            }
          }
        }
      }
    }
  }
}
</style>



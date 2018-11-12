<template>
  <section id="assets-table">
    <div class="search-field">
      <aph-icon name="search"></aph-icon>
      <input placeholder="Search" v-model="searchBy">
    </div>
    <button class="add-token-btn" v-if="shouldShowAddTokenButton" @click="showAddTokenModal">{{$t('addToken')}}</button>
    <div class="holdings">
      <aph-holding v-for="(holding, index) in filteredHoldings" :holding="holding" :key="index" :onRemove="remove"></aph-holding>
    </div>
  </section>
</template>

<script>

import { mapGetters } from 'vuex';
import { BigNumber } from 'bignumber.js';

export default {
  beforeDestroy() {
    clearInterval(this.loadTransactionsIntervalId);
  },
  beforeMount() {
    this.loadTransactions();

    this.loadTransactionsIntervalId = setInterval(() => {
      this.loadTransactions();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);
  },
  computed: {
    filteredHoldings() {
      const searchBy = this.searchBy.toLowerCase();
      // Note: filter creates a new collection, but the values will be the same objects held in the state.holdings
      return _.filter(this.holdings, ({ name, symbol }) => {
        if (!name || !symbol) {
          return false;
        }

        return name.toLowerCase().indexOf(searchBy) > -1
          || symbol.toLowerCase().indexOf(searchBy) > -1;
      }).map((holding) => {
        const canRemove = holding.isNep5 === true && holding.isUserAsset === true
          && holding.symbol !== 'APH' && new BigNumber(holding.balance).isZero();

        // Note: this must clone the holding or it will modify the holding without using store mutations and cause
        //       side effects.
        return _.merge(_.cloneDeep(holding), {
          canRemove,
        });
      });
    },

    shouldShowAddTokenButton() {
      return this.holdings === 0 && this.$isDone('fetchHoldings');
    },

    ...mapGetters([
      'holdings',
    ]),
  },

  data() {
    return {
      searchBy: '',
      loadTransactionsIntervalId: null,
    };
  },

  methods: {
    loadHoldings() {
      this.$store.dispatch('fetchHoldings');
    },

    loadTransactions() {
      this.$store.dispatch('fetchRecentTransactions');
    },

    remove(holding) {
      this.$services.assets.removeUserAsset(holding.assetId);
      this.$services.alerts.success(`Removed ${holding.symbol}`);
      this.loadHoldings();
    },

    showAddTokenModal() {
      this.$store.commit('setShowAddTokenModal', true);
    },
  },
};
</script>

<style lang="scss">
#assets-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  .search-field {
    border-bottom: $border-thin;
    display: flex;
    flex: none;
    margin: 0 $space $space-lg 0;
    padding: $space-sm 0;
    width: 60%;

    .aph-icon {
      flex: none;
      margin: 0 $space;

      svg {
        height: toRem(22px);

        .fill {
          fill: $purple;
        }
      }
    }

    input {
      background: none;
      border: none;
      color: $dark;
      font-family: GilroyMedium;
      font-size: toRem(15px);
      outline: none;
      padding: 0;
      width: 100%;

      &::placeholder {
        color: $grey;
      }
    }
  }

  .add-token-btn {
    @extend %btn-outline;

    color: $purple;
    margin-right: $space;
  }

  .holdings {
    flex: 1;
    overflow: auto;
    height: 80%;
    padding: 0 $space 0 0;

    .holding {
      & + .holding {
        margin-top: $space-lg;
      }
    }
  }
}
</style>



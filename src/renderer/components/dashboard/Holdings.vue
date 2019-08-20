<template>
  <section id="dashboard--holdings">
    <div class="search-field">
      <aph-icon name="search"></aph-icon>
      <input v-model="searchBy" type="text" placeholder="Search here...">
    </div>
    <div class="body">
      <dashboard-holding v-for="(holding, index) in filteredHoldings" :holding="holding" :on-click="viewHoldingDetail" :class="[{active: isActive(holding)}]" :key="index" :onRemove="remove"></dashboard-holding>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
import { BigNumber } from 'bignumber.js';

import DashboardHolding from './Holding.vue';

export default {
  components: {
    DashboardHolding,
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
        let canRemove = holding.isNep5 === true && holding.isUserAsset === true
          && holding.symbol !== 'APH' && new BigNumber(holding.balance).isZero();

        if (holding.isETHToken) {
          canRemove = new BigNumber(holding.balance).isZero();
        }

        // Note: this must clone the holding or it will modify the holding without using store mutations and cause
        //       side effects.
        return _.merge(_.cloneDeep(holding), {
          canRemove,
        });
      });
    },

    holdings() {
      return this.$store.state.holdings.filter(({ name, symbol }) => {
        return !!name && !!symbol;
      }).map((holding) => {
        // Note: this must clone the holding or it will modify the holding without using store mutations and cause
        //       side effects. Saved data now has canRemove saved in cache in some wallet's db cache since this wasn't
        //       previously doing a deep clone in assets/AssetTable.vue; so we have to explicitly set it false here
        return _.merge(_.cloneDeep(holding), {
          canRemove: false,
        });
      });
    },

    ...mapGetters([
      'sendInProgress',
    ]),
  },

  data() {
    return {
      searchBy: '',
    };
  },


  methods: {
    isActive({ assetId }) {
      return _.get(this.$store.state.statsToken, 'assetId') === assetId;
    },

    remove(holding) {
      this.$services.assets.removeUserAsset(holding.assetId);
      this.$services.alerts.success(`Removed ${holding.symbol}`);
    },

    viewHoldingDetail(holding) {
      if (this.sendInProgress) {
        return;
      }

      this.$router.replace('/authenticated/dashboard');
      this.$store.commit('setStatsToken', holding);
      this.$store.commit('clearActiveTransaction');
    },
  },
};
</script>

<style lang="scss">
#dashboard--holdings {
  background: white;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;
  margin: $space;
  padding: $space;

  .body {
    overflow: auto;
  }

  .holding {
    margin: $space;
  }

  .search-field {
    margin: $space;
    background: $lightest-grey;
    display: flex;
    align-items: center;

    > input {
      height: $input-height;
      background: none;
      border: none;
      outline: none;
      padding: 0 $space;
      flex: 1;
    }

    > .aph-icon {
      flex: none;

      svg {
        height: toRem(22px);
        margin-left: $space;

        .fill {
          fill: $grey;
        }
      }
    }
  }
}
</style>

<template>
  <section id="assets-table">
    <div class="search-field">
      <aph-icon name="search"></aph-icon>
      <input placeholder="Search" v-model="searchBy">
    </div>
    <button class="add-token-btn" v-if="shouldShowAddTokenButton" @click="showAddTokenModal">Add token</button>
    <div class="holdings">
      <aph-holding v-for="(holding, index) in filteredHoldings" :holding="holding" :key="index"></aph-holding>
    </div>
  </section>
</template>

<script>
let loadHoldingsIntervalId;
export default {
  computed: {
    filteredHoldings() {
      const searchBy = this.searchBy.toLowerCase();
      return _.filter(this.$store.state.holdings, ({ name, symbol }) => {
        if (!name || !symbol) {
          return false;
        }

        return name.toLowerCase().indexOf(searchBy) > -1
          || symbol.toLowerCase().indexOf(searchBy) > -1;
      }).map((holding) => {
        const canRemove = holding.isCustom === true && holding.symbol !== 'APH';
        return _.merge(holding, {
          canRemove,
        });
      });
    },

    shouldShowAddTokenButton() {
      return this.$store.state.holdings.length === 0 && this.$isDone('fetchHoldings');
    },
  },

  data() {
    return {
      searchBy: '',
    };
  },

  methods: {
    loadHoldings() {
      this.$store.dispatch('fetchHoldings');
    },

    remove(holding) {
      this.$services.tokens.remove(holding.asset, this.$store.state.currentNetwork.net);
      this.$services.alerts.success(`Removed ${holding.symbol}`);
      this.loadHoldings();
    },

    showAddTokenModal() {
      this.$store.commit('setShowAddTokenModal', true);
    },
  },

  mounted() {
    this.loadHoldings();

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldings();
    }, this.$constants.intervals.POLLING);
  },

  beforeDestroy() {
    clearInterval(loadHoldingsIntervalId);
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
        height: toRem(28px);

        .fill {
          fill: $purple;
        }
      }
    }

    input {
      background: none;
      border: none;
      color: $dark;
      font-family: GilroySemibold;
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



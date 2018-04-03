<template>
  <section id="assets-table">
    <div class="search">
      <!-- <aph-icon name="wallet"></aph-icon> -->
      <input placeholder="Search" v-model="searchBy">
    </div>
    <div class="add-token-btn" v-if="$store.state.holdings.length === 0">Add token</div>
    <div class="holdings">
      <div v-for="(holding, index) in filteredHoldings" class="holding" :key="index">
        <aph-token-icon :symbol="holding.symbol"></aph-token-icon>
        <div class="left">
          <div class="currency">{{ holding.name }}</div>
          <div class="meta">
            <div class="symbol">{{ holding.symbol }}</div>
            <div :class="['change', {decrease: holding.change24hrPercent < 0, increase: holding.change24hrPercent > 1}]">{{ $formatNumber(holding.change24hrPercent) }}</div>
          </div>
        </div>
        <div class="right">
          <div class="amount">{{ $formatNumber(holding.balance) }} {{ holding.symbol }}</div>
          <div class="value">{{ $formatMoney(holding.value) }} USD</div>
        </div>
      </div>
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
      });
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
  overflow: hidden;

  .search {
    border-bottom: $border;
    border-color: $grey;
    display: flex;
    flex: none;
    margin: 0 $space $space-lg 0;
    padding: $space 0;

    .aph-icon {
      flex: none;
      margin: 0 $space;

      svg {
        height: $space-lg;
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
    padding: 0 $space 0 0;

    .holding {
      align-items: center;
      background: white;
      border-radius: $border-radius;
      box-shadow: $box-shadow;
      display: flex;
      padding: $space;

      .aph-token-icon {
        flex: none;
        margin-right: $space;

        img {
          height: toRem(60px);
          width: toRem(60px);
        }
      }

      .left {
        flex: 1;

        .currency {
          font-family: GilroySemibold;
          font-size: toRem(18px);
        }

        .meta {
          display: flex;
          margin-top: $space-sm;

          .symbol {
            @extend %small-uppercase-grey-label;
          }

          .change {
            font-family: GilroySemibold;
            font-size: toRem(12px);
            margin-left: $space;

            &.decrease {
              color: $red;
            }

            &.increase {
              color: $green;

              &:before {
                content: "+";
              }
            }
          }
        }
      }

      .right {
        flex: 1;
        text-align: right;

        .amount {
          font-size: toRem(20px);
        }

        .value {
            @extend %small-uppercase-grey-label;

            margin-top: $space-sm;
        }
      }

      & + .holding {
        margin-top: $space-lg;
      }
    }
  }
}
</style>



<template>
  <section id="assets--assets">
    <div class="header">
      <h1 class="underlined">Assets</h1>
    </div>
    <div class="search">
      <!-- <aph-icon name="wallet"></aph-icon> -->
      <input placeholder="Search" v-model="searchBy">
    </div>
    <div class="holdings">
      <div v-for="(holding, index) in filteredHoldings" class="holding" :key="index">
        <aph-token-icon :symbol="holding.symbol"></aph-token-icon>
        <div class="left">
          <div class="currency">{{ holding.name }}</div>
          <div class="meta">
            <div class="symbol">{{ holding.symbol }}</div>
            <div :class="['change', 'increase']">3.45%</div>
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
export default {
  computed: {
    filteredHoldings() {
      const searchBy = this.searchBy.toLowerCase();
      return _.filter(this.$store.state.holdings, ({ name, symbol }) => {
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

    setInterval(() => {
      this.loadHoldings();
    }, 15000);
  },
};
</script>

<style lang="scss">
#assets--assets {
  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .search {
    border-bottom: $border;
    border-color: $grey;
    display: flex;
    margin: $space;
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

  .holdings {
    padding: $space;

    .holding {
      align-items: center;
      background: white;
      border-radius: $border-radius;
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
        margin-right: $space;

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



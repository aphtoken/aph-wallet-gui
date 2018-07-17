<template>
  <div id="dex--market-mega-selector" :class="{'is-open': isOpen}">
    <div class="toggle" @click="isOpen = !isOpen">
      <div class="label">{{ $store.state.currentMarket.marketName }}</div>
      <aph-icon :name="iconName"></aph-icon>
    </div>
    <div class="menu">
      <div class="search-field">
        <aph-icon name="search"></aph-icon>
        <input placeholder="Search" v-model="searchBy">
      </div>
      <div class="base-currencies">
        <div @click="selectBaseCurrency(currency)" :class="['currency', {active: baseCurrency === currency}]"
             v-for="currency in baseCurrencies" :key="currency">{{ currency }}</div>
        <div @click="selectBaseCurrency('favorites')" :class="['currency', {active: baseCurrency === 'favorites'}]">favorites</div>
      </div>
      <div class="body">
        <aph-fixed-table>
          <template slot="headers">
            <th>Asset</th>
            <th>Price</th>
            <th>Volume (24h)</th>
            <th>Change</th>
            <th>&nbsp;</th>
          </template>
          <tr @click="selectMarket(market)" :class="[{selected: market.marketName === $store.state.currentMarket.marketName}]"
                v-for="market in filteredMarkets" :key="market.marketName">
            <td>{{ market.quoteCurrency }}</td>
            <td>price</td>
            <td>volume</td>
            <td>change</td>
            <td>action...</td>
          </tr>
        </aph-fixed-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  beforeDestroy() {
    document.removeEventListener('click', this.close);
  },

  beforeMount() {
    document.addEventListener('click', (e) => {
      if (!this.$el || !this.$el.contains(e.target)) {
        this.close();
      }
    });
  },

  computed: {
    baseCurrencies() {
      return _.uniq(_.map(this.$store.state.markets, 'baseCurrency'));
    },

    filteredMarkets() {
      const searchBy = this.searchBy.toLowerCase();

      return this.$store.state.markets.filter((market) => {
        const baseCurrencyMatch = market.baseCurrency === this.baseCurrency;

        if (!searchBy) {
          return baseCurrencyMatch;
        }

        const searchByMatch = market.quoteCurrency.toLowerCase().indexOf(searchBy) > -1;

        return baseCurrencyMatch && searchByMatch;
      });
    },

    iconName() {
      return this.isOpen ? 'arrow-up' : 'arrow-down';
    },
  },

  data() {
    return {
      baseCurrency: '',
      isOpen: false,
      searchBy: '',
    };
  },

  methods: {
    close() {
      this.isOpen = false;
    },

    selectBaseCurrency(currency) {
      this.baseCurrency = currency;
      this.searchBy = '';
    },

    selectMarket(market) {
      this.$store.commit('setCurrentMarket', market);
      this.close();
    },
  },

  mounted() {
    this.baseCurrency = _.first(this.baseCurrencies);
  },

  watch: {
    isOpen(newVal, oldVal) {
      if (newVal && !oldVal) {
        this.baseCurrency = this.$store.state.currentMarket.baseCurrency;
      }
    },
  },
};
</script>

<style lang="scss">
#dex--market-mega-selector {
  position: relative;
  z-index: 1000;

  > .toggle {
    align-items: center;
    background: white;
    border-radius: $border-radius;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    height: $input-height;
    padding: 0 $space;

    .label {
      flex: 1;
      font-family: GilroyMedium;
      white-space: nowrap;
      font-size: toRem(20px);
    }

    .aph-icon {
      flex: none;

      svg {
        height: toRem(12px);
      }

      path {
        fill: $purple;
      }
    }
  }

  > .menu {
    background: white;
    border-radius: $border-radius;
    box-shadow: $box-shadow;
    display: none;
    margin-top: -($border-radius);
    position: absolute;
    width: toRem(600px);

    .search-field {
      border-bottom: $border-thin;
      display: flex;
      flex: none;
      margin: $space 0 $space $space;
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

    .base-currencies {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin: $space-lg 0 0 $space;
      width: 60%;

      .currency {
        @extend %underlined-header-sm;

        cursor: pointer;
        flex: none;

        &:first-child {
          margin-left: $space;
        }

        &:after {
          @include transition(all);

          background: transparent;
        }

        &:hover, &.active {
          &:after {
            background: $purple;
          }
        }

        & + .currency {
          margin-left: $space;
        }
      }
    }

    .body {
      padding: 0 $space $space;

      .aph-fixed-table {
        max-height: toRem(200px);
        overflow: auto;

        thead, tbody {
          tr {
            th, td {
              padding: $space 0;

              &:first-child {
                padding-left: $space;
              }

              &:last-child {
                padding-right: $space;
                width: 1px;
              }
            }
          }
        }

        tbody {
          tr {
            cursor: pointer;

            &:hover, &.selected {
              td {
                background-color: $background;
              }
            }
          }
        }
      }
    }
  }

  &.is-open {
    .menu {
      display: block;
    }
  }
}

.Night {
  #dex--market-mega-selector {
    > .toggle {
      @extend %light-background;

      .label {
        color: white;
      }

      .aph-icon {
        path {
          fill: $purple !important;
        }
      }
    }

    > .menu {
      @extend %light-background;

      .body {
        .aph-fixed-table {
          //
        }
      }
    }
  }
}
</style>



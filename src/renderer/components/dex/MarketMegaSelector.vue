<template>
  <div id="dex--market-mega-selector" :class="{'is-open': isOpen}">
    <div class="toggle" @click="isOpen = !isOpen">
      <div class="label">{{ $store.state.currentMarket ? $store.state.currentMarket.marketName : '' }}</div>
      <div class="label disabled" v-if="$store.state.currentMarket && $store.state.currentMarket.isOpen === false">[{{$t('tradingDisabled')}}]</div>
      <aph-icon :name="iconName"></aph-icon>
    </div>
    <div class="menu">
      <div class="base-currencies">
        <div @click="baseCurrency = currency" :class="['currency', {active: baseCurrency === currency}]"
             v-for="currency in baseCurrencies" :key="currency">{{ currency }}</div>
      </div>
      <div class="table">
        <div class="market-selection-header">
            <div>{{ $t('name') }}</div>
            <div>{{ $t('volume') }}</div>
        </div>
        <div class="body">
          <div @click="market.marketName !== $store.state.currentMarket.marketName ? selectMarket(market) : null" 
            :class="['row', {selected: $store.state.currentMarket && market.marketName === $store.state.currentMarket.marketName }]"
               v-for="market in filteredMarkets" :key="market.marketName">
            <div class="cell flex-horizontal">
              <div class="cell">{{ market.quoteCurrency }}</div>
              <div class="cell" v-if="market.isOpen === true">{{ $formatMoney(market.volume) }}</div>
            </div>
            <div class="cell disabled" v-if="market.isOpen === false">[{{$t('tradingDisabled')}}]</div>
          </div>
        </div>
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
      let markets = this.$store.state.markets.filter((market) => {
        return market.baseCurrency === this.baseCurrency;
      });

      markets.forEach((market) => {
        const baseAsset = this.$services.neo.getHolding(market.baseAssetId);
        const unitValue = baseAsset ? baseAsset.unitValue : 0;
        market.volume = _.get(this.$store.state.tickerDataByMarket, `${market.marketName}.baseVolume`) * unitValue;
      });

      markets = _.orderBy(markets, 'volume', 'desc');

      return markets;
    },

    iconName() {
      return this.isOpen ? 'arrow-up' : 'arrow-down';
    },
  },

  data() {
    return {
      baseCurrency: '',
      isOpen: false,
    };
  },

  methods: {
    close() {
      this.isOpen = false;
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
    
    .disabled {
      font-size: toRem(12px);
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
    margin-top: $space;
    position: absolute;
    width: 100%;
    border: $border-width solid $background;

    .base-currencies {
      display: flex;
      flex-direction: row;

      .currency {
        @include transition(all);

        border-bottom: $border;
        border-color: transparent;
        color: $purple;
        cursor: pointer;
        flex: 1;
        font-family: GilroyMedium;
        font-size: toRem(14px);
        padding: $space-sm 0;
        text-align: center;

        &:hover, &.active {
          border-color: $purple;
        }

        & + .currency {
          margin-left: $space;
        }
      }
    }

    .table{
      @extend %dex-table-flex;

      .market-selection-header {
        display: flex;
        border-bottom: 1px solid $purple;
        padding: 0 $space;

        > div {
          flex: 1;
          font-size: toRem(16px);
          line-height: toRem(36px);
          height: toRem(36px);
        }
      }

      .body {
        font-size: 0;
        max-height: toRem(540px);
        overflow: auto;

        .row {
          @include transition(all);

          cursor: pointer;
          font-size: 0;
          height: toRem(32px);
          line-height: toRem(34px);
          padding: 0 $space;
          border: 0;
          margin-top: 0 !important;

          .cell {
            display: flex;
            font-size: toRem(16px);
            
            &.disabled {
              font-size: toRem(11px);
              text-align: right;
            }
          }

          &:hover,
          &.selected {
            background: $background;
          }

          &.selected {
            cursor: default;
          }
        }
      }
    }
    ::-webkit-scrollbar {
      width: $border-width-thick;
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

      border: $border-width solid $select-border-night !important;

      .table {
        .market-selection-header {
          > div {
            color: white;
          }
        }

        .body {
          .row {
            background: transparent;
            color: white;
            
            &:hover,
            &.selected {
              background: $purple;
              color: #FFF;
            }

            &:last-child {
              border-bottom-left-radius: $border-radius;
              border-bottom-right-radius: $border-radius;
              border-bottom:0;
            }
          }
        }
      }
    }
  }
}
</style>



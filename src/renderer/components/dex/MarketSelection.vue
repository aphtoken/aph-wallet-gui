<template>
  <section id="dex--marketselection">
    <div class="color-mode-btn" @click="toggleNightMode">
      <template v-if="$store.state.styleMode === 'Night'">
        <aph-icon name="sun"></aph-icon>
        {{$t('dayMode')}}
      </template>
      <template v-else>
        <aph-icon name="moon"></aph-icon>
        {{$t('nightMode')}}
      </template>
    </div>
    <div class="selection">
      <aph-select :options="markets" v-model="currentMarket"></aph-select>
    </div>
    <div class="market">
      <div class="day-values">
        <div class="row">
          <div class="label">{{$t('vol')}}</div>
          <div class="value">{{ $formatNumber($store.state.tradeHistory.volume24Hour) }}</div>
        </div>
        <div class="row">
          <div class="label">{{$t('OPEN')}}</div>
          <div class="value">{{ $formatTokenAmount($store.state.tradeHistory.open24Hour) }}</div>
        </div>
        <div class="row">
          <div class="label">{{$t('HIGH')}}</div>
          <div class="value">{{ $formatTokenAmount($store.state.tradeHistory.high24Hour) }}</div>
        </div>
        <div class="row">
          <div class="label">{{$t('LOW')}}</div>
          <div class="value">{{ $formatTokenAmount($store.state.tradeHistory.low24Hour) }}</div>
        </div>
      </div>

      <div class="token-details">
        <aph-token-icon :symbol="$store.state.currentMarket.quoteCurrency"></aph-token-icon>
        <div class="market-name">{{ $store.state.currentMarket.marketName }}</div>
        <div class="price">
          <span class="label">{{$t('priceUc')}}</span>
          <div class="base-price">
            {{ $formatTokenAmount($store.state.tradeHistory.close24Hour) }}
          </div>
          <div :class="['change', {decrease: $store.state.tradeHistory.change24Hour < 0, increase: $store.state.tradeHistory.change24Hour > 0}]">{{ $formatNumber($store.state.tradeHistory.change24Hour) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  computed: {
    markets() {
      return this.$store.state.markets.reduce(
        (result, market) => {
          result.push({
            label: market.marketName,
            value: market,
          });

          return result;
        }, []);
    },

    storeStateCurrentMarket() {
      return this.$store.state.currentMarket;
    },
  },

  data() {
    return {
      currentMarket: {},
    };
  },


  methods: {
    toggleNightMode() {
      this.$services.settings.setStyleMode(this.$store.state.styleMode === 'Night' ? 'Day' : 'Night');
    },
  },

  mounted() {
    this.currentMarket = this.$store.state.currentMarket;
  },

  watch: {
    currentMarket(newVal) {
      this.$store.commit('setCurrentMarket', newVal);
    },

    storeStateCurrentMarket(newVal) {
      if (!this.currentMarket) {
        this.currentMarket = newVal;
      }
    },
  },
};
</script>

<style lang="scss">
#dex--marketselection {
  .color-mode-btn {
    @include transition(color);

    align-items: center;
    border: none;
    color: $grey;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    font-family: GilroySemibold;
    padding: $space 0;

    .aph-icon {
      margin: 0 $space;

      svg {
        height: toRem(17px);
      }

      .fill {
        fill: $grey;
      }
    }

    &:hover {
      color: $purple;

      .aph-icon {
        .fill {
          fill: $purple !important;
        }
      }
    }
  }

  .selection {
    margin-bottom: $space;

    .aph-select--label {
      @extend %selected-text;
      @extend %light-background;

      font-size: toRem(20px);
      height: auto;
      padding-left: $space;
      text-align: left;
    }
    .aph-select .aph-icon svg {
      height: 12px;
    }
    .aph-select .aph-icon path {
      fill: $purple;
    }
  }

  .market {
    @extend %tile-light;
    padding: $space;
    display: flex;
    flex-direction: row;

    .day-values {
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: flex-end;
    }

    .token-details {
      flex: none
    }

    .row {
      display: flex;
      flex-direction: row;

      .label {
        @extend %small-uppercase-grey-label-dark;

        flex: 2;
      }

      .value {
        flex: 4;
        font-family: GilroySemibold;
        font-size: toRem(12px);
      }

      &.row {
        margin-top: $space;
      }
    }

    .token-details {
      align-items: flex-end;
      display: flex;
      flex-direction: column;

      .aph-token-icon {
      }

      .market-name {
        font-family: GilroySemibold;
        margin-top: $space;
      }

      .price {
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        margin-top: $space;

        .label {
          @extend %small-uppercase-grey-label-dark;
        }

        .base-price {
          font-family: GilroySemibold;
          font-size: toRem(16px);
          margin-top: $space-sm;
        }
      }

      .change {
        font-size: toRem(12px);
        margin-top: $space-sm;

        &.increase {
          color: $green;

          &:before {
            content: "+";
          }

          &:after {
            content: "%";
            margin-left: $space-xs;
          }
        }

        &.decrease {
          color: $red;
        }

        &:after {
          content: "%";
          margin-left: $space-xs;
        }
      }
    }
  }
}
</style>


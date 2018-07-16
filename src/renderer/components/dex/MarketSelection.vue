<template>
  <section id="dex--marketselection">
    <div class="color-mode-btn" @click="toggleNightMode">
      <template v-if="$store.state.styleMode === 'Night'">
        <aph-icon name="sun"></aph-icon>
        Day Mode
      </template>
      <template v-else>
        <aph-icon name="moon"></aph-icon>
        Night Mode
      </template>
    </div>
    <div class="selection">
      <market-mega-selector></market-mega-selector>
    </div>
    <div class="market">
      <div class="day-values">
        <div class="row">
          <div class="label">VOL</div>
          <div class="value">{{ $formatNumber($store.state.tradeHistory.volume24Hour) }}</div>
        </div>
        <div class="row">
          <div class="label">OPEN</div>
          <div class="value">{{ $formatTokenAmount($store.state.tradeHistory.open24Hour) }}</div>
        </div>
        <div class="row">
          <div class="label">HIGH</div>
          <div class="value">{{ $formatTokenAmount($store.state.tradeHistory.high24Hour) }}</div>
        </div>
        <div class="row">
          <div class="label">LOW</div>
          <div class="value">{{ $formatTokenAmount($store.state.tradeHistory.low24Hour) }}</div>
        </div>
      </div>

      <div class="token-details">
        <aph-token-icon :symbol="$store.state.currentMarket.quoteCurrency"></aph-token-icon>
        <div class="market-name">{{ $store.state.currentMarket.marketName }}</div>
        <div class="price">
          <span class="label">PRICE</span>
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
import MarketMegaSelector from './MarketMegaSelector';

export default {
  components: {
    MarketMegaSelector,
  },

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
  },

  methods: {
    toggleNightMode() {
      this.$store.commit('setStyleMode', this.$store.state.styleMode === 'Night' ? 'Day' : 'Night');
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

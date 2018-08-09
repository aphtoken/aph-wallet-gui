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
      <market-mega-selector></market-mega-selector>
    </div>
    <aph-spinner-wrapper size="small" identifier="fetchTradeHistory">
      <div class="market">
        <div class="day-values">
          <div class="row">
            <div class="label">{{$t('vol')}}</div>
            <div class="value">{{ $formatNumber($store.state.tradeHistory ? $store.state.tradeHistory.volume24Hour : 0) }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('OPEN')}}</div>
            <div class="value">{{ $formatTokenAmount($store.state.tradeHistory ? $store.state.tradeHistory.open24Hour : 0) }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('HIGH')}}</div>
            <div class="value">{{ $formatTokenAmount($store.state.tradeHistory ? $store.state.tradeHistory.high24Hour : 0) }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('LOW')}}</div>
            <div class="value">{{ $formatTokenAmount($store.state.tradeHistory ? $store.state.tradeHistory.low24Hour : 0) }}</div>
          </div>
        </div>
        <div class="token-details">
          <aph-token-icon v-if="$store.state.currentMarket && $store.state.currentMarket.quoteCurrency" :symbol="$store.state.currentMarket.quoteCurrency"></aph-token-icon>
          <div class="base-price">
            {{ $formatTokenAmount($store.state.tradeHistory ? $store.state.tradeHistory.close24Hour : 0) }}
          </div>
          <div class="base-price-converted">
            {{ $formatMoney($store.state.tradeHistory ? $store.state.tradeHistory.close24Hour * baseCurrencyUnitPrice : 0) }}
          </div>
          <span class="label">{{ $t('change24H') }} ({{ $store.state.currentMarket ? $store.state.currentMarket.quoteCurrency : '' }})</span>
          <div :class="['change', {decrease: $store.state.tradeHistory ? $store.state.tradeHistory.change24Hour < 0 : false, increase: $store.state.tradeHistory ? $store.state.tradeHistory.change24Hour > 0 : false}]">
            {{ $formatNumber($store.state.tradeHistory ? $store.state.tradeHistory.change24Hour : 0) }}
            ({{ $formatNumber(percentChangeAbsolute) }}%)
          </div>
        </div>
      </div>
    </aph-spinner-wrapper>
  </section>
</template>

<script>
import MarketMegaSelector from './MarketMegaSelector';

export default {
  components: {
    MarketMegaSelector,
  },

  computed: {
    storeStateCurrentMarket() {
      return this.$store.state.currentMarket;
    },
    baseCurrencyUnitPrice() {
      return this.storeStateCurrentMarket && this.$store.state.holdings.length ?
        this.$services.neo.getHolding(this.storeStateCurrentMarket.baseAssetId).unitValue : 0;
    },
    percentChangeAbsolute() {
      return this.$store.state.tradeHistory ?
        Math.abs(this.$store.state.tradeHistory.change24HourPercent) : 0;
    },
  },

  methods: {
    toggleNightMode() {
      this.$services.settings.setStyleMode(this.$store.state.styleMode === 'Night' ? 'Day' : 'Night');
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
        flex: 3;
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

      > *:nth-child(n + 2) {
        margin-top: $space;
      }

      .market-name {
        font-family: GilroySemibold;
        margin-top: $space;
      }

      .label {
        @extend %small-uppercase-grey-label-dark;
      }

      .base-price {
        font-family: GilroySemibold;
        font-size: toRem(16px);
      }

      .base-price-converted {
        font-family: GilroySemibold;
        font-size: toRem(12px);
      }

      .change {
        font-size: toRem(12px);

        &.increase {
          color: $green;

          &:before {
            content: "+";
          }
        }

        &.decrease {
          color: $red;
        }
      }
    }
  }
}
</style>

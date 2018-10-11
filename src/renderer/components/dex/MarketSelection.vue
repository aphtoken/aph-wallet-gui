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
    <div class="header">
        <h1 class="underlined">{{ $t('marketPairs') }}</h1>
    </div>
    <div class="selection">
      <market-mega-selector></market-mega-selector>
    </div>
    <aph-spinner-wrapper size="small" identifier="fetchTradeHistory">
      <div class="market">
        <div class="day-values">
          <div class="row">
            <div class="label">{{$t('vol')}}</div>
            <div class="value">{{ tickerData.quoteVolume }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('OPEN')}}</div>
            <div class="value">{{ $formatTokenAmount(tickerData.open24hr) }}</div>
          </div>
          <div class="row"> 
            <div class="label">{{$t('HIGH')}}</div>
            <div class="value">{{ $formatTokenAmount(tickerData.high24hr) }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('LOW')}}</div>
            <div class="value">{{ $formatTokenAmount(tickerData.low24hr) }}</div>
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
          <div :class="['change', {decrease: change24Hour < 0, increase: change24Hour > 0 }]">
            {{ $formatNumber(change24Hour) }}
            ({{ $formatNumber(percentChangeAbsolute) }}%)
          </div>
        </div>
      </div>
    </aph-spinner-wrapper>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
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
      return Math.round(((this.change24Hour)
        / this.tickerData.open24hr) * 10000) / 100;
    },
    change24Hour() {
      return this.$store.state.tradeHistory ?
        (this.$store.state.tradeHistory.close24Hour - this.tickerData.open24hr) : 0;
    },
    ...mapGetters([
      'tickerData',
    ]),
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
  .header {
    @extend %tile-light;
    
    flex: none;
    padding: $space $space 0;

    h1.underlined {
      @extend %underlined-header-sm;

      margin-bottom: 0;
    }
  }

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

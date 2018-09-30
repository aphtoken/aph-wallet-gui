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
            <div class="value">{{ $formatNumber(volume24Hour) }}</div>
          </div>
           <div class="row">
            <div class="label">{{$t('OPEN')}}</div>
            <div class="value">{{ $formatTokenAmount(open24Hour) }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('HIGH')}}</div>
            <div class="value">{{ $formatTokenAmount(high24Hour) }}</div>
          </div>
          <div class="row">
            <div class="label">{{$t('LOW')}}</div>
            <div class="value">{{ $formatTokenAmount(low24Hour) }}</div>
          </div>
        </div>
        <div class="token-details">
          <aph-token-icon v-if="$store.state.currentMarket && $store.state.currentMarket.quoteCurrency" :symbol="$store.state.currentMarket.quoteCurrency"></aph-token-icon>
          <div class="base-price">
            {{ $formatTokenAmount(close24Hour) }}
          </div>
          <div class="base-price-converted">
            {{ $formatMoney(close24Hour * baseCurrencyUnitPrice) }}
          </div>
          <span class="label">{{ $t('change24H') }} ({{ $store.state.currentMarket ? $store.state.currentMarket.quoteCurrency : '' }})</span>
          <div :class="['change', { decrease: change24Hour < 0 , increase: change24Hour > 0 }]">
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

    close24Hour() {
      return this.todayTrades.length > 0 ?
        this.todayTrades[0].price : 0;
    },

    open24Hour() {
      return this.todayTrades.length > 0 ?
        this.todayTrades[this.todayTrades.length - 1].price : 0;
    },

    low24Hour() {
      return this.todayTrades.length > 0 ?
        _.minBy(this.todayTrades, trade => Number(trade.price)).price : 0;
    },

    high24Hour() {
      return this.todayTrades.length > 0 ?
        _.maxBy(this.todayTrades, trade => Number(trade.price)).price : 0;
    },

    volume24Hour() {
      return this.todayTrades.length > 0 ?
        _.sumBy(this.todayTrades, trade => Number(trade.quantity)) : 0;
    },

    change24HourPercent() {
      return this.todayTrades.length > 0 ?
        Math.round(
          ((this.close24Hour - this.open24Hour) / this.open24Hour) * 10000) / 100 : 0;
    },

    change24Hour() {
      return this.close24Hour - this.open24Hour;
    },

    percentChangeAbsolute() {
      return Math.abs(this.change24HourPercent);
    },

    todayTrades() {
      return this.trades().length > 0 ? _.filter(this.trades(),
        trade => trade.tradeTime >= moment().startOf('day').unix(),
      ) : [];
    },

    ...mapGetters([
      'tradeHistory',
    ]),
  },

  methods: {
    toggleNightMode() {
      this.$services.settings.setStyleMode(this.$store.state.styleMode === 'Night' ? 'Day' : 'Night');
    },
    trades() {
      return this.tradeHistory && this.tradeHistory.trades
        && this.tradeHistory.trades.length ? this.tradeHistory.trades : [];
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

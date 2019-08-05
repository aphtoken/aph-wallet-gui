<template>
  <section id="dex--trade-history">
    <aph-spinner-wrapper identifier="fetchTradeHistory">
      <div class="header">
        <h1 class="underlined">{{$t('tradeHistory')}}</h1>
      </div>
      <div class="body">
        <div class="trade-history-table">
          <div class="header">
            <div class="cell">{{$t('PRICE')}} ({{ $store.state.currentMarket ? $store.state.currentMarket.baseCurrency : '' }})</div>
            <div class="cell">{{$t('VOLUME')}}</div>
            <div class="cell">{{$t('TIME')}}</div>
          </div>
          <div class="body">
            <div class="row" v-for="(trade, index) in trades" :key="index">
              <div :class="['cell', 'price', {green: trade.side === 'Buy', red: trade.side === 'Sell'}]">{{ getPrice(trade) }}</div>
              <div class="cell quantity">{{ getQuantity(trade) }}</div>
              <div class="cell time">{{ $formatTime(trade.tradeTime) }}</div>
            </div>
          </div>
        </div>
      </div>
    </aph-spinner-wrapper>
  </section>
</template>

<script>
let storeUnwatch;
export default {

  beforeDestroy() {
    storeUnwatch();
  },

  computed: {
    trades() {
      return this.$store.state.tradeHistory && this.$store.state.tradeHistory.trades
        && this.$store.state.tradeHistory.trades.length ? this.$store.state.tradeHistory.trades : [];
    },
  },

  mounted() {
    this.loadTrades();

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.currentMarket;
      }, () => {
        this.loadTrades();
      });
  },

  methods: {
    getAllowedQuantityDecimals() {
      const currentMarket = this.$store.state.currentMarket;
      const minTickSizeFraction = currentMarket.minimumTickSize
        - Math.floor(currentMarket.minimumTickSize);
      if (minTickSizeFraction <= 0.00000001) {
        return 0;
      }
      return Math.log10(minTickSizeFraction * (10 ** 8));
    },

    addDecimalsToNumString(numString, allowedDecimals) {
      let result = numString;
      // count decimals
      const lastDotIndex = numString.lastIndexOf('.');
      if (lastDotIndex === -1) {
        result += '.';
        result += '0'.repeat(allowedDecimals);
      } else {
        const hasDecimals = (result.length - lastDotIndex) - 1;
        const neededDecimals = allowedDecimals - hasDecimals;
        if (neededDecimals >= 0) {
          result += '0'.repeat(neededDecimals);
        }
      }
      return result;
    },
    getPrice(trade) {
      const priceNum = this.$formatNumber(trade.price);
      const allowedPriceDecimals = 8 - this.getAllowedQuantityDecimals();

      return this.addDecimalsToNumString(priceNum, allowedPriceDecimals);
    },
    getQuantity(trade) {
      return this.addDecimalsToNumString(this.$formatNumber(trade.quantity), this.getAllowedQuantityDecimals());
    },
    loadTrades() {
      if (!this.$store.state.currentMarket) {
        return;
      }

      this.$store.dispatch('fetchTradeHistory', {
        marketName: this.$store.state.currentMarket.marketName,
      });
    },
  },
};
</script>

<style lang="scss">
#dex--trade-history {
  @extend %tile-light;

  display: flex;
  flex-direction: column;

  .header {
    flex: none;
    padding: $space $space 0;

    h1.underlined {
      @extend %underlined-header-sm;

      margin-bottom: 0;
    }
  }

  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: $space;

    .trade-history-table {
      @extend %dex-table-flex;

      flex: 1;

      .header {
        text-align: center;
        white-space: nowrap;
        .cell.time {
          text-align: right;
        }
      }

      .body {
        .cell {
          font-family: FreeMono !important;
          font-size: toRem(14px) !important;
          font-weight: bold;
          letter-spacing: 0px;

          &.price {
            text-align: right;
            margin-right: toRem(10px);
          }
          &.quantity {
            text-align: right;
            margin-right: toRem(10px);
          }
          &.time {
            text-align: right;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
</style>



<template>
  <section id="dex--trade-history">
    <div class="header">
      <h1 class="underlined">{{$t('tradeHistory')}}</h1>
    </div>
    <div class="body">
      <div class="trade-history-table">
        <div class="header">
          <div class="cell">{{$t('PRICE')}} ({{ $store.state.currentMarket ? $store.state.currentMarket.baseCurrency : '' }})</div>
          <div class="cell">{{$t('VOLUME')}}</div>
          <div class="cell time">{{$t('TIME')}}</div>
        </div>
        <div class="body">
          <div class="row" v-for="(trade, index) in trades" :key="index">
            <div :class="['cell', {green: trade.side === 'Buy', red: trade.side === 'Sell'}]">{{ $formatNumber(trade.price) }}</div>
            <div class="cell">{{ $formatNumber(trade.quantity) }}</div>
            <div class="cell time">{{ $formatDateShort(trade.tradeTime) }} {{ $formatTime(trade.tradeTime) }}</div>
          </div>
        </div>
      </div>
    </div>
    <aph-spinner identifier="fetchTradeHistory"></aph-spinner>
  </section>
</template>

<script>
let loadTradesIntervalId;
let storeUnwatch;
export default {

  beforeDestroy() {
    clearInterval(loadTradesIntervalId);
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
    loadTradesIntervalId = setInterval(() => {
      this.loadTradesSilently();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.currentMarket;
      }, () => {
        this.loadTrades();
      });
  },

  methods: {
    loadTrades() {
      if (!this.$store.state.currentMarket) {
        return;
      }

      this.$store.dispatch('fetchTradeHistory', {
        marketName: this.$store.state.currentMarket.marketName,
      });
    },
    loadTradesSilently() {
      if (!this.$store.state.currentMarket) {
        return;
      }

      this.$store.dispatch('fetchTradeHistory', {
        marketName: this.$store.state.currentMarket.marketName,
        isRequestSilent: true,
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

      .cell {
        &.time {
          text-align: right;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>



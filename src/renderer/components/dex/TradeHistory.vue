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
            <div class="cell text-right">{{$t('size')}}</div>
            <div class="cell text-right time">{{$t('TIME')}}</div>
          </div>
          <div class="body">
            <div class="row" v-for="(trade, index) in trades" :key="index">
              <div :class="['cell', {green: trade.side === 'Buy', red: trade.side === 'Sell'}]">{{ $formatNumber(trade.price) }}</div>
              <div class="cell text-right">{{ $formatNumber(trade.quantity) }}</div>
              <div class="cell text-right time">{{ $formatDateShort(trade.tradeTime) }} {{ $formatTime(trade.tradeTime) }}</div>
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

    .trade-history-table {
      @extend %dex-table-flex;

      flex: 1;

      > .header {
        padding: $space $space $space-sm;
      }

      > .body {
        max-height: toRem(268px);;
        padding: 0 $space $space;
      }

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

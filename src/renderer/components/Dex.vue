<template>
  <section id="dex">
    <div class="grid" v-if="connected">
      <div class="grid--column column-left">
        <div class="grid--cell top-left">
          <router-view name="top-left"></router-view>
        </div>
        <div class="grid--cell bottom-left">
          <router-view name="bottom-left"></router-view>
        </div>
      </div>
      <div class="grid--column column-middle">
        <div class="grid--cell top-middle">
          <router-view name="top-middle"></router-view>
        </div>
        <div class="grid--cell bottom-middle">
          <router-view name="bottom-middle"></router-view>
        </div>
      </div>
      <div class="grid--column column-right">
        <div class="grid--cell top-right">
          <router-view name="top-right"></router-view>
        </div>
        <div class="grid--cell bottom-right">
          <router-view name="bottom-right"></router-view>
        </div>
      </div>
    </div>
    <div v-else class="zero-state">
      <aph-icon name="no-transactions"></aph-icon>
      <div class="label">{{$t('unableToReachTradingServer')}}</div>
    </div>
    <dex-demo-confirmation v-if="!$store.state.acceptDexDemoVersion && !isOutOfDate"></dex-demo-confirmation>
    <dex-out-of-date v-if="isOutOfDate && !this.$store.state.acceptDexOutOfDate"></dex-out-of-date>
  </section>
</template>

<script>
import DexDemoConfirmation from './modals/DexDemoConfirmation';
import DexOutOfDate from './modals/DexOutOfDate';

export default {
  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
    clearInterval(this.connectionStatusInterval);
    clearInterval(this.marketsRefreshInterval);
  },

  mounted() {
    this.$store.state.showPortfolioHeader = false;
    this.loadMarkets();

    this.$services.dex.completeSystemAssetWithdrawals();

    this.$store.commit('setSocketOrderCreated', (message) => {
      /* eslint-disable max-len */
      this.$services.alerts.success(`${(message.side === 'bid' ? 'Buy' : 'Sell')} Order Created. x${message.data.quantity} @${message.data.price}`);
      this.$store.dispatch('fetchHoldings', { done: null });
    });

    this.$store.commit('setSocketOrderMatched', (message) => {
      /* eslint-disable max-len */
      this.$services.alerts.success(`${(message.side === 'bid' ? 'Buy' : 'Sell')} Order Filled. x${message.data.quantity} @${message.data.price}`);
      this.$store.dispatch('fetchHoldings', { done: null });
    });

    this.$store.commit('setSocketOrderCreationFailed', (message) => {
      this.$services.alerts.error(`Failed to Create ${(message.side === 'bid' ? 'Buy' : 'Sell')} Order. ${message.data.errorMessage}`);
    });

    this.$store.commit('setSocketOrderMatchFailed', (message) => {
      this.$services.alerts.error(`Failed to Match ${(message.side === 'bid' ? 'Buy' : 'Sell')} x${message.data.quantity}. ${message.data.errorMessage}`);
    });
  },

  components: {
    DexDemoConfirmation,
    DexOutOfDate,
  },

  created() {
    this.setConnected();
    this.connectionStatusInterval = setInterval(() => {
      this.setConnected();
    }, 1000);
    this.marketsRefreshInterval = setInterval(() => {
      this.loadMarkets();
    }, this.$constants.intervals.MARKETS_POLLING);
  },

  data() {
    return {
      connected: false,
    };
  },

  computed: {
    isOutOfDate() {
      return this.$store.state.latestVersion && this.$store.state.latestVersion.testExchangeScriptHash
        && this.$store.state.latestVersion.testExchangeScriptHash.replace('0x', '')
          !== this.$services.assets.DEX_SCRIPT_HASH;
    },
  },

  methods: {
    setConnected() {
      if (!this.$store.state.socket || this.$store.state.socket.isConnected !== true) {
        if (moment().utc().diff(this.$store.state.socket.connectionClosed, 'milliseconds')
          > this.$constants.timeouts.WEBSOCKET_CONNECTION) {
          this.connected = false;
          return;
        }
      }

      if (this.$store.state.currentMarket) {
        if (!this.$store.state.socket.subscribedMarket
          || this.$store.state.socket.subscribedMarket !== this.$store.state.currentMarket.marketName) {
          this.$store.dispatch('subscribeToMarket', {
            market: this.$store.state.currentMarket,
          });
        }
      }

      this.connected = true;
    },
    loadMarkets() {
      this.$store.dispatch('fetchMarkets', {
        done: () => {
          if (!this.$store.state.currentMarket) {
            this.$store.commit('setCurrentMarket', this.$store.state.markets[0]);
          }
        },
      });
    },
  },
};
</script>

<style lang="scss">
#dex {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding-top: toRem(30px);
  width: 100%;
  overflow: auto;

  .grid {
    display: flex;
    flex-direction: row;
    flex: 0 0 auto;
    padding: $space;
    width: 100%;
  }

  .grid--column {
    display: flex;
    flex-direction: column;

    &.column-left {
      flex: 0 0 auto;
    }

    &.column-middle {
      flex: 3;
    }

    &.column-right {
      flex: 0 0 auto;
      min-width: 300px;
    }

    .grid--cell {
      flex-direction: row;
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;

      // > * {
      //   flex: 1;
      // }

      // &.top-right {
      //   flex: 2;
      // }
      //
      // &.bottom-right {
      //   flex: 1;
      // }

      &.top-left {
        flex: none;
      }

      &.bottom-left {
        flex: 1;
      }

      &.bottom-middle {
        flex: 1;
      }

      &.top-middle {
        flex: none;
      }

      & + .grid--cell {
        margin-top: $space;
      }
    }

    & + .grid--column {
      margin-left: $space;
    }
  }

  > .zero-state {
      @extend %tile-light;

      align-items: center;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: center;
      width: 100%;

      .aph-icon {
        svg {
          height: toRem(52px);

          .fill {
            fill: $purple;
          }
        }
      }

      .label {
        color: $purple;
        font-weight: GilroyMedium;
        margin-top: $space-lg;
      }
    }

}
</style>
